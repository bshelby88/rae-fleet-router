# OneDrive Re-Engineering Report — Catalog, Duplicates, Consolidation
**Date:** 2026-10-08 · **Scope:** read-only scan of `C:\Users\jaded\OneDrive` + Desktop audit cross-reference
**Method:** live directory enumeration (root, Documents, multiAgentic, GitHub, fleet, pr-reconcile, repos) + git remote/branch/last-commit metadata for every repo found + cross-reference against MASTER-LIBRARY-INDEX.md, control-plane-audit-2026-10-01.md, raen-ci-audit-2026-09-30.md, ten-day-fleet-audit-synthesis-2026-09-30.md, FIX_PLAN.md.

---

## 1. Actual structure vs. the index's model

The MASTER-LIBRARY-INDEX describes **421 dirs "at OneDrive root"** with a flat catalog (x402-kernel/, nimbus-agent/, staci/ … at root). **That model does not match reality.** Live scan:

| Cluster | Entries | Notes |
|---|---|---|
| OneDrive root | 624 entries (163–215 dirs + loose files) | No `x402-kernel/`, `nimbus-agent/`, `staci/`, `tiffany/`, `dispatch-x402/`, `vault-pro-x402/` exist at root — all cataloged "root" projects actually live nested in the clusters below |
| `Documents/` | 1,744 entries / 342 dirs | 27 real project dirs + thousands of flat files/skill .md |
| `multiAgentic/` | 1,524 entries / 407 dirs | 60+ real git clones + **65 npm package dirs** + heavy personal-doc clutter |
| `GitHub/` | 104 dirs | **99 are mis-pointed `cline/prompts` template clones** (see §3) |
| `fleet/` | 40 dirs, 15 with .git | The genuine working-repo cluster (bshelby88 remotes) |
| `pr-reconcile/` | 7 entries, 5 git clones | PR-branch clones for reconciliation |
| `repos/` | 4 entries | conversion-safety-review, nimbus-agent, x402-nanobanana, pr-review-cline.md |
| Root-level .git dirs | 26 (incl. Documents/, multiAgentic/ as repos) | |

**Key structural finding:** the index is aspirational/stale (2026-09-26): ~half its "root" entries resolve to nested paths today. Any consolidation plan should be rebuilt against the live tree, not the index.

---

## 2. Duplicate / fork / branch inventory (consolidation candidates)

### 2.1 nimbus-agent — 7+ copies, competing deploy policies (HIGHEST RISK)
Confirmed by control-plane audit §1 (6 workflow copies) + this scan's git metadata:
| Copy | Remote | Branch | Last commit |
|---|---|---|---|
| `fleet/nimbus-agent` | bshelby88/nimbus-agent | main | 2026-07-05 |
| `pr-reconcile/nimbus-agent` | bshelby88/nimbus-agent | fix/reject-fly-ephemeral-checkpoint-mount | 2026-08-26 |
| `Documents/nimbus-agent` | bshelby88/nimbus-agent | — | 2026-07-05 |
| `Documents/nimbus-reconcile-20260826` | bshelby88/nimbus-agent | — | 2026-08-26 |
| `Documents/kip-fly-audit-nimbus` | bshelby88/nimbus-agent | — | 2026-08-26 |
| `multiAgentic/nimbus-agent` | bshelby88/nimbus-agent | — | 2026-07-05 |
| `multiAgentic/repos/nimbus-agent` | (audit-flagged) | — | — |
| `Documents/_quarantine_20260711_nimbus-git-corrupt` | bshelby88/nimbus-agent | — | NOCOMMIT (quarantined) |
| `fleet/nimbus-aggregate-remediation-20260826` | bshelby88/nimbus-agent | fix/aggregate-nimbus-remediation | 2026-08-26 |
| `fleet/nimbus-pr28-adversarial` | bshelby88/nimbus-agent | (detached) | 2026-08-26 |
| `repos/nimbus-agent` | — | — | — |

⛔ The six workflow-bearing copies encode **competing schedule/deploy policies** (six-hour autopilot vs. 15-min restart watchdog vs. push-deploy vs. manual dispatch; some with daily social-publish). Audit verdict stands: pick ONE canonical remote source + ONE deploy authority before touching any writer. Recommended: keep `fleet/nimbus-agent` (only clean `main` clone), archive all `*-reconcile-*`, `*-pr28-*`, `kip-fly-audit-*` variants, delete the quarantined copy.

### 2.2 cline/prompts mis-clones — ~111 dirs that are NOT the projects they're named after (BIGGEST CLEANUP WIN)
These clones have remote `https://github.com/cline/prompts.git` and content = the cline/prompts template, NOT the named project:
- **`GitHub/`: 99 of 104 dirs** (Trilium, redis-js, heygen-clone, LMCache, PentestGPT, obsidian-*, opencode-*, x402-client, …) — all template content, last commit 2025-06-24
- `fleet/`: suprapack-engine, suprapack-landing, vault-pro-landing
- `Documents/`: awesome-x402-merit, power-pack-landing, project-omni, prompts, suprapack-engine, suprapack-landing, tradingagents-x402, vault-pro-landing, Diamond-Kava.cline-clobber-backup-20260910
- `multiAgentic/`: power-pack-landing, project-omni, suprapack-engine, suprapack-landing, tradingagents-x402, vault-pro-landing

➡️ **Delete all 111** (or `git remote set-url` + re-clone the correct upstream where the project is real). They are dead weight and actively misleading — `tradingagents-x402` "local copy" is actually the prompts template, which explains why local debugging of that repo fails.

### 2.3 Diamond-Kava — 4 real copies + 1 misclone
`multiAgentic/Diamond-Kava` (04-19), `multiAgentic/Diamond-Kava1` (06-29), `multiAgentic/Diamond-Kava2` (04-19, older), `Documents/Diamond-Kava` (07-19, newest), `Documents/Diamond-Kava.cline-clobber-backup-20260910` (misclone). Keep `Documents/Diamond-Kava`, archive the rest.

### 2.4 staci — 7 copies
`pr-reconcile/staci` (fix/fail-closed-payment-metadata, 08-26 — active PR), `Documents/staci-canonical-20260826` (08-26), `Documents/staci-payment-gate-failclosed` (08-26), `Documents/staci-clean-workdir` (no remote, 07-11), `multiAgentic/staci-clean-workdir` (no remote), `fleet/staci-clean-workdir` (no remote, master). Keep pr-reconcile (PR) + one canonical; archive/de-dupe the rest.

### 2.5 vault-pro family
`fleet/vault-pro-x402` (feat/buyer-docs-sample), `fleet/vault-pro-pr4-bazaar` (tiffany/x402scan-discovery-challenge), `fleet/vault-pro-x402-per-request-billing-copy` (fix/per-request-billing-copy), `fleet/vault-pro-landing` (misclone), `Documents/vault-pro-landing` + `multiAgentic/vault-pro-landing` (misclones). One repo, three PR worktrees + 3 landing misclones → consolidate to 1 repo + 1 landing (real).

### 2.6 royal-ruby — 5+ copies
`fleet/royal-ruby-live-pr2` (remove-stripe branch, 08-26), `pr-reconcile/royal-agentic` (chore/real-sam-diffusion-adapters, 05-08), `Documents/royal-ruby-x402` (06-25), `multiAgentic/royal-ruby-x402` (06-25, duplicate of Documents), index-listed but absent at root: Royal-Ruby-2.0, Royal-Ruby-Brand-Assets, Royal-Ruby-Workspace.

### 2.7 x402-pack / x402-kernel family (Documents + multiAgentic mirror-image duplicates)
Documents has 27 project dirs; multiAgentic duplicates ~15 of them at identical remotes/commits (`awesome-x402`, `awesome-x402-merit`, `audit-nanobanana-x402`, `audit-tradingagents-x402`, `audit-x402-portfolio`, `x402-portfolio`, `x402-portfolio-audit`, `mesh`, `mirror-opencode`, `tiffany-agent`, `claude-code-power-pack`, `obsidian-api`, `ollama-python`, `palmy`, `hermes-agent-self-evolution`, `mcp-marketplace`). Two copies of the same clone with same commit = consume one side.

### 2.8 Other duplicate groups
- **OBLITERATUS:** fleet/, Documents/, multiAgentic/ (real, elder-plinius) + GitHub/OBLITERATUS, GitHub/OBLITERATUS-OPUS-Liberated, GitHub/gemma-4-12B-OBLITERATED (misclones) — 6 dirs
- **opencode family:** mirror-opencode (root+Docs+multiAgentic), sprit-mirror, opencode-mirror, opencode-deep-memory, opencode-dev-kit, opencode-verify, four-opencode-git — 7+ dirs, mostly speculative mirrors
- **A2A:** A2A, a2a-js, a2a-python (3, same org — keep a2a-python, drop the rest)
- **cactus:** cactus, cactus-gemma4, cactus-react-native (3, all NOCOMMIT)
- **claude-obsidian-vault-pro:** multiAgentic/claude-obsidian-vault-pro + -pro1
- **codebase-memory-mcp:** + -pro (different forks — pick one)
- **hermes-agent-self-evolution:** Documents + multiAgentic (identical)
- **mcp-marketplace:** Documents + multiAgentic (identical)
- **adk-python:** root (real) + multiAgentic (joungwoo-lee fork)
- **kronos:** Kronos (shiyu-coder) + kronos-crm (Paulo-german) — different repos, keep both only if used
- **pitching engines:** autonomous-pitching-engine + pitching-engine (index says o, both live)
- **suprapack:** fleet/Documents/multiAgentic misclones ×2 each + DELIVER_suprapack-full.zip

---

## 3. Dependencies installed at root instead of node_modules

- **Root:** 88 lowercase/@scoped package dirs (express stack: express, body-parser, serve-static, qs, cookie…; web3: viem, ox, abitype, @noble, @scure, @x402, tweetnacl, jose; google SDK; undici-types, node-fetch…) + **31 flattened `node_modules__*.txt` license dumps** at root
- **multiAgentic/:** 65 package-style dirs (same pattern)
- These are extract artifacts (someone ran `npm install` with a flat/root cwd or unzipped node_modules). Safe to move under one `node_modules/` or delete (re-installable). Index claims 122; live count ≈ 153 across root+multiAgentic.

---

## 4. Dead / archived / junk candidates for removal

1. **111 cline/prompts mis-clones** (§2.2) — wrong content, delete.
2. **`_quarantine_20260711_nimbus-git-corrupt`** — quarantined corrupt repo; delete once canonical remote confirmed.
3. **Report version spam at root:** `emerging_niches_report_v1…v24` (24 files), `niche_dossier_*` (50+ files incl. 29 bounty_execution_queue versions), `fresh_leads_*` (18 files) — collapse to latest + archive.
4. **Downloaded artifacts:** claude-code-main.zip, claude-desktop-debian zip, self-improving-1.2.16.zip (×2), summarize-1.0.0.zip, install-main.zip, files.zip, Configuration.zip, tg-master.zip, OpenMontage zip, crewAI-quickstarts zip, flyctl zip+dir, gemma-3.3.0.zip, kepano-obsidian-main (+zip), moltbot-main + its 4 flat-extracted license .txt dumps, Marketing-Skills zip, 4kvm, elfinder-related — move to `_ARCHIVE/installs/`.
5. **Personal-doc clutter in multiAgentic/** (cloud-synced): ~50 resume .docx/.pdf versions, bank statements, check stubs (30+ "Copy" duplicates), tax returns, transcripts, ID scans. These belong in `_ARCHIVE/personal-docs/`, not a project cluster.
6. **Speculative mirrors:** mirror-opencode, sprit-mirror, opencode-mirror, opencode-deep-memory, opencode-verify (opencode family) — archive.
7. **erica cluster:** erica, erica-audit-20260826, erica-agent, erica-agent-source — archive (no CI/remote activity in any audit window).
8. **Old audit artifacts at root:** audit-2026-07-07, erica-audit-20260826, rescue-artifacts, rescue-fleet.ps1, verify-fleet-resolver.* — archive.

---

## 5. Active vs. stale (audit cross-reference)

### ACTIVE (referenced by Fly/GitHub in 2026-09-21→10-01 window, 93-repo census + public CI):
| Repo | Evidence | Local canonical copy |
|---|---|---|
| nimbus-agent (private) | 65 runs; Fly-deployed; RAE autopilot | `fleet/nimbus-agent` |
| tradingagents-x402 | 52 runs, PR #17 open, **39 failed schedules** | remote-only (local copies are misclones!) |
| staci | 31 runs, 26 scheduled OK (watchdog), PR open | `pr-reconcile/staci` |
| agent-sdk-creative | 25 runs, PR #2 open/unstable, **14 failed schedules** | remote-only |
| dispatch-x402 | 14 runs, mostly green | `Documents/dispatch-x402-failclosed` |
| rae-fleet-router | 10 runs, green | remote-only |
| raen-portfolio-x402 | 5 runs, green | `Documents/x402-portfolio(-audit)` |
| rae-fleet-dashboard | 3 runs, green | remote-only |
| royal-ruby-live | 6 runs, PR green | `fleet/royal-ruby-live-pr2` |
| royal-gateway-x402 | 2 manual runs | remote-only |
| awesome-x402 | 1 run (failed) | `multiAgentic/awesome-x402` |
| mining-marketplace | 36 runs, 19 PR failures, no local copy | remote-only |
| x402-glm (private) | **20/29 failed schedules** | `Documents/x402-glm` (no .git) |
| **15 Fly apps** (credential rotation 2026-10-06, 15/15) | app names not enumerated in read | — |

### STALE / no remote evidence:
- erica, erica-agent, autonomous-pitching-engine, pitching-engine, eligibility-engine, kanban, kava_pages, nft, grafana-dashboard, opentui, oumi-evals, palmier-pro, sixsevenstudio, jev-ultrafast, Kiro, LLM-wiki, mingw-w64.github.io, TradingAgents, moltbot-main — present locally, absent from all CI available:local lists.
- Draft/one-off dirs: _tiffany-topic-history-*, tiffany-History-*, Tiffany-topic-history-* (Desktop, duplicate audit dirs named 3 ways).

---

## 6. Recommended consolidation plan (order of operations)

1. **Canonicalize nimbus-agent** (blocking, highest risk): pick `fleet/nimbus-agent` main as canonical; reconcile the 6 workflow copies against remote; delete quarantined + reconcile/PR copies after PR merge. ⛔ Requires human owner decision on deploy authority (audit gate).
2. **Purge 111 cline/prompts mis-clones** in GitHub/ + fleet/Documents/multiAgentic — immediate large cleanup, zero risk.
3. **De-dupe mirror-image clones** between Documents/ and multiAgentic/ (~15 pairs with identical remote+commit) — keep one side, hard-link or archive other.
4. **Prune worktree/PR-branch copies** (vault-pro ×3, royal-ruby ×4, staci ×6, nimbus ×3, Diamond-Kava ×5) to 1 canonical repo + 1 PR worktree each after open PRs merge.
5. **Tidy npm pollution:** consolidate 88 root + 65 multiAgentic package dirs into their projects' node_modules or delete; delete 31 `node_modules__*.txt` dumps.
6. **Archive:** report-version spam, installers/zips, erica cluster, opencode mirrors, rescued/audit artifacts → `_ARCHIVE/`.
7. **Move personal docs out of multiAgentic/** (OneDrive-synced) — see §7 security note.

**Projected result:** 421 "logical" dirs → ~120 real projects; ~200+ dirs deletable/archivable; ~90 duplicates resolved.

---

## 7. Security flags (read-only observation, no values read)

- Wallet artifacts found in **cloud-synced OneDrive\multiAgentic**: `_2015_01_06_default_wallet-53e24ff4.dat`, `_27september2025-53e24ff4.txn`, `_mempool_txid_22september2025-cf6b113e.txn`, `bitcoin_backup_20260326_174019.tar.gz.gpg`, `btc_wallet.data`, `bitpay-recovery-phrase-template.pdf`. MASTER-LIBRARY-INDEX claims credential/wallet files were moved to local-only `~/.secrets` (2026-09-26 remediation) — **these filenames contradict that claim**. Flag for human review; do not open.
- MultiAgentic also holds check stubs, tax returns, bank statements, ID scans in-sync — sensitive personal data in the cloud-synced tree.
- No credential values were read, copied, or exposed during this scan.

---

## 8. Files created/modified
- None modified. Supporting scan artifacts under `%TMPDIR%` (/tmp): root.txt, docs.txt, fleet.txt, gh.txt, ma.txt, repos.txt, pr.txt, gitmeta*.txt, docsproj.txt, mafilter.txt, rootproj.txt, rootgit.txt (all transient).