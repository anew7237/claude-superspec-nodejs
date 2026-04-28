---

description: "SuperSpec Baseline — task list to close 6 implementation gaps and verify SC measurability"
---

# Tasks: SuperSpec Development Environment Baseline

**Input**: Design documents from `/specs/001-superspec-baseline/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/(5 個), quickstart.md
**Tests**: 本 baseline 為 meta-project,大部分交付為配置 / CI / 文件;只有 US4 含一條 application 層 regression test。test 標 OPTIONAL 並標明屬性。

**Organization**: Tasks 依 spec.md 的 5 個 user stories 分相 phase,組合 6 個 implementation gap(G1–G6,見 research.md Section 3)+ 規範對齊任務。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行(不同檔、無未完成依賴)
- **[Story]**: 對應 spec.md user story(US1 onboarding / US2 SDD pipeline / US3 跨平台 parity / US4 observability / US5 toolchain 孤立升級)
- 描述含絕對檔案路徑(repo-relative)

## Path Conventions

本 baseline 為 meta-project,paths 多在 template surface(`.devcontainer/`、`.github/`、`.docs/`、`.specify/`、根 config 檔),非 `src/`。

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立後續 phase 共用的入口檔案與紀錄載體

- [ ] T001 [P] 在 `README.md` 末段(在 §6「團隊協作須知」之後或 §1「先決條件」之前)新增「Baseline Spec & Contracts」區塊,列出本 feature 的 spec / plan / research / data-model / contracts/ / quickstart 的相對路徑連結,作為 adopter 入口導引
- [ ] T002 [P] 建立 `.github/pull_request_template.md`(若不存在),骨架包含:Summary、Type of change(feature / fix / chore / toolchain-upgrade)、Spec coverage 揭露(linked `specs/NNN-*/` 或 reviewer 豁免理由)、Container parity 揭露(host-only 測試須說明)— 為 advisory gate(C1、C2、container parity)提供結構化紀錄載體

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 阻塞所有 user story 的前置;這幾條 gap 不補,後續 story 的驗收條件無法達成

**⚠️ CRITICAL**: 完成此 phase 後 user story 才能開始

- [ ] T003 [P] 建立 repo 根 `.npmrc`,加入 `engine-strict=true`(若無其他配置即只此一行);驗證:在容器內手動把 `engines.node` 改 `">=99"` 並跑 `pnpm install`,應失敗 — 修正後還原。**對應 G1 / FR-008**
- [ ] T004 [P] 修改 `.devcontainer/devcontainer.json` 顯式宣告 SSH agent forwarding,**處理 cross-platform 差異**:(a) **WSL2 Ubuntu / Linux 主機**:於 `mounts` 加 `"source=${localEnv:SSH_AUTH_SOCK},target=/ssh-agent,type=bind"`,於 `containerEnv` 加 `"SSH_AUTH_SOCK": "/ssh-agent"`;(b) **macOS(Docker Desktop magic socket)**:Docker Desktop 在 Mac 上 expose `/run/host-services/ssh-auth.sock`,須改為 `"source=/run/host-services/ssh-auth.sock,target=/ssh-agent,type=bind"` 並設定相同 `containerEnv`。(c) Fallback:若 host 兩條路徑皆不存在(如 host 未啟動 SSH agent),`devcontainer.json` 無條件 mount 會 fail — 將 mount 寫於 `.devcontainer/` 內並於 `post-create.sh` 加 sanity check `[ -S /ssh-agent ] && ssh-add -l \|\| echo "WARN: SSH agent not forwarded;`git push` 將 fall back 至 HTTPS"`。實作策略:先用 (a) 路徑驗證 WSL,再切到 Mac 驗證 (b),最終決定是否需要 OS-aware 條件 mount(devcontainer.json 不支援條件 mount,可能需在 `post-create.sh` 內手動 symlink)。**對應 G3 / FR-014**
- [ ] T005 [P] 建立 `.docs/git-workflow.md` 紀錄專案 git 規範(commit / push 須使用者明確指示、`.specify/extensions/git/git-config.yml` 的 auto_commit 全 disabled);在 `README.md` §6 加 link 引用 — 為後續 SDD pipeline 中段 commit 步驟提供統一參考

**Checkpoint**: Foundation 就位 — `engine-strict` 機械強制 Node 22、SSH agent 顯式契約、git 規範文件化。User story 可開始

---

## Phase 3: User Story 1 - 新成員從零到第一次跑起應用 stack (Priority: P1) 🎯 MVP

**Goal**: 讓新成員在 ≤ 15 min(首次)/ ≤ 3 min(reopen)內完成 onboarding,容器內 `claude` 不要求重新登入,`make up` 全綠 healthcheck

**Independent Test**: 一台乾淨機(只裝 Docker / VS Code / Git + Claude OAuth)依 quickstart.md Step 0–3 走完,計時 + 紀錄 banner 內容,`/health` 回 200

### Implementation for User Story 1

- [ ] T006 [US1] 修改 `.devcontainer/post-create.sh` 的 health banner:在現行 NOT FOUND 偵測之後,若 `claude --version` 失敗或回 "not logged in" 樣式訊息,印出多行明確指引(「請於宿主端執行 `claude` 完成 OAuth login,並確認 ${HOME}/.claude/.credentials.json 存在;WSL 環境請勿將 repo 放於 /mnt/c/」),取代目前單行 `NOT FOUND`
- [ ] T007 [US1] 在 `.devcontainer/post-create.sh` banner 加一行 `engine-strict` 確認(讀 `pnpm config get engine-strict` 並印出),驗證 T003 的設定有被 pnpm 實際採納;若值為 `false` 則印 `WARN: engine-strict not active — Node version enforcement may be advisory only`(依賴 T003 完成)
- [ ] T008 [P] [US1] 建立 `.docs/onboarding-stopwatch.md`,在 macOS Apple Silicon 與 WSL2 Ubuntu 各跑一次 quickstart Step 0–3,記錄:首次 build 耗時、reopen 耗時、healthcheck 全綠時刻;與 SC-001 目標(15 min / 3 min)對照,任一超標須開 follow-up issue

**Checkpoint**: US1 onboarding 流程穩定可重現,SC-001 量化資料就位

---

## Phase 4: User Story 2 - 跑完一輪完整 SDD pipeline 交付一個範例 feature (Priority: P1)

**Goal**: 第一個 adopter feature 從 `/speckit-specify` → `/speckit-implement` 全程在 1 小時內走完,中間不繞過 quality gate;`/speckit-implement` 前的人類 review gate 與上游 outage degraded mode 行為明確

**Independent Test**: 從 main 分支起手,對一個 trivial endpoint(如 `GET /echo`)跑完整 pipeline,quality gates 全綠;另對 spec-kit upstream outage 模擬(斷網)觀察錯誤訊息是否清楚

### Implementation for User Story 2

- [ ] T009 [P] [US2] 驗證 `/speckit-implement` skill 在實際執行流程中是否含「先 review spec.md + plan.md」prompt。**搜尋順序**:先跑 `find ~/.claude/skills -type f -name "SKILL.md" -path "*speckit-implement*" 2>/dev/null` 與 `find ./.claude/skills -type f -name "SKILL.md" -path "*speckit-implement*" 2>/dev/null` 兩條(含 `.claude/skills/speckit-implement` 目錄與 spec-kit installer 釋出的 share 路徑),若皆無命中,再跑 `uv tool dir 2>/dev/null` 找 specify-cli 的 share 路徑下 `templates/skills/`。把實際發現位置(可能多處)+ 對應 SKILL.md 的 review prompt 段落引用,寫入新建檔 `.docs/sdd-review-gate.md`。若所有路徑皆不含 review prompt,則於 `CLAUDE.md` SPECKIT 區段補一行 runtime guidance「跑 `/speckit-implement` 前,Claude 必須先 read spec.md 與 plan.md 並向 user 顯式確認」 — 由 runtime guidance 補強 skill 缺漏。**對應 G2 / FR-013**
- [ ] T010 [P] [US2] 建立 `.docs/upstream-outage-runbook.md`:列出 4 條主要上游(Anthropic API、ghcr.io、GitHub、npm registry)各自 outage 時 — 哪些操作仍可做、哪些被阻擋(對照 contracts/devcontainer.md 失敗模式表)、recover 後如何 verify;在 README §8(常見問題)新增 link 引用。**對應 G6 / FR-020**
- [ ] T011 [US2] 修改 `.devcontainer/post-create.sh`:把 `git clone --depth=1 https://github.com/obra/superpowers ... || echo "WARN: failed to clone superpowers, continuing"` 與 `uv tool install ...` 區段加上明確失敗訊息(若失敗則印「上游不可達 — 請檢查網路 / 上游 status,並參閱 .docs/upstream-outage-runbook.md」並仍 fallthrough);提交到 banner 末段顯示這幾個工具狀態(現行邏輯已有,但需強化錯誤可讀性)。**對應 G6 / FR-020**(依賴 T010)
- [ ] T012 [US2] 跑一次完整 walkthrough(quickstart.md Step 4):於本 baseline 之外建一個 sample feature(如 `GET /echo`)走 `/speckit-specify → /speckit-clarify → /speckit-plan → /speckit-tasks → /speckit-implement`,計時並紀錄於 `.docs/onboarding-stopwatch.md`(由 T008 建立)的「第一個 SDD feature」段;與 SC-007 目標(≤ 1 hour)對照。**注意:此驗證必須在 sample feature 自己的 branch 進行,不要污染本 baseline branch**

**Checkpoint**: SDD pipeline 端到端跑通,review gate 文件化,outage 行為明確,SC-007 量化就位

---

## Phase 5: User Story 3 - 跨平台 PR 的 parity (Priority: P2)

**Goal**: 同一 commit 在 macOS + Linux runner 上跑 mandatory gates 的結果 100% 等價;CI 完全建立(目前缺失)

**Independent Test**: 對任一 PR(可以是本 baseline)觀察 CI 在 macOS-latest 與 ubuntu-latest 兩個 runner 都跑 test/typecheck/lint,結果一致

### Implementation for User Story 3

- [ ] T013 [US3] 建立 `.github/workflows/ci.yml`:於 macOS-latest 與 ubuntu-latest 兩個 runner 跑 mandatory gates(`pnpm install --frozen-lockfile` → `pnpm test` → `pnpm typecheck` → `pnpm lint`);使用 `actions/setup-node@v4` + Node 22(對應 `engines.node`);job 命名 `quality-gates-{os}` 以利 PR review 直接看 status。**對應 G4 / FR-017 / SC-002**
- [ ] T014 [US3] 在 `.github/workflows/ci.yml` 新增 `secret-scan` job:跑 `gitleaks-action`(latest pin 至具體 SHA)對 PR diff 與 history 掃描,fail 時 block merge;依賴 T013 既有 workflow 檔。**對應 SC-006**
- [ ] T015 [US3] 在 `.github/workflows/ci.yml` 的 `quality-gates-{os}` job 末段新增 lockfile drift 防線:用 `paths:` filter(或 `dorny/paths-filter`)只在 PR 觸及 `package.json` 時啟用此 step,跑 `pnpm install --frozen-lockfile` 並期望 0 changes;若 lockfile 與 manifest 不一致,fail message 含修法指引(對應 README §8 FAQ)。依賴 T013;與 T013 主流程跑 `pnpm install --frozen-lockfile` 互補(T013 涵蓋全部 PR、本 step 額外針對 manifest 變動 PR 強化檢查)
- [ ] T015a [P] [US3] 為 SC-009「`console.log` = 0」加機械強制:於 `eslint.config.js` 新增 rule `'no-console': 'error'`(at the application code rules block,適用 `src/**/*.ts`);測試在 `tests/**` 排除(test 與 bench 偶爾用 `console` 為 fixture 噪音是可接受);驗證:跑 `make lint`,若 `src/` 內任處有 `console.*` 即 fail;對既有 `src/` 全掃確認 0 hits(`grep -rn 'console\\.' src/` 應為空,既有 codebase 已符合)。**對應 SC-009**

**Checkpoint**: CI 跑於兩個 OS、含 secret-scan、lockfile drift 檢查、`no-console` 機械強制;SC-002 / SC-006 / SC-009 機械化

---

## Phase 6: User Story 4 - Observability 對新加入的 HTTP route 自動覆蓋 (Priority: P2)

**Goal**: 新加入的 HTTP route 在 `/metrics` 1 分鐘內可見其 counter + histogram;凍結現行行為以防 regression

**Independent Test**: 加一個 `GET /probe-test/:id` route(僅 handler),對其發 request,grep `/metrics` 應見 `route="/probe-test/:id"` 的 sample

### Tests for User Story 4 (OPTIONAL — TDD per Constitution Principle I) ⚠️

> **NOTE: 寫此 test FIRST 並確認 FAIL,才實作**

- [ ] T016 [US4] 在 `tests/http-metrics.regression.test.ts` 新建一個 regression test:程式內動態註冊一個從未存在過的 route(如 `/__regression__/:id`),發 request,assert `/metrics` body 含 `route="/__regression__/:id"` 且 status_code 對應;此 test 凍結 FR-006 + SC-004 行為。檢查既有 `tests/http-metrics.label-shape.test.ts` 是否已涵蓋此情境 — 若有則改為 link 標註而非新增

### Implementation for User Story 4

- [ ] T017 [P] [US4] 在 `specs/001-superspec-baseline/contracts/observability.md` 末段(已存在)新增「實作對照」段落,逐條把 `src/http-metrics.ts`(行號)對應到本 contract 的不變量;同步在 `README.md` §+ HTTP 業務指標 段加 reference link 指向本 contract

**Checkpoint**: US4 行為被 test 凍結 + contract 與實作雙向 traceable

---

## Phase 7: User Story 5 - 工具鏈升級為孤立、可單獨 revert 的變更 (Priority: P3)

**Goal**: Toolchain bump PR(spec-kit / Claude Code / superpowers / devcontainer features)為孤立 commit;PR template 與 CI 雙重提示

**Independent Test**: 對「升 spec-kit 0.8.1 → 下一版」的 hypothetical PR,PR template 提示 reviewer 確認 diff 範圍;CI workflow 偵測 PR 同時動 `SPEC_KIT_VERSION` 與 `src/` / `tests/` 時 comment 警示

### Implementation for User Story 5

- [ ] T018 [P] [US5] 在 `.github/pull_request_template.md`(由 T002 建立)新增「Type of change: toolchain-upgrade」勾選選項與獨立 checklist:(1) PR diff 僅動 version_declaration_site(`.devcontainer/post-create.sh` `SPEC_KIT_VERSION`、`devcontainer.json` features 條目)+ lockfile;(2) 無 application code / test 變更;(3) 已驗證可單獨 `git revert`。**對應 G5 / FR-019**
- [ ] T019 [P] [US5] 在 `.github/workflows/ci.yml`(由 T013 建立)新增 advisory job `toolchain-isolation-check`:若 PR diff 觸及 `.devcontainer/post-create.sh` 的 `SPEC_KIT_VERSION` 行 OR `devcontainer.json` 的 `features` 條目,且同 PR 觸及 `src/` / `tests/`,則 comment 警示(`gh pr comment` 或 `actions/github-script`)— 不 fail,僅 advisory;依賴 T013

**Checkpoint**: Toolchain 升級規範雙層強化(PR template + CI advisory),FR-019 不再純文字

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨 story 的最終一致性檢查與交付

- [ ] T020 [P] 跑 `/speckit-analyze`:對 `specs/001-superspec-baseline/` 全 artifact(spec / plan / research / data-model / contracts/ / quickstart / tasks)做非破壞性一致性掃描;報告寫入 `.docs/baseline-analyze-report.md`
- [ ] T021 [P] 在 `README.md` §6 之後或結尾新增「Baseline Spec」區段(若 T001 未充分涵蓋),列出 19 FR / 10 SC 的高層摘要 + link 到 spec.md;並在 `CLAUDE.md` SPECKIT 區段(已由 plan 階段更新)再次確認所有 link 路徑可達
- [ ] T022 跑一次完整 quickstart.md Step 0–4 在乾淨環境(可用一台沒接觸過此 repo 的 VM 或同事機器),記錄差異於 `.docs/onboarding-stopwatch.md`(SC-001 + SC-007 雙重達標確認);依賴 T008、T012(它們已在 dev 環境跑過,T022 是「fresh-eyes」二次驗證)
- [ ] T023 對 `.docs/`、`.npmrc`、`.devcontainer/devcontainer.json`(SSH agent mount)、`.devcontainer/post-create.sh`(banner)、`.github/workflows/ci.yml`、`.github/pull_request_template.md`、`README.md`、`CLAUDE.md` 等所有改動,擬一份 commit message draft 寫入 `.docs/baseline-commit-plan.md`(對應專案 CLAUDE.md「commit 需明確指示 + 先草擬 draft」規範);實際 `git commit` 等待 user 觸發

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**:無依賴,可立即開始
- **Foundational (Phase 2)**:依賴 Setup;阻塞所有 user story
- **US1 (Phase 3)**:依賴 Foundational(特別是 T003 `engine-strict`、T004 SSH agent)
- **US2 (Phase 4)**:依賴 Foundational + T002(PR template — US2 完成後若有實 PR 會用到)
- **US3 (Phase 5)**:依賴 Foundational(CI 所需 base image 對齊)
- **US4 (Phase 6)**:依賴 Foundational(test 在容器內跑)
- **US5 (Phase 7)**:依賴 T002(PR template,T018)+ T013(CI workflow,T019)
- **Polish (Phase 8)**:依賴所有 US 完成

### Within-Phase Dependencies

- **T006 → T007**:都動 `.devcontainer/post-create.sh`,sequential
- **T010 → T011**:T011 訊息引用 T010 建立的 runbook
- **T013 → T014, T015**:T013 建 ci.yml,T014/T015 改它(都是 sequential 改同檔)
- **T013 → T019**:同上
- **T002 → T018**:T002 建 PR template,T018 改它
- **T008 → T012**:同一個 stopwatch 檔,T008 建立、T012 補錄第二段
- **T021 → T022**:T022 驗證 README link 可達
- **T020-T023 → 最後 commit**:T023 收尾

### Parallel Opportunities

- T001 ∥ T002(setup,不同檔)
- T003 ∥ T004 ∥ T005(foundational,不同檔)
- T006 → T007 sequential;T008 ∥ 它們(不同檔)
- T009 ∥ T010 ∥ T012(US2,不同 .docs / CLAUDE.md 檔)
- T013 → T014 → T015 sequential(同檔 `ci.yml`);T015a 動 `eslint.config.js`,可 ∥ T013/T014/T015
- T016 ∥ T017(US4,不同檔)
- T018 ∥ T019(US5,不同檔;一個動 PR template、一個動 CI workflow)
- T020 ∥ T021(polish)

### MVP Scope

完成 Phase 1 + Phase 2 + Phase 3(US1)即達 MVP:
- Onboarding 流程穩定可重現,SC-001 量化
- 機器強制 Node 22(G1)、SSH agent 顯式契約(G3)、PR template 入口(advisory gate 紀錄載體)就位

US2 / US3 是後續高優,US4 / US5 屬增量強化。

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup(T001、T002)
2. Phase 2 Foundational(T003、T004、T005)
3. Phase 3 US1(T006、T007、T008)
4. **Stop & Validate**:在 Mac + WSL2 各跑 quickstart Step 0–3,確認 `engine-strict` + SSH agent 顯式 mount + onboarding banner 全部就位;SC-001 量化資料 ≤ 15 min / ≤ 3 min。

### Incremental Delivery

每完成一個 user story,可視為一個獨立 PR / merge 點:
1. MVP(US1)→ baseline 對 onboarding 的承諾兌現
2. US2 → SDD pipeline 端到端強化
3. US3 → CI 跑於 Mac + Linux runner(這是其他 story 後續可依賴的基礎)
4. US4 → observability regression 凍結
5. US5 → toolchain 升級規範 enforcement

### Parallel Team Strategy

- Setup + Foundational 由一人完成
- Foundational 完成後:
  - Developer A:US1(`.devcontainer/post-create.sh` 改動 + onboarding 計時)
  - Developer B:US3(CI workflow,可獨立進行)
  - Developer C:US2(`.docs/` 文件 + sample feature 跑通)
- US4 / US5 在 US2 / US3 之後接續

---

## Notes

- [P] = 不同檔、無依賴
- [Story] = 對應 spec.md user story(US1–US5)
- 每個 user story 完成後,quickstart.md 對應 step 應仍可跑通(獨立可測)
- 所有改動須通過容器內 `make test` `make typecheck` `make lint`(Quality Gates contract mandatory gates),不因本 baseline 是 meta-project 而豁免
- Commit / push 由 user 明確指示後執行(專案 CLAUDE.md 規範);T023 草擬 commit plan 但不自動執行
- 與 application code 無關的 task(配置 / 文件 / CI)不需 unit test;但 T016 是 application 層 regression test,須遵守 RED → GREEN
- 若 task 過程發現需要修改本 baseline 的 spec / plan / contracts,應停下來走 spec amendment 流程(更新 spec → re-clarify if needed → 更新 plan),而非直接動 surface 檔案 — 違反 SDD pipeline
