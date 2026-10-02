// EXEC-47 acceptance tests — GET /badge.svg + GET /badge.md
// Asserts: (1) /badge.svg returns 200 with image/svg+xml content-type;
// (2) body is valid SVG with x402 and RAEN text; (3) ?v=dark variant differs;
// (4) /badge.md returns 200 with text/markdown content-type body containing
// embed formats; (5) both routes are free (registered above paymentMiddleware,
// never 402). Run: node test_badge_route.cjs   (no secrets needed)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const { app } = require("./index.js");

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  // (1) GET /badge.svg default (light)
  const r1 = await fetch(`${base}/badge.svg`);
  check("GET /badge.svg -> 200", r1.status === 200, `got ${r1.status}`);
  check("no 402 on /badge.svg", r1.status !== 402);
  check("content-type is image/svg+xml", String(r1.headers.get("content-type") || "").includes("image/svg+xml"), r1.headers.get("content-type"));
  check("cache-control set", String(r1.headers.get("cache-control") || "").includes("max-age=86400"));
  const svg1 = await r1.text();
  check("svg body contains x402", svg1.includes("x402"), "light variant has x402");
  check("svg body contains RAEN", svg1.includes("RAEN"), "light variant has RAEN");
  check("svg body is light variant (no dark bg)", svg1.includes("#f8f9fa"), "light uses #f8f9fa bg");

  // (2) GET /badge.svg?v=dark
  const r2 = await fetch(`${base}/badge.svg?v=dark`);
  check("GET /badge.svg?v=dark -> 200", r2.status === 200);
  const svg2 = await r2.text();
  check("dark variant has dark bg", svg2.includes("#1a1a2e"), "dark uses #1a1a2e bg");
  check("variants differ", svg1 !== svg2);

  // (3) GET /badge.md
  const r3 = await fetch(`${base}/badge.md`);
  check("GET /badge.md -> 200", r3.status === 200, `got ${r3.status}`);
  check("no 402 on /badge.md", r3.status !== 402);
  check("content-type is text/markdown", String(r3.headers.get("content-type") || "").includes("text/markdown"), r3.headers.get("content-type"));
  const md = await r3.text();
  check("md body contains RAEN x402 Badge", md.includes("RAEN x402 Badge"), "title present");
  check("md body contains markdown embed format", md.includes("!["), "markdown img syntax");
  check("md body contains HTML embed format", md.includes("<a href"), "HTML link present");
  check("md body contains agent block", md.includes("eip155:8453"), "agent block chain");
  check("md body contains payTo", md.includes("0x7861db4e"), "canonical payTo in agent block");
  check("md body contains router URL", md.includes("rae-fleet-router.fly.dev"), "router URL present");

  // (4) /badge.svg?format=json should still serve SVG (format param ignored)
  const r4 = await fetch(`${base}/badge.svg?format=json`);
  check("GET /badge.svg with query still 200", r4.status === 200);
  check("still svg content-type", String(r4.headers.get("content-type") || "").includes("image/svg+xml"));

  server.close();
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error("TEST HARNESS CRASH", e); process.exit(1); });