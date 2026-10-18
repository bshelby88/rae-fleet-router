# DNS Repointing Plan — 2026-10-08

## Objective

Point all 21 old x402 `.fly.dev` subdomains to the 3 consolidated walls (`x402-core`, `x402-enterprise`, `x402-private`) via Fly's `fly domains add` command.

## Preconditions (verified)

- All 21 old subdomains resolve via DNS (nslookup confirms A records exist)
- All 3 new walls return HTTP 404 (healthy, responding)
- Each old subdomain already has a `.fly.dev` SSL certificate

## Target Mapping

| Tier      | Fly App Name        | # of Old Domains |
|-----------|---------------------|-----------------|
| core      | `x402-core`         | 10              |
| premium   | `x402-enterprise`   | 7               |
| legacy    | `x402-private`      | 4               |

## Execution Commands

### x402-core (10 domains)

```bash
fly domains add lingua-x402.fly.dev --app x402-core
fly domains add sentry-forge-x402.fly.dev --app x402-core
fly domains add contract-eye-x402.fly.dev --app x402-core
fly domains add tradingagents-x402.fly.dev --app x402-core
fly domains add royal-ruby-x402.fly.dev --app x402-core
fly domains add nanobanana-x402.fly.dev --app x402-core
fly domains add nft-alpha-x402.fly.dev --app x402-core
fly domains add suprapack-x402.fly.dev --app x402-core
fly domains add vault-pro-x402.fly.dev --app x402-core
fly domains add dispatch-x402.fly.dev --app x402-core
```

### x402-enterprise (7 domains)

```bash
fly domains add opensea-data-x402.fly.dev --app x402-enterprise
fly domains add rae-a2a-adapter-x402.fly.dev --app x402-enterprise
fly domains add raen-portfolio-x402.fly.dev --app x402-enterprise
fly domains add x402-analytics.fly.dev --app x402-enterprise
fly domains add x402-glm.fly.dev --app x402-enterprise
fly domains add royal-gateway-x402.fly.dev --app x402-enterprise
fly domains add dispute-forge-x402.fly.dev --app x402-enterprise
```

### x402-private (4 domains)

```bash
fly domains add royal-feel-x402.fly.dev --app x402-private
fly domains add briefsnap-x402.fly.dev --app x402-private
fly domains add escrow-x402.fly.dev --app x402-private
fly domains add power-pack-x402.fly.dev --app x402-private
```

## Verification

After execution, for each mapped domain run:

```bash
nslookup <old-domain>.fly.dev
```

Each should return the same IP as the target wall.

## Post-Repoint Cleanup

Once DNS propagation is complete, the old standalone x402 apps can be destroyed:

```bash
# Old x402-core hosts
fly apps destroy lingua-x402 --yes
fly apps destroy sentry-forge-x402 --yes
fly apps destroy contract-eye-x402 --yes
fly apps destroy tradingagents-x402 --yes
fly apps destroy royal-ruby-x402 --yes
fly apps destroy nanobanana-x402 --yes
fly apps destroy nft-alpha-x402 --yes
fly apps destroy suprapack-x402 --yes
fly apps destroy vault-pro-x402 --yes
fly apps destroy dispatch-x402 --yes

# Old x402-premium hosts
fly apps destroy opensea-data-x402 --yes
fly apps destroy rae-a2a-adapter-x402 --yes
fly apps destroy raen-portfolio-x402 --yes
fly apps destroy x402-analytics --yes
fly apps destroy x402-glm --yes
fly apps destroy royal-gateway-x402 --yes
fly apps destroy dispute-forge-x402 --yes

# Old x402-legacy hosts
fly apps destroy royal-feel-x402 --yes
fly apps destroy briefsnap-x402 --yes
fly apps destroy escrow-x402 --yes
fly apps destroy power-pack-x402 --yes
```

---

_Generated from fleet-manifest.json v4 — consolidation_backlog mapping_