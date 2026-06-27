# Quality Gates

This project's core risk is false confidence: a command can look right in VS Code while staging, committing, restoring, or pulling the wrong files. Every implementation task must choose the strongest relevant gate below.

## Gate Matrix

| Change type | Required first test | Required behavior gate | Required regression gate |
| --- | --- | --- | --- |
| Git pathspec command logic | Unit test around argument construction and repo-relative paths | Temp-repo integration test proving only selected paths changed | Full `.\scripts\check.ps1` |
| Repository discovery | Unit test for `.git` directory and `.git` file cases | Temp workspace with parent repo, nested repo, and non-repo folder | Full `.\scripts\check.ps1` |
| Stage/unstage | Failing fixture test before implementation | Real `git status --porcelain` proves outside paths unaffected | Full `.\scripts\check.ps1` |
| Commit folder | Failing fixture test for unrelated staged files | Real commit history proves commit touches selected path only | Full `.\scripts\check.ps1` |
| Restore folder | Failing destructive-flow test | Real repo proves tracked changes under path restore and untracked files remain unless explicitly requested | Full `.\scripts\check.ps1` |
| Status/diff | Snapshot or structured output test | Real repo proves scoped output excludes outside paths | Full `.\scripts\check.ps1` |
| Pull repo | Failing fixture with local bare remote | Real `git pull --ff-only` succeeds and reports upstream errors clearly | Full `.\scripts\check.ps1` |
| Push repo | Failing fixture with local bare remote and configured upstream | Real `git push` updates upstream; no-upstream repo fails closed without guessing `origin` | Full `.\scripts\check.ps1` |
| Pull nested repos | Failing fixture with multiple nested remotes | Summary proves succeeded, skipped dirty, and failed repos are separated | Full `.\scripts\check.ps1` |
| VS Code menu/command wiring | Extension integration test | Command invocation through VS Code test host | Full `.\scripts\check.ps1` |
| User-facing UI flow | Spec first | Automated command test plus VS Code test host; use computer-use sandbox for final smoke when UI matters | Full `.\scripts\check.ps1` |
| Workspace trust/security | Unit or VS Code integration test | Untrusted workspace disables or explicitly blocks Git operations | Full `.\scripts\check.ps1` |
| Packaging/release | Package script after scaffold exists | Extension package builds and installs into test host | Full `.\scripts\check.ps1` |

## TDD Rules

- New behavior starts with a failing test unless only documentation changes.
- The first test should describe the user-visible contract, not an internal helper.
- Use real Git repositories for behavior that depends on Git state.
- Mocking `child_process` is allowed only for error handling and argument plumbing; it cannot be the only proof for Git behavior.
- Every bug fix gets a regression test that fails on the old behavior.

## SDD Rules

SDD means specification-driven development for this repo.

- Update `docs/PRD.md` or a focused task contract before changing behavior.
- Name command semantics explicitly: selected path, owning repository, Git command, expected safety boundary.
- Specify destructive behavior before implementation, especially restore and clean-like operations.
- Define degraded behavior before coding: dirty repo skip, missing upstream, non-fast-forward pull, empty commit, untrusted workspace.

## Mandatory Fixture Scenarios

When the extension codebase exists, automated tests must create disposable repositories covering:

- one repo with changes inside and outside the selected folder;
- selected folder below repo root;
- selected folder equal to repo root;
- folder outside any Git repo;
- nested repositories under a parent folder;
- dirty nested repo that must be skipped by default during pull;
- bare remote with fast-forward pull;
- remote requiring merge where `--ff-only` must fail clearly;
- unrelated staged files present before folder commit;
- `.git` as a file, as used by worktrees and some submodule layouts;
- folder names with spaces;
- folder names with shell-special characters;
- missing Git executable or inaccessible Git binary;
- repository without upstream;
- user cancellation for restore and commit prompts;
- untrusted VS Code workspace.

## Computer-Use Sandbox Smoke

Use computer-use or VS Code UI smoke testing only after automated gates pass or when debugging command contribution issues.

Required UI smoke evidence for release candidates:

- Extension loads in a VS Code Extension Development Host.
- Explorer context menu exposes Click Git commands for folders.
- Running one command from the UI updates the temp repo as expected.
- Output channel shows command progress and errors.

Computer-use evidence cannot replace temp-repo integration tests.

## Release Confidence Levels

- `Prototype`: docs compile and command shapes are reviewed.
- `Testable`: package scripts and temp-repo tests exist; focused gates pass.
- `Candidate`: full harness passes, VS Code command integration passes, UI smoke passes.
- `Deliverable`: Candidate plus package verification, failure paths verified, and no degraded gates for MVP acceptance criteria.

Do not call an implementation "deliverable" until it reaches the Deliverable level.
