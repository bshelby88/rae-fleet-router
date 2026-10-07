// EXEC-121 acceptance tests — GET /health (HTML + JSON)
// Asserts: (1) /health returns 200 with text/html content-type;
// (2) body contains fleet health indicators (Healthy, Degraded, Down, Uptime);
// (3) ?format=json returns application/json with walls array;
// (4) all walls are listed in the response.
// Mocks global fetch to avoid real network calls to fly.dev walls.

const http = require("http");

// --- Set required env vars before requiring the app ---
process.env.X402_PAY_TO = "0xfBC0eb7811d477e55261d956df39f0046e192240";
process.env.ROUTER_KEY = "0x4c0883a69102937d6231471b5dbb6204fe512961708279f23efb3c6d7a7f4a1b";

// --- Mock global fetch ---
const originalFetch = global.fetch;
global.fetch = async (url, opts) => {
  const urlStr = typeof url === "string" ? url : url.toString();
  // Only mock wall health probes (external fly.dev hosts), not local test requests
  if (urlStr.includes("fly.dev")) {
    const headersObj = new Headers();
    headersObj.set("content-type", "application/json");
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: headersObj,
      json: async () => ({ status: "ok", service: "wall", uptime: 99.9 }),
      text: async () => JSON.stringify({ status: "ok" }),
    };
  }
  // Pass through to real fetch for non-wall URLs (including local test requests)
  return originalFetch(url, opts);
};

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.log(`  FAIL: ${msg}`); }
}

async function run() {
  console.log("EXEC-121: GET /health (HTML + JSON) acceptance tests\n");

  // Require app after env vars are set
  const app = require("./index.js").app;

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // Test 1: GET /health returns 200 with text/html
    console.log("Test 1: GET /health (HTML)");
    const res1 = await fetch(`${base}/health`);
    const body1 = await res1.text();
    const ct1 = res1.headers.get("content-type") || "";
    assert(res1.status === 200, `status is 200 (got ${res1.status})`);
    assert(ct1.includes("text/html"), `content-type is text/html (got ${ct1})`);

    // Test 2: HTML body contains health indicators
    console.log("\nTest 2: HTML body contains health indicators");
    assert(body1.includes("Healthy"), "body contains 'Healthy'");
    assert(body1.includes("Degraded"), "body contains 'Degraded'");
    assert(body1.includes("Down"), "body contains 'Down'");
    assert(body1.includes("Uptime"), "body contains 'Uptime'");
    assert(body1.includes("Generated"), "body contains 'Generated'");

    // Test 3: ?format=json returns JSON with walls array
    console.log("\nTest 3: GET /health?format=json");
    const res3 = await fetch(`${base}/health?format=json`);
    const body3 = await res3.json();
    const ct3 = res3.headers.get("content-type") || "";
    assert(res3.status === 200, `status is 200 (got ${res3.status})`);
    assert(ct3.includes("application/json"), `content-type is application/json (got ${ct3})`);
    assert(Array.isArray(body3.walls), "response has walls array");
    assert(body3.walls.length === 14, `walls array has 14 entries (got ${body3.walls.length})`);

    // Test 4: Each wall has required fields
    console.log("\nTest 4: Wall entries have required fields");
    const w0 = body3.walls[0];
    assert(typeof w0.slug === "string" && w0.slug.length > 0, "wall has slug");
    assert(typeof w0.status === "number", "wall has numeric status");
    assert(typeof w0.ok === "boolean", "wall has boolean ok");
    assert(typeof w0.elapsed_ms === "number", "wall has numeric elapsed_ms");
    assert(typeof w0.host === "string" && w0.host.length > 0, "wall has host");

    // Test 5: HTML contains all wall slugs
    console.log("\nTest 5: HTML lists all walls");
    for (const w of body3.walls) {
      assert(body1.includes(w.slug), `HTML contains wall slug '${w.slug}'`);
    }

    // Test 6: JSON has summary counts
    console.log("\nTest 6: JSON has summary counts");
    assert(typeof body3.total === "number", "has total count");
    assert(typeof body3.healthy === "number", "has healthy count");
    assert(typeof body3.degraded === "number", "has degraded count");
    assert(typeof body3.down === "number", "has down count");
    assert(typeof body3.uptime_pct === "number", "has uptime_pct");
    assert(body3.total === body3.healthy + body3.degraded + body3.down, "total = healthy + degraded + down");

  } finally {
    server.close();
    global.fetch = originalFetch;
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
