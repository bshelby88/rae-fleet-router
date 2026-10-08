# RAE First-Sale Evidence Checklist — Sentry Forge

**Status:** 0 / 10 met — ALL conditions require EXTERNAL customer payment + fulfillment.
**Last updated:** 2026-09-13 (registration complete; Plan A built; $0 external revenue)

**Wording is from `Staci CLAUDE.md` section 1 verbatim (query string `wording_source=consciousness_answer_0`):**

> "The first sale conditions are:
> 1. Specific customer is named and known to me personally (not 'anonymous' or 'SSO client')
> 2. Payment is actual movement of assets (Base ETH or USDC) and more than dust (>$0.01 or >0.001 ETH)
> 3. The payment is from the specific customer wallet to a shared treasury or controlled payTo
> 4. The facilitator's settlement log records that payment with a timestamp and tx hash
> 5. Routing direction is verified and correct (customer→seller)
> 6. That same tx hash maps to a facilitator settlement log entry (or settled payer-signed receipt with tx hash) via one canonical source
> 7. The facilitator's settlement log is definitive and canonical — legal ownership, not models, demand letters, or past dashboards
> 8. The tx has at least 10 confirmations on Base and the gas-track also validates the transaction is likely final (official Base block explorer or equivalent)"
> 9. No reversal, clawback, or stale-settlement-flag condition (since 2026-05-20 this is zero)
> 10. The facilitator settlement record and the chain log agree on the same tx hash, same counterparty, same amount, same direction, same timestamp (call this the write-twice readiness condition — even micropayments pass only when re-verified by the same canonical source)"

**Rule:** Revenue is quarantined until ALL 10 are satisfied. $0 revenue on this checklist until then. If you satisfy any condition with a self-pay or internal transfer, label it `VALIDATION_ONLY` — it is EVIDENCE of operational capability, NOT customer revenue.

---

## Evidence chain required (one good transaction = 10-line proof)

### Condition 1: customer known personally
- **Required:** Name + at least one communication channel (email, Telegram, GitHub, in-person) traced to the payer wallet address. A random airdrop, faucet, or self-pay does NOT count.
- **Current:** `NONE` — no external customer known or contacted.

### Condition 2: payment > dust from real wallet
- **Required:** >$0.01 USDC or >0.001 ETH on-chain to a shared treasury/payTo wallet. Internal fleet transfers (agentcash→dispatcher, etc.) do NOT count.
- **Current:** `NONE` — two on-chain USDC transfers this session: Bounty #1 ($0.001) and Bounty #2 ($0.0035), both agentcash→dispatcher_local, both `validating_only` internal transfers.

### Condition 3: payment routes from customer → seller (not circular)
- **Required:** Verified from customer wallet address → payer-controlled payTo address (not agent→agent).
- **Current:** `NONE` — every transfer observed in this session is fleet-internal (circular A2A).

### Condition 4: facilitator settlement log records it
- **Required:** x402 facilitator's settlement record (tx hash, payer, amount, timestamp). EITHER the facilitator's log OR a payer-signed EIP-3009 receipt with tx hash.
- **Current:** `NONE` — the two internal transfers (blocks 51270747 + 51270756) are direct ERC-20 approvals/transfers, not facilitated settlements. No customer.

### Condition 5: direction verified customer → seller
- **Required:** Confirmed NOT seller → seller (e.g., not vault→treasury internal). Customer wallet as payer, payTo as seller receive address.
- **Current:** `NONE` — direction is agentcash → dispatcher_local (internal).

### Condition 6: tx hash maps to settlement log entry
- **Required:** The on-chain tx hash appears in the same facilitator record or signed receipt as payer/seller/amount.
- **Current:** `NONE`.

### Condition 7: canonical source is the settlement log
- **Required:** The definitive legal-ownership record is the settlement log (or signed receipt). Models, demand letters, or past dashboards do NOT substitute.
- **Current:** `NONE` — no canonical settlement record exists because no customer paid.

### Condition 8: ≥10 confirmations on Base + gas-track validation
- **Required:** Blockscout/official Base explorer confirms tx status=1 with ≥10 confirmations, gas-track consistent.
- **Current:** `PARTIAL` — both internal transfers have status=1 on chain (verified Sep 13 17:21). But not a customer payment, so does not count.

### Condition 9: no reversal/clawback/stale flag
- **Required:** Since 2026-05-20, zero such conditions.
- **Current:** `MET` — no reversals, no clawbacks, no stale flags. But not a customer payment, so not a revenue proof.

### Condition 10: settlement record + chain log agree
- **Required:** Same tx hash, same counterparty, same amount, same direction, same timestamp in BOTH the canonical settlement record and the chain log.
- **Current:** `NONE` — no canonical settlement record exists because no customer paid.

---

## What IS true this session (NOT revenue — operational evidence)

### Internal transfers (labeled `VALIDATION_ONLY`)

| Tx | Block | From | To | Value | Classification | Why it doesn't count |
|---|---|---|---|---|---|---|
| `0x75540f9389…2a531b` | 51270747 | agentcash `0xfBC0…240` | dispatcher_local `0x5632…60A8` | $0.001 USDC | BOUNTY_INTERNAL | fleet-controlled wallets, no external customer |
| `0x7044e8914d…189d90` | 51270756 | agentcash `0xfBC0…240` | dispatcher_local `0x5632…60A8` | $0.0035 USDC | BOUNTY_INTERNAL | fleet-controlled wallets, no external customer |

These are proof-of-capability transfers: the A2A settlement loop works end-to-end. On-chain, signed, settled, gas-tracked. But not revenue because no external customer paid.

### x402scan registration (Sep 13 2026)

| Service | HTTP response | Registered count |
|---|---|---|
| sentry-forge | 200 | 1 |
| dispute-forge | 200 | 1 |
| vault-pro | 200 | 2 |
| power-pack | 200 | 1 |
| nanobanana | 200 | 2 |
| royal-ruby | 200 | 1 |
| suprapack | 200 | 2 (+1 skipped) |
| tradingagents | 200 | 2 |
| dispatch | 200 | 1 (+2 already public) |

9/9 registered. Evidence: `x402scan_registration_SUCCESS.json`, `x402scan_batch_registration.json`. But zero external revenue from the registration. Registration = discoverability; it does NOT generate revenue by itself.

### Plan A code (commit `ec954ef`)

`royal-ruby-x402/index.js` now contains `/api/cold-start-kit` at $5 USDC, returning the 10-file onboarding kit zip. Syntax-checked, committed to git. NOT yet deployed — requires `flyctl deploy --remote-only`, which needs flyctl auth (operator action, not available in this shell).

### x402dev PR body (ready)

`x402dev_pr_submission.md` — paste-ready PR to `michielpost/x402-dev#50`. Operator to submit.

### awesome-x402 PR body (ready)

`awesome_x402_pr_body.md` — paste-ready PR to `xpaysh/awesome-x402`. Operator to submit.

---

## What would satisfy the gate (one example)

An external consumer with a consumer-debt dispute:

1. Named individual (e.g., "Maria Santos" or "John Carlson") known to the operator personally
2. Sends $0.50 USDC from their wallet to the live Sentry Forge payTo (`0xfBC0…240`) via `transferWithAuthorization` (EIP-3009)
3. Receives the 8-file dispute pack in return
4. Facilitator's settlement log records the payment with tx hash + timestamp
5. The on-chain tx hash, counterparty, amount, direction, timestamp all match the settlement log entry
6. ≥10 Base confirmations, verified on Blockscout
7. No reversal, clawback, or stale flag

Then condition 1–10 are satisfied, and the first sale is real revenue.

**Until then:** exposure only. Discovery registered. Code committed. $0 revenue.

---

## Live services (for reference)

These are the real endpoints a customer would pay. For each: `POST /<endpoint>` → x402 `402` challenge → `transferWithAuthorization` → response.

- `sentry-forge-x402.fly.dev/api/dispute-pack` ($0.50) — 8-file dispute pack
- `dispute-forge-x402.fly.dev/api/dispute-pack` ($0.75) — FCRA dispute letter + SVG certificate
- `vault-pro-x402.fly.dev/api/scaffold-project` ($0.05) and `/api/scaffold-agent` ($0.05) — scaffolding
- `power-pack-x402.fly.dev/api/score-email` ($0.01) — email scoring
- `nanobanana-x402.fly.dev/api/generate-image` ($0.01) and `/api/edit-image` ($0.01) — image gen/edit
- `royal-ruby-x402.fly.dev/api/law-lookup` ($0.25) — state-by-state legal lookup
- `suprapack-x402.fly.dev/api/find-skill` ($0.03), `/api/get-skill` ($0.03), `/api/list-top` ($0.03) — skill discovery
- `tradingagents-x402.fly.dev/api/analyze-ticker` ($0.03) and `/api/analyze-arbitrage` ($0.03) — crypto analysis
- `dispatch-x402.fly.dev/dispatch` ($0.50) — intent routing

**PayTo for all 9 services (verified live Sep 13 2026):** `0xfBC0eb7811D477E55261d956dF39f0046E192240` (agentcash). **Not** `0x7861db4efc14a1ed5dd8c96c528a3796560f1393`.

---

*Staci CLAUDE.md §1 wording preserved verbatim. Honesty by construction. Ledger = chain. $0 revenue until first external customer. Accurate as of 2026-09-13 17:30 CDT.*