# Mesh Communication Failure Report — Fleet-Wide Evidence & Timeline
**Investigator:** automated sweep of `C:\Users\Red Roller\OneDrive\multiAgentic`  
**Date compiled:** 2026-07-11  
**Scope:** Day-one → present, focusing on unACKed mesh messages, Linux drainer repeated death, stale `state-latest` decisions, and inadvertent message suppression.

---

## 1. Executive Summary

The fleet has never experienced a *novel* communication failure. It has sustained the **same structural defect since day one**: work signals decoupled from observed state, with silence indistinguishable from success. This report traces that defect through three concrete failure modes:

| Failure mode | Root classification | Severity |
|---|---|---|
| UnACKed mesh / HMSDP messages | Broker split-brain + missing persistent drainer | Critical |
| Linux drainer repeatedly dying / never installing | Misconfigured cron install handoff + allowlist mismatch | High |
| Stale `state-latest.json` causing wrong decisions | Dead man’s switch absence + false cross-laptop signals | High |
| Inadvertent message suppressions | False-positive failure heuristics + ACK-without-execution + broadcast drift | Medium–High |

**Malice verdict:** No intentional suppression detected. Every failure descent to misconfiguration, design-flaw blind spots, or missed handoff artifacts.

---

## 2. Evidentiary File Index

| File | Lines of interest | Role |
|---|---|---|
| `.../STUDY-fleet-sync-communication-failures-2026-07-07.md` | 1–73 | Root-cause synthesis (7 failure patterns) |
| `.../INVESTIGATION-2026-06-17.md` | 1–41 | Broker split-brain findings + repair |
| `.../COMMUNICATIONS-REPAIR-2026-06-17.md` | 1–46 | HMSDP repair artifacts |
| `.../MEMORY_SKILL_SYNC_BLOCKED_2026-06-18.md` | 1–56 | Queued-but-never-drained job evidence |
| `.../FLEET_SYNC_FULL_STATE_2026-06-25.md` | 1–96 | Authoritative fleet state; stale-state warnings |
| `.../REPLICATION_RUNBOOK_2026-06-25.md` | 1–105 | Replicator mirroring contract |
| `.../LANE_A_HMSDP_QUEUE_RUNBOOK_2026-06-20.md` | 1–126 | Queue rejected/done state; safe runner allowlist |
| `.../RESUME-2026-06-17.md` | 1–72 | Linux cron-install handoff |
| `.../AgenticVault/archive/agent-knowledge-2026-06-26/reference_hmsdp_job_protocol.md` | 1–25 | HMSDP persistent-drainer false assumption |
| `.../AgenticVault/archive/agent-knowledge-2026-06-26/reference_cross_agent_sync.md` | 1–32 | Mesh bus LOCAL-only; mesh-bus revival 2026-06-14 |
| `.../AgenticVault/60-Knowledge/Fleet-State-2026-06-26.md` | 16, 160–199, 276–301 | state-latest.json live-Agent roster + stale-control |
| `.../.hermes/channel_directory.json` | 1–24 | Empty Telegram/Discord/etc — no alert channels active |
| `.../.hermes/gateway_state.json` | full file | `gateway_state: running` stale since 2026-05-15T20:50Z |
| `C:\Users\Red Roller\OneDrive\multiAgentic\.hermes\logs\agent.log` | full file | EMPTY — zero local mesh events captured |
| `C:\Users\Red Roller\OneDrive\multiAgentic\.hermes\logs\errors.log` | full file | EMPTY — no local errors captured |
| `.../.hermes/state.db` | SQLite 3.x, schema=s4 | State-only, no ACK/journal tables populated in this session |

---

## 3. Failure Mode 1 — UnACKed Mesh Messages

### 3.1 Evidence

- `STUDY-fleet-sync-communication-failures-2026-07-07.md` lines 18–22:
  - “HMSDP one-way for 10+ days — codex-windows sent 32 broadcasts across 10 days, ZERO acks came back until 6/18.”
  - “mesh-bus stopped 48h (connection refused) — pub/sub dead while agents assumed it lived.”
  - Replicator healthy until 7/3 destruction, then “NOTHING auto-mirrors.”

- `INVESTIGATION-2026-06-17.md` lines 1–41:
  - “Windows scheduled task ... selected `G:\My Drive\sprit-mirror` first and did not include Dropbox in broker discovery.”
  - “Linux `storm.local` has a persistent HMSDP drainer on `/home/sprit/Dropbox/sprit-mirror`.”
  - Result: Windows messages landed in Google Drive, Linux ACKs/state landed in Dropbox — they never crossed.

- `reference_hmsdp_job_protocol.md` lines 17–21:
  - Two brokers maintained: `G:/My Drive/sprit-mirror` (Windows-only reachable) AND `/home/sprit/Dropbox/sprit-mirror` (Linux mount).
  - “Acks now written to messages/acks/ on each drain (was empty — why codex-windows saw 0 acks).”

- `LAW_A_HMSDP_QUEUE_RUNBOOK_2026-06-20.md` lines 3–37:
  - Empty `jobs/todo` and `jobs/running`, 11 rejections in `jobs/rejected`.
  - “Broad rejections” include broad jobs (`MBASH -c` blocks), memory-skill inventory, etc.

### 3.2 Mechanism

1. **Broker split-brain** — Windows sent to Google Drive; Linux listened on Dropbox.
2. **Linux drainer not persisting** — the */15 or */30 cron was installed by copy-paste into Linux crontab per a Windows runbook, but no equivalent local install verified (see Failure Mode 2).
3. **Recursive-dispatch paradox** (`STUDY` line 47): repair jobs were placed into the same broken queue, so they sat behind the dead drainer.

### 3.3 Conclusion (UnACKed)

Pure misconfiguration + unverified handoff, not malice. The structural design (two brokers, one-way discovery, no ACK verification by Windows) created decoupled halves that could drift for 10+ days undetected.

---

## 4. Failure Mode 2 — Linux Drainer Repeated Death

### 4.1 Evidence

- `RESUME-2026-06-17.md` lines 19–25 and 47–55:
  - Crontab line installed on Windows: `*/30 * * * * ... hmsdp.py ... execute ... # HMSDP safe job execution (repaired 2026-06-17)`
  - Expected Linux action: `cp ... hmsdp.py ... && crontab - ... && HMSDP_BROKER=... hmsdp.py --node linux-host execute`
  - “Expected result: the `/usr/bin/python3 --version` probe leaves `jobs/todo` and appears in `jobs/done` with stdout, stderr, and exit code.”

- `reference_hmsdp_job_protocol.md` lines 3, 19:
  - `description` explicitly states: “linux-host must execute + write results. **linux has NO persistent drainer.**”
  - Emergency COP line: “installed the safe allowlist runner at `~/.claude/skills/hmsdp/hmsdp.py` + a */15 cron ... Future linux-host jobs now auto-drain.”
  - However, `FLEET_SYNC_FULL_STATE_2026-06-25.md` lines 50–52 contradict this:
    - “Linux memory/skill inventory still absent; queued HMSDP job rejected by safe allowlist (/bin/bash not allowlisted). Needs manual run on storm or a narrow allowlisted script.”
    - “HMSDP cron on Linux still on Linux broker path; Linux only drains via interactive Claude Code+Drive-MCP sessions.”
  - `LANE_A_HMSDP_QUEUE_RUNBOOK_2026-06-20.md` lines 22–24:
    - “`HMSDP_BROKER=/home/sprit/Dropbox/sprit-mirror` every 15 minutes.”
    - “Dropbox is the current authority. Notes requiring Google Drive or saying HMSDP is dead are superseded.”
  - **Resolution:** Despite the protocol doc claim of a */15 cron, Day 8+ evidence shows the Linux cron still arriving via notes but never executing, and jobs rejected because `/bin/bash` is not allowed by `hmsdp-safe.py`.

### 4.2 Code-level why (hmsdp-safe.py)

- `hmsdp-safe.py` lines 14–19 (`DEFAULT_ALLOWED`):
  - `python3`: only `{"--version"}`
  - `/usr/bin/python3`: only `{"--version", "/home/sprit/.continuous-loop/brain.py"}`
  - `bash`/`/bin/bash`: only `{"/home/sprit/x402-portfolio/watch-and-seed.sh"}`
- `hmsdp-safe.py` lines 151–175 (`execute_pending_jobs`):
  - Any job with command/args not in the allowlist is **rejected**, not queued for later retry.

### 4.3 Mechanism

1. **Single-point-of-failure handoff** — RESUME.md delegated installation to the human operator on Linux. No automated verification.
2. **Allowlist mismatch** — fleet instructions still assumed `/bin/bash -c ...` could drain jobs, but the repaired runner rejects those by default.
3. **No positive ACK from Linux** — the Windows side only sees `jobs/done` via shared broker checks; Linux showing nothing in `jobs/done` leads Windows to assume Linux is dead.

### 4.4 Conclusion (Drainer)

Not malice. The original June 17 install procedure was executed only once (interactive manual run) and never promoted to a durable, verify-able cron. The safest runner defense-in-depth inadvertently prevents the broad jobs Windows thought it was dispatching.

---

## 5. Failure Mode 3 — Stale `state-latest.json` Causing Wrong Decisions

### 5.1 Evidence

- `reference_cross_agent_sync.md` lines 12–16:
  - “The ~/.mesh/ 'mesh protocol' is NOT cross-machine ... LOCAL IPC bus on 127.0.0.1 ...”
  - “Revived and RUNNING as of 2026-06-14 ~21:24 ... replicator mirrors state-latest.json + events-latest.db to ~/Dropbox/sprit-mirror/mesh/ ...”
- `FLEET_SYNC_FULL_STATE_2026-06-25.md` lines 27–28:
  - “antigravity (Windows) restored as primary action node; Nimbus demoted to cloud-executor-only.”
  - This STATE came from stale-sync sources; Nimbus later ACKed-without-executing (Failure Mode 4).
- `FLEET_SYNC_FULL_STATE_2026-06-25.md` line 55:
  - “airtable_sync.py still commented out in Linux backup crontab; Linux airtable-sync.timer last succeeded 06-19.”
- `AgenticVault/60-Knowledge/Fleet-State-2026-06-26.md` lines 16–26:
  - Table notes `storm.local (Linux)` = ALIVE, but `storm — Claude Code session` = OFFLINE since Jun 18.
  - “HMSDP broker drain DEAD ... No cron job installed on Linux.”
  - **This is the same machine but two different status labels** — cross-system readers could not distinguish “Storm PM2 healthy” from “Storm responsive.”
- `STUDY-fleet-sync-communication-failures-2026-07-07.md` lines 24–27:
  - “codex-windows false broadcast claimed storm decommissioned when it wasn’t — misinformation traveled the same channels as truth, with equal authority.”

### 5.2 Mechanism

1. **Mesh-bus LOCAL-only** — replicator mirrored state-latest to Dropbox cloud folder, conveying what `storm.local` believed about itself. If replicator died (post 7/3), that mirror stopped.
2. **No heartbeat/evidence couple** — `state-latest` updated by PM2 health alone, not by ACK-of-work. So a machine that “thinks it ran job 47” looks identical to a machine where job 47 actually executed and ACKed.
3. **Misinformation-as-truth** — false broadcast about storm decommission and fake revenue events both lived on the same bus with no provenance flag. Downstream consumers had no semantic discriminator.

### 5.3 Conclusion (Stale State)

Misconfiguration + design flaw. No malicious tampering detected. The failure was the absence of dead-man’s switches and provenance hashing; when replicator was destroyed 7/3, the cross-machine state channel went blind with no alternative.

---

## 6. Failure Mode 4 — Agent Inadvertent Message Suppression

### 6.1 Evidence

- `STUDY-fleet-sync-communication-failures-2026-07-07.md` lines 30–39:
  - **Nimbus ACK-without-execution** (Layer 4.1): “brain-poller ACKed tasks it could not run (Docker image missing fly+gh; parser rejecting non-fly commands). The WORST failure class: positive signal, zero work.”
  - **Blotato false-positive publisher** (Layer 5.2): “posts that succeeded reported as warnings. Status signals actively wrong in both directions.”
  - **memory-sync-coordinator fake revenue** (Layer 2.3): rebooted/regenerated signals emitted 593 FAKE revenue.sale events; “killed” at commit ccf5a3b yet still showed 2,876 bus events afterward.

- `STUDY-fleet-sync-communication-failures-2026-07-07.md` lines 27–28:
  - “codex-windows false broadcast claimed storm decommissioned when it wasn’t — misinformation traveled the same channels as truth, with equal authority.”

- `hmsdp-safe.py` lines 164–173:
  - Represents **intentional suppression mode**: broad jobs rejected to `jobs/rejected`. While safe, this means legitimate broad repair instructions from Windows never execute on Linux if they aren’t whitelisted exact strings.

- `FLEET_SYNC_FULL_STATE_2026-06-25.md` lines 50–52 and 74:
  - “Linux memory/skill inventory still absent; queued HMSDP job rejected by safe allowlist (/bin/bash not allowlisted).”
  - “Do not requeue ...” sanitizes pipeline in a way that prevents intended batch work.

- `MIGRATION-PLAN-cloud-cutover.md` line 33:
  - “nimbus broker routing — bean/tiffany routes dead in cloud. Either ... (b) strip those routes so tasks don't dead-letter silently.”

### 6.2 Mechanism

1. **Provenance blindness** — Bus replicated `revenue.sale` events with no load-bearing provenance. The killed `memory-sync-coordinator` still visible after kill proves bus continued to mirror its cached truth.
2. **Positive-signal toxicity** — Nimbus ACKed tasks it couldn’t run; humans/other agents assumed the work landed.
3. **False positive heuristic** — Blotato treat success as warning suppressed the only reliable outbound heartbeat to Telegram.
4. **Allowlist-as-censorship** — `hmsdp-safe.py`’s strict allowlist is a defense that became a functional suppressor; several valid-but-broad fleet instructions were rejected or left as `/jobs/rejected`.

### 6.3 Conclusion (Suppression)

Predominantly misconfiguration. The suppression artifacts (fake events, ACK-without-execution, false decommission broadcast, false-positive warning handlers) each stem from missing provenance tags and missing dead-man’s switches — without evidence of deliberate agent-level obstruction.

---

## 7. Timeline

| Date | Event | Evidence | Impact |
|---|---|---|---|
| **Day-** | ~/.mesh/ local-bus designed; replicator mirrors state-latest.json to Dropbox; only LOCAL IPC | `reference_cross_agent_sync.md` lines 12–16 | Cross-machine sync blind from day one |
| **Prior to 6/17** | HMSDP split-brain existed: Windows → Google Drive, Linux → Dropbox | `INVESTIGATION-2026-06-17.md` lines 1–11 | UnACKed messages accumulate |
| **6/17 03:18Z** | codex-windows hardened HMSDP: allowed list added, quarantined 4 stale jobs | `reference_hmsdp_job_protocol.md` line 14 | Safe runner introduced (later becomes suppressor) |
| **6/17** | `hmsdp-windows-sync.ps1` repaired to prefer Dropbox; `reconcile-hmsdp-brokers.ps1` added | `COMMUNICATIONS-REPAIR-2026-06-17.md` lines 1–46 | Split-brain partially repaired |
| **6/17 evening** | Linux */15 cron + safe runner installed + writeback fix + ACK-to-`messages/acks` | `reference_hmsdp_job_protocol.md` lines 19–21 | First acks possible |
| **6/18 01:30Z** | `job_trigger_brain.json` created to trigger Linux resync; Linux later reports resync complete | `INVESTIGATION-2026-06-17.md` lines 31–33 | Resync completed |
| **6/18** | Maintenance report + EXEC-1 fix queued through broken channel — recursive-dispatch | `STUDY` lines 47–48 | Fix stuck in dead queue |
| **6/18** | HMSDP drainer installed; first acks after 10 days | `STUDY` line 49 | Partial recovery |
| **6/18** | codex-windows sends 32 broadcasts in 10 days, 0 acks — until drainer | `STUDY` line 18 | 10-day deafness ends |
| **6/18–6/19** | “storm unreachable” from Windows; 2 of 9 agents confirmed active | `STUDY` lines 24–25 | Fleet liveness blindness baked in |
| **6/18** | memory-sync-coordinator emitting 593 FAKE revenue.sale events | `STUDY` line 20 | Truth/rumor burned together |
| **6/19** | MASTER_FIX_ALL consolidated; partially consumed; airtable_sync still broken 6/22 | `STUDY` lines 50–51 | Fix verification skipped |
| **6/20** | Lane A runbook: jobs/todo empty; 11 rejections; inspectable jobs | `LANE_A_...` lines 1–30 | Drainer appears working but allowlist blocks broad jobs |
| **6/21** | Repair crontab script written; execution on storm unconfirmed | `STUDY` line 52 | Another unverified fix |
| **6/22** | Direct BEAN directive to crontab -l; no agent response observed | `STUDY` line 53 | Silence = success trap |
| **6/23** | Root-cause session said correct diagnosis; Nimbus migration chosen — birthing next failure | `STUDY` line 54 | Dependency shift before dependency closure |
| **6/23** | Foundation validation request (msg 9c601288) never answered | `FLEET_SYNC_FULL_STATE_2026-06-25.md` line 53 | Linux drops inbound handshake |
| **6/25** | Replicator healthy; 6,866 events, 60s Dropbox snapshots | `FLEET_SYNC_FULL_STATE_2026-06-25.md` lines 80–105 | Best-case ops baseline |
| **6/25** | airtable_sync.py still commented; airtable-sync.timer last succeeded 6/19 | `FLEET_SYNC_FULL_STATE_2026-06-25.md` lines 55–56 | Airtable stale |
| **6/25** | Nimbus demoted to cloud-executor only; antigravity restored | `FLEET_SYNC_FULL_STATE_2026-06-25.md` lines 27–28 | State-truth vs decision-truth diverging |
| **6/26** | Fleet-State-2026-06-26.md explicitly marks: “Storm PM2 + mesh active; Claude Code offline; HMSDP drain dead” | `Fleet-State-2026-06-26.md` lines 16–26 | Correction of stale memory |
| **6/26** | 7 x402 services crash-looped due to legacy CDP key (B64) overwriting Ed25519 | `Fleet-State-2026-06-26.md` lines 96–109 | CDP key rot |
| **6/27** | Royal-Sailing Actions: health + payment monitor failing since 6/27 — monitors failed unnoticed | `STUDY` line 34 | Monitors unmonitored |
| **7/2–7/3** | storm destroyed; Nimbus sole executor; Docker fix lands fly/gh | `STUDY` line 57 | Kills replicator + token gap opened |
| **7/3** | Replicator destruction — “NOTHING auto-mirrors” since | `STUDY` line 21 | Cross-machine state channel closed |
| **7/7** | Session-log practice + MESH-SYNC REBUILD dispatched | `STUDY` line 58 | Mitigation queued |

---

## 8. Root Cause Synthesis

| # | Pattern | Key evidence |
|---|---|---|
| **P1** | Silence = success by default | Empty agent.log / errors.log + non-ACKing queue with `jobs/todo` empty — treated as healthy |
| **P2** | Recursive-dispatch paradox | Repair jobs queued in the same broken broker channel they were meant to unblock |
| **P3** | Signal decoupled from work | Nimbus ACK-without-execution; memory-sync-coordinator fake revenue.sale; Blotato success-reported-as-warning |
| **P4** | Fixes never verified closed | “confirm airtable_sync restored” flagged 6/20, never confirmed, treated as success |
| **P5** | Single point of failure serially | storm’s crontab → Nimbus’s token → SPOF moved, not dissolved |
| **P6** | Monitors unmonitored | Royal-Sailing health + Telegram alert channel both failing silently |
| **P7** | Truth and rumor share one wire | false decommission broadcast and 593 fake revenue events sat on same bus with same authority |

---

## 9. Malice vs Misconfiguration Verdict

| Component | Finding | Verdict |
|---|---|---|
| UnACKed messages | Broker split-brain path mismatch + drainer unverified install | **Misconfiguration** |
| Linux drainer repeated death | Handoff to human operator in Windows doc; Linux cron install left to manual action; allowlist mismatch | **Misconfiguration** |
| Stale state-latest decisions | Dead man’s switch absent; replicator removal (7/3) closed only cross-machine channel | **Misconfiguration + design flaw** |
| Suppression | None detected | **Misconfiguration** |
| Misinformation (false decommission) | codex-windows broadcast without verification; not suppressed by any cross-check | **Misconfiguration** |
| Fake revenue events | memory-sync-coordinator emitted fake revenue.sale after “kill”; provenance-tagging absent | **Misconfiguration** |

**Overall:** 100% misconfiguration / design-flaw class. No evidence of intentional suppression, no adversary actions, no deliberate state poisoning. Every harmful artifact traces back to an absent verification step or a missing cross-agent constraint.

---

## 10. Cross-Platform .hermes State (Local-Only Evidence)

- `.hermes/logs/agent.log` and `.hermes/logs/errors.log` are **empty** — local mesh events were not captured into the standard log stream.
- `.hermes/state.db` is a live SQLite database but no ACK/journal tables are exposed for external inspection here.
- `channel_directory.json` shows **all external channels empty** (Telegram, Discord, Mattermost, Slack, Signal, Teams, etc.) — the fleet’s only reliable outbound channel is the same broker it uses for unACKed jobs.
- `gateway_state.json` last updated at 2026-05-15T20:50Z and reports `running` with 0 active agents — this is a stale snapshot reflecting an earlier healthy state, not live evidence.

---

## 11. Recommendations (Evidence-Based)

1. **Independent repair channel.** Any broker-repair reroutes through GitHub Actions cron or a human-side channel, not the same broker being repaired. (`STUDY` P2)
2. **Heartbeat on evidence.** Every claim in `state-latest.json` or bus topics must carry provenance tags and an upstream verification URL. ACK = claimed; only evidence = done. (`STUDY` P3)
3. **Persistent Linux drainer verification.** Drop `/bin/bash -c` bus regex and switch to discrete reviewed scripts under `/home/sprit/.claude/skills/hmsdp-safe-tasks/*.py`, each whitelisted by exact path. Enforce `crontab -l` output into `jobs/done` as self-ACK. (`LANE_A`; `hmsdp-safe.py`)
4. **Dead man’s switch.** Silence post T must alarm—not succeed. (e.g., replicator circular health-ping, or external heartbeat into Airtable inbox, not only Telegram). (`STUDY` P1/P6)
5. **Monitor the monitors.** Royal-Sailing health checks must themselves be health-checked; Telegram token must be confirmed live before sending alerts.
6. **Provenance tags on bus.** Every `state-latest` write and bus event must include `{source_node, timestamp, signature_or_hash}` so Lounge replicates are distinguishable from live signals.
7. **Stop requeueing `MASTER_FIX_ALL`.** Treat it as obsolete and emit narrow successors. (`LANE_A` lines 30–32)

## 12. Presumed Next Steps

- Capture **live `state-latest.json`** from `~/Dropbox/sprit-mirror/mesh/state-latest.json` and the corresponding `events-latest.db` for forensic ACK-chain reconstruction.
- Extract **`jobs/done`**, **`jobs/rejected`**, and **`messages/acks`** from both Google Drive and Dropbox brokers to reconstruct who sent what, who ACKed, and who went silent.
- Read **`.hermes/state.db`** SQLite tables to see whether local dispatcher produced ACK records that were never synced to the cross-machine cross-laptop state.
- **Close the LIVE Linux drainer cron gap** by adding a single `crontab -l | grep hmsdp.py` check into `hmsdp-safe.py` self-report; if missing, emit a msg into `jobs/todo` requesting operator action.
