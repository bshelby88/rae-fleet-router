// ROUTER-FACILITATOR-FIX acceptance test — challenges AND the machine
// manifest must advertise the canonical buyer-facing facilitator.
//
// Defect (REVENUE-SYNTHESIS 2026-10-01 wall audit): the router's 402
// challenges carried accepts[0].extra = {name, version} only — no
// facilitator — and resource carried no serviceName; /.well-known/x402.json
// endpoints advertised none either. Strict x402 v2 buyers require
// accepts[0].extra.facilitator and bounce without it. 12/13 fleet walls
// (power-pack 49ba21bf pattern, since 2026-09-15) ship
// extra.facilitator = "https://x402-agent-pay.com/facilitator" +
// resource.serviceName. The router regressed against that contract.
//
// Checks: for every paid route (flagship + 3 ladder) the LIVE 402 challenge
// must carry extra.facilitator (canonical AgentPay URL) and
// resource.serviceName; /.well-known/x402.json must carry facilitator in
// every endpoint's accepts.extra; the static PAID_ROUTES map must match
// (single source of truth cannot diverge).
//
// Run: node test_facilitator_advertising.cjs   (dummy env only, no secrets)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, BUNDLE_LADDER, PAID_ROUTES } = require("./index.js");

const FACILITATOR = "https://x402-agent-pay.com/facilitator";
const SERVICE_NAME = "rae-fleet-router";

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

function decodeChallenge(r) {
  const pr = r.headers.get("payment-required") || r.headers.get("x-payment");
  if (!pr) return null;
  return JSON.parse(Buffer.from(pr, "base64").toString("utf8"));
}

// Async boot: first requests may race x402Server.initialize(); retry UNPAID
// until the gate emits a real 402 (~60s budget). Nothing is ever paid.
async function challengeReq(url, headers, body, tries = 60) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
    const c = decodeChallenge(r);
    if (c) return { status: r.status, challenge: c };
    last = r.status;
    await new Promise((res) => setTimeout(res, 1000));
  }
  return { status: last, challenge: null };
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // --- static single-source-of-truth map ----------------------------------
    const routeKeys = ["POST /api/fleet-bundle", ...BUNDLE_LADDER.map((b) => `POST /api/bundle/${b.id}`)];
    for (const rk of routeKeys) {
      const rv = PAID_ROUTES[rk];
      check(`PAID_ROUTES["${rk}"] accepts.extra.facilitator configured`,
        !!rv && rv.accepts?.extra?.facilitator === FACILITATOR,
        rv ? JSON.stringify(rv.accepts?.extra) : "route missing");
      check(`PAID_ROUTES["${rk}"] serviceName configured`,
        !!rv && rv.serviceName === SERVICE_NAME, rv ? String(rv.serviceName) : "route missing");
    }

    // --- live 402 challenges -------------------------------------------------
    const flagship = await challengeReq(`${base}/api/fleet-bundle`, { "x-forwarded-proto": "https" }, { topic: "Azuki" });
    check("POST /api/fleet-bundle -> 402", flagship.status === 402, `got ${flagship.status}`);
    const fa = (flagship.challenge?.accepts || [])[0] || {};
    check("flagship accepts[0].extra.facilitator = canonical AgentPay URL",
      fa.extra?.facilitator === FACILITATOR, JSON.stringify(fa.extra));
    check("flagship resource.serviceName = rae-fleet-router",
      flagship.challenge?.resource?.serviceName === SERVICE_NAME, String(flagship.challenge?.resource?.serviceName));
    check("flagship token metadata NOT clobbered by the fix (EIP-712 name/version survive)",
      typeof fa.extra?.name === "string" && fa.extra?.name.length > 0 && typeof fa.extra?.version === "string" && fa.extra?.version.length > 0,
      JSON.stringify(fa.extra));

    for (const b of BUNDLE_LADDER) {
      const p = await challengeReq(`${base}/api/bundle/${b.id}`, { "x-forwarded-proto": "https" }, { topic: "Azuki" });
      const acc = (p.challenge?.accepts || [])[0] || {};
      check(`bundle/${b.id} accepts[0].extra.facilitator`,
        p.status === 402 && acc.extra?.facilitator === FACILITATOR, JSON.stringify(acc.extra) || `status=${p.status}`);
      check(`bundle/${b.id} resource.serviceName`,
        p.challenge?.resource?.serviceName === SERVICE_NAME, String(p.challenge?.resource?.serviceName));
    }

    // --- machine manifest ------------------------------------------------------
    const mr = await fetch(`${base}/.well-known/x402.json`);
    check("GET /.well-known/x402.json -> 200", mr.status === 200, `got ${mr.status}`);
    const mj = await mr.json().catch(() => null);
    check("manifest parses", !!mj);
    if (mj) {
      for (const ep of ["/api/fleet-bundle", ...BUNDLE_LADDER.map((b) => `/api/bundle/${b.id}`)]) {
        const e = mj.endpoints?.[ep];
        check(`manifest ${ep} accepts.extra.facilitator`,
          e?.accepts?.extra?.facilitator === FACILITATOR, JSON.stringify(e?.accepts?.extra));
      }
    }
  } finally {
    server.close();
  }

  console.log(failures === 0 ? "ALL PASS (test_facilitator_advertising)" : `${failures} FAILURE(S) (test_facilitator_advertising)`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
