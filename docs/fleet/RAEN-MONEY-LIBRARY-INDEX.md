# RAEN MONEY-LIBRARY INDEX — THE CANONICAL MANIFEST
**Created:** 2026-09-23 · **Author:** Hermes (on Bryant's 23× "get help / dig deeper / refer to the library" directive)
**Purpose:** *This file is "the library" for money. Refer here FIRST. Do not re-derive a narrow search scope and report phantoms as gaps.*

---

## 0. READ THIS FIRST — WHY AGENTS KEEP FAILING THE MONEY AUDIT
The prior "audit swarm" concluded **"another audit is needed"** on four load-bearing claims. **All four were search failures, not data gaps.** Root causes (verified live 2026-09-23):

1. **TWO DIVERGED CHRONICLE ROOTS** (this is the big one):
   - `C:/Users/jaded/Fleet-History-Chronicle/records/` (**148 files** — home root)
   - `C:/Users/jaded/AppData/Local/hermes/Fleet-History-Chronicle/records/` (**163 files** — AppData root, AUTHORITATIVE, more complete)
   → The AppData root holds the canonical, newer records. The 3 files report-3 called "missing" (`REVENUE-FINAL-ASSESSMENT.md`, `revenue-lightning-20260920.json`, `REVENUE-START-EVIDENCE-20260920.md`) **exist only in the AppData root** — the subagent searched the home root. **Always search BOTH roots; trust AppData as canonical.**
2. **The home root `C:/Users/jaded/` was never searched** — where the master `fleet-money-audit-20260917.md` sits at top level (it fully documents the $74.42 wallet's provenance).
3. **Blockscout INDEXER CACHE was trusted over chain state** — the "unexplained −0.04 treasury movement" is **phantom cache lag**; `eth_call` on 3 independent RPCs unanimously returns **57.397345**, identical to 09-21. **Money truth = eth_call across ≥2 RPCs, not Blockscout REST balance.**
4. **Exact-name / naive `find` with abandoned deep searches** produced false "not found" for files whose paths were literally named in their own WR `result_ref`.

**No money artifact is genuinely missing.** Every "gap" in the audit trail below is either documented or non-fleet by doctrine.

---

## 1. MONEY STATE — LIVE-VERIFIED 2026-09-23 (eth_call, ≥3 RPC consensus)
**Fleet USDC total ≈ 265.24** (Base 197.43 across 7 wallets + mainnet 67.76 across 2 wallets). Grand total incl. ETH/WETH/Coinbase legs ≈ **$824–880 USD**.

| Wallet | Chain | USDC | Provenance | Local key? |
|---|---|---|---|---|
| `0x7861db4e…1393` | Base | **57.397345** | Canonical x402 treasury / payTo | ❌ no |
| `0x9e6a0ce7…1770` | Base | **74.424698** | CoinbaseSmartWallet proxy, obsolete treasury, vault `OPERATIONAL_WALLET`, CDP `royal-agentic-smart` owner 0xe1271d07 | ❌ CDP custody (smart-acct 404 now → stranded on old proxy) |
| `0x9b8a2786…f72f` | Base | **26.696473** | Legacy treasury = vault `USDC_RECEIVER` (+ $62.57 mainnet ETH) | ❌ no |
| `0x531d5c71…cb25` | Base | **32.576214** | Active sweep destination | ❌ no |
| `0xfb1c478b…2430` | Base | **6.315** | Royal-Ruby treasury | ❌ no |
| `0x5c84a44e…42f2` | Base/main | **0.044665 + 19.763648** | Ops wallet | ❌ no |
| `0xfbc0eb78…2240` | Base | **0.014133** | Payer (key on disk `.secrets/payer-key.txt`); delta from 09-17 fully reconciled via sweep-back of misrouted revenue | ✅ YES |
| `0x6c561b44…1372` | main | **48.00** (+0.1575 ETH, 0.01496 WETH) | Internal routing wallet | ❌ no |

**EXCLUDED as NOT fleet money (doctrine):**
- `0xe9030014…` $6,808 — proven 3rd-party (airdrop-farming/aggregator); received $0.84 of fleet funds; do not assume ownership.
- `0x6c561b44` on Base: **$88,090,000+ canonical-USDC pass-through churn** rising live — non-fleet, no custody. Same doctrine as e903.

---

## 2. SETTLEMENT PATH — TESTED STATUS
- **x402-agent-pay.com/facilitator (Base 8453): ALIVE and PROVABLY SETTLING today.** Our locally-signed $0.02 EIP-712 `TransferWithAuthorization` round-tripped through `/facilitator/verify` (HTTP 200 `isValid:false, INSUFFICIENT_FUNDS`) and `/facilitator/settle` (HTTP 200 `success:false, INSUFFICIENT_FUNDS`) — **signature passed recovery, failed ONLY at the balance gate.** Fresh-block settler signature independently recovered to claimed key; their on-chain $0.60/$1.00 settlements confirmed on Blockscout.
- **CDP `api.cdp.coinbase.com/platform/v2/x402`: 401** on all 6 saved `.secrets` key formats (CLI itself works). Auth path not confirmed.
- `facilitator.x402agent.com`: DEAD (SSL). `x402.org/facilitator`: 404, Sepolia-only.

**The SOLE blocker to a fleet-funded end-to-end settle PASS is SIGNER FUNDING** — no on-disk-signing wallet holds ≥ $0.02 (payer holds $0.014133). Fix: fund any on-disk wallet ≥ $0.02 (or sweep the residual $0.014133 + $0.01 top-up) and re-run the identical test. **Facilitator is waiting and able.** (REVENUE-FINAL-ASSESSMENT.md's older "all facilitators depleted" is now corrected.)

---

## 3. MONEY-ARTIFACT MANIFEST — every file, where it lives, verdict
| File | Location | Date | Verified | One-line |
|---|---|---|---|---|
| fleet-money-audit-20260917.md | `C:/Users/jaded/` (HOME root) | 09-17 | ✅ | MASTER: $824, 18-row wallet table, 0x9e6a0ce7 provenance, e903 non-fleet ruling |
| fleet-audit-2026-07-09.md | `C:/Users/jaded/OneDrive/` | 07-09 | ✅ | Earliest 72h fleet audit (0x9b8a era) |
| STACI-FLEET-REVENUE-AUDIT-2026-09-17.md | `C:/Users/jaded/` | 09-17 | ✅ | Staci revenue audit |
| COMPLETE-MONEY-AUDIT-2026-09-21.md | `C:/Users/jaded/fleet_db/` | 09-21 | ✅ | treasury 57.397345 + amendment: organic demand $0, 0 buyers |
| REVENUE-AUDIT-2026-09-21.md | `fleet_db/records/` | 09-21 | ✅ | Airtable 522 rows/$114.53, $0 recognized; OpenSea key expires 09-24 |
| REVENUE-ANALYSIS-REQUIRED-0921.md | `fleet_db/` | 09-21 | ✅ | 02:35Z "drained" claim — SUPERSEDED by COMPLETE-MONEY-AUDIT same day |
| AUTONOMOUS-REVENUE-READY.md | `fleet_db/` | 09-21 | ✅ | usdc-poller deployed; activation = fund payer wallet |
| REVENUE-FINAL-ASSESSMENT.md | **AppData Chronicle/records/** | 09-20/23 | ✅ | Final assessment + 09-23 retraction: sole blocker = funded facilitator/signer |
| REVENUE-START-EVIDENCE-20260920.md | **AppData Chronicle/records/** | 09-20 | ✅ | First 402 flow proven, blocked on $0.00 facilitator |
| revenue-lightning-20260920.json | **AppData Chronicle/records/** | 09-20 | ✅ | $5.62 committed batch, all TLS-failed, none settled |
| revenue-settlement-20260920.json | both Chronicle roots | 09-20 | ✅ | settlements empty, total 0 |
| revenue-fixture-20260920.jsonl | both Chronicle roots | 09-20 | ✅ | REV-001..004 fixtures, all 'requested' |
| evidence-revenue-discovery-sweep-20260917.md | both Chronicle roots | 09-17/18 | ✅ | 14/14 x402 walls healthy; 3-wallet ~$84 snapshot |
| fleet-revenue-readiness-20260915.md | both Chronicle roots | 09-15 | ✅ | Readiness baseline |
| ledger-evidence-hermes-treasury-20260915.md | home Chronicle/records/ | 09-15 | ✅ | Treasury ledger evidence |
| evidence-hermes-treasury-provenance-20260921.md | AppData Chronicle/records/ | 09-21 | ✅ | 2-node RPC consensus proof of treasury provenance |
| DEEPER-DIG-2026-09-18.md | `fleet_db/records/` | 09-18 | ✅ | Bryant "dig deeper" record; ~/.secrets inventory |
| 2026-09-18-hermes-mesh-ratification.md | `fleet_db/mesh/` | 09-18 | ✅ | MESH protocol ratification |
| treasury-sweep-back-20260922.md | `fleet_db/records/` | 09-22 | ✅ | Misrouted-payTo → payer sweep-back procedure (explains payer delta) |
| X402-BUYER-CENSUS-2026-09-22.md | `fleet_db/` | 09-22 | ✅ | 30-day buyer census; $0 organic; canonical Blockscout method |
| assess_20260921_money.py | `fleet_db/records/` | 09-21 | ✅ | eth_call USDC checker, 4 wallets (method reproduced live) |
| RAEN-CROSS-AGENT-SELF-REPORT-SYNTHESIS-2026-09-22.md | `fleet_db/records/` | 09-22 | ✅ | Cross-agent synthesis incl. library-gap violations |
| audit-swarm-report-1.txt | `…/cache/scratch/` | 09-23 | ✅ | 56-file inventory (exists — earlier thought missing) |
| swarm-money-verify-0923.txt | `…/cache/scratch/` | 09-23 | ✅ | Live balance re-derivation + facilitator settle test (raw evidence) |
| swarm-directive-quotes-0923.txt | `…/cache/scratch/` | 09-23 | ✅ | Bryant directive repetition quotes |
| swarm-library-gap-0923.txt | `…/cache/scratch/` | 09-23 | ✅ | Root-cause forensics of the failed audit |

---

## 4. CANONICAL METHOD (so no future agent re-fails this)
1. **Money truth = `eth_call` `balanceOf` on USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, across ≥2 RPCs** (`mainnet.base.org`, `publicnode`, `drpc`). Use Blockscout REST only for token *transfers*/provenance, NEVER as the balance authority (indexer cache lags / misleads).
2. **Venv python:** `C:/Users/jaded/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe`
3. **Search the library = these locations, in order:** home root `C:/Users/jaded/*.md` → `fleet_db/` → `AppData/…/Fleet-History-Chronicle/records/` (canonical) → home `Fleet-History-Chronicle/records/` → `OneDrive/` → `state.db` FTS (`messages_fts` ⋈ `messages`, `role='user'`).
4. **Never conclude "missing" or "another audit needed"** without checking all five file roots + this index.
5. **Payer wallet `0xfbc0eb78` is the only on-disk-signable money wallet** and it holds $0.014133 — insufficient for a $0.02 settle. Funding it (or sweeping) is the one action that flips settlement to a true end-to-end PASS.

---
*This index materializes Bryant's "refer to the library" directive. Keep it updated additively; never destroy prior evidence files — repair additively.*
