# Gotchas

Use gotchas only for project-specific traps that can cause false completion or repeated rework.

## Gotcha: Git Pull Is Not Path-Scoped

When working on: pull, sync, or push features.

Agents often get wrong: describing or implementing `git pull` or `git push` as if it can operate on a selected subfolder inside one repository.

Do this instead: make pull repository-scoped. If the selected folder is inside a repo, operate at the repo root and explain the boundary. For many repos, discover nested repo roots and pull each repo.

Quality gate: temp-repo test where selected folder is below repo root proves pull runs at owning repo root, not as a fake path pull.

Evidence: command invocation record or integration output showing `cwd=<repo-root>` and no pathspec passed to `git pull`.

## Gotcha: Git Push Must Not Guess A Remote

When working on: push features.

Agents often get wrong: defaulting to `origin`, adding `--set-upstream`, pushing tags, force-pushing, or describing push as folder-scoped.

Do this instead: resolve the clicked folder to the owning repo root, detect the current branch upstream, confirm the repo path/branch/upstream, then run plain `git push`. If no upstream exists, fail closed.

Quality gate: temp-repo test with a local bare remote proves upstream-based push succeeds; temp-repo test with an `origin` remote but no upstream proves Click Git refuses to guess.

Evidence: fixture output showing the bare remote updated only when upstream exists, plus no-upstream failure before push.

## Gotcha: Shell String Git Commands Can Corrupt Path Safety

When working on: command execution.

Agents often get wrong: building commands like `git add "${path}"` with shell interpolation.

Do this instead: use `spawn` or `execFile` with argument arrays and always place `--` before pathspecs.

Quality gate: unit test for paths with spaces and leading dash-like names; integration test with a folder named `feature work`.

Evidence: test output plus code review showing no shell string interpolation for Git command paths.

## Gotcha: Folder Commit Can Include Unrelated Staged Files

When working on: commit selected folder.

Agents often get wrong: running `git commit -m message` after staging the folder, which also commits unrelated files that were already staged.

Do this instead: use a pathspec-limited commit flow and test the case where unrelated staged files exist.

Quality gate: temp-repo test with `outside.txt` already staged and selected folder changes; resulting commit must exclude `outside.txt`.

Evidence: `git show --name-only --format=` for the new commit lists only selected folder paths.

## Gotcha: Restore Must Not Delete Untracked Files By Default

When working on: restore selected folder.

Agents often get wrong: treating restore like clean and deleting untracked files.

Do this instead: MVP restore only runs tracked-file restore. Any untracked deletion must be a separate explicit command and confirmation.

Quality gate: temp-repo test with a modified tracked file and an untracked file under selected folder; tracked file restores and untracked file remains.

Evidence: `git status --porcelain -- <path>` still shows the untracked file after restore.

## Gotcha: Nested Repos Need Real Boundaries

When working on: pull nested repositories.

Agents often get wrong: walking into `.git` internals or treating child files inside an already discovered repo as separate repos.

Do this instead: detect `.git` directory or file as a repo root, then stop descending into that repo unless a future setting explicitly enables deeper discovery.

Quality gate: fixture with parent folder containing multiple child repos and normal directories.

Evidence: pull summary lists each repo once and excludes `.git` internals.

## Gotcha: Dirty Pulls Must Be Deliberate

When working on: pull repo or pull nested repos.

Agents often get wrong: pulling dirty repos by default and creating avoidable merge/conflict states.

Do this instead: default to skip dirty repos for nested pulls and use `--ff-only` for pull.

Quality gate: fixture with dirty nested repo is reported as skipped and unchanged.

Evidence: summary separates succeeded, skipped dirty, and failed repos.

## Gotcha: Click Git Does Not Control External Git Clients

When working on: docs, notifications, release copy, or safety claims.

Agents often get wrong: implying the MVP enforces folder isolation across terminals, VS Code SCM, aliases, hooks, or other Git clients.

Do this instead: say Click Git scopes only the explicit commands it runs. Strong enforcement through hooks or index flags is future roadmap work and must not be marketed as MVP behavior.

Quality gate: docs/release review checks that user-facing copy does not claim external enforcement.

Evidence: review output or test snapshot covering UI copy for safety wording.

## Gotcha: Workspace Trust Is A Behavior Gate

When working on: VS Code command activation and command execution.

Agents often get wrong: running Git commands in untrusted workspaces because CLI tests pass.

Do this instead: use VS Code workspace trust APIs and block or require trust before executing Git operations.

Quality gate: VS Code extension integration test for untrusted workspace behavior once scaffold exists.

Evidence: test output proving Git execution is not attempted in an untrusted workspace.
