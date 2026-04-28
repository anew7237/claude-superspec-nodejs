# Git Workflow(專案規範)

本檔為團隊與 AI agent(包含 Claude Code)在此 repo 進行 git 操作的規範
摘要。對應 source of truth:
- `CLAUDE.md`(repo root) — Claude Code runtime 指引,Git Workflow 區段
- `.specify/extensions/git/git-config.yml` — spec-kit git extension 設定
- `specs/001-superspec-baseline/contracts/sensitive-material.md` — 機密物
  hygiene 契約(deny list / 不可 commit 規則)

## Commit 規範

- **Commit 須 user 明確指示**:Claude / AI agent 不得自動 `git commit`。
  提議 commit 時須先草擬 message、列出 file 分組,等待 user 下 `commit`
  指令。
- **Exception**:user 在當前對話明示「commit it」、「commit and push」等
  等價語句時,該回合可執行對應動作。
- **每次 commit 對應一件可獨立交付的事**(不混合 toolchain bump 與
  application 變更 — 見 FR-019 / Toolchain isolation)。
- **Trivial 修正**(typo / 純依賴 patch 升級等)由 PR reviewer 一案一案
  判定豁免 SDD pipeline,但仍須通過 quality gates(test / typecheck /
  lint)。

## Push 規範

- **Push 須 user 明確指示**:即便 commit 剛落地、邏輯上「該推就推」,
  也不得自動 `git push`。提議 push 時告訴 user「commit 已落地,要 push
  到 origin 嗎?」,由 user 下指令。
- **Exception**:同 commit 規範的 in-conversation 等價語句。
- **Push 規範**:
  - **不對 `main`/`master` force-push**(任何情況皆禁,包含「我以為沒人
    在看」的單人 repo)。
  - 一般 feature branch 可正常 push;rebase 後 force-push 須先確認沒有
    其他 collaborator 已 fetch 該 branch。

## Branch 規範

- 每個非 trivial feature 在獨立 spec-kit branch(`<NNN>-<short-name>`)
  上開發。Branch 由 `/speckit-specify` 指令觸發 mandatory `before_specify`
  hook 自動建立(`.specify/extensions/git/scripts/bash/create-new-feature.sh`)。
- Branch 命名規則:`<NNN>` 為 sequential 三位數(由
  `.specify/init-options.json` 決定 sequential / timestamp);`<short-name>`
  為 2–4 字 action-noun。
- 直接於 `main` / `master` 上做非 trivial 變更不被允許(Constitution
  Principle V)。
- 結束 feature 後合併到 `main`(可 squash / merge / rebase 自選),feature
  branch 可保留或刪除。

## Tag 規範

- baseline / template 版本以 `Template-<YY.MMDD.x>` 形式打 tag(例:
  `Template-26.428.0` = 2026-04-28 第 0 個 patch)。其他專案可自訂規範。
- Tag 推送遵循 push 規範(`git push origin <tag>` 須 user 明確指示)。

## Spec-Kit hooks 與 commit

- `.specify/extensions/git/git-config.yml` 把所有 `auto_commit.*.enabled`
  設為 `false` —— 即每個 `/speckit-*` 指令的 before/after commit hook
  都會出現在 prompt 流程,但**實際 commit 動作仍須 user 觸發**,符合
  本 repo 的 commit 規範。
- 此設計讓「commit 邊界」由 user 決定,不被工具自動拆 commit。

## 機密物不進 git

- Claude Code OAuth credentials、`.env`、private keys 等永不 commit。
- 完整 deny list 見 `.gitignore` 與
  `specs/001-superspec-baseline/contracts/sensitive-material.md`。
- 違規場景與 rotate playbook:同 contract 文件第 §「失敗模式」段。

## 來源與例外

- 全 repo 預設規範:本檔。
- 個人覆寫:不允許(專案規範優先於個人 `~/.claude/CLAUDE.md` 的較鬆規則
  — Source: 2026-04-28 user explicit override)。
- AI agent(Claude Code)行為依本檔執行;違反規範視為實作 bug,須修正。
