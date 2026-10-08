# Royal Agentic Fleet — 72-Hour Audit Report
**Generated:** 2026-07-09T23:59:00Z  
**Scope:** 2026-07-06 00:00 UTC → 2026-07-09 23:59 UTC  
**Auditor:** Claude Code (Sonnet 4.6) — session bb7927fc  
**Status:** COMPLETE — synced to all platforms

---

## 1. Fleet Health Snapshot

| Category | Count | Notes |
|----------|-------|-------|
| Live apps | 11 | Verified Fly.io running |
| Degraded | 1 | fleet-litellm (500 errors) |
| Suspended | 3 | Fly billing or manual suspend |
| Scaffold-only / blocked | 2 | No real poller code confirmed live |
| Queued | 1 | sizzle-x402 (code complete, not deployed) |
| **Total tracked** | **18** | |

**Coinbase Bazaar:** 10 fleet entries confirmed as of 2026-07-05T02:20:19Z (catalog_total: 23,328). Source: `docs/bazaar-proof.json`.

**x402 payment wallet:** `0x9b8a2786a3df7a7837ccfc4e792e9eb90a36f72f` (Base/eip155:8453)

---

## 2. Timeline Reconstruction (72h)

### 2026-07-06
- `docs/handoff-runbook-2026-07-06.md` written at session end
- x402 price bug fixed, lint passed in 6 repos
- Fly secrets commands documented but NOT executed (nanobanana/bridgette/pack)
- nimbus-agent confirmed live on Fly at that point

### 2026-07-07
- `repos/nimbus-agent/brain-poller.js` modified (Airtable poller, 60s interval, ROUTES object for nimbus/bean/tiffany)
- `repos/nimbus-agent/fly.toml` modified (added `[[services]]` block with `/health` http_checks)
- `docs/undone-todo.md` updated (11-item open list — see Section 5)

### 2026-07-09 (today)
- **06:34–06:41 UTC:** RAE Phase 0 recon — 9 artifacts generated
  - `docs/rae-x402-reboot/phase0/phase0_status.md` — Phase 0 BLOCKED (4 blockers, all human-required)
  - `rescue_script.sh` written but NOT executed
- **19:34 UTC:** nimbus-agent rescue committed locally: `ba21ed2e94cdc6aa1d276b451bcca4c38764793f` (rescue-ledger.json confirms status: "rescued", 1,391 files, 9,803,940 bytes)
- **20:00 UTC:** Airtable PATCH to rec1EZPWRQRTTaC4M — BEAN/Hermes/Tiffany/Codex-Windows restored to fleet auth scope (confirmed via `air_patch_response.json`)
- **23:34 UTC:** `known_app_repo_coverage.json` generated — shows ALL 14 apps as `rescue_ready: false` (contradicts 19:34 rescue — see Contradiction #1)

---

## 3. Five Critical Contradictions

### C1 — Rescue ledger vs. coverage matrix
- **rescue-ledger.json (19:34 UTC):** nimbus-agent status = "rescued"
- **known_app_repo_coverage.json (23:34 UTC):** nimbus `rescue_ready: false` for all 14 apps
- **Root cause:** Coverage matrix was pre-generated or not refreshed after rescue. Matrix is stale.
- **Action required:** Re-run coverage matrix after confirming push status.

### C2 — Nimbus commit exists locally but NOT on Fly
- Commit `100b65f` (health server + fly.toml [[services]] block) exists in local `repos/nimbus-agent` git
- Committed at 00:18 UTC 2026-07-09; **NEVER PUSHED** to `bshelby88/nimbus-agent`
- Fly is running the old version — no `/health` endpoint exists on the live pod
- **Action required:** `cd repos/nimbus-agent && git push` (see Section 6)

### C3 — x402-kernel test status is unknown post-edit
- Phase 0 claimed 5/5 tests FAIL as of 06:41 UTC
- `repos/x402-kernel/src/index.js` was modified after that claim (added `discoveryHandler` + `openAPIHandler` exports visible in current file)
- Tests have NOT been re-run since the edit
- **Action required:** `node repos/x402-kernel/tests/test.mjs`

### C4 — rescue_script.sh written but never executed
- Script correctly tars `/app` from 14 Fly apps via SSH
- Blocked by BLK-1 (personal Fly token, not org-scope)
- 13 of 14 Fly apps remain unrescued locally
- **Action required:** Human must provide org-scope Fly token to unblock

### C5 — .fly/config.yml contains live Fly auth material
- Flagged as BLK-3 in phase0 artifacts
- NOT rotated as of this audit
- **Action required:** Human must rotate the Fly token and scrub the file (NEVER print raw values)

---

## 4. Active Blockers (Human-Required)

| ID | Severity | Description | Who |
|----|----------|-------------|-----|
| BLK-1 | P0 | Fly personal token → need org-scope token | Human |
| BLK-2 | P0 | Airtable INVALID_PERMISSIONS on fleet base | Human (check token scopes) |
| BLK-3 | P0 | `.fly/config.yml` contains live Fly auth — ROTATE AND SCRUB | Human |
| BLK-4 | P0 | Git workspace contaminated (ntfy/web history + desktop.ini in refs) | Human (git surgery or fresh clone) |

**Human-gated items (agents must NOT act on these):**
- Drive permission fix for credential vault access
- PAYTO_MODE flip on any app
- 71-record batch-delete in Airtable
- Stripe contradiction on recWMswkTgBTEUlrC

---

## 5. Open Todos (from docs/undone-todo.md, 2026-07-07)

1. **USDC sweep tx** — verify `0x8d58e0...` on BaseScan (20 USDC, 2026-07-03)
2. **x402scan.com + bazaars.cash** — manual listing of fleet endpoints
3. **awesome-x402 PR #653 comment** — post as @bshelby88 (draft: `docs/pr653-comment-draft.md`)
4. **nimbus-agent health fix push** — `git push` from `repos/nimbus-agent` ← CRITICAL (see C2)
5. **Fly secrets** — set for nanobanana, bridgette, pack
6. **fly.toml + GitHub Actions** — wire 5 x402 repos
7. **Retire or reactivate** — tiffany / bean / contract-eye (no live poller code confirmed)
8. **fleet-litethm health 500** — investigate degraded app
9. **22 Base NFTs** — list on OpenSea (~30 min): RubyWisdomDrops + DiamondGenesisDrops
10. **sizzle-x402** — deploy after nimbus P0 resolved
11. **claudeoperators-landing** — deploy (code complete)

---

## 6. Immediate Next Actions (Priority Order)

```bash
# 1. Push nimbus health commit (unblocks /health on Fly)
cd repos/nimbus-agent && git push

# 2. Re-run x402-kernel tests (clear stale "5/5 FAIL" claim)
node repos/x402-kernel/tests/test.mjs

# 3. Set Fly secrets (unblocks nanobanana/bridgette/pack)
# Commands in docs/handoff-runbook-2026-07-06.md

# 4. Verify USDC sweep
# BaseScan: search 0x8d58e0... on https://basescan.org
```

**Human must do:**
- Rotate `.fly/config.yml` auth material (BLK-3)
- Provide org-scope Fly token (BLK-1, unblocks rescue of 13 apps)
- Confirm credential vault exists in Drive/Dropbox sprit-mirror (Subtask 0, deadline 2026-07-10 20:00 UTC)
- Confirm Herman call outcome (EOD 2026-07-08 deadline — outcome still unknown)

---

## 7. Agent Authorization State

**Authorized (as of 2026-07-09 20:00 UTC PATCH):**
- BEAN ✓
- Hermes ✓
- Tiffany ✓
- Codex-Windows ✓

**Excluded (pending real poller verification):**
- Kip — NOT authorized until real poller code confirmed live on GitHub
- Erica — NOT authorized until real poller code confirmed live on GitHub

**Protocol:** Unison claim/lease + evidence-bar enforcement. Airtable status claims do NOT count as code verification.

---

## 8. Credential & Security Notes

- **Credential vault (storm.local):** Destroyed 2026-07-03. Migration to Drive/Dropbox unconfirmed. Check `~/.config/royal-ruby/` backup before 2026-07-10 20:00 UTC.
- **Fly auth in .fly/config.yml:** TREAT AS COMPROMISED until rotated. Do not print, do not commit.
- **PAYTO wallet:** `0x9b8a2786a3df7a7837ccfc4e792e9eb90a36f72f` — only confirmed endpoint for revenue on Base.
- **Stripe:** recWMswkTgBTEUlrC contradiction unresolved — human-gated.

---

## 9. Source Coverage (from source_coverage_matrix.json)

16 local repos analyzed. x402-ready: dispatch-x402, x402-pack, x402-pack-template.  
nimbus-agent: has fly_toml + dockerfile + index.js (local copy current as of 2026-07-09 rescue).  
13 Fly apps: source not rescued locally — blocked by BLK-1.

---

## 10. Sync Manifest

This document was distributed to:
- **OneDrive:** `docs/fleet-audit-2026-07-09.md` (canonical)
- **Dropbox:** `myAgentic/fleet-audit-2026-07-09.md`
- **Obsidian Vault:** `archive/fleet-audit-2026-07-09.md`
- **fleet-memories:** `fleet-audit-2026-07-09.md`
- **Airtable:** rec1EZPWRQRTTaC4M Notes field (STACI AUDIT record)
- **Google Drive:** `fleet-audit-2026-07-09.md` (via MCP)
- **GitHub:** `repos/nimbus-agent/docs/fleet-audit-2026-07-09.md`
- **Agent knowledge:** `.agents/` SKILL injection path

---

*End of audit. Next sync checkpoint: 2026-07-10 20:00 UTC (Subtask 0 deadline).*
