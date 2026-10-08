# Execution Prompts — Staci Birth + Active Revenue Operations
[session: 2026-07-11 | agent: claude.ai chat | purpose: final executable prompt set, per Bryant's directive]
Each prompt is complete and self-contained. Paste into the specified session type. A must complete before B. C/D/E are independent.

## PROMPT A — STACI PRE-FLIGHT (any session with Bryant; ~15 min; BEFORE Prompt B)
Prepare credentials for the Staci deployment. Walk Bryant through gathering these — NO secret ever pasted into chat; each goes directly into a local file ~/staci-secrets.env that Prompt B's session will source:
1. FLY_API_TOKEN — exists (org token, 2026-07-10, C:\Users\Red Roller\org-fly-token.txt). Verify; else: flyctl tokens create org -o personal
2. GH_PAT — github.com → Settings → Developer settings → PAT, scopes repo+workflow. Must be the account that will own the repo (Roxue88 per design, or bshelby88 — note the choice; deploy-staci.sh REPO_OWNER must match).
3. AIRTABLE_TOKEN — reuse fleet token from ~/.config/royal-ruby/. Do not mint new.
4. X402_PAY_TO — 0x6bDea25c368c32eeCb31054dd4766Fc8125e4e02 (value, not secret)
5. ANTHROPIC_API_KEY — console.anthropic.com (check vault first)
6. SUPABASE_URL — supabase.com → New project (free) → "staci" → copy URL. Her state store.
7. TELEGRAM_BOT_TOKEN — @BotFather → /newbot → copy token. Her approval channel to Bryant's phone.
8. RECEIPT_SECRET — openssl rand -hex 32, fresh.
Exit: all 8 in the local env file, zero in chat. Then Bryant opens Claude Code and pastes Prompt B.

## PROMPT B — STACI BIRTH (Claude Code on Bryant's machine; Prompt A complete)
Deploy Staci per Drive multiAgentic/STACI_DEPLOYMENT_SPEC.md (fileId 1qqTmmE9bpnb2o_fSgqW8rJEBeyr60Qjv); architecture 1mGHlCWbK7FZT-V_w6Xq0rTPdC-7xoC1E; source multiAgentic/staci-v0.3.0-extract/staci/. Post each gate artifact to Airtable rec1EZPWRQRTTaC4M (appHjVD4pMobyUyNj / tblWmov5XSkSh9xdE), signed [session|agent|purpose]:
1. PRE-FLIGHT: gh repo view <owner>/staci = not found AND flyctl apps list | grep staci = empty. Else STOP.
2. Pull source from Drive locally; source ~/staci-secrets.env.
3. Set REPO_OWNER in deploy-staci.sh to Bryant's chosen account.
4. git init/commit; gh repo create <owner>/staci --private --source=. --push
5. bash deploy-staci.sh (creates staci-core + staci-tradingagents, sets secrets, patches Dockerfile, pushes; CI takes over).
6. VERIFY: curl staci-core Fly URL → {"status":"ok",...}. Post raw output.
7. CONFIRM DRY_RUN=1 (default). DO NOT flip in this session — 24h dry-run first.
8. Watch one full cycle: heartbeat, unison election, [UNISON] logs. Known check: if she logs "standing by (nimbus elected)" indefinitely, the election needs nimbus's heartbeat wired or nimbus retired — report, don't force.
9. Post: "STACI LIVE IN DRY_RUN [health URL] [repo URL] — verified: human. 24h window ends <ts>. A DIFFERENT session activates per B2."

## PROMPT B2 — STACI ACTIVATION (DIFFERENT session, ≥24h after B — deployer may not activate, D1 rule)
Read last 5 comments on rec1EZPWRQRTTaC4M. Verify yourself: (1) health URL 200 now; (2) dry-run logs show only sane intended actions; (3) she wins/can win the election. All pass → flyctl secrets set DRY_RUN=0 --app staci-core, watch one live cycle, post "STACI ACTIVE — verified: human" + log excerpt. Any fail → post it, leave DRY_RUN=1, escalate to Bryant.

## PROMPT C — SEND THE FELIX/CRC REPLY (Bryant + any session; 5 min; HIGHEST VALUE)
A complete draft reply to Credit Repair Cloud sits in Bryant's Gmail drafts NOW (created 2026-07-11, threaded, subject "API partnership — white-label FCRA dispute-letter generation") containing the Sentry Forge tech docs they requested twice. Note: their "Felix" is an AI support agent — real but early-stage; their API is XML; direction is Sentry Forge → CRC.
1. Bryant verifies one claim before sending: the draft calls the letter-generation API live/callable. If reality is pipeline-scripts, edit to "in final deployment." Honesty survives technical review.
2. Bryant sends. 3. Post to board: "CRC docs sent <date> — verified: human." 4. If no reply in 5 business days, draft a one-line nudge.

## PROMPT D — CRYPTO CONSOLIDATION (~$237; Bryant executes ALL steps at his own logins; session guides only, never handles credentials or transactions)
1. Coinbase: sell ~$88 to USD. 2. Consolidate ~$76 Base ETH dust (0x6bDea/Roxue1/Project Royal) to treasury. 3. Send ~$3-5 ETH to 0x9e6A (ETH=0, holds 73.19 stranded USDC). 4. Sweep the 73.19 USDC to treasury 0x6bDea25c368c32eeCb31054dd4766Fc8125e4e02. 5. Post tx hashes — verified: chain (closes item open since 06-29).
Guardrails: never accept seed phrases/keys/passwords in chat. Wallet-access problems = blocked, documented; no recovery flows (per Bryant's 07-09 standing directive).

## PROMPT E — REDDIT DISPUTE-PACK FUNNEL (Bryant posts; session preps + tracks)
Copy: Drive REVENUE_OUTREACH_PACK.md Plan A. Payment default: peer apps (CashApp/PayPal/Zelle) unless Bryant says otherwise.
1. Finalize DM with Bryant's payment handle. 2. Bryant posts the two value comments on ≤5 recent (<48h) r/CreditRepair posts with SPECIFIC collector problems — no links in comments. 3. DM only genuine engagers; $149/pack, hand-fulfilled via the existing pipeline. 4. Track every touch in Airtable. 5. Compliance: educational + document prep only; never promise outcomes, never advise whether to pay, never legal advice. 6. Send the testimonial-extraction message to the prior $149 customer (text in the pack).

## SEQUENCING
Today: C (5 min) → E setup + first posts → D if energy remains.
Tonight/tomorrow: A (15 min) → B (one Claude Code sitting).
+24h: B2 flips Staci live.
By Monday: Staci active, two funnels open, ~$237 consolidated, CRC docs in review.
