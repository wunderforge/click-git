# Click Git

Click Git is a VS Code extension for Explorer context-menu Git commands scoped to the folder you select.

## Features

- `Click Git: Stage Folder`
- `Click Git: Unstage Folder`
- `Click Git: Commit Folder`
- `Click Git: Restore Folder`
- `Click Git: Status Folder`
- `Click Git: Diff Folder`
- `Click Git: Pull Repo`
- `Click Git: Pull Nested Repos`

Git pull is repository-scoped. If you run Pull Repo from a subfolder, Click Git resolves the owning repository and pulls at the repo root. It does not claim to protect against Git commands run from terminals, VS Code SCM, other extensions, or external Git clients.

## Safety Model

- Folder-scoped commands use explicit Git pathspecs.
- Pull commands are repository-scoped and default to `--ff-only`.
- Restore keeps untracked files by default.
- The extension requires a trusted workspace before it runs Git commands.
- The MVP does not install Git hooks, mutate `skip-worktree`, rewrite commits, or change repository configuration.

## Settings

- `clickGit.pull.ffOnly`: use `--ff-only` for pull commands. Default: `true`.
- `clickGit.pullNested.maxDepth`: maximum directory depth for nested repository discovery. Default: `4`.
- `clickGit.pullNested.includeDirtyRepos`: pull nested repositories with uncommitted changes. Default: `false`.
- `clickGit.commit.autoStageFolder`: stage the selected folder before committing it. Default: `true`.

## Development

```powershell
npm install
npm run compile
npm test
.\scripts\check.ps1
```

## Manual VS Code Smoke Test

1. Open this folder in VS Code.
2. Press `F5` and choose `Run Click Git Extension`.
3. In the Extension Development Host, open any folder that contains a Git repository.
4. Right-click a folder in Explorer and run one of the `Click Git:*` commands.
5. For status, diff, pull, and nested pull, inspect the `Click Git` output channel.

Fast disposable repo setup:

```powershell
$tmp = Join-Path $env:TEMP "click-git-manual"
Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$tmp\repo\selected","$tmp\repo\outside" | Out-Null
Set-Location "$tmp\repo"
git init -b main
git config user.name "Click Git Manual"
git config user.email "manual@click-git.test"
"base" | Set-Content selected\file.txt
"base" | Set-Content outside\file.txt
git add .
git commit -m initial
"changed" | Set-Content selected\file.txt
"outside" | Set-Content outside\file.txt
code "$tmp\repo"
```

Expected quick check:

- Right-click `selected` and run `Click Git: Stage Folder`.
- `git status --porcelain` should show `M  selected/file.txt` and ` M outside/file.txt`.

## Publishing

See [docs/PUBLISHING.md](docs/PUBLISHING.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
