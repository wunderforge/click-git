# Click Git TODO

## Next Candidate: Safe Push Repo

Add `Click Git: Push Repo` as a repository-scoped command after the current Marketplace media release.

Decision:

- Use the current branch's configured upstream as the push target.
- Run plain `git push` from the owning repository root.
- Show a confirmation prompt with repository path, current branch, and upstream before pushing.
- Fail closed when no upstream is configured.

Tradeoffs:

- Do not default to `origin`; multi-remote repositories often use `origin`, `upstream`, forks, mirrors, or work remotes differently.
- Do not choose among multiple remotes; Git upstream tracking is the source of truth.
- Do not automatically run `git push --set-upstream`; setting publishing policy is outside the MVP.
- Do not support force push, tag push, push-all, or nested bulk push in the first version.

Potential setting:

- `clickGit.push.confirmBeforePush`: default `true`.

Quality gates:

- Unit tests for upstream detection, no-upstream failure, and command construction.
- Git fixture tests for successful upstream push to a local bare remote.
- Git fixture tests proving no remote is guessed when upstream is absent.
- README and PRD copy must keep push described as repository-scoped, not folder-scoped.
