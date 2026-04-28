# Onboarding Stopwatch (Manual measurements)

**Purpose**: Verify SC-001 (≤ 15 min first build, ≤ 3 min reopen) and demonstrate FR-001 (cross-platform support) + FR-002 (single reproducible path).
**Source of truth**: `specs/001-superspec-baseline/quickstart.md` Step 0–3
**Status**: Schema only — actual measurements to be filled by manual runs.

> Each row below corresponds to a single physical run on a clean host (only Docker Desktop / VS Code / Git / Claude OAuth installed). Tick the checkbox when the run completes; record metrics. SC-001 target: first-build ≤ 15 min, reopen ≤ 3 min.

## Run 1 — macOS Apple Silicon

- [ ] **Run pending** (manual)

| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Date                    | _YYYY-MM-DD_                   |
| Host CPU                | _e.g., M1 Pro 10-core_         |
| Host RAM                | _e.g., 32 GB_                  |
| Docker Desktop version  | _e.g., 4.30.0_                 |
| VS Code version         | _e.g., 1.95.x_                 |
| First-build elapsed     | _MM:SS_ (target ≤ 15:00)       |
| Reopen elapsed          | _MM:SS_ (target ≤ 3:00)        |
| `/health` 200 at        | _MM:SS from `make up`_         |
| Notes / blockers        | _free-form_                    |

## Run 2 — WSL2 Ubuntu

- [ ] **Run pending** (manual)

| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| Date                    | _YYYY-MM-DD_                   |
| WSL distro / version    | _e.g., Ubuntu 24.04_           |
| Host CPU                | _e.g., AMD Ryzen 7 / Intel i7_ |
| Host RAM                | _e.g., 32 GB_                  |
| Docker Desktop version  | _e.g., 4.30.0_                 |
| VS Code version         | _e.g., 1.95.x_                 |
| First-build elapsed     | _MM:SS_ (target ≤ 15:00)       |
| Reopen elapsed          | _MM:SS_ (target ≤ 3:00)        |
| `/health` 200 at        | _MM:SS from `make up`_         |
| Notes / blockers        | _free-form_                    |

## SC verification

When both Run 1 and Run 2 are filled and within targets, SC-001 is verified for this baseline.

## Cross-platform parity (informal)

Compare key timings between Run 1 and Run 2. Document any > 30% deviation in Notes.

---

## First SDD feature walkthrough

**Purpose**: Verify SC-007 — adopter 第一個自家 feature 從 `/speckit-specify` 到 `/speckit-implement` 全程 ≤ 1 hour,中間不繞過 quality gate。
**Source of truth**: `specs/001-superspec-baseline/quickstart.md` Step 4

> Run on a clean feature branch (NOT this baseline branch). The walkthrough should produce a `specs/<NNN-feature-name>/` artifact set as evidence; this stopwatch tracks elapsed time only.

### Run — adopter's first feature

- [ ] **Run pending** (manual)

| Field | Value |
|---|---|
| Date | _YYYY-MM-DD_ |
| Host platform | _macOS Apple Silicon / WSL2 Ubuntu_ |
| Feature description (短句) | _e.g., "GET /echo endpoint with ?msg= param"_ |
| Branch created | _e.g., `002-echo-endpoint`_ |
| `/speckit-specify` start | _HH:MM:SS_ |
| `/speckit-clarify` start | _HH:MM:SS_ |
| `/speckit-plan` start | _HH:MM:SS_ |
| `/speckit-tasks` start | _HH:MM:SS_ |
| Human review of spec/plan finished | _HH:MM:SS_ |
| `/speckit-implement` start | _HH:MM:SS_ |
| `/speckit-implement` finished (all quality gates green) | _HH:MM:SS_ |
| Total elapsed | _HH:MM:SS_ (target ≤ 1:00:00) |
| Notes / blockers | _free-form_ |

### Phase breakdown(optional)

For diagnosing where time was spent:

| Phase | Elapsed | Notes |
|---|---|---|
| specify (incl. clarify Q&A) | _MM:SS_ | _e.g., 5 mins / 5 questions_ |
| plan + tasks generation | _MM:SS_ | _includes research + design artifacts_ |
| human review | _MM:SS_ | _read spec + plan; sanity check_ |
| implement (TDD RED-GREEN per task) | _MM:SS_ | _includes test runs_ |

### SC-007 verification

- [ ] Total elapsed ≤ 1:00:00 — SC-007 verified.
- [ ] All quality gates passed (`make test`, `make typecheck`, `make lint`) — SC-007 + Quality Gates contract verified together.
- [ ] No SDD pipeline step skipped — Constitution Principle V honored.

## Fresh-eyes onboarding (third-party reproduction)

**Purpose**: SC-001 + SC-007 cross-validation by someone who **did NOT author this baseline**. Author bias is the single biggest threat to "works on a clean machine" claims; this section captures whether the template actually works for someone seeing it for the first time.

**Source of truth**: `specs/001-superspec-baseline/quickstart.md` (entire walkthrough).

> Run by: a colleague / open-source visitor / new hire who has never opened this repo before. Goal: see if they can reach `/health = 200` and ship a first SDD feature using only README + quickstart, with no live help from the original author.

### Run — fresh-eyes 1

- [ ] **Run pending** (manual)

| Field | Value |
|---|---|
| Date | _YYYY-MM-DD_ |
| Reviewer (name / role / 是否曾接觸 spec-kit) | _e.g., "Alice, backend dev, never used spec-kit"_ |
| Host platform | _macOS Apple Silicon / WSL2 Ubuntu_ |
| Time started | _HH:MM_ |
| First-build elapsed | _MM:SS_ (target ≤ 15:00 — SC-001) |
| `/health` 200 reached | _HH:MM:SS_ |
| First SDD feature shipped | _HH:MM:SS_ (target ≤ 1:00:00 from start — SC-007) |
| Total elapsed | _HH:MM:SS_ |
| Blockers encountered | _free-form;use bullet list_ |
| Surprises (positive & negative) | _free-form_ |
| Documentation gaps identified | _list of README / quickstart sections that needed clarification_ |
| Verbatim quote (most useful feedback) | _e.g., "I almost gave up at step X because Y was missing"_ |

### Action items

- [ ] If `Blockers encountered` is non-empty: open follow-up issue per blocker, link from this row.
- [ ] If `Documentation gaps identified` is non-empty: open a doc-improvement task referencing the section name.
- [ ] If timings exceed SC-001 / SC-007 targets: surface to the next baseline amendment cycle (constitution.md `Last Amended` review).

### Run — fresh-eyes 2 (optional)

- [ ] **Optional second run** (different platform / different reviewer profile to triangulate)

(Same field schema as above — copy if needed.)
