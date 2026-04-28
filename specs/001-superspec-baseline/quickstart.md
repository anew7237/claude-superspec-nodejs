# Quickstart: 採用 SuperSpec Baseline 的第一條路徑

**Audience**: 新 adopter(個人或團隊)在 macOS Apple Silicon 或 WSL2 Ubuntu 上首次採用此 template
**Time budget**: 首次 ≤ 15 min(SC-001),第一個 feature ≤ 1 hour(SC-007)

> 這份 walkthrough 把 baseline spec 的 user stories(P1 onboarding + P1 SDD pipeline)
> 落到具體可跑的步驟。adopter 完成這個流程,即驗證了 SC-001 與 SC-007。

## Step 0 — 前置條件

| 工具 | macOS Apple Silicon | WSL2 Ubuntu |
|---|---|---|
| Docker | Docker Desktop for Mac(Settings → 開啟 Rosetta amd64 emulation;≥ 8GB RAM、4 CPU) | Docker Desktop for Windows(Settings → Resources → WSL Integration → 勾選 Ubuntu) |
| IDE | VS Code + Dev Containers extension | 同左 |
| Git | host 預裝 | host 預裝 |
| Claude Code OAuth | host 端跑 `claude` 完成 login(Pro / Max / Team / Enterprise 訂閱) | 同左 |

> **WSL 重要**:repo 必須 clone 在 WSL 檔案系統(`/home/<you>/`),**不要**放
> `/mnt/c/`。跨檔案系統 IO 慢 5-10 倍,且 docker compose bind mount 會踩錯。

## Step 1 — Clone 與初次開啟

```bash
# host shell
git clone <your-repo-url> myapp
cd myapp
cp .env.example .env  # 視需要編輯
```

VS Code 開資料夾,右下角會跳「Reopen in Container」。

## Step 2 — 等待容器 build(首次 ≤ 15 min)

VS Code 跑:

1. Docker build 套用 `.devcontainer/Dockerfile` + features(claude-code、DooD、node 22、git、gh)。
2. `postCreateCommand=bash .devcontainer/post-create.sh`:
   - corepack 啟用 pnpm
   - Mac credsStore 修補(僅 Mac host)
   - `uv tool install specify-cli@v0.8.1`
   - clone `obra/superpowers` skills 到 `~/.claude/skills/superpowers`(若不存在)
   - 印出 health banner

**預期 banner**(每行非 NOT FOUND):

```
================================================================
  Environment ready
================================================================
  uv:         uv 0.x.x (...)
  specify:    v0.8.1
  claude:     1.x.x (Claude Code)
  node:       v22.x.x
  pnpm:       9.x.x
  tsc:        (run 'pnpm install' to enable)
  vitest:     (run 'pnpm install' to enable)
  docker:     Docker version ...
  docker compose: Docker Compose version ...
  git:        git version ...
================================================================
```

> `tsc` / `vitest` 顯示 "(run 'pnpm install' ...)" 屬正常 — 它們是 devDependencies,
> 等下 `make up` 觸發 `Dockerfile dev stage` 的 `pnpm install` 後才落地。

## Step 3 — 啟動應用 stack(SC-001 驗證點)

容器 terminal:

```bash
make up
# App:    http://localhost:8000
# DB:     localhost:5432
# Redis:  localhost:6379

curl http://localhost:8000/health
# {"status":"ok","db":true,"redis":true}

curl http://localhost:8000/metrics | head -20
# # HELP process_cpu_user_seconds_total ...
# # HELP http_requests_total ...
```

**通過此步驟即驗證 SC-001(乾淨機 → 應用 stack 全綠 healthcheck)。**

## Step 4 — 跑第一個 SDD pipeline(SC-007 驗證點)

容器 terminal:

```bash
claude
```

進入 Claude Code 後,跑完整 pipeline。範例:加一個 `GET /echo` endpoint。

```
/speckit-specify 加一個 GET /echo endpoint,接 ?msg= 參數,回 JSON {"echo": "<msg>"};若無 msg 參數則回 400
```

預期 Claude:

1. 跑 mandatory `before_specify` hook → 建 branch `002-echo-endpoint`(或類似)
2. 在 `specs/002-echo-endpoint/` 寫 spec.md + checklists/requirements.md
3. 寫 `.specify/feature.json` 指向新 feature dir
4. 報告完成

```
/speckit-clarify
```

預期 Claude 提 ≤ 5 題;每題答完寫入 `## Clarifications` session。

```
/speckit-plan
```

預期 Claude 寫 plan.md + research.md + data-model.md + contracts/(若有 HTTP endpoint) + quickstart.md;Constitution Check 全綠。

```
/speckit-tasks
```

預期 tasks.md 為 dependency-ordered,RED → GREEN 步驟分列。

> ### ⚠️ Review gate(FR-013)— 在跑 `/speckit-implement` 之前
>
> 你必須親自開 `specs/002-echo-endpoint/spec.md` + `plan.md` 看一輪,
> 確認 spec 與 plan 反映你真實要的東西。本 baseline 不強制 reviewer ≠ author
> (C2),所以「自己 review 自己」也算數 — 但**必須真的看過**。

```
/speckit-implement
```

預期 Claude:
- 跑 RED 測試(failing) → 跑 GREEN 實作 → 跑 `make typecheck` `make lint`
- 完成後,所有 quality gate 綠

```bash
# 容器內手動再跑一次 quality gates 確認
make test && make typecheck && make lint
```

```bash
# 試打新 endpoint
curl 'http://localhost:8000/echo?msg=hello'
# {"echo":"hello"}
curl -i 'http://localhost:8000/echo'
# HTTP/1.1 400 Bad Request
```

```bash
# 看 metrics 自動覆蓋(SC-004)
curl -s http://localhost:8000/metrics | grep '/echo'
# http_requests_total{method="GET",route="/echo",status_code="200"} ...
# http_requests_total{method="GET",route="/echo",status_code="400"} ...
```

**通過上述驗證即達成 SC-004 與 SC-007。**

## Step 5 — Commit + Push(由你決定時機)

> 本專案 CLAUDE.md 規定 commit / push **皆需 user 明確指示**。Claude 不會
> 自動執行,只會提示。當你準備好:

```bash
git add specs/002-echo-endpoint/ src/ tests/
git commit -m "feat: add GET /echo endpoint"
git push
```

或在 Claude Code 內輸入 `commit`(讓 Claude 起 commit 流程)。

## Step 6 — 後續 Feature 的循環

對每個新 feature:

```
/speckit-specify <description>
  → /speckit-clarify
  → /speckit-plan
  → /speckit-tasks
  → (人類 review)
  → /speckit-implement
  → commit + push + PR
```

> Trivial 修正(typo / 純依賴 patch 升級等)可跳過 SDD pipeline,但 quality gates
> 仍須通過,且 PR comment 由 reviewer 明示豁免理由(C1 + SC-003)。

## Common Pitfalls

| 症狀 | 原因 | 修法 |
|---|---|---|
| `claude` 在容器內要求重新登入 | host 端 `~/.claude/.credentials.json` 不存在 / 權限錯 / WSL 把 repo 放 `/mnt/c/` 導致 `${localEnv:HOME}` 解析錯誤 | 在 WSL `~/` 內 clone repo;確認 host `ls ~/.claude/.credentials.json` 存在 |
| `make up` 跑 docker compose 噴 「mount denied」(Mac) | Mac Docker Desktop 嚴格 File Sharing 加上 DooD 路徑翻譯 | `LOCAL_WORKSPACE_FOLDER` env 已由 devcontainer 注入;若仍失敗檢查 Docker Desktop → Settings → Resources → File Sharing 是否含你的路徑 |
| `make up` 噴 `ERR_PNPM_OUTDATED_LOCKFILE` | `package.json` 改了但 `pnpm-lock.yaml` 沒更新 | `pnpm install` 重生 lockfile,commit |
| Mac M1 上某 service build 慢 | base image 只有 amd64,跑 Rosetta emulation | `docker-compose.yml` 對該 service 加 `platform: linux/amd64`(若必須),或改用 multi-arch image |
| `init-firewall.sh` 在 postStart 噴錯 | 預設未啟用 firewall,fallback 訊息屬正常 | 如要啟用,於 host 設 `ENABLE_FIREWALL=true` 並重啟容器(進階用法) |

## What's Next

- 讀 `.specify/memory/constitution.md` — 五原則 + 技術棧 + workflow gate(本 baseline 的根據)。
- 讀 `specs/001-superspec-baseline/spec.md` — 19 FR / 10 SC,理解 baseline 對你的承諾。
- 讀 `specs/001-superspec-baseline/contracts/*.md` — 對 adopter 暴露的契約面細節。
- 後續 `specs/001-superspec-baseline/research.md` Section 3 列了 6 個 implementation gap(`.npmrc` engine-strict、CI workflow、SSH agent 顯式 mount 等),由 `/speckit-tasks` 拆成可交付 task。
