# PLAN-93 — x402 API Quick-Reference Card

Machine-readable, copy-paste reference for every endpoint advertised by the live RAEN router catalog. Generated from a verbatim fetch of `https://rae-fleet-router.fly.dev/catalog.json` (`generated_utc` **2026-11-25T23:10:56.367Z**).

**Payee (canonical):** `0x9b8a27e03ceba490953cda8ab1291c0e13baf72f` · **Network:** `eip155:8453` (Base) · **Scheme:** `exact` · **Asset:** USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

**Coverage:** 13 walls / 44 endpoints advertised; 12 distinct hosts; 38 canonical paid items.

> Prices below are **catalog-advertised**. The live 402 `accepts[].amount` is authoritative — re-probe with recipe 01 before spending. Sample curls are unauthenticated discovery probes: they return HTTP 402 with a `payment-required` header. Signing and `X-PAYMENT` are per recipe 02 / the machine-onboarding bundle; this card never signs.

## All advertised endpoints

| Wall | Endpoint | Slug | Price (USDC) | PayTo | Sample curl (wall cheapest endpoint) |
|---|---|---|---|---|---|
| briefsnap-x402 | `POST /api/summarize` | `briefsnap` | 1 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://briefsnap-x402.fly.dev/api/summarize' -H 'Content-Type: application/json' -d '{"text":"Paste a document or text here","format":"bullets"}'` |
| briefsnap-x402 | `POST /api/extract-actions` | `briefsnap__extract-actions` | 1.5 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://briefsnap-x402.fly.dev/api/summarize' -H 'Content-Type: application/json' -d '{"text":"Paste a document or text here","format":"bullets"}'` |
| briefsnap-x402 | `POST /api/eli5` | `briefsnap__eli5` | 1 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://briefsnap-x402.fly.dev/api/summarize' -H 'Content-Type: application/json' -d '{"text":"Paste a document or text here","format":"bullets"}'` |
| briefsnap-x402 | `POST /api/compare-docs` | `briefsnap__compare-docs` | 3 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://briefsnap-x402.fly.dev/api/summarize' -H 'Content-Type: application/json' -d '{"text":"Paste a document or text here","format":"bullets"}'` |
| dispatch-x402 | `POST /dispatch` | `dispatch` | 0.5 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://dispatch-x402.fly.dev/dispatch' -H 'Content-Type: application/json' -d '{"intent":"summarize a document into bullets"}'` |
| dispute-forge-x402 | `POST /api/dispute-pack` | `dispute-forge` | 0.01 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://dispute-forge-x402.fly.dev/api/dispute-pack' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |
| escrow-x402 | `POST /api/escrow/create` | `escrow` | 0.005 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://escrow-x402.fly.dev/api/escrow/create' -H 'Content-Type: application/json' -d '{"amount":0.01,"currency":"USDC","counterparty":"agent@example.com"}'` |
| nanobanana-x402 | `POST /api/generate-image` | `nanobanana` | 0.01 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://nanobanana-x402.fly.dev/api/generate-image' -H 'Content-Type: application/json' -d '{"prompt":"A product hero image for a Telegram breach monitor, neon terminal style","aspectRatio":"16:9"}'` |
| nanobanana-x402 | `POST /api/edit-image` | `nanobanana__edit-image` | 0.01 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://nanobanana-x402.fly.dev/api/generate-image' -H 'Content-Type: application/json' -d '{"prompt":"A product hero image for a Telegram breach monitor, neon terminal style","aspectRatio":"16:9"}'` |
| nft-alpha-x402 | `POST /api/nft-signal` | `nft-alpha` | 0.005 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://nft-alpha-x402.fly.dev/api/nft-signal' -H 'Content-Type: application/json' -d '{"collection":"base:0x0000000000000000000000000000000000000000"}'` |
| power-pack-x402 | `POST /api/score-email` | `power-pack` | None | `(free / null)` | `n/a (no canonical positive-price route)` |
| rae-fleet-router | `POST /api/fleet-bundle` | `rae-fleet-router` | 0.03 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/tip` | `rae-fleet-router__tip` | 0.01 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/market-starter` | `rae-fleet-router__bundle_market-starter` | 0.01 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/market-intel-trio` | `rae-fleet-router__bundle_market-intel-trio` | 0.02 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/full-fleet-sampler` | `rae-fleet-router__bundle_full-fleet-sampler` | 0.03 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/compliance-kit` | `rae-fleet-router__bundle_compliance-kit` | 0.35 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/full-stack` | `rae-fleet-router__bundle_full-stack` | 0.04 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| royal-ruby-x402 | `POST /api/law-lookup` | `royal-ruby` | None | `0x9b8a27e0…f72f` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /api/ping` | `royal-ruby__ping` | 0.001 | `0x9b8a27e0…f72f` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /api/cold-start-kit` | `royal-ruby__cold-start-kit` | 5 | `0x9b8a27e0…f72f` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `POST /api/validate-json` | `royal-ruby__validate-json` | 0.01 | `0x9b8a27e0…f72f` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /api/address-check` | `royal-ruby__address-check` | 0.001 | `0x9b8a27e0…f72f` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /api/x402-audit` | `royal-ruby__x402-audit` | 0.005 | `0x9b8a27e0…f72f` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /api/site-audit` | `royal-ruby__site-audit` | 0.005 | `0x9b8a27e0…f72f` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /machine-buyer/` | `royal-ruby__machine-buyer` | None | `(free / null)` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /machine-buyer/qa.json` | `royal-ruby__machine-buyer-qa.json` | None | `(free / null)` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `POST /api/buy-compliance` | `royal-ruby__buy-compliance` | None | `(free / null)` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `POST /api/buy-managed` | `royal-ruby__buy-managed` | None | `(free / null)` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| royal-ruby-x402 | `GET /api/udap-citations` | `royal-ruby__udap-citations` | None | `(free / null)` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| suprapack-x402 | `POST /api/find-skill` | `suprapack` | 0.005 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://suprapack-x402.fly.dev/api/find-skill' -H 'Content-Type: application/json' -d '{"query":"find a skill for summarizing documents"}'` |
| suprapack-x402 | `POST /api/get-skill` | `suprapack__get-skill` | 0.005 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://suprapack-x402.fly.dev/api/find-skill' -H 'Content-Type: application/json' -d '{"query":"find a skill for summarizing documents"}'` |
| suprapack-x402 | `POST /api/list-top` | `suprapack__list-top` | 0.005 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://suprapack-x402.fly.dev/api/find-skill' -H 'Content-Type: application/json' -d '{"query":"find a skill for summarizing documents"}'` |
| tradingagents-x402 | `POST /api/analyze-arbitrage` | `tradingagents__analyze-arbitrage` | 0.05 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://tradingagents-x402.fly.dev/api/analyze-arbitrage' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |
| tradingagents-x402 | `POST /api/analyze-ticker` | `tradingagents` | 0.05 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://tradingagents-x402.fly.dev/api/analyze-arbitrage' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |
| vault-pro-x402 | `POST /api/scaffold-project` | `vault-pro` | 0.05 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://vault-pro-x402.fly.dev/api/scaffold-project' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |
| vault-pro-x402 | `POST /api/scaffold-agent` | `vault-pro__scaffold-agent` | 0.05 | `0x9b8a27e0…f72f` | `curl -i -X POST 'https://vault-pro-x402.fly.dev/api/scaffold-project' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |
| rae-fleet-router | `POST /api/fleet-bundle` | `rae-fleet-router__api-fleet-bundle` | 0.03 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/tip` | `rae-fleet-router__api-tip` | 0.01 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/market-starter` | `rae-fleet-router__api-bundle-market-starter` | 0.01 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/market-intel-trio` | `rae-fleet-router__api-bundle-market-intel-trio` | 0.02 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/full-fleet-sampler` | `rae-fleet-router__api-bundle-full-fleet-sampler` | 0.03 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/compliance-kit` | `rae-fleet-router__api-bundle-compliance-kit` | 0.35 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| rae-fleet-router | `POST /api/bundle/full-stack` | `rae-fleet-router__api-bundle-full-stack` | 0.04 | `0x9B8a27e0…f72f` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |

## Cheapest buyable endpoint per wall (canonical, price > 0)

| Wall | Price | Route | Slug | Unpaid probe |
|---|---|---|---|---|
| briefsnap-x402 | $1 | `POST /api/summarize` | `briefsnap` | `curl -i -X POST 'https://briefsnap-x402.fly.dev/api/summarize' -H 'Content-Type: application/json' -d '{"text":"Paste a document or text here","format":"bullets"}'` |
| dispatch-x402 | $0.5 | `POST /dispatch` | `dispatch` | `curl -i -X POST 'https://dispatch-x402.fly.dev/dispatch' -H 'Content-Type: application/json' -d '{"intent":"summarize a document into bullets"}'` |
| dispute-forge-x402 | $0.01 | `POST /api/dispute-pack` | `dispute-forge` | `curl -i -X POST 'https://dispute-forge-x402.fly.dev/api/dispute-pack' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |
| escrow-x402 | $0.005 | `POST /api/escrow/create` | `escrow` | `curl -i -X POST 'https://escrow-x402.fly.dev/api/escrow/create' -H 'Content-Type: application/json' -d '{"amount":0.01,"currency":"USDC","counterparty":"agent@example.com"}'` |
| nanobanana-x402 | $0.01 | `POST /api/generate-image` | `nanobanana` | `curl -i -X POST 'https://nanobanana-x402.fly.dev/api/generate-image' -H 'Content-Type: application/json' -d '{"prompt":"A product hero image for a Telegram breach monitor, neon terminal style","aspectRatio":"16:9"}'` |
| nft-alpha-x402 | $0.005 | `POST /api/nft-signal` | `nft-alpha` | `curl -i -X POST 'https://nft-alpha-x402.fly.dev/api/nft-signal' -H 'Content-Type: application/json' -d '{"collection":"base:0x0000000000000000000000000000000000000000"}'` |
| rae-fleet-router | $0.01 | `POST /api/tip` | `rae-fleet-router__tip` | `curl -i -X POST 'https://rae-fleet-router.fly.dev/api/tip' -H 'Content-Type: application/json' -d '{"amount":0.01}'` |
| royal-ruby-x402 | $0.001 | `GET /api/ping` | `royal-ruby__ping` | `curl -i 'https://royal-ruby-x402.fly.dev/api/ping'` |
| suprapack-x402 | $0.005 | `POST /api/find-skill` | `suprapack` | `curl -i -X POST 'https://suprapack-x402.fly.dev/api/find-skill' -H 'Content-Type: application/json' -d '{"query":"find a skill for summarizing documents"}'` |
| tradingagents-x402 | $0.05 | `POST /api/analyze-arbitrage` | `tradingagents__analyze-arbitrage` | `curl -i -X POST 'https://tradingagents-x402.fly.dev/api/analyze-arbitrage' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |
| vault-pro-x402 | $0.05 | `POST /api/scaffold-project` | `vault-pro` | `curl -i -X POST 'https://vault-pro-x402.fly.dev/api/scaffold-project' -H 'Content-Type: application/json' -d '{"input":"sample"}'` |

## Caveats (TRUTH)

- `contract-eye-x402` is **absent** from this catalog despite being live and canonical (verified 2026-11-25; Library artifacts `e42ff3a8`, `b36a808e`). Reach it directly at `https://contract-eye-x402.fly.dev/api/analyze-contract`; see cookbook recipe 31 (`catalog-parity`) for the reproducible audit.
- Catalog lists `briefsnap-x402` and `tradingagents-x402` as `ok`; the cookbook README marks both RETIRED 2026-11-24 (scale-to-zero, reversible). Live probe is authoritative before spending.
- Six catalog items carry a null `payTo` (1 unreachable power-pack route + 5 royal-ruby free/wrong-network routes). These are free/advertising surfaces, not canonical paid routes — do not send funds to them.
- Power-pack host is marked `unreachable` by the catalog; no positive-price canonical route was selected for it.

