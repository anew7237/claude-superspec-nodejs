<!-- SPECKIT START -->
Active feature: `001-superspec-baseline`
For technologies to use, project structure, shell commands, and other
important information for the active feature, read:
- `specs/001-superspec-baseline/spec.md` (5 user stories, 20 FR, 10 SC, 11 edge cases, 5 clarifications)
- `specs/001-superspec-baseline/plan.md` (Technical Context, Constitution Check, Project Structure)
- `specs/001-superspec-baseline/research.md` (clarification decisions + FR gap analysis)
- `specs/001-superspec-baseline/data-model.md` (regulatory entities, lifecycles, invariants)
- `specs/001-superspec-baseline/contracts/*.md` (CLI pipeline / devcontainer / observability / quality gates / sensitive material)
- `specs/001-superspec-baseline/quickstart.md` (adopter walkthrough)
- **Review gate (FR-013)**: 跑 `/speckit-implement` 前,Claude 必須先 read spec.md 與 plan.md 並向 user 顯式確認
<!-- SPECKIT END -->

# Git Workflow (Project-Specific Override of Global Preferences)

This project enforces stricter rules than the global preferences — **both `commit` and `push` require an explicit user command before execution**.

- **commit**: When a commit is warranted, **first remind the user** (draft the message, list the file groups proposed for inclusion). Accumulate uncommitted files and let me classify which ones should be committed together. **Only execute when the user issues `commit`**.
- **push**: Same rule — only execute when the user issues `push`.
- **Combined commit + push**: After reminding the user, wait until they issue `commit + push` before executing both together.
- **Exception**: If the user explicitly says something equivalent in the current conversation (e.g. "and push", "commit and push it"), the corresponding action may be executed directly that turn.
- **Rationale**: The user wants final approval over both staging scope and remote pushes.
- **Source**: 2026-04-28 — explicit user request in this project, overriding the looser commit rule from global `~/.claude/CLAUDE.md`.
