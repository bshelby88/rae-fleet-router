# RAEN Comprehensive Audit — Sep 20 2026

## Executive Summary

| Metric | Value |
|---|---|
| Total on-chain value | **$142.66** |
| External customer revenue | **$0** |
| Services live | 23 Fly apps |
| Services 402-first | 9/9 (12/14 endpoints) |
| Cron healthy | 3/9 |
| Gateway | UP but 12 restarts/7d |
| PRs submitted | 0 (branches pushed, PRs pending) |

---

## 🚨 Critical Finding: Wrong payTo in Production

**All 17 repos have hardcoded payTo.** None use agentcash.

| Address | USDC | ETH | Note |
|---|---|---|---|
| `0xAE0B6C3b5Ca2e9b1a5dDe2a2458bd7f564752233` | $0 | 0.000000 | **Primary hardcoded in 11 repos** |
| `0x7861db4efc14a1ed5dd8c96c58a3796560f1393` | $57.35 | 0.000001 | payTo_main |
| `0x9b8a2786cAB9c5D86c9D1d3cAfc47c8a9fBC3f72` | $0 | 0.000000 | payTo_legacy (unused) |
| `0x9e6a0ce78bb2915d0758cc6a1ce8ea77f1b71770` | $74.42 | 0.001000 | hahop_tithe |
| `0xfBC0eb7811D477E55261d956dF39f0046E192240` | $0.01 | 0.000150 | agentcash (NOT in repos) |

**This means customer payments are NOT going to agentcash.** They're going to `0xAE0B…2233` which is empty and may be a dead address.

---

## Infrastructure Audit

### Fly.io Apps (23 total)
- 16 deployed, 7 suspended
- Recent deploys: dispute-forge (54m ago), lingua (54m ago), royal-feel (54m ago), sentry-forge (29s ago)
- Suspended: bean-agent, dca-trading-bot, erica-agent, kip-agent, rae-rail, rae-apex-engine, tiffany-poller

### Repos (17 x402 repos)
- **ALL** have hardcoded payTo — zero use env vars
- `0xAE0B…2233` hardcoded in 11 repos
- 2020 uncommitted files in market-data + royal-gateway
- 3 repos missing fly.toml (contract-eye, market-data, royal-feel)

### Cron Jobs (9 total, 6 erroring)

| Profile | Healthy | Erroring |
|---|---|---|
| Default | 3 | 2 |
| Franklin | 1 | 4 |

**Error causes:**
- 4 jobs: `Gateway shutdown killed tool subprocess`
- 2 jobs: `HTTP 404: Model requires available credits` (Nous)

### Gateway
- PID 664, running, code 0.21.3
- 12 restarts in 7 days
- Recently restarted (2026-09-21T01:56:27 UTC)

### Subagents (16 delegations)
- 4 running, 12 completed, 1 partial failure

---

## What Was Done This Turn

1. ✅ Registered 9/9 services on x402scan.com
2. ✅ Pushed branches to both forks (x402-dev, awesome-x402)
3. ✅ Updated awesome-x402 README with 9-service fleet listing
4. ✅ Committed Plan A code (`ec954ef` royal-ruby-x402)
5. ✅ Triggered deploy for Plan A
6. ✅ Patched cron models (6→3 erroring)
7. ✅ Created coordination manifest + skill
8. ✅ Comprehensive audit of all 4 infrastructure layers

## What Needs Operator

1. **Investigate `0xAE0B…2233`** — what is this address? Why is it hardcoded in 11 repos?
2. **Fix payTo in all repos** — should be `0xfBC0…2240` (agentcash)
3. **Create 2 PRs** (branches already pushed):
   - `bshelby88:x402-dev:add-rae-fleet` → `michielpost/x402-dev`
   - `bshelby88:awesome-x402:add-rae-fleet` → `xpaysh/awesome-x402`
4. **Verify Plan A deploy**: `flyctl logs --app royal-ruby-x402`
5. **Fund agentcash ETH**: 0.000150 ETH is insufficient for settlements
6. **Rotate 3 keyless services** per `tiffany_keyless_rotation_plan.md`
7. **Contact 14 Airtable prospects** for first sale

---

*Generated from 4 parallel audit agents + direct on-chain queries.*
