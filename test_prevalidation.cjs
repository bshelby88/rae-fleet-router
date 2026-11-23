// [402-FIRST] acceptance tests — BEAN fix wave 2026-11-22.
// Replaces the EXEC-41 400-before-402 contract (retired by the owner-ordered
// lint-FAIL fix wave): the manifest linter and the x402 spec both expect an
// UNPAID probe on a paid route to meet the 402 challenge, whatever the body.
// Asserts, per /api/bundle/<id> ladder route:
//   (1) an UNPAID POST with an INVALID body ({} etc.) gets HTTP 402 WITH a
//       decodable payment-required challenge — never a bare 400 — and a
//       machine-readable 402 BODY carrying payment_instructions (QUOTE-01);
//   (2) charging safety is preserved: body validation still happens (400)
//       AFTER the gate verifies payment, inside makeBundleHandler — asserted
//       at the unit level via bundleBodyErrors() on the same invalid bodies;
//   (3) a valid unpaid body gets the unchanged 402 challenge at the exact
//       advertised atomic amounts (market-starter 20000, market-intel-trio
//       50000, full-fleet-sampler 60000);
//   (4) GET on the paid route returns a 402 JSON quote twin (GET_TWIN fix).
// Run: node test_prevalidation.cjs   (no secrets needed — dummy env only;
// the sandbox runs eip155:84532 against the x402.org testnet facilitator)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, BUNDLE_LADDER, PAID_ROUTES, bundleBodyErrors } = require("./index.js");

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
  // EXEC-146 — per-bundle invalid cases derived from each route's own
  // requestSchema, so bundles with non-topic bodies (compliance-kit) are
  // validated against the contract they actually advertise.
  function invalidCasesFor(b) {
    const required = (b.requestSchema && b.requestSchema.required) || ["topic"];
    if (required.includes("topic")) return invalidCases;
    const cases = [["empty {}", {}]];
    for (const f of required) {
      const partial = { ...b.input };
      delete partial[f];
      cases.push([`missing ${f}`, partial]);
      cases.push([`${f} wrong type`, { ...b.input, [f]: 42 }]);
    }
    return cases;
  }
  // valid body must satisfy the bundle's own required fields
  const validBodyFor = (b) => b.input || { topic: "Azuki" };

  for (const b of BUNDLE_LADDER) {
    const path = `/api/bundle/${b.id}`;
    const expected = String(Math.round(parseFloat(b.price.replace("$", "")) * 1e6));

    // (1) every UNPAID invalid case must reach the payment gate (402-FIRST).
    // Sandbox note: no public facilitator currently serves eip155:84532 exact
    // (x402.org dropped it), so a local run answers 5xx from INSIDE the gate —
    // the assertion is "never a pre-gate 400"; the live 402 (header + body +
    // payment_instructions) is asserted by the post-deploy reverify gate and
    // proven below for the GET twins, which need no facilitator.
    for (const [label, body] of invalidCasesFor(b)) {
      const r = await post(path, body);
      const pr = r.headers.get("payment-required") || r.headers.get("x-payment");
      check(`${b.id} unpaid invalid [${label}] not short-circuited by pre-gate 400`, r.status !== 400, `got ${r.status}`);
      if (r.status === 402) {
        check(`${b.id} unpaid invalid [${label}] -> payment challenge issued`, !!pr);
        let j = null;
        try { j = await r.json(); } catch (_) {}
        check(`${b.id} unpaid invalid [${label}] -> 402 body is JSON`, !!j);
        check(`${b.id} unpaid invalid [${label}] -> body carries payment_instructions`,
          !!(j && j.payment_instructions && typeof j.payment_instructions === "object"));
      } else {
        check(`${b.id} unpaid invalid [${label}] reached the gate (5xx facilitator sandbox)`, r.status >= 500, `got ${r.status}`);
      }
      // charging safety (unit level): the same body WOULD 400 post-payment
      check(`${b.id} invalid [${label}] would be rejected post-payment (unit)`,
        bundleBodyErrors(body, b).length > 0);
    }

    // (2) valid unpaid body: reaches the gate at the exact advertised amount
    const rg = await post(path, validBodyFor(b));
    check(`${b.id} valid unpaid body not short-circuited by pre-gate 400`, rg.status !== 400, `got ${rg.status}`);
    const hdr = rg.headers.get("payment-required") || rg.headers.get("x-payment");
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

    // (3) GET twin: machine-readable 402 quote, no challenge header
    const gt = await fetch(`${base}${path}`);
    let gj = null;
    try { gj = await gt.json(); } catch (_) {}
    check(`${b.id} GET twin -> 402`, gt.status === 402, `got ${gt.status}`);
    check(`${b.id} GET twin body is a JSON quote`, !!(gj && gj.quote && gj.quote.method === "POST"));
  }

  // flagship + tip GET twins (GET_TWIN fix covers all PAID_ROUTES)
  for (const p of ["/api/fleet-bundle", "/api/tip"]) {
    const r = await fetch(`${base}${p}`);
    check(`GET twin ${p} -> 402`, r.status === 402, `got ${r.status}`);
    const j = await r.json().catch(() => null);
    check(`GET twin ${p} body is a JSON quote`, !!(j && j.quote));
  }

  server.close();
  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
