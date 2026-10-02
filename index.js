const express = require("express");
const { paymentMiddleware } = require("@x402/express");
const { x402ResourceServer, HTTPFacilitatorClient } = require("@x402/core/server");
const { ExactEvmScheme } = require("@x402/evm/exact/server");
const { declareDiscoveryExtension } = require("@x402/extensions/bazaar");
const { privateKeyToAccount } = require("viem/accounts");

const PAY_TO = process.env.X402_PAY_TO;
if (!PAY_TO) { console.error("FATAL: X402_PAY_TO required"); process.exit(1); }

// Router's own wallet for paying downstream services.
// Signer selection (opt-in): PRIVY_APP_ID/PRIVY_APP_SECRET/PRIVY_WALLET_ID takes
// precedence — the Privy server wallet signs USDC EIP-712 authorizations with no raw
// key in app env (policy-scoped; same pattern as escrow-x402 679bb12e). Absent those
// vars, ROUTER_KEY (raw key) is required exactly as before.
let PRIVY_ADAPTER = null;
try {
  const { PrivyAdapter } = require("@opensea/wallet-adapters");
  PRIVY_ADAPTER = PrivyAdapter.fromEnv();
  console.log("→ Privy adapter configured (PRIVY_* env vars present)");
} catch (e) {
  PRIVY_ADAPTER = null; // env vars absent → raw-key path (expected pre-Privy state)
}
const ROUTER_KEY = process.env.ROUTER_KEY;
if (!ROUTER_KEY && !PRIVY_ADAPTER) { console.error("FATAL: ROUTER_KEY required (or set PRIVY_* env vars)"); process.exit(1); }

const CDP_ID = process.env.CDP_API_KEY_ID;
const CDP_SEC = process.env.CDP_API_KEY_SECRET;
const HAS_CDP = Boolean(CDP_ID && CDP_SEC);
const NETWORK = HAS_CDP ? "eip155:8453" : "eip155:84532";

const facilitatorClient = HAS_CDP
  ? new HTTPFacilitatorClient(require("@coinbase/x402").facilitator)
  : new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" });

const x402Server = new x402ResourceServer(facilitatorClient);
x402Server.register(NETWORK, new ExactEvmScheme());

// ---------------------------------------------------------------------------
// BUYER-FACING facilitator advertisement (fleet-conforming pattern, 12/13 walls).
// x402 v2 spec-following buyers look in accepts[0].extra.facilitator (first),
// accepts[0].facilitator, then the doc root; strict v2 buyers REFUSE to settle
// a challenge with no facilitator (2026-09-12 AgentPay report; live decode
// 2026-09-15; REVENUE-SYNTHESIS 2026-10-01 found the router advertising none).
// x402.org/facilitator is NOT usable: its /supported lists no eip155:8453
// exact kind (probed 2026-09-15). AgentPay names Base-mainnet exact (v1+v2).
// This is buyer-facing metadata ONLY — server-side verify/settle still uses
// the facilitatorClient configured above. resource.serviceName is the
// companion field the proven power-pack wall ships in the same pattern.
const CHALLENGE_FACILITATOR_URL = "https://x402-agent-pay.com/facilitator";
const SERVICE_NAME = "rae-fleet-router";

(async () => {
  for (let i = 1; i <= 12; i++) {
    try { await x402Server.initialize(); console.log(`x402 ready (${i})`); return; }
    catch (e) { await new Promise(r => setTimeout(r, Math.min(1500*i, 10000))); }
  }
  console.warn("x402 init failed; lazy init on first paid request");
})();

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Signer abstraction: raw-key viem account, or Privy adapter (EIP-712 via signTypedData).
// getSignerAddress() resolves the wallet once; signTypedDataAuth() signs the EIP-3009
// TransferWithAuthorization either way. Privy takes precedence when configured.
let routerAccount = null;
if (ROUTER_KEY) {
  routerAccount = privateKeyToAccount(ROUTER_KEY.startsWith("0x") ? ROUTER_KEY : "0x" + ROUTER_KEY);
}
let privyAddress = null;
async function getSignerAddress() {
  if (PRIVY_ADAPTER) {
    if (!privyAddress) privyAddress = await PRIVY_ADAPTER.getAddress();
    return privyAddress;
  }
  if (routerAccount) return routerAccount.address;
  throw new Error("No signer configured");
}
async function signTypedDataAuth({ domain, types, primaryType, message }) {
  if (PRIVY_ADAPTER) return PRIVY_ADAPTER.signTypedData({ domain, types, primaryType, message });
  if (routerAccount) return routerAccount.signTypedData({ domain, types, primaryType, message });
  throw new Error("No signer configured");
}

// Downstream services (the fleet we're composing).
// NOTE(STRAT-26, live crawl 2026-09-21): tradingagents' /api/consensus does not exist —
// its /.well-known/x402.json exposes /api/analyze-ticker and /api/analyze-arbitrage at
// $0.05 (not $0.10 as previously coded). The old URL 404s, so the third leg of
// POST /api/fleet-bundle was silently unbilled. `price` is display-only: callFleetService
// always pays the live 402 challenge amount.
const FLEET = {
  "nft-alpha-x402": { url: "https://nft-alpha-x402.fly.dev/api/nft-signal", price: 20000 },
  "power-pack-x402": { url: "https://power-pack-x402.fly.dev/api/score-email", price: 10000 },
  "tradingagents-x402": { url: "https://tradingagents-x402.fly.dev/api/analyze-ticker", price: 50000 },
  "opensea-data-x402": { url: "https://opensea-data-x402.fly.dev/api", price: 10000 },
  "suprapack-x402": { url: "https://suprapack-x402.fly.dev/api/find-skill", price: 30000 },
  "nanobanana-x402": { url: "https://nanobanana-x402.fly.dev/api/generate-image", price: 10000 },
};

async function callFleetService(name, payload) {
  const svc = FLEET[name];
  if (!svc) return { error: `unknown service: ${name}` };
  try {
    // 1) unpaid probe
    const res = await fetch(svc.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status !== 402) {
      const body = await res.text();
      return { status: res.status, body: body.slice(0, 500) };
    }
    const prHeader = res.headers.get("PAYMENT-REQUIRED");
    const req = JSON.parse(Buffer.from(prHeader, "base64").toString("utf8"));
    const acc = req.accepts[0];

    // 2) sign EIP-3009 authorization (signer: Privy adapter if configured, else raw key).
    //    uint256 fields are carried as decimal strings: identical EIP-712 encoding,
    //    JSON-safe for the Privy adapter (BigInt would break JSON.stringify), and
    //    accepted by viem's signTypedData on the raw-key path.
    const { keccak256, concat, toHex, pad } = await import("viem");
    const from = await getSignerAddress();
    const validBefore = BigInt(Math.floor(Date.now()/1000) + 600);
    const nonce = keccak256(concat([toHex(Date.now()), pad(from)]));
    const auth = { from, to: acc.payTo, value: String(acc.amount), validAfter: "0", validBefore: validBefore.toString(), nonce };
    const domain = { name: "USD Coin", version: "2", chainId: 8453, verifyingContract: USDC };
    const types = { TransferWithAuthorization: [
      { name: "from", type: "address" }, { name: "to", type: "address" }, { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" }, { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" },
    ]};
    const sig = await signTypedDataAuth({ domain, types, primaryType: "TransferWithAuthorization", message: auth });
    const paymentPayload = {
      x402Version: 2,
      resource: req.resource,
      accepted: acc,
      payload: { authorization: { ...auth, validAfter: "0", validBefore: validBefore.toString(), value: auth.value.toString() }, signature: sig },
    };
    const hdr = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    // 3) paid call
    const res2 = await fetch(svc.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "PAYMENT-SIGNATURE": hdr },
      body: JSON.stringify(payload),
    });
    const body2 = await res2.text();
    return { status: res2.status, body: body2.slice(0, 1000) };
  } catch (e) {
    return { error: e.message };
  }
}

const app = express();
// EXEC-52: behind Fly's reverse proxy Express reports req.protocol === "http"
// unless the proxy hop is trusted, and @x402/express derives the advertised
// x402 resource URL from the request origin. Cleartext scheme made CDP Bazaar
// reject every challenge: "resource must start with 'https://' when protocol
// type is http" — i.e. the money surface could never be indexed. Trusting the
// first (Fly) hop makes req.protocol === "https" in production.
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "rae-fleet-router", network: NETWORK, payTo: PAY_TO }));

const BUNDLE_INPUT_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string", minLength: 1, description: "Topic/keyword to research (e.g., 'Azuki', 'consumer debt')" },
    email_subject: { type: "string", minLength: 3, description: "Optional: subject line for outreach scoring" },
    email_body: { type: "string", minLength: 20, description: "Optional: email body for outreach scoring" },
  },
  required: ["topic"],
};

const BUNDLE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    bundle: { type: "object" },
    meta: { type: "object" },
  },
  required: ["ok"],
};

const bundleRoute = {
  accepts: { scheme: "exact", price: "$0.10", network: NETWORK, payTo: PAY_TO, extra: { facilitator: CHALLENGE_FACILITATOR_URL } },
  serviceName: SERVICE_NAME,
  description: "Compose multiple RAE fleet services into one paid bundle. Given a topic, calls nft-alpha (NFT market signals), power-pack (outreach email scoring), and tradingagents (market consensus) via x402, assembles results. Demonstrates agent-to-agent economy.",
  mimeType: "application/json",
  requestSchema: BUNDLE_INPUT_SCHEMA,
  responseSchema: BUNDLE_OUTPUT_SCHEMA,
  extensions: {
    ...declareDiscoveryExtension({
      method: "POST",
      bodyType: "json",
      input: { topic: "Azuki", email_subject: "Quick question", email_body: "Hi, I hope this finds you well. I wanted to reach out about our product." },
      inputSchema: BUNDLE_INPUT_SCHEMA,
      output: {
        example: { ok: true, bundle: { nft_signals: "...", email_score: "...", market_consensus: "..." }, meta: { services_called: 3 } },
        schema: BUNDLE_OUTPUT_SCHEMA,
      },
    }),
  },
};

// ---------------------------------------------------------------------------
// STRAT-26 bundle ladder — curated bundles each priced STRICTLY BELOW the sum
// of their live per-call parts (verified against /pricing.md +
// /.well-known/x402.json on 2026-09-21T12:15Z). Single source of truth: the
// /pricing.md, /llms.txt copy and the registered x402 routes are all generated
// from this table, so no advertised bundle can ever exist without a route.
// ---------------------------------------------------------------------------
const BUNDLE_LADDER = [
  {
    id: "market-starter", price: "$0.02",
    title: "Market Starter",
    desc: "OpenSea raw collection data (floor/listings/offers/traits) + real-time NFT market signals for one collection.",
    parts: [["opensea-data-x402", 0.01], ["nft-alpha-x402", 0.02]],
  },
  {
    id: "market-intel-trio", price: "$0.05",
    title: "Market Intel Trio",
    desc: "The flagship starter trio: opensea-data + nft-alpha + suprapack (matched Claude Code skills) in one call.",
    parts: [["opensea-data-x402", 0.01], ["nft-alpha-x402", 0.02], ["suprapack-x402", 0.03]],
  },
  {
    id: "full-fleet-sampler", price: "$0.06",
    title: "Full Fleet Sampler",
    desc: "One call to each of the five sub-$0.03 fleet services: data, signals, skills, image generation, outreach scoring.",
    parts: [["opensea-data-x402", 0.01], ["nft-alpha-x402", 0.02], ["suprapack-x402", 0.03], ["nanobanana-x402", 0.01], ["power-pack-x402", 0.01]],
  },
];

function bundleSumOfParts(b) {
  return b.parts.reduce((s, [, p]) => s + p, 0);
}

function bundlePayloadFor(name, body) {
  const topic = String(body.topic || "");
  const collection = (topic || "boredapeyachtclub").toLowerCase().replace(/\s+/g, "-");
  switch (name) {
    case "opensea-data-x402": return { collection, action: body.action || "floor" };
    case "nft-alpha-x402": return { collection };
    case "suprapack-x402": return { query: body.query || topic };
    case "nanobanana-x402": return { prompt: body.prompt || `Illustration for topic: ${topic}` };
    case "power-pack-x402": return { subject: body.email_subject || "Quick question", body: body.email_body || "Hi, I wanted to reach out about our product." };
    default: return { topic };
  }
}

function makeBundleHandler(b) {
  return async (req, res) => {
    const body = req.body || {};
    if (!body.topic || typeof body.topic !== "string") {
      return res.status(400).json({ ok: false, error: "topic (string) required" });
    }
    const bundle = {};
    for (const [name] of b.parts) {
      bundle[name.replace("-x402", "")] = await callFleetService(name, bundlePayloadFor(name, body));
    }
    res.json({ ok: true, bundle_id: b.id, bundle, meta: { topic: body.topic, services_called: b.parts.length, timestamp: new Date().toISOString() } });
  };
}

function pricingMarkdown() {
  const rows = BUNDLE_LADDER.map(b => {
    const sum = bundleSumOfParts(b);
    const parts = b.parts.map(([n, p]) => `${n.replace("-x402", "")} $${p.toFixed(2)}`).join(" + ");
    return `| POST /api/bundle/${b.id} | ${parts} | $${sum.toFixed(2)} | ${b.price} | ${b.desc} |`;
  }).join("\n");
  return [
    "# Pricing — RAE Fleet Router",
    "",
    "All prices USDC on Base (eip155:8453), pay-per-call via x402, no API key. Every x402 paid",
    "request first receives HTTP 402 with a `PAYMENT-REQUIRED` challenge; sign a USDC",
    "transferWithAuthorization and re-send with the `PAYMENT-SIGNATURE` header.",
    "",
    "## Flagship",
    "",
    "- **`POST /api/fleet-bundle`** — $0.10 USDC — compose nft-alpha + power-pack + tradingagents",
    "  into one research call.",
    "",
    "## Bundle ladder (each bundle priced below the sum of its parts)",
    "",
    "| Endpoint | Parts (live per-call price) | Sum of parts | Bundle price | What you get |",
    "|---|---|---|---|---|",
    rows,
    "",
    "Payment parameters — all routes: scheme `exact`, network `eip155:8453` (Base mainnet),",
    "USDC `" + MAINNET_USDC + "` (6 decimals), payTo `" + CANONICAL_PAY_TO + "`.",
    "",
    "Machine contract: [/openapi.json](https://rae-fleet-router.fly.dev/openapi.json) and",
    "[/.well-known/x402.json](https://rae-fleet-router.fly.dev/.well-known/x402.json). The live",
    "x402 payment challenge is authoritative if a configured price changes.",
    "",
    "Try before you pay: **GET [/sample](https://rae-fleet-router.fly.dev/sample)** — free,",
    "shape-accurate synthetic bundle-compose demo (no payment, never a 402 challenge).",
    "",
    "Payment failed? **GET [/pay-failed](https://rae-fleet-router.fly.dev/pay-failed)** —",
    "\"fix in 30 seconds\" recovery recipes for the 4 real failure modes (machine-readable",
    "at /pay-failed?format=json).",
    "",
    "Competitive context? **GET [/benchmarks](https://rae-fleet-router.fly.dev/benchmarks)** —",
    "fleet live-402 price survey vs Coinbase CDP facilitator rates and the x402 Bazaar",
    "census percentiles (markdown at /benchmarks?format=md).",
    "",
    "Hosted pay links: **GET [/buy](https://rae-fleet-router.fly.dev/buy)** — one shareable",
    "pay-link page per fleet service with embedded x402 v2 PaymentRequirements mirrored",
    "from the wall's own live challenge (machine variant /buy?format=json).",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// PLAN-32 — GET /pay-failed: "Your x402 payment failed — fix in 30 seconds".
// Markdown-first recovery surface for the fleet's 4 real observed failure
// modes (wrong network — tradingagents eip155:84532 manifest incident;
// payTo drift to 0xfbc0eb78 — 9/13 routes audit; insufficient/expired USDC
// approval/balance; price drift vs stale /pricing.md). Every mode carries a
// machine-readable retry recipe; ?format=json (or Accept: application/json)
// serves the whole set as JSON. Failed payments are lost revenue the buyer
// agent can repair with ONE retry — this page is the repair manual.
// ---------------------------------------------------------------------------
const CANONICAL_PAY_TO = "0x7861db4efc14a1ed5dd8c96c528a3796560f1393";
const MAINNET_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const FACILITATOR_URL = "https://api.cdp.coinbase.com/platform/v2/x402";
const EXAMPLE_RESOURCE = "https://rae-fleet-router.fly.dev/api/bundle/market-starter";

function payFailedModes() {
  return [
    {
      id: "wrong-network",
      title: "Mode 1 — Wrong network (eip155:8453 vs eip155:84532)",
      symptom: "Payment verifies as failed or the facilitator rejects the authorization: it was signed against Base Sepolia (84532), Ethereum mainnet (1), or the wrong chainId in the EIP-712 domain.",
      cause: "The EIP-712 domain of transferWithAuthorization binds chainId. A signature made for any chain other than the challenge's `accepted.network` can never verify on Base mainnet. (Real incident: staci-tradingagents manifest was stuck advertising eip155:84532 while payments only settle on eip155:8453.)",
      fix: [
        "Decode the live 402 response's PAYMENT-REQUIRED header (base64 JSON) and read accepts[0].network — it is authoritative.",
        "Re-sign the EIP-3009 TransferWithAuthorization with domain { name: \"USD Coin\", version: \"2\", chainId: 8453, verifyingContract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 }.",
        "Send the retry from a signer/wallet funded on Base mainnet, not a testnet client.",
      ],
      retry_recipe: { resource: EXAMPLE_RESOURCE, method: "POST", network: "eip155:8453", usdc: MAINNET_USDC, payTo: CANONICAL_PAY_TO, facilitator: FACILITATOR_URL, eip712_domain: { name: "USD Coin", version: "2", chainId: 8453, verifyingContract: MAINNET_USDC } },
    },
    {
      id: "payto-drift",
      title: "Mode 2 — payTo drift (stale or cached recipient address)",
      symptom: "Payment settles on-chain but the resource server refuses to verify it — funds moved to an address the service does not own, e.g. the router's own wallet 0xfbc0eb7811d477e55261d956df39f0046e192240 seen in the 9/13 routes audit, or any address remembered from an older response.",
      cause: "The challenge's payTo is the ONLY recipient that verifies. Cached manifests, copied curl examples, or a previous vendor's config silently rot when a service rotates its treasury.",
      fix: [
        "Never reuse a payTo from cache or docs — copy accepts[0].payTo from THIS session's live 402 challenge.",
        "Compare it (case-insensitive full-address match) against /.well-known/x402.json before signing.",
        "For fleet services the canonical treasury payTo is " + CANONICAL_PAY_TO + " — if a live challenge shows anything else, STOP and re-check the service; drift itself is the alarm.",
      ],
      retry_recipe: { resource: EXAMPLE_RESOURCE, method: "POST", network: "eip155:8453", usdc: MAINNET_USDC, payTo: CANONICAL_PAY_TO, payTo_source_of_truth: "https://rae-fleet-router.fly.dev/.well-known/x402.json", facilitator: FACILITATOR_URL },
    },
    {
      id: "insufficient-approval",
      title: "Mode 3 — Insufficient balance or expired USDC approval",
      symptom: "Facilitator verification fails with transfer errors (insufficient balance / allowance, or the atomic USDC transfer reverts on submission).",
      cause: "USDC on Base is a fee-on-transfer-free ERC-20 but still requires: (a) enough balanceOf(payer), and (b) for approve+transferFrom paths, a live, un-expired allowance to the spender. The EIP-3009 transferWithAuthorization path used by x402 exact scheme needs NO prior approval — if you are on an approval-based integration, a stale/zero allowance is the usual killer.",
      fix: [
        "eth_call USDC.balanceOf(payer) on eip155:8453 (contract " + MAINNET_USDC + ", 6 decimals) against accepts[0].amount before paying.",
        "Prefer the EIP-3009 transferWithAuthorization path (no approval, expires by validBefore; default maxTimeout 300s from the challenge).",
        "If your stack uses approve(): re-approve the exact spender from the live challenge, then retry unpaid to get a fresh challenge first.",
      ],
      retry_recipe: { resource: EXAMPLE_RESOURCE, method: "POST", network: "eip155:8453", usdc: MAINNET_USDC, payTo: CANONICAL_PAY_TO, facilitator: FACILITATOR_URL, preflight: "eth_call balanceOf(payer) >= accepted.amount; prefer EIP-3009 (no allowance needed)" },
    },
    {
      id: "price-drift",
      title: "Mode 4 — Paid a stale price (cached /pricing.md vs live challenge)",
      symptom: "Authorization amount matches your docs but not the challenge: verification fails on amount mismatch, or you underpay/overpay a re-priced endpoint.",
      cause: "Advertised copy (/pricing.md, llms.txt, your notes) can lag a re-deploy. The live 402 challenge is always authoritative; prices on this router move with bundle-ladder updates (see STRAT-26 history).",
      fix: [
        "On ANY 402, re-decode PAYMENT-REQUIRED and sign accepts[0].amount EXACTLY (atomic USDC, 6 decimals — $0.02 = 20000).",
        "Do not persist amounts across sessions; do not infer price from GET /pricing.md for a POST you are about to pay.",
        "If the response is 4xx AFTER a paid attempt, the challenge you honored was stale — re-probe unpaid, re-sign, retry once.",
      ],
      retry_recipe: { resource: EXAMPLE_RESOURCE, method: "POST", network: "eip155:8453", usdc: MAINNET_USDC, payTo: CANONICAL_PAY_TO, facilitator: FACILITATOR_URL, amount_rule: "sign accepts[0].amount verbatim from the live challenge; advertised copy is advisory only" },
    },
  ];
}

function payFailedJson() {
  return {
    ok: true,
    service: "rae-fleet-router",
    page: "x402 payment failure recovery — fix in 30 seconds",
    canonical: { network: "eip155:8453", usdc: MAINNET_USDC, payTo: CANONICAL_PAY_TO, facilitator: FACILITATOR_URL },
    this_deployment: { network: NETWORK, payTo: PAY_TO },
    universal_rule: "Decode the live 402 PAYMENT-REQUIRED header and copy accepts[0] verbatim (network, payTo, amount). Never reuse cached values.",
    modes: payFailedModes(),
  };
}

function payFailedMarkdown() {
  const m = payFailedModes();
  const sections = m.map((x) => [
    "## " + x.title,
    "",
    "**Symptom.** " + x.symptom,
    "",
    "**Cause.** " + x.cause,
    "",
    "**Fix (30 seconds):**",
    ...x.fix.map((s) => "1. " + s),
    "",
    "Machine-readable retry recipe:",
    "",
    "```json",
    JSON.stringify(x.retry_recipe, null, 2),
    "```",
    "",
  ].join("\n")).join("\n");
  return [
    "# Your x402 payment failed — fix in 30 seconds",
    "",
    "You hit one of the four real failure modes. The universal rule that prevents all",
    "four: **the live 402 `PAYMENT-REQUIRED` header (base64 JSON) is the single source",
    "of truth.** Decode it and copy `accepts[0].network`, `.payTo`, `.amount` verbatim",
    "into your signed USDC EIP-3009 authorization — never reuse cached config.",
    "",
    "Canonical fleet values: network `eip155:8453` (Base mainnet), USDC",
    "`" + MAINNET_USDC + "` (6 decimals), payTo `" + CANONICAL_PAY_TO + "`,",
    "facilitator `" + FACILITATOR_URL + "`.",
    "Machine-readable form of this entire page: `GET /pay-failed?format=json`.",
    "",
    sections,
    "---",
    "",
    "*Re-probe the endpoint UNPAID to get a fresh challenge, re-sign against it, and",
    "re-send with the `PAYMENT-SIGNATURE` header. 4xx responses are never billed on",
    "this router — validation runs before the payment gate (EXEC-41).*",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// STRAT-47 — GET /benchmarks: fleet x402 pricing benchmark vs Coinbase CDP
// facilitator rates and the 2026-08-28 x402 Bazaar census (14,820 paid
// resources). Data below is the 2026-09-28 live 402-challenge survey of the
// fleet (amounts copied verbatim from decoded PAYMENT-REQUIRED headers,
// micro-USDC / 6 decimals). A static snapshot: as always on this router the
// LIVE 402 challenge remains authoritative over any advertised price.
// Default response is JSON (machine-first, A2A charter); ?format=md serves
// the human/markdown view. Free route, registered above paymentMiddleware.
const BENCHMARK_SURVEY = {
  survey_utc: "2026-09-28T04:05:00Z",
  method: "live x402 402-challenge capture per paid route (authoritative), plus /pricing.md and /.well-known/x402.json parity checks; market baseline from the 2026-08-28 x402 Bazaar audit (14,820 resources) and Coinbase CDP facilitator published rates",
  cdp_facilitator_baseline: {
    source: "https://docs.cdp.coinbase.com/x402/seller/facilitator (accessed 2026-09-28)",
    verification_usd: 0,
    settlement_free_tier: "first 1,000 onchain settlements/month",
    settlement_over_tier_usd: 0.001,
    note: "fees are per onchain settlement, not per request; gas is facilitator-paid; no processor or chargeback fees",
  },
  fleet_facilitator: "https://x402-agent-pay.com/facilitator",
  usdc_decimals: 6,
  canonical_pay_to: CANONICAL_PAY_TO,
  live_verified_usd: [
    { service: "dispute-forge", route: "POST /api/dispute-pack", amount_usd: 0.75, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 97.8 },
    { service: "briefsnap", route: "POST /api/summarize", amount_usd: 1.00, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 98.1 },
    { service: "briefsnap", route: "POST /api/compare-docs", amount_usd: 3.00, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 99.6 },
    { service: "escrow", route: "POST /api/escrow/create", amount_usd: 0.05, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 71.6 },
    { service: "nft-alpha", route: "POST /api/nft-signal", amount_usd: 0.02, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 59.0 },
    { service: "suprapack", route: "POST /api/find-skill", amount_usd: 0.03, network: "eip155:84532", pay_to_matches_canonical: true, bazaar_percentile: 67.2, defect: "live challenge advertises Base Sepolia (eip155:84532) — mainnet USDC buyers cannot pay this route" },
    { service: "tradingagents", route: "POST /api/analyze-arbitrage", amount_usd: 0.05, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 71.6 },
    { service: "tradingagents", route: "POST /api/analyze-ticker", amount_usd: 0.05, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 71.6 },
    { service: "raen-portfolio", route: "POST /api/portfolio", amount_usd: 0.01, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 42.3 },
    { service: "rae-fleet-router", route: "POST /api/fleet-bundle", amount_usd: 0.10, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 82.2, defect: "priced ABOVE its own sum-of-parts ($0.02 + $0.01 + $0.05 = $0.08), breaking the published bundle-ladder promise" },
    { service: "rae-fleet-router", route: "POST /api/bundle/market-starter", amount_usd: 0.02, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 59.0 },
    { service: "rae-fleet-router", route: "POST /api/bundle/market-intel-trio", amount_usd: 0.05, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 71.6 },
    { service: "rae-fleet-router", route: "POST /api/bundle/full-fleet-sampler", amount_usd: 0.06, network: "eip155:8453", pay_to_matches_canonical: true, bazaar_percentile: 79.1 },
  ],
  manifest_defects: [
    "escrow /.well-known/x402.json advertises eip155:84532 while the LIVE 402 challenge is eip155:8453 (mainnet) — stale machine manifest",
    "nimbus-agent /.well-known/x402.json advertises service 'dispute-forge' @ $0.75 and its /api/dispute-pack route 500s — wrong app deployed under this hostname",
    "opensea-data-x402 hostname serves the internal 'revenue-optimizer' app (GET 200, no x402 gate) — the advertised $0.01 opensea-data surface is not live there",
    "suprapack live challenge advertises testnet eip155:84532 (see live_verified_usd)"
  ],
  unreachable_at_survey: { services: ["sentry-forge (503)", "contract-eye (no DNS/suspended)", "dispatch (suspended)", "lingua (503)", "nanobanana (suspended)", "power-pack (suspended)", "royal-feel (503/400s, no 402 captured)", "royal-ruby (500)", "vault-pro (suspended)", "staci-nft-oracle (503)", "opensea-data (wrong app)", "nimbus (500)"], fleet_apps_live_on_fly: "re-verified same UTC morning: 20 fleet apps exist; several suspended by ongoing redeploy waves during the survey window" },
  market_baseline: {
    source: "x402 Bazaar audit 2026-08-28 (fetchgate.dev, CC BY 4.0, 14,820 listed resources)",
    median_listed_usd: 0.01,
    median_active_over_100_calls30d_usd: 0.006,
    percentiles: { "0.001": 0.2, "0.002": 13.2, "0.01": 42.3, "0.02": 59.0, "0.03": 67.2, "0.05": 71.6, "0.06": 79.1, "0.10": 82.2, "0.25": 92.7, "0.75": 97.8, "1.00": 98.1, "2.00": 99.4, "3.00": 99.6, "5.00": 99.6 },
    fleet_bazaar_listings_in_census: 0,
  },
  verdicts: {
    underpriced_or_negative_margin: [
      "nanobanana $0.01 vs claimed $0.039 upstream cost (internal COGS feed, unverified) — every settled call loses money",
      "opensea-data $0.01 vs $0.01 upstream — 0% margin",
      "fleet-bundle $0.10 vs sum-of-parts $0.08 — inverted bundle math"
    ],
    overpriced_for_observed_demand: [
      "briefsnap $1.00-$3.00 (98.1-99.6th pct of listed x402), lingua $1.00, royal-feel $2.00-$5.00, sentry-forge $5.00, dispute-forge $0.75 (97.8th pct) sit in the top ~2% of the market price band while confirmed external settlements are $0.00 — price is above every observed conversion anchor",
      "human-service anchors (DoNotPay $39/mo etc.) justify $0.75-$3.00 outputs for HUMANS, not for autonomous x402 buyers whose median willingness (active Bazaar endpoints) is $0.006-$0.02"
    ],
    cost_floor: "CDP facilitator marginal cost once past the free tier is $0.001/settlement; no fleet route should be priced under ~$0.002 (2x cost floor) and the current facilitator (x402-agent-pay.com) may charge differently — switch to CDP to get a published, auditable rate"
  },
  recommendations: [
    "1. Availability first: 12 of 20 wall hostnames were unreachable at survey; a suspended wall has infinite price elasticity and zero revenue. Finish the redeploy wave, then re-run this survey.",
    "2. Move settlement to the CDP facilitator (facilitator.x402.coinbase.com): published $0.001/settlement past 1,000 free/month AND it auto-indexes endpoints on the Bazaar after first settled payment when the challenge advertises extensions.bazaar (fleet already advertises them, yet has 0 of 14,820 census listings because settlements run through x402-agent-pay.com). Discovery, not price, is the binding constraint.",
    "3. Fix the two testnet defects: suprapack live challenge eip155:84532 -> 8453; escrow stale /.well-known manifest -> 8453.",
    "4. Raise the floor: nanobanana $0.01 -> >= $0.05 (cost $0.039 claim) or pause it; opensea-data $0.01 -> $0.02+ or retire; never price below 2x the settled cost.",
    "5. Re-cut the $1+ tier for A2A: keep list prices as human anchors but publish an agent entry SKU at $0.25-$0.50 (92.7th pct) for first calls (STRAT-37) instead of 50%-off-still-98th-pct promos; add output-size meters (word/token counts) so the premium is machine-legible.",
    "6. Restore bundle-ladder integrity: set /api/fleet-bundle at <= $0.07 or raise a component so bundle < sum-of-parts as advertised on /pricing.md.",
    "7. Remove or gate the public revenue-optimizer telemetry exposed on the opensea-data-x402 hostname: it advertises unaudited revenue claims and leaks payer-wallet operational state to any unauthenticated GET."
  ],
};

function benchmarksJson() {
  return {
    ok: true, free: true, service: "rae-fleet-router", benchmark: "STRAT-47 x402 pricing benchmark",
    generated_from: BENCHMARK_SURVEY.survey_utc,
    authoritative_price_note: "This is a dated survey snapshot. The live 402 PAYMENT-REQUIRED challenge on each route remains the single source of truth (see /pay-failed mode 4).",
    data: BENCHMARK_SURVEY,
    links: { pricing: "/pricing.md", sample: "/sample", machine_contract: "/openapi.json", recovery: "/pay-failed" },
  };
}

function benchmarksMarkdown() {
  const s = BENCHMARK_SURVEY;
  const rows = s.live_verified_usd.map(r =>
    `| ${r.service} | ${r.route} | $${r.amount_usd.toFixed(2)} | ${r.network} | ${r.bazaar_percentile}${r.defect ? " | " + r.defect : " | —"}`).join("\n");
  return [
    `# STRAT-47 Pricing Benchmark — RAE Fleet (surveyed ${s.survey_utc})`,
    "",
    `Baseline: CDP facilitator ${JSON.stringify(s.cdp_facilitator_baseline.verification_usd)} verification + free first ${s.cdp_facilitator_baseline.settlement_free_tier}, then $${s.cdp_facilitator_baseline.settlement_over_tier_usd}/settlement.`,
    `Market: x402 Bazaar census median $${s.market_baseline.median_listed_usd}/call (active median $${s.market_baseline.median_active_over_100_calls30d_usd}); fleet Bazaar listings: ${s.market_baseline.fleet_bazaar_listings_in_census}.`,
    "Live 402 challenges captured (authoritative source is still each live challenge):",
    "",
    "| Service | Route | Price | Network | Bazaar percentile | Defect |",
    "|---|---|---|---|---|---|",
    rows,
    "",
    "## Recommendations",
    ...s.recommendations.map(r => `-${r}`),
    "",
    `Machine-readable: GET /benchmarks (JSON).`,
  ].join("\n");
}

function registerDiscoveryEndpoints(serverApp, routes, serviceInfo) {
  const x402Manifest = { version: "2.0.0", service: { name: serviceInfo.name, description: serviceInfo.description, contact: "jadedfocus@gmail.com", operator: "Royal Agentic Enterprises" }, endpoints: {} };
  const openapi = { openapi: "3.1.0", info: { title: serviceInfo.title, description: serviceInfo.description, version: "1.0.0", contact: { email: "jadedfocus@gmail.com" },
    "x-guidance": "Call POST /api/fleet-bundle with JSON {topic: string, email_subject?: string, email_body?: string} to get a bundled research result from multiple RAE fleet services (nft-alpha, power-pack, tradingagents). Price $0.10 USDC on Base (eip155:8453) per call, pay-per-call via x402. Buyer owns signing; set a per-call spend ceiling; do not auto-retry paid calls." },
    paths: {} };
  openapi.paths["/pay-failed"] = {
    get: {
      summary: "x402 payment failure recovery — fix in 30 seconds (free, no payment)",
      description: "Markdown-first recovery copy for the fleet's 4 real x402 failure modes (wrong network, payTo drift, insufficient balance/expired approval, stale price). Machine-readable set at ?format=json. Every mode carries a retry recipe with endpoint, network, payTo, and facilitator URL.",
      parameters: [{ name: "format", in: "query", required: false, description: "json returns the full mode set + canonical values as JSON", schema: { type: "string", enum: ["json"] } }],
      responses: { "200": { description: "Recovery copy (text/markdown, or application/json with ?format=json)" } },
    },
  };
  openapi.paths["/sample"] = {
    get: {
      summary: "Free synthetic bundle-compose demo (no payment, never 402)",
      description: "Shape-accurate example response of POST /api/bundle/<id> with clearly-marked synthetic values, plus a 4-step copy-pasteable x402 purchase flow. Generated without payment and without any downstream fleet call.",
      responses: { "200": { description: "Sample bundle JSON (application/json) — free, ungated" } },
    },
  };
  openapi.paths["/benchmarks"] = {
    get: {
      summary: "Fleet x402 pricing benchmark vs Coinbase CDP facilitator rates and the x402 Bazaar census (free, no payment)",
      description: "Dated survey (2026-09-28) of live 402 challenge amounts across fleet walls, per-price market percentiles, under/over verdicts, manifest defects, and recommendations. Default JSON; ?format=md serves markdown. The live 402 challenge remains authoritative over this snapshot.",
      parameters: [{ name: "format", in: "query", required: false, description: "md returns the human/markdown view", schema: { type: "string", enum: ["md"] } }],
      responses: { "200": { description: "Benchmark JSON (application/json), or text/markdown with ?format=md" } },
    },
  };
  // EXEC-88 — hosted pay-link storefront (free; mirrors each wall's own surfaces)
  openapi.paths["/buy"] = {
    get: {
      summary: "Hosted pay-link index: one shareable page per fleet x402 service (free, no payment)",
      description: "HTML card index generated at request time from every configured wall's live /.well-known/x402.json (300 s cache). Unreachable walls are listed with status 'unreachable', never a stale price. ?format=json serves {generated_utc, items:[{slug,host,endpoint,method,price_usdc,network,payTo,asset,facilitator,updated_utc}]}.",
      parameters: [{ name: "format", in: "query", required: false, description: "json returns the machine index", schema: { type: "string", enum: ["json"] } }],
      responses: { "200": { description: "Pay-link index (text/html, or application/json with ?format=json)" } },
    },
  };
  openapi.paths["/buy/{slug}"] = {
    get: {
      summary: "Single hosted pay link: embedded x402 v2 PaymentRequirements + copyable buy snippet (free, no payment)",
      description: "Per-service pay page. The embedded PaymentRequirements mirrors the wall's LIVE 402 challenge (amount authoritative); manifest fallback only when the challenge probe fails, flagged in price_source. Pages with a non-canonical payTo or non-eip155:8453 network are withheld 503, never advertised. Unknown slug -> 404; unreachable wall -> 503 with Retry-After.",
      parameters: [{ name: "slug", in: "path", required: true, description: "Service slug from GET /buy (e.g. nft-alpha)", schema: { type: "string" } },
        { name: "format", in: "query", required: false, description: "json returns the PaymentRequirements document", schema: { type: "string", enum: ["json"] } }],
      responses: { "200": { description: "Pay page (text/html, or application/json with ?format=json)" }, "404": { description: "Unknown slug" }, "503": { description: "Wall unreachable or route withheld by money guard (Retry-After set)" } },
    },
  };
  for (const [rk, rv] of Object.entries(routes)) {
    const parts = rk.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const method = parts[0].toLowerCase(), path = parts[1];
    x402Manifest.endpoints[path] = { method: method.toUpperCase(), accepts: rv.accepts, description: rv.description, mimeType: rv.mimeType };
    if (!openapi.paths[path]) openapi.paths[path] = {};
    const rawPrice = rv.accepts && rv.accepts.price ? String(rv.accepts.price).replace("$","") : "0.10";
    openapi.paths[path][method] = {
      summary: rv.description ? rv.description.split(/\.(?:\s|$)/)[0] : `Endpoint ${path}`,
      description: rv.description,
      "x-payment-info": { price: { mode: "fixed", currency: "USD", amount: Number(rawPrice).toFixed(6) }, protocols: [{ x402: {} }] },
      ...(rv.requestSchema ? { requestBody: { required: true, content: { "application/json": { schema: rv.requestSchema } } } } : {}),
      responses: { "200": { description: "Successful response", ...(rv.responseSchema ? { content: { "application/json": { schema: rv.responseSchema } } } : {}) }, "400": { description: "Invalid request (not charged)" }, "402": { description: "Payment Required" } },
    };
  }
  serverApp.get("/.well-known/x402.json", (req, res) => res.json(x402Manifest));
  serverApp.get("/.well-known/x402", (req, res) => res.json(x402Manifest));
  serverApp.get("/openapi.json", (req, res) => res.json(openapi));
  serverApp.get("/pricing.md", (req, res) => res.type("text/markdown; charset=utf-8").send(pricingMarkdown()));
  serverApp.get("/llms.txt", (req, res) => {
    const lines = Object.entries(routes).map(([rk, rv]) =>
      `- ${rk}: ${rv.accepts.price} USDC — ${rv.description.split(/\.(?:\s|$)/)[0]}. Sum-of-parts and bundle math: /pricing.md`);
    res.type("text/plain").send(`${serviceInfo.title}\n${serviceInfo.description}\nPaid endpoints (x402, USDC on Base eip155:8453, pay-per-call, no API key):\n${lines.join("\n")}\nEvery curated bundle above is priced strictly below the sum of its live per-call parts (see /pricing.md).\nTry before you pay: GET /sample — free synthetic bundle-compose demo, exact paid-response shape, no payment and no 402 challenge.\nTo call: send without payment, read 402 PAYMENT-REQUIRED header, sign USDC transferWithAuthorization, re-send with PAYMENT-SIGNATURE header.\nMachine contract: /openapi.json and /.well-known/x402.\nPayment failed? GET /pay-failed (markdown) or /pay-failed?format=json — 30-second recovery recipes for the 4 real x402 failure modes (wrong network, payTo drift, insufficient balance/expired approval, stale price).\\nPricing benchmark: GET /benchmarks (JSON; ?format=md) — live-402 fleet price survey vs Coinbase CDP facilitator rates and x402 Bazaar census percentiles.\\nShareable pay links: GET /buy — one HTML page + embedded x402 PaymentRequirements per service (index at /buy, machine variant /buy?format=json).`);
  });
}

// ---------------------------------------------------------------------------
// EXEC-35 — GET /sample: free, synthetic bundle-compose demonstration.
// Completes the machine-surface parity set (pricing.md / llms.txt /
// /.well-known/x402.json / openapi.json / pay-failed all live; /sample was the
// last 404, verified live 2026-09-23). Mirrors the fleet-wide /sample shape
// (contract-eye-x402 et al.): { ok, free, sample, sample_note, ... }. Values
// are ILLUSTRATIVE and clearly marked synthetic — the route never calls a
// downstream fleet service, never bills, and is registered ABOVE
// paymentMiddleware so it can never emit a 402. A paid response to
// POST /api/bundle/<id> has exactly this envelope shape with live data.
// ---------------------------------------------------------------------------
function sampleJson() {
  const demo = BUNDLE_LADDER.find((b) => b.id === "market-starter") || BUNDLE_LADDER[0];
  const syntheticLegs = {
    "opensea-data": {
      ok: true, collection: "azuki", action: "floor",
      floor_price: { value: 4.87, currency: "ETH", symbol: "WETH", source: "synthetic-demo" },
      _synthetic_demo: true,
    },
    "nft-alpha": {
      ok: true, collection: "azuki",
      signal: { verdict: "neutral", momentum_24h_pct: -1.8, volume_24h_usd: 512340.55, whale_flow: "balanced" },
      _synthetic_demo: true,
    },
    "suprapack": {
      ok: true, query: "Azuki",
      skills: [{ name: "nft-diligence", match: 0.91 }, { name: "marketplace-api", match: 0.78 }],
      _synthetic_demo: true,
    },
  };
  const bundle = {};
  for (const [name] of demo.parts) {
    const key = name.replace("-x402", "");
    bundle[key] = { status: 200, body: JSON.stringify(syntheticLegs[key] || { ok: true, _synthetic_demo: true }) };
  }
  return {
    ok: true,
    service: "rae-fleet-router",
    free: true,
    sample: true,
    sample_note:
      "Synthetic demonstration payload — response shape is accurate to a paid " +
      "`" + demo.id + "` bundle, values are illustrative. Generated without payment and " +
      "WITHOUT calling any downstream fleet service. A paid response reflects real fleet data " +
      "for the topic you send.",
    demonstrating: {
      endpoint: `POST /api/bundle/${demo.id}`,
      price: demo.price + " USDC",
      network: "eip155:8453",
      payTo: CANONICAL_PAY_TO,
      sum_of_parts: `$${bundleSumOfParts(demo).toFixed(2)}`,
      request_example: { topic: "Azuki" },
    },
    response_example: {
      ok: true,
      bundle_id: demo.id,
      bundle,
      meta: { topic: "Azuki", services_called: demo.parts.length, timestamp: "2026-09-23T00:00:00.000Z", synthetic_demo: true },
    },
    how_to_buy: [
      "1. POST /api/bundle/" + demo.id + " UNPAID with JSON {\"topic\":\"Azuki\"} — expect HTTP 402 with a base64 PAYMENT-REQUIRED header.",
      "2. Decode PAYMENT-REQUIRED, read accepts[0]: scheme exact, network eip155:8453, amount in atomic USDC (6 decimals; $0.02 = 20000), payTo. The LIVE challenge is authoritative — never reuse cached values.",
      "3. Sign a USDC EIP-3009 transferWithAuthorization for accepts[0].amount to accepts[0].payTo (no prior approval needed).",
      "4. Re-send the SAME POST with header PAYMENT-SIGNATURE: <base64 payment payload>. HTTP 200 returns the live bundle in exactly the response_example shape above.",
    ],
    invalid_requests_are_never_billed: "Malformed bodies short-circuit to 400 BEFORE the payment gate (EXEC-41).",
    more: {
      pricing: "GET /pricing.md",
      free_sample: "GET /sample (this page)",
      machine_contract: "GET /openapi.json",
      x402_manifest: "GET /.well-known/x402.json",
      payment_failure_recovery: "GET /pay-failed (markdown) or /pay-failed?format=json",
      buy_links: "GET /buy — hosted pay-link page per fleet service (embedded PaymentRequirements)",
      flagship: "POST /api/fleet-bundle — $0.10 USDC (nft-alpha + power-pack + tradingagents)",
      bundle_ladder: BUNDLE_LADDER.map((b) => ({ endpoint: `POST /api/bundle/${b.id}`, price: b.price, desc: b.desc })),
    },
  };
}

// Registered ABOVE paymentMiddleware — free forever, cannot emit 402.
app.get("/sample", (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(sampleJson());
});

// ---------------------------------------------------------------------------
// AGENSTRY-W1 (recO9y9mCEnExkp3W, 2026-09-28) — A2A v1.0 agent card + free
// JSON-RPC SendMessage surface. Agenstry's /submit validator proved the only
// indexing blocker was the missing /.well-known/agent-card.json (HTTP 404),
// and its methodology scores a live negotiated JSON-RPC method on the card's
// `url` (SendMessage for v1, message/send for v0.3). Both routes are
// registered ABOVE paymentMiddleware — they can never emit a 402, never call
// a downstream paid service, and never move money. All claims mirror the
// live x402 manifest; the card is discovery copy, not an authority —
// the live 402 challenge remains the single source of truth for prices.
// ---------------------------------------------------------------------------
function a2aCardUrl(req) {
  // Production is TLS-only behind Fly; advertise https even on local http probes.
  return `https://${req.get("host") || "rae-fleet-router.fly.dev"}/a2a`;
}
function agentCardJson(req) {
  const skills = [
    {
      id: "fleet-bundle", name: "Fleet bundle research",
      description: "Compose nft-alpha (NFT market signals) + power-pack (outreach email scoring) + tradingagents (market consensus) into one paid research call. $0.10 USDC on Base via x402 v2.",
      tags: ["nft", "market-signals", "email-scoring", "x402", "usdc", "base"],
      examples: ["Bundle three fleet services (NFT signals + email scoring + market consensus) into one paid research call for a topic such as Azuki."],
    },
    ...BUNDLE_LADDER.map((b) => ({
      id: `bundle-${b.id}`, name: `Bundle: ${b.id}`,
      description: `${b.desc} ${b.price} USDC on Base via x402 v2 (bundle priced below the sum of its live per-call parts).`,
      tags: ["bundle", "x402", "usdc", "base", "agent-to-agent"],
      examples: [`POST /api/bundle/${b.id} with a topic keyword — ${b.desc}`],
    })),
    {
      id: "fleet-info", name: "Fleet capability guide (free)",
      description: "Ask this agent in plain text which fleet services exist, what they cost, and how to pay with x402 — answered free over A2A JSON-RPC, no payment, no downstream calls.",
      tags: ["catalog", "pricing", "discovery", "x402", "free"],
    },
  ];
  return {
    name: "RAE Fleet Router — Agent-to-Agent Bundle",
    description: "Royal Agentic Enterprises x402 fleet entry point: paid bundle endpoints (USDC on Base, per-call via x402 v2, CDP-facilitator-verifiable) composing nft-alpha, power-pack, tradingagents, opensea-data, suprapack, nanobanana and more, plus a free capability-guide agent. Live machine-readable pricing: /.well-known/x402.json.",
    version: "1.0.0",
    protocolVersion: "1.0",
    url: a2aCardUrl(req),
    supportedInterfaces: [{ url: a2aCardUrl(req), transport: "JSONRPC", protocolBinding: "JSONRPC", protocolVersion: "1.0" }],
    preferredTransport: "JSONRPC",
    provider: { organization: "Royal Agentic Enterprises", url: "https://royal-gateway-x402.fly.dev" },
    documentationUrl: "https://rae-fleet-router.fly.dev/pricing.md",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
      extensions: [
        { uri: "https://x402.org", description: "x402 v2 payment gating: USDC (eip155:8453, contract 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913), scheme exact, payTo treasury 0x7861db4efc14a1ed5dd8c96c528a3796560f1393. The live 402 challenge is authoritative.", required: false },
      ],
    },
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json", "text/plain"],
    skills,
    securitySchemes: {},
    security: [],
  };
}
function a2aGuideText() {
  const ladder = BUNDLE_LADDER.map((b) => `- POST /api/bundle/${b.id} — ${b.price} USDC: ${b.desc}`).join("\n");
  return `RAE Fleet Router (Royal Agentic Enterprises) — 17 live x402 service walls on Base mainnet, USDC per-call, no API key. Paid here: POST /api/fleet-bundle $0.10 (nft-alpha + power-pack + tradingagents). ${ladder}. Free surfaces: /sample (shape-accurate demo), /pricing.md, /.well-known/x402.json (machine pricing), /pay-failed (recovery recipes). To pay: POST unpaid, decode the 402 PAYMENT-REQUIRED header, sign a USDC EIP-3009 transferWithAuthorization, re-send with PAYMENT-SIGNATURE. The live challenge is authoritative — prices there beat this text.`;
}
app.get(["/.well-known/agent-card.json", "/.well-known/agent.json"], (req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(agentCardJson(req));
});
app.post("/a2a", (req, res) => {
  const b = req.body || {};
  const id = b.id !== undefined ? b.id : null;
  if (b.jsonrpc !== "2.0" || typeof b.method !== "string") {
    return res.json({ jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request: expected JSON-RPC 2.0 with a method string" } });
  }
  if (b.method === "SendMessage" || b.method === "message/send" || b.method === "tasks/send") {
    // AGENSTRY-W1 c6 fix: negotiate the response wire format by the METHOD the
    // caller used (exactly how Agenstry's validator picks its expected schema:
    // "SendMessage for v1, message/send for v0.3"). A2A v1.0 is protojson:
    // role is the ROLE_AGENT enum and Part is a bare oneof ({"text": ...} —
    // NO "kind" discriminator; the v1 proto has no kind field, and strict
    // validators reject unknown members). v0.3 keeps kind/agent lower-case.
    // Inbound parts are accepted in BOTH shapes (kinded or bare text).
    const v1 = b.method === "SendMessage";
    const userText = (((b.params || {}).message || {}).parts || [])
      .filter((p) => p && typeof p.text === "string")
      .map((p) => p.text).join(" ").slice(0, 500);
    const lower = userText.toLowerCase();
    let answer = a2aGuideText();
    if (/azuki|nft|collection/.test(lower)) answer += `\n\nYou mentioned NFTs: cheapest live path is nft-alpha POST /api/nft-signal $0.02 (own wall), or bundle here from $0.02.`;
    if (/email|subject|scor/.test(lower)) answer += `\n\nOutreach scoring: power-pack POST /api/score-email $0.01 (own wall), or the fleet-bundle which composes it.`;
    if (/image|picture|banana/.test(lower)) answer += `\n\nImage generation/editing lives on the nanobanana wall: POST /api/generate-image and /api/edit-image, $0.01 each.`;
    const metadata = { free: true, x402: { network: "eip155:8453", asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", payTo: CANONICAL_PAY_TO, manifest: "/.well-known/x402.json" } };
    const messageId = `r-${Date.now()}`;
    const message = { messageId, role: "ROLE_AGENT", parts: [{ text: answer }], metadata };
    const result = v1
      ? { message }
      : { kind: "message", role: "agent", messageId, parts: [{ kind: "text", text: answer }], metadata };
    return res.json({ jsonrpc: "2.0", id, result });
  }
  if (b.method === "GetAgentCard") {
    return res.json({ jsonrpc: "2.0", id, result: agentCardJson(req) });
  }
  return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found: supported are SendMessage (v1), message/send (v0.3), GetAgentCard" } });
});

// One routes map feeds the manifest, OpenAPI, llms.txt, paymentMiddleware, and the
// Express handlers — registered price and advertised price cannot diverge.
const PAID_ROUTES = { "POST /api/fleet-bundle": bundleRoute };
for (const b of BUNDLE_LADDER) {
  PAID_ROUTES[`POST /api/bundle/${b.id}`] = {
    accepts: { scheme: "exact", price: b.price, network: NETWORK, payTo: PAY_TO, extra: { facilitator: CHALLENGE_FACILITATOR_URL } },
    serviceName: SERVICE_NAME,
    description: b.desc,
    mimeType: "application/json",
    requestSchema: BUNDLE_INPUT_SCHEMA,
    responseSchema: BUNDLE_OUTPUT_SCHEMA,
    // EXEC-52: extensions.bazaar is a REQUIRED preflight check for CDP Bazaar
    // indexing; the ladder routes shipped none (flagship bundleRoute had it,
    // the ladder did not). Same machine contract, per-route example.
    extensions: {
      ...declareDiscoveryExtension({
        method: "POST",
        bodyType: "json",
        input: { topic: "Azuki" },
        inputSchema: BUNDLE_INPUT_SCHEMA,
        output: {
          example: { ok: true, bundle: {}, meta: { route: b.id, services_called: b.parts.length } },
          schema: BUNDLE_OUTPUT_SCHEMA,
        },
      }),
    },
  };
}

registerDiscoveryEndpoints(app, PAID_ROUTES, {
  name: "rae-fleet-router",
  title: "RAE Fleet Router — Agent-to-Agent Bundle",
  description: "Compose multiple RAE fleet services into one paid bundle via x402. Demonstrates agent-to-agent economy.",
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Payment, PAYMENT-SIGNATURE");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// PLAN-32 — free recovery surface (registered ABOVE the payment gate; never gated).
app.get("/pay-failed", (req, res) => {
  const accept = String(req.get("accept") || "");
  const wantsJson = String(req.query.format || "").toLowerCase() === "json" ||
    (accept.includes("application/json") && !accept.includes("text/markdown") && !accept.includes("*/*"));
  if (wantsJson) return res.json(payFailedJson());
  res.type("text/markdown; charset=utf-8").send(payFailedMarkdown());
});

// STRAT-47 — free pricing-benchmark surface (registered ABOVE the payment
// gate; never gated). Machine-first JSON default; ?format=md serves markdown.
app.get("/benchmarks", (req, res) => {
  const accept = String(req.get("accept") || "");
  const wantsMd = String(req.query.format || "").toLowerCase() === "md" ||
    accept.includes("text/markdown");
  res.set("Cache-Control", "public, max-age=300");
  if (wantsMd) return res.type("text/markdown; charset=utf-8").send(benchmarksMarkdown());
  res.json(benchmarksJson());
});

// ---------------------------------------------------------------------------
// EXEC-88 — GET /buy + GET /buy/{slug}: hosted pay-link storefront, built
// from the STRAT-70 contract (fleet_db/PAYLINK-SKU-SHEET-20260928.md).
// Registered ABOVE paymentMiddleware — free forever, can never emit 402,
// never moves money: every page is a read-only mirror of each wall's own
// live machine surfaces (/x402.json manifest + unpaid POST 402 challenge).
// Contract rules enforced in code:
//  - prices are NEVER hardcoded in route source (identity config only);
//    the live challenge is authoritative (§1.1–1.2), manifest is fallback (§1.3);
//  - money guard: a page is served only when the advertised payTo equals
//    CANONICAL_PAY_TO (full 40-hex, case-insensitive — royal-ruby wire-returns
//    the checksummed form) and network is eip155:8453. Anything else is a
//    503 withhold, never an advertisement of a foreign destination;
//  - a wall whose surfaces fail is listed "unreachable" and its page 503s
//    with Retry-After — never a stale price (§3 index rule);
//  - each wall's own facilitator URL is echoed verbatim from its own data —
//    the raen-portfolio raen-facilitator split-brain stays unsilenced until
//    the fleet WRK decision lands (flags §6.1);
//  - sample bodies come from the wall manifest extensions.bazaar.info.input.body
//    and are rendered as REQUEST PARAMETERS only — never as a pay destination
//    (flags §6.3, escrow placeholder 0x1111...).
// ---------------------------------------------------------------------------
const BUY_CACHE_TTL_MS = 300 * 1000;          // §3: 300 s TTL
const BUY_FETCH_TIMEOUT_MS = 8000;
const BUY_RETRY_AFTER = "300";

// Identity-only config: host + canonical flagship endpoint (from the STRAT-70
// §2 crawl of 2026-10-02T09:19Z). No prices live in this table.
const BUY_WALLS = [
  { app: "briefsnap-x402",       slug: "briefsnap",       flagship: "/api/summarize" },
  { app: "dispatch-x402",        slug: "dispatch",        flagship: "/dispatch" },
  { app: "dispute-forge-x402",   slug: "dispute-forge",   flagship: "/api/dispute-pack" },
  { app: "escrow-x402",          slug: "escrow",          flagship: "/api/escrow/create" },
  { app: "nanobanana-x402",      slug: "nanobanana",      flagship: "/api/generate-image" },
  { app: "nft-alpha-x402",       slug: "nft-alpha",       flagship: "/api/nft-signal" },
  { app: "power-pack-x402",      slug: "power-pack",      flagship: "/api/score-email" },
  { app: "rae-fleet-router",     slug: "rae-fleet-router", flagship: "/api/fleet-bundle" },
  { app: "raen-portfolio-x402",  slug: "raen-portfolio",  flagship: "/api/portfolio" },
  { app: "royal-feel-x402",      slug: "royal-feel",      flagship: "/api/lint-copy", duplicates: ["/copy/lint"] },
  { app: "royal-ruby-x402",      slug: "royal-ruby",      flagship: "/api/law-lookup" },
  { app: "suprapack-x402",       slug: "suprapack",       flagship: "/api/find-skill" },
  { app: "tradingagents-x402",   slug: "tradingagents",   flagship: "/api/analyze-ticker" },
  { app: "vault-pro-x402",       slug: "vault-pro",       flagship: "/api/scaffold-project" },
];

// Slug rule (STRAT-70 §2): flagship = bare slug; additional endpoints extend
// with __ + kebab tail. /api/<tail> strips the api/ prefix and joins inner
// slashes with '_'; non-api paths join slashes with '-'.
//   /api/bundle/market-starter -> bundle_market-starter
//   /copy/lint                 -> copy-lint
//   /api/extract-actions       -> extract-actions
function buySlugTail(path) {
  let t = String(path || "").replace(/^\/+|\/+$/g, "");
  if (t.startsWith("api/")) return t.slice(4).split("/").join("_");
  return t.split("/").join("-");
}

function microFromPrice(p) {
  if (p === null || p === undefined || p === "") return null;
  const m = String(p).match(/([0-9]+(?:\.[0-9]+)?)/);
  return m ? String(Math.round(parseFloat(m[1]) * 1e6)) : null;
}

function usdFromMicro(micro) {
  const v = Number(micro) / 1e6;
  if (!Number.isFinite(v)) return null;
  if (Number.isInteger(v)) return "$" + v.toFixed(2);
  return "$" + v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

// Money guard: full-address, case-insensitive canonical check + mainnet-only.
// Returns null when safe to advertise, else the withhold reason.
function buyGuard(network, payTo) {
  if (String(network || "").toLowerCase() !== "eip155:8453") return "wrong_network";
  const a = String(payTo || "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) return "payto_malformed";
  if (a !== CANONICAL_PAY_TO.toLowerCase()) return "payto_mismatch";
  return null;
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// embedded PaymentRequirements block: escape < so JSON can never close the tag
function embedPaymentRequirements(pr) {
  return '<script type="application/x-402-payment-requirements">' +
    JSON.stringify(pr).replace(/</g, "\\u003c") + "</script>";
}
function extractEmbeddedPR(html) {
  const m = /<script type="application\/x-402-payment-requirements">([\s\S]*?)<\/script>/.exec(String(html || ""));
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (_e) { return null; }
}

// --- 300 s TTL cache (successes only; failures re-probe next request) -------
const buyCache = new Map();
function buyCacheGet(key) {
  const e = buyCache.get(key);
  if (e && Date.now() - e.at < BUY_CACHE_TTL_MS) return e.val;
  if (e) buyCache.delete(key);
  return undefined;
}
function buyCacheSet(key, val) {
  if (buyCache.size > 512) buyCache.clear();
  buyCache.set(key, { at: Date.now(), val });
}
async function buyCached(key, producer) {
  const hit = buyCacheGet(key);
  if (hit !== undefined) return hit;
  const val = await producer();
  if (val && val.ok) buyCacheSet(key, val);
  return val;
}
function buyCachedFetchJson(url) {
  return buyCached("manifest:" + url, async () => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(BUY_FETCH_TIMEOUT_MS) });
      if (!res.ok) return { ok: false, error: "HTTP " + res.status };
      const data = await res.json();
      if (!data || typeof data !== "object" || !data.endpoints || typeof data.endpoints !== "object") {
        return { ok: false, error: "malformed manifest" };
      }
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  });
}
function buyCachedChallenge(item) {
  const body = JSON.stringify(item.sample_body || {});
  return buyCached("challenge:" + item.endpoint_url + ":" + body, async () => {
    try {
      const res = await fetch(item.endpoint_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(BUY_FETCH_TIMEOUT_MS),
      });
      const hdr = res.headers.get("payment-required") || res.headers.get("x-payment-required");
      if (!hdr) return { ok: false, status: res.status, error: "no PAYMENT-REQUIRED header (status " + res.status + ")" };
      let decoded;
      try {
        decoded = JSON.parse(Buffer.from(hdr, "base64url").toString("utf8"));
      } catch (_e) {
        decoded = JSON.parse(Buffer.from(hdr, "base64").toString("utf8"));
      }
      const accept = Array.isArray(decoded.accepts) && decoded.accepts.length ? decoded.accepts[0] : null;
      if (!accept) return { ok: false, status: res.status, error: "challenge has no accepts[0]" };
      return { ok: true, status: res.status, accept, resource: decoded.resource || null };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  });
}

// --- slug -> wall resolution (deterministic, single-wall page fetch) --------
function buyWallForSlug(slug) {
  const prefix = String(slug || "").split("__")[0];
  return BUY_WALLS.find((w) => w.slug === prefix) || null;
}

// --- manifest -> buy items (pure; unit-tested) -------------------------------
function buyItemsFromManifest(cfg, manifest, host) {
  const eps = Object.entries(manifest.endpoints || {});
  const paths = eps.map(([p]) => p);
  let flagship = cfg.flagship;
  if (!paths.includes(flagship) && paths.length === 1) flagship = paths[0];
  const items = [];
  const seen = new Set();
  for (const [path, ep] of eps) {
    if (!ep || typeof ep !== "object") continue;
    const acc = ep.accepts || {};
    const isDup = (cfg.duplicates || []).includes(path);
    let slug = path === flagship ? cfg.slug : cfg.slug + "__" + buySlugTail(path);
    if (seen.has(slug)) slug = slug + "__" + items.length;
    seen.add(slug);
    const amount_micro = microFromPrice(acc.price);
    const guard = buyGuard(acc.network, acc.payTo);
    let sample_body = {};
    try { sample_body = ep.extensions.bazaar.info.input.body ?? {}; } catch (_e) { sample_body = {}; }
    items.push({
      slug,
      host,
      endpoint: path,
      method: String(ep.method || "POST").toUpperCase(),
      price_usdc: amount_micro === null ? null : Number(amount_micro) / 1e6,
      amount_micro,
      network: acc.network || null,
      payTo: acc.payTo || null,
      asset: acc.asset || (String(acc.network || "").toLowerCase() === "eip155:8453" ? MAINNET_USDC : null),
      facilitator: (acc.extra && acc.extra.facilitator) || null,
      description: ep.description || manifest.service && manifest.service.description || "",
      service_description: (manifest.service && manifest.service.description) || "",
      sample_body,
      duplicate_of: isDup ? cfg.slug : null,
      status: guard || "ok",
      withhold: guard || null,
      endpoint_url: "https://" + host + path,
      updated_utc: new Date().toISOString(),
    });
  }
  return items;
}

// --- live index assembly ------------------------------------------------------
async function buildBuyIndex() {
  const walls = await Promise.all(BUY_WALLS.map(async (cfg) => {
    const host = cfg.app + ".fly.dev";
    const r = await buyCachedFetchJson("https://" + host + "/.well-known/x402.json");
    if (!r.ok) {
      return { host, status: "unreachable", error: r.error,
        items: [{ slug: cfg.slug, host, endpoint: cfg.flagship, method: "POST",
          price_usdc: null, amount_micro: null, network: null, payTo: null, asset: null,
          facilitator: null, description: "", duplicate_of: null, status: "unreachable",
          endpoint_url: "https://" + host + cfg.flagship, updated_utc: new Date().toISOString() }] };
    }
    const items = buyItemsFromManifest(cfg, r.data, host);
    return { host, status: items.length ? "ok" : "empty", error: items.length ? null : "no endpoints in manifest", items };
  }));
  return walls;
}

function buyItemJson(i) {
  return { slug: i.slug, host: i.host, endpoint: i.endpoint, method: i.method,
    price_usdc: i.price_usdc, amount_micro: i.amount_micro, network: i.network, payTo: i.payTo,
    asset: i.asset, facilitator: i.facilitator, duplicate_of: i.duplicate_of, status: i.status,
    updated_utc: i.updated_utc };
}

// --- page assembly -------------------------------------------------------------
function prFromChallenge(item, ch) {
  const a = ch.accept;
  const res = ch.resource || {};
  return {
    scheme: a.scheme || "exact",
    network: a.network || item.network,
    amount: String(a.amount ?? item.amount_micro ?? ""),
    asset: a.asset || item.asset || MAINNET_USDC,
    payTo: a.payTo || item.payTo,
    maxTimeoutSeconds: typeof a.maxTimeoutSeconds === "number" ? a.maxTimeoutSeconds : 300,
    extra: a.extra || { name: "USD Coin", version: "2", facilitator: item.facilitator },
    resource: {
      url: res.url || item.endpoint_url,
      method: String(res.method || item.method || "POST").toUpperCase(),
      mimeType: res.mimeType || "application/json",
    },
  };
}
function prFromManifest(item) {
  return {
    scheme: "exact",
    network: item.network,
    amount: String(item.amount_micro ?? ""),
    asset: item.asset || MAINNET_USDC,
    payTo: item.payTo,
    maxTimeoutSeconds: 300,
    extra: { name: "USD Coin", version: "2", facilitator: item.facilitator },
    resource: { url: item.endpoint_url, method: item.method, mimeType: "application/json" },
  };
}

async function buyPage(slug) {
  const cfg = buyWallForSlug(slug);
  if (!cfg) return { code: 404, json: { error: "unknown slug", buy_index: "/buy" } };
  const host = cfg.app + ".fly.dev";
  const r = await buyCachedFetchJson("https://" + host + "/.well-known/x402.json");
  if (!r.ok) return { code: 503, json: { error: "wall unreachable — /buy never shows stale prices", slug, host, retry_after: Number(BUY_RETRY_AFTER), updated_utc: new Date().toISOString() } };
  const items = buyItemsFromManifest(cfg, r.data, host);
  const item = items.find((i) => i.slug === slug);
  if (!item) return { code: 404, json: { error: "unknown slug", buy_index: "/buy" } };
  if (item.status === "unreachable") {
    return { code: 503, json: { error: "wall unreachable", slug, host, retry_after: Number(BUY_RETRY_AFTER) } };
  }
  const ch = await buyCachedChallenge(item);
  const pr = ch.ok ? prFromChallenge(item, ch) : prFromManifest(item);
  const guard = buyGuard(pr.network, pr.payTo);
  if (guard) {
    // Fail-closed money guard: never advertise a non-canonical destination or
    // a network mainnet buyers cannot pay on. This is a fleet defect signal,
    // not a page.
    return { code: 503, guard, json: {
      error: "route withheld: " + guard + " — /buy never advertises a non-canonical money path",
      slug, canonical_payTo: CANONICAL_PAY_TO,
      retry_after: Number(BUY_RETRY_AFTER),
    } };
  }
  const price_drift = !!(ch.ok && item.amount_micro && String(pr.amount) !== String(item.amount_micro));
  return { code: 200, item, pr, source: ch.ok ? "live-402-challenge" : "manifest", price_drift,
    json: {
      ok: true, slug, host: item.host, endpoint: item.endpoint, method: item.method,
      price_usdc: Number(pr.amount) / 1e6, amount_micro: String(pr.amount),
      price_source: ch.ok ? "live-402-challenge" : "manifest", price_drift,
      network: pr.network, asset: pr.asset, payTo: pr.payTo,
      facilitator: (pr.extra && pr.extra.facilitator) || null,
      duplicate_of: item.duplicate_of, updated_utc: new Date().toISOString(),
      payment_requirements: pr,
    } };
}

function renderBuyIndexHtml(walls) {
  const items = walls.flatMap((w) => w.items);
  const cards = items.map((i) => {
    const badge = i.status === "ok"
      ? escHtml(usdFromMicro(i.amount_micro) + " USDC")
      : "<span class=\"status\">" + escHtml(i.status) + "</span>";
    const payToTail = i.payTo ? "…" + escHtml(String(i.payTo).slice(-4)) : "";
    return `<div class="card">
  <h3><a href="/buy/${escHtml(i.slug)}">${escHtml(i.slug)}</a></h3>
  <p class="desc">${escHtml(String(i.description || "").slice(0, 160))}</p>
  <p class="price">${badge} · eip155:8453 · payTo ${payToTail}</p>
  <p class="ep">${escHtml(i.method)} https://${escHtml(i.host)}${escHtml(i.endpoint)}</p>
</div>`;
  }).join("\n");
  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Buy — RAE Fleet hosted pay links</title>
  <meta name="description" content="One shareable pay link per x402 service. USDC on Base, no API keys.">
  <meta property="og:title" content="Buy — RAE Fleet hosted pay links — USDC on Base, no API keys">
  <meta property="og:description" content="One shareable pay link per x402 service. USDC on Base, no API keys.">
  <meta property="og:image" content="https://rae-fleet-router.fly.dev/card">
  <meta name="twitter:card" content="summary_large_image">
  <style>body{font-family:system-ui,sans-serif;max-width:980px;margin:2rem auto;padding:0 1rem;color:#111}
.card{border:1px solid #ddd;border-radius:10px;padding:0.9rem 1.1rem;margin:0.7rem 0}
.card h3{margin:0 0 .3rem}.desc{color:#444;margin:.2rem 0}.price{margin:.2rem 0;font-weight:600}
.ep{font-family:ui-monospace,monospace;font-size:.8rem;color:#666;margin:.2rem 0}
.status{color:#b00}.unreachable{opacity:.55}footer{margin-top:2rem;color:#555}</style>
</head><body>
<h1>Buy — RAE Fleet hosted pay links</h1>
<p>Every card is generated at request time from the wall's own live machine
surfaces (x402 manifest + 402 challenge), cached 300&nbsp;s. Machine variant:
<code>GET /buy?format=json</code>.</p>
${cards}
<footer>Every wall on Base, USDC, no API keys — index at <code>/buy</code>.</footer>
</body></html>`;
}

function renderBuyPageHtml(item, page) {
  const pr = page.pr;
  const price = usdFromMicro(pr.amount) || "—";
  const bodyStr = JSON.stringify(item.sample_body || {});
  const flags = [];
  if (page.price_drift) flags.push("price_drift: true — live challenge amount differs from advertised manifest price; the LIVE amount shown here is authoritative");
  if (item.duplicate_of) flags.push("duplicate endpoint of /buy/" + item.duplicate_of + " (same $2.00 service, kept for URL stability)");
  if (page.source === "manifest") flags.push("price source: /.well-known/x402.json manifest (live challenge probe unavailable this refresh)");
  const flagHtml = flags.length ? `<div class="flags">${flags.map((f) => "<p>⚠ " + escHtml(f) + "</p>").join("")}</div>` : "";
  const snippet =
  `curl -s -X POST ${item.endpoint_url} \\\
    -H 'Content-Type: application/json' -d '${bodyStr}' \\\
    -H 'X-PAYMENT-RESPONSE: true' \\\
    --header 'Payment-Signature: <x402 payment payload>'`;
    const productJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: item.slug + " \\u2014 " + price + " USDC on Base (x402)",
      description: String(item.description || "").slice(0, 300),
      offers: {
        "@type": "Offer",
        price: Number(pr.amount) / 1e6,
        priceCurrency: "USDC",
        priceSpecification: { "@type": "UnitPriceSpecification", price: Number(pr.amount) / 1e6, priceCurrency: "USDC", unitText: "per call" },
        seller: { "@type": "Organization", name: "RAE Fleet", url: "https://rae-fleet-router.fly.dev" },
        url: item.endpoint_url,
        chain: "eip155:8453",
      },
    });
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(item.slug)} — ${escHtml(price)} USDC on Base (x402)</title>
<meta property="og:type" content="product">
<meta property="og:title" content="${escHtml(item.slug)} — ${escHtml(price)} USDC on Base (x402)">
<meta property="og:description" content="${escHtml(String(item.description || "").slice(0, 180))} — pay-per-call USDC via x402 v2, no API key.">
<meta property="og:image" content="https://${escHtml(item.host)}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/json" href="?format=json">
<script type="application/ld+json">${productJson}</script>
<style>body{font-family:system-ui,sans-serif;max-width:820px;margin:2rem auto;padding:0 1rem;color:#111}
pre{background:#0d1117;color:#e6edf3;padding:1rem;border-radius:8px;overflow-x:auto;font-size:.85rem}
.kv td{padding:.15rem .8rem .15rem 0;vertical-align:top;font-family:ui-monospace,monospace;font-size:.88rem}
.flags p{background:#fff7e6;border:1px solid #f0c36d;padding:.5rem .8rem;border-radius:6px}
footer{margin-top:2rem;color:#555}</style>
</head><body>
<h1>${escHtml(item.slug)}</h1>
<p>${escHtml(item.description || "")}</p>
<h2>${escHtml(price)} USDC · pay-per-call · no API key</h2>
<table class="kv">
<tr><td>Endpoint</td><td>${escHtml(item.method)} ${escHtml(item.endpoint_url)}</td></tr>
<tr><td>Price</td><td>${escHtml(price)} = ${escHtml(String(pr.amount))} micro-USDC (6 decimals)</td></tr>
<tr><td>Network</td><td>eip155:8453 (Base mainnet)</td></tr>
<tr><td>Asset</td><td>${escHtml(pr.asset)} (USDC v2)</td></tr>
<tr><td>payTo</td><td>${escHtml(pr.payTo)}</td></tr>
<tr><td>Facilitator</td><td>${escHtml((pr.extra && pr.extra.facilitator) || "—")}</td></tr>
<tr><td>Timeout</td><td>${escHtml(String(pr.maxTimeoutSeconds))} s</td></tr>
</table>
${flagHtml}
<h2>Buy in one copy-paste</h2>
<p>Plain POST first; payment second — that is the x402 handshake. The first
unpaid POST returns HTTP 402 with a <code>PAYMENT-REQUIRED</code> challenge;
sign a USDC EIP-3009 <code>transferWithAuthorization</code> for the challenge's
<code>accepts[0].amount</code> to its <code>payTo</code>, re-send with
<code>PAYMENT-SIGNATURE</code>.</p>
<pre><code>${escHtml(snippet)}</code></pre>
<h2>One-click (machine path)</h2>
<p>Any x402 v2 client can pay straight from the embedded block below: read it,
sign <code>amount</code> USDC to <code>payTo</code> on <code>network</code>,
re-POST the <code>resource.url</code> with <code>PAYMENT-SIGNATURE</code>.
Payment failed? Recovery recipes: <a href="/pay-failed">/pay-failed</a>.</p>
<h2>Try free first</h2>
<pre><code>curl -s https://${escHtml(item.host)}/sample</code></pre>
${embedPaymentRequirements(pr)}
<h2>Machine-readable</h2>
<pre><code>${escHtml(JSON.stringify(pr, null, 2))}</code></pre>
<p>Updated ${escHtml(page.json.updated_utc)} · JSON view: <a href="?format=json">?format=json</a></p>
<footer>Every wall on Base, USDC, no API keys — index at <a href="/buy"><code>/buy</code></a>.</footer>
</body></html>`;
}

// --- routes (registered ABOVE paymentMiddleware; free, never 402) ------------
app.get("/buy", async (req, res) => {
  const walls = await buildBuyIndex();
  const items = walls.flatMap((w) => w.items.map(buyItemJson));
  res.set("Cache-Control", "public, max-age=60");
  if (String(req.query.format || "").toLowerCase() === "json") {
    return res.json({ ok: true, free: true, service: "rae-fleet-router", page: "/buy index",
      generated_utc: new Date().toISOString(), count: items.length,
      canonical: { network: "eip155:8453", usdc: MAINNET_USDC, payTo: CANONICAL_PAY_TO },
      items });
  }
  res.type("text/html; charset=utf-8").send(renderBuyIndexHtml(walls.map((w) => ({ ...w, items: w.items.map((i) => i) })))) ;
});

app.get("/buy/:slug", async (req, res) => {
  const slug = decodeURIComponent(req.params.slug || "");
  const page = await buyPage(slug);
  res.set("Cache-Control", "public, max-age=60");
  if (page.code === 404) return res.status(404).json(page.json);
  if (page.code === 503) {
    res.set("Retry-After", BUY_RETRY_AFTER);
    return res.status(503).json(page.json);
  }
  if (String(req.query.format || "").toLowerCase() === "json") return res.json(page.json);
  res.type("text/html; charset=utf-8").send(renderBuyPageHtml(page.item, page));
});

// ---------------------------------------------------------------------------
// EXEC-41 — 400-before-402 pre-validation for the ladder routes.
// the handler cannot serve must never see a payment challenge: paying and then
// hitting the handler's 400 would charge the buyer without service. This
// middleware is registered ABOVE paymentMiddleware() so invalid requests
// short-circuit with 400 before the gate (matching suprapack-x402's observed
// live order and the STRAT-28 §5.1 promise for future pack routes). Scope is
// strictly the three /api/bundle/<id> ladder routes; valid bodies fall
// through to the unchanged 402 gate, and the flagship /api/fleet-bundle is
// untouched here (tracked separately). Validation mirrors the advertised
// BUNDLE_INPUT_SCHEMA machine contract: topic required (non-empty string);
// email_subject/email_body optional but type/length-checked when present.
const BUNDLE_ID_SET = new Set(BUNDLE_LADDER.map(b => b.id));
function bundleBodyErrors(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["JSON object body required"];
  }
  const errors = [];
  if (typeof body.topic !== "string" || body.topic.trim().length === 0) {
    errors.push("topic (non-empty string) required");
  }
  if (body.email_subject !== undefined && (typeof body.email_subject !== "string" || body.email_subject.length < 3)) {
    errors.push("email_subject must be a string of at least 3 characters when present");
  }
  if (body.email_body !== undefined && (typeof body.email_body !== "string" || body.email_body.length < 20)) {
    errors.push("email_body must be a string of at least 20 characters when present");
  }
  return errors;
}
app.use((req, res, next) => {
  if (req.method !== "POST") return next();
  const m = /^\/api\/bundle\/([^/]+)\/?$/.exec(req.path);
  if (!m || !BUNDLE_ID_SET.has(m[1])) return next();
  const errors = bundleBodyErrors(req.body);
  if (errors.length) {
    return res.status(400).json({
      ok: false,
      error: errors.join("; "),
      charged: false,
      "x-payment-challenge": false,
      expected: "topic (non-empty string); optional email_subject (>=3 chars), email_body (>=20 chars)",
      retry: "Fix the JSON body and re-send UNPAID — 400 responses are never billed. Machine contract: /openapi.json",
      "x-recovery": "https://rae-fleet-router.fly.dev/pay-failed",
    });
  }
  next();
});

app.use(paymentMiddleware(PAID_ROUTES, x402Server, undefined, undefined, false));

app.post("/api/fleet-bundle", async (req, res) => {
  const { topic, email_subject = "Quick question", email_body = "Hi, I wanted to reach out about our product." } = req.body || {};
  if (!topic || typeof topic !== "string") return res.status(400).json({ ok: false, error: "topic (string) required" });

  const bundle = {};
  bundle.nft_signals = await callFleetService("nft-alpha-x402", { collection: topic.toLowerCase().replace(/\s+/g, "-") });
  bundle.email_score = await callFleetService("power-pack-x402", { subject: email_subject, body: email_body });
  bundle.market_consensus = await callFleetService("tradingagents-x402", { ticker: topic.toUpperCase().replace(/\s+/g, "") });

  res.json({ ok: true, bundle, meta: { topic, services_called: 3, timestamp: new Date().toISOString() } });
});

for (const b of BUNDLE_LADDER) {
  app.post(`/api/bundle/${b.id}`, makeBundleHandler(b));
}

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`→ RAE Fleet Router listening on :${PORT} (payTo ${PAY_TO})`));
}

// Exported for test_bundle_ladder.cjs (STRAT-26 acceptance math),
// test_prevalidation.cjs (EXEC-41 charging-order acceptance),
// test_pay_failed.cjs (PLAN-32 recovery-surface acceptance), and
// test_buy_routes.cjs (EXEC-88 hosted pay-link acceptance).
module.exports = { app, BUNDLE_LADDER, bundleSumOfParts, PAID_ROUTES, FLEET, bundleBodyErrors, payFailedJson, payFailedMarkdown, payFailedModes, CANONICAL_PAY_TO, benchmarksJson, benchmarksMarkdown, BENCHMARK_SURVEY,
  BUY_WALLS, buySlugTail, microFromPrice, usdFromMicro, buyGuard, buyItemsFromManifest, buildBuyIndex, buyPage, extractEmbeddedPR, embedPaymentRequirements, buyCache, MAINNET_USDC };
