# Upstream Outage Runbook

**Purpose**: 在上游服務 outage 時,告訴 adopter「現在能做什麼、不能做什麼、上游恢復後如何 verify」。對應 FR-020 / Clarification Q3 的 degraded mode policy。
**Source spec**: `specs/001-superspec-baseline/spec.md` FR-020 + Clarifications session 2026-04-28 第 3 題
**Source contracts**: `specs/001-superspec-baseline/contracts/devcontainer.md` 失敗模式表、`specs/001-superspec-baseline/contracts/cli-pipeline.md` 失敗模式表

## Degraded mode 原則

當任一上游 outage 時,「容器內現有快取繼續工作」原則生效:

| 仍可做(NOT 阻擋) | 須阻擋(等上游恢復) |
|---|---|
| 寫程式 / 修改既有檔案 | 新 image build / pull |
| 跑既有測試(`make test`)、typecheck、lint | 新依賴 install(`pnpm add`、`pnpm install --no-frozen-lockfile`) |
| `git commit`(本地) | 重新 OAuth login(`claude` 重登) |
| 既有 SDD pipeline 指令(若 spec-kit + skill 已 cache 在容器內) | `uv tool install` 升級 spec-kit |
| 翻舊 logs / 既有 metrics | `git push` 到 GitHub(若 GitHub down)|

## 上游分類與行為

### A. Anthropic API(Claude Code OAuth + Anthropic API)

- **影響面**:`claude` CLI 與 Anthropic API 不可達。新 OAuth login 失敗,既有 token 仍可重用直到過期。
- **症狀**:`claude` 啟動報「not logged in」或 API timeout;Claude Code skills 跑到一半 hang。
- **可做**:已下載的 skills、本地 tasks、不需 LLM 介入的 quality gate(`make test/typecheck/lint`)。
- **不可做**:任何需即時 LLM 回應的 SDD pipeline 步驟。
- **Recovery verify**:`claude --version` 回 200 + 嘗試一個 trivial prompt。

### B. ghcr.io / Docker Hub

- **影響面**:devcontainer feature image pull 失敗。
- **症狀**:`Reopen in Container` 在 build 階段 timeout;`docker compose pull` 失敗。
- **可做**:既有已 build 的容器繼續用(只要不 reopen / rebuild)。
- **不可做**:`Rebuild Container`、`docker compose build --no-cache`、新增 base image 的變更。
- **Recovery verify**:`docker pull node:22-slim`(或本 template 用的任一 image)成功。

### C. GitHub(repo / spec-kit / superpowers / actions)

- **影響面**:`git push`、`git fetch`、`git clone` 失敗;`uv tool install spec-kit` 失敗(因 spec-kit 從 GitHub 拉);CI 上不來。
- **症狀**:`git push` connection refused;`/speckit-*` 升級指令失敗。
- **可做**:本地 git 操作(commit、本地 branch 切換、本地 rebase)、既有 spec-kit 既有版本。
- **不可做**:升級 spec-kit、clone superpowers(若還沒 clone 過)、push to origin。
- **Recovery verify**:`gh api /` 回 200 + `git ls-remote origin` 成功。

### D. npm registry(`registry.npmjs.org`)

- **影響面**:`pnpm install` 拉新 package 失敗;`corepack` 下載 pnpm binary 失敗。
- **症狀**:`pnpm install` 卡在 download;Dockerfile build 階段 deps stage 失敗。
- **可做**:既有 `node_modules`(named volume)的指令;不動 `package.json` / `pnpm-lock.yaml` 的開發。
- **不可做**:新增 / 升級依賴;從零 build 容器(deps stage 會卡)。
- **Recovery verify**:`pnpm config get registry` + `pnpm install --frozen-lockfile`(在隔離目錄 dry-run)成功。

## 失敗訊息可讀性

依 FR-020,失敗訊息須清楚指出「上游不可達」。Template 已強化以下入口:

- `.devcontainer/post-create.sh`:對 `uv tool install` 與 `git clone superpowers` 的失敗,印出明確訊息並指向本 runbook(由 T011 完成)。
- 其他失敗(如 `docker compose build`、`pnpm install`、`claude` CLI errors)交由原工具提供的訊息;adopter 應對照本 runbook 自行判讀。

## 開戰場 / 結束 outage

當 outage 開始:
1. 標註當前 working tree:`git status -sb` 留下記號(commit 既有變動或 stash)。
2. 切到「不需上游」工作流:寫 spec、看既有 logs、跑既有 test。
3. 不要嘗試「強行重試」上游操作 — 反覆 retry 浪費時間 + 污染 logs。

當 outage 結束:
1. 對症逐一 verify(見每個服務的 "Recovery verify")。
2. 如果有 staged 變動,先 push 並確認 origin 收到。
3. 如果有失敗的容器 build,清掉中間層(`docker compose down -v` 或 `docker system prune` 視情況)再重 build。

## 不在範圍內

本 baseline **不**提供:
- 內部 mirror(image / npm / GitHub)— 建置成本不成比例(Clarification Q3)。
- 自動 fallback 切換 — degraded mode 是「告訴你哪些能做」,不是「自動切到備援來源」。
- 第三方上游(其他 cloud SaaS)— 範圍只覆蓋 template 自身用到的 4 條核心上游。
