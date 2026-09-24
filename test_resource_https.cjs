// EXEC-52 acceptance test — the advertised x402 resource URL must be https://.
//
// Defect: behind Fly's reverse proxy, plain Express reports req.protocol as
// "http" unless `trust proxy` is enabled, and @x402/express derives the
// challenge's resource.url from the request origin. Coinbase Bazaar's
// facilitator then REJECTS indexing: "resource must start with 'https://'
// when protocol type is http" — the wall is invisible to agent buyers.
//
// Proof pattern (stock vs patched, from fleet skill x402-bazaar-bootstrap):
//  (1) request WITHOUT X-Forwarded-Proto  -> resource.url starts with http://
//      (direct/local origin is genuinely cleartext; trust proxy must not lie)
//  (2) request WITH X-Forwarded-Proto: https (what Fly sends at the edge)
//      -> resource.url is the absolute https:// URL
//  (3) the flagship /api/fleet-bundle and every /api/bundle/<id> ladder route
//      must carry extensions.bazaar in the challenge (indexability requirement)
//  (4) accepts[0] stays scheme=exact / network=eip155:8453
//
// Run: node test_resource_https.cjs   (no secrets needed — dummy env only)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { app, BUNDLE_LADDER } = require("./index.js");

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

// Async boot: the first requests may race x402Server.initialize() and answer
// 500 with no challenge (sandbox artifact, see skill note). Retry UNPAID until
// the gate emits a real 402 challenge (~60s budget). Nothing is ever paid.
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

const PROXY_HOPS = {
  "x-forwarded-proto": "https",
  "x-forwarded-host": "rae-fleet-router.fly.dev",
  host: "rae-fleet-router.fly.dev",
};

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // --- flagship route -----------------------------------------------------
    const pPlain = await challengeReq(`${base}/api/fleet-bundle`, {}, { topic: "Azuki" });
    check("POST /api/fleet-bundle (no proxy header) -> 402", pPlain.status === 402, `got ${pPlain.status}`);
    const cPlain = pPlain.challenge;
    check("challenge present (no proxy header)", !!cPlain);
    if (cPlain) {
      check("direct/cleartext request still advertises http:// (trust proxy must not fabricate https)",
        String(cPlain.resource?.url || "").startsWith("http://127.0.0.1:"), cPlain.resource?.url);
    }

    const pXfp = await challengeReq(`${base}/api/fleet-bundle`, PROXY_HOPS, { topic: "Azuki" });
    check("POST /api/fleet-bundle via https proxy hop -> 402", pXfp.status === 402, `got ${pXfp.status}`);
    const cXfp = pXfp.challenge;
    check("challenge present (via https proxy hop)", !!cXfp);
    if (cXfp) {
      check("resource.url is absolute https:// (EXEC-52 defect fix)",
        String(cXfp.resource?.url || "").startsWith(`https://127.0.0.1:${port}/api/fleet-bundle`), cXfp.resource?.url);
      const acc = (cXfp.accepts || [])[0] || {};
      const expNet = process.env.CDP_API_KEY_ID ? "eip155:8453" : "eip155:84532"; // same derivation as index.js
      check("scheme exact", acc.scheme === "exact", acc.scheme);
      check(`network matches env derivation (${expNet})`, acc.network === expNet, acc.network);
      check("amount >= 1000 atomic", Number(acc.amount) >= 1000, String(acc.amount));
      check("bazaar extension present on flagship",
        !!(cXfp.extensions && cXfp.extensions.bazaar), JSON.stringify(Object.keys(cXfp.extensions || {})));
    }

    // --- ladder routes ------------------------------------------------------
    for (const b of BUNDLE_LADDER) {
      const p = await challengeReq(`${base}/api/bundle/${b.id}`, { "x-forwarded-proto": "https" }, { topic: "Azuki" });
      const cl = p.challenge;
      check(`bundle/${b.id} resource.url https://`,
        p.status === 402 && !!cl && String(cl.resource?.url || "").startsWith(`https://127.0.0.1:${port}/api/bundle/${b.id}`),
        cl ? cl.resource?.url : `status=${p.status} no-challenge`);
      check(`bundle/${b.id} bazaar extension present`,
        !!(cl && cl.extensions && cl.extensions.bazaar),
        cl ? JSON.stringify(Object.keys(cl.extensions || {})) : "no-challenge");
    }
  } finally {
    server.close();
  }

  console.log(failures === 0 ? "ALL PASS (test_resource_https)" : `${failures} FAILURE(S) (test_resource_https)`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
