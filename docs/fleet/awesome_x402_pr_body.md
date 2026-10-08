# PR Body — Submit Royal Agentic Enterprises x402 fleet to xpaysh/awesome-x402

## Title

`Add Royal Agentic Enterprises x402 Fleet — 9 production services, 14 endpoints`

## Repository

- Upstream: `xpaysh/awesome-x402`
- Section: **🏭 Production Implementations** → adds one bullet entry at the bottom (one-resource-per-PR is the convention; consolidating all 9 services into a single grouped entry that names each service with its discovery URL is consistent with how other multi-service fleet entries are formatted in the README, e.g. "AfaAgent x402 API Suite", "Arch Tools", "Rug Munch Intelligence")

## Proposed README addition

> [Royal Agentic Enterprises — RAE x402 Fleet](https://fleet-x402-audit.fly.dev) — 9 production agent-payable microservices on Base USDC, 14 endpoints spanning consumer-debt dispute generation, FCRA dispute letters, project & agent scaffolding, email scoring, image generation & editing, state-by-state legal lookup, skill discovery, and crypto ticker/arbitrage analysis. $0.01–$0.75 USDC per call via x402 exact scheme on `eip155:8453`; no API keys, no signup, instant 2-second settlement. Each service publishes a `.well-known/x402.json` discovery manifest and an OpenAPI 3 spec. ([sentry-forge](https://sentry-forge-x402.fly.dev/.well-known/x402.json) | [dispute-forge](https://dispute-forge-x402.fly.dev/.well-known/x402.json) | [vault-pro](https://vault-pro-x402.fly.dev/.well-known/x402.json) | [power-pack](https://power-pack-x402.fly.dev/.well-known/x402.json) | [nanobanana](https://nanobanana-x402.fly.dev/.well-known/x402.json) | [royal-ruby](https://royal-ruby-x402.fly.dev/.well-known/x402.json) | [suprapack](https://suprapack-x402.fly.dev/.well-known/x402.json) | [tradingagents](https://tradingagents-x402.fly.dev/.well-known/x402.json) | [dispatch](https://dispatch-x402.fly.dev/.well-known/x402.json))

## Why this deserves a listing

- ✅ **Actively maintained** — all 9 origins returned `HTTP/1.1 200 OK` on `.well-known/x402.json` at submission time (2026-09-13)
- ✅ **Well-documented** — every service has both a `.well-known/x402.json` discovery doc and an OpenAPI 3 spec at `/openapi.json`
- ✅ **Production-ready** — uses x402 v2 spec with `accepts.scheme=exact`, `network=eip155:8453`, `asset=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` (canonical Base USDC)
- ✅ **x402-specific** — every endpoint is gated by x402 payment; nothing free or auth-keyed
- ✅ **Value-driven** — 14 endpoints address real agent-economy gaps (legal/financial tooling, scaffolding, skill discovery, image gen, scoring)

## Format compliance

Per `CONTRIBUTING.md`: `[Resource Name](link) - Brief description explaining value to x402 developers.`
- Name: "Royal Agentic Enterprises — RAE x402 Fleet"
- Link: `https://fleet-x402-audit.fly.dev`
- Description: addresses value to x402 developers, ends with period, no emojis, neutral tone

## What we did and did not do

- ✅ Discovered the correct repo (`xpaysh/awesome-x402`) — confirmed via GitHub API + CONTRIBUTING.md fetch
- ✅ Read the README to identify the right section ("🏭 Production Implementations")
- ✅ Verified all 9 service origins are live (200 OK on `.well-known/x402.json`)
- ✅ Prepared a paste-ready PR body with a single grouped bullet entry
- ❌ Did NOT open the PR — no GitHub PAT with `repo` write scope is available in this shell (`GITHUB_TOKEN`/`GH_TOKEN` unset, `gh` CLI not authenticated). The PR must be opened manually following the workflow below.

## Manual PR submission workflow

```bash
# 1. Fork the repo in the GitHub UI: https://github.com/xpaysh/awesome-x402/fork

# 2. Clone your fork (replace YOUR_GITHUB_USER)
git clone https://github.com/YOUR_GITHUB_USER/awesome-x402.git
cd awesome-x402

# 3. Create a branch
git checkout -b add-rae-x402-fleet

# 4. Edit README.md — find the section "🏭 Production Implementations"
#    and paste the proposed bullet at the END of the bullet list in that section
#    (before the next "## " heading).

# 5. Commit with the convention used by the repo
git add README.md
git commit -m "Add Royal Agentic Enterprises x402 Fleet — 9 production services, 14 endpoints"

# 6. Push and open a PR against main
git push origin add-rae-x402-fleet
# Then open https://github.com/xpaysh/awesome-x402/compare/main...YOUR_GITHUB_USER:add-rae-x402-fleet?expand=1
```

## PR description (paste this when opening)

> Adds the Royal Agentic Enterprises RAE x402 Fleet to **🏭 Production Implementations**.
>
> 9 production agent-payable microservices on Base USDC, 14 endpoints, $0.01–$0.75 per call. Every service publishes `.well-known/x402.json` and `openapi.json`. No API keys, no signup. x402 v2 exact scheme on `eip155:8453`.
>
> All 9 origins verified live at submission time (HTTP 200 on the discovery manifest). The bullet follows the existing multi-service fleet format already used in this section (e.g. AfaAgent x402 API Suite, Arch Tools, Rug Munch Intelligence).
>
> Services included:
> - **sentry-forge** — 8-file consumer-debt dispute pack ($0.50)
> - **dispute-forge** — FCRA dispute letter + certificate ($0.75)
> - **vault-pro** — project & agent scaffolding ($0.05 × 2 endpoints)
> - **power-pack** — outbound email scoring ($0.01)
> - **nanobanana** — image generation + editing ($0.01 × 2 endpoints)
> - **royal-ruby** — state-by-state legal lookup ($0.05)
> - **suprapack** — skill discovery / find / get / list ($0.03 × 3 endpoints)
> - **tradingagents** — crypto ticker + arbitrage analysis ($0.05 × 2 endpoints)
> - **dispatch** — x402 aggregator / discovery ($0.50)
>
> Per-service discovery manifests: see links in the proposed bullet.
>
> Operator: Royal Agentic Enterprises. Contact: same as in each `.well-known/x402.json` `service.contact` field.
