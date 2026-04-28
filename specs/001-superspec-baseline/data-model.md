# Phase 1 Data Model: SuperSpec Development Environment Baseline

**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

> Meta-project 範圍:本 baseline 不引入 application data。本檔把 spec 中的
> Key Entities(規範概念)模型化為 process entities,標出屬性、關係、
> lifecycle 與不變量(invariants),作為 task 拆解、test design、PR review 的
> 共通辭彙基準。

## Entities

### 1. Adopter

| 欄位 | 型別 | 說明 |
|---|---|---|
| `host_platform` | enum {`mac-apple-silicon`, `wsl2-ubuntu`} | 主機平台。Native Windows / Linux desktop / Codespaces 不在 baseline 範圍。 |
| `claude_subscription_type` | enum {`pro`, `max`, `team`, `enterprise`, `none`} | Claude Code 訂閱類型。`none` 視為 baseline 不適用 — adopter 須 fallback 到 API key 路徑(out of baseline scope)。 |
| `host_login_completed_at` | timestamp \| null | 宿主端 OAuth 完成時刻;`null` 代表未登入,`claude` CLI 進容器後須阻擋並提示「先在宿主端登入」。 |
| `derivative_intent` | enum {`internal-team`, `personal`, `public-fork`} | 採用模式;影響 review 流程嚴格度,但不改變 baseline 規範本身。 |

**Lifecycle**:
1. **Acquire**:adopter clone template 衍生的 repo。
2. **Bootstrap**:Reopen in Container → `post-create.sh` 自動完成 spec-kit + superpowers 安裝、生成首次 health banner。
3. **First feature**:跑 `/speckit-specify → … → /speckit-implement`,得 `specs/NNN-*` 完整產物。
4. **Steady state**:每個非豁免 PR 對應一個 `specs/NNN-*` 目錄,工具鏈升級走孤立 commit。

**Invariants**:
- `host_platform` 必為兩個合法值之一;偵測到其他值時 baseline 不保證行為。
- `host_login_completed_at == null` 時,`claude` CLI 在容器內須失敗並指示宿主端登入。

---

### 2. DevContainer Definition

| 欄位 | 型別 | 說明 |
|---|---|---|
| `path` | path | 固定 `.devcontainer/devcontainer.json`(canonical 進入點)。 |
| `features` | list<feature_ref> | `claude-code:1`、`docker-outside-of-docker:1`、`node:1`、`git:1`、`github-cli:1`。 |
| `mounts` | list<mount_spec> | 含 `~/.claude` bind、`~/.claude.json` bind、bash history named volume;**目前缺 SSH agent 顯式 mount**(Gap G3,FR-014)。 |
| `lifecycle_hooks` | { onCreate?, postCreate, postStart } | `postCreate=bash .devcontainer/post-create.sh`;`postStart=init-firewall.sh \|\| skip`。 |
| `forward_ports` | list<port> | 空 — 應用透過 compose 直接 publish,避免 VS Code forwarder 與 compose port 衝突。 |
| `run_args` | list<flag> | `--init`、`--cap-add=NET_ADMIN`、`--cap-add=NET_RAW`(供 init-firewall 用)。 |

**Lifecycle**:
- **Build**:VS Code 點 Reopen → docker build with features → 容器跑起。
- **PostCreate**:`post-create.sh` 安裝 spec-kit、superpowers、Mac credsStore 修補、`init-firewall.sh` 復原。
- **PostStart**:每次重啟跑 firewall 邏輯(預設 skip)。
- **Reopen**:`postCreate` 不再跑;只跑 `postStart`。

**Invariants**:
- `features` 變更為 toolchain 升級,須走孤立 commit(FR-019)。
- `mounts` 修改觸碰 credential 路徑時,須通過 sensitive-material contract 檢查。

---

### 3. Constitution

| 欄位 | 型別 | 說明 |
|---|---|---|
| `path` | path | `.specify/memory/constitution.md` |
| `version` | semver | 目前 `1.2.2`;每次修訂以 MAJOR/MINOR/PATCH 規則 bump。 |
| `principles` | list<principle> | I. Test-First (NON-NEGOTIABLE) / II. Observability by Default / III. Container-First Reproducibility / IV. Type Safety End-to-End / V. Spec-Driven Development。 |
| `tech_stack_constraints` | section | CORE 標記的條目須走 amendment 才能 swap;非 CORE 可加減。 |
| `governance` | section | Amendment 程序、cross-cutting 變更次序、toolchain pinning 規則、compliance review。 |

**Lifecycle**:
- **Ratify**:首次 `/speckit-constitution` 寫入;`ratified` 與 `last_amended` 日期記於檔尾。
- **Amend (PATCH)**:typo / 非語意修飾 — `1.2.1 → 1.2.2`(本 spec 寫作時最新)。
- **Amend (MINOR)**:新增原則或實質擴張現有條文。
- **Amend (MAJOR)**:移除 / 重定義原則,或破壞 adopter 契約(如更換 canonical package manager)。

**Invariants**:
- 每次 amendment 須記 SYNC IMPACT REPORT(本 constitution.md 已示範該 header 格式)。
- 任一 commit 點上,憲法與所有 `specs/NNN-*/spec.md` + `plan.md` 必須一致;不一致時須先 patch specs/plans,再合併憲法變更。

---

### 4. Feature Spec Artifact

| 欄位 | 型別 | 說明 |
|---|---|---|
| `feature_id` | string | `NNN`(三位數,sequential)或 `YYYYMMDD-HHMMSS`(timestamp 模式;本 repo 用 sequential)。 |
| `directory` | path | `specs/<feature_id>-<short-name>/` |
| `spec_path` | path | `<directory>/spec.md` |
| `plan_path` | path \| null | `<directory>/plan.md`,`/speckit-plan` 後存在。 |
| `tasks_path` | path \| null | `<directory>/tasks.md`,`/speckit-tasks` 後存在。 |
| `checklists_dir` | path | `<directory>/checklists/` |
| `phase_artifacts` | { research?, data-model?, contracts/?, quickstart? } | Phase 1 產物;非 web-service 類型可 skip 部分。 |
| `branch` | git_branch | `<feature_id>-<short-name>`(如 `001-superspec-baseline`);與 directory 名同步但不耦合。 |
| `status` | enum {`Draft`, `Clarified`, `Planned`, `Implementing`, `Merged`, `Abandoned`} | 衍生自 spec.md 的 Status header + 檔案存在性。 |

**Lifecycle / State Machine**:

```
Draft  ──/speckit-clarify──▶  Clarified
Clarified  ──/speckit-plan──▶  Planned
Planned  ──/speckit-tasks──▶  (still Planned, +tasks.md)
Planned  ──human review──▶  (gate;FR-013)
Planned  ──/speckit-implement──▶  Implementing
Implementing  ──merge to main──▶  Merged
* (any)  ──abandon──▶  Abandoned
```

**Invariants**:
- `branch == feature_id-short-name`(spec-kit hook 保證;若手動改 branch 名,後續 hook 行為未定義)。
- `directory` 與 `branch` 名稱可不同(speckit-specify outline 明示),但本 baseline 採用同名(更易追蹤)。
- `Implementing` 狀態必有 `plan.md`,且至少一位人類已 review(C2 + FR-013)。

---

### 5. Application Stack

| 欄位 | 型別 | 說明 |
|---|---|---|
| `runtime` | { language, version_floor } | TypeScript on Node.js ≥ 22(範例)。 |
| `web_framework` | { name, version } | Hono 4.x(範例)。CORE 標記。 |
| `storage` | list<{ kind, version }> | PostgreSQL 16、Redis 7(範例)。 |
| `observability` | { logger, metrics, health_endpoints } | pino / prom-client / `/health` + `/metrics`。 |
| `replaceability` | enum {`fully-replaceable`, `derivative-locked-out`} | 固定為 `fully-replaceable`,但替換後降為 advisory(C4)。 |

**Invariants**:
- 替換後仍是 derivative,iff 保留 DevContainer Definition + SDD pipeline 兩條(C4 / FR-018)。
- 替換 web framework 時,**新加 HTTP route 仍須繼承自動 metrics**(advisory,但若保留 observability 規範就必須維持)。

---

### 6. Quality Gate

| 欄位 | 型別 | 說明 |
|---|---|---|
| `name` | string | 對應憲法第 §Development Workflow & Quality Gates 1–6 條:tests pass / types clean / lint clean / container parity / spec coverage / lockfiles committed。 |
| `enforcement` | enum {`mandatory-block`, `pr-review`, `human-attest`} | tests/types/lint = mandatory-block(機械);container-parity = human-attest(PR 須揭露);spec-coverage = pr-review(reviewer 判 trivial 豁免)。 |
| `verification_path` | command \| process | mandatory-block 條目須有可機械執行的 verification command(`make test` 等);其餘為流程規範。 |

**Invariants**:
- mandatory-block gate 失敗 → PR 不可 merge,**無例外**(包含 trivial 豁免 PR — trivial 不豁免 quality gates,只豁免 spec coverage)。
- container-parity 與 spec-coverage 在 PR comment / template 中需有顯式紀錄(若 reviewer 判定豁免,亦要紀錄)。

---

### 7. Toolchain Pin

| 欄位 | 型別 | 說明 |
|---|---|---|
| `target` | enum {`spec-kit`, `claude-code`, `superpowers`, `node-feature`, `dood-feature`} | 被釘的工具。 |
| `version_declaration_site` | path | spec-kit:`.devcontainer/post-create.sh` `SPEC_KIT_VERSION`;Claude Code 與 features:`devcontainer.json` `features` 條目。 |
| `upgrade_pr_isolation` | bool | `true` — 升級必須是孤立 commit(FR-019)。 |

**Invariants**:
- 任何 toolchain 升級 PR 的 diff 必須只動到 `version_declaration_site` 與其衍生 lockfile;若夾帶其他變更,reviewer 須要求拆 PR。
- Toolchain 升級 commit 必須可單獨 `git revert`(SC-005)。

## Relationships

```
Adopter ──uses──▶ DevContainer Definition
DevContainer Definition ──provides──▶ Application Stack runtime
Adopter ──authors──▶ Feature Spec Artifact (1:N)
Feature Spec Artifact ──gated by──▶ Quality Gate (mandatory + advisory)
Constitution ──governs──▶ Feature Spec Artifact + Application Stack + Toolchain Pin
Toolchain Pin ──referenced from──▶ DevContainer Definition
```

## Out of Scope

- Application 層的 domain entities(`User`、`Order` 等)— 由 adopter 在自家 feature spec 中定義,不在 baseline。
- 觀測 backend 的 entity / schema(Prometheus、Grafana、log collector)— template 只承諾介面契約(`/metrics` 格式、log 為 single-line JSON),不定義儲存結構。
- CI/CD pipeline 的具體實作 —— FR-017 要求其存在,但具體 entity model 留給 G4 task。
