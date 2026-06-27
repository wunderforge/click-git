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
