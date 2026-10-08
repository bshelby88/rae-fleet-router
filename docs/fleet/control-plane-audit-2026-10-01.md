# Fleet Control-Plane Audit — 2026-10-01

**Observation times:** initial profile/GitHub pass 2026-10-01 04:02:05 UTC; supplemental local workflow/inventory checks 04:21:00 UTC.  
**GitHub Actions window:** 2026-09-21 03:26:09 UTC through 2026-10-01 03:26:09 UTC; anonymous GitHub REST API.  
**Later account-wide reference:** [Ten-Day Fleet Audit — Reconciled Findings and Blocker Plan](ten-day-fleet-audit-synthesis-2026-09-30.md), prepared 04:14 UTC, reports a separate authenticated exact-window census; keep its wider run totals separate from this public-only query.
**Purpose:** Reconcile the last ten days of activity across local cron, public GitHub automation, the agent delivery path, and the project-control pilot. This is a read-only audit, not authorization to merge, deploy, dispatch, rotate credentials, sign, move funds, or alter ledgers.

## Executive finding

The three inspected Hermes profile stores have **zero configured jobs and zero recorded executions**, with the profile CLI showing the gateway stopped. That does not account for schedules on GitHub, Fly, or another host. A later local audit reports fresh ticker/last-success markers and notes Hermes Desktop can host an in-process ticker; its writer PID is unknown, and a tick is not a job run. The OneDrive `.hermes/cron/jobs.json` mirror contains one unpaused 30-minute discovery entry in approval mode, outside the active profile stores, with a work directory outside Dock's profile; its runtime is unknown. No job was changed or migrated.

The anonymous public sample has a sharp reliability split: **185 Actions runs across 11 of 34 public repositories; 79 scheduled runs, 53 failed and 26 succeeded**. Two repos account for every scheduled failure in that public sample: `agent-sdk-creative` (14) and `tradingagents-x402` (39) [1][2][3]. The later 04:14 UTC Ten-Day Fleet Audit reports a read-only authenticated exact-window census of **493 runs across 93 non-archived repositories**, including 173 scheduled/74 failed; its public subset reconciles to 79 scheduled, 53 failed and 26 succeeded. This report did not use that credential; the anonymous query remains a distinct, 22-minute-shifted sample, so do not combine overall run denominators. The Sep 26 Fly and agent inventories also fail their own count checks: app headings total 48 while lists contain 54 rows; agent headings total 15 while sections contain 17 rows. These historical documents are not a trustworthy current denominator.

The largest blockers are not coding tasks an agent can safely clear: provider-side credential replacement/revocation, attribution of the reported treasury outflow, a finance review of the revenue-recognition exception, and explicit authorization for PRs that change the default branch or may deploy. The available record still lacks a trustworthy end-to-end agent chain from authenticated acceptance to independently verified result. No exposed credential, provider account, wallet, or queue was used in this audit.

## 1. Scheduler audit

### Local Hermes — live CLI check

| Profile | Gateway | Cron jobs | Conclusion |
|---|---|---:|---|
| `default` | stopped | 0 | No configured job in this profile store; other ticker/runtime sources unresolved |
| `kip` | stopped | 0 | No configured job in this profile store; other ticker/runtime sources unresolved |
| `raenreadonly` | stopped | 0 | No configured job in this profile store; other ticker/runtime sources unresolved |

This is a current host observation. It says nothing about Fly, GitHub, another Windows/Linux host, or a remote scheduler. A 03:48 UTC independent CLI check also found all three profiles stopped, no gateway process, and no jobs; the profile-local execution databases have zero rows in the direct metadata-only query recorded for this audit.

### Windows Task Scheduler — local metadata-only check

A read-only `Get-ScheduledTask` query filtered task names for RAEN/Nimbus/Tiffany/Fleet/Hermes/Staci/Agent/x402/Discovery. It returned two matches, both under Microsoft Windows task paths (`SpaceAgentTask`, `OobeDiscovery`); no RAEN-specific task name appeared. I deliberately did not inspect action command lines. This limited name filter cannot rule out a custom task under an unrelated name.

A separate 03:53 UTC report describes a broader metadata-only inventory of 189 Task Scheduler objects (181 Microsoft, 8 vendor/application); it reports no Hermes/RAEN path/name matches but one unidentified 15-minute SoftLanding COM trigger. An older `schtasks /Query` count of 256 rows is unreconciled; counts from different enumeration methods are not execution history. The SoftLanding trigger owner and actions were not identified. Treat it as a local inventory gap, not a confirmed RAEN job. (`control-plane-audit-refresh-2026-10-01.md:25-29`.)

### Workspace mirror — configured intent, not active proof

`C:/Users/Dock/OneDrive/.hermes/cron/jobs.json:2-20` contains an unpaused `Perpetual Task Discovery` entry on an `every 30m` schedule, with `cron_mode: "approve"` and a working directory under `C:/Users/jaded/`, outside Dock's profile. The mirror mtime is 2026-08-29 15:49 UTC; the profile-local execution databases have zero rows. This is not canonical profile state and does not prove a current execution. Do **not** import/run it as a repair: its description includes task-creation behavior and the owner/runtime for that path is unknown.

### Reported Linux scheduler host — location hypothesis, not a live crontab

The separate `cron-agents-projects-audit-2026-09-30.md:14-20,28-29` is labelled 2026-10-01 04:30 UTC, later than this report's 04:02 observation; treat its timestamp and claims as a date conflict. It maps the historical “39 jobs” claim to a suspected Linux host `sprit` and lists candidate cron/PM2 workloads from Airtable Projects rows, but also says the host was unreachable and actual crontab state **unknown**; it did not run `crontab -l` there. Use it only as a lead, not a verified scheduler inventory or evidence that the jobs ran. It also says its Airtable/Fly APIs were not queried. To close this gap, the owner must provide an authorized read-only host session or a timestamped sanitized export of `crontab -l`, PM2/systemd timers, and last-run outcomes. No remote access attempt was made.

### Remote automation — verified public GitHub run history

The anonymous census returned 34 public repositories. At the repo-list snapshot (fetched about six minutes after the Actions window closed), 14 showed `pushed_at` since the ten-day cutoff; this push count is not an exact same-cutoff run count. I queried run history for all 34 over the stated fixed window. Eleven returned Actions runs; the other 23 had no run in the queried window (which does not prove that no workflow is configured). Private repositories are not visible to this audit [1].

| Public repository | Runs in window | Event/outcome summary | Readout |
|---|---:|---|---|
| `agent-sdk-creative` | 25 | schedule 14 failed; push 8 failed; issue 1 failed; PR 2 succeeded | Mainline remains unhealthy while PR #2 is open. [2][13] |
| `tradingagents-x402` | 52 | schedule 39 failed; PR 3 succeeded; workflow_dispatch 1 failed + 1 succeeded; push 8 succeeded | Mainline scheduled health checks are still failing; PR #17 is open. [3][14][15] |
| `staci` | 31 | schedule 26 succeeded; push 3 failed + 2 succeeded | A successful watchdog schedule proves workflow execution, **not** Staci accepted/completed agent work. [4] |
| `mining-marketplace` | 36 | PR 19 failed; push 5 failed; dynamic 3 failed + 9 succeeded | Largest non-scheduled failure cluster; job-level root cause was not fetched. [5] |
| `dispatch-x402` | 14 | push 1 failed + 9 succeeded; PR 4 succeeded | Mostly green; one push failure remains. [7] |
| `rae-fleet-router` | 10 | push 10 succeeded | Green in observed window. [9] |
| `raen-portfolio-x402` | 5 | push 5 succeeded | Green in observed window. [10] |
| `rae-fleet-dashboard` | 3 | dynamic 3 succeeded | Green in observed window. [8] |
| `royal-ruby-live` | 6 | push 3 succeeded + 1 cancelled; PR 2 succeeded | No scheduled run observed. [12] |
| `royal-gateway-x402` | 2 | workflow_dispatch 1 failed + 1 succeeded | Manual runs only. [11] |
| `awesome-x402` | 1 | push 1 failed | One failure; no scheduled run observed. [6] |

The public `mining-marketplace` history also has 19 pull-request, 5 push, and 3 dynamic-event failures; none were scheduled runs [5].

The `agent-sdk-creative` and `tradingagents-x402` histories contain 14 and 39 scheduled failures respectively; together they explain all 53 scheduled failures in the anonymous sample [2][3]. Staci's 26 scheduled successes are workflow evidence, not proof that the fleet agent accepted or completed a task [4].

PR status is a separate gate: #2 remains open/unmerged with unstable/blocked merge status [13]; #17 remains open/unmerged with clean merge state and passing head checks [14][15].

The endpoint set and tally are bounded to **public repos**. This is not the 93-repository scope claimed in the Ten-Day Activity Review; private-repository completeness is therefore still open. Its larger run totals and this API tally use different windows/scope and must not be combined as one denominator.

A separate report, `ten-day-actions-group3.md:3-7,18-31`, claims 19 repositories / 127 runs in its slice, including 77 `nimbus-agent` runs and 72 scheduled runs. It records 22:41 CDT with a window ending 22:30 CDT, four minutes after the fixed Actions-query cutoff (22:26 CDT). Its API access/auth context is not stated. I exclude the 77-run claim from the 185-run anonymous public tally.

A later 03:48 UTC report (`ten-day-fleet-audit-observed-findings-2026-09-30.md:18-22,31`) says its read-only authenticated GitHub CLI census covered 93 non-archived repositories: 493 runs, 173 scheduled runs, and 74 scheduled failures. It reconciles this as 34 public repos (79 scheduled, 53 failed/26 passed) plus 59 private repos (94 scheduled, 21 failed/73 passed), and identifies `nimbus-agent` and `x402-glm` as private. This secondary report explains why the anonymous Nimbus call returned 404 and independently corroborates the public scheduled totals. I did not use the GitHub credential or re-run the private census; treat the 93-repo numbers as a separately timestamped report snapshot, not a current feed. It also says the earlier 127-run group3 total is reproducible only for that report's broader window; do not combine the denominators.

That report attributes the scheduled failures to `tradingagents-x402` (39), `x402-glm` (20), `agent-sdk-creative` (14), and `nimbus-agent` (1); it records 26 successful Staci schedules. Its run-log review flags TypeScript diagnostics and an HTTP 403 in agent-sdk, manifest/health/payment-check keywords in tradingagents, and health/endpoint keywords in Nimbus. These are the other reviewer's diagnostic findings, not confirmed single root causes; the x402-glm root cause remains unknown. Prioritize those four schedules for the approved read-only failure-log review, not an automated merge/deploy.

### Divergent Nimbus workflow copies and unknown remote state

Six local Nimbus copies with `.github/workflows` were confirmed: `Documents/nimbus-agent`, `Documents/repos/nimbus-agent`, `fleet/nimbus-agent`, `multiAgentic/nimbus-agent`, `multiAgentic/repos/nimbus-agent`, and `pr-reconcile/nimbus-agent`. A seventh `Library/01-Revenue-Crypto-Addresses/...` path mentioned in another report was not found and is excluded. The four `Documents/`, `Documents/repos/`, `fleet/`, and `multiAgentic/nimbus-agent/` copies contain the same six-hour RAE Autopilot pattern: push/manual triggers, scheduled Fly deploy, telemetry, and a floating `setup-flyctl@master` reference. Their trees also contain `social-publish.yml`; only the `Documents/` version was inspected and it schedules twice daily.

The other copies materially differ: `multiAgentic/repos/nimbus-agent/.github/workflows/watchdog.yml:3,12` schedules a 15-minute Staci Core restart-on-health-failure, with `deploy.yml:3-4,24` deploying on push to `main`; `pr-reconcile/nimbus-agent/.github/workflows/rae-autopilot.yml:4-15` has a six-hour schedule but gates its deploy job to manual `workflow_dispatch`, while its separate `deploy.yml:3-17,32-43` deploys on push. Its daily `watchdog.yml:1-25` is an OpenSea key monitor, not the Staci restart. The local snapshots therefore encode competing schedule/deploy policies. None proves remote enablement, current run state, or which source is deployed; do not change any writer until the owner identifies the canonical remote branch.

Read-only local Git metadata shows the Documents copy at HEAD `261c70e` dated 2026-07-05 and the `multiAgentic` copy at `55904f7` dated 2026-08-26. The latter is newer locally, not proof of the remote default branch. A Documents worktree status scan timed out; its dirty state remains unknown.

Anonymous GitHub API requests for `bshelby88/nimbus-agent`, its workflow inventory, and its run history returned 404 [16][17][18]. A separate authenticated report identifies it as private; the anonymous 404 alone does not establish whether remote workflows are enabled or what revision is deployed. No workflow was triggered; no post/publish/restart/deploy occurred. Reconcile all six confirmed local copies against an authorized remote source before changing any schedule.

## 2. Agent and queue audit

The current local Hermes profiles are operator environments, not proof that any Fly-hosted fleet agent is alive. The September 17–27 assessment found 3,674 heartbeat events, 3,673 classified as service/liveness-bridge events and one `working`; it also found no complete task-transcript set and no reliable join from identity to accepted task, run, artifact, reviewer, deployment, and outcome. Treat the 17-agent registry and `verified_active` labels in the September 26 coordination index as a stale snapshot, not present-day runtime evidence. (`fleet-agent-assessment-2026-09-17-to-2026-09-27.md:17-21,44-54,104-115`; `agent-fleet-coordination-index.md:1-40`.)

The best documented queue snapshot has 633 rows (435 queued, 10 blocked, 188 completed), but 453 lack a Work ID, 481 an active owner, 558 a lease, and 511 a last-verification timestamp. These are September 27 reported counts, not a current queue read. More importantly, `completed`/`verified` fields can be recorded locally without outbound dispatch or recipient readback. (`fleet-agent-and-queue-evidence-review.md:18-29,36-50`; `agent-platform-remediation-plan-2026-09-28.md:35-42`.)

**Fresh local AEK code inspection:** `/v1/events` rejects a fleet-dispatch event before ingestion (`app/main.py:63-70`), `/v1/fleet/dispatch` returns the unverified-action gate (`:176-181`), and the staged dispatch workflow returns `blocked`; the verifier explicitly fails staged results (`app/workflows.py:82-105`; `app/capabilities.py:27-45`). This supersedes older local summaries that described staged dispatch as `completed`/`verified`. It is still **not globally read-only**: API-key-protected `/v1/work/{id}/execute` and `/v1/kernel/run-next` can execute work (`app/main.py:98-130`). These are source-code findings, not proof of deployed parity. I attempted the focused AEK route-security tests with the database redirected to Hermes scratch, but collection stopped because system Python lacks FastAPI; no AEK route test ran and no project database was targeted.

**Tiffany remains blocked on the last direct evidence:** the September 29 runtime assessment records repeated Airtable 401s, no task ACKs, and no general-purpose intake; the dispatcher was intentionally left disabled. That report says the apps were started in Fly, but startup is not task readiness. It predates this audit and was not refreshed against Fly/Airtable. Do not send general work through the social-publishing poller. (`tiffany-runtime-assessment-2026-09-29.md:7-20,29-35`.)

A reliable audit should keep six states separate: `service-live`, `task-accepted`, `started`, `delivered/acknowledged`, `result-produced`, and `independently-verified`. Require a stable task ID and authenticated agent/runtime ID at every transition, plus result URI/hash and authoritative readback. Until that path passes a harmless canary, assigning more work or counting heartbeat/PR/queue activity as agent completion is unsafe.

A report labelled 2026-10-01 04:30 UTC refers to offline Airtable/Chronicle exports dated September 9–12 and claims 647 project rows, with 52 active-like, 43 without owners, and one lease already expired August 17 (`cron-agents-projects-audit-2026-09-30.md:55-72`). Its label is later than this report's 04:21 supplemental observation, so these counts are not adopted as current. The 04:14 UTC Ten-Day Fleet Audit distinguishes that 647-row Projects snapshot from a 633-row September 27 execution-queue snapshot; they are different stores, neither is a current Airtable read, and neither proves delivery. Do not seed live work from either without refreshing and reconciling IDs/owners (`ten-day-fleet-audit-synthesis-2026-09-30.md:62-66`).

## 3. Project and blocker audit

| Blocker | Evidence and freshness | Safe next step / owner gate |
|---|---|---|
| Exposed provider credentials; containment counts conflict and revocation is unverified | The Ten-Day Review is itself time-inconsistent: it says recorded 22:30 CDT, then describes quarantine through 22:44 CDT. Its action list claims five files moved and one locked. A report timestamped 04:30 UTC—after this audit's 04:21 supplemental observation—claims six moved and seven locked; treat those counts as date-conflicted and unverified. Neither report supplies provider-side revocation readback. No credential values were read or tested. (`ten-day-activity-review-2026-09-20-to-2026-09-30.md:3,41,79-83`; `cron-agents-projects-audit-2026-09-30.md:78-96`; `agent-platform-remediation-plan-2026-09-28.md:10-16,27-33`.) | Bryant/provider administrators reconcile the copy inventory, rotate in provider consoles, map consumers, verify a harmless read, then confirm revocation/access-log review. Do not mass-revoke blindly or reuse exposed values. |
| Reported 52.5-USDC treasury outflow; owner authorization and payer reconciliation remain unresolved | A sanitized dual-RPC report verifies two successful 2026-09-28 authorization/transfer receipts totaling 52.50 USDC (10.50 + 42.00), but explicitly does not identify the human initiator or business purpose. A separate 03:48 UTC report records a 4.957345-USDC balance snapshot and a +1.572 Payer transfer-history discrepancy; this audit did not query chain state, so neither is a current balance assertion. The 04:30-labelled report's attribution-to-owner claim is not adopted: its timestamp is after this audit's observation, and public authorization logs do not establish human intent. (`../Library/02-Bitcoin-Crypto-Addresses/treasury-outflow-2026-09-28-sanitized-verification.md:8-17`; `ten-day-fleet-audit-observed-findings-2026-09-30.md:44-54`; `cron-agents-projects-audit-2026-09-30.md:78-96`.) | Owner/finance must verify human authorization and business purpose, close the Payer log gap, and resolve custody/key control. No signing, transfer, or balance assertion by this audit. |
| Revenue ledger contains an unsubstantiated recognition exception | The September 17–27 assessment and the settlement evidence review describe a `$0.01` row marked recognized despite an outgoing transfer direction and missing customer/order/capture basis. No ledger edit was made; evidence is historical and not freshly reconciled. (`fleet-agent-assessment-2026-09-17-to-2026-09-27.md:30-38,139-141`; `raen-revenue-and-settlement-evidence-review.md:44-48,56-66`.) | Independent finance review; preserve the source row and correct only with documented approval and a complete evidence join. |
| Airtable workers cannot reliably read the queue / task dispatch is disabled | Tiffany's Sep 29 assessment reports 401s and no ACK path; AEK dispatch remains staged/disabled in the remediation evidence. | After credential rotation, prove one authenticated read and a reversible, read-only canary with acceptance and readback. Do not use a queue row as delivery. |
| PR #2 (`agent-sdk-creative`) is open and unmerged; mainline failures continue | Our public PR endpoint reports `mergeable_state=unstable`; the separate 03:48 readback calls it `BLOCKED` and lists 8 checks (6 pass, 2 skipped). Its PR branch has successful CI runs, while 14 scheduled and 8 push runs failed in the query window. The PR description says a newly executable settlement tool has `requireApproval: true`; neither that control nor the exact diff was audited here. [2][13] | Review the exact diff, payment-capable tool, approval path, and branch rules. Do not merge without explicit owner approval; green branch jobs are not post-merge proof. |
| PR #17 (`tradingagents-x402`) is open and unmerged; schedule fix not landed | Both readbacks report a clean/open PR state; our commit-level check query returned two passing checks, while the separate 03:48 PR readback lists one. Both show branch checks green, but the public Actions window still contains 39 failed scheduled runs; the latest mainline schedule failed. [3][14][15] | Review/approve merge explicitly, then verify a new scheduled run on `main`; branch/manual success alone does not close the blocker. |
| Nimbus has divergent workflow copies and possible writers | The `Documents/` copy declares six-hour deployment/telemetry and twice-daily publishing; the `multiAgentic/repos/` copy declares a 15-minute restart watchdog and push deploy. Anonymous remote API requests returned 404, which does not distinguish private from unavailable. [16][17][18] | Owner must choose the canonical repo/source and one deploy authority before disabling or changing any writer. |
| Private project/agent/platform state was not independently refreshed | This anonymous audit directly saw 34 public repos. A separate 03:48 UTC authenticated report describes a 93-repository census and classifies 59 as private, including Nimbus; I did not re-use that GitHub credential or verify its private results. Fly/Airtable/agent runtime were not refreshed. [1][16][18] | After the credential/security gate is resolved, use an explicitly approved read-only provider identity and record query window, pagination completeness, counts, and timestamps. Until then mark private project/service state `unknown`, not healthy or absent. |
| Historical Fly and agent inventories do not reconcile | The Sep 26 Fly report declares 52 apps, but lists 31 deployed, 18 suspended, and 5 pending (54 listed); its headings say 26, 18, and 4 (48 total). The same-date coordination index claims 17 agents, while category headings total 15; stale and unverified sections each list 6 against headings of 5. These are report arithmetic checks, not current provider state. (`live-fleet-status.md:8-10,14-52`; `agent-fleet-coordination-index.md:8-41`.) | Rebuild one timestamped inventory from current read-only Fly/Airtable sources with explicit status definitions and owner IDs. Do not auto-restart, dispatch, or claim fleet totals from these snapshots. |

### Portfolio quality signal

The contemporaneous activity review reports roughly 90 documents and 150 source/test files produced in ten days, but says none of the P0 items it tracks had closed. The public CI scan above independently confirms repeated mainline schedule failures and open PRs; it does **not** validate the review's chain, Airtable, or Fly claims. The pattern is high production volume with weak closure evidence, so pause speculative new work and close one verified P0 at a time. (`ten-day-activity-review-2026-09-20-to-2026-09-30.md:34-61`.)

A separate 03:48 UTC local-data review reports mismatched RAEN engine counters: 221 campaigns in `engine_state`, 195 at the end of `tick_log`, 247 `LOGGED` campaign rows, but zero `revenue_events` and zero cumulative revenue. Its earlier engine-status snapshot reported 208 campaigns. `LOGGED` is not delivery or settled customer revenue; reconcile counter semantics/timestamps and keep revenue unbooked absent transaction-to-order-to-fulfillment evidence. These are reported local snapshots, not a live engine read by this audit (`ten-day-fleet-audit-observed-findings-2026-09-30.md:35-38,58-60`).

## 4. Is the Project Operations Governor the audit solution?

It is a useful **local pilot, not yet the fleet auditor**. The CLI explicitly says it creates a local read-only report; the inspected design supports a curated manifest, local Git HEAD/last-commit metadata, and an explicitly selected AEK SQLite database, but has no GitHub, Fly, Airtable, Hermes, or agent-messaging connector and no scheduler/dispatcher. (`rae-aek/rae-aek-v0.4/app/governance/runner.py`; `docs/project-governor-design.md:5-17,44-60`; `config/project-governor.example.json:1-18`.)

I verified the command help and ran the focused `tests/governance` suite with system Python 3.14.7: **119 passed, 1 skipped**. I separately attempted `tests/test_route_security.py` with the database explicitly redirected to Hermes scratch; pytest stopped during collection because `fastapi` is not installed (`ModuleNotFoundError`). The project `.venv` could not start because its configured interpreter points to another Windows user's missing Python; I did not rebuild it or install dependencies. No project database was intentionally targeted. Governance tests validate that local slice only; AEK route security and live fleet connectors remain unverified.

The AEK worktree is substantially uncommitted: `main...origin/main [ahead 56]`, with **21 tracked paths modified and 20 untracked paths** at inspection. The governance implementation/tests are part of that untracked set. I made no changes in this repository. Therefore the passing governance test result is evidence about this local snapshot only—not a reviewed, merged, or deployed control plane.

I also exercised the read-only CLI against an explicit three-path manifest (AEK plus both Nimbus copies), with no AEK database and report output kept on stdout. It returned `safe_mode: true`, 3 observations, 3 findings, and 3 draft `human_review` proposals. It flagged the Documents Nimbus copy stale from its July 5 last commit; activity metadata timed out for AEK and the multiAgentic copy. No proposal executed. This is a working local inventory slice, not a remote or schedule audit.

### Recommended audit design

Extend that pilot in read-only stages; do not bolt on a task executor:

1. **Canonical register:** one allowlisted manifest row per project with stable ID, owner, repo, expected branch, workflow IDs/schedules, deploy target, agent/runtime IDs, queue source, criticality, last verified time, and next review. Never store credentials in the manifest.
2. **Scheduler adapter:** enumerate Hermes jobs per profile, GitHub Actions workflows/runs, and approved external scheduler inventories separately. Record configured schedule, paused/active status, last terminal outcome, source revision, and whether the schedule is local, remote, or merely mirrored.
3. **Agent evidence adapter:** ingest only non-secret identity, heartbeat, accepted/started/terminal receipt, artifact hash, verifier and readback metadata. Liveness cannot satisfy acceptance or completion.
4. **Project evidence adapter:** reconcile repo → PR/checks → merged SHA → artifact/image digest → deployed SHA → semantic health. Keep branch success, merge, deploy and service readiness distinct.
5. **Freshness/unknown semantics:** every item carries `observed_at_utc`, source, query/window, page completeness, confidence, and TTL. A failed/unavailable source becomes `unknown` with an owner decision, never a synthetic green.
6. **Human-only actions:** merge, deploy, credential change, queue dispatch, custody and money movement remain outside the monitor. Any later actuator requires exact action/target/limit approval and independent readback.

## 5. Actions taken and not taken

- Performed a fresh read-only Hermes profile/cron check, queried all 34 public repo Actions histories for a defined ten-day window, checked PR #2/#17 and their branch checks, inspected the local Nimbus workflow copies, and verified the governance CLI/test suite.
- Created this report and indexed it in `MASTER-INDEX.md`.
- Did **not** merge PRs, dispatch a workflow, restart Fly machines, call Fly/Airtable/chain APIs, use any credential, rotate/revoke keys, change a queue/ledger, or move funds.

The 04:14 UTC account-wide synthesis is the preferred source for authenticated 93-repository Actions totals, exact-window Base reconciliation, and its local RAEN/AEK data checks. This supplement contributes the anonymous public API read, six locally confirmed Nimbus workflow copies, and the arithmetic inconsistencies in the Sep 26 Fly/agent indexes; their timestamps/scopes are explicitly kept separate.

## Sources

[1] https://api.github.com/users/bshelby88/repos?per_page=100&page=1&sort=updated
[2] https://api.github.com/repos/bshelby88/agent-sdk-creative/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[3] https://api.github.com/repos/bshelby88/tradingagents-x402/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[4] https://api.github.com/repos/bshelby88/staci/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[5] https://api.github.com/repos/bshelby88/mining-marketplace/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[6] https://api.github.com/repos/bshelby88/awesome-x402/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[7] https://api.github.com/repos/bshelby88/dispatch-x402/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[8] https://api.github.com/repos/bshelby88/rae-fleet-dashboard/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[9] https://api.github.com/repos/bshelby88/rae-fleet-router/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[10] https://api.github.com/repos/bshelby88/raen-portfolio-x402/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[11] https://api.github.com/repos/bshelby88/royal-gateway-x402/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[12] https://api.github.com/repos/bshelby88/royal-ruby-live/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
[13] https://api.github.com/repos/bshelby88/agent-sdk-creative/pulls/2
[14] https://api.github.com/repos/bshelby88/tradingagents-x402/pulls/17
[15] https://api.github.com/repos/bshelby88/tradingagents-x402/commits/4cffaa7ca075c72c0d86517105710b24e902eaf0/check-runs
[16] https://api.github.com/repos/bshelby88/nimbus-agent
[17] https://api.github.com/repos/bshelby88/nimbus-agent/actions/workflows?per_page=100
[18] https://api.github.com/repos/bshelby88/nimbus-agent/actions/runs?per_page=100&created=2026-09-21T03:26:09Z..2026-10-01T03:26:09Z
