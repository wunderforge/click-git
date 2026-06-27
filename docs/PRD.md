# Click Git PRD

## 1. Product Summary

Click Git is a VS Code extension that lets users run common Git operations from the Explorer context menu against the folder they clicked.

The MVP focuses on path-specific local Git workflows:

- Stage or unstage only the selected folder.
- Commit only staged changes under the selected folder.
- Restore changes under the selected folder.
- View status or diff scoped to the selected folder.
- Pull one or many repositories when the selected folder is itself a repo root or contains multiple nested repos.

The MVP deliberately does not promise true "pull/push a subfolder" semantics inside a single Git repository. Git push and pull operate on commits and refs, not directories. The product should make path-scoped local operations easy first, then add guardrails and advanced repository-management flows in later releases.

## 2. Problem

Developers often work in folders that contain multiple repositories, monorepos, generated folders, examples, plugins, or experiment directories. VS Code's built-in Git UI is powerful, but it is organized around repositories and the SCM panel. When users are already navigating in the Explorer, they often want to right-click the folder in front of them and run the Git operation that matches that folder.

Common pain points:

- Staging a folder requires going to SCM or using a terminal command.
- Committing only a folder's changes is possible with Git, but easy to get wrong.
- Restoring a folder from the Explorer is not as explicit as `git restore -- path`.
- Pulling many nested repositories requires terminal loops or separate windows.
- A "single folder pull/push" expectation is easy to misunderstand because Git does not treat folders as independent transaction units inside one repository.
- Push requires more conservative handling than pull because it publishes local commits to a remote. In repositories with forks, mirrors, or multiple remotes, guessing `origin` can be wrong.

## 3. Goals

The MVP should:

- Add Explorer right-click commands for folder-scoped Git operations.
- Resolve the selected folder to the correct Git repository.
- Use safe Git commands with explicit pathspecs.
- Support multi-repo pull for a folder containing many nested Git repositories.
- Show clear progress, success, and failure messages in VS Code.
- Avoid modifying Git hooks, skip-worktree flags, or repository configuration in the first release.

## 4. Non-goals

The MVP will not:

- Implement true subfolder-only `git pull` or `git push` inside a single repository.
- Push commits to a remote in the first release.
- Guess a default push remote or branch when a branch has no upstream.
- Inject `pre-commit`, `pre-push`, or other Git hooks.
- Apply recursive `skip-worktree` or `assume-unchanged` flags.
- Rewrite commits to remove disallowed folder changes.
- Manage Git subtree or Git worktree conversion.
- Replace the VS Code SCM view.

These can be evaluated after users validate the simpler right-click workflow.

## 5. Target Users

- Developers working in workspaces that contain many small repositories.
- Developers navigating monorepos who want quick folder-scoped stage, commit, restore, and diff commands.
- AI-assisted coding users who often generate or modify files in a specific folder and want a faster review/commit loop.
- Power users who prefer Explorer context actions over typing Git pathspec commands.

## 6. MVP User Stories

### 6.1 Stage Selected Folder

As a developer, I can right-click a folder and choose "Click Git: Stage Folder" so only changes under that folder are staged.

Acceptance criteria:

- Runs `git add -- <relative-folder-path>` in the owning repository.
- Works for tracked, modified, deleted, and untracked files under the folder.
- Does not stage changes outside the selected folder.
- Shows an error when the selected folder is not inside a Git repository.

### 6.2 Unstage Selected Folder

As a developer, I can right-click a folder and choose "Click Git: Unstage Folder" so only staged changes under that folder are removed from the index.

Acceptance criteria:

- Runs `git restore --staged -- <relative-folder-path>`.
- Does not affect staged changes outside the selected folder.
- Reports success even when there is nothing staged under the folder.

### 6.3 Commit Selected Folder

As a developer, I can right-click a folder and choose "Click Git: Commit Folder" so I can commit only changes under that folder.

Acceptance criteria:

- Prompts for a commit message.
- Stages the selected folder before commit, or offers "commit staged changes under this folder only" as the default behavior.
- Blocks the commit if the folder has no staged or stageable changes.
- Runs `git commit -- <relative-folder-path>` or equivalent safe sequence so unrelated staged files are not accidentally included.
- Shows commit hash or a success message after commit.

### 6.4 Restore Selected Folder

As a developer, I can right-click a folder and choose "Click Git: Restore Folder" to discard local working tree changes under that folder.

Acceptance criteria:

- Shows a destructive-action confirmation.
- Runs `git restore -- <relative-folder-path>`.
- Offers a separate option to remove untracked files later; the MVP should not delete untracked files by default.
- Does not affect changes outside the folder.

### 6.5 Show Status For Selected Folder

As a developer, I can right-click a folder and choose "Click Git: Status Folder" to see path-scoped status.

Acceptance criteria:

- Runs `git status --short -- <relative-folder-path>`.
- Shows output in a dedicated "Click Git" output channel.
- Shows a friendly empty-state message when the folder is clean.

### 6.6 Show Diff For Selected Folder

As a developer, I can right-click a folder and choose "Click Git: Diff Folder" to inspect path-scoped changes.

Acceptance criteria:

- Runs `git diff -- <relative-folder-path>` for working tree changes.
- Optionally offers staged diff via `git diff --cached -- <relative-folder-path>`.
- Shows output in the "Click Git" output channel for MVP.
- Later versions may open native VS Code diff editors per changed file.

### 6.7 Pull Selected Repo

As a developer, I can right-click a folder that is a Git repository and choose "Click Git: Pull Repo" to pull that repository.

Acceptance criteria:

- Detects whether the selected folder is a repository root or inside a repository.
- If the selected folder is inside a repository, runs pull at the repository root and explains that pull is repository-scoped.
- Runs `git pull --ff-only` by default to avoid surprise merge commits.
- Shows progress and errors in the output channel.

### 6.8 Pull Nested Repositories

As a developer, I can right-click a parent folder and choose "Click Git: Pull Nested Repos" to update many repositories under it.

Acceptance criteria:

- Recursively discovers nested repositories by finding `.git` directories or files.
- Skips nested `.git` paths under already-discovered child repositories.
- Runs pulls sequentially by default to avoid credential and lock contention.
- Shows a summary with succeeded, skipped, and failed repositories.
- Lets users configure max depth in settings.

## 7. UX Surface

Explorer context menu commands for folders:

- `Click Git: Stage Folder`
- `Click Git: Unstage Folder`
- `Click Git: Commit Folder`
- `Click Git: Restore Folder`
- `Click Git: Status Folder`
- `Click Git: Diff Folder`
- `Click Git: Pull Repo`
- `Click Git: Pull Nested Repos`

Command palette should expose the same commands when a file or folder is selected in Explorer.

Output:

- Use a dedicated VS Code output channel named `Click Git`.
- Use VS Code progress notifications for long-running operations.
- Show concise completion notifications with a "Show Output" action on failure.

Settings:

- `clickGit.pull.ffOnly`: default `true`.
- `clickGit.pullNested.maxDepth`: default `4`.
- `clickGit.pullNested.includeDirtyRepos`: default `false`.
- `clickGit.commit.autoStageFolder`: default `true`.

Future push setting candidate:

- `clickGit.push.confirmBeforePush`: default `true`.

## 8. Technical Approach

### 8.1 Repository Resolution

Given a selected URI:

1. Walk upward from the selected path until a `.git` directory or `.git` file is found.
2. Treat that path as the owning repository root.
3. Compute the selected folder path relative to the repository root using POSIX separators for Git pathspecs.
4. Reject paths outside the repository root.

The extension may use the VS Code Git extension API when available, but the MVP should keep a CLI fallback because nested repositories are not always represented clearly in the active SCM view.

### 8.2 Git Command Execution

Use `child_process.spawn` or `execFile`, not shell string interpolation.

Required safety rules:

- Pass arguments as arrays.
- Always use `--` before pathspecs.
- Quote nothing manually.
- Set `cwd` to the resolved repository root.
- Stream stdout and stderr to the output channel.
- Serialize operations per repository to reduce `index.lock` conflicts.

Example command shapes:

- Stage: `git add -- <path>`
- Unstage: `git restore --staged -- <path>`
- Restore: `git restore -- <path>`
- Status: `git status --short -- <path>`
- Diff: `git diff -- <path>`
- Pull: `git pull --ff-only`

### 8.3 Commit Safety

The risky case is unrelated staged files already existing in the index. The MVP should avoid committing them accidentally.

Preferred flow:

1. Capture staged files outside the selected folder with `git diff --cached --name-only`.
2. If unrelated staged files exist, warn the user and offer to continue with a pathspec-limited commit.
3. Stage selected folder when `clickGit.commit.autoStageFolder` is enabled.
4. Run `git commit -m <message> -- <path>`.
5. Show the resulting commit summary.

### 8.4 Nested Repo Pull

Discovery:

- Walk the selected folder tree up to `clickGit.pullNested.maxDepth`.
- A repo root is any directory containing `.git` as a directory or file.
- When a repo is found, do not descend into its child directories for more repos unless a setting later enables deeper discovery.

Pull behavior:

- Skip dirty repos by default and show them as skipped.
- Run `git status --porcelain` before pull.
- Run `git pull --ff-only` for clean repos.
- Continue after failures and summarize at the end.

### 8.5 Future Safe Push Repo

`Click Git: Push Repo` is a recommended post-MVP candidate, but it should be repository-scoped and conservative.

Proposed behavior:

1. Resolve the clicked folder to its owning repository root.
2. Detect the current branch and its configured upstream.
3. If no upstream is configured, fail closed and tell the user to set upstream with Git CLI or VS Code Source Control.
4. If an upstream exists, show a confirmation prompt with repository path, current branch, and upstream.
5. Run plain `git push` from the repository root.

Decision:

- Use Git's branch upstream as the source of truth.
- Do not default to `origin`.
- Do not choose among multiple remotes.
- Do not automatically run `git push --set-upstream`.
- Do not support force push, tag push, push-all, or nested bulk push in the first push release.

Tradeoff:

This limits convenience for new branches without upstreams, but it avoids silently publishing commits to the wrong remote in multi-remote workflows. Click Git should reduce path navigation friction, not become the system that decides a repository's publishing policy.

## 9. Error Handling

Required error states:

- Git is not installed or not on PATH.
- Selected folder is not inside a Git repository.
- Repository has uncommitted changes and pull is configured to skip dirty repos.
- Pull fails due to non-fast-forward updates.
- Commit message is empty.
- Restore was canceled by the user.
- Future push command: repository has no upstream branch.

Errors should be actionable and include the repository path.

## 10. Security and Trust

The MVP should not install hooks or mutate hidden Git configuration. It should only run explicit Git commands requested by the user.

The extension should:

- Use VS Code workspace trust APIs.
- Disable operations in untrusted workspaces unless the user explicitly trusts the workspace.
- Avoid reading secret-bearing files.
- Avoid printing file contents in output unless the user requested a diff.

## 11. Future Roadmap

### Phase 2: Safe Repository Push

- Add `Click Git: Push Repo` as an upstream-based repository-scoped command.
- Confirm the repository path, current branch, and upstream before pushing.
- Fail closed when no upstream is configured.
- Keep push out of nested bulk operations until real users validate the need.
- Document clearly that push is repository-scoped and uses the current branch upstream.

### Phase 3: Stronger Path Guardrails

- Optional pre-commit hook installer to prevent commits touching protected folders.
- Optional pre-push scanner that blocks outgoing commits touching protected folders.
- Local `.git/click-git/locked-folders.json` state.
- Clear uninstall path for injected hooks.

### Phase 4: Pull Conflict Assistance

- Safer pull workflow for protected folders.
- Temporary unskip/reskip flow only when a user explicitly enables folder lock mode.
- Merge conflict UI integration.

### Phase 5: Advanced Repository Models

- Git subtree helper for true folder-to-remote workflows.
- Git worktree helper for branch isolation.
- Saved folder profiles for repeated operations.
- Multi-repo dashboard for parent folders.

## 12. MVP Success Metrics

- A user can install the extension and run folder stage, commit, restore, status, diff, and pull without opening a terminal.
- Folder-scoped operations do not affect files outside the selected path.
- Pull nested repos can update at least 10 repositories with clear per-repo reporting.
- No MVP operation writes Git hooks or persistent Git index flags.
- Users understand from UI copy that pull and push are repository-scoped in Git.

## 13. Recommended MVP Direction

Build the Explorer-first path-specific Git command extension now. Defer folder-locking, hook injection, and skip-worktree automation until real user workflows prove the need.

This direction is smaller, safer, and better aligned with the immediate product idea: right-click a folder and perform common Git operations against that folder. It also creates a clean foundation for the more advanced control model described in the research report without committing the first release to fragile Git internals.
