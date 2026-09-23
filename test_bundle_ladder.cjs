// STRAT-26 acceptance math: every curated bundle must be priced STRICTLY BELOW
// the sum of its live per-call parts, and every ladder bundle must be registered
// as a payable route at exactly the advertised price.
// Run: node test_bundle_ladder.cjs   (no secrets needed — dummy env only)
process.env.X402_PAY_TO = process.env.X402_PAY_TO || "0x0000000000000000000000000000000000000001";
process.env.ROUTER_KEY = process.env.ROUTER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // public Hardhat test key #0

const { BUNDLE_LADDER, bundleSumOfParts, PAID_ROUTES } = require("./index.js");

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

for (const b of BUNDLE_LADDER) {
  const sum = bundleSumOfParts(b);
  const price = parseFloat(b.price.replace("$", ""));
  // one line per bundle: bundle_price < sum_of_parts
  check(`${b.id}: ${b.price} < sum-of-parts $${sum.toFixed(2)}`, price < sum,
    b.parts.map(([n, p]) => `${n} $${p.toFixed(2)}`).join(" + "));
  check(`${b.id}: sub-$0.10 ladder ceiling`, price < 0.10);
  const route = PAID_ROUTES[`POST /api/bundle/${b.id}`];
  check(`${b.id}: registered payable route at advertised price`, !!route && route.accepts.price === b.price);
}
check("fleet-bundle route still registered", !!PAID_ROUTES["POST /api/fleet-bundle"]);

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
