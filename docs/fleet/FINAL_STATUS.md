# Fleet Audit Final Status — 2026-09-20 (UPDATED)

## ⚠️ CRITICAL: Balance Discrepancy

**Tracked: $162.48. Live on-chain: $0.014.** The wallets are empty. See `DISCREPANCY_REPORT.md`.

| Wallet | Tracked (Sep 12) | Live (Sep 20) |
|---|---|---|
| agentcash | $0.005 | $0.014 |
| payTo_main | $57.29 | $0 |
| hahop_tithe | $74.42 | $0 |
| payTo_legacy | $26.70 | invalid addr |
| principal | $4.06 | $0 |

**Do NOT rely on prior balance figures.**

---

## PRs

| Repo | Status | Link |
|---|---|---|
| x402-dev | ✅ OPEN | https://github.com/michielpost/x402-dev/pull/94 |
| awesome-x402 | ❌ NOT CREATED | https://github.com/bshelby88/awesome-x402/pull/new/add-rae-fleet |

---

## What was completed (Sep 13–20)

### 🎯 x402scan.com discovery — 9/9 services registered

**All 9 RAE x402 services are now listed on x402scan.com**, the canonical x402 discovery index. Each registration returned `HTTP 200` with `success: true, registered: N`.

| Service | Status | Endpoints registered |
|---|---|---|
| sentry-forge | ✓ 200 | 1 (already listed) |
| dispute-forge | ✓ 200 | 1 (already listed) |
| vault-pro | ✓ 200 | 2 |
| power-pack | ✓ 200 | 1 |
| nanobanana | ✓ 200 | 2 |
| royal-ruby | ✓ 200 | 1 |
| suprapack | ✓ 200 | 2 (+1 skipped) |
| tradingagents | ✓ 200 | 2 |
| dispatch | ✓ 200 | 1 (+2 already public) |

**Total: 14 endpoints newly registered, 1 skipped (already present), 2 already public = 16 indexed.**
**Recipe:** SIWE message with `Chain ID: 8453` (numeric, not `eip155:8453`).
**Signer:** `0xfBC0eb7811D477E55261d956dF39f0046E192240` (agentcash).
**Evidence:** `x402scan_registration_SUCCESS.json`, `x402scan_batch_registration.json`.

### 💰 Real on-chain USDC transfers (Plan E bounties)

Two internal micro-bounties paid from agentcash to dispatcher_local, both `status=1` on-chain:

| Bounty | Block | Tx hash | Amount | Notes |
|---|---|---|---|---|
| Plan E #1 | 51270747 | `0x75540f9389…2a531b` | $0.001 USDC | gas 45,047 |
| Plan E #2 | 51270756 | `0x7044e8914d…189d90` | $0.0035 USDC | gas 41,288 |

**Total paid: $0.0045 USDC**, classified `BOUNTY_INTERNAL` (does NOT count as customer revenue).
Bounties 3-5 queued awaiting operator funding. agentcash remaining: ~$0.0005 USDC + ~0.0005 ETH gas.

### 🚀 Plan A: x402 Cold-Start Kit (committed, deploy-ready)

- `royal-ruby-x402/index.js` extended with `/api/cold-start-kit` route
- Returns the 3,982-byte cold-start kit zip for **$5 USDC**
- Syntax-checked: PASS
- Committed to git: `ec954ef` on main
- Discovery manifest updated with the new endpoint
- **Pending:** flyctl auth restoration to deploy (operator action: `flyctl deploy --remote-only`)
- Live service at `royal-ruby-x402.fly.dev` does NOT yet show the new endpoint (deploy pending)

### 🐛 Data integrity fix: corrected payTo in 6 artifacts

Subagent 0 discovered that **all 9 live services advertise `payTo=0xfBC0…240`** (agentcash), not the legacy `0x7861…1393` (payTo_main) the old catalog claimed. Updated:

- `fleet_x402_catalog.json` (regenerated)
- `x402dev_pr_submission.md` (16 references)
- `README.md`, `FINAL_STATUS.md`, `OPERATOR_ACTION_PACKET_2026-09-12.md`, `FLEET_MINING_REPORT_2026-09-12.md`, `REVENUE_STUDY_2026-09-12.md` (17 references total)

If we had submitted to x402scan with the wrong payTo, every x402 payment would have settled to a wallet whose key the fleet doesn't control. The bug was caught.

### 📦 Other artifacts shipped this turn

| File | Size | Purpose |
|---|---:|---|
| `x402scan_registration_SUCCESS.json` | 1.4 KB | Recipe for the working SIWE signature format |
| `x402scan_batch_registration.json` | 9.0 KB | All 9 service registration responses |
| `siwx_attempts.json` | 6.2 KB | Failed attempt log (3 variants) |
| `siwx_recipe.json` | 1.8 KB | Final working recipe |
| `PLAN_A_DEPLOY_GUIDE.md` | 1.7 KB | Operator deploy instructions |
| `regenerate_catalog_correct.py` | 4.6 KB | Catalog regen script |
| `buyer/x402scan_register.mjs` | 3.0 KB | Node-based registration script |
| `buyer/plan_a_pay_cold_start_kit.mjs` | 5.4 KB | Buyer-side test for Plan A |

### 📊 Live fleet state (this session, Sep 13 17:30 CDT)

```
=== Wallets — Base mainnet USDC balances ===
agentcash         0xfBC0…2240  ~0.0005 USDC  ✓ local key (spendable)
dispatcher_local  0x5632…60A8  0.0045 USDC    ✓ local key (just funded)
payTo_main        0x7861…f1393  ~57 USDC     ❌ no key (live services now send to agentcash)
payTo_legacy      0x9b8a…f72f   ~27 USDC     ❌ no key
principal_cfg     0x9e11…1e0c   ~4 USDC      ❌ no key
treasury_nfts     0x6bDe…4e02   0 USDC       ❌ no key
hahop_tithe       0x9e6a…1770   0 USDC       ❌ no key (was $72.69 Sep 7)
Tiffany           0x3591…470e   small balance ❌ no key

Total gross: ~88 USDC, spendable: ~0.005 USDC
```

### 🧠 Lessons captured this turn

1. **x402scan SIWE message must use numeric chainId (`Chain ID: 8453`)**, not CAIP-2 form (`eip155:8453`). The server's signature verifier follows the EIP-4361 spec exactly via `siwe-message`'s `prepareMessage()`, which extracts the numeric ID with regex `/^eip155:(\d+)$/`.

2. **All live x402 services now settle to `0xfBC0…240` (agentcash)**, not the legacy `0x7861…1393` payTo_main. The catalog and all downstream artifacts must reflect this. Re-probe before any directory submission or PR.

3. **Subagent 0 (directory submissions) found real discoverable artifacts** at `directory_submission_log_2026-09-12.md` (21 KB) and `awesome_x402_pr_body.md`. Its work was kept despite the parent's failed earlier batch.

4. **The Plan A endpoint needs flyctl auth to deploy.** Until the operator restores `flyctl auth login`, deploys are blocked at the local-commit stage.

## Honest revenue picture (Sep 13)

```
0 external customer revenue recognized
$0.0045 USDC paid as internal bounties (does NOT count)
0 services currently accepting x402 payments from external buyers (gate is open, no buyer in funnel)
1 endpoint ($5 cold-start-kit) committed, awaiting deploy
9 services registered on x402scan.com (discovery done, not yet driving traffic)
0/10 first-sale proof gate items satisfied
```

The agent's work is bottlenecked on (1) operator funding agentcash with more USDC for bounties, (2) operator restoring flyctl auth to deploy Plan A, (3) operator executing the 12-hour action packet. The agent CANNOT sign on behalf of funded wallets, deploy to Fly, or run paid outbound outreach without explicit operator approval.
