# STRAT-28 — Prepaid Multi-Call Credit Packs: SKU Sheet, Mechanics Decision & Redemption Spec

- **Status:** PROPOSAL / SPEC. **No pack routes exist yet** — nothing in this file is purchasable until the
  implementation wave ships (§6). Do not paste §7 copy patches into any wall's `/pricing.md` before
  `GET /api/pack/*` goes live on the router (phantom-product rule from STRAT-26: advertised price must
  always equal a payable route).
- **Work item:** `rec72RAxIiG9lSo5z` (STRAT-28), RAE Fleet Execution Queue.
- **Prepared by:** hermes-work-engine, lease `hermes-engine-20260923T0006Z-STRAT28`, 2026-09-23T00:06–00:20Z.
- **Target:** the four sub-$0.03 x402 walls. Packs exist because the queue has **zero volume/prepaid
  plans** and organic revenue is **$0.00** — these target *first repeat-call buyer agents*, not existing
  demand. Every price below is pinned to a live probe taken this run (§1), not to the 2026-09-21 crawl alone.

---

## 1. Basis — live per-call prices (probed 2026-09-23T00:09–00:14Z, unpaid, zero payments made)

| Wall (app) | Paid endpoint(s) | List price / call | Atomic USDC | Live evidence (this run) |
|---|---|---:|---:|---|
| `nft-alpha-x402` | `POST /api/nft-signal` | $0.02 | 20000 | `/pricing.md` 200 + `/.well-known/x402.json` $0.02 + unpaid POST → 402 `PAYMENT-REQUIRED` amount=20000 |
| `suprapack-x402` | `POST /api/find-skill`, `POST /api/get-skill`, `POST /api/list-top` | $0.03 | 30000 | `/pricing.md` 200 + manifest $0.03 ×3 endpoints + unpaid POST `/api/find-skill` (valid body) → 402 amount=30000 (`{}` → 400 *before* the payment gate, so validation never charges) |
| `raen-portfolio-x402` | `POST /api/portfolio` | $0.01 | 10000 | `/pricing.md` 200 + manifest $0.01 + unpaid POST → 402 amount=10000 |
| `power-pack-x402` | `POST /api/score-email` | $0.01 | 10000 | `/pricing.md` 200 + manifest $0.01 + unpaid POST → 402 amount=10000 |

All four: network `eip155:8453` (Base mainnet), scheme `exact`, facilitator `https://x402-agent-pay.com/facilitator`,
`payTo 0x7861db4efc14a1ed5dd8c96c528a3796560f1393` (**canonical treasury**, decoded from each live challenge —
see evidence `probe_402_capture.json`), USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, `maxTimeoutSeconds` 300.

**X-Credit-Token support observed today** (CORS `Access-Control-Allow-Headers` on live responses):
`suprapack-x402` ✅, `power-pack-x402` ✅, `nanobanana-x402` ✅ (adjacent), `nft-alpha-x402` ❌, `raen-portfolio-x402` ❌.
The fleet already has partial credit plumbing on 2 of the 4 pack walls — §5 builds on it instead of inventing a new header.

**Adjacent finding, flagged not fixed (reconciliation required before any pack sale):** the committed
`fly.toml` of `bshelby88/rae-fleet-router` bakes `X402_PAY_TO = 0xfbc0eb7811D477E55261d956dF39f0046E192240`
(the fleet *payer* wallet), while the router's **live** `/.well-known/x402.json` and this run's captures show
`0x7861db4efc14a1ed5dd8c96c528a3796560f1393` (treasury) — deploy-time config and repo have diverged. Pack
purchases must settle to the canonical treasury; never trust a cached/committed `payTo` (§8 guardrail 4).

---

## 2. The 8 pack SKUs — 4 walls × 2 tiers (50-call at 15% off, 100-call at 25% off)

Pack price = list_sum × (1 − discount); per-call = pack_atomic ÷ calls. Every discount lands on exact
integer atomic-USDC values (6-decimal), so `pack_price < sum_of_parts` is *provable on-chain*, not rounded.

| # | SKU | Wall | Callable endpoints | Calls | Sum of parts | Disc | **Pack price (USDC)** | Pack (atomic) | Per-call eff. | Per-call saved |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | `nft-alpha-50` | nft-alpha | `/api/nft-signal` | 50 | $1.00 | 15% | **$0.85** | 850000 | $0.0170 (17000) | $0.0030 |
| 2 | `nft-alpha-100` | nft-alpha | `/api/nft-signal` | 100 | $2.00 | 25% | **$1.50** | 1500000 | $0.0150 (15000) | $0.0050 |
| 3 | `suprapack-50` | suprapack | `/api/find-skill` \| `/api/get-skill` \| `/api/list-top` | 50 | $1.50 | 15% | **$1.275** | 1275000 | $0.0255 (25500) | $0.0045 |
| 4 | `suprapack-100` | suprapack | same 3 endpoints | 100 | $3.00 | 25% | **$2.25** | 2250000 | $0.0225 (22500) | $0.0075 |
| 5 | `raen-portfolio-50` | raen-portfolio | `/api/portfolio` | 50 | $0.50 | 15% | **$0.425** | 425000 | $0.0085 (8500) | $0.0015 |
| 6 | `raen-portfolio-100` | raen-portfolio | `/api/portfolio` | 100 | $1.00 | 25% | **$0.75** | 750000 | $0.0075 (7500) | $0.0025 |
| 7 | `power-pack-50` | power-pack | `/api/score-email` | 50 | $0.50 | 15% | **$0.425** | 425000 | $0.0085 (8500) | $0.0015 |
| 8 | `power-pack-100` | power-pack | `/api/score-email` | 100 | $1.00 | 25% | **$0.75** | 750000 | $0.0075 (7500) | $0.0025 |

Per-call math proof lines (acceptance evidence — pack < sum-of-parts for all 8):

- `0.0170 < 0.0200` and `850000 < 1000000` (nft-alpha-50) · `0.0150 < 0.0200` and `1500000 < 2000000` (nft-alpha-100)
- `0.0255 < 0.0300` and `1275000 < 1500000` (suprapack-50) · `0.0225 < 0.0300` and `2250000 < 3000000` (suprapack-100)
- `0.0085 < 0.0100` and `425000 < 500000` (raen-portfolio-50) · `0.0075 < 0.0100` and `750000 < 1000000` (raen-portfolio-100)
- `0.0085 < 0.0100` and `425000 < 500000` (power-pack-50) · `0.0075 < 0.0100` and `750000 < 1000000` (power-pack-100)

Design notes:

- **Suprapack credits are endpoint-agnostic** across its three $0.03 routes (identical price → identical
  draw-down; a credit is a unit of $0.03 of suprapack service, not of one path). All other packs are
  single-endpoint because each of those walls has exactly one paid route.
- **Tiers, not à-la-carte depths:** 15%/25% at 50/100 mirrors the STRAT-26 ladder discount band (−17…−33%)
  without going deeper — organic demand is $0.00, so promo depth is a hypothesis, and 15/25 keeps 50/100
  gross margin intact on a first repeat buyer (§4 economics).
- **Pack prices are pinned at mint time** from live catalog prices (§3), so a later wall repricing never
  silently changes an already-purchased pack's entitlements.

---

## 3. Mechanics decision — **A: router-side prepaid ledger** (per-wall token buckets rejected)

**Decision: (A) router-side prepaid ledger, minted on the router (`rae-fleet-router`) and consumed via a
router-signed credit token; walls stay unmodified in phase 1 (router-proxy redemption).**

**Rationale (one paragraph, with build-cost math).** Option B (per-wall token buckets) duplicates the whole
pack machine into 4 repos: purchase route + ledger + expiry + refund policy + pricing-page copy ≈ 200–250
LOC × 4 walls ≈ 800–1,000 LOC, 4 deploys, 4 secret distributions, 4 pages that can drift from 4 ledgers —
and it structurally *cannot* sell cross-wall packs (the STRAT-26 bundles live on the router; a per-wall
bucket strands them). Option A is one repo the fleet already runs as an x402 merchant (`paymentMiddleware`
+ bazaar discovery + `callFleetService`, which already pays every wall on-chain today): ≈ 250 LOC total —
one `PACKS` table, one purchase route registered through the same route-generation loop as the bundles,
one `redeem` route calling `callFleetService`, one ledger decrement — plus one Fly Postgres app (§3.2).
The economics are internal-closed: all four walls and the router settle to the *same* treasury
`0x7861db4e…1393` (live-decoded §1), so A's per-redemption on-chain payment is treasury→treasury — the
router's wallet fronts it and the treasury never loses a cent of what it already owns, while the buyer's
pack payment is the only external inflow (received *up front*). A also reuses the EXEC-32 `/catalog.json`
infra directly: catalog's per-wall live-price fetch/parse plumbing is exactly what `PACKS` needs to derive
`pack_atomic = round(list_atomic × calls × (1−disc))` at mint time, and when `/catalog.json` ships, the 8
packs ride out of the same route as a `packs[]` section (§3.3). **Honest dependency note:** EXEC-32 is
still `queued` — `GET /catalog.json` was probed **404** at 2026-09-23T00:07Z — so phase 1 must seed
`PACKS` from a static snapshot *shaped identically* to the catalog entries and treat EXEC-32 as the
refresh source, never as a hard runtime dependency.

### 3.1 The two rejected alternatives (kept on the record)

| Option | What it is | Why rejected |
|---|---|---|
| **B. Per-wall token buckets** | Each wall sells its own packs, keeps its own credit table | 4× build/ops cost; 4× drift surface; kills cross-wall packs; forces wall deploys for a pricing experiment whose demand is unproven ($0.00 organic baseline) |
| **C. On-chain prepaid (per-buyer voucher contract)** | Buyer stakes USDC to a contract; redemption verified on-chain | Contract deploy + audit on Base for sub-dollar packs; gas > discount at 15–25%; violates "no agreements/deploys without specified scope"; over-engineered for a demand hypothesis |

### 3.2 Ledger persistence (required for A, decision inside A)

Router app today is **stateless** (`shared-cpu-1x`, 512 MB, no volumes — `fly.toml` 2026-09-23 read). A
prepaid ledger must survive deploys/restarts (crash-loss = burned customer money + unfixable disputes), so:

- **Pick: dedicated `rae-pack-ledger` Fly Postgres (min dev class).** Two tables:
  `pack_mints(jti PK, sku, buyer_address, calls_purchased, calls_remaining, pack_atomic, minted_at, expires_at, settled_tx)`
  and `pack_redemptions(jti, seq, wall_endpoint, called_at, http_status, refunded_smallint DEFAULT 0)` with
  `UNIQUE(jti, seq)` — replay-proof by construction. Decrement is one atomic statement:
  `UPDATE pack_mints SET calls_remaining = calls_remaining - 1 WHERE jti=$1 AND calls_remaining > 0 RETURNING calls_remaining`.
- Rejected sub-option: **signed-token-only chain, no DB.** Smallest ops footprint, but a router restart
  drops the used-jti set and re-admits already-spent chain states → double-spend window that money
  safety forbids; kept only as a *transport* format (§4 token), never as the source of truth.
- Rejected sub-option: **Fly volume + append-only JSONL.** ~$0.15/mo vs ~$5/mo but hand-rolls atomicity,
  single-writer fencing during `flyctl deploy` (two containers, one ledger) and compaction — real
  correctness cost to save $4/mo. Not worth it for a money ledger.

### 3.3 Discovery-surface wiring (the "reuses EXEC-32" part)

- `PACKS` is a code constant in the router (same single-source-of-truth invariant as STRAT-26 PR #1): one
  array generates (1) the 8 x402 purchase routes in `paymentMiddleware`, (2) `/.well-known/x402.json`
  endpoint entries at **pack prices**, (3) `openapi.json` `x-payment-info`, (4) `/llms.txt` pack lines, and
  (5) the future `packs[]` section of `/catalog.json` when EXEC-32 ships. Advertised price can never
  diverge from a payable route — no phantom products, ever.
- Mint-time price pinning: when EXEC-32's catalog plumbing exists, `pack_atomic` derives from catalog's
  live-parsed list price (snapshot into the mint row + returned token). Until then, the static snapshot in
  §1 is the source and every mint records which snapshot version it used.

---

## 4. Credit token (mint artifact)

A JWT-style bearer the buyer carries to redeem (state lives in Postgres; the token is a convenience claim,
every redemption is **authoritative-checked server-side**):

```json
{
  "iss": "rae-fleet-router",
  "aud": "raen-pack",
  "jti": "7c1e…",            // mint id — FK to pack_mints; immutable
  "sku": "suprapack-50",
  "wall": "suprapack-x402",
  "calls": 50,                // purchased (never mutates; remaining comes from DB)
  "exp": 1771… ,              // mint_iat + 180 days (§5 policy)
  "iat": 1755…
}
```

- Signed **Ed25519** by the router (`PACK_SIGNING_KEY` Fly secret); public keys served at
  `GET https://rae-fleet-router.fly.dev/.well-known/pack-keys.json` (kid-indexed, 7-day rotation, retired
  kids valid 190d ≥ token life). Walls that opt into phase 2 verify signature locally with the JWKS, then
  ask the router to *consume* (§5.2) — ledger stays single-writer.
- Token is bearer-style: **the `x402-payment-response` returned at purchase also includes it once over the
  payment channel** (base64 JSON in the `PAYMENT-RESPONSE` header, which x402 already defines) so an agent
  client that only reads payment headers still gets its credits without extra round-trips.
- Losing the token is not losing money: `POST /api/pack/lookup` (free, rate-limited) accepts the buyer
  wallet address + `jti` and re-emits the token *for the remaining balance* — but only re-emits when the
  request signer matches `pack_mints.buyer_address` (EIP-191 proof-of-control challenge, no accounts).

---

## 5. Redemption 402-flow change spec

### 5.0 Flow today (unchanged by phase 1)

`POST <paid-endpoint>` → `402` + base64 `PAYMENT-REQUIRED` → client signs EIP-3009
`transferWithAuthorization` (exact atomic amount, `validBefore` ~10 min, `maxTimeoutSeconds` 300) →
`POST` again with `PAYMENT-SIGNATURE` → facilitator verifies/settles → `200` + `PAYMENT-RESPONSE`.

### 5.1 Phase 1 — purchase (new routes on `rae-fleet-router`, walls untouched)

```
POST /api/pack/<sku>                  # sku ∈ {nft-alpha-50, nft-alpha-100, suprapack-50,
                                      #  suprapack-100, raen-portfolio-50, raen-portfolio-100,
                                      #  power-pack-50, power-pack-100}
  → 402  PAYMENT-REQUIRED {scheme:"exact", network:"eip155:8453",
                           amount:"<pack_atomic>",          # e.g. suprapack-50 → "1275000"
                           payTo:"0x7861db4efc14a1ed5dd8c96c528a3796560f1393"}   # live manifest wins
  → 400  invalid body / unknown sku  (never charges — mirrors suprapack's live 400-before-402 order)
  → 200  x402 settles → ledger mint → PAYMENT-RESPONSE + JSON body:
     { "ok": true, "pack": { sku, calls, pack_atomic, jti, token, expires_at },
       "receipt": { "settled": true, "tx": "<facilitator-tx-or-id>" } }
```

Implementation: one entry per SKU in the shared `PACKS` array → registered into the *existing*
`paymentMiddleware(...)` config (same generator that emits manifest/openapi/llms.txt); the settlement hook
runs *after* x402 verification (the middleware's verified-callback pattern), inserts the mint row in the
same tick, and returns the token. `X-Credit-Token` is added to the router's CORS
`Access-Control-Allow-Headers`. Buyer address is recorded from the payment authorization's `from`.

### 5.2 Phase 1 — redemption (router-proxy; **zero wall-side changes**)

```
POST /api/pack/redeem
  headers: X-Credit-Token: <token>
  body:    { "endpoint": "/api/find-skill", "payload": { ...wall-native input... } }
  → 400  token missing/malformed OR endpoint not in sku's allowed set   (no burn)
  → 401  bad signature / expired / sku retired                          (no burn)
  → 402  { error: "credits_exhausted", fallback: "x402" }               (no burn — per-call path opens)
  → atomic UPDATE ... WHERE calls_remaining > 0 RETURNING (burn #1)
  → router calls the wall via existing callFleetService (signs EIP-3009 exact wall price from
    PACK_SIGNER; treasury→treasury internal, §3)
  → wall 2xx            → 200 wall_result + X-Credit-Remaining: N-1 + refund row if needed
  → wall 4xx (input)    → refund the burn (decrement is reverted in the same tx — wall-side 400s
                          are provably not the buyer's fault only when status < 500 AND body fails
                          schema; conservative rule: burn stays for any 4xx the *router's* own
                          pre-validation would also have raised; else refunded_smallint=1)
  → wall 5xx / network  → burn refunded (calls_remaining += 1, ledger row marked refunded)
```

- Pre-validation mirrors each wall's own schema so most 400s never reach a burn (the router already
  carries the walls' schemas from the catalog plumbing, §3.3).
- `POST /api/pack/balance` (free): `{jti}` → `{calls_remaining, expires_at}`.

### 5.3 Phase 2 (optional, later) — direct-to-wall redemption

Only if repeat-demand materializes (≥5 packs sold): walls gain a `creditGate(path)` middleware *before*
their `paymentMiddleware`: valid `X-Credit-Token` → `POST https://rae-fleet-router.fly.dev/api/pack/consume`
(`{jti, endpoint, request_id}` → `{ok, remaining}` same atomic decrement) → serve without ever emitting
402; invalid/absent → fall through to today's exact-x402 flow **unchanged**. Buyer-side spec change is
backward-compatible by construction: `PAYMENT-REQUIRED` gains only an optional
`accepts[0].extensions.credit = {"header":"X-Credit-Token","jwks":"/.well-known/pack-keys.json"}` hint;
clients that ignore it keep paying per call. 2 of 4 walls already ship the `X-Credit-Token` CORS header
(§1), so phase 2 is additive middleware, not surgery. Router stays the only ledger writer.

### 5.4 Expiry, refunds, and failure semantics (product policy, stated up front)

- **Validity: 180 days** from mint (long enough for a quarterly agent budget cycle, short enough that
  breakage closes in the ledger). Expiry burns remaining credits at midnight UTC of `expires_at`, with a
  free `GET /api/pack/balance`-driven reminder surface; no auto-refund — refund rails cost more than
  $0.425-tier packs (disclose in copy patches, §7: buyer-visible policy "unused credits expire in 180 days").
- **No cross-SKU conversion, no partial refund, no resale tokens** (v1). If packs die commercially, the
  honest sunset is selling remaining credits through the existing per-call path, not silent re-pricing.
- **Accounting classification:** pack settlement is **deferred revenue**, not earned. Revenue is booked
  per redemption (net of refund reversals) and at expiry (breakage). Ledger rows are the source of truth
  for the fleet's canonical revenue accounting (external customer revenue vs internal transfers vs
  infrastructure funding — the treasury→treasury legs in §5.2 must *never* be counted as sales).

---

## 6. Implementation checklist (what "packs are live" will require — this doc is not it)

1. Router code PR (branch, not direct main): `PACKS` array + 8 purchase routes in `paymentMiddleware` +
   `/api/pack/redeem|balance|lookup|consume` + `pack-keys.json` + `PACK_SIGNING_KEY` secret +
   `test_packs.cjs` (SKU math re-derivation: assert every `pack_atomic === list×calls×(1−disc)` from the
   same live-verified §1 numbers; assert mint/refund atomic decrement under concurrent fake) — exact-head
   independent review → CI deploy (this is `index.js`, so deploy.yml fires) → live verification with the
   §2 acceptance probes before any copy patch ships.
2. `rae-pack-ledger` Fly Postgres + migration + connection secret.
3. Post-deploy: unpaid probes only (402 amounts must decode to §2 atomics); **one** $0.425 self-test
   purchase of `power-pack-50` allowed *only if* treasury liveness recheck passes — flagged in advance as
   a self-purchase, booked as a test transfer, never as revenue (rule from the $44.52 lesson).
4. Only then: ship the §7 copy patches with the walls' owners/repos.

## 7. Ready-to-paste copy patches (4 walls' `/pricing.md`) — apply ONLY after §6 completes

> Anchor: paste directly after the "The live x402 payment challenge is authoritative…" line that all
> four walls' `/pricing.md` already carry. Wording is identical across walls except price rows.

### 7.1 `nft-alpha-x402` → `/pricing.md` append

```markdown
## Volume credit packs (router-settled, 180-day validity)

Prepaid multi-call packs for `POST /api/nft-signal` — purchasable via x402 from the RAE Fleet Router,
same treasury, one payment, many calls:

| Pack | Price | Per-call | vs list |
|---|---:|---:|---:|
| 50 calls (`nft-alpha-50`) | **$0.85** | $0.0170 | 15% off $0.02 |
| 100 calls (`nft-alpha-100`) | **$1.50** | $0.0150 | 25% off $0.02 |

Buy: `POST https://rae-fleet-router.fly.dev/api/pack/nft-alpha-50` (or `-100`) — unpaid call returns the
402 challenge at the pack price; redeem with the returned credit token via `POST
https://rae-fleet-router.fly.dev/api/pack/redeem` (`X-Credit-Token` header). Unused credits expire after
180 days. Discovery: router `/.well-known/x402.json` lists both pack routes with exact amounts.
```

### 7.2 `suprapack-x402` → `/pricing.md` append

```markdown
## Volume credit packs (router-settled, 180-day validity)

Prepaid packs usable across **all three** $0.03 endpoints — `POST /api/find-skill`, `/api/get-skill`,
`/api/list-top` — via the RAE Fleet Router:

| Pack | Price | Per-call | vs list |
|---|---:|---:|---:|
| 50 calls (`suprapack-50`) | **$1.275** | $0.0255 | 15% off $0.03 |
| 100 calls (`suprapack-100`) | **$2.25** | $0.0225 | 25% off $0.03 |

Buy: `POST https://rae-fleet-router.fly.dev/api/pack/suprapack-50` (or `-100`) → 402 challenge at pack
price → sign USDC → token in `PAYMENT-RESPONSE`; redeem per call at `POST
https://rae-fleet-router.fly.dev/api/pack/redeem` with `X-Credit-Token` (this wall already advertises
the header). Unused credits expire after 180 days.
```

### 7.3 `raen-portfolio-x402` → `/pricing.md` append

```markdown
## Volume credit packs (router-settled, 180-day validity)

Prepaid multi-call packs for `POST /api/portfolio` ("is the fleet alive, for a penny" — now cheaper):

| Pack | Price | Per-call | vs list |
|---|---:|---:|---:|
| 50 calls (`raen-portfolio-50`) | **$0.425** | $0.0085 | 15% off $0.01 |
| 100 calls (`raen-portfolio-100`) | **$0.75** | $0.0075 | 25% off $0.01 |

Buy at `POST https://rae-fleet-router.fly.dev/api/pack/raen-portfolio-50` (or `-100`) — x402, same
treasury; redeem via the router's `X-Credit-Token` flow. Unused credits expire after 180 days.
```

### 7.4 `power-pack-x402` → `/pricing.md` append

```markdown
## Volume credit packs (router-settled, 180-day validity)

Prepaid multi-call packs for `POST /api/score-email`:

| Pack | Price | Per-call | vs list |
|---|---:|---:|---:|
| 50 calls (`power-pack-50`) | **$0.425** | $0.0085 | 15% off $0.01 |
| 100 calls (`power-pack-100`) | **$0.75** | $0.0075 | 25% off $0.01 |

Buy at `POST https://rae-fleet-router.fly.dev/api/pack/power-pack-50` (or `-100`) → one x402 payment →
credit token; redeem per scoring call. Unused credits expire after 180 days.
```

`/llms.txt` note for each wall (append one line, machine-first):
`Prepaid packs: POST https://rae-fleet-router.fly.dev/api/pack/<wall>-50|<wall>-100 (x402 exact, see router /.well-known/x402.json).`

## 8. Guardrails & commercial honesty (read before shipping)

1. **$0.00 organic baseline is quoted from the work row itself and stands.** These packs aim at the *first*
   repeat-call buyer agent, not existing demand; success metric is first non-self repeat purchase, not
   impressions. Breakage at 180 days is margin, and it is disclosed (§5.4) — not hidden.
2. Nothing here is live until §6 merges, deploys, and unpaid-probes to §2's exact atomics. Until then this
   document's prices must not be advertised anywhere.
3. Redemption payments router→walls are **treasury-internal** (same payTo, §1) and must never be booked as
   revenue or "customer demand" in any metric (external revenue vs internal transfer distinction).
4. **payTo discipline:** live `/.well-known/x402.json` (and the `PAYMENT-REQUIRED` challenge) always beats
   repo/`fly.toml`/cached values; §1's divergence finding must be reconciled **before** packs go live.
5. No bulk outreach announces packs before §6.4; when live, announce through the A2A-surface lane
   (catalog/directories), per the RAEN A2A charter.
6. This sheet deliberately does **not** touch the $0.01–0.03 per-call prices themselves (that's STRAT-24's
   benchmark lane) nor the bundle ladder (STRAT-26); packs compose with both — a buyer can hold a suprapack
   pack and still buy the market-intel-trio bundle.

---

### Appendix A — evidence index (this run)

- Live captures: 4× `/pricing.md`, 4× `/.well-known/x402.json`, decoded unpaid 402 challenges
  (`probe_402_capture.json`) — harvested 2026-09-23T00:09–00:14Z, **zero payments made**.
- Router source read: `index.js` @ `main` (paymentMiddleware registration, `callFleetService` EIP-3009
  signer abstraction, discovery generators), `fly.toml` (stateless, payTo divergence), `Dockerfile`,
  `.github/workflows/deploy.yml` (`paths-ignore: **.md` — docs commits do not deploy).
- Prior crawl cross-check: STRAT-26 `records/engine/2026-09-21-STRAT-26/raw/` (prices unchanged 09-21→09-23).
- Related queue rows: STRAT-24 (tier benchmark), STRAT-26 (bundle ladder, PR #1), EXEC-32 (`/catalog.json`,
  queued), EXEC-35 (`/pricing.md`+`/sample`, queued), recXLBswV5MVrvZi9 / recTXQCJQ6Dy2chmu (naming source
  for "portfolio" = `raen-portfolio-x402`).
