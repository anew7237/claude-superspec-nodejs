## Summary

<!-- 1-3 sentences: what changed and why. Link to spec dir if applicable. -->

## Type of change

<!-- Tick one. If "trivial" / "fix" / "chore" — see Spec coverage section below. -->

- [ ] feat — new feature (requires SDD pipeline: specs/NNN-*/{spec,plan,tasks}.md)
- [ ] fix — bug fix
- [ ] chore — refactor / dependency / docs
- [ ] trivial — typo / single-line / lockfile-only
- [ ] toolchain-upgrade — bump pinned versions of spec-kit / Claude Code / superpowers / devcontainer features (see "Toolchain upgrade" section below)

## Spec coverage

<!-- Required for non-trivial PRs. Per FR-004 + SC-003. -->

- [ ] This PR is linked to a spec directory: `specs/<NNN-feature-name>/`
- [ ] OR — reviewer has approved a trivial exemption (see Reviewer note below)

**Linked spec dir** (or N/A): `_____`

## Container parity

<!-- Per Constitution Principle III + SC-008. -->

- [ ] All quality gates (test / typecheck / lint) ran inside the dev container, not on the host
- [ ] OR — disclose host-only run here: `_____`

## Reviewer note

<!-- Per FR-013 + Clarification Q2: at least one human reviewer (may be author). -->

- [ ] Spec.md and plan.md (if present) have been read by a human reviewer
- [ ] Trivial exemption granted? If yes, rationale: `_____`

## Toolchain upgrade

<!-- ONLY fill this section if Type of change is "toolchain-upgrade". Skip otherwise. Per FR-019 + Quality Gates contract "Toolchain isolation". -->

This PR bumps a pinned version. Confirm:

- [ ] Diff touches ONLY the version-declaration site(s):
  - `.devcontainer/post-create.sh` (`SPEC_KIT_VERSION`), and/or
  - `.devcontainer/devcontainer.json` (`features` block versions), and/or
  - corresponding lockfiles regenerated (e.g. `pnpm-lock.yaml` after a Node feature bump that changes runtime).
- [ ] **No application code (`src/`) modified** in this PR.
- [ ] **No test (`tests/`) modified** in this PR (other than coincidental snapshot updates explicitly tied to the upgrade).
- [ ] Verified the commit can be safely reverted standalone (`git revert <hash>` would not require additional cleanup commits).
- [ ] Compatibility checked against the project's documented integration points (e.g. `/speckit-*` commands still work, `claude` CLI still functional, devcontainer still rebuilds).
- [ ] Constitutional toolchain pinning (`.specify/memory/constitution.md` 第 §「Reference Implementation Notes」 + version pin in `post-create.sh`) is consistent with the new version.

> Reviewer guidance: if any "no application code modified" box can't be ticked, **request the author split the PR** — toolchain upgrade and feature work belong in separate commits / PRs (Constitution V + FR-019). The CI's `toolchain-isolation-check` advisory (T019) will surface this automatically.

## Checklist before merge

- [ ] CI green on both macOS and ubuntu runners (SC-002)
- [ ] No new `console.*` calls in `src/` (SC-009)
- [ ] No credentials / secrets in diff (SC-006; pre-merge gitleaks should also catch)
- [ ] Lockfile committed alongside any `package.json` change (FR-009)
