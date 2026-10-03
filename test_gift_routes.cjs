// EXEC-92 — /buy/gift route acceptance tests
// Tests: GET /buy/gift returns 200, GET /buy/:slug?gift_note= shows banner
const assert = require("assert");
const http = require("http");

const BASE = process.env.TEST_BASE || "http://localhost:3000";

async function get(path) {
  return new Promise((resolve, reject) => {
    http.get(BASE + path, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on("error", reject);
  });
}

async function main() {
  let ok = 0, fail = 0;

  // 1. GET /buy/gift returns 200 with HTML
  try {
    const r = await get("/buy/gift");
    assert(r.status === 200, "expected 200");
    assert(r.headers["content-type"].startsWith("text/html"), "expected HTML");
    assert(r.body.includes("Gift a Wall"), "expected gift page title");
    assert(r.body.includes("For the builder"), "expected note template 1");
    assert(r.body.includes("For the curious"), "expected note template 2");
    assert(r.body.includes("Just because"), "expected note template 3");
    assert(r.body.includes("slug-select"), "expected wall selector");
    assert(r.body.includes("/buy/gift"), "expected JSON link");
    ok += 8;
    console.log("PASS: /buy/gift landing page (8 checks)");
  } catch (e) {
    fail++;
    console.error("FAIL: /buy/gift — " + e.message);
  }

  // 2. GET /buy returns 200 with gift link
  try {
    const r = await get("/buy");
    assert(r.status === 200, "expected 200");
    assert(r.body.includes("Gift a wall"), "expected gift link in footer");
    ok += 2;
    console.log("PASS: /buy has gift link (2 checks)");
  } catch (e) {
    fail++;
    console.error("FAIL: /buy gift link — " + e.message);
  }

  // 3. GET /buy?format=json returns valid JSON
  try {
    const r = await get("/buy?format=json");
    assert(r.status === 200, "expected 200");
    const j = JSON.parse(r.body);
    assert(j.ok === true, "expected ok=true");
    assert(Array.isArray(j.items), "expected items array");
    assert(j.items.length > 10, "expected 10+ wall items");
    ok += 4;
    console.log("PASS: /buy JSON index (4 checks)");
  } catch (e) {
    fail++;
    console.error("FAIL: /buy JSON — " + e.message);
  }

  // 4. GET /buy/nft-alpha?gift_note=Try%20this returns 200 with gift banner
  try {
    const r = await get("/buy/nft-alpha?gift_note=Try%20this");
    assert(r.status === 200, "expected 200");
    assert(r.body.includes("Gift for you"), "expected gift banner");
    assert(r.body.includes("Try this"), "expected gift note text");
    assert(r.body.includes("gift_note="), "expected gift link hint");
    ok += 4;
    console.log("PASS: /buy/nft-alpha with gift_note (4 checks)");
  } catch (e) {
    fail++;
    console.error("FAIL: /buy/nft-alpha?gift_note= — " + e.message);
  }

  // 5. GET /buy/nft-alpha?gift=1 (shorthand) returns 200
  try {
    const r = await get("/buy/nft-alpha?gift=1");
    assert(r.status === 200, "expected 200");
    assert(r.body.includes("Gift for you"), "expected gift banner for shorthand");
    ok += 2;
    console.log("PASS: /buy/nft-alpha?gift=1 shorthand (2 checks)");
  } catch (e) {
    fail++;
    console.error("FAIL: /buy/nft-alpha?gift=1 — " + e.message);
  }

  // 6. GET /buy/nonexistent-slug returns 404
  try {
    const r = await get("/buy/this-wall-does-not-exist");
    assert(r.status === 404, "expected 404");
    ok += 1;
    console.log("PASS: unknown slug 404 (1 check)");
  } catch (e) {
    fail++;
    console.error("FAIL: unknown slug — " + e.message);
  }

  console.log(`\nResults: ${ok} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });