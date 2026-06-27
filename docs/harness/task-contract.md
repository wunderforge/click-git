# Task Contract

Use this compact contract before implementation tasks. Keep mission, target, and primary acceptance criteria near the top.

```md
# Task

Mission: <what changes and why>
Target: <repo/module/files if known>
User value: <what becomes better for the user>

Acceptance criteria:
- <observable outcome 1>
- <observable outcome 2>

Quality gates:
- <mechanically checkable, application-relevant gate>

Evidence required:
- <temp Git repo test, VS Code extension test, computer-use smoke, command output, etc.>

Constraints:
- Do not claim path-scoped pull/push inside one repo.
- Do not affect files outside the selected folder unless explicitly accepted and tested.
- Use real Git fixtures for Git behavior.

Known gotchas:
- <project-specific trap from docs/harness/gotchas.md>
```

## Example: Stage Folder

Mission: Add Explorer command to stage only the selected folder.
Target: command registration, Git command runner, tests.
User value: user can right-click a folder and stage its changes without staging unrelated files.

Acceptance criteria:

- `git add -- <selected-relative-path>` runs in the owning repository.
- Modified, deleted, and untracked files under the selected folder are staged.
- Changes outside the selected folder remain unstaged.

Quality gates:

- Temp-repo integration test proves outside files remain unstaged.
- VS Code command integration test invokes the command with a folder URI.
- `.\scripts\check.ps1` passes.

Evidence required:

- Focused test output.
- Full harness output.
