// STRAT-47 acceptance tests — GET /benchmarks free pricing-benchmark surface.
// Asserts: (1) GET /benchmarks returns 200 JSON, NEVER a 402 / PAYMENT-REQUIRED
// header (registered above paymentMiddleware); (2) payload carries the CDP
// facilitator baseline ($0 verification, 1,000 free settlements, $0.001 over),
// live-verified per-route prices as micro-USDC->USD floats, Bazaar census
// percentiles, under/over verdicts, and non-empty recommendations; (3) every
// canonical payTo reference equals CANONICAL_PAY_TO and network is one of
// eip155:8453/84532; (4) ?format=md (and Accept: text/markdown) serves
// markdown containing the table + recommendations; (5) /pricing.md and
// /llms.txt and /openapi.json advertise /benchmarks.
// Run: node test_benchmarks.cjs   (no secrets needed)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, CANONICAL_PAY_TO, benchmarksJson, benchmarksMarkdown, BENCHMARK_SURVEY } = require("./index.js");

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    // (1) free ungated JSON
    const rJ = await fetch(`${base}/benchmarks`);
    check("GET /benchmarks -> 200", rJ.status === 200, `got ${rJ.status}`);
    check("no 402", rJ.status !== 402);
    check("no PAYMENT-REQUIRED header", !rJ.headers.get("payment-required") && !rJ.headers.get("x-payment-required"));
    check("content-type JSON", String(rJ.headers.get("content-type") || "").includes("application/json"), rJ.headers.get("content-type"));
    const j = await rJ.json();
    // (2) payload integrity
    check("ok+free flags", j.ok === true && j.free === true);
    check("dated survey + authoritative note", /^\d{4}-\d{2}-\d{2}T/.test(j.generated_from || "") && /authoritative|source of truth/i.test(j.authoritative_price_note || ""));
    const d = j.data || {};
    check("CDP baseline", d.cdp_facilitator_baseline && d.cdp_facilitator_baseline.verification_usd === 0 && d.cdp_facilitator_baseline.settlement_over_tier_usd === 0.001 && /1,000/.test(d.cdp_facilitator_baseline.settlement_free_tier || ""));
    check("live-verified rows present", Array.isArray(d.live_verified_usd) && d.live_verified_usd.length >= 10, `n=${(d.live_verified_usd || []).length}`);
    const known = new Set(["eip155:8453", "eip155:84532"]);
    check("networks valid", (d.live_verified_usd || []).every((r) => known.has(r.network)));
    check("payTo flags all canonical", (d.live_verified_usd || []).every((r) => r.pay_to_matches_canonical === true) && d.canonical_pay_to === CANONICAL_PAY_TO);
    check("percentiles map present", d.market_baseline && d.market_baseline.percentiles && Object.keys(d.market_baseline.percentiles).length >= 10);
    check("verdicts both directions", d.verdicts && Array.isArray(d.verdicts.underpriced_or_negative_margin) && Array.isArray(d.verdicts.overpriced_for_observed_demand) && d.verdicts.underpriced_or_negative_margin.length >= 2 && d.verdicts.overpriced_for_observed_demand.length >= 1);
    check("recommendations non-empty", Array.isArray(d.recommendations) && d.recommendations.length >= 5);
    check("spot: dispute-forge $0.75 mainnet", (d.live_verified_usd || []).some((r) => r.service === "dispute-forge" && r.amount_usd === 0.75 && r.network === "eip155:8453"));
    check("spot: suprapack flagged testnet defect", (d.live_verified_usd || []).some((r) => r.service === "suprapack" && r.network === "eip155:84532" && r.defect));
    // (3) markdown view
    const rM = await fetch(`${base}/benchmarks?format=md`);
    check("GET /benchmarks?format=md -> 200 markdown", rM.status === 200 && String(rM.headers.get("content-type") || "").includes("text/markdown"), rM.headers.get("content-type"));
    const tM = await rM.text();
    check("markdown has table + recommendations + census baseline", /STRAT-47 Pricing Benchmark/.test(tM) && /\| Service \| Route \| Price \|/.test(tM) && /## Recommendations/.test(tM) && /Bazaar/.test(tM));
    const rA = await fetch(`${base}/benchmarks`, { headers: { Accept: "text/markdown" } });
    check("Accept: text/markdown honored", String(rA.headers.get("content-type") || "").includes("text/markdown"), rA.headers.get("content-type"));
    // (4) discovery-surface parity
    const pm = await (await fetch(`${base}/pricing.md`)).text();
    check("/pricing.md advertises /benchmarks", pm.includes("/benchmarks"));
    const llms = await (await fetch(`${base}/llms.txt`)).text();
    check("/llms.txt advertises /benchmarks", llms.includes("/benchmarks"));
    const oa = await (await fetch(`${base}/openapi.json`)).json();
    check("openapi documents /benchmarks", oa.paths && oa.paths["/benchmarks"] && oa.paths["/benchmarks"].get);
    // (5) module exports agree with HTTP payload
    check("exports parity", JSON.stringify(benchmarksJson().data) === JSON.stringify(j.data) && benchmarksMarkdown().length > 500 && JSON.stringify(BENCHMARK_SURVEY) === JSON.stringify(j.data));
  } finally {
    server.close();
  }
  console.log(failures ? `FAILURES: ${failures}` : "ALL PASS");
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
