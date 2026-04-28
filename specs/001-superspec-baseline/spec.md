# Feature Specification: SuperSpec Development Environment Baseline

**Feature Branch**: `001-superspec-baseline`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "針對當前環境產生 spec — 把 claude-superspec-nodejs template 當前提供的開發環境(devcontainer + Spec-Kit + Superpowers + Hono 應用 stack + 跨平台支援)規格化為一份基線交付物"

## Clarifications

### Session 2026-04-28

- Q: 「trivial 修正」的判定邊界由誰決定? → A: 不在 spec 固定邊界,授權給 PR reviewer 一案一案判定;reviewer 拒絕豁免時,變更必須改走完整 SDD pipeline。
- Q: `/speckit-implement` 前的「human reviewer」最低資格? → A: 作者本人 review 即可(最寬鬆),只要求「人類有檢視 spec 與 plan」這一道 gate 存在;不強制 reviewer ≠ author。
- Q: 上游服務(Anthropic、ghcr.io、GitHub)outage 時的 fallback 政策? → A: 容器內現有快取繼續工作 — 已 build 完的 devcontainer + 本機 image + 現有 Claude Code 認證,允許「不需新外部資源」的工作繼續(寫程式、跑既有測試、commit);新 install / 新 image build / 重新 OAuth 視為阻塞,等上游恢復。
- Q: 替換 application stack 後,本 baseline spec 是否仍適用 derivative? → A: 僅鎖「容器化 + SDD pipeline」兩條 — 可換語言、framework、DB、cache、observability 方案;只要 devcontainer + `/speckit-*` pipeline 還在,就視為 derivative。其餘規範(TDD、observability defaults、行尾、non-root prod、跨平台 parity 等)在 stack 替換後**降為 advisory**,由 derivative 的 maintainer 自行決定保留與否。
- Q: SC-007「示範用 SDD pipeline 流程」由誰提供? → A: 由 adopter 採用後的第一個自家 feature 即可滿足;baseline 不打包預製範例 feature,僅確保流程暢通。理由:避免雙重維護、避免 adopter 過度模仿、保留「孤立 commit」原則。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 新成員從零到第一次跑起應用 stack (Priority: P1)

一位新加入專案的開發者,在 macOS Apple Silicon 或 WSL2 Ubuntu 主機上,只裝了
Docker Desktop、VS Code、Git,以及一份個人的 Claude Code 訂閱憑證。他 clone
此 template 衍生的 repo、用 VS Code 開啟、按下「Reopen in Container」,等待
首次 build 完成後,在容器內以單一指令把應用 stack(app + 資料庫 + 快取)拉起,
並能在主機瀏覽器看到應用回應。

**Why this priority**: Onboarding 速度與「在我機器上跑起來」是這個 template
存在的首要理由。如果新人無法在當天上線、或環境設定變成禮拜以計的支援工作,
template 的所有其他承諾都會失效。

**Independent Test**: 用一台從未接觸過此專案的乾淨機器,只安裝必要工具,
照 README 操作,在不修改任何專案內檔案的前提下,讓 `/health` 回 200。

**Acceptance Scenarios**:

1. **Given** 一台乾淨的 macOS Apple Silicon 機器,只裝了 Docker Desktop、VS Code 與 Dev Containers extension,**When** 開發者 clone repo、開啟資料夾並選擇 Reopen in Container,**Then** 容器在 15 分鐘內完成首次 build,容器內的工具鏈可立即使用。
2. **Given** 一台乾淨的 WSL2 Ubuntu 機器與相同條件,**When** 同一系列操作,**Then** 結果與 Mac 路徑等價、無任何 OS-specific 提示需要人工處理。
3. **Given** 容器已就緒,**When** 開發者在容器內執行 stack 啟動指令,**Then** 應用、資料庫、快取皆通過各自的 healthcheck,`/health` 回應 200。
4. **Given** 容器已就緒,**When** 開發者於容器內輸入 `claude`,**Then** Claude Code 不要求重新登入(憑證從宿主端 mount 進來)。

---

### User Story 2 - 跑完一輪完整 SDD pipeline 交付一個範例 feature (Priority: P1)

一位開發者要新增一個小功能(例如新增一個 HTTP endpoint)。他從
`/speckit-specify` 開始,依序經過 clarify、plan、tasks、implement,中間經過
人類 review gate。最終 PR 包含了 `specs/NNN-*/` 完整 artifacts、通過測試、通過
lint/typecheck、產出可運行的程式碼。

**Why this priority**: SDD pipeline 是 template 的另一條主軸;若這條流程跑不
通,template 的「Spec-Driven」承諾就無法兌現。任何 adopter 在採用後第一週
內必然會試跑一輪。

**Independent Test**: 從乾淨 main branch 起手,只透過 `/speckit-*` 系列指令
與容器內標準工具鏈,完成一個 trivial endpoint 的交付,中間不繞過任何 quality gate。

**Acceptance Scenarios**:

1. **Given** 在容器內已登入 Claude Code,**When** 開發者執行 `/speckit-specify <描述>`,**Then** 產生一個新的 feature branch、`specs/NNN-*/spec.md`,並通過 spec 自身的 quality checklist。
2. **Given** spec 已產出,**When** 開發者依序跑 `/speckit-clarify → /speckit-plan → /speckit-tasks`,**Then** 對應的 plan.md 含有 Constitution Check 區段、tasks.md 為 dependency-ordered 清單。
3. **Given** plan 與 tasks 已就緒,**When** 開發者於 `/speckit-implement` 之前進行人類 review,**Then** spec 與 plan 的內容皆可讀、可駁回、可修改後重跑。
4. **Given** review 通過,**When** 開發者執行 `/speckit-implement`,**Then** 程式碼變更附帶 RED→GREEN 測試紀錄,所有 quality gates(test/typecheck/lint)皆綠。

---

### User Story 3 - 跨平台 PR 的 parity (Priority: P2)

兩位開發者分別在 macOS Apple Silicon 與 WSL2 Ubuntu 上,對同一份 PR 跑
test、lint、typecheck、build。兩台機器的結果應位元一致(或在容器層級可解釋的
範圍內等價),不應出現「在我機器上會綠」的情況。

**Why this priority**: 跨平台 parity 是憲法 Principle III 的核心承諾;失去它,
PR review 會被「OS 差異」雜訊污染,合併閘關失靈。但相對於 P1 的 onboarding,
此情境只在多人協作的中後期才會被頻繁觸發。

**Independent Test**: 同一 commit hash 在兩種主機架構上跑完整 quality 套件,
diff 兩邊 stdout/stderr,差異應僅限於非語意性的時間戳或路徑前綴。

**Acceptance Scenarios**:

1. **Given** 同一個 commit hash,**When** 兩台機器都進入容器並跑標準 test 指令,**Then** 兩邊 test 結果(pass/fail count、failure 訊息)一致。
2. **Given** 同一 commit,**When** 兩邊跑 typecheck,**Then** 0 errors / 0 warnings 一致。
3. **Given** 多架構 base image,**When** 容器於 Mac 與 WSL 各自 build 完,**Then** image SHA 可以不同,但 application 行為與測試結果應一致。

---

### User Story 4 - Observability 對新加入的 HTTP route 自動覆蓋 (Priority: P2)

一位開發者新增一個 HTTP endpoint(如 `GET /users/:id`)。他不需要做任何
metrics 接線、不需要寫額外 logger 包裝、不需要為此 endpoint 加 healthcheck —
metrics 計數器、延遲分布、結構化 log,全都自動產生並對 Prometheus / log
collector 可見。

**Why this priority**: 這項特性決定 template 對「production-readiness」的兌現
程度。失去它,每個 endpoint 上線前都要重做相同的接線工作,template 退化成
普通腳手架。但相對於 onboarding 與 SDD pipeline,可以延後到第二批驗證項。

**Independent Test**: 在範例 app 加一個新 route,僅寫業務邏輯。重啟 stack 後,
`/metrics` 端點應自動暴露該 route 的 `http_requests_total` 與
`http_request_duration_seconds`,且 logs 為 JSON 結構化格式。

**Acceptance Scenarios**:

1. **Given** 既有 app + http-metrics middleware,**When** 開發者註冊一條新 route,**Then** 對該 route 發 request 後,`/metrics` 暴露的 counter 與 histogram 含 `route="<該模板路徑>"` 的樣本。
2. **Given** 同一 request,**When** 觀察容器 stdout,**Then** 為單行 JSON、含 level/time/msg/route 等結構化欄位,無 `console.log` 風格的散文輸出。
3. **Given** 開發者欲關閉 HTTP 層 metrics,**When** 設 `HTTP_METRICS_ENABLED=false` 並重啟,**Then** middleware 跳過、`/metrics` 仍保留 runtime 指標(`process_*`、`nodejs_*`)。

---

### User Story 5 - 工具鏈升級為孤立、可單獨 revert 的變更 (Priority: P3)

一位 maintainer 要把 spec-kit 從 v0.8.1 升到下一版,或升級 Claude Code CLI、
升級 superpowers skills。他在一個獨立 commit / PR 內完成版本變更,不夾帶其他
重構或 application 變更。若新版有相容問題,該 commit 可直接 revert,不會牽連
業務程式碼。

**Why this priority**: 工具鏈升級的隔離性是長期維運的安全帶,但採用 template 的
第一週通常不會觸發,優先級較低。

**Independent Test**: `git log --oneline` 可定位「升級 spec-kit」的單一 commit,
且該 commit 的 diff 僅涉及版本宣告檔(devcontainer 安裝腳本、依賴清單)。

**Acceptance Scenarios**:

1. **Given** spec-kit 版本宣告於 devcontainer 設定,**When** maintainer 升版,**Then** 變更只涉及版本字串與 lockfile 更新,不含 spec / plan / 應用碼變動。
2. **Given** 該升級 commit 已合併,**When** 發現新版有 regression,**Then** 透過 `git revert <commit>` 即可回退,無需處理交錯衝突。

---

### Edge Cases

- 宿主端尚未登入 Claude Code 即進入 container,容器內 `claude` 啟動後應指引使用者「先在宿主端登入」,而非提示在容器內登入。
- 開發者把 repo 放在 WSL 跨檔案系統位置(`/mnt/c/...`),效能會劣化 5-10 倍 — README 須警告,但不應 hard fail(尊重使用者自主)。
- `pnpm-lock.yaml` 與 `package.json` 不一致時,build 應以明確錯誤(而非 silent install 偏離 lockfile)結束。
- Apple Silicon 上拉到 amd64-only 的 base image 時,emulation 會慢 — 影響的服務必須在 orchestration 層宣告 `platform`,且 adopter-facing 文件必須記錄理由。
- 新加入的 HTTP route 含高基數 path parameter(`/users/42`、`/users/43`...) — metrics label 必須使用模板路徑(`/users/:id`)而非實際值,以防 cardinality 爆炸。
- 完全未匹配的 request 路徑 → 以字面 `not_found` 作 route label,不可空字串、不可 leak 實際路徑。
- 開發者誤把宿主端 `~/.claude/.credentials.json` 提交到 git,repo ignore 層必須擋下;若已洩漏,文件須提供 rotate 指引。
- 開發者於 `main` 分支直接做非 trivial 變更,SDD 規範必須能透過 PR review 阻擋。
- 在 `/speckit-implement` 之前未經人類 review 的情況,流程必須要求人類介入而非自動推進。
- 工具鏈與 application 同時變更被塞進同一個 PR,應被 review 流程駁回(分開 commit / PR)。
- 上游服務(Anthropic API、ghcr.io、GitHub、PyPI/npm registry)outage 時:容器已 build、認證已 cache、依賴已 install 的 adopter 仍可繼續本機工作(寫程式、跑既有測試、commit);需「新拉外部資源」的操作(新 image build、新依賴 install、重新 OAuth、`uv tool install` 升級 spec-kit)在上游恢復前視為阻塞,template 不另提供 mirror。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Template MUST 支援 macOS Apple Silicon 與 Linux WSL2 Ubuntu 兩個主機平台,且不引入 OS-specific 步驟或絕對路徑;native Windows 主機與其他 Linux desktop 環境明確排除於支援範圍外。
- **FR-002**: Template MUST 提供「乾淨機器(僅 Docker、IDE、Git)→ 跑起應用 stack」的單一可重現路徑,不要求 adopter 在宿主端安裝任何語言 runtime、語言層套件管理工具(除 bootstrap 必需)、函式庫、或資料庫。
- **FR-003**: Template MUST 讓 build / test / lint / typecheck / format / source-control 等所有日常操作在標準容器化環境內以相同指令運作,不依賴宿主端工具差異。
- **FR-004**: Template MUST 內建 spec-kit pipeline(`/speckit-constitution → /speckit-specify → /speckit-clarify → /speckit-plan → /speckit-tasks → /speckit-implement`),並要求所有非 trivial 功能透過此流程交付。「trivial 豁免」由 PR reviewer 一案一案判定 — spec 不固定邊界;reviewer 拒絕豁免時,該變更必須改走完整 SDD pipeline 才能合併。豁免決定須在 PR comment 留下可追溯紀錄。
- **FR-005**: Template MUST 要求非 trivial 功能採 Test-First 紀律(RED → GREEN → REFACTOR),測試先於 implementation。
- **FR-006**: Template MUST 為任何 HTTP 應用預設提供結構化 JSON logs、Prometheus 相容 `/metrics` 端點、`/health` 端點;新加入的 HTTP route 自動繼承 per-route counter 與 latency histogram。
- **FR-007**: Template MUST 將每位 contributor 個人的 Claude Code OAuth 憑證隔離於 repo 之外,且不可被烘焙進任何 image;憑證以「個人持有 + 容器掛載」方式存在。
- **FR-008**: Template MUST 由 package manifest 機器強制最低 runtime 版本(而非靠 README 約定),讓低版本安裝直接被拒絕。
- **FR-009**: Template MUST 要求所有依賴 lockfile(如 `pnpm-lock.yaml`)與其 manifest 變更同 commit;未鎖版或繞過 lockfile 的依賴變更不可 merge。
- **FR-010**: Template MUST 於 repository 層級強制 LF 行尾(對 shell 與其他行尾敏感檔案),不依賴個別貢獻者的編輯器設定。
- **FR-011**: Template MUST 讓 production image 以非 root 使用者執行,且該選擇於 image 定義中明示(非繼承隱含)。
- **FR-012**: Template MUST 確保跨檔案系統 IO 敏感的 build artifact(`node_modules/`、`dist/`、test cache 等)以 named volume 或 ignore 處理,從不被 bind-mount 跨主機檔案系統。
- **FR-013**: Template MUST 在 `/speckit-implement` 執行前要求至少一位人類 reviewer(可為作者本人)檢視 `spec.md` 與 `plan.md`;prompt-to-merge 全自動化路徑禁止。本 baseline 不強制 reviewer ≠ author,亦不強制專案成員資格 — 唯一要求是「人類確實檢視過」這道 gate 存在。
- **FR-014**: Template MUST 將原始碼控制憑證(如 SSH agent)由宿主端轉發進容器,從不烘焙進任何 image。
- **FR-015**: Template MUST 將 dev-only 與 production-only 的 image 層分離 — production stage 不含 build 工具、測試框架、開發依賴。
- **FR-016**: Template MUST 使每個非 trivial feature 在獨立的 spec-kit branch(`NNN-feature-name`)上開發;直接於 `main` / `master` 上做非 trivial 變更不被允許。
- **FR-017**: Template MUST 確保 CI 與 dev container 使用同一份 base image,讓「CI 綠」⇔「本地 container 綠」。
- **FR-018**: Template MUST 提供範例應用(reference implementation)以 demonstrate 上述全部規範;adopter 可替換或刪除範例。**Derivative 契約最低限**:只要保留容器化(`.devcontainer/`)與 SDD pipeline(`/speckit-*` 與 `specs/NNN-*/`)兩條,即仍視為本 template 的 derivative;TDD、observability defaults、LF 行尾、non-root prod、跨平台 parity 等規範在 stack 替換後降為 advisory,由 derivative 的 maintainer 自行決定保留範圍。
- **FR-019**: Template MUST 要求工具鏈版本變更(spec-kit、Claude Code、superpowers 等)為「孤立 commit」,不夾帶其他重構或行為變更,以利獨立 revert。
- **FR-020**: Template MUST 對上游服務 outage 提供「容器內快取繼續工作」的 degraded mode — 已 build 完成的 devcontainer + 本機 image + cache 認證下,「無需新外部資源」的本地操作(寫程式、跑既有測試、`git commit`)不應被阻擋;需新拉資源(新 image build、新依賴 install、重新 OAuth、工具鏈升級)的操作可阻塞,且失敗訊息須清楚指出阻塞原因為「上游不可達」。

### Key Entities

- **Adopter**:採用此 template 開新專案或加入既有專案的開發者(個人或團隊)。屬性包含主機平台(Mac M1 / WSL2)、Claude 訂閱類型、是否首次接觸 SDD。
- **DevContainer Definition**:`.devcontainer/` 內描述容器化開發環境的契約集合(image、features、mounts、生命週期 hooks),為 Adopter 與容器之間的單一事實來源。
- **Constitution**:`.specify/memory/constitution.md`,專案規範總綱,凌駕於 README 與外部 skill 之上;每次修訂走語意化版本(MAJOR / MINOR / PATCH)。
- **Feature Spec Artifact**:`specs/NNN-feature-name/` 目錄,包含 `spec.md`、`plan.md`、`tasks.md` 等 SDD pipeline 產物,綁定一條 git feature branch。
- **Application Stack**:範例 Hono 應用 + PostgreSQL + Redis 的 reference implementation,demonstrate observability / health / metrics / TDD 規範。
- **Quality Gate**:每個 PR merge 前須通過的檢查集合(test、typecheck、lint、container parity、spec coverage、lockfile committed)。
- **Toolchain Pin**:spec-kit / Claude Code / superpowers 的版本宣告位置(目前位於 devcontainer 的 post-create 腳本);變更須為孤立 commit。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 新成員從零(僅 Docker、IDE、Git)到應用 stack 全綠 healthcheck,首次 build 完成 ≤ 15 分鐘;後續 reopen container ≤ 3 分鐘。
- **SC-002**: 同一個 commit 在 macOS Apple Silicon 與 WSL2 Ubuntu 主機上的容器內,test、typecheck、lint 三項結果(pass/fail count 與訊息)100% 等價。
- **SC-003**: 100% 的「未獲 reviewer 豁免」PR 對應到一個 `specs/NNN-*/` 目錄(spec、plan、tasks 齊備),否則無法通過 PR review;豁免案的 PR comment 中可定位到 reviewer 的明示豁免紀錄。
- **SC-004**: 在範例應用上,任何新加入的 HTTP route 在無額外接線的前提下,於 `/metrics` 端點 1 分鐘內可見其 counter 與 histogram(0 行樣板程式碼、0 個忘了接線的 route)。
- **SC-005**: 工具鏈升級 commit 的可單獨 revert 通過率 = 100%(revert 後系統仍可運作、無編譯/測試錯誤)。
- **SC-006**: 全 git history 中 Claude OAuth credentials 出現次數 = 0(以 secret-scan 或等價工具確認)。
- **SC-007**: Adopter 採用後的「第一個自家 feature」可在 1 小時內走完整 SDD pipeline(`/speckit-specify → /speckit-clarify → /speckit-plan → /speckit-tasks → /speckit-implement`)且通過所有 quality gate;baseline 不預製範例 feature,SC-007 由 adopter 自家流程的可重現性驗證。
- **SC-008**: 容器內執行的 quality gates(test/typecheck/lint)若於宿主端意外執行通過、卻於容器失敗,被視為缺陷;此類「container parity 缺陷」每季 ≤ 1 件。
- **SC-009**: `console.log` 等 ad-hoc stdout 寫入於應用碼中的出現次數 = 0(以靜態檢查或 PR review 確認)。
- **SC-010**: 任何 incident 從第一個錯誤 log 出現到 alerting 系統收到對應 metric 偏移的時間 ≤ 1 分鐘(因 metrics + structured logs + healthcheck 預設就位)。

## Assumptions

- Adopter 的主機已安裝 Docker(Desktop 或等價)、VS Code(或相容 IDE)與 Git;這些是 template 的前置條件,不在 template 提供範圍。
- Adopter 持有 Claude Code 個人訂閱(Pro / Max / Team / Enterprise),並已於宿主端完成至少一次 OAuth 登入;團隊使用每人各自的訂閱。
- 跨平台支援範圍鎖定 macOS Apple Silicon 與 WSL2 Ubuntu;native Windows 主機、Linux desktop 直接跑、雲端 Codespaces 環境皆視為延伸場景,非本 baseline 的目標。
- 範例應用採 Hono + PostgreSQL + Redis;adopter 替換語言 / framework / DB / cache / observability 方案後,**只要保留容器化(`.devcontainer/`)與 SDD pipeline(`/speckit-*` 系列指令與 `specs/NNN-*/` 結構)兩條,即仍視為本 template 的 derivative**。其餘規範(TDD、observability defaults、LF 行尾、non-root prod、跨平台 parity 等)在替換後降為 advisory,由 derivative 的 maintainer 自行決定保留範圍。
- 工具鏈版本(Node 22、pnpm 9、TypeScript 5.7、vitest 2、ESLint 9、Prettier 3、spec-kit 0.8.1)為當下 baseline 的具體選擇;升級走孤立 commit。
- always-on / CI / 完全自動化情境採用 Anthropic API key 而非訂閱 OAuth token(憲法已明示);本 baseline 假設 adopter 知曉並遵守此分流。
- 觀測背端(Prometheus / VictoriaMetrics、log collector、alerting)由 adopter 自行接入,template 只負責「以標準介面暴露」,不打包觀測 stack 本身。

## Dependencies

- 上游依賴:Anthropic Claude Code(`claude` CLI)、GitHub Spec-Kit(透過 `uv tool install`)、obra/superpowers(skills)、ghcr.io/devcontainers 一系列 features(node、docker-outside-of-docker、git、github-cli)、Anthropic 官方 devcontainer feature(claude-code)。
- Runtime 依賴:Hono、`@hono/node-server`、`pg`、`redis`、`pino`、`prom-client`(範例應用層)。
- 規範依賴:本 baseline 的所有規則皆對應到 `.specify/memory/constitution.md` v1.2.2 的核心原則;若憲法升版且影響本 baseline,本 spec 須同步更新。
