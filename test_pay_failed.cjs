// PLAN-32 acceptance tests — GET /pay-failed recovery surface.
// Asserts: (1) GET /pay-failed returns 200 markdown containing all 4 failure
// modes + canonical payTo/network/USDC/facilitator; (2) ?format=json returns
// valid JSON with 4 modes, each carrying a machine-readable retry_recipe with
// endpoint, network, payTo, facilitator; (3) the 4xx (400) pre-validation
// response links to /pay-failed; (4) the free page is NEVER payment-gated
// (no PAYMENT-REQUIRED header) and /pricing.md + /llms.txt reference it.
// Run: node test_pay_failed.cjs   (no secrets needed — dummy env only)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, payFailedModes, CANONICAL_PAY_TO } = require("./index.js");

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  // (1) markdown-first page
  const rMd = await fetch(`${base}/pay-failed`);
  const md = await rMd.text();
  check("GET /pay-failed -> 200", rMd.status === 200, `got ${rMd.status}`);
  check("content-type is markdown", String(rMd.headers.get("content-type") || "").includes("text/markdown"), rMd.headers.get("content-type"));
  check("no payment challenge on free page", !rMd.headers.get("payment-required"));
  const modeChecks = {
    "Mode 1 — Wrong network": "wrong-network",
    "Mode 2 — payTo drift": "payto-drift",
    "Mode 3 — Insufficient balance": "insufficient-approval",
    "Mode 4 — Paid a stale price": "price-drift",
  };
  for (const [heading, modeId] of Object.entries(modeChecks)) {
    check(`markdown contains ${modeId} section`, md.includes(heading), heading);
  }
  check("markdown title is the recovery promise", md.includes("fix in 30 seconds"));
  check("markdown carries canonical payTo", md.includes(CANONICAL_PAY_TO));
  check("markdown carries network eip155:8453", md.includes("eip155:8453"));
  check("markdown carries mainnet USDC contract", md.includes("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"));
  check("markdown carries facilitator URL", md.includes("https://api.cdp.coinbase.com/platform/v2/x402"));
  check("markdown embeds fenced json recipes", (md.match(/```json/g) || []).length === 4, `count=${(md.match(/```json/g) || []).length}`);

  // (2) machine-readable JSON form
  const rJson = await fetch(`${base}/pay-failed?format=json`);
  check("GET /pay-failed?format=json -> 200", rJson.status === 200, `got ${rJson.status}`);
  let j = null;
  try { j = await rJson.json(); check("json parses", true); } catch (e) { check("json parses", false, e.message); }
  if (j) {
    check("json.ok true", j.ok === true);
    check("json has 4 modes", Array.isArray(j.modes) && j.modes.length === 4, `len=${j.modes && j.modes.length}`);
    const ids = (j.modes || []).map((m) => m.id).join(",");
    check("mode ids exact", ids === "wrong-network,payto-drift,insufficient-approval,price-drift", ids);
    let allRecipes = true;
    for (const m of j.modes) {
      const rr = m.retry_recipe || {};
      if (!rr.resource || rr.network !== "eip155:8453" || rr.payTo !== CANONICAL_PAY_TO || !rr.facilitator) {
        allRecipes = false;
        check(`recipe complete for ${m.id}`, false, JSON.stringify(rr));
      }
    }
    check("every mode recipe has endpoint+network+payTo+facilitator", allRecipes);
    check("json.canonical payTo exact", j.canonical && j.canonical.payTo === CANONICAL_PAY_TO);
  }

  // (3) a captured 4xx links to the page
  const r400 = await fetch(`${base}/api/bundle/market-starter`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
  });
  check("invalid-body 4xx -> 400", r400.status === 400, `got ${r400.status}`);
  const j400 = await r400.json();
  check("400 body links to /pay-failed", String(j400["x-recovery"] || "").includes("/pay-failed"), j400["x-recovery"]);

  // (4) discovery surfaces reference the page
  const rPricing = await fetch(`${base}/pricing.md`);
  check("/pricing.md references /pay-failed", (await rPricing.text()).includes("/pay-failed"));
  const rLlms = await fetch(`${base}/llms.txt`);
  check("/llms.txt references /pay-failed", (await rLlms.text()).includes("/pay-failed"));
  const rOapi = await fetch(`${base}/openapi.json`);
  const oapi = await rOapi.json();
  check("openapi documents /pay-failed", !!(oapi.paths && oapi.paths["/pay-failed"] && oapi.paths["/pay-failed"].get));

  // source-consistency: modes fn returns exactly 4, all strings non-empty
  const modes = payFailedModes();
  check("payFailedModes() length 4", modes.length === 4);
  check("every mode has symptom/cause/fix[]", modes.every((m) => m.symptom && m.cause && Array.isArray(m.fix) && m.fix.length >= 2));

  server.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS (PLAN-32)");
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error("CRASH", e); process.exit(1); });
