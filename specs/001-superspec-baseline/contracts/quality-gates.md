# Contract: Quality Gates

**Audience**: Adopter / PR reviewer / CI workflow
**Surface owner**: `Makefile` + `package.json` `scripts` + `Dockerfile` + `.github/workflows/`(CI;Gap G4 待建)
**Related FR / SC**: FR-003, FR-005, FR-008, FR-009, FR-013, FR-017, SC-002, SC-003, SC-005, SC-008

## Mandatory Gates(機械強制)

每個非 trivial PR(以及所有 trivial 豁免 PR)合併前必須通過:

| Gate | Verification command(in dev container) | Pass 條件 |
|---|---|---|
| **Tests** | `make test`(`docker compose run --rm app pnpm test`) | vitest 全綠;0 failed |
| **Types** | `make typecheck`(`docker compose run --rm app pnpm typecheck`) | `tsc --noEmit` 0 errors |
| **Lint** | `make lint`(eslint + `prettier --check`) | 0 errors / 0 warnings;含 `no-console` 規則(SC-009 機械強制 — 應用碼 `src/**/*.ts` 內任處 `console.*` 即 fail) |
| **Lockfile committed** | `git status --porcelain pnpm-lock.yaml` 為空 + `Dockerfile` 用 `--frozen-lockfile` | 任何 `package.json` 變動 PR 必同 commit `pnpm-lock.yaml`;Dockerfile build 嚴格驗證一致性 |

> Mandatory gate 失敗 → PR 不可 merge,**無例外**(包含 trivial 豁免 PR)。

## Advisory Gates(human-attest / pr-review)

| Gate | 驗證方式 | 紀錄位置 |
|---|---|---|
| **Container parity** | PR 須揭露「測試於宿主端還是容器」;只在 host 跑的 PR 須補在容器跑一次 | PR description 或 reviewer comment |
| **Spec coverage** | 非豁免 PR 必有 `specs/NNN-*/`(spec / plan / tasks 齊備);豁免 PR 須在 PR comment 由 reviewer 明示豁免理由 | PR comment + filesystem |
| **Toolchain isolation** | toolchain 升級 PR 的 diff 僅動 version_declaration_site + lockfile | PR diff 視察 / CI 規則(Gap G5) |
| **Human review of spec/plan** | 至少一位人類(可作者本人)review 過 spec.md + plan.md,於 `/speckit-implement` 前 | PR description / commit message / `/speckit-implement` skill 的 review prompt(Gap G2) |

## 不變量

1. **Mandatory gate 在容器內跑**:CI 與本地 dev container 必須使用同一 base image(FR-017);現況 CI 缺(Gap G4)。
2. **Trivial 豁免不繞過 mandatory gates**:豁免只豁 spec coverage,其他 gate 一律照樣跑(C1)。
3. **Lockfile = 一級 review object**:`pnpm-lock.yaml` 必須與 `package.json` 同 commit;不允許「先 merge package.json,後 merge lockfile」拆 PR。
4. **Reviewer 可作者本人**(C2):review gate 的目的是阻擋全自動 prompt-to-merge,非交叉審查;後者由 GitHub PR review 流程(repo collaborator 設定)疊加。

## 失敗模式

| 場景 | 期望行為 |
|---|---|
| `make test` 在宿主端通過、容器內失敗 | 視為 container parity 缺陷,於 PR 揭露;baseline 季度目標 ≤ 1 件(SC-008)。 |
| `package.json` 改動但 `pnpm-lock.yaml` 未更新 | Dockerfile build 階段 `pnpm install --frozen-lockfile` 失敗;README §8 FAQ 提供修法 |
| Toolchain bump PR 夾帶其他變更 | reviewer 駁回,要求拆 PR(現為人為,Gap G5 待 CI 規則化) |
| Trivial 豁免 PR 無 reviewer comment | PR 不可 merge;reviewer 須補豁免說明 |

## CI 對應(Gap G4)

baseline 要求(FR-017):

- CI workflow 以 **同一份 `Dockerfile` 的 `dev` stage**(或等價 image)跑 mandatory gates。
- 在 macOS-latest 與 ubuntu-latest 兩個 runner 跑同一 commit(SC-002 自動化驗證)。
- 對 `pnpm-lock.yaml` 變動的 PR 額外跑 `pnpm install --frozen-lockfile` 驗證一致性。
- 對 toolchain 升級 PR 驗證「diff 僅動 version_declaration_site + lockfile」(Gap G5 規則的機械化)。

具體 workflow 檔位置與步驟由 `/speckit-tasks` 拆出來的 G4 task 設計。

> **WSL2 parity caveat**(F3 finding):GitHub Actions `ubuntu-latest` runner 是
> 裸 Linux x86_64,與 baseline 目標的 WSL2 Ubuntu(Hyper-V VM)不完全等價。
> CI 通過僅是「合理近似」— fs case-sensitivity、metadata、systemd 等細節仍
> 可能差異。**真正 WSL2 parity 仍須由開發者於本地 dev container 驗證**;
> CI 只能 catch 大多數 application-layer 衝突,不能取代本地 reopen-in-container
> 的 sanity check(SC-008 的 「container parity defects ≤ 1/quarter」目標即
> 反映此差距)。
