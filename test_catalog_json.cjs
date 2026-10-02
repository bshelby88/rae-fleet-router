// EXEC-32 — GET /catalog.json acceptance test.
// Asserts: 200, JSON shape, wall_count >= 1, endpoint_count > 0,
// canonical fields present, router self-entry present.
const assert = require("assert");

const { app, CANONICAL_PAY_TO, MAINNET_USDC } = require("./index.js");

async function run() {
  const req = new Request("http://localhost/catalog.json");
  const res = await app.handle(req);
  assert.strictEqual(res.status, 200, "/catalog.json must return 200");
  const ct = res.headers.get("content-type") || "";
  assert(ct.includes("application/json"), "content-type must be application/json");

  const body = await res.json();
  assert.strictEqual(body.ok, true, "body.ok must be true");
  assert.strictEqual(body.free, true, "body.free must be true");
  assert.strictEqual(body.service, "rae-fleet-router", "service name correct");
  assert(typeof body.generated_utc === "string", "generated_utc must be a string");
  assert(body.wall_count >= 1, "wall_count >= 1");
  assert(body.endpoint_count > 0, "endpoint_count > 0");

  // canonical fields
  assert.strictEqual(body.canonical.network, "eip155:8453", "canonical network");
  assert.strictEqual(body.canonical.usdc, MAINNET_USDC, "canonical usdc");
  assert.strictEqual(body.canonical.payTo, CANONICAL_PAY_TO, "canonical payTo");

  // walls array
  assert(Array.isArray(body.walls), "walls must be an array");
  assert(body.walls.length >= 2, "walls must include at least the buy walls + router self-entry");

  // router self-entry present
  const routerWall = body.walls.find(w => w.host_name === "rae-fleet-router");
  assert(routerWall !== undefined, "router self-entry must be present");
  assert(routerWall.status === "ok", "router status must be ok");
  assert(Array.isArray(routerWall.items), "router items must be an array");
  assert(routerWall.items.length > 0, "router must have at least one endpoint");

  // each wall entry shape
  for (const w of body.walls) {
    assert(typeof w.host === "string", "wall.host must be string");
    assert(typeof w.status === "string", "wall.status must be string");
    assert(Array.isArray(w.items), "wall.items must be array");
    for (const i of w.items) {
      assert(typeof i.slug === "string", "item.slug must be string");
      assert(typeof i.host === "string", "item.host must be string");
      assert(typeof i.method === "string", "item.method must be string");
      assert(i.status === "ok" || i.status === "unreachable" || i.status === "empty", "item.status valid");
    }
  }

  // links present
  assert(typeof body.links.pricing === "string", "links.pricing present");
  assert(typeof body.links.sample === "string", "links.sample present");
  assert(typeof body.links.buy === "string", "links.buy present");

  console.log("PASS: test_catalog_json.cjs —", body.wall_count, "walls,", body.endpoint_count, "endpoints");
}

run().catch(e => { console.error("FAIL:", e.message); process.exit(1); });