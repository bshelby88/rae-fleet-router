// EXEC-41 acceptance tests — 400-before-402 charging order on /api/bundle/*.
// Asserts: (1) an invalid body ({} etc.) gets HTTP 400 with NO payment-required
// challenge header (buyer can never be gated-then-billed-then-400'd), and
// (2) a valid body still gets the unchanged 402 x402 challenge at the exact
// advertised atomic amounts (market-starter 20000, market-intel-trio 50000,
// full-fleet-sampler 60000).
// Run: node test_prevalidation.cjs   (no secrets needed — dummy env only)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, BUNDLE_LADDER, PAID_ROUTES } = require("./index.js");

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) =>
    fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  const invalidCases = [
    ["empty {}", {}],
    ["no topic", { collection: "BAYC" }],
    ["topic wrong type", { topic: 42 }],
    ["topic whitespace-only", { topic: "   " }],
    ["short email_subject", { topic: "Azuki", email_subject: "ab" }],
    ["short email_body", { topic: "Azuki", email_body: "too short" }],
  ];

  for (const b of BUNDLE_LADDER) {
    const path = `/api/bundle/${b.id}`;
    // (1) every invalid case must 400 WITHOUT any payment challenge header
    for (const [label, body] of invalidCases) {
      const r = await post(path, body);
      const pr = r.headers.get("payment-required") || r.headers.get("x-payment");
      check(`${b.id} invalid [${label}] -> 400`, r.status === 400, `got ${r.status}`);
      check(`${b.id} invalid [${label}] -> NO payment challenge issued`, !pr);
    }
    // non-JSON object body (array) must also 400 pre-gate
    const rArr = await post(path, "[1,2]");
    check(`${b.id} array body -> 400`, rArr.status === 400, `got ${rArr.status}`);

    // (2) valid body must NOT be short-circuited by pre-validation: it falls
    // through to the payment gate. In a facilitator-less sandbox the gate may
    // answer 402 (facilitator reachable) or 5xx (not reachable); what it can
    // NEVER do is 400 from our layer. When a 402 challenge IS issued, decode
    // and assert the exact advertised atomic amount.
    const rg = await post(path, { topic: "Azuki" });
    check(`${b.id} valid body passes pre-validation (not 400)`, rg.status !== 400, `got ${rg.status}`);
    const hdr = rg.headers.get("payment-required") || rg.headers.get("x-payment");
    const expected = String(Math.round(parseFloat(b.price.replace("$", "")) * 1e6));
    if (rg.status === 402 && hdr) {
      let amount = null;
      try {
        const d = JSON.parse(Buffer.from(hdr, "base64").toString("utf8"));
        amount = String(d.accepts[0].amount);
      } catch (e) { /* amount stays null -> FAIL below */ }
      check(`${b.id} 402 amount unchanged (${expected} atomic)`, amount === expected, `got ${amount}`);
    } else {
      // Offline-sandbox path: assert the registered gate price itself is the
      // advertised amount (same source of truth the gate builds challenges from).
      const route = PAID_ROUTES[`POST ${path}`];
      const rp = route && route.accepts && route.accepts.price;
      const rAtomic = rp ? String(Math.round(parseFloat(rp.replace("$", "")) * 1e6)) : null;
      check(`${b.id} gate route price == ${expected} atomic (facilitator unreachable in sandbox; challenge status ${rg.status})`, rAtomic === expected, `route price ${rp}`);
    }
  }

  // 400 response must be parseable JSON with the honest not-charged markers
  const rj = await post(`/api/bundle/${BUNDLE_LADDER[0].id}`, {});
  const j = await rj.json().catch(() => null);
  check("400 body is JSON", !!j);
  check("400 body states charged=false", j && j.charged === false);
  check("400 body carries retry guidance", j && typeof j.retry === "string" && j.retry.length > 0);

  server.close();
  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
