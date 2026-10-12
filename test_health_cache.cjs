// /health must not re-probe every wall on every request (was 8-11 s). Mocked fetch, no network.
process.env.X402_PAY_TO = "0xfBC0eb7811d477e55261d956df39f0046e192240";
process.env.ROUTER_KEY = "0x" + "11".repeat(32); // dummy test value, built at runtime
process.env.HEALTH_CACHE_TTL_MS = "60000";
const http = require("http");
const orig = global.fetch;
let probes = 0;
global.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes("fly.dev")) {
    probes++;
    await new Promise((r) => setTimeout(r, 300)); // slow wall
    return { ok: true, status: 200, json: async () => ({ status: "ok", service: "wall" }) };
  }
  return orig(url, opts);
};
let failed = 0;
const check = (c, m) => { console.log((c ? "PASS: " : "FAIL: ") + m); if (!c) failed++; };
(async () => {
  const app = require("./index.js").app;
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const t1 = Date.now();
  const [a, b] = await Promise.all([fetch(base + "/health?format=json"), fetch(base + "/health?format=json")]);
  const j = await a.json(); await b.json();
  const n1 = probes;
  check(j.total > 0 && n1 === j.total, `concurrent cold requests share one probe round (${n1} probes for ${j.total} walls)`);
  const t2 = Date.now();
  const c = await fetch(base + "/health?format=json"); await c.json();
  check(Date.now() - t2 < 100, `cached /health is fast (${Date.now() - t2}ms)`);
  check(probes === n1, "no new probes within TTL");
  const z = await fetch(base + "/healthz"); const zj = await z.json();
  check(z.status === 200 && zj.status === "ok" && probes === n1, "/healthz is cheap and does not probe");
  server.close();
  console.log(failed ? `FAILED ${failed}` : "ALL PASS");
  process.exit(failed ? 1 : 0);
})();
