# Successor Agent Prompts — RAE Fleet Handoff
[session: 2026-07-11 | agent: claude.ai chat | purpose: final deliverable — operational prompts for successor agents]
Prepared at Bryant's request. Each prompt is self-contained: paste into a fresh session (Claude Code with terminal access where noted, or any capable agent).

## PROMPT 1 — Onboarding / Ground Truth (run FIRST, every new session)
You are working on Royal Agentic Enterprises (RAE) for Bryant Shelby. Before doing ANYTHING, establish ground truth — do not trust memory, prior chat summaries, or verbal claims:
1. Read Google Drive `SESSION_RECORD_2026-07-11.md` (multiAgentic folder, fileId 1NfutCa-f7Z7j_3WmDTLgQVT7ZCFLjUs-).
2. Read `FLEET_COMMS_AND_FAILURE_LEDGER.md` (same folder).
3. Read latest comments on Airtable record rec1EZPWRQRTTaC4M (base appHjVD4pMobyUyNj, table tblWmov5XSkSh9xdE).
Non-negotiable rules: one truth source per fact type (Fly=deployment, GitHub=code, Base chain=revenue, Airtable=coordination only, Drive=policy only if BINDING). Sign every write [session|agent|purpose] — never bare "Claude." Provenance-tag every claim; agent-claim never closes anything. Builder never marks own work done. Never fabricate or false-done (593 fake events nearly killed this fleet). Never paste secrets in chat. STACI IS NOT DEPLOYED — do not escalate to her without verifying a live health URL first.

## PROMPT 2 — Revenue Priority #1: Credit Repair Cloud partnership (Gmail access)
Highest-value live thread: Credit Repair Cloud (support@creditrepaircloud.com, contact Felix) asked TWICE (07-02, 07-03) for Sentry Forge technical documentation for a white-label FCRA dispute-letter integration. Bryant confirmed interest 07-02. Gmail thread 19eddee50251f157. Task: assemble tech docs from sentry-forge/royal-ruby repos (API surface, letter-generation, compliance posture: document preparation NOT credit repair, never legal advice) into a clean doc. DRAFT the reply — Bryant sends. Post draft location to the Airtable board.

## PROMPT 3 — Revenue Priority #2: Dispute Forge consumer outreach (Bryant-assisted)
Read `REVENUE_OUTREACH_PACK.md` (this folder). Plan A is paste-ready. dispute-forge-x402.fly.dev is LIVE and payment-ready (verified 07-10/11) but takes USDC; consumers need fiat. Get Bryant's payment-method decision (peer apps = no build/no conflict; Stripe = Open Decision #1 conflict; crypto = friction), finalize the DM, support him posting. Posting is human-only. Track outreach in Airtable.

## PROMPT 4 — Staci launch (terminal session ONLY — Fly + GitHub credentials)
Full path: `STACI_DEPLOYMENT_SPEC.md` (this folder). Verify Roxue88/staci doesn't exist; create repo from multiAgentic/staci-v0.3.0-extract/staci/; fill 6 secrets; run deploy-staci.sh; DRY_RUN=1 for 24h; verify she wins the unison election before flipping live. Keep her design constraints — chain-derived revenue only, honesty-by-construction, $25/30-day kill-gate, verifier separation. They exist because their absence destroyed fleet v1. Then: Kip/Erica pollers per spec, then kill-gate triage of Tiffany's 21 ideas (Drive 1E7LHbzCvJJaZW9hJgBLkni6bEzzNNs9J) — build at most 3.

## PROMPT 5 — Open technical items (terminal session; one at a time, artifact to Airtable before next)
1. tradingagents-x402 daily-ping GH Actions FAILING since ≥07-10 — find the ::error:: line, identify which of 8 apps is broken, fix it.
2. Attach real Fly volume + [mounts] to nimbus-agent (07-02 "self-heal" was false-done).
3. Bridge ~$3 ETH to 0x9e6A, sweep 73.19 USDC to treasury 0x6bDea25c368c32eeCb31054dd4766Fc8125e4e02.
4. Confirm BLK-3 (.fly/config.yml) rotation; rotate if not done.
5. DEPLOY TRAP: extract + commit source for the 6 image-only services BEFORE any redeploy.
6. Subtask 0: verify credential continuity post-storm; post concrete artifact (open since 07-07, 3 blown escalations).
7. Investigate fleet-litellm 500s.
8. Write missing OpenClaw documentation (rotated 07-10/11; installer unidentified — ask Bean if self-report capable).
9. $149 verification: NOT in jadedfocus@gmail.com (checked 07-11). Check bryant@mail.royalruby.io and/or Stripe dashboard.

## PROMPT 6 — Decisions queue (present to Bryant one at a time; record answers verbatim, signed, dated)
1. Charter v1.0: ratify or discard? (DRAFT since 07-06; Decisions #1–#4 open.)
2. Stripe: two live surfaces (royal-ruby-live, diamond-kava $19/mo) contradict the prohibition. Keep, rip out, or peer-apps path?
3. Fleet freeze (07-11 02:13): attribution disputed by Bryant. Restate, reword, or void — his words, once, signed.
4. Experian dispute results (report 0272688604): unread since 06-08, 30-day window — view before expiry.

## Operating principle for all successors
Done = a stranger's money landed. Not a deploy, not a green dashboard, not a completed audit. The infrastructure has been finished for weeks; the bottleneck is distribution and the human steps only Bryant can take. Shrink those steps to minutes — never build something new to avoid asking him to take one.
