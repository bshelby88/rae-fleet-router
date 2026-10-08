# Fleet Comms Model v2 + Failure Ledger — Combined Handoff Doc
[session: 2026-07-11 | agent: claude.ai chat | purpose: final handoff — communications design + consolidated open items]

## PART 1 — COMMS MODEL (replaces all-to-all broadcast)

Core change: every agent reads/writes ONE shared ledger. Nothing peer-to-peer outside it. (Direct fix for the OpenClaw failure mode: undocumented private channels.)

One truth source PER FACT TYPE:
- Deployed? → Fly only (flyctl apps list / machine status)
- Code exists + tests pass? → GitHub only (commits, Actions)
- Revenue? → Base chain only (USDC into treasury) — self-reported events banned (593-fake-events lesson)
- What next? → Airtable (coordination only, never proof of fact)
- Policy/design? → Drive doc ONLY if status = BINDING (drafts are not directives)

Every write signed: [session: YYYY-MM-DD-HHMM | agent: name | purpose: one line]. Never bare "Claude" — root cause of most attribution confusion in the fleet's history.

Standing reconciliation: GH Actions cron q15min — diff Fly's real app list vs Airtable claimed status vs GitHub actual state; post ONE diff comment to a designated record on disagreement; never auto-resolve, only surface. Replaces the recurring manual multi-hour audits (6 in 5 weeks).

Provenance tags (verified: chain|human|agent-claim) stay exactly as-is; agent-claim never closes anything.
Pre-2026-07-03 mesh/broker references: archived, not cited as active.

## PART 2 — FAILURE LEDGER (consolidated, sourced, as of 2026-07-11)

RESOLVED w/ evidence:
- $149 sale origin (off-chain Stripe via Dispute Forge, 06-29 audit)
- dispute-forge-x402 status (LIVE, cleanly stopped 06-30, payment-ready — 07-10/11 session)
- RoyalSettlement AUM (pure simulation, $0 on-chain)
- BTC/AntPool (non-recoverable, closed by Bryant 07-09)
- Kip/Erica origin (intentional Hermes twin experiment, approved 07-05)
- Fly org token BLK-1 (fixed 07-10/11; surfaced briefsnap-x402, dispute-forge-x402, forge-engine as undocumented)
- Storm/cloud split (ended by storm destruction 07-03)
- Fly-token-in-fresh-shells ghost (root-caused to OpenClaw process)

NEEDS BRYANT DECISION (research done, choice pending):
- Charter v1.0 ratify or discard (still DRAFT; Decisions #1–#4 all open)
- Staci: launch per spec, or retire explicitly — no more limbo
- Stripe contradiction ×2: royal-ruby-live STRIPE-SETUP.md + diamond-kava live $19/mo product marked "killed" — decide both together
- Fleet-freeze directive (07-11 02:13): attribution disputed by Bryant; restate, reword, or void — directly, once, signed

OPEN (small, concrete, mostly terminal work):
- Nimbus persistent volume never mounted (07-02 "self-heal" was false-done; /app/.fly workaround won't survive redeploy)
- tradingagents-x402 daily-ping workflow FAILING since ≥07-10; which of 8 apps is broken: unidentified
- 73.19 USDC stranded at 0x9e6A (needs ~$3 ETH gas bridge)
- BLK-3 .fly/config.yml rotation not explicitly confirmed complete
- DEPLOY TRAP: 6 services' source extraction from Fly images not confirmed committed
- $149 sale Gmail verification trail never chased
- OpenClaw: contained but installing agent unidentified, no fleet documentation created
- Subtask 0 (credential vault continuity): never closed with an artifact
- fleet-litellm 500s uninvestigated
- Unanswered inbound (CRC white-label + 3 law firms) still unreplied

BOTTOM LINE (consistent with MASTER-FINDINGS 06-07 and every audit since): infrastructure is done; customers are absent; the open items are mostly boring last steps, not builds. Done = a stranger's money landed.
