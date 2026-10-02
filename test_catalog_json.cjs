// EXEC-32 — GET /catalog.json acceptance test (helper-only; no Express route call).
// Asserts: exported catalogWallItems function shapes items correctly.
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const assert = require("assert");

const { catalogWallItems, BUY_WALLS, CANONICAL_PAY_TO, MAINNET_USDC } = require("./index.js");

let failures = 0;

function check(label, ok) {
  if (ok) { console.log("PASS", label); return; }
  console.error("FAIL", label);
  failures++;
}

// 1) catalogWallItems produces expected shape from a BUY_WALLS config
const items = catalogWallItems([
  { slug: "nft-alpha", host: "nft-alpha-x402.fly.dev", endpoint: "/api/nft-signal", method: "POST",
    price_usdc: 0.02, amount_micro: "20000", network: "eip155:8453", payTo: CANONICAL_PAY_TO,
    asset: MAINNET_USDC, facilitator: "https://x402-agent-pay.com/facilitator",
    description: "NFT market signals", duplicate_of: null, status: "ok",
    endpoint_url: "https://nft-alpha-x402.fly.dev/api/nft-signal" },
  { slug: "briefsnap", host: "briefsnap-x402.fly.dev", endpoint: "/api/summarize", method: "POST",
    price_usdc: 1.00, amount_micro: "1000000", network: "eip155:8453", payTo: CANONICAL_PAY_TO,
    asset: MAINNET_USDC, facilitator: "https://x402-agent-pay.com/facilitator",
    description: "Document summarization", duplicate_of: null, status: "ok",
    endpoint_url: "https://briefsnap-x402.fly.dev/api/summarize" },
], "nft-alpha");

check("returns array of 2", items.length === 2);
check("first slug = nft-alpha", items[0].slug === "nft-alpha");
check("first host_name = nft-alpha", items[0].host_name === "nft-alpha");
check("first price_usdc = 0.02", items[0].price_usdc === 0.02);
check("first amount_micro = 20000", items[0].amount_micro === "20000");
check("first network = eip155:8453", items[0].network === "eip155:8453");
check("first payTo matches canonical", items[0].payTo === CANONICAL_PAY_TO);
check("first method = POST", items[0].method === "POST");
check("first status = ok", items[0].status === "ok");
check("first host = nft-alpha-x402.fly.dev", items[0].host === "nft-alpha-x402.fly.dev");
check("first endpoint = /api/nft-signal", items[0].endpoint === "/api/nft-signal");
check("second slug = briefsnap", items[1].slug === "briefsnap");
check("second host_name = nft-alpha (from arg, not each item)", items[1].host_name === "nft-alpha");
check("second price_usdc = 1.00", items[1].price_usdc === 1.00);
check("second amount_micro = 1000000", items[1].amount_micro === "1000000");

// 2) Empty input
const empty = catalogWallItems([], "test-host");
check("empty input returns []", Array.isArray(empty) && empty.length === 0);

// 3) Import shape checks
check("BUY_WALLS is array", Array.isArray(BUY_WALLS));
check("BUY_WALLS has entries", BUY_WALLS.length > 0);
check("BUY_WALLS[0] has slug", typeof BUY_WALLS[0].slug === "string");
check("CANONICAL_PAY_TO is 42-char hex", /^0x[a-f0-9]{40}$/i.test(CANONICAL_PAY_TO));

console.log("---");
console.log(failures ? `FAIL: ${failures} failure(s)` : "ALL PASS");
process.exit(failures ? 1 : 0);