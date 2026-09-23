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
  accepts: { scheme: "exact", price: "$0.10", network: NETWORK, payTo: PAY_TO },
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
    "Machine contract: [/openapi.json](https://rae-fleet-router.fly.dev/openapi.json) and",
    "[/.well-known/x402.json](https://rae-fleet-router.fly.dev/.well-known/x402.json). The live",
    "x402 payment challenge is authoritative if a configured price changes.",
    "",
    "Payment failed? **GET [/pay-failed](https://rae-fleet-router.fly.dev/pay-failed)** —",
    "\"fix in 30 seconds\" recovery recipes for the 4 real failure modes (machine-readable",
    "at /pay-failed?format=json).",
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
    res.type("text/plain").send(`${serviceInfo.title}\n${serviceInfo.description}\nPaid endpoints (x402, USDC on Base eip155:8453, pay-per-call, no API key):\n${lines.join("\n")}\nEvery curated bundle above is priced strictly below the sum of its live per-call parts (see /pricing.md).\nTo call: send without payment, read 402 PAYMENT-REQUIRED header, sign USDC transferWithAuthorization, re-send with PAYMENT-SIGNATURE header.\nMachine contract: /openapi.json and /.well-known/x402.\nPayment failed? GET /pay-failed (markdown) or /pay-failed?format=json — 30-second recovery recipes for the 4 real x402 failure modes (wrong network, payTo drift, insufficient balance/expired approval, stale price).`);
  });
}

// One routes map feeds the manifest, OpenAPI, llms.txt, paymentMiddleware, and the
// Express handlers — registered price and advertised price cannot diverge.
const PAID_ROUTES = { "POST /api/fleet-bundle": bundleRoute };
for (const b of BUNDLE_LADDER) {
  PAID_ROUTES[`POST /api/bundle/${b.id}`] = {
    accepts: { scheme: "exact", price: b.price, network: NETWORK, payTo: PAY_TO },
    description: b.desc,
    mimeType: "application/json",
    requestSchema: BUNDLE_INPUT_SCHEMA,
    responseSchema: BUNDLE_OUTPUT_SCHEMA,
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

// ---------------------------------------------------------------------------
// EXEC-41 — 400-before-402 pre-validation for the ladder routes. A body that
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
// test_prevalidation.cjs (EXEC-41 charging-order acceptance), and
// test_pay_failed.cjs (PLAN-32 recovery-surface acceptance).
module.exports = { app, BUNDLE_LADDER, bundleSumOfParts, PAID_ROUTES, FLEET, bundleBodyErrors, payFailedJson, payFailedMarkdown, payFailedModes, CANONICAL_PAY_TO };
