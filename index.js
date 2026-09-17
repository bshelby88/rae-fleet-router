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

// Downstream services (the fleet we're composing)
const FLEET = {
  "nft-alpha-x402": { url: "https://nft-alpha-x402.fly.dev/api/nft-signal", price: 20000 },
  "power-pack-x402": { url: "https://power-pack-x402.fly.dev/api/score-email", price: 10000 },
  "tradingagents-x402": { url: "https://tradingagents-x402.fly.dev/api/consensus", price: 100000 },
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

function registerDiscoveryEndpoints(serverApp, routes, serviceInfo) {
  const x402Manifest = { version: "2.0.0", service: { name: serviceInfo.name, description: serviceInfo.description, contact: "jadedfocus@gmail.com", operator: "Royal Agentic Enterprises" }, endpoints: {} };
  const openapi = { openapi: "3.1.0", info: { title: serviceInfo.title, description: serviceInfo.description, version: "1.0.0", contact: { email: "jadedfocus@gmail.com" },
    "x-guidance": "Call POST /api/fleet-bundle with JSON {topic: string, email_subject?: string, email_body?: string} to get a bundled research result from multiple RAE fleet services (nft-alpha, power-pack, tradingagents). Price $0.10 USDC on Base (eip155:8453) per call, pay-per-call via x402. Buyer owns signing; set a per-call spend ceiling; do not auto-retry paid calls." },
    paths: {} };
  for (const [rk, rv] of Object.entries(routes)) {
    const parts = rk.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const method = parts[0].toLowerCase(), path = parts[1];
    x402Manifest.endpoints[path] = { method: method.toUpperCase(), accepts: rv.accepts, description: rv.description, mimeType: rv.mimeType };
    if (!openapi.paths[path]) openapi.paths[path] = {};
    const rawPrice = rv.accepts && rv.accepts.price ? String(rv.accepts.price).replace("$","") : "0.10";
    openapi.paths[path][method] = {
      summary: rv.description ? rv.description.split(".")[0] : `Endpoint ${path}`,
      description: rv.description,
      "x-payment-info": { price: { mode: "fixed", currency: "USD", amount: Number(rawPrice).toFixed(6) }, protocols: [{ x402: {} }] },
      ...(rv.requestSchema ? { requestBody: { required: true, content: { "application/json": { schema: rv.requestSchema } } } } : {}),
      responses: { "200": { description: "Successful response", ...(rv.responseSchema ? { content: { "application/json": { schema: rv.responseSchema } } } : {}) }, "400": { description: "Invalid request (not charged)" }, "402": { description: "Payment Required" } },
    };
  }
  serverApp.get("/.well-known/x402.json", (req, res) => res.json(x402Manifest));
  serverApp.get("/.well-known/x402", (req, res) => res.json(x402Manifest));
  serverApp.get("/openapi.json", (req, res) => res.json(openapi));
  serverApp.get("/llms.txt", (req, res) => {
    res.type("text/plain").send(`${serviceInfo.title}\n${serviceInfo.description}\nPaid endpoints (x402, USDC on Base eip155:8453, pay-per-call, no API key):\n- POST /api/fleet-bundle: $0.10 USDC — Compose multiple RAE fleet services into one bundle.\nTo call: send without payment, read 402 PAYMENT-REQUIRED header, sign USDC transferWithAuthorization, re-send with PAYMENT-SIGNATURE header.\nMachine contract: /openapi.json and /.well-known/x402.`);
  });
}

registerDiscoveryEndpoints(app, { "POST /api/fleet-bundle": bundleRoute }, {
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

app.use(paymentMiddleware({ "POST /api/fleet-bundle": bundleRoute }, x402Server, undefined, undefined, false));

app.post("/api/fleet-bundle", async (req, res) => {
  const { topic, email_subject = "Quick question", email_body = "Hi, I wanted to reach out about our product." } = req.body || {};
  if (!topic || typeof topic !== "string") return res.status(400).json({ ok: false, error: "topic (string) required" });

  const bundle = {};
  bundle.nft_signals = await callFleetService("nft-alpha-x402", { collection: topic.toLowerCase().replace(/\s+/g, "-") });
  bundle.email_score = await callFleetService("power-pack-x402", { subject: email_subject, body: email_body });
  bundle.market_consensus = await callFleetService("tradingagents-x402", { topic });

  res.json({ ok: true, bundle, meta: { topic, services_called: Object.keys(FLEET).length, timestamp: new Date().toISOString() } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`→ RAE Fleet Router listening on :${PORT} (payTo ${PAY_TO})`));
