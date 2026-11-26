# PLAN-67 — Agent FAQ copy pack (same-day live verified 2026-11-26)

**Deliverable for Airtable row `recnJes5eYFoo8eFl` (PLAN-67: Agent FAQ copy pack).**
**Work source: ONE TABLE (Fleet Execution Queue). Truth: coordination=Library, money=chain,
code=GitHub, runtime=live services. Local files are workspaces only.**

## Provenance / acceptance evidence

Every URL below was re-probed in this run at **2026-11-26T00:23:50Z–00:27:00Z** with curl;
HTTP codes and byte counts are the live read, not a cached claim. The row's original premise
("both routes 404-probed 2026-09-28") is **stale**: `/faq.md`, `/faq.json` and
`/how-it-works.json` are now HTTP 200. The copy is live but its verification stamps and two
material claims are stale — this pack supplies corrected same-day copy.

Live reads used here (all HTTP 200 unless noted):

| URL | Result |
|---|---|
| `https://rae-fleet-router.fly.dev/faq.md` | 200, 3,245 B (stale 2026-10-02 stamps; contract-eye listed as down) |
| `https://rae-fleet-router.fly.dev/faq.json` | 200, 3,404 B (same drift) |
| `https://rae-fleet-router.fly.dev/how-it-works.json` | 200, 1,901 B (step 4 teaches `PAYMENT-SIGNATURE`) |
| `https://rae-fleet-router.fly.dev/pricing.md` | 200, 3,908 B (teaches `PAYMENT-SIGNATURE`; price ladder intact) |
| `https://rae-fleet-router.fly.dev/terms.md` · `/privacy.md` · `/sample` · `/tip.md` · `/llms.txt` · `/buy?format=json` · `/pay-failed?format=json` | all 200 |
| `https://contract-eye-x402.fly.dev/.well-known/x402.json` | 200, 7,598 B; 8 × canonical `0x9b8a27e03CEbA490953cDa8AB1291c0E13bAf72f`, 0 retired |
| `https://contract-eye-x402.fly.dev/api/analyze-contract` (unpaid POST) | 402 `exact` / `eip155:8453` / `5000` atomic / canonical payTo |
| `https://royal-ruby-x402.fly.dev/api/ping` (unpaid) | 402 `exact` / `eip155:8453` / `1000` atomic / canonical payTo |
| `https://raen-mcp-gateway.fly.dev/mcp` (`tools/list` / `tools/call`) | 200 free discovery / 402 `50000` atomic canonical |
| `https://royal-ruby-x402.fly.dev/pricing.md` | **404** — the live FAQ's "12 walls serving /pricing.md 200" claim is stale |
| `https://raen-law-pages.vercel.app/` · `https://settlement-collector.fly.dev/stats` · `https://402index.io/api/v1/services?q=raen` | 200 |

Chain scope is always stated (CHAIN-COVERAGE LAW). Exact balances in the companion Library
artifact are from the same run, 3/3 Base RPCs and 2/2 Ethereum-mainnet RPCs; external
revenue is **$0.00** honestly.

## Corrections carried by this pack (material doc drift)

1. **Retry header.** `/pricing.md` and `/how-it-works.json` still say `PAYMENT-SIGNATURE`.
   The verified retry header is **`X-PAYMENT`** (real $0.001 settle, SDK v2.30, 2026-11-22).
   Following the live doc causes a silent re-challenge and a likely second signing — the
   buyer's most expensive failure. See cookbook recipes 23, 25 and the new recipe 32.
2. **Contract-eye is NOT down.** `/faq.md` + `/faq.json` repeat a 2026-09-28 recovery matrix
   calling contract-eye down; today its manifest and live 402 are canonical. It is absent
   from router `/catalog.json` (a *discovery* gap, cookbook recipe 31), not an outage.
3. **Price authority.** "Each wall's `/pricing.md`" is not universally true — royal-ruby's
   is 404 today. The live 402 `accepts[0]` is the only universal authority.
4. **Verification dates.** Re-probe and restamp; 2026-10-02 is 55 days old.

---

## faq.md — corrected copy

# Agent FAQ — RAE Fleet Router

The buyer-killing questions, answered with same-day verified facts.
Machine-readable twin: `GET /faq.json`. Verified 2026-11-26T00:24Z.

### What happens to my money if a paid wall goes down?

Nothing is charged if the wall never settles: the 402 challenge is free and an unsettled
EIP-3009 authorization expires (`maxTimeoutSeconds` 300). If payment settled but the handler
returned 5xx (non-delivery), the terms grant a retry credit within 24h citing the **tx hash** —
do not pay a second time. Walls that are genuinely retired or scaled to zero are simply not
offered to buyers. contract-eye is **live and canonical** as of this verification; the old
"down" list is stale. A down wall bills nobody.

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/terms.md (200);
https://contract-eye-x402.fly.dev/.well-known/x402.json (200, canonical payTo) ·
https://contract-eye-x402.fly.dev/api/analyze-contract (402 canonical)*

### Are payments final?

Yes. Once the facilitator settles the USDC `transferWithAuthorization` on Base mainnet, the
transfer is on-chain and irreversible. The remedy for non-delivery is the retry-credit path in
`/terms.md`, not a chargeback. Validation 4xx failures are not billed because validation runs
before the payment gate. Your tx hash is your receipt — verify it yourself (recipe 27) rather
than trusting a dashboard.

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/terms.md (200);
https://settlement-collector.fly.dev/stats (200)*

### Where are prices authoritative?

The **live 402 `payment-required` challenge** is the single source of truth. Copy
`accepts[0].amount` verbatim from that response; never from a cached doc or registry.
Verified this run: royal-ruby ping `1000` atomic ($0.001), contract-eye `5000` ($0.005),
gateway `tools/call` `50000` ($0.05), all canonical. `/pricing.md` on the router is a
human-readable mirror (200, ladder intact) but still teaches the stale retry header; some
walls do not serve `/pricing.md` at all (royal-ruby: 404 today).

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/.well-known/x402.json (200);
https://rae-fleet-router.fly.dev/pricing.md (200); live unpaid POST probes above;
https://royal-ruby-x402.fly.dev/pricing.md (404 — stated, not hidden)*

### Who holds keys / custody?

You do. There are no accounts and no API keys for paid calls: your own wallet signs a USDC
EIP-3009 authorization per call. The fleet never sees buyer keys and no PII is required to
pay. (Separate developer-key surfaces such as the gateway's free key request are optional
testing aids, not a custody arrangement; that route returned 404 in this run, so do not rely
on it.)

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/privacy.md (200);
https://raen-mcp-gateway.fly.dev/keys/request (404 — observed, not promised)*

### What network and asset do I need?

USDC on **Base mainnet**: scheme `exact`, network `eip155:8453`, asset
`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals). A $0.01 call is `10000` atomic
units. All three live challenges decoded this run agreed on scheme/network/asset.

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/pricing.md (200) + the live
402 decodes cited above*

### Which header do I attach to the retry?

**`X-PAYMENT`** — the RAEN-verified retry header. `PAYMENT-SIGNATURE` is stale: it produces a
fresh 402 with no error, so a buyer cannot distinguish "wrong header" from "no payment" and
may sign twice. The router's `/pricing.md` and `/how-it-works.json` still carry the wrong
name; treat the live challenge and cookbook recipes 23/25/32 as authoritative until the router
copy is repaired.

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/pricing.md (200, stale token);
https://rae-fleet-router.fly.dev/how-it-works.json (200, stale token);
cookbook recipe 32 snapshot `registry/failure-triage-20261125.json`*

### How do I try before paying?

`GET /sample` returns a free, shape-accurate synthetic bundle response — no payment, never a
402. `GET /buy?format=json` lists the current pay links. For a live-wall check that still
costs nothing, use cookbook recipe 23 (`buyer-preflight`): one unpaid request, decode the
challenge, verify the full 42-character canonical `payTo`, then decide.

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/sample (200);
https://rae-fleet-router.fly.dev/buy?format=json (200)*

### My payment failed — what now?

`GET /pay-failed?format=json` has recovery recipes for the real failure modes. New: cookbook
recipe 32 turns your observed status into a machine-readable verdict with an explicit
`do_not_repay` flag — essential for the silent-re-challenge and "paid but 5xx" cases. If you
have a tx hash, look up the payment at the collector's claims endpoint; recover the claim code
(`RAEN-<sha256(tx)[:10]>`) and register for re-delivery rather than paying again.

*Source (verified 2026-11-26): https://rae-fleet-router.fly.dev/pay-failed?format=json (200);
https://settlement-collector.fly.dev/storefront/claims?tx=0x03a014da1fe7743809b3e3c6653ea1cebd0030474305bfda1b07508ac7f28cd5 (200)*

### How do I verify settlement myself?

Read the chain, not a dashboard. A settled call emits a USDC `Transfer` to canonical
`0x9b8a27e03ceba490953cda8ab1291c0e13baf72f` on Base; cookbook recipe 27 takes your tx hash
and proves the amount and payee with a full case-insensitive address compare. Fleet-wide
telemetry (including the honest $0.00 external revenue) is public at the collector `/stats`.

*Source (verified 2026-11-26): https://settlement-collector.fly.dev/stats (200);
cookbook recipe 27 `registry/buyer-receipt-verification.json`*

### What is the cheapest first call, and can I tip?

`POST /api/ping` on royal-ruby is a $0.001 liveness probe (live 402 `1000` atomic this run) —
the cheapest settled entry point. `POST /api/tip` is a keep-the-change gratuity ($0.01 floor,
$1.00 cap, same canonical payee); a tip returns a receipt and buys no deliverable.

*Source (verified 2026-11-26): https://royal-ruby-x402.fly.dev/api/ping (402 canonical);
https://rae-fleet-router.fly.dev/tip.md (200)*

### Can I find contract-eye in the catalog?

Not yet through the router's `/catalog.json` — it is absent from the advertised host list even
though its `/health`, manifest and live 402 are canonical. That is a **discovery** gap, not a
broken wall: call the direct host (`https://contract-eye-x402.fly.dev/api/analyze-contract`)
with cookbook recipe 08 + recipe 23. Cookbook recipe 31 reproduces the gap (13 expected hosts,
92.3% coverage) and will report 100% after the owner adds the host.

*Source (verified 2026-11-26): https://contract-eye-x402.fly.dev/.well-known/x402.json (200,
canonical payTo); https://rae-fleet-router.fly.dev/catalog.json (200, host absent);
cookbook `registry/catalog-parity-20261125.json`*

---

## faq.json — machine-readable draft (embed target for `GET /faq.json`)

```json
{
  "service": "rae-fleet-router",
  "surface": "faq.json",
  "verified_on": "2026-11-26",
  "verified_utc": "2026-11-26T00:23:50Z",
  "canonical_payto": "0x9b8a27e03ceba490953cda8ab1291c0e13baf72f",
  "verified_retry_header": "X-PAYMENT",
  "corrects": {
    "stale_retry_header": "PAYMENT-SIGNATURE (still in live /pricing.md and /how-it-works.json)",
    "stale_down_claim": "contract-eye listed down per 2026-09-28 matrix; live manifest canonical",
    "stale_price_mirror": "royal-ruby /pricing.md is 404 today"
  },
  "items": [
    {"question":"What happens to my money if a paid wall goes down?","answer":"Unsettled 402 is free and EIP-3009 auth expires (maxTimeoutSeconds 300). Settled-but-5xx gets a 24h retry credit by tx hash - do not re-pay. Contract-eye is live/canonical.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/terms.md"},
    {"question":"Are payments final?","answer":"Yes; USDC transferWithAuthorization settles on Base and is irreversible. Non-delivery remedy is retry credit, not chargeback.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/terms.md"},
    {"question":"Where are prices authoritative?","answer":"The live 402 accepts[0].amount only. Verified: ping 1000, contract-eye 5000, gateway tools/call 50000 atomic, all canonical.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/.well-known/x402.json"},
    {"question":"Who holds keys / custody?","answer":"You do; your wallet signs EIP-3009 per call, no account or API key. Gateway dev-key request was 404 this run.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/privacy.md"},
    {"question":"What network and asset?","answer":"Base mainnet eip155:8453, USDC 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, 6 decimals, scheme exact.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/pricing.md"},
    {"question":"Which retry header?","answer":"X-PAYMENT. PAYMENT-SIGNATURE causes a silent re-challenge / possible double-pay.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/how-it-works.json"},
    {"question":"How do I try before paying?","answer":"GET /sample (free synthetic), GET /buy?format=json, or cookbook recipe 23 buyer-preflight on the direct wall.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/sample"},
    {"question":"My payment failed - what now?","answer":"/pay-failed?format=json; cookbook recipe 32 gives do_not_repay verdict; look up by tx at the claims endpoint and re-arm delivery instead of paying again.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/pay-failed?format=json"},
    {"question":"How do I verify settlement?","answer":"Check the on-chain USDC Transfer to canonical payTo on Base (recipe 27); fleet telemetry at collector /stats, external revenue honestly $0.00.","verified_on":"2026-11-26","source_url":"https://settlement-collector.fly.dev/stats"},
    {"question":"Cheapest first call / tipping?","answer":"royal-ruby /api/ping $0.001 (live 402 verified); /api/tip $0.01 floor - receipt only, no deliverable.","verified_on":"2026-11-26","source_url":"https://rae-fleet-router.fly.dev/tip.md"},
    {"question":"Is contract-eye in the catalog?","answer":"Not in router /catalog.json, but live/canonical on the direct host; discovery gap, not an outage (recipe 31).","verified_on":"2026-11-26","source_url":"https://contract-eye-x402.fly.dev/.well-known/x402.json"}
  ]
}
```

## Scope / handoff

This is a **copy pack**, not a deploy. The router sits inside the owner's BURN FREEZE, so the
corrections above are staged here for the owner-approved deploy window. No agent redeployed,
restarted or scaled an app; no funds moved; no external messages sent; no secrets displayed.
Corroborating Library artifact: TIFFANY EXEC 2026-11-25 18:16 CT (Innovation 25).
