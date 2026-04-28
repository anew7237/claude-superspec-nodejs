# Implementation Plan: SuperSpec Development Environment Baseline

**Branch**: `001-superspec-baseline` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-superspec-baseline/spec.md`

## Summary

把 `claude-superspec-nodejs` template 當前已實作的開發環境(devcontainer + Spec-Kit + Superpowers + Hono 範例 stack + 跨平台支援)規格化為 baseline spec(19 FR / 10 SC / 5 user stories),並透過本 plan 產出對應的 process model、契約面文件、與 quickstart,作為:

1. 對「現有 template 是否實際達成 baseline 規範」的可審計對照基準(gap analysis)。
2. 後續對 template 任何修改的 anchor — 偏離 baseline 的變更需走憲法修訂或承認 derivative 契約鬆綁。
3. Adopter 的「採用契約」單一事實來源 — 把分散在 README / 憲法 / `.devcontainer/` / `.specify/` 的隱含承諾收斂成單一 spec。

**技術取徑**:本 baseline 是 meta-project(對 template 自身的規格),不引入新 application 行為。Phase 0 的 research 聚焦於「現有 template 對 19 FR 的覆蓋率分析」與「5 個 clarification decisions 的固化」。Phase 1 的 design artifacts 將「規範實體」(Adopter / DevContainer Definition / Constitution / Feature Spec Artifact / Application Stack / Quality Gate / Toolchain Pin)視為 process entities 建模,並在 `contracts/` 中以介面契約形式凍結 template 對 adopter 暴露的承諾(CLI pipeline、devcontainer、observability、quality gates、sensitive material 五份)。

## Technical Context

**Language/Version**: TypeScript 5.7(範例應用層);Bash + uv(spec-kit 安裝);範例應用編譯與執行需 Node.js ≥ 22(由 `package.json` 的 `engines.node` 機器強制)。
**Primary Dependencies**: Hono 4.x + `@hono/node-server`(範例 HTTP 層)、`pg`(PostgreSQL client)、`redis`(Redis client)、`pino`(structured log)、`prom-client`(metrics)、spec-kit 0.8.1(SDD pipeline)、`obra/superpowers`(skills)、Anthropic devcontainer feature `claude-code:1`、`docker-outside-of-docker:1`、`node:1`、`git:1`、`github-cli:1`。
**Storage**: PostgreSQL(透過 `pg`,範例 stack)、Redis(範例 stack)。本 baseline 不引入新 storage,不變更 schema。
**Testing**: vitest 2.x(`make test`、`make typecheck`、`make lint` 的 inner loop)。Baseline 自身的驗證透過「對 19 FR 的 manual gap analysis」+「在 macOS / WSL2 兩平台跑同一 commit 的 test/lint/typecheck diff 為零」驗證 SC-002。
**Target Platform**: 主機面向 macOS Apple Silicon + Linux WSL2 Ubuntu;容器內為 Linux(`debian-slim` 系)。Native Windows、Linux desktop 直接跑、雲端 Codespaces 皆排除。
**Project Type**: Development environment template / scaffold(meta-project — 規格化 template 自身)。
**Performance Goals**:
- Onboarding(乾淨機器 → 應用 stack 全綠 healthcheck):首次 build ≤ 15 min;再次 reopen ≤ 3 min(SC-001)。
- Adopter 的第一個自家 feature 走完整 SDD pipeline(specify → implement)≤ 1 hour(SC-007)。
- 任何新 HTTP route 在 `/metrics` 1 分鐘內可見(SC-004)。
- Incident 偵測 MTTD ≤ 1 min(SC-010,因 metrics + structured log + healthcheck 就位)。

**Constraints**:
- 跨平台 parity:同一 commit 在 Mac / WSL2 上 test/lint/typecheck 結果 100% 等價(SC-002)。
- LF 行尾於 repo 層級強制(由 `.gitattributes` 實作)。
- Production image 非 root 執行;production stage 不含 dev / build / test 工具(由 multi-stage Dockerfile 實作)。
- Build artifact(`node_modules/`、`dist/`、test cache)從不 bind-mount 跨主機檔案系統 — 用 named volume 或 ignore。
- Claude OAuth credentials = 0 出現於 git history(SC-006)。
- `/speckit-implement` 前必須有「至少一位人類(可為作者本人)」review spec + plan(FR-013)。
- 上游 outage 時 degraded mode:容器內快取繼續工作,新拉外部資源視為阻塞(FR-020)。

**Scale/Scope**:
- Surface files:約 30 個 template-面 檔案(`.devcontainer/` 4 個、`.specify/` 結構若干、根 config 12 個、`Makefile`、`docker-compose.yml`、`Dockerfile`、`.gitignore`、`.gitattributes` 等)。
- 範例 application:`src/` 7 檔(app.ts / index.ts / db.ts / redis.ts / logger.ts / metrics.ts / http-metrics.ts);`tests/` 7 檔(health / http-metrics 5 種測試 + bench)。
- Spec 工件本身:19 FR、10 SC、5 user stories、10 edge cases、5 clarifications。
- 預計同時 active 的 derivative repos:**未量化**(取決於採用速度;baseline 不對 derivative 數量設目標)。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

依憲法 v1.2.2 五原則對照本 baseline plan:

| Principle | 對齊狀態 | 證據 / 對應 |
|---|---|---|
| **I. Test-First (NON-NEGOTIABLE)** | ✅ 對齊 | 本 baseline 是 meta-project,不新增 application 行為。FR-005 把 TDD 紀律寫進 baseline;範例應用既有測試已遵守此模式(`tests/http-metrics.*.test.ts` 覆蓋 label shape / opt-out / SC007 等情境)。Plan 不引入未經測試的新行為。 |
| **II. Observability by Default** | ✅ 對齊 | 範例應用已實作 `/metrics`、`/health`、pino structured log、http-metrics middleware(`src/http-metrics.ts`);FR-006 把此承諾規格化。Plan 不變更現行觀測契約。 |
| **III. Container-First Reproducibility** | ✅ 對齊 | `.devcontainer/` 已就位(devcontainer.json + Dockerfile + post-create.sh + init-firewall.sh);docker-outside-of-docker 已配置;`docker-compose.yml` 編排 app + db + redis;`Makefile` 為單一 inner loop 入口。FR-001 / FR-003 / FR-017 把規範固化。Baseline 自身驗證須在容器內進行(SC-002 / SC-008)。 |
| **IV. Type Safety End-to-End** | ✅ 對齊 | `tsconfig.json` 已 strict、`tsconfig.lint.json` 給 ESLint 用、`eslint.config.js`(flat config)+ Prettier 3 已配置。FR-008 機器強制 Node ≥ 22。Plan 不變更該配置。 |
| **V. Spec-Driven Development** | ✅ 對齊 | 本 plan 即 SDD pipeline 的產物 — feature branch `001-superspec-baseline` 由 `before_specify` hook 建立;spec 已通過 quality checklist;5 題 clarify 已落地;本 plan 含 Constitution Check;`/speckit-implement` 前的人類 review gate 由 FR-013 規範。 |

**結論**:無 violations,Phase 0 可放行。Plan 不引入任何 deviation,因此 Complexity Tracking 留空。

## Project Structure

### Documentation (this feature)

```text
specs/001-superspec-baseline/
├── plan.md                  # 本檔(/speckit-plan 輸出)
├── spec.md                  # /speckit-specify + /speckit-clarify 輸出
├── research.md              # Phase 0 輸出 — 5 個 clarification decisions 固化 + 19 FR gap analysis
├── data-model.md            # Phase 1 輸出 — 規範實體模型
├── quickstart.md            # Phase 1 輸出 — adopter 採用 walkthrough
├── contracts/               # Phase 1 輸出 — template 對 adopter 的契約面
│   ├── cli-pipeline.md      #   SDD pipeline 指令契約
│   ├── devcontainer.md      #   DevContainer reopen-to-ready 契約
│   ├── observability.md     #   /metrics、/health、pino、HTTP_METRICS_ENABLED 契約
│   ├── quality-gates.md     #   make test / typecheck / lint / format 契約
│   └── sensitive-material.md#   .gitignore deny list 與 credential 隔離契約
├── checklists/
│   └── requirements.md      # spec quality checklist
└── tasks.md                 # Phase 2 輸出 — 由 /speckit-tasks 產生(本指令不建)
```

### Source Code (repository root)

本 baseline 是 meta-project,**不引入新 src / tests 結構**。Plan 涵蓋的範圍是
template 面向 adopter 的「契約檔」,既有結構維持不動:

```text
.
├── .claude/                  # 共用 skills + settings(進 git)
├── .devcontainer/            # devcontainer.json / Dockerfile / post-create.sh / init-firewall.sh
├── .specify/                 # constitution / templates / scripts / extensions
│   ├── memory/constitution.md
│   ├── templates/{spec,plan,tasks,checklist}-template.md
│   ├── scripts/bash/         # check-prerequisites.sh / setup-plan.sh / create-new-feature.sh
│   ├── extensions/git/       # spec-kit git extension
│   └── feature.json          # 由 /speckit-specify 寫入,鎖定 active feature dir
├── src/                      # 範例應用(Hono + pg + redis + pino + prom-client)
├── tests/                    # 範例應用測試(vitest)
├── scripts/db-init/          # postgres 第一次啟動的初始化 SQL
├── docker-compose.yml        # app + db + redis 編排
├── Dockerfile                # multi-stage:dev + production
├── Makefile                  # inner-loop 單一入口
├── package.json              # engines.node ≥ 22
├── pnpm-lock.yaml            # 鎖版,必 commit
├── tsconfig.json             # build 用,strict 模式
├── tsconfig.lint.json        # ESLint 用,extends tsconfig.json
├── eslint.config.js          # ESLint 9 flat config
├── .prettierrc.json          # Prettier 3 配置
├── .prettierignore
├── .gitattributes            # LF 行尾強制
├── .gitignore                # secret / artifact deny list
├── .nvmrc                    # 釘 Node 22
├── .env.example              # 環境變數範例
├── CLAUDE.md                 # Claude Code runtime 指引
└── README.md                 # adopter-facing 文件
```

**Structure Decision**: Meta-project,沿用既有結構。Plan 的「實作」聚焦於文件
產出(plan + research + data-model + contracts + quickstart),以及 `CLAUDE.md`
的 SPECKIT marker 更新指向本 plan。任何對既有 surface files 的修改若被
gap analysis 發現必要(例:某 FR 未被現有 template 完全滿足),會在後續
`/speckit-tasks` 步驟拆成獨立 task,於 `/speckit-implement` 時改動 — 而非在
本 plan 階段直接動手。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

(無 violation;本 baseline 與五原則完全對齊)
