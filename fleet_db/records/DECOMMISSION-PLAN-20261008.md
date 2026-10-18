# Decommission Plan — 2026-10-08

## Objective

Destroy or suspend-to-zero all 40 fleet apps that are in `suspended`, `pending`, or `cleanup` status. This removes orphaned infrastructure and completes the fleet consolidation to the target of 22 deployed apps.

## Source

fleet-manifest.json v4 — `fleet_service_catalog` entries with status `suspended` or `pending`.

## Phase 0: Pre-checks

For each app, verify it is safe to destroy:

```bash
fly apps list --name "<app-name>"
fly status --app <app-name>          # confirm no active machines
fly machines list --app <app-name>   # confirm zero machines
```

## Phase 1: Scale suspended apps to zero (safety net)

Run for all 35 suspended apps to ensure no running machines:

```bash
# Cleanup-tier apps
fly scale count 0 --app scrubber-cron
fly scale count 0 --app bshelby-miner
fly scale count 0 --app fleet-litellm
fly scale count 0 --app fleet-monitoring
fly scale count 0 --app fly-builder-lingering-snowflake-8122
fly scale count 0 --app franklin-agent
fly scale count 0 --app juanterry-agent
fly scale count 0 --app mining-marketplace
fly scale count 0 --app openrouter-multimodal
fly scale count 0 --app rae-kernel-staging
fly scale count 0 --app rae-tipjar
fly scale count 0 --app raen-qdrant
fly scale count 0 --app raen-qdrant-sunlit-echo-3686
fly scale count 0 --app royal-ruby-live
fly scale count 0 --app royal-ruby-live-agfxnw
fly scale count 0 --app royal-sailing
fly scale count 0 --app staci-monitor
fly scale count 0 --app staci-nft-oracle
fly scale count 0 --app tiffany-agent
fly scale count 0 --app tiffany-miner
fly scale count 0 --app tiffany-poller
fly scale count 0 --app royal-agentic
fly scale count 0 --app royal-agentic-bk7-2q
fly scale count 0 --app royal-agentic-e8ur-g
fly scale count 0 --app royal-agentic-ft-q8g
fly scale count 0 --app royal-agentic-i0bimq
fly scale count 0 --app royal-agentic-l3p-aa
fly scale count 0 --app royal-agentic-nxcbeg

# Suspended x402-infra apps (DNS-repointed x402-legacy candidates)
fly scale count 0 --app briefsnap-x402
fly scale count 0 --app dispatch-x402-7q2mqg
fly scale count 0 --app escrow-x402
fly scale count 0 --app power-pack-x402
fly scale count 0 --app royal-gateway-x402-0c2o9g
fly scale count 0 --app royal-feel-x402
fly scale count 0 --app royal-gateway-x402
```

## Phase 2: Destroy all suspended/pending/cleanup apps

### Cleanup-tier — Suspended (27 apps)

```bash
fly apps destroy scrubber-cron --yes
fly apps destroy bshelby-miner --yes
fly apps destroy fleet-litellm --yes
fly apps destroy fleet-monitoring --yes
fly apps destroy fly-builder-lingering-snowflake-8122 --yes
fly apps destroy franklin-agent --yes
fly apps destroy juanterry-agent --yes
fly apps destroy mining-marketplace --yes
fly apps destroy openrouter-multimodal --yes
fly apps destroy rae-kernel-staging --yes
fly apps destroy rae-tipjar --yes
fly apps destroy raen-qdrant --yes
fly apps destroy raen-qdrant-sunlit-echo-3686 --yes
fly apps destroy royal-ruby-live --yes
fly apps destroy royal-ruby-live-agfxnw --yes
fly apps destroy royal-sailing --yes
fly apps destroy staci-monitor --yes
fly apps destroy staci-nft-oracle --yes
fly apps destroy tiffany-agent --yes
fly apps destroy tiffany-miner --yes
fly apps destroy tiffany-poller --yes
fly apps destroy royal-agentic --yes
fly apps destroy royal-agentic-bk7-2q --yes
fly apps destroy royal-agentic-e8ur-g --yes
fly apps destroy royal-agentic-ft-q8g --yes
fly apps destroy royal-agentic-i0bimq --yes
fly apps destroy royal-agentic-l3p-aa --yes
fly apps destroy royal-agentic-nxcbeg --yes
```

### x402-infra — Suspended (7 apps, DNS-repointed first)

```bash
fly apps destroy briefsnap-x402 --yes
fly apps destroy dispatch-x402-7q2mqg --yes
fly apps destroy escrow-x402 --yes
fly apps destroy power-pack-x402 --yes
fly apps destroy royal-gateway-x402-0c2o9g --yes
fly apps destroy royal-feel-x402 --yes
fly apps destroy royal-gateway-x402 --yes
```

### Cleanup-tier — Pending (5 apps, never fully deployed)

```bash
fly apps destroy royal-agentic-enterprises --yes
fly apps destroy royal-agentic-enterprises-i9pl2a --yes
fly apps destroy royal-agentic-enterprises-iaucug --yes
fly apps destroy royal-ruby --yes
fly apps destroy tmp-digest-probe-2 --yes
```

### Core — Suspended (1 app)

```bash
fly apps destroy scrubber-cron --yes
```

## Summary Table

| Category               | Count | Action             | Notes                                    |
|------------------------|-------|--------------------|------------------------------------------|
| Cleanup suspended      | 27    | `fly apps destroy` | Orphaned experiment/staging/legacy apps  |
| x402-infra suspended   | 7     | `fly apps destroy` | Wait for DNS repoint to propagate first  |
| Cleanup pending        | 5     | `fly apps destroy` | Never deployed, safe to remove           |
| Core suspended         | 1     | `fly apps destroy` | scrubber-cron                             |
| **Total**              | **40**|                    |                                          |

## Post-Decommission Verification

```bash
fly apps list 2>&1 | grep -c "x402"
```

Target: 22 deployed apps remaining after cleanup.

---

_Generated from fleet-manifest.json v4 — 38 deployed + 35 suspended + 5 pending = 78 catalog entries_