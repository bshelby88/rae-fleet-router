# STRAT-103 — First-Buyer Acquisition Funnel (`/start`) — buildable design spec

**Status:** DESIGN COMPLETE — blueprint only. No router code changed, no deploy (BURN FREEZE).
**Author:** Tiffany (revenue-director, creative) · **Claimed:** 2026-11-25T21:52:00Z · **Spec written:** 2026-11-25T22:0xZ
**Work item:** Airtable Fleet Execution Queue `rec4tuQJY5u48J3FU` (Work Type `revenue_operations`)
**Governing law:** OWNER-VISION (Nov 16) — "get autonomous agents to our platforms to create revenue." Machine-buyer acquisition is the priority.

---

## 1. Problem (grounded, not assumed)

Zero external buyers exist despite 44 advertised endpoints on the router catalog. The buyer is **another machine**, and today it must: find a wall, read a manifest, learn x402 v2, sign an EIP-3009 authorization, pick an RPC, verify on-chain — before it ever sees the product. Every extra step loses machine-buyers. A self-serve, pre-curled entry point removes the acquisition tax.

## 2. Live grounding (measured this run, not from memory)

Source: `GET https://rae-fleet-router.fly.dev/catalog.json` — `generated_utc 2026-11-25T21:58:11.543Z`, 13 walls, 44 endpoints. Independent live 402 decode: `POST https://contract-eye-x402.fly.dev/api/analyze` → HTTP 402, `x402Version 2`, `scheme exact`, `network eip155:8453`, `amount "5000"` ($0.005), `payTo 0x9b8a27e03CEbA490953cDa8AB1291c0E13bAf72f` — **matches catalog; challenge is canonical.**

- **17 endpoints are <=$0.01 (penny cluster).** Cheapest entry points:
  - $0.001 (1000 atomic): `royal-ruby-x402/api/ping` GET, `royal-ruby-x402/api/address-check` GET
  - $0.005 (5000): `contract-eye-x402/api/analyze` POST, `suprapack-x402/api/find-skill` POST, `nft-alpha-x402/api/nft-signal` POST, `escrow-x402/api/escrow/create` POST, + royal-ruby audit routes
  - $0.01 (10000): `nanobanana-x402/api/generate-image` POST, `dispute-forge-x402/api/dispute-pack` POST, `rae-fleet-router/api/tip` POST, `royal-ruby-x402/api/validate-json` POST
- **38/44 items carry canonical payTo.** The other 6 are NOT drift: 1 unreachable (`power-pack`, null payTo) + 5 royal-ruby routes flagged `wrong_network` with null payTo (machine-buyer, machine-buyer-qa.json, buy-compliance, buy-managed, udap-citations). They are free/managed routes — they cannot misroute money. **Funnel must exclude all null-payTo items.**
- **7 null-price items** — the same free royal-ruby routes. Exclude them.
- Catalog tiers: 22 `penny-cluster`, 8 `value-band`, 7 `flagship`, 7 untagged. Some duplicate slugs (`api/*` vs bare) — dedupe by `endpoint_url` before selection.
- Router routes live: `/buy` 200 (18.8KB), `/catalog.json` 200 (34KB), `/explore` 200 (76KB), `/health` 200. `/usage.json` **404** — so the POST-115 crosspost stays hard-gated on EXEC-149; /start must not depend on /usage.
- Note: BURN FREEZE suspends deploy rights on 17 apps (incl. tradingagents, dispute-forge, nft-alpha, vault-pro, escrow, briefsnap, dispatch). Catalog still reports them `ok` (reachable) — the runtime probe gate in §3 is what decides eligibility, not the cached catalog.

## 3. Route design — `GET /start` on rae-fleet-router

Middleware hook-in point: add an **unauthenticated, free** GET route BEFORE `paymentMiddleware` (mirrors the 402-instructions injector pattern — a handler registered after a responding route never runs). `/start` itself never charges; it is pure acquisition surface. No new npm modules → no Dockerfile COPY change → no module-not-found crash-loop risk.

### Step 1 — probe-all-walls gate (on every request, cached 60s)
1. `GET /catalog.json` (local handler, no external fetch needed if in-process).
2. For each candidate endpoint, issue a live bare `POST`/`GET` (per its advertised `method`) with an empty/minimal body.
3. Keep only responses that are **HTTP 402** AND whose decoded `payment-required` header has `x402Version === 2`, `accepts[0].scheme === "exact"`, `network === "eip155:8453"`, `payTo === canonical` (case-insensitive), and a positive numeric `amount`.
4. Drop anything that times out (>8s), returns 200/404/5xx, has null payTo, wrong network, or a missing/invalid `accepts[]`. This is the known "3 null-price walls" exclusion — enforced at runtime, not by a hardcoded denylist.
5. If zero endpoints survive → serve a truthful "fleet temporarily unavailable" page with a `/explore` link. **Never fabricate a challenge.**

### Step 2 — random penny selection
- From survivors with `amount <= 10000` atomic (i.e. <=$0.01), pick one **uniformly at random** (crypto `randomInt`). Prefer endpoints with a non-empty bazaar `example` body so the buyer can copy-paste. Dedupe by `endpoint_url`. Round-robin seed from a per-request nonce so crawlers don't all get the same wall.

### Step 3 — pre-curled 402 block (built from the LIVE challenge, zero hardcoded price)
Render for the selected endpoint:
- The exact method + URL and the exact body from the manifest's bazaar `example` (or the delivered 402 body if richer).
- The decoded `accepts[0]` fields: `amount` (atomic), `asset`, `network`, `payTo` — read from the challenge captured in Step 1, **never** from a price constant (per the contract-eye priceMap doctrine).
- A copy-paste shell block:
  1. `curl -s -D /tmp/h -o /tmp/b -X <METHOD> <URL> -H 'Content-Type: application/json' --data-raw '<example body>'` → receive 402 + `payment-required` header.
  2. Sign `transferWithAuthorization` (**EIP-3009**, not EIP-3005) for `amount` atomic of `asset` to `payTo` on Base — signer-mediated, in the buyer's own wallet; RAEN never sees a key.
  3. Re-send with `X-PAYMENT: <base64 payload>` header (**x402 v2 header name is `X-PAYMENT`**, verified against cookbook recipe 25 / SDK v2.30 — do NOT teach `PAYMENT-SIGNATURE`; that stale guidance is being corrected separately on dispute-forge).
  4. Verify: `cast receipt <tx> --rpc-url https://mainnet.base.org` or `curl` `eth_getTransactionReceipt`, and show the 200 JSON body as the payoff.
- Plain-language note: the machine pays its own wallet; no account, no email, no API key required.

### Step 4 — payment-verification poll + success redirect
- On the server, after the buyer's re-sent request settles, the settlement-telemetry middleware writes the settle event. `/start` polls the collector's `/ledger.json` (or a local settle-event cache) keyed by the challenge's `nonce`/payer for up to ~90s.
- On observed settle (tx present — `tx:null` is NOT settled, per the collector's verified/unverified split): render the received deliverable inline and `302 → /explore` with `?from=start&wall=<slug>` attribution.
- On timeout: show the honest state ("no settlement observed yet") + the `/pay-failed` recovery link (already in catalog `links`). **Never render 200 on a paid call without the advertised deliverable** (F1 settle-order doctrine).

### Step 5 — observability
- Emit `start_shown`, `start_wall_selected{slug}`, `start_settle_observed{slug}` counters to the same telemetry path; do not count a `/start` view as a purchase. Revenue truth stays external+verified settles only.

## 4. Guardrails (non-negotiable)
1. **No deploy this spec.** Router is KEPT-LIVE and BURN FREEZE applies to frozen apps — this is a design artifact for a future owner-approved build.
2. **No external sends** (X/Nostr/email), **no funds moved**, **no wallet/address changes**, **no deletions**, **no secrets** — all owner-only or out of this role.
3. **/TRUTH:** every price, payTo, and body in the funnel must be read from the live 402 challenge at render time. No invented numbers, no "settled" without tx presence, no degraded 200 marketed as full output.
4. **TRUST:** canonical payTo only; wrong-network/null-payTo routes filtered. The 6 non-canonical catalog items above are excluded, not "fixed" here.
5. **Buyer-side honesty:** if a wall's LLM is unavailable, its manifest must disclose the deterministic fallback (contract-eye already does) — /start must not promise model output it cannot deliver.

## 5. Acceptance & evidence (ONE TABLE)
- Acceptance criterion from the queue: `fleet_db/STRAT-103-start-funnel.md` exists with a buildable blueprint. ✅ This file.
- Grounding evidence: `catalog.json` snapshot (generated_utc 21:58:11Z, 13 walls/44 endpoints) + live 402 decode recorded above + router route probes (`/buy` 200, `/catalog.json` 200, `/explore` 200, `/usage.json` 404).
- The actual `/start` route implementation is out of scope for this design row; it needs a separate build/exec work item plus an owner-approved deploy window.

## 6. Handoffs
- **[bean][staci]:** build item for the `/start` route; re-use the live-challenge-driven priceMap pattern; keep capability-gate/paymentMiddleware ordering intact. Do not deploy during BURN FREEZE.
- **[erica][franklin]:** `/start` is the acquisition surface to link from directory/social copy once built — do not publish links before it exists.
- **[owner]:** build + deploy window for `/start` is owner-gated (fleet freeze). No action needed until then.
- **[crown][kip]:** note the stale `PAYMENT-SIGNATURE` guidance on dispute-forge (local commit b433b15, archived repo) — /start's buyer instructions intentionally use `X-PAYMENT`; reconcile before any cross-linking.

External earned revenue this run: **$0.00** (honest, chain-confirmed separately in the run artifact).
