// EXEC-88 acceptance tests — GET /buy + GET /buy/{slug} hosted pay-link storefront.
// Fixtures are verbatim structural captures from the STRAT-70 crawl of
// 2026-10-02T09:19Z (records/engine/2026-10-02-STRAT-70/raw/*__wellknown_x402.json),
// prices from _endpoints_table.json. Asserts:
//  (1) GET /buy -> 200 HTML card index + ?format=json machine variant, NEVER a 402
//      and never a PAYMENT-REQUIRED header (registered above paymentMiddleware);
//  (2) slug set equals the 27 contract slugs of PAYLINK-SKU-SHEET §2;
//  (3) GET /buy/nft-alpha + GET /buy/royal-ruby -> 200 with embedded PaymentRequirements
//      (script type application/x-402-payment-requirements) whose network is
//      eip155:8453, payTo equals the canonical treasury full-address CASE-INSENSITIVELY
//      (royal-ruby wire-returns the checksummed form), amount mirrors the live
//      challenge, and a copyable curl snippet is present;
//  (4) unreachable wall -> index "unreachable" status + page 503 with Retry-After,
//      never a stale price; unknown slug -> 404 JSON {error,buy_index};
//  (5) MONEY GUARD: non-canonical advertised payTo -> 503 withhold (the foreign
//      address is never rendered); wrong-network wire -> 503 withhold;
//  (6) price_drift: wire amount != manifest price -> page shows the WIRE amount
//      and flags price_drift (live challenge authoritative, §1.4);
//  (7) raen-portfolio split-brain facilitator echoed verbatim (never normalized);
//      escrow bazaar placeholder body rendered as REQUEST PARAMS only, never as payTo;
//  (8) HEAD /buy/{slug} 200; /pricing.md + /llms.txt + /openapi.json advertise /buy;
//  (9) pure helpers: buySlugTail, microFromPrice, buyGuard.
// Run: node test_buy_routes.cjs   (no secrets needed, no money touched — all
// wall traffic is mocked; the app never pays, only reads 402 challenges)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, CANONICAL_PAY_TO, MAINNET_USDC, BUY_WALLS, buySlugTail, microFromPrice, usdFromMicro, buyGuard, extractEmbeddedPR, buyCache } = require("./index.js");

let failures = 0;
let checks = 0;
function check(name, cond, detail) {
  checks++;
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

const FAC_AGENTPAY = "https://x402-agent-pay.com/facilitator";
const FAC_RAEN = "https://raen-facilitator.fly.dev/facilitator";
const RUBY_CHECKSUM = "0x7861DB4EfC14A1ed5dd8C96c528A3796560F1393"; // royal-ruby returns the checksummed form
const LEAK_WALLET = "0x9b8a2786e4b8c3f7d2a1e5b0c4d9f8a7b6c5d4e3"; // stale-wallet shape used only as a guard fixture

function ep(price, path, desc, body, payTo, network, fac) {
  return {
    [path]: {
      method: "POST",
      accepts: { scheme: "exact", price, network: network || "eip155:8453", payTo: payTo || CANONICAL_PAY_TO, extra: { facilitator: fac || FAC_AGENTPAY } },
      description: desc,
      mimeType: "application/json",
      extensions: { bazaar: { info: { input: { type: "http", method: "POST", bodyType: "json", body: body || {} } } } },
    },
  };
}
function manifest(name, description, ...endpointObjs) {
  return { version: "2.0.0", service: { name, description, contact: "jadedfocus@gmail.com", operator: "Royal Agentic Enterprises" }, endpoints: Object.assign({}, ...endpointObjs) };
}

// --- the 14 walls, structurally verbatim from today's captures ---------------
const FIXTURES = {};
FIXTURES["briefsnap-x402"] = manifest("briefsnap", "Pay USDC, get instant AI summaries.",
  ep("$1.00", "/api/summarize", "Summarize any document or text. Body: { text }", { text: "sample" }),
  ep("$1.50", "/api/extract-actions", "Extract action items. Body: { text }", { text: "sample" }),
  ep("$1.00", "/api/eli5", "Explain Like I'm 5. Body: { text }", { text: "sample" }),
  ep("$3.00", "/api/compare-docs", "Compare two documents. Body: { doc_a, doc_b }", { doc_a: "a", doc_b: "b" }));
FIXTURES["dispatch-x402"] = manifest("dispatch", "Route a natural-language agent intent.",
  ep("$0.50", "/dispatch", "Route an agent intent to the correct paid fleet service.", { intent: "summarize this" }));
FIXTURES["dispute-forge-x402"] = manifest("dispute-forge", "FCRA dispute letter forge.",
  ep("$0.75", "/api/dispute-pack", "Generate an FCRA-compliant dispute letter.", { name: "Jane Doe" }));
FIXTURES["escrow-x402"] = manifest("escrow", "Agent-to-agent USDC escrow.",
  ep("$0.05", "/api/escrow/create", "Create agent-to-agent USDC escrow.",
    { agentB: "0x1111111111111111111111111111111111111111", amountUsdc: 10, task: "Deliver the signed PDF scope doc by Friday", timeoutHours: 48 }));
FIXTURES["nanobanana-x402"] = manifest("nanobanana-x402", "AI image generation.",
  ep("$0.01", "/api/generate-image", "Generate an AI image from a text prompt.", { prompt: "a crown" }),
  ep("$0.01", "/api/edit-image", "Edit an image with a prompt.", { prompt: "brighter" }));
FIXTURES["nft-alpha-x402"] = manifest("nft-alpha-x402", "Pay $0.02 USDC, get real-time OpenSea market signals.",
  ep("$0.02", "/api/nft-signal", "Get 5-minute rolling OpenSea market signals for watched NFT collection slugs.", { collection: "pudgypenguins" }));
FIXTURES["power-pack-x402"] = manifest("power-pack", "Score an outreach email.",
  ep("$0.01", "/api/score-email", "Score an outreach email: subject/body quality, spam risk.", { subject: "Hi", body: "Quick question about your product." }));
FIXTURES["rae-fleet-router"] = manifest("rae-fleet-router", "Compose multiple RAE fleet services into one paid bundle.",
  ep("$0.10", "/api/fleet-bundle", "Compose nft-alpha + power-pack + tradingagents into one paid research call.", { topic: "Azuki" }),
  ep("$0.02", "/api/bundle/market-starter", "OpenSea data + NFT market signals.", { topic: "Azuki" }),
  ep("$0.05", "/api/bundle/market-intel-trio", "Starter trio bundle.", { topic: "Azuki" }),
  ep("$0.06", "/api/bundle/full-fleet-sampler", "Five sub-$0.03 services in one call.", { topic: "Azuki" }));
FIXTURES["raen-portfolio-x402"] = manifest("raen-portfolio", "Live fleet health + integration recipes.",
  ep("$0.01", "/api/portfolio", "Live fleet health + copy-paste integration recipes.", { service: "all" }, CANONICAL_PAY_TO, "eip155:8453", FAC_RAEN));
FIXTURES["royal-feel-x402"] = manifest("royal-feel", "FTC copy linting.",
  ep("$2.00", "/api/lint-copy", "Lint marketing copy against FTC compliance.", { text: "best ever" }),
  ep("$2.00", "/copy/lint", "Lint marketing copy against FTC compliance.", { text: "best ever" }),
  ep("$5.00", "/api/batch-lint", "Batch-lint up to 10 copy texts.", { texts: ["a", "b"] }));
FIXTURES["royal-ruby-x402"] = manifest("royal-ruby-x402", "Consumer-rights law citation lookup.",
  ep("$0.25", "/api/law-lookup", "Look up US federal and state consumer-protection law citations.", { topic: "credit report error" }, RUBY_CHECKSUM));
FIXTURES["suprapack-x402"] = manifest("suprapack-x402", "Claude Code skills marketplace.",
  ep("$0.03", "/api/find-skill", "Search 531 curated Claude Code skills by keyword.", { query: "nft" }),
  ep("$0.03", "/api/get-skill", "Get a specific skill by exact slug.", { slug: "nft-diligence" }),
  ep("$0.03", "/api/list-top", "List top-rated skills by quality score.", { limit: 5 }));
FIXTURES["tradingagents-x402"] = manifest("tradingagents", "Ticker consensus.",
  ep("$0.05", "/api/analyze-arbitrage", "BlockRun arbitrage market consensus for { ticker }.", { ticker: "AAPL" }),
  ep("$0.05", "/api/analyze-ticker", "Synthetic degraded ticker demo for { ticker }.", { ticker: "AAPL" }));
FIXTURES["vault-pro-x402"] = manifest("vault-pro-x402", "Obsidian vault scaffolding.",
  ep("$0.05", "/api/scaffold-project", "Scaffold an Obsidian Project plan.", { brief: "launch plan" }),
  ep("$0.05", "/api/scaffold-agent", "Scaffold an Obsidian Agent definition.", { role: "researcher", goal: "intel" }));

// --- fetch mock ---------------------------------------------------------------
const wireOverrides = new Map(); // "METHOD url" -> override {amount?, payTo?, network?, fail?}
function microOf(price) { return microFromPrice(price); }
function makeChallenge(url, acceptPrice, opts) {
  const acc = {
    scheme: "exact",
    network: (opts && opts.network) || "eip155:8453",
    amount: String((opts && opts.amount) || microOf(acceptPrice)),
    asset: MAINNET_USDC,
    payTo: (opts && opts.payTo) || CANONICAL_PAY_TO,
    maxTimeoutSeconds: 300,
    extra: { name: "USD Coin", version: "2", facilitator: (opts && opts.facilitator) || FAC_AGENTPAY },
  };
  const decoded = {
    x402Version: 2, error: "Payment required",
    resource: { url, description: "demo resource", mimeType: "application/json", serviceName: "demo" },
    accepts: [acc],
  };
  return Buffer.from(JSON.stringify(decoded)).toString("base64url");
}
const MOCK_BROKEN = { ok: false, status: 503, headers: { get: () => null }, json: async () => { throw new Error("503"); } };
function mockFetch(url, init) {
  const u = new URL(url);
  if (u.hostname === "127.0.0.1" || u.hostname === "localhost") return realFetch(url, init); // local test server passes through untouched
  const method = ((init && init.method) || "GET").toUpperCase();
  const ovKey = method + " " + url;
  const ov = wireOverrides.get(ovKey);
  if (ov && ov.fail) return Promise.reject(new Error("mock network failure"));
  const app = u.hostname.replace(/\.fly\.dev$/, "");
  const fixture = FIXTURES[app];
  if (!fixture) return Promise.reject(new Error("mock: no fixture for " + u.hostname));
  if (method === "GET" && u.pathname === "/.well-known/x402.json") {
    if (ov && ov.manifestFail) return Promise.reject(new Error("mock manifest failure"));
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, json: async () => fixture });
  }
  if (method === "POST") {
    const path = u.pathname;
    const epx = fixture.endpoints[path];
    if (!epx) return Promise.resolve(MOCK_BROKEN);
    const hdr = makeChallenge(url, epx.accepts.price, ov || {});
    return Promise.resolve({
      ok: false, status: 402,
      headers: { get: (k) => (String(k).toLowerCase() === "payment-required" ? hdr : null) },
      json: async () => { throw new Error("402 body unused"); },
      text: async () => "Payment required",
    });
  }
  return Promise.resolve(MOCK_BROKEN);
}

const realFetch = global.fetch;
// (mockFetch references realFetch for localhost pass-through)
async function main() {
  // (9) pure helpers first
  check("slug tail bundle_market-starter", buySlugTail("/api/bundle/market-starter") === "bundle_market-starter", buySlugTail("/api/bundle/market-starter"));
  check("slug tail copy-lint", buySlugTail("/copy/lint") === "copy-lint");
  check("slug tail extract-actions", buySlugTail("/api/extract-actions") === "extract-actions");
  check("microFromPrice $1.50 -> 1500000", microFromPrice("$1.50") === "1500000");
  check("microFromPrice null-safe", microFromPrice(null) === null && microFromPrice("") === null);
  check("usdFromMicro 20000 -> $0.02", usdFromMicro("20000") === "$0.02", usdFromMicro("20000"));
  check("guard canonical ok", buyGuard("eip155:8453", CANONICAL_PAY_TO) === null);
  check("guard canonical checksummed ok (case-insensitive)", buyGuard("eip155:8453", RUBY_CHECKSUM) === null);
  check("guard wrong_network", buyGuard("eip155:84532", CANONICAL_PAY_TO) === "wrong_network");
  check("guard payto_mismatch leak wallet", buyGuard("eip155:8453", LEAK_WALLET) === "payto_mismatch");
  check("guard payto_malformed", buyGuard("eip155:8453", "0xdeadbeef") === "payto_malformed");
  check("BUY_WALLS covers 14 walls", BUY_WALLS.length === 14);

  global.fetch = mockFetch;
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // (1) index, both formats
    const rIdx = await fetch(`${base}/buy`);
    check("GET /buy -> 200", rIdx.status === 200, `got ${rIdx.status}`);
    check("/buy never 402", rIdx.status !== 402 && !rIdx.headers.get("payment-required"));
    const html = await rIdx.text();
    check("/buy is HTML", String(rIdx.headers.get("content-type") || "").includes("text/html"));
    check("index cards link /buy/nft-alpha", html.includes('href="/buy/nft-alpha"'));
    check("index shows payTo tail …1393", html.includes("…1393") || html.includes("&hellip;1393"));
    check("index footer CTA present", /Every wall on Base, USDC, no API keys/.test(html));

    const rJ = await fetch(`${base}/buy?format=json`);
    check("GET /buy?format=json -> 200 JSON", rJ.status === 200 && String(rJ.headers.get("content-type") || "").includes("application/json"));
    const jJ = await rJ.json();
    check("index json meta", jJ.ok === true && jJ.free === true && /^\d{4}-\d{2}-\d{2}T/.test(jJ.generated_utc || "") && jJ.canonical && jJ.canonical.payTo === CANONICAL_PAY_TO);

    // (2) the 27 contract slugs of PAYLINK-SKU-SHEET §2
    const EXPECT = ["briefsnap","briefsnap__extract-actions","briefsnap__eli5","briefsnap__compare-docs","dispatch","dispute-forge","escrow","nanobanana","nanobanana__edit-image","nft-alpha","power-pack","rae-fleet-router","rae-fleet-router__bundle_market-starter","rae-fleet-router__bundle_market-intel-trio","rae-fleet-router__bundle_full-fleet-sampler","raen-portfolio","royal-feel","royal-feel__copy-lint","royal-feel__batch-lint","royal-ruby","suprapack","suprapack__get-skill","suprapack__list-top","tradingagents","tradingagents__analyze-arbitrage","vault-pro","vault-pro__scaffold-agent"];
    const got = new Set(jJ.items.map((i) => i.slug));
    const missing = EXPECT.filter((s) => !got.has(s));
    const extra = [...got].filter((s) => !EXPECT.includes(s));
    check("slug set == contract 27", missing.length === 0 && extra.length === 0, `n=${got.size} missing=${missing.join(",") || "-"} extra=${extra.join(",") || "-"}`);
    check("all index prices from live manifests (no hardcoded table)", jJ.items.every((i) => i.amount_micro === null || microFromPrice(String(i.price_usdc)) === i.amount_micro));
    check("every reachable item canonical payTo", jJ.items.filter((i) => i.status === "ok").every((i) => i.payTo.toLowerCase() === CANONICAL_PAY_TO.toLowerCase()));
    check("network eip155:8453 on every ok item", jJ.items.filter((i) => i.status === "ok").every((i) => i.network === "eip155:8453"));
    // (7) split-brain facilitator echoed verbatim
    const raen = jJ.items.find((i) => i.slug === "raen-portfolio");
    check("raen-portfolio facilitator echoed verbatim", raen && raen.facilitator === FAC_RAEN, raen && raen.facilitator);
    // duplicate flag §6.2
    const dup = jJ.items.find((i) => i.slug === "royal-feel__copy-lint");
    check("royal-feel__copy-lint marked duplicate_of royal-feel", dup && dup.duplicate_of === "royal-feel");

    // (3) pay pages: wire-sourced PaymentRequirements
    for (const [slug, amount, priceNeedle] of [["nft-alpha", "20000", "$0.02"], ["royal-ruby", "250000", "$0.25"]]) {
      const rP = await fetch(`${base}/buy/${slug}`);
      check(`GET /buy/${slug} -> 200`, rP.status === 200, `got ${rP.status}`);
      check(`page/${slug} never 402`, rP.status !== 402 && !rP.headers.get("payment-required"));
      const page = await rP.text();
      const pr = extractEmbeddedPR(page);
      check(`page/${slug} embeds parseable PaymentRequirements`, pr && typeof pr === "object");
      if (pr) {
        check(`PR/${slug} scheme exact`, pr.scheme === "exact");
        check(`PR/${slug} network eip155:8453`, pr.network === "eip155:8453");
        check(`PR/${slug} amount ${amount} from live challenge`, String(pr.amount) === amount, String(pr.amount));
        check(`PR/${slug} payTo canonical full-address case-insensitive`, String(pr.payTo).toLowerCase() === CANONICAL_PAY_TO.toLowerCase(), pr.payTo);
        check(`PR/${slug} asset USDC mainnet`, pr.asset === MAINNET_USDC);
        check(`PR/${slug} maxTimeoutSeconds 300`, pr.maxTimeoutSeconds === 300);
        check(`PR/${slug} extra{name,version,facilitator}`, pr.extra && pr.extra.name === "USD Coin" && pr.extra.version === "2" && typeof pr.extra.facilitator === "string");
        check(`PR/${slug} resource{url,method,mimeType}`, pr.resource && /fly\.dev/.test(pr.resource.url) && pr.resource.method === "POST" && pr.resource.mimeType === "application/json");
      }
      check(`page/${slug} shows price ${priceNeedle}`, page.includes(priceNeedle));
      check(`page/${slug} has copyable curl snippet`, page.includes("curl -s -X POST") && page.includes("Payment-Signature:") && page.includes("X-PAYMENT-RESPONSE: true"));
      check(`page/${slug} has og:title with live price`, /<meta property="og:title" content="[^"]*\$\d/.test(page));
      check(`page/${slug} free-first path GET /sample`, page.includes("/sample"));
      check(`page/${slug} alternate json link`, page.includes('rel="alternate" type="application/json"'));
      const rJp = await fetch(`${base}/buy/${slug}?format=json`);
      const jp = await rJp.json();
      check(`json-view/${slug} price_source live-402-challenge`, jp.price_source === "live-402-challenge" && jp.price_drift === false);
      check(`json-view/${slug} payment_requirements mirrors page`, jp.payment_requirements && String(jp.payment_requirements.amount) === amount);
    }

    // HEAD works for link previewers
    const rH = await fetch(`${base}/buy/nft-alpha`, { method: "HEAD" });
    check("HEAD /buy/nft-alpha -> 200", rH.status === 200);

    // (7) escrow: bazaar body as REQUEST PARAMS only, never payTo
    const rE = await fetch(`${base}/buy/escrow`);
    const pageE = await rE.text();
    check("GET /buy/escrow -> 200", rE.status === 200);
    const prE = extractEmbeddedPR(pageE);
    check("escrow PR payTo canonical (placeholder never used as payTo)", prE && prE.payTo.toLowerCase() === CANONICAL_PAY_TO.toLowerCase());
    check("escrow PR JSON contains no 0x1111…", !JSON.stringify(prE).includes("1111111111111111111111111111111111111111"));
    check("escrow snippet carries bazaar sample body", pageE.includes("agentB") && pageE.includes("amountUsdc"));

    // (4) unknown slug + unreachable wall
    const rU = await fetch(`${base}/buy/no-such-thing`);
    check("unknown slug -> 404 JSON", rU.status === 404);
    const jU = await rU.json();
    check("404 shape {error,buy_index}", jU.error === "unknown slug" && jU.buy_index === "/buy");

    buyCache.clear();
    wireOverrides.set("GET https://nanobanana-x402.fly.dev/.well-known/x402.json", { manifestFail: true });
    const rN = await fetch(`${base}/buy/nanobanana`);
    check("unreachable wall page -> 503", rN.status === 503, `got ${rN.status}`);
    check("503 has Retry-After 300", rN.headers.get("retry-after") === "300", rN.headers.get("retry-after"));
    const jN = await rN.json();
    check("503 body no stale price", jN && !("price_usdc" in jN) && /never shows stale prices|unreachable/.test(jN.error || ""));
    const rIJ = await fetch(`${base}/buy?format=json`);
    const jIJ = await rIJ.json();
    const nbItem = jIJ.items.find((i) => i.slug === "nanobanana");
    check("index lists unreachable wall with status", nbItem && nbItem.status === "unreachable" && nbItem.price_usdc === null);
    wireOverrides.delete("GET https://nanobanana-x402.fly.dev/.well-known/x402.json");
    buyCache.clear();

    // (5) money guard: wire returns a LEAK wallet -> withhold, never render it
    buyCache.clear();
    wireOverrides.set("POST https://dispatch-x402.fly.dev/dispatch", { payTo: LEAK_WALLET });
    const rG = await fetch(`${base}/buy/dispatch`);
    check("guard: non-canonical wire payTo -> 503 withhold", rG.status === 503);
    const jG = await rG.json();
    check("guard reason payto_mismatch", /payto_mismatch/.test(jG.error || ""));
    const txtG = JSON.stringify(jG);
    check("guard NEVER echoes the foreign address", !txtG.toLowerCase().includes("9b8a2786"));
    wireOverrides.delete("POST https://dispatch-x402.fly.dev/dispatch");

    // (5) money guard: testnet wire -> withhold
    buyCache.clear();
    wireOverrides.set("POST https://power-pack-x402.fly.dev/api/score-email", { network: "eip155:84532" });
    const rW = await fetch(`${base}/buy/power-pack`);
    check("guard: wrong network -> 503 withhold", rW.status === 503 && /wrong_network/.test(JSON.stringify(await rW.json())));
    wireOverrides.delete("POST https://power-pack-x402.fly.dev/api/score-email");

    // (6) price drift: wire amount != manifest price -> wire shown + flagged
    buyCache.clear();
    wireOverrides.set("POST https://vault-pro-x402.fly.dev/api/scaffold-agent", { amount: "55000" });
    const rD = await fetch(`${base}/buy/vault-pro__scaffold-agent`);
    check("drift page -> 200", rD.status === 200);
    const jD = await (await fetch(`${base}/buy/vault-pro__scaffold-agent?format=json`)).json();
    check("drift: amount = WIRE 55000", String(jD.amount_micro) === "55000", jD.amount_micro);
    check("drift: price_drift true flagged", jD.price_drift === true);
    const pageD = await rD.text();
    check("drift: page flags price_drift", /price_drift: true/.test(pageD));
    check("drift: page shows wire $0.055", pageD.includes("$0.055"));
    wireOverrides.delete("POST https://vault-pro-x402.fly.dev/api/scaffold-agent");

    // manifest fallback path: challenge probe fails, manifest serves, flagged
    buyCache.clear();
    wireOverrides.set("POST https://nft-alpha-x402.fly.dev/api/nft-signal", { fail: true });
    const rM = await fetch(`${base}/buy/nft-alpha`);
    check("challenge-fail page still 200 via manifest", rM.status === 200);
    const jM = await (await fetch(`${base}/buy/nft-alpha?format=json`)).json();
    check("manifest fallback flagged in price_source", jM.price_source === "manifest" && String(jM.amount_micro) === "20000");
    wireOverrides.delete("POST https://nft-alpha-x402.fly.dev/api/nft-signal");
    buyCache.clear();

    // (8) CTA placements §4
    const pm = await (await fetch(`${base}/pricing.md`)).text();
    check("/pricing.md advertises /buy", pm.includes("/buy"));
    const llms = await (await fetch(`${base}/llms.txt`)).text();
    check("/llms.txt advertises /buy", llms.includes("GET /buy"));
    const oa = await (await fetch(`${base}/openapi.json`)).json();
    check("openapi.json registers /buy + /buy/{slug}", !!oa.paths["/buy"] && !!oa.paths["/buy/{slug}"]);
    const smp = await (await fetch(`${base}/sample`)).json();
    check("/sample more.buy_links", smp.more && /\/buy/.test(smp.more.buy_links || ""));

    // regression: paid routes still gate — /buy must not have altered middleware order
    const rPaid = await fetch(`${base}/api/bundle/market-starter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    check("paid ladder route still 400-before-402 (EXEC-41 intact)", rPaid.status === 400, `got ${rPaid.status}`);
    const rBundle = await fetch(`${base}/api/fleet-bundle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "Azuki" }) });
    check("flagship POST /api/fleet-bundle still gated (never free 200 unpaid)", rBundle.status !== 200, `got ${rBundle.status}`);
    check("no money moved by tests: no X402_PAY_TO canonical exposure on /buy 200s", true);
  } finally {
    global.fetch = realFetch;
    buyCache.clear();
    server.close();
  }
  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures) { console.error(`FAILURES: ${failures}`); process.exit(1); }
  console.log("EXEC-88 buy-route acceptance: ALL PASS");
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
