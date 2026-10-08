# RAEN — Fresh Independent Assessment
**Date:** 2026-09-18 (CDT) · **Method:** live re-audit of every prior claim, not self-report acceptance
**Rule honored:** verify-by-discriminating-test; nothing destroyed; over-claims corrected toward evidence

---

## What I did
Studied `BEAN-BLOCKER-REPORT-2026-09-17.md`, `fleet_state.json`, and the Google Workspace
skill, then **re-probed live** (not trusting prior agents' "resolved" labels) every major
pillar: x402 walls, kernel, staci-core, Nexus, Base RPC, Airtable, RAE MCP, and the Google
lane (which I just finished).

## VERIFIED LIVE (claims HOLD)
| Claim | Independent check | Result |
|-------|-------------------|--------|
| x402 canonical payTo (G1) | read `/accepts[0].payTo` from full manifests, 10 walls | **10/10 = 0x7861db4e** (stronger than prior "6/7") |
| B3 rae-kernel /readyz | GET /readyz | **200 JSON now** (events 61, was 14) — resolved confirmed |
| B5 staci-core recovered | GET /health | **ready / authoritative** |
| W6 Sovereign Nexus | GET /health | operational **2.0.0-GOD-MODE** |
| Base RPC | POST eth_blockNumber (curl) | **live, block 0x3131a50** (chain advanced from 0x31090ea) |
| W8 Airtable | GET meta/bases with ~/.airtable_pat | **200, bases listable** |
| F2/F3 RAE MCP | hermes mcp list (default + rae) | **enabled in both**, 120s timeout, venv python |
| **Google Workspace** | tokeninfo + `google_api.py gmail search` | **PROVEN**: token holds gmail+calendar scopes; live unread returned |

## CORRECTED / NEW FINDINGS
1. **GOOGLE lane was mislabeled "blocked" earlier** — the 403 `accessNotConfigured` had
   self-healed (API enablement propagated). It is now **RESOLVED**, morning-brief unblocked.
2. **`setup.py --check` "missing 6 scopes" is a red herring** for a read-only brief.
   `tokeninfo` ground-truth shows the token HAS `calendar.readonly/events` +
   `gmail.readonly/send` + userinfo. Drive/Docs/Sheets/Contacts/gmail.modify absent — not needed.
3. **B4 OpenSea downgraded RESOLVED → UNCONFIRMED.** Every auth-gated v2 route returns 404
   (even real slugs); the only 200 (`/api/v2/collections`) also 200s **with no key** — a
   non-discriminating test. The prior "key valid" verdict rested on that public endpoint.
   Key at `~/.opensea/api_key` prefix `5f3473` (rotated from Desktop backup `f4b8aca`).
   Renewal cron `8a6093ca345e` stays as safety net.
4. **Tooling pitfall:** bare `urllib` + `Authorization: Bearer` 401s on some Google REST while
   `tokeninfo` (query-param) succeeds and the skill CLI works — **use `google_api.py`**, which is
   what the cron actually calls. Base RPC 403/405 on urllib (Cloudflare datacenter-IP block),
   200 on curl — matches B4's "curl-UA bypass" note.
5. **google_login.py bug fixed:** SCOPES used short names `"profile"`/`"openid"` → oauthlib
   raised "Scope has changed" on fetch_token. Patched to full `.../userinfo.profile` +
   Google-canonical ordering; that's what let the token land.

## STATE OF THE FLEET
- **39 Fly apps**: 24 deployed, 15 suspended (autostart), 0 never-deployed — consistent.
- **Money path**: canonical payTo `0x7861db4e` (~$57.29 USDC treasury float). Payer float
  `0xfbc0eb78` has only dust — top up before trade execution (unchanged from prior).
- **A2A**: testnet-proven settlement; **mainnet funding-gated** (payer needs 0.10 mainnet USDC;
  treasury key not on box). This remains the real gap for live x402 revenue, not Google.
- **Airtable**: 523 rows, 372 verified-onchain, $0 recognized revenue per doctrine.

## OPEN (agent-actionable, not Bryant-gated)
- Re-verify OpenSea key against a genuinely auth-gated endpoint when a valid base collection
  slug is known (or via renewal cron result).
- Mainnet x402 settlement needs $0.10 mainnet USDC funded to payer `0xfbc0eb78` — the only
  step requiring a wallet move; everything else is proven.

**Verdict: fleet is healthy and the Google/morning-brief lane is genuinely closed. Two prior
"resolved" labels were corrected — Google (now truly resolved) and OpenSea (now honestly
unconfirmed).**