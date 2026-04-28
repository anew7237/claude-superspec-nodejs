# SDD Review Gate — `/speckit-implement` skill audit

**Purpose**: Confirm FR-013 ("/speckit-implement 前要求人類 reviewer 檢視 spec.md 與 plan.md") is enforced at the skill level — not just by the spec text.
**Audited by**: T009 of `specs/001-superspec-baseline/tasks.md`
**Audit date**: 2026-04-28

## Search procedure executed

1. `find ~/.claude/skills -type f -name "SKILL.md" -path "*speckit-implement*"` → no hits (not installed in user-global skills).
2. `find ./.claude/skills -type f -name "SKILL.md" -path "*speckit-implement*"` → **1 hit**: `/home/anew/x_Project/TEST-claude/claude-superspec-nodejs/.claude/skills/speckit-implement/SKILL.md`. Stopped here per "stop at first hit" rule.
3. `uv tool dir` + variants → not executed (step 2 already produced the canonical project-local copy; no need to fall back to broader filesystem scan).
4. Broader filesystem scan → not executed (same reason as step 3).

Supplementary checks executed for completeness:
- `find ./.claude -type f -name "*speckit-implement*"` → only the SKILL.md found in step 2 (no separate command-template form).
- `find ~/.claude -type f -name "*speckit-implement*"` → no hits.
- `find ./.specify -type f -name "*implement*"` → no hits (no separate `.specify/templates/` implement template in this project).

## Findings

**Skill location(s) found**: `/home/anew/x_Project/TEST-claude/claude-superspec-nodejs/.claude/skills/speckit-implement/SKILL.md`

**Review-prompt enforcement status**: **PARTIAL**

**Evidence**:

The skill's "Outline" step 3 instructs the AI to load context, but only `tasks.md` and `plan.md` are listed as **REQUIRED** — `spec.md` is **not mentioned at all** in the load list. Exact passage (lines 92–98):

> 3. Load and analyze the implementation context:
>    - **REQUIRED**: Read tasks.md for the complete task list and execution plan
>    - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
>    - **IF EXISTS**: Read data-model.md for entities and relationships
>    - **IF EXISTS**: Read contracts/ for API specifications and test requirements
>    - **IF EXISTS**: Read research.md for technical decisions and constraints
>    - **IF EXISTS**: Read quickstart.md for integration scenarios

Furthermore, the skill provides **no user-confirmation review gate** before task execution. The only `STOP / wait for user response` checkpoint in the entire skill (step 2, lines 81–90) fires only when **checklists are incomplete** — not as a generic "review spec.md + plan.md and confirm" gate. After that conditional checkpoint, the skill flows directly from step 3 (load context) into step 5 (parse tasks.md) and step 6 (execute implementation) without any human review handshake.

So FR-013 is partially met: `plan.md` is required reading, but `spec.md` is missing from the load list, and the explicit user-confirmation step demanded by FR-013 / Constitution Principle V is absent.

**File path** (best evidence): `/home/anew/x_Project/TEST-claude/claude-superspec-nodejs/.claude/skills/speckit-implement/SKILL.md`
**Last-modified date** (`stat -c %y`): `2026-04-28 02:11:05.772058000 +0800`

## Compensation (if MISSING or PARTIAL)

The skill does NOT fully enforce review, so the project compensates via runtime guidance in `CLAUDE.md` SPECKIT region — see [`CLAUDE.md`](../CLAUDE.md). Specifically the line:
> 跑 `/speckit-implement` 前,Claude 必須先 read spec.md 與 plan.md 並向 user 顯式確認

This line was added to the SPECKIT marker block by T009 alongside this audit.

## Recommendation

- [ ] If skill is ENFORCED: Document is audit-only, no further action.
- [x] If skill is PARTIAL/MISSING: Compensation via CLAUDE.md is sufficient for本 baseline; flag for future re-audit if spec-kit version bumps.
