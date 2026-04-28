# Phase 0 Research: SuperSpec Development Environment Baseline

**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md) | **Date**: 2026-04-28

## 範疇

本 baseline 是 meta-project,Phase 0 不解析新技術選擇,而是:

1. 把 `/speckit-clarify` session 5 個 decisions 固化為 single source of truth(rationale + alternatives)。
2. 對 19 條 FR 做 gap analysis — 哪幾條已被現有 template 完全滿足、哪幾條僅部分滿足、哪幾條未實作。
3. 把 SC 對應到具體驗證手段。

## Section 1 — Clarification Decisions(凍結)

### Decision C1: 「Trivial 修正」豁免 SDD pipeline 的判定授權給 PR reviewer

- **Decision**: spec 不固定 trivial 邊界;PR reviewer 一案一案判定。豁免決定須在 PR comment 留下可追溯紀錄。Reviewer 拒絕豁免時,該變更必須改走完整 SDD pipeline 才能合併。
- **Rationale**: 機械邊界(SemVer patch only)在大多數情境足夠,但偶見「行為實質不變但跨多檔案」的修補情境(例:批次 typo 修正、license header 統一),機械邊界會誤殺。授權給 reviewer 換取彈性,並用「PR comment 紀錄」作為可審計物件。SC-003 因此改寫為「100% 未獲豁免之 PR 對應 spec 目錄」。
- **Alternatives**:
  - **嚴格機械(SemVer patch + typo)**:可自動驗證,但會誤殺合理批次修補。
  - **取消 trivial 概念**:最高紀律,但讓單字 typo 也須 spec/plan/tasks,流程成本失控。
  - **CODEOWNERS 機械豁免**:CODEOWNERS 不適合表達「行為等價」這類語意判斷。

### Decision C2: 「Human reviewer」最低資格 = 作者本人即可

- **Decision**: `/speckit-implement` 前的人類 review gate 由「至少一位人類確實檢視 spec.md 與 plan.md」滿足;baseline 不強制 reviewer ≠ author、不強制專案成員資格。
- **Rationale**: 本 baseline 服務的場景含「個人 maintainer 驅動 + AI 輔助開發」與「小團隊」。強制非作者 reviewer 對個人專案是不可達的高門檻,會把 template 推向「不適合個人」的窄場景。「人類 gate」的核心目的是阻擋全自動 prompt-to-merge,而非交叉審查 — 後者由 PR review(常規 GitHub flow)處理,不疊加進 baseline。
- **Alternatives**:
  - **必須非作者 + 專案成員**:對個人 maintainer 不可達。
  - **CODEOWNERS 指定**:要求 repo collaborator 結構,個人專案無此設置。
  - **雙人複審**:對個人專案完全失效。
- **副作用**:此選擇削弱了 baseline 的合規門檻;若 derivative 需要更嚴格(如金融、醫療場景),須在自家 PR 流程上層疊加,非 baseline 內建。

### Decision C3: 上游 outage 採「容器內快取繼續工作」degraded mode

- **Decision**: 已 build 完的 devcontainer + 本機 image cache + 已 cache 的 Claude Code OAuth → 「不需新外部資源」的本地操作(寫程式、跑既有測試、`git commit`)在上游 outage 時不應被阻擋。需新拉資源(新 image build、新依賴 install、重新 OAuth、`uv tool install` 升級 spec-kit)的操作可阻塞,且失敗訊息須清楚指出阻塞原因為「上游不可達」。
- **Rationale**: 完整離線 mirror 對 template 來說建置成本不成比例(目前無企業 mirror 基礎)。容器內 cache 已天然提供 80% 場景的 degraded continuity,只要明確區分「阻塞 vs 非阻塞」即可避免誤判。
- **Alternatives**:
  - **無正式 fallback**:incident 時 adopter 無 mental model 可循。
  - **完整離線 mirror**:建置與維運成本過高,且需企業級基礎(私有 registry、authenticated proxy)。
  - **「核心 vs 可選」上游分類**:仍不解決「現在能做什麼」問題,只在 incident 後分析有用。
- **新增 FR**: FR-020 明示此 degraded mode 為 baseline 承諾;失敗訊息可讀性是驗收條件。

### Decision C4: Derivative 契約最低限 = 容器化 + SDD pipeline

- **Decision**: Adopter 替換語言 / framework / DB / cache / observability 方案後,只要保留 `.devcontainer/`(容器化)與 `/speckit-*` pipeline + `specs/NNN-*/` 結構(SDD)兩條,即仍視為本 template 的 derivative。其餘規範(TDD、observability defaults、LF 行尾、non-root prod、跨平台 parity 等)在 stack 替換後降為 advisory,由 derivative 的 maintainer 自行決定保留範圍。
- **Rationale**: Template 的核心價值是「容器化 + SDD」雙鎖,其餘規範是 Node.js 生態的 best practice 集合 — 換語言後這些 best practice 可能不適用(例:Python 生態的 lockfile 機制、行尾敏感程度都不同)。把 advisory 範圍明確化避免「derivative 是否還算 derivative」的爭議。
- **Alternatives**:
  - **僅微調**:把 template 鎖死在 Node.js + Hono,失去 SDD 通用性的價值。
  - **鎖規範、不鎖技術**:看似平衡,但「規範通用化」需要實作層面的多語言支援(例:TDD 紀律在 Java vs Python vs Go 各自不同),baseline 無能力提供。
  - **未鎖**:fork 後完全自由,但 derivative 主張「源自此 template」就失去意義。

### Decision C5: SC-007 的「示範流程」由 adopter 第一個自家 feature 滿足

- **Decision**: Baseline 不打包預製範例 feature;SC-007 改為「adopter 採用後的第一個自家 feature 可在 1 小時內走完整 SDD pipeline 並通過所有 quality gate」。
- **Rationale**: 預製範例 feature 帶來雙重維護成本(隨 spec-kit 升版要同步更新範例)、誘發 adopter 過度模仿、違反「孤立 commit」原則(範例 feature 與 baseline 應分屬不同 PR)。Baseline 已實質提供 `src/http-metrics.ts` + 對應 `tests/` 作為 reference implementation 的「成品形態」(雖然其 spec/plan/tasks 來自舊專案、未保留),這已足夠示範規範形態。
- **Alternatives**:
  - **Baseline 內含完整範例**:雙重維護 + 過度模仿風險。
  - **獨立 sample repo**:multi-repo 維運開銷;adopter 還要找另一個 repo。
  - **Walkthrough 文件**:由 quickstart.md 提供 — 已採用此形式作為補強。

## Section 2 — FR Gap Analysis(對現有 template 的覆蓋)

| FR | 規範摘要 | 覆蓋狀態 | 證據 / Gap |
|---|---|---|---|
| FR-001 | 跨平台(Mac M1 + WSL2),無 OS-specific 步驟 | ✅ 完全 | `.devcontainer/devcontainer.json` 用 `${localEnv:HOME}`;`docker-compose.yml` 用 `${LOCAL_WORKSPACE_FOLDER}` 解 DooD 路徑翻譯;`post-create.sh` Mac credsStore 修補有條件守護(只在 `/Users/*`)。`.gitattributes` LF 強制。 |
| FR-002 | 單一可重現路徑 | ✅ 完全 | Reopen → `post-create.sh` 自動裝 spec-kit + superpowers → `make up` 拉 stack。 |
| FR-003 | 容器內統一指令 | ✅ 完全 | `Makefile` 的 test/lint/typecheck/format/shell/db-shell 全部 `docker compose run --rm app …`。 |
| FR-004 | SDD pipeline 內建 | ✅ 完全 | `.specify/` 結構齊備;`.claude/skills/speckit-*` 可用;`/speckit-clarify` Q1 已決策(reviewer 授權)。 |
| FR-005 | Test-First | ✅ 完全(規範層) | 憲法 Principle I + tests/ 已含 `.test.ts` + `.bench.ts` 示範;`http-metrics.label-shape.test.ts` 等命名顯示 acceptance 與 SC 編號對齊。 |
| FR-006 | Observability 預設 | ✅ 完全 | `src/app.ts` 已掛 `httpMetrics`、`/health`、`/metrics`;`src/http-metrics.ts` 含 routePath 探測 + opt-out + cardinality 防護;`pino` 為唯一 log channel。 |
| FR-007 | Claude OAuth 隔離 | ✅ 完全 | `.gitignore` 列出 `.claude/.credentials.json` 等;devcontainer 從 host bind mount;`init-firewall.sh` 提供可選 egress 白名單。 |
| FR-008 | 機器強制 Node 版本 | ⚠️ **部分** | `package.json` 有 `engines.node: ">=22"`,但 pnpm **預設不執行 engine check**(需 `.npmrc` 設 `engine-strict=true`)。**Gap**:目前無 `.npmrc`(repo 根),低 Node 版本仍可 install — 違反 FR-008 的「機器強制」要求。 |
| FR-009 | Lockfile committed | ✅ 完全 | `pnpm-lock.yaml` 已 commit;`Dockerfile` deps stage 用 `pnpm install --frozen-lockfile`;README §8 FAQ 含 `ERR_PNPM_OUTDATED_LOCKFILE` 修法。 |
| FR-010 | LF 行尾強制 | ✅ 完全 | `.gitattributes` `* text=auto eol=lf` + `*.sh text eol=lf` + spec-kit 擴充 `.ps1` 強制 LF。 |
| FR-011 | Production 非 root | ✅ 完全 | `Dockerfile` runtime stage `useradd … app` + `USER app` + `chown` 對 `node_modules` / `dist`。 |
| FR-012 | Build artifact named volume | ✅ 完全 | `docker-compose.yml` `app-node_modules` named volume;`.gitignore` 排 `node_modules/` `dist/` `coverage/` `.vitest-cache/` `.pnpm-store/`。 |
| FR-013 | `/speckit-implement` 前人類 review | ⚠️ **部分** | 憲法 Principle V 已文字規範,且 `/speckit-implement` skill outline 通常含「review spec/plan」提示。**Gap**:本 spec 未在 `/speckit-implement` skill 或 PR template 層級驗證該 prompt 是否實際出現 — 若 skill 升版後此提示消失,規範就失靈。 |
| FR-014 | SSH agent 從 host 轉發 | ⚠️ **部分** | `devcontainer.json` 未顯式宣告 SSH agent forwarding;依靠 VS Code Dev Containers 預設行為(透過 Docker Desktop 整合)。**Gap**:行為依賴外部工具預設值,非 template 顯式契約;若 VS Code 預設改變或 adopter 用其他 IDE,即失效。 |
| FR-015 | Dev / prod stage 分離 | ✅ 完全 | `Dockerfile` `dev` / `build` / `prod-deps` / `runtime` 四 stages;runtime 只 COPY `node_modules`(prod-only)+ `dist` + `package.json`。 |
| FR-016 | Feature branch 規範 | ✅ 完全 | `.specify/extensions/git/` 提供 `before_specify` hook 自動建 `NNN-feature-name`;`git-config.yml` 設 `branch_numbering: sequential`。本次 spec 已實證(`001-superspec-baseline`)。 |
| FR-017 | CI 與 dev container 同 base image | ❌ **未滿足** | repo 內無 `.github/workflows/` 或等價 CI 配置。**Gap**:CI 整體缺失 — 「CI 綠 ⇔ local container 綠」承諾無法兌現。 |
| FR-018 | 範例應用 + derivative 契約 | ✅ 完全 | `src/` + `tests/` 提供 reference impl;C4 已固化 derivative 契約最低限。 |
| FR-019 | 工具鏈孤立 commit | ⚠️ **部分** | 憲法已規範;`.devcontainer/post-create.sh` 集中 spec-kit 版本宣告(`SPEC_KIT_VERSION="v0.8.1"`)。**Gap**:無 PR template / CI 檢查強制「toolchain 變更不夾帶其他變更」 — 純文字規範,可被人為違反。 |
| FR-020 | 上游 outage degraded mode | ⚠️ **部分** | 結構性支援已就位(named volume cache、Claude OAuth bind mount、本機 image)。**Gap**:失敗訊息可讀性未驗證 — 例:Anthropic API outage 時 `claude` CLI 的錯誤訊息是否明示「上游不可達」尚未檢查;`pnpm install` 在 npm registry outage 時的訊息類似。 |

## Section 3 — Outstanding Gaps(留給 /speckit-tasks)

由 Section 2 識別出 **6 個 implementation gap** 需在後續 task 階段處理:

| Gap | 對應 FR | 行動類型 |
|---|---|---|
| G1: 加 `.npmrc` 含 `engine-strict=true` | FR-008 | 新增配置檔 |
| G2: 確認 / 文件化 `/speckit-implement` 的 review prompt | FR-013 | 驗證 + 文件 |
| G3: SSH agent forwarding 顯式化(devcontainer.json `mounts` + `containerEnv`) | FR-014 | 配置強化 |
| G4: 設置 GitHub Actions(或等價)CI workflow,跑 test/typecheck/lint 於相同 base image | FR-017 | 新增 CI |
| G5: PR template 或 CI 檢查「toolchain 變更孤立」 | FR-019 | PR 模板 / CI 規則 |
| G6: 驗證上游 outage 時的 error message 可讀性,必要時加 wrapper | FR-020 | 驗證 + 包裝 |

這些 gap **不阻擋**本 plan 進入 Phase 1(因 Phase 1 產出 design / contract 文件,屬規格層;gap 屬實作層)。但 `/speckit-tasks` 步驟必須把 G1–G6 拆成可獨立交付的 task。

## Section 4 — SC 驗證手段

| SC | 驗證手段 |
|---|---|
| SC-001 | 在乾淨 macOS Apple Silicon 機(只裝 Docker / VS Code / Git)從 clone 到 `make up` 全綠 healthcheck 計時。WSL2 同樣流程。標準:首次 ≤ 15 min, reopen ≤ 3 min。 |
| SC-002 | 同一 commit 在 Mac + WSL2 各跑 `make test` `make typecheck` `make lint`,diff stdout(過濾時間戳)。標準:語意 diff = 0。 |
| SC-003 | 對最近 N 個 PR 抽樣,確認非豁免 PR 100% 含 `specs/NNN-*/`,豁免 PR 100% 在 comment 中有 reviewer 明示豁免。 |
| SC-004 | 在範例 app 加一個 `GET /test/:id` route,只寫 handler;curl 後檢查 `/metrics` body 含 `route="/test/:id"` 的 counter + histogram 樣本。 |
| SC-005 | 對 `SPEC_KIT_VERSION` bump commit 跑 `git revert <hash>`;確認 stack 仍可 `make up` 全綠、`make test` 全綠。 |
| SC-006 | `gitleaks` 或同等 secret-scan 對 git history 全掃描;或 `git log --all -p | grep -E "credentials|sk-ant"` 0 hits。 |
| SC-007 | Adopter 第一個自家 feature 從 `/speckit-specify` 到 `/speckit-implement` 完整跑完並 merge,計時 ≤ 1 hour。Quickstart.md 提供 walkthrough。 |
| SC-008 | 觀察一段時間(例:1 quarter)PR 中發生「host 過、container 失敗」的 issue 數量。標準:≤ 1 件 / 季。 |
| SC-009 | `grep -rn "console\\.log\\|console\\.error\\|console\\.warn\\|console\\.info" src/`(排除註解)。標準:0 hits。 |
| SC-010 | Incident drill:模擬 503 error,從第一筆 error log → metric 偏移可在 alerting 規則(adopter 自設)中觸發的時間。標準:≤ 1 min。 |

## 結論

Phase 0 無 NEEDS CLARIFICATION,所有 5 個 spec 層 ambiguity 已於 clarify 步驟解決。

19 FR 中 **12 條完全滿足**、**6 條部分滿足、1 條未滿足**(總計 6 個 implementation gap),全部留給 `/speckit-tasks` 拆解。

進入 Phase 1。
