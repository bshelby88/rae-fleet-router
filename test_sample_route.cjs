// EXEC-35 acceptance tests — GET /sample free synthetic bundle-compose demo
// + /pricing.md payment-parameter parity (price $0.10, network eip155:8453,
// canonical payTo). Asserts: (1) GET /sample returns 200 JSON, NEVER a 402 /
// PAYMENT-REQUIRED header (route registered above paymentMiddleware);
// (2) body is clearly marked synthetic (free/sample flags, sample_note,
// _synthetic_demo in every leg), shape-accurate to the paid envelope
// (ok, bundle_id, bundle.<leg>.{status,body}, meta.services_called);
// (3) demonstrating block carries endpoint + price + eip155:8453 + canonical
// payTo; how_to_buy has 4 steps; no downstream call is possible (no network
// egress needed — dummy env only); (4) /pricing.md lists $0.10, eip155:8453,
// canonical payTo and links /sample; /llms.txt + openapi.json reference
// /sample. Run: node test_sample_route.cjs   (no secrets needed)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, CANONICAL_PAY_TO, BUNDLE_LADDER } = require("./index.js");

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  // (1) free, ungated 200
  const rS = await fetch(`${base}/sample`);
  check("GET /sample -> 200", rS.status === 200, `got ${rS.status}`);
  check("no 402 on /sample", rS.status !== 402);
  check("no PAYMENT-REQUIRED header on /sample", !rS.headers.get("payment-required"));
  check("content-type is JSON", String(rS.headers.get("content-type") || "").includes("application/json"), rS.headers.get("content-type"));
  let j = null;
  try { j = await rS.json(); check("json parses", true); } catch (e) { check("json parses", false, e.message); }

  // (2) synthetic labelling + paid-envelope shape accuracy
  if (j) {
    check("ok=true", j.ok === true);
    check("free=true", j.free === true);
    check("sample=true", j.sample === true);
    check("sample_note says synthetic + no payment", /synthetic/i.test(j.sample_note || "") && /without payment/i.test(j.sample_note || ""));
    const re = j.response_example || {};
    check("response_example mirrors paid envelope", re.ok === true && typeof re.bundle_id === "string" && re.bundle && typeof re.bundle === "object" && re.meta && typeof re.meta.services_called === "number", JSON.stringify(Object.keys(re)));
    const demo = BUNDLE_LADDER.find((b) => b.id === re.bundle_id);
    check("bundle_id is a real ladder bundle", !!demo, re.bundle_id);
    if (demo) {
      const legs = demo.parts.map(([n]) => n.replace("-x402", ""));
      const keys = Object.keys(re.bundle || {});
      check("legs match bundle parts", JSON.stringify(keys) === JSON.stringify(legs), `${keys} vs ${legs}`);
      check("every leg shape {status,body}", legs.every((k) => re.bundle[k] && re.bundle[k].status === 200 && typeof re.bundle[k].body === "string"));
      check("every leg body marked _synthetic_demo", legs.every((k) => { try { return JSON.parse(re.bundle[k].body)._synthetic_demo === true; } catch (e) { return false; } }));
      check("meta marks synthetic_demo", re.meta.synthetic_demo === true);
      check("meta.services_called matches parts", re.meta.services_called === demo.parts.length);
    }
    // (3) buy-this instructions
    const d = j.demonstrating || {};
    check("demonstrating.endpoint real", /\/api\/bundle\//.test(d.endpoint || ""), d.endpoint);
    check("demonstrating.network eip155:8453", d.network === "eip155:8453");
    check("demonstrating.payTo canonical", d.payTo === CANONICAL_PAY_TO, d.payTo);
    check("demonstrating.price ladder price", /^\$0\.\d\d USDC$/.test(d.price || ""), d.price);
    check("how_to_buy has 4 ordered steps", Array.isArray(j.how_to_buy) && j.how_to_buy.length === 4 && j.how_to_buy[0].startsWith("1.") && j.how_to_buy[3].startsWith("4."));
    check("how_to_buy names PAYMENT-SIGNATURE", (j.how_to_buy || []).join(" ").includes("PAYMENT-SIGNATURE"));
    check("more links discovery surfaces", j.more && /pricing/.test(j.more.pricing) && /pay-failed/.test(j.more.payment_failure_recovery));
    check("bundle_ladder listed in more", Array.isArray(j.more.bundle_ladder) && j.more.bundle_ladder.length === BUNDLE_LADDER.length);
  }

  // (4) pricing.md parameter parity + cross-links
  const rP = await fetch(`${base}/pricing.md`);
  const md = await rP.text();
  check("/pricing.md -> 200", rP.status === 200);
  check("/pricing.md lists $0.10 flagship", md.includes("$0.10"));
  check("/pricing.md lists eip155:8453", md.includes("eip155:8453"));
  check("/pricing.md lists canonical payTo", md.includes(CANONICAL_PAY_TO), CANONICAL_PAY_TO);
  check("/pricing.md lists mainnet USDC", md.includes("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"));
  check("/pricing.md links /sample", md.includes("/sample"));
  const rL = await fetch(`${base}/llms.txt`);
  check("/llms.txt references /sample", (await rL.text()).includes("/sample"));
  const oapi = await (await fetch(`${base}/openapi.json`)).json();
  check("openapi documents /sample get", !!(oapi.paths && oapi.paths["/sample"] && oapi.paths["/sample"].get));

  // regression: /pay-failed still free + ladder routes still gated.
  // NOTE: with no CDP facilitator creds in the test sandbox the gate may fail
  // to build a challenge (500 from paymentMiddleware) — either way a paid
  // route must NEVER serve a free 200/400.
  const rF = await fetch(`${base}/pay-failed`);
  check("GET /pay-failed still 200", rF.status === 200);
  const r402 = await fetch(`${base}/api/bundle/market-starter`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "Azuki" }),
  });
  check("paid ladder route never served free (gate active)", r402.status !== 200 && r402.status !== 400, `status=${r402.status}${r402.headers.get("payment-required") ? " + PAYMENT-REQUIRED" : ""}`);

  server.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS (EXEC-35)");
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error("CRASH", e); process.exit(1); });
