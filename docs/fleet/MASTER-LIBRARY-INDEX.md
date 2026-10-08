# MASTER LIBRARY INDEX — OneDrive & Desktop
**Created:** 2026-09-26 (CDT) · **Maintained by:** Hermes  
**Purpose:** Single source of truth for every file and directory in this workspace.

---

## How this is organized

### Desktop loose files → sorted into folders:
| Folder | Contents | Count |
|--------|----------|-------|
| `RAEN-Fleet/docs/` | Fleet documentation, assessments, audits, catalogs, money library index | 38 |
| `RAEN-Fleet/scripts/` | Python/Shell/JS scripts (heartbeat, monitor, provenance, rescue, deploy) | 15 |
| `RAEN-Fleet/x402/` | x402 registration, PR submissions, config templates | 10 |
| `RAEN-Fleet/staci/` | Staci deployment specs and config | 5 |
| `RAEN-Fleet/opensea/` | OpenSea API docs and integration references | 4 |
| `config/` | App config files, manifests, state files | 22 |
| `~/.secrets/credentials/` | API keys, OAuth secrets, password exports (**LOCAL ONLY, not cloud-synced**) | 10 |
| `~/.secrets/crypto-wallets/` | Wallet .dat/.json/.txn/.csv, bitcoin snapshots, electrum data (**LOCAL ONLY**) | 47 |
| `_ARCHIVE/personal-docs/` | Shelby personal docs, resumes, credit repair, photos | 15 |
| `_ARCHIVE/gmail-exports/` | Gmail PDF exports and email attachments | 7 |
| `_ARCHIVE/installs/` | Software installers (.deb, .AppImage, binaries) | 6 |
| `_ARCHIVE/npm-artifacts/` | Standalone JS files, bundle licenses | 3 |
| `_ARCHIVE/reference/` | General reference docs, READMEs, INDEX files, misc text | 18 |

**Total loose files sorted: 199** (zero loose files remain on Desktop root)

### Desktop numbered folders (skill/agent library — already organized):
| Folder | Purpose |
|--------|---------|
| `00-Start/` | Dashboard, README |
| `00-AI-Agents/` | AI agent skill definitions (30 files) |
| `01-Automation/` | Automation skills (30 files) |
| `02-Dev/` | Development skills (30 files) |
| `03-Marketing/` | Marketing skills (30 files) |
| `04-Design/` | Design skills (30 files) |
| `05-Data/` | Data skills (20 files) |
| `06-Research/` | Research skills (4 files) |
| `07-Writing/` | Writing skills (1 file) |
| `09-Finance/` | Finance skills (29 files) |
| `10-Security/` | Security skills (2 files) |
| `10-Skills/` | Skills index |
| `13-Misc/` | Misc skills (7 files) |
| `20-Agents/` | Agent role definitions (5 files) |
| `30-Daily/` | Daily operations templates (4 files) |
| `40-Projects/` | Project index |
| `50-Workflows/` | Workflow patterns (3 files) |
| `60-Knowledge/` | Knowledge base (3 items) |
| `70-Templates/` | Agent & project templates (3 files) |

### OneDrive root numbered agent folders (already organized):
| Folder | Purpose |
|--------|---------|
| `01-web-research-agent/` | Web research agent |
| `02-code-review-agent/` | Code review agent |
| `03-pdf-qa-agent/` | PDF QA agent |
| `04-sql-query-agent/` | SQL query agent |
| `05-email-drafting-agent/` | Email drafting agent |
| `06-news-summarizer-agent/` | News summarizer agent |
| `07-github-issue-triager/` | GitHub issue triager agent |
| `08-data-analysis-agent/` | Data analysis agent |
| `09-resume-parser-agent/` | Resume parser agent |
| `10-meeting-notes-agent/` | Meeting notes agent |
| `11-stock-research-agent/` | Stock research agent |
| `12-travel-planner-agent/` | Travel planner agent |
| `13-customer-support-agent/` | Customer support agent |
| `14-social-media-agent/` | Social media agent |
| `15-unit-test-generator/` | Unit test generator |
| `16-documentation-writer/` | Documentation writer |
| `17-recipe-agent/` | Recipe agent |
| `18-job-application-agent/` | Job application agent |
| `19-competitive-analysis-agent/` | Competitive analysis agent |
| `20-multi-agent-debate/` | Multi-agent debate |

---

## OneDrive Root Directory Catalog (421 dirs)

### x402 Projects (34 dirs)
_The x402 protocol/service fleet — all projects with "x402" in their name._

**Active services / kernels:**
- `x402-kernel/` — Core x402 kernel service
- `x402-pack/` — x402 pack builder
- `x402-pack-master/` — Master pack config
- `x402-pack-template/` — Pack template
- `x402-glm/` — GLM integration for x402
- `x402-ollama/` — Ollama integration for x402
- `x402-nanobanana/` — Nanobanana x402 service
- `x402-bridgette/` — Bridgette x402 service
- `x402-crypto-price-tracker/` — Crypto price tracker service
- `x402-revenue-dojo-api/` — Revenue dojo API

**Fleet integrations:**
- `awesome-x402/` — Awesome x402 list (PR target)
- `awesome-x402-merit/` — Merit variant
- `dispatch-x402/` — Dispatch x402
- `dispatch-x402-pr4/` — PR4 branch
- `dispatch-x402-pr4-final-review/` — PR4 final review
- `nanobanana-x402/` — Nanobanana integration
- `nanobanana-x402-billing-fix/` — Billing fix
- `nft-alpha-x402/` — NFT alpha x402
- `power-pack-x402/` — Power pack x402
- `power-pack-x402-block-fix/` — Block fix
- `power-pack-x402-hardening/` — Hardening
- `royal-ruby-x402/` — Royal Ruby x402
- `sentry-forge-x402-hardening/` — Sentry forge hardening
- `sentry-forge-x402-pr2/` — Sentry forge PR2
- `tiffany-x402-work/` — Tiffany x402 work
- `tradingagents-x402/` — Trading agents x402
- `vault-pro-x402/` — Vault Pro x402
- `vault-pro-x402-per-request-billing-copy/` — Per-request billing copy

**Audits:**
- `audit-nanobanana-x402/` — Nanobanana audit
- `audit-tradingagents-x402/` — Trading agents audit
- `audit-x402-portfolio/` — Portfolio audit
- `x402-audit/` — General x402 audit
- `x402-postmerge-audit/` — Post-merge audit

---

### RAEN Fleet Operations (39 dirs)
_The RAEN/x402 revenue fleet — coordination layer, treasury, staci, and campaigns._

**Core fleet infrastructure:**
- `C:/Users/jaded/AppData/Local/hermes/Fleet-History-Chronicle/` — Canonical fleet history records (148+ files in home root, 163+ in AppData)
- `fleet-monitoring/` — Fleet monitoring service
- `fleet_model_registry/` — Model registry
- `fleet_pipeline/` — Fleet pipeline
- `nimbus-agent/` — Nimbus agent (primary fleet deploy target)
- `nimbus-aggregate-remediation-20260826/` — Remediation from 2026-08-26
- `nimbus-pr28-adversarial/` — PR28 adversarial testing
- `bean/` — Bean service
- `chronicle/` — Chronicle service
- `treasury/` — Treasury service

**Staci (fleet deployment/CI):**
- `staci/` — Main staci deployment
- `staci-clean-workdir/` — Clean working dir
- `staci-dr-marigny-follow-up/` — Dr. Marigny follow-up
- `staci-rebuild/` — Rebuild branch
- `staci-repo-workdir/` — Repo working dir
- `staci-work/` — Work branch

**Royal Ruby:**
- `Royal-Ruby-2.0/` — Royal Ruby 2.0 project
- `Royal-Ruby-Brand-Assets/` — Brand assets
- `Royal-Ruby-Workspace/` — Workspace
- `royal-ruby-live-pr2/` — Live PR2

**Vault Pro:**
- `vault-pro-block/` — Vault Pro block
- `vault-pro-landing/` — Vault Pro landing page
- `vault-pro-pr4-bazaar/` — PR4 bazaar

**Suprapack:**
- `suprapack/` — Suprapack project
- `suprapack-engine/` — Suprapack engine
- `suprapack-landing/` — Suprapack landing page

**Tiffany:**
- `tiffany/` — Tiffany project
- `tiffany-agent/` — Tiffany agent
- `tiffany-growth-investigation/` — Growth investigation

**Other fleet ops:**
- `OBLITERATUS/` — Obliteratus service
- `Dispute-Forge/` — Dispute forge
- `autonomous-pitching-engine/` — Pitching engine
- `pitching-engine/` — Pitching engine (older)
- `claude-code-power-pack/` — Claude Code power pack
- `eligibility-engine/` — Eligibility engine
- `kanban/` — Kanban board
- `power-pack-landing/` — Power pack landing
- `revenue/` — Revenue tracking
- `_quarantine_20260711_nimbus-git-corrupt/` — Quarantined corrupt git repo

---

### Agent Projects (21 dirs)
_AI agent projects and frameworks._

- `Agent-Reach/` — Agent Reach tool
- `AgenticVault/` — Agentic vault
- `Linkedin_Agent_Tool/` — LinkedIn agent
- `_agentkits-output/` — AgentKits output
- `agent-base/` — Agent base library
- `agent-sdk-dev/` — Agent SDK development
- `agent-skills-library-main/` — Agent skills library
- `agent-sync/` — Agent sync
- `agent-vault-backup/` — Agent vault backup
- `agentic/` — Agentic framework
- `agents/` — Agents collection
- `erica-agent/` — Erica agent
- `erica-agent-source/` — Erica agent source
- `hermes-agent/` — Hermes Agent (this app)
- `hermes-agent-self-evolution/` — Hermes self-evolution
- `https-proxy-agent/` — HTTPS proxy agent
- `kip-agent/` — Kip agent
- `multiAgentic/` — Multi-agentic framework (Airtable, repos)
- `open_agent_project/` — Open agent project
- `rae-proxy-agent/` — RAE proxy agent
- `royal-agentic-enterprises/` — Royal agentic enterprises

---

### Skill Libraries (15 dirs)
_Skill/agent library repositories._

- `awesome-ai-startups/` — AI startups list
- `awesome-ai-startups-main/` — Main branch
- `awesome-claude-code/` — Claude Code skills
- `awesome-claude-skills-master/` — Claude skills master
- `awesome-openclaw-skills-main/` — OpenClaw skills
- `marketingskills/` — Marketing skills
- `mcp-marketplace/` — MCP marketplace
- `mirror-opencode/` — OpenCode mirror
- `openclaw-marketing-skills/` — OpenClaw marketing
- `opencode/` — OpenCode
- `opencode-deep-memory/` — OpenCode deep memory
- `opencode-dev-kit/` — OpenCode dev kit
- `opencode-mirror/` — OpenCode mirror
- `opencode-verify/` — OpenCode verify
- `skill-bundle/` — Skill bundle

---

### Obsidian (7 dirs)
- `Obsidian Vault/` — Main vault
- `kepano-obsidian-main/` — Kepano's Obsidian
- `obsidian/` — Obsidian config
- `obsidian-api/` — Obsidian API
- `obsidian-clipper/` — Clipper plugin
- `obsidian-releases/` — Releases
- `obsidian-sample-plugin/` — Sample plugin

---

### VS Code Extensions (16 dirs)
- `golang.go-0.54.0-universal/` — Go extension
- `google.geminicodeassist-2.86.0-universal/` — Gemini Code Assist
- `googlecloudtools.cloudcode-2.40.0-universal/` — Cloud Code
- `googlecloudtools.datacloud-0.4.1-universal/` — Data Cloud
- `llvm-vs-code-extensions.vscode-langd-0.6.0-universal/` — Clangd
- `ms-azuretools.vscode-containers-2.4.5-universal/` — Containers
- `ms-azuretools.vscode-docker-2.0.0-universal/` — Docker
- `ms-kubernetes-tools.vscode-kubernetes-tools-1.3.29-universal/` — Kubernetes
- `ms-python.debugpy-2026.6.0-win32-x64/` — Python debugger
- `ms-python.python-2026.4.0-universal/` — Python
- `ms-python.vscode-python-envs-1.20.1-universal/` — Python envs
- `ms-toolsai.jupyter-2025.9.1-universal/` — Jupyter
- `ms-toolsai.jupyter-keymap-1.1.2-universal/` — Jupyter keymap
- `ms-toolsai.jupyter-renderers-1.3.0-universal/` — Jupyter renderers
- `ms-toolsai.vscode-jupyter-cell-tags-0.1.9-universal/` — Cell tags
- `ms-toolsai.vscode-jupyter-slideshow-0.1.6-universal/` — Slideshow

---

### NPM Dependencies (122 dirs)
_JavaScript/TypeScript dependency packages scattered in OneDrive root._

These are node_modules-style packages that should be inside `node_modules/` but were extracted/installed at the root level. Key groups:
- **Express stack:** `express`, `body-parser`, `serve-static`, `send`, `finalhandler`, `router`, `path-to-regexp`, `content-disposition`, `content-type`, `cookie`, `cookie-signature`, `debug`, `depd`, `encodeurl`, `escape-html`, `etag`, `fresh`, `forwarded`, `qs`, `range-parser`, `statuses`, `vary`, `merge-descriptors`, `proxy-addr`, `accepts`, `negotiator`, `mime-db`, `mime-types`, `http-errors`, `inherits`, `depd`
- **Crypto/Web3:** `@noble`, `@scure`, `@x402`, `@adraffy`, `@protobufjs`, `abitype`, `viem`, `ox`, `tweetnacl`, `jose`, `jwa`, `jws`, `ecdsa-sig-formatter`, `json-bigint`, `bignumber.js`, `base64-js`, `buffer-equal-constant-time`
- **Google SDK:** `@google`, `gaxios`, `gcp-metadata`, `google-auth-library`, `google-logging-utils`
- **Utils:** `debug`, `ms`, `object-inspect`, `qs`, `fast-deep-equal`, `fast-uri`, `eventemitter3`, `extend`, `long`, `iconv-lite`
- **Build:** `node_modules/`, `node-domexception`, `node-fetch`, `fetch-blob`, `formdata-polyfill`, `undici-types`

---

### Development Projects (85 dirs)
_Misc development projects, tools, and workspaces._

Key items:
- `bitcoin/`, `bitcoin-30.2/` — Bitcoin node/tools
- `ollama/`, `ollama-python/` — Local LLM runtime
- `llama-cookbook/`, `llama-models/` — Llama model resources
- `penpot/`, `penpot-ai-kit/`, `penpot-cloud-images/`, `penpot-export/`, `penpot-files/` — Penpot design suite
- `n8n-Workflows/`, `n8n-mcp-czlonkowski-main/` — N8N workflow automation
- `PurpleLlama/`, `CybersecurityBenchmarks/` — Security benchmarking
- `SWE-ReX/` — SWE benchmark tool
- `adk-python/` — Agent Development Kit (Python)
- `go/` — Go workspace
- `fly-extractions/`, `flyctl_0.4.64_Windows_x86_64/` — Fly.io tools
- `meta.pyrefly-1.0.0-win32-x64/` — Pyrefly type checker
- `antigravity-brain-sync/` — Antigravity sync
- `contracts/` — Smart contracts
- `payments/` — Payments module
- `kanban/`, `roadmap/` — Project management
- `models.dev/` — Models.dev reference

---

### Archives & Audits (4 dirs)
- `archive/` — General archive
- `audit-2026-07-07/` — July 7 audit snapshot
- `erica-audit-20260826/` — Erica audit
- `franklin_audit/` — Franklin audit

---

### Personal & Media (8 dirs)
- `Documents/` — Personal documents
- `Music/` — Music files
- `Pictures/` — Pictures
- `Videos/` — Videos
- `Scans/` — Document scans
- `Saved from Chrome/` — Chrome saved pages
- `Telegram/` — Telegram files
- `Personal ID/` — Personal ID documents

---

### Other (31 dirs)
_Uncategorized — see individual contents for details._

Key items: `Airtable/`, `GitHub/`, `VAULT-PRIVATE/`, `vault/`, `nft/`, `docs/`, `grafana-dashboard/`, `hermes-work/`, `assets/`, `images/`, `composer-images/`, `hermes-work/`, `nanobanana-docs/`, `opentui/`, `oumi-evals/`, `rescue-artifacts/`, `verify_Employment/`

---

## SECURITY STATUS — Remediated 2026-09-26 by Franklin

1. **Credentials and crypto-wallet files have been moved** from OneDrive-synced `_ARCHIVE/` folders to **local-only** `C:/Users/Dock/.secrets/credentials/` (10 files) and `C:/Users/Dock/.secrets/crypto-wallets/` (47 files). The OneDrive folders have been removed. See `SECURITY-REMEDIATION-REPORT.md` for the full inventory.
2. **Remaining action items (human):**
   - Sweep all Bitcoin/Electrum wallet balances to new wallets (39 HIGH-severity wallet files were cloud-synced before remediation)
   - Rotate all API keys, PATs, and OAuth secrets found in the credential files
   - Rotate the Microsoft Edge browser password CSV
   - Rotate the Google OAuth client secret for project 842013444926
   - Purge OneDrive recycle bin / version history for deleted `_ARCHIVE/credentials/` and `_ARCHIVE/crypto-wallets/` folders
3. **`~/.secrets/` is local-only** — not inside OneDrive, not cloud-synced. Restrict Windows ACL to the owning user.

---

## How to maintain this index

- **Adding files:** Place new files in the appropriate category folder. Add entries here.
- **Desktop root:** Should always be **zero loose files** — everything goes in a category folder.
- **Numbered folders:** These are the skill/agent library. Don't dump loose files in them; add new skills as `.md` files.
- **OneDrive root:** 421 directories — too many. Consolidate related project forks/branches into a single `_ARCHIVE/` or `repos/` when safe.
- **Update this file** whenever you add/remove/move significant items.

---

## CREDENTIAL ROTATION STATUS — 2026-10-06

**Rotation completed:** 2026-10-06

| Item | Status |
|------|--------|
| Fly.io apps updated | 15/15 |
| Hermes .env | Updated |
| Hermes config.yaml | Updated |
| Library sweep | Complete — old credentials only in historical files |
| USDC_RECEIVER | ❌ Not rotated — no new values in source file |
| OPERATIONAL_WALLET | ❌ Not rotated — no new values in source file |
| btc-usdc-converter health | 0/1 — may be initializing |

**Notes:**
- 2 credentials (USDC_RECEIVER, OPERATIONAL_WALLET) were not rotated because no new values were available in the source file.
- btc-usdc-converter health check returned 0/1; service may still be initializing.
- No actual credential values are recorded in this index — only rotation status metadata.
