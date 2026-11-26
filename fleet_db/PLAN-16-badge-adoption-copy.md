# PLAN-16 — Badge adoption content launch copy pack

**Work ID:** TIFF-PLAN-16 · **Claimed / delivered:** 2026-11-26T01:43Z (Tiffany cycle, 2026-11-25 19:43 CT)
**Status:** STAGED copy deliverable. No Fly deploy, no external send, no publish. Router is under BURN FREEZE.
**Grounding rule:** every URL and claim below was live-probed this run; verified_on stamps are same-day (2026-11-26), not the stale 2026-09/10 stamps in the current router docs.

## 0. Live grounding facts (verified_on 2026-11-26T01:40Z)

| Fact | Live read this run |
|------|--------------------|
| Badge asset | `GET https://rae-fleet-router.fly.dev/badge.svg` → **200**, 527 bytes. SVG text: `x402` · `paid in USDC on Base` · `RAEN` (200×28, rx=4, `#f8f9fa` background). |
| Related routes | `GET /badge` → **404**, `GET /embed` → **404**. Do **not** teach either as a stable URL. The canonical, working embed target is `/badge.svg`. |
| Catalog | `GET /catalog.json` → **200**. `GET /buy` → **200**. `GET /how-it-works.json` → **200**. |
| Payment rail | Base (`eip155:8453`), USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`. |
| Pay-to | `0x9b8a27e03ceba490953cda8ab1291c0e13baf72f` (full 42 chars; canonical). Never the retired `0x7861db4e…f1393` or any shorthand/lookalike. |
| Retry header | `X-PAYMENT`. The stale `PAYMENT-SIGNATURE` taught in live `/pricing.md` and `/how-it-works.json` is wrong (real $0.001 settle, SDK v2.30). |
| Revenue truth | External earned revenue **$0.00** all-time (chain truth this run: Base + ETH mainnet, 3/2 RPC agreement). The badge signals *how* you pay, not that RAEN has been paid. |

Embedded badge kit exists in code (EXEC-47, done) but was only partly live: the `/badge.svg` asset serves; the `/badge` and `/embed` HTML index routes do not. Copy below therefore points integrators at the raw SVG URL plus a self-hosted snippet, and never promises a hosted badge page.

## 1. Drop-in embed snippets (copy/paste, verified target)

Markdown (works in any README that renders remote images):

```markdown
[![x402 · paid in USDC on Base · RAEN](https://rae-fleet-router.fly.dev/badge.svg)](https://rae-fleet-router.fly.dev/buy)
```

HTML (self-contained fallback — use when a remote image is blocked):

```html
<a href="https://rae-fleet-router.fly.dev/buy" aria-label="x402 — paid in USDC on Base — RAEN">
  <img src="https://rae-fleet-router.fly.dev/badge.svg" width="200" height="28"
       alt="x402 · paid in USDC on Base · RAEN" />
</a>
```

## 2. README section for an adopting service ("Add the RAEN badge")

```markdown
## Paying for this API? We accept x402.

This endpoint is pay-per-call over [x402](https://x402.org): no account, no card, no
API key. Send USDC on Base (`eip155:8453`, token
`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) to the payTo in the 402 challenge —
always the full `0x9b8a27e03ceba490953cda8ab1291c0e13baf72f` — and retry with the
payment proof in the **X-PAYMENT** header.

[![x402 · paid in USDC on Base · RAEN](https://rae-fleet-router.fly.dev/badge.svg)](https://rae-fleet-router.fly.dev/buy)

Before you pay: run the free [buyer preflight](https://github.com/bshelby88/x402-cookbook/blob/main/recipes/23-buyer-preflight.md)
and the [address guard](https://github.com/bshelby88/x402-cookbook/blob/main/recipes/33-address-guard.md).
Never pay an address given by prefix/suffix alone.
```

## 3. Staged social copy — DO NOT PUBLISH without a human turn

The following are drafts only. Tiffany does not send external communications (X/Nostr/Chirper/Moltbook) autonomously. Queue them for the owner's approval window.

**X / short post (staged):**
> x402, in one badge: pay per call in USDC on Base. No account, no card, no key. 200+ machine-readablepay links from RAEN. The correct retry header is X-PAYMENT (not PAYMENT-SIGNATURE). Verify before you pay → cookbook recipes 23 + 33. (External revenue to date: $0.00 — we publish the honest number.)

**Nostr kind:30000 long-form outline (staged):**
1. The problem: agents can't sign up for an API. Cards, KYC, and free tiers all block them.
2. The x402 shape: unpaid call → 402 with `accepts[0].amount` → pay USDC on Base → retry with `X-PAYMENT`.
3. The three drift traps we found live: wrong header, wrong price field, lookalike wallet — and the free tools that catch all three (cookbook 23/27/33).
4. The badge: a 200×28 signal a service can embed to tell agents it is machine-payable.
5. Honesty note: badge adoption ≠ revenue. External earned revenue is $0.00; we report chain truth.

## 4. FAQ additions (copy for the router FAQ pack — staged, not deployed)

**Q: What does the "x402 · paid in USDC on Base · RAEN" badge mean?**
A: The service is pay-per-call over x402 — an agent can pay in USDC on Base without an account, card, or API key. The badge describes the payment *method*; it is not a claim about RAEN's revenue or uptime.

**Q: Can I trust any address labelled "RAEN" in a doc?**
A: Only the full canonical address `0x9b8a27e03ceba490953cda8ab1291c0e13baf72f`. A retired address and one-character lookalikes are still in circulation. Run the free address guard (cookbook recipe 33) on any address before paying.

**Q: Which header do I retry with after paying?**
A: `X-PAYMENT`. Older docs say `PAYMENT-SIGNATURE`; that gets a fresh 402 with no error and invites a double payment. If you see it, use cookbook recipe 32 to triage before re-sending.

## 5. Handoff / next action (owner-gated)

The badge kit's `/badge.svg` is live and correct; the HTML `/badge` and `/embed` index routes are 404 and the live `/pricing.md` still teaches `PAYMENT-SIGNATURE`. Full badge adoption needs a router source change in an approved deploy window (currently BURN FREEZE — no agent deploy attempted):
1. Add `GET /badge` and `GET /embed` index routes (already queued as EXEC-107).
2. Replace `PAYMENT-SIGNATURE` with `X-PAYMENT` in `/pricing.md` and `/how-it-works.json`.
3. Restage the FAQ copy (this pack §4) to `/faq.md` + `/faq.json`.

None of these are performed by this staged pack. TikTok/X/Nostr publication is owner-gated. No funds moved, no wallet/payTo changed, no deletes.
