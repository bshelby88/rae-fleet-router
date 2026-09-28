// AGENSTRY-W1 acceptance tests — A2A v1.0 agent card + free JSON-RPC surface.
// Asserts: (1) GET /.well-known/agent-card.json AND /.well-known/agent.json ->
// 200 JSON, never 402 / PAYMENT-REQUIRED (registered above paymentMiddleware);
// (2) card is schema-conformant for Agenstry scoring: protocolVersion "1.0"
// (Major.Minor, not patch form), https url, supportedInterfaces bonus, >=3
// skills each with id/name/description/tags (AgentSkill requires both tags and
// description since v1.0 or discovery caps), x402 capability flag present in
// capabilities.extensions; (3) POST /a2a answers the negotiated methods —
// SendMessage (v1) and message/send (v0.3) — with valid JSON-RPC 2.0 echoes
// and a Message result; GetAgentCard returns the card; unknown method ->
// -32601; malformed request -> -32600 (all HTTP 200, JSON-RPC errors are
// in-body, and none of these paths can ever bill: no downstream call exists);
// (4) money-adjacent fields mirror canonical treasury payTo and mainnet.
// Run: node test_agent_card.cjs   (no secrets needed — Hardhat key #0 unused)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const { app, CANONICAL_PAY_TO } = require("./index.js");

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  // (1) free ungated card at both well-known URIs
  const rC = await fetch(`${base}/.well-known/agent-card.json`);
  check("GET /.well-known/agent-card.json -> 200", rC.status === 200, `got ${rC.status}`);
  check("card route never 402", rC.status !== 402);
  check("no PAYMENT-REQUIRED header on card", !rC.headers.get("payment-required"));
  const card = await rC.json();
  const rOld = await fetch(`${base}/.well-known/agent.json`);
  check("GET /.well-known/agent.json -> 200 (v0.3 URI alias)", rOld.status === 200, `got ${rOld.status}`);

  // (2) card shape
  check("protocolVersion is Major.Minor '1.0'", card.protocolVersion === "1.0", card.protocolVersion);
  check("version declared", typeof card.version === "string" && card.version.length > 0);
  check("name + description", typeof card.name === "string" && card.name.length > 3 && typeof card.description === "string" && card.description.length > 20);
  check("card url is https /a2a", /^https:\/\//.test(card.url || "") && /\/a2a$/.test(card.url || ""), card.url);
  check("supportedInterfaces bonus present", Array.isArray(card.supportedInterfaces) && card.supportedInterfaces.length >= 1 && card.supportedInterfaces[0].transport === "JSONRPC");
  check("v1 AgentInterface protocolBinding (REQUIRED for SDK transport matching)", card.supportedInterfaces[0].protocolBinding === "JSONRPC" && card.supportedInterfaces[0].protocolVersion === "1.0");
  check("preferredTransport JSONRPC", card.preferredTransport === "JSONRPC");
  check("provider = Royal Agentic Enterprises", card.provider && card.provider.organization === "Royal Agentic Enterprises");
  check(">=3 skills", Array.isArray(card.skills) && card.skills.length >= 3, `skills=${(card.skills || []).length}`);
  check("every skill has id/name/description/tags", (card.skills || []).every((s) => s.id && s.name && s.description && Array.isArray(s.tags) && s.tags.length >= 1));
  check("skill examples are strings (AgentSkill schema)", (card.skills || []).every((s) => s.examples === undefined || (Array.isArray(s.examples) && s.examples.every((x) => typeof x === "string"))));
  const ext = (((card.capabilities || {}).extensions) || []);
  check("x402 capability flag declared", ext.some((e) => /x402/i.test(String(e.uri || "") + String(e.description || ""))));
  check("extension text names mainnet + treasury", ext.some((e) => /eip155:8453/.test(e.description || "") && /0x7861db4efc14a1ed5dd8c96c528a3796560f1393/.test(e.description || "")));

  // (3) JSON-RPC SendMessage surface
  const rpc = async (payload) => {
    const r = await fetch(`${base}/a2a`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return { status: r.status, noPay: r.status !== 402 && !r.headers.get("payment-required"), body: await r.json() };
  };
  const v03 = await rpc({ jsonrpc: "2.0", id: 7, method: "message/send", params: { message: { kind: "message", role: "user", messageId: "m1", parts: [{ kind: "text", text: "what does the fleet cost?" }] } } });
  check("message/send -> 200, never 402", v03.status === 200 && v03.noPay, `got ${v03.status}`);
  check("v0.3 echo id + result.kind message", v03.body.jsonrpc === "2.0" && v03.body.id === 7 && v03.body.result && v03.body.result.kind === "message" && v03.body.result.role === "agent");
  check("agent message parts carry text", Array.isArray(v03.body.result.parts) && /x402/i.test(v03.body.result.parts[0].text || ""));
  check("metadata marks free + canonical payTo", v03.body.result.metadata && v03.body.result.metadata.free === true && v03.body.result.metadata.x402.payTo === CANONICAL_PAY_TO);

  // AGENSTRY-W1 c6: v1 SendMessage must speak protojson (ROLE_AGENT enum, bare
  // oneof parts without "kind"); v0.3 message/send keeps kinded lower-case form.
  // Agenstry's live_responds validator judges the result body against the schema
  // of the negotiated method — a kinded v0.3 body under SendMessage = "not a
  // valid JSON-RPC 2.0 A2A response" (the exact probe finding 2026-09-28).
  const v1 = await rpc({ jsonrpc: "2.0", id: "c9", method: "SendMessage", params: { message: { kind: "message", role: "user", messageId: "m2", parts: [{ kind: "text", text: "score my azuki outreach email" }] } } });
  check("SendMessage (v1) answered with protojson SendMessageResponse", v1.body.result && v1.body.id === "c9" && v1.body.result.message && v1.body.result.message.role === "ROLE_AGENT" && v1.body.result.kind === undefined);
  check("v1 parts are bare oneof (no kind discriminator)", Array.isArray(v1.body.result.message.parts) && v1.body.result.message.parts.length === 1 && v1.body.result.message.parts[0].kind === undefined && typeof v1.body.result.message.parts[0].text === "string");
  check("email intent -> power-pack pointer", /power-pack/.test(v1.body.result.message.parts[0].text || ""));

  const v1bare = await rpc({ jsonrpc: "2.0", id: "c10", method: "SendMessage", params: { message: { role: "ROLE_USER", messageId: "m3", parts: [{ text: "show me azuki nft signal options" }] } } });
  check("v1 bare-text inbound parts parsed (nft pointer fired)", /nft-alpha/.test(v1bare.body.result.message.parts[0].text || ""));

  const gc = await rpc({ jsonrpc: "2.0", id: 2, method: "GetAgentCard", params: {} });
  check("GetAgentCard returns card url", gc.body.result && gc.body.result.url === card.url);

  const unk = await rpc({ jsonrpc: "2.0", id: 3, method: "tasks/dance", params: {} });
  check("unknown method -> -32601", unk.body.error && unk.body.error.code === -32601);

  const bad = await rpc({ hello: "world" });
  check("non-JSON-RPC -> -32600", bad.body.error && bad.body.error.code === -32600);

  // (4) no paid route was affected: unpaid fleet-bundle still challenges 402.
  // First requests may race x402Server.initialize() and answer 500 (same
  // known race + retry budget as test_resource_https.cjs). Nothing is paid.
  let paid = { status: 0 };
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    paid = await fetch(`${base}/api/fleet-bundle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "Azuki" }) });
    await paid.text();
    if (paid.status === 402) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  check("paid flagship still 402-gated (no leak)", paid.status === 402, `got ${paid.status}`);
  check("a2a surfaces are NOT in PAID_ROUTES", Object.keys(require("./index.js").PAID_ROUTES).every((k) => !/a2a|agent-card/.test(k)));

  server.close();
  console.log(failures === 0 ? "\nALL AGENT-CARD CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error("harness error:", e); process.exit(1); });
