# Baseline Commit Plan — feature `001-superspec-baseline` Phase 8

**Drafted by**: T023 of `specs/001-superspec-baseline/tasks.md`
**Target branch**: `001-superspec-baseline`
**Base commit**: `4df82c0` (initial spec/plan/tasks artifacts)
**Status**: Draft — awaiting user `commit` instruction (per project Git Workflow rule).

## Background

`/speckit-implement` of feature `001-superspec-baseline` produced 24 tasks worth of changes across `.devcontainer/` / `.github/` / `.docs/` / `eslint.config.js` / `tests/` / surface configs. This plan groups those changes into a small number of logical commits the user may execute.

The grouping below is **Recommended, not Mandatory** — the user may reorganize, split, or merge these commits before issuing `commit`.

## Recommended commit groupings

### Commit 1 — Toolchain hardening (foundational)

**Files**:
- `.npmrc` (NEW) — engine-strict=true (T003 / FR-008)
- `.devcontainer/devcontainer.json` (M) — SSH agent forwarding (T004 / FR-014) + cross-platform documentation
- `.devcontainer/post-create.sh` (M) — engine-strict banner check (T007), Claude OAuth credential warning (T006), upstream-outage error messages (T011), SSH agent sanity check (T004)
- `eslint.config.js` (M) — `no-console: 'error'` for `src/**` (T015a / SC-009)

**Suggested message** (draft only — do not paste verbatim into `git commit`):

```
feat(toolchain): harden devcontainer + machine-enforce Node 22 + SC-009 lint rule

- .npmrc: engine-strict=true so pnpm rejects Node < 22 installs (FR-008 / G1)
- devcontainer.json: explicit SSH agent forwarding mount + remoteEnv (FR-014 / G3)
- post-create.sh: engine-strict banner check, Claude OAuth credential warning,
  upstream-outage error pointers (.docs/upstream-outage-runbook.md), SSH agent
  sanity check (T003-T007 / T011 / FR-008 / FR-014 / FR-020)
- eslint.config.js: no-console error for src/**/*.ts (SC-009 mechanical enforcement)
```

### Commit 2 — CI workflow + PR template (Quality Gates / advisory infra)

**Files**:
- `.github/workflows/ci.yml` (NEW) — quality-gates matrix + secret-scan + lockfile-drift + toolchain-isolation-check (T013-T015 + T015a + T019)
- `.github/pull_request_template.md` (NEW) — Summary / Type / Spec coverage / Container parity / Reviewer / Toolchain upgrade / Checklist (T002 + T018)

**Suggested message** (draft only):

```
feat(ci): add CI workflow + PR template with FR-009/SC-002/SC-006/FR-019 gates

- .github/workflows/ci.yml: quality-gates matrix on macOS + ubuntu runners
  (FR-017 / SC-002), gitleaks secret-scan (SC-006), lockfile-drift guard
  (FR-009), toolchain-isolation advisory comment (FR-019 / G5).
- .github/pull_request_template.md: structured spec-coverage / container-parity
  disclosure + Toolchain upgrade checklist (T002 + T018 / FR-013 / FR-019).
```

### Commit 3 — Adopter documentation (.docs/) + README link integration

**Files**:
- `.docs/git-workflow.md` (NEW) — T005, commit/push/branch/tag/sensitive material rules
- `.docs/upstream-outage-runbook.md` (NEW) — T010, 4 upstream services degraded mode + recovery
- `.docs/sdd-review-gate.md` (NEW) — T009, /speckit-implement skill audit report
- `.docs/onboarding-stopwatch.md` (NEW) — T008 / T012 / T022 manual measurement schema
- `.docs/baseline-analyze-report.md` (NEW) — T020 retrospective `/speckit-analyze` final report
- `README.md` (M) — entry-point pointers (T001 + T005 + T010 + T017)
- `CLAUDE.md` (M) — SPECKIT marker updated to point at active feature artifacts (T009 added review-gate bullet; T021 added spec.md bullet)
- `specs/001-superspec-baseline/contracts/observability.md` (M) — T017 implementation mapping

**Suggested message** (draft only):

```
docs(baseline): add adopter docs + README entry points + observability impl mapping

- .docs/: git-workflow (T005), upstream-outage-runbook (T010), sdd-review-gate
  (T009 — /speckit-implement skill audit, PARTIAL → CLAUDE.md compensation),
  onboarding-stopwatch (T008 + T012 + T022 manual schema).
- README.md: entry-point pointers (Baseline Spec, git-workflow, outage runbook,
  observability contract). Adopters now have a clear path from README to spec.
- CLAUDE.md: SPECKIT marker lists baseline artifacts + Review gate bullet
  (T009 / FR-013) + spec.md (T021).
- contracts/observability.md: implementation mapping table — invariants ↔ src
  modules (T017 / FR-006 / SC-004).
```

### Commit 4 — Regression test (TDD) + opt-out test isolation fix + commit plan

**Files**:
- `tests/http-metrics.regression.test.ts` (NEW) — T016, locks in FR-006 / SC-004 auto-inheritance
- `tests/http-metrics.opt-out.test.ts` (M) — N1 fix:belt-and-suspenders pre+post `vi.resetModules()` `register.clear()` + 30s timeout(post-T020 surfaced + resolved)
- `.docs/baseline-commit-plan.md` (NEW) — T023, this draft itself

**Suggested message** (draft only):

```
test+docs: regression-lock FR-006/SC-004 + opt-out test isolation fix

- tests/http-metrics.regression.test.ts: dynamic route auto-inherits metrics —
  RED-GREEN proven (test fails when middleware unmounted; passes when restored).
  Locks in FR-006 / SC-004 against future refactor (T016).
- tests/http-metrics.opt-out.test.ts: fix prom-client singleton × vi.resetModules()
  test isolation flake — clear default register both pre- and post-resetModules,
  bump first-test timeout to 30s for cold dynamic-import on slow runners.
  Full suite now 20/20 green (was 18/20 with 2 timeouts/dup-registration errors).
- .docs/baseline-commit-plan.md: T023's commit-grouping plan, published for
  audit transparency.
```

## Open issues to surface (NOT in commit scope)

These were identified during /speckit-implement but are OUT OF baseline scope. Surface to user:

1. ~~Pre-existing flake in `tests/http-metrics.opt-out.test.ts`~~ — **RESOLVED post-T020**:N1 fix subagent 已實作 belt-and-suspenders pre+post `vi.resetModules()` `register.clear()` 模式 + 30s timeout for cold dynamic-import。Fix 包進 Commit 4。Full suite 已 verified 20/20 green。

2. **CI real-run validation pending** — `.github/workflows/ci.yml` is written but won't actually execute until pushed to GitHub. Adopter must `git push` to verify CI green on macOS-latest + ubuntu-latest matrix。

3. **Manual stopwatch entries pending** — `.docs/onboarding-stopwatch.md` has stub run sections (Run 1 macOS / Run 2 WSL2 / First SDD walkthrough / Fresh-eyes) with placeholder data only。Real manual runs needed for SC-001 + SC-007 quantitative verification。

4. ~~`/speckit-analyze` final consistency check (T020)~~ — **DONE post-T023**:T020 已 controller-run,結果寫入 `.docs/baseline-analyze-report.md`(包進 Commit 3)。0 CRITICAL / 0 HIGH / 0 unresolved MEDIUM / 6 LOW non-blocking。

5. **6 LOW findings** from `.docs/baseline-analyze-report.md`(L1-L6)— cosmetic / low-likelihood,後續 spec amendment 時順手處理即可。

## Push policy

Per project CLAUDE.md: `git push` requires user explicit instruction. After commits land, user must issue `push` to send to origin. Do NOT auto-push.

## Recommended order

1. User reviews this plan (`cat .docs/baseline-commit-plan.md`).
2. User issues `commit` — controller stages + commits per above 4-commit grouping (or user-revised grouping).
3. User issues `push` (separate step) — controller pushes 001-superspec-baseline branch + opens PR (or merges to main, depending on user preference).
4. After push, controller runs `/speckit-analyze` (T020) for retrospective consistency check.
