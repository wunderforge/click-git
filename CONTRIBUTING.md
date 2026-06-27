# Contributing

Thanks for helping improve Click Git.

## Development Loop

1. Read [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), and [docs/harness/quality-gates.md](docs/harness/quality-gates.md).
2. Keep behavior aligned with the MVP boundary: folder-scoped local Git commands and repository-scoped pull.
3. Add or update tests before changing Git behavior.
4. Run the full gate before handoff:

```powershell
.\scripts\check.ps1
```

## Quality Bar

- Use real temporary Git repositories for Git behavior.
- Use `execFile`/argument arrays for Git commands, never shell-interpolated pathspecs.
- Always use `--` before Git pathspecs.
- Do not claim folder-scoped pull or push inside a single repository.
- Do not add hook injection, `skip-worktree`, commit rewriting, or repository config mutation without updating the PRD and harness first.

## Pull Requests

Include:

- what changed;
- which acceptance criteria are covered;
- exact test commands run;
- any degraded or skipped gates.
