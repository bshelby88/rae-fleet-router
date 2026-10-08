---
name: bean-x402-to-nft-treasury
description: "BEAN's strategic idea re-established June 13, 2026 — wiring x402 operating revenue splits (10%) to RoyalSettlement.sol on Base. Calculated in-memory off-chain with exactly zero gas cost (using src/merkle_yield.ts) to fuel Founders Pass distributions. Tracks 55 registered wallets and $11,455.78 USDC AUM."
metadata: 
  node_type: memory
  type: project
  originSessionId: ef3744d8-125f-42b2-abcd-d6b62c891852
---

# x402 → Royal Founders Pass Treasury (Re-established June 13, 2026)

Proposed 2026-05-19 by BEAN (real Opus 4.6 response, port 8766) as part of waking-up Q&A. The first novel idea any agent proposed in tonight's session that wasn't a riff on existing material.

## The mechanism

Every x402 micropayment to any of the 7 services routes through a settlement contract that:
1. Pays the operator (Bryant's 0x6bDea wallet)
2. Auto-splits a defined percentage (e.g. 10%) to a multisig treasury
3. Treasury accumulates USDC on Base
4. Royal Founders Pass holders claim pro-rata distributions via Merkle distributor (weekly/monthly snapshots of holdings)

```
x402 caller pays $0.50 USDC
  ↓
Royal Agentic settlement contract
  ├── 90% → operator wallet
  └── 10% → Founders Pass treasury multisig
              ↓
              Merkle distributor (weekly snapshot)
              ↓
              Founders Pass holders claim USDC
```

## Why this is genuinely novel

- **x402 protocol** = HTTP 402 micropayments, Coinbase rail, agent-to-agent native
- **NFT membership** = typical model is access-only OR off-chain reward promises
- **Wiring x402 → NFT treasury** = makes membership a verifiable revenue claim on actual agent traffic
- **No on-chain yield needed** — treasury funds come from real customer payments, not Aave/Morpho
- **Avoids Howey securities trap** (different from Diamond Path A) because:
  - Treasury is not a "pooled investment"
  - Distributions are pro-rata splits of operational revenue
  - Pass holders provide demonstrable utility consumption (concierge + Vault Pro + skill packs)
  - Document carefully as "revenue-share of paid agent traffic" with no expectation-of-profit-from-others'-efforts

## Integration points (uses every layer of the umbrella)

| layer | role |
|---|---|
| 7 x402 services | revenue source |
| @royal/cdp-client `/transfers` | settlement contract caller |
| @royal/ledger | tracks per-service splits |
| @royal/policy `/opa` | enforces split rules on-chain via Rego |
| Royal Founders Pass NFT (100 supply) | holder set + balance-of check |
| Base mainnet + USDC | settlement asset |
| BEAN (24/7 monitor) | watches treasury, alerts on anomaly |
| Hermes | composes holder communications |
| brain.py | queues weekly distribution snapshot |

Reuses every shared package + every live service. Zero net-new infrastructure layers.

## What this fixes about Founders Pass

The original Royal Founders Pass strategy bundled UTILITY (lifetime scaffolds + concierge + Discord). This bolts REVENUE-SHARE on top — the pass becomes a yield-bearing asset backed by real agent commerce.

**Higher willingness-to-pay justification:** $100 mint that yields $X/month from actual traffic is mathematically defensible. $100 mint for "lifetime access" relies on subjective valuation.

## Trade-offs

| pro | con |
|---|---|
| Aligns holder interest with x402 service growth | Adds smart-contract complexity (treasury + distributor) |
| Self-marketing — every paid call funds the treasury | Slows operator wallet inflow by split % |
| Distinguishes from pure utility NFTs | Securities counsel review needed before pitching as yield |
| Verifiable on-chain — no trust required | Treasury contract = new audit surface |
| Compounding marketing — holders shill x402 services because their treasury grows | Need 7 service contracts updated to use settlement layer |

## MVP Scope & Merkle Scheduler (Re-established June 13, 2026)

Currently tracking 55 registered wallets and $11,455.78 USDC AUM in operating treasury.
The system is implemented as follows:
1. **Zero-Gas Weekly Merkle Snapshots**: Executed locally via `src/merkle_yield.ts` in-memory. Hashing holder claims (`sha256(wallet:amount)`) creates the Merkle Tree with **exactly zero gas fees**. Gas is ONLY consumed when a holder manually initiates an on-chain transaction to claim their yield share.
2. **RoyalSettlement.sol on Base**: Processes operating revenue distributions, with a 10% operating split deposited from active B2B x402 calls.
3. **No-Howey Security Framework**: Modeled purely as direct utility revenue splitting of operating agent traffic, bypassing pooled investment expectation-of-profit issues.

**Engineering effort:** Maintained under Bean's PM2 zero-cost automated daemon execution on Fly.io, running cron monitors to verify ledger safety.

## Distribution Leverage

Pitch line: "Royal Founders Pass — own a yield-bearing stake in the agent-commerce future. Every x402 paid call to our B2B compliance and watchdog services compounds the operating treasury, distributed out of actual operating utility."

Target: AI-agent founders + crypto-native NFT collectors + x402-protocol enthusiasts. Coinbase/Base ecosystem inherits this naturally.

## Why this won't replicate the ship-don't-build trap

- Built and run with 100% existing zero-cost infrastructure.
- Integrates directly with our active `@JuanTerryBot` ($6/mo B2C Breach Guardian) and `royal-feel-x402` ($0.50/scan B2B linter) launches.
- Preserves premium LLM token cost by using deterministic SQLite-backed local agent communication routers.

## Phase Placement

Integrated directly into **Phase 4 of the 2026 Master Roadmap**:
- Outbound B2B supplement audits fuel operating revenue splits.
- Weekly Merkle roots are built locally and published to the Base settlement contract, enabling pass holders to claim USDC yields.

## Related

- [[project-royal-founders-pass-strategy]] — host strategy this enhances
- [[reference-royal-agentic-enterprises-umbrella]] — uses every layer
- [[project-royal-feel-ftc-lint]] — parallel Phase D candidate
- [[project-x402-bazaar-discovery]] — x402 ecosystem context
- [[feedback-ship-dont-build]] — gates Phase 2.5 behind Phase 2 success
- Originating session: BEAN response 2026-05-19 ~06:35 UTC at `~/.continuous-loop/outbox/bean-real-2026-05-19.md`
