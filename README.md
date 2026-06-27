# Click Git

Click Git is a VS Code extension for Explorer context-menu Git commands scoped to the folder you select.

MVP commands:

- Stage Folder
- Unstage Folder
- Commit Folder
- Restore Folder
- Status Folder
- Diff Folder
- Pull Repo
- Pull Nested Repos

Git pull is repository-scoped. If you run Pull Repo from a subfolder, Click Git resolves the owning repository and pulls at the repo root. It does not claim to protect against Git commands run from terminals, VS Code SCM, other extensions, or external Git clients.

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
