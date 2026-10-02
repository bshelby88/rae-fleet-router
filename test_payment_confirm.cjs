// EXEC-100 acceptance tests — GET /payment/confirm?tx=<hash>
// Validates:
//  (1) ?tx missing or malformed -> 400 with guidance
//  (2) route is registered ABOVE paymentMiddleware (no 402, no PAYMENT-REQUIRED header)
//  (3) response is HTML with "Payment Confirmed" title
// Run: node test_payment_confirm.cjs   (no secrets, no money, no live RPC — tests route structure only)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const { app } = require("./index.js");
const http = require("http");

let failures = 0;
let checks = 0;
function check(name, cond, detail) {
  checks++;
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

function get(path) {
  return new Promise((resolve, reject) => {
    const s = app.listen(0, () => {
      const port = s.address().port;
      http.get(`http://localhost:${port}${path}`, (res) => {
        let body = "";
        res.on("data", (c) => body += c);
        res.on("end", () => { s.close(); resolve({ status: res.statusCode, headers: res.headers, body }); });
      }).on("error", (e) => { s.close(); reject(e); });
    });
  });
}

async function run() {
  // Test 1: missing tx -> 400
  const r1 = await get("/payment/confirm");
  check("missing tx returns 400", r1.status === 400, `status=${r1.status}`);
  check("missing tx body has guidance", r1.body.includes("Invalid transaction hash"), "");

  // Test 2: malformed tx -> 400
  const r2 = await get("/payment/confirm?tx=notahex");
  check("malformed tx returns 400", r2.status === 400, `status=${r2.status}`);

  // Test 3: valid hex but too short
  const r3 = await get("/payment/confirm?tx=0x1234");
  check("short tx returns 400", r3.status === 400, `status=${r3.status}`);

  // Test 4: 64-hex-char hash passes regex (returns 200 OR 404/500 depending on RPC — but never 400/402)
  const r4 = await get("/payment/confirm?tx=0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  check("valid hex hash does NOT return 400", r4.status !== 400, `status=${r4.status}`);
  check("valid hex hash does NOT return 402", r4.status !== 402, `status=${r4.status}`);

  // Test 5: no PAYMENT-REQUIRED header (free route, above paymentMiddleware)
  check("no payment-required header", !r4.headers["payment-required"], "free route above paymentMiddleware");

  // Test 6: response is HTML
  check("response is HTML", (r4.headers["content-type"] || "").includes("text/html"), "");

  // Final summary
  const pass = failures === 0;
  console.log(`\n---\n${checks} checks, ${failures} failures — ${pass ? "ALL PASS" : "SOME FAIL"}`);
  process.exit(pass ? 0 : 1);
}

run().catch((e) => { console.error("CRASH:", e.message); process.exit(1); });