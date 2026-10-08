# RAEN Fleet Re-Engineering Plan — Consolidated Master

**Generated:** 2026-10-08 | **Swarm:** 6 agents, 32 min runtime | **State:** Draft for Bryant review & execution

---

## 1. EXECUTIVE SUMMARY

| Metric | Before | After | Reduction |
|--------|-------:|------:|----------:|
| GitHub repos | 93 | 10 | **-89%** |
| OneDrive file clutter | 2,590+ | ~500 | **-81%** |
| Fly apps | 54 | 22 | **-59%** |
| Fly x402 walls (standalone) | 15 | 3 (multi-tenant) | **-80%** |
| Local agent projects | 17+ | 6 | **-65%** |
| Nimbus-agent copies | 5 | 1 | **-80%** |
| Library content files | 191 | 91 | **-52%** |
| Active wallets | 18 | 3 | **-83%** |
| Credentials exposed on Desktop | 32 | 0 (quarantined) | **-100%** |

## 2. DESKTOP CLEANUP (Swarm A)

### 2.1 KEEP on Desktop (77 files)
All 7 daily logs, 3 library indexes, 5 current audits, 5 revenue plans, 12 status reports, 10 Python scripts, 6 engineering docs, 4 deploy configs, 7 x402 references, 6 misc active items.

### 2.2 MOVE to fleet_db/records/ (121 files)
- **Five-Original-Models-Execution/ project tree** (82 files, ~1.8 MB) — full source code, tests, schemas, evaluation data
- **3 five-models zip archives** + 1 byte-identical copy (check before deleting)
- **Data CSVs** (btc_payouts, rewards, Zena-Root-Inventory, transactions, autofill ref)
- **Reference spreadsheets** (Garnet, 05_Jan_05)
- **License files** (13 OFL/LICENSE from awesome-claude-skills)
- **External repo artifacts** (moltbot, miniwallet, wallet-drawer bundles)

### 2.3 DELETE obsolete (78 files)
- 33 content-duplicate files (5 copies Tiffany topic-audit, 2 copies Zena, 2 copies dashboard, 3 copies FRANKLIN-FINAL-REVIEW, 3 copies STACI-COMPLETION-QA, 12 .scrubbed stubs, 5 .scrubbed content stubs)
- 45 stale version records (carried from OneDrive sync history — single current version exists)

### 2.4 QUARANTINE credentials (32 files → .secrets/)
- 8 wallet.data files with keys+addresses
- Treasury key (RSA .pem)
- 2 api_keys_backup dumps
- 2 Google OAuth client_secret JSONs
- 6 rotated credential dumps (3 copies each)
- 6 SIWE/SIWX auth challenge files
- 2 Bitcoin transaction trace files

## 3. GIT CONSOLIDATION (Swarm B)

### 3.1 Merge Groups (28 repos → 9)

| Merge Into | Source Repos | Savings |
|------------|-------------|--------:|
| **dispatch-x402** | dispatch-x402-pr4, dispatch-x402-pr4-final-review | 3→1 |
| **staci** | staci-tradingagents | 2→1 |
| **power-pack-x402** | power-pack-x402-block-fix, power-pack-x402-hardening | 3→1 |
| **vault-pro-x402** | vault-pro-x402-per-request-billing-copy | 2→1 |
| **nanobanana-x402** | nanobanana-x402-billing-fix | 2→1 |
| **sentry-forge-x402** | sentry-forge-x402-hardening, sentry-forge-x402-pr2 | 2→1 |
| **staci** (+5) | staci-clean-workdir, staci-rebuild, staci-repo-workdir, staci-work, staci-dr-marigny-follow-up | 6→1 |
| **nimbus-agent** (+3) | nimbus-aggregate-remediation, nimbus-pr28-adversarial, hermes-work/nimbus-agent-hermes3c | 4→1 |
| **rae-fleet-router** | rae-fleet-dashboard, rae-endpoint-assurance | 3→1 |

### 3.2 Archive/Delete (23 repos)
**Dead GitHub repos** (no pushes in 10d+): mcp-x402-gateway, suprapack, claude-obsidian-vault-pro, claude-code-power-pack, vault-pro-landing, suprapack-landing, sentry-pro-landing, sentry-forge-landing, power-pack-landing, rae-endpoint-assurance, kip-agent, erica-agent, x402-marketing-assets, x402-portfolio, rae-fleet-dashboard  
**Stale forks** (8): awesome-x402-merit, zeroperl, x402-dev, rencfs, OBLITERATUS, AI-Models-GODMODE, marketing-dashboard, crm-api  
**122 npm dep dirs at OneDrive root** → rm -rf (recreated by npm install in each project)

### 3.3 Proposed 10-Repo Structure
1. **x402-kernel** (merged: kernel + pack + glm + ollama + nanobanana + bridgette + opensea-data + mcp-gateway)
2. **dispatch-x402**
3. **power-pack-x402**
4. **vault-pro-x402**
5. **sentry-forge-x402**
6. **staci**
7. **rae-fleet-router** (merged: router + dashboard + endpoint-assurance)
8. **nimbus-agent** (canonical: `C:/Users/jaded/nimbus-agent` HEAD 731a1c6)
9. **royal-ruby-live** (merged: ruby-live + gateway-x402 + Royal-Sailing + brand-assets)
10. **tradingagents-x402** (merged: trading-agents + agent-sdk-creative + creative-tools + kronos-crm)

## 4. FLY.IO CONSOLIDATION (Swarm C)

### 4.1 App Count: 54 → 22 (-59%)

**SUSPEND (8 dead apps):**
- bshelby-miner, fleet-litellm, fleet-monitoring, franklin-agent, juanterry-agent, rae-kernel-staging, tiffany-agent, tiffany-poller

**CONSOLIDATE x402 walls: 15 standalones → 3 multi-tenant machines**
- **public tier** (5 walls): tradingagents, vault-pro, nano-banana, power-pack, sentry-forge
- **premium tier** (5 walls): suprapack, sentry-pro, vault-pro-premium, royal-gateway, nft-alpha
- **infra tier** (3 walls): fleet-monitor, bazaar-registrar, colibri-inference

**NEW apps needed (4):**
- **bazaar-registrar** — register all x402 walls with Bazaar (currently 0 registrations)
- **colibri-inference** — local LLM inference engine (needs model approved)
- **fleet-librarian** — consolidated content serving, llms.txt, .well-known/x402.json
- **fleet-monitor-v2** — consolidated health dashboard replacing dead fleet-monitoring

### 4.2 Credential Pattern
- Per-app deploy tokens (`flyctl tokens create deploy`) instead of shared FLY_API_TOKEN
- One canonical GitHub Actions workflow template per app type with pinned `setup-flyctl@v2`
- Rotate ALL 17 credentials from 6October2026.txt dump
- Mint new CDP API key in walls org (0a560462) at portal.cdp.coinbase.com

### 4.3 Bazaar Registrations Needed: 15
All x402 walls currently have 0 ERC-8257 registrations. Registrar app deploys these as metadata + discovery endpoints.

## 5. LIBRARY CONTENT CONSOLIDATION (Swarm D)

### 5.1 Content Routing: 191 files → 91 preserved

| Destination | Count | What |
|------------|:-----:|------|
| **Colibri engine** | 22 | Fleet ops plans, agent code refs, x402 catalogs, Colibri surface stubs |
| **Fly deploy** | 6 | x402.json, pricing.md, llms.txt, sample.json, wall.stub.js, README.md |
| **Airtable** | 19 | Ledgers, bounty_ledger, audits, Zena-Root-Inventory, transactions, Siwx auth, connections |
| **DELETE** | 100 | 25 licenses, 11 credential-scrubbed (originals quarantined), 64 Five-Models project copies (project persists at Desktop path) |
| **Archive** | 44 | Dated notes, doc-other — low-value historical reference |

### 5.2 Critical Fix Needed Before Fly Deploy
**payTo inconsistency** in colibri-surface stubs:
- `llms.txt` uses `0xfBC0eb7811D477E55261d956dF39f0046E192240`
- `x402.json` and `pricing.md` use `0x7861db4efc14a1ed5dd8c96c528a3796560f1393`
This causes wall-challenge-header / well-known-drift per colibri-surface README pitfall #5. Must reconcile to one canonical payTo address.

## 6. MONEY & SETTLEMENT (Swarm E)

### 6.1 Wallet Audit

| Wallet | USDC | Key Status |
|--------|:----:|------------|
| **OP_WALLET** | 74.42 | Active, verified |
| **ESCROW** | 26.70 | Active, verified |
| **Treasury** | 5.70 | No local signing key (treasury-key.pem = 248B corrupted stub) |
| **Sovereign** | 4.06 | Active |
| **CDP smart-account** | 0.63 | Blocked (MCP accounts API 401 — org scope mismatch) |
| **Diamond Pass** | 0.02 | Active |
| **Payer** | **0.00** | **Only locally-signable wallet — EMPTY** |
| **15 abandoned wallets** | 0 | Various historical keys, no balance |

### 6.2 Blockers to Settlement
1. **Payer wallet has $0.00 USDC** — only locally-signable wallet is empty
2. **CDP API key org mismatch** — minted on 882277e8, walls use 0a560462 → accounts API 401
3. **Treasury key is a 248B corrupted stub** — no EOA derivable
4. **AgentKit WALLET_SECRET on rae-kernel.fly.dev remains unrotated** — EIP-3009 signed 52.50 USDC outflow Sep 28
5. **4 credentials didn't actually rotate** — OpenSea key, Sovereign pk, HuggingFace AWS keys changed value back to originals
6. **USDC_RECEIVER, OPERATIONAL_WALLET not covered by 15/15 rotation**
7. **No signing wallet with non-zero USDC** → x402 settlement impossible

### 6.3 Money Sweep Recommendations
1. Fund payer wallet with ≥0.01 USDC from external source (restarts settlement canary)
2. Mint new CDP key on org 0a560462 at portal.cdp.coinbase.com
3. Rotate/revoke AgentKit WALLET_SECRET on rae-kernel (proven live mainnet signing)
4. Reconcile 425.84 USDC in Coinbase Business ERC3009PaymentCollector
5. Sweep Treasury 5.70 USDC to wallet with reachable signing key (needs Bryant)
6. Re-rotate 4 failed credentials (OpenSea key, Sovereign pk, HuggingFace AWS keys)
7. Rotate USDC_RECEIVER and OPERATIONAL_WALLET

## 7. AGENT CONSOLIDATION (Swarm F)

### 7.1 Nimbus-Agent: 5 copies → 1 canonical

| Location | Status | Action |
|----------|--------|--------|
| **C:/Users/jaded/nimbus-agent** (HEAD 731a1c6, Oct 2) | ✅ Canonical deploy target | KEEP |
| **Documents/nimbus-agent** (HEAD 40241b9a, Oct 3) | ✅ Active dev workspace | KEEP, reconcile via merge |
| Documents/repos/nimbus-agent | ❌ Diverged brain-poller, no package.json | DELETE |
| repos/nimbus-agent | ❌ Diverged brain-poller | DELETE |
| OneDrive/repos/nimbus-agent | ❌ Stale shell only | DELETE |

### 7.2 Agent Architecture: 17+ → 6 core agents

| # | Agent | Role | Current Status |
|---|-------|------|----------------|
| 1 | **Nimbus** | Brain-poller orchestrator, 6h deploy cron | ✅ LIVE |
| 2 | **RAEN Core** (merges Erica+Kip+Tiffany+Bean) | Revenue engine + settlement + dispatch | ⚠️ MERGE in progress |
| 3 | **Staci** | Proxy/coordinator, fly deploy automation | ✅ LIVE |
| 4 | **Franklin** | Operations, maintenance, PR reconciliation | ✅ LIVE |
| 5 | **Sentinel** | Health monitoring (from Nimbus autonomy/) | ⚠️ Needs standup |
| 6 | **Chronicler** | Ledger/receipt evidence, wallet catalog | ✅ LIVE |

### 7.3 Delete: 21 Dead Template Agents
All OneDrive numbered agents (01-web-research through 20-multi-agent-debate) are 4-file empty scaffolds that never ran a task. Archive or delete.

### 7.4 Conslidate repos/ Sprawl
`repos/` exists at 5 locations. Only 2 carry live work:
- `Documents/repos/` (x402-glm, x402-kernel with package.jsons)
- `OneDrive/fleet/nimbus-agent/` (canonical Git copy)
The other 3 locations are stale shadows → delete.

## 8. INFRASTRUCTURE BACKLOG

| Priority | Item | Depends On | Effort |
|:--------:|------|------------|:------:|
| P0 | Fund payer wallet (≥0.01 USDC) | External source | 5 min |
| P0 | Re-key CDP in org 0a560462 | portal.cdp.coinbase.com access | 10 min |
| P0 | Mount 2nd NVMe (SK Hynix 512 GB) | Admin PowerShell | 60 sec |
| P0 | Rotate AgentKit WALLET_SECRET | Fly remote SSH | 10 min |
| P0 | Re-rotate 4 failed credentials | Vault + API access | 15 min |
| P0 | Rotate USDC_RECEIVER + OPERATIONAL_WALLET | Fly secrets set | 5 min |
| P1 | Delete 78 obsolete Desktop files | Dry-run first | 10 min |
| P1 | Move 121 files to fleet_db/records/ | Scripted move | 15 min |
| P1 | Delete 122 npm dep dirs | `rm -rf` batch | 30 sec |
| P1 | Merge GitHub repos (28→9) | Branch protections, PRs | 2-4 h |
| P1 | Deploy per-app Fly tokens for CI/CD | `flyctl tokens create deploy` each app | 20 min |
| P1 | Register 15 x402 walls with Bazaar | Registrar app build | 4 h |
| P2 | Consolidate 15 x402 walls to 3 multi-tenant | CI/CD pattern tested | 2 d |
| P2 | Build RAEN Core from Erica+Kip+Tiffany+Bean | Merge branches | 1 d |
| P2 | Delete 21 dead template agents | Verify all empty first | 5 min |
| P2 | Delete 3 stale nimbus-agent copies | Verify divergence first | 5 min |
| P2 | Consolidate repos/ to 1 location | Symlinks + deletion | 15 min |
| P3 | Colibri model download + bring-up | 2nd NVMe mounted | 4 h |
| P3 | bazaar-registrar app deploy | Bazaar SDK integration | 4 h |
| P3 | fleet-librarian app deploy | Content consolidation done | 4 h |
| P3 | fleet-monitor-v2 app deploy | Sentinel agent ready | 4 h |

## 9. IMMEDIATE NEXT ACTIONS (This Session)

1. **Quarantine 32 credential files** on Desktop → `.secrets/`
2. **Delete 78 duplicate/obsolete files**
3. **Move 121 files** from Desktop → `fleet_db/records/`
4. **Mount 2nd NVMe** (requires admin — prepare command)
5. **Fix payTo inconsistency** in colibri-surface stubs
6. **Fund payer wallet** (Bryant, external transfer needed)
7. **Mint CDP API key** in org 0a560462
8. **Register 15 x402 walls** with Bazaar