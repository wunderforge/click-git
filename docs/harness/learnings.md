# Harness Learnings

Append an entry after meaningful tasks when something failed, slowed down, or required repeated steering.

## 2026-06-27 - Initial Harness

What failed or slowed down:

- The repository started with only a PRD and no package scripts or implementation, so behavior gates cannot yet execute real extension tests.

Gate outcome:

- Degraded until a VS Code extension scaffold, package scripts, and temp-repo tests exist.

Root cause in loop:

- Missing implementation and missing mechanical checks.

Harness amendment:

- Added `scripts/check.ps1` as the aggregate gate and documented required future test fixtures in `docs/harness/quality-gates.md`.

## Escalation Rule

- First occurrence: note it here.
- Second occurrence: add or update a gotcha.
- Third occurrence: add a mechanical check, fixture, or stronger evidence gate when possible.
