# Publishing Click Git

This guide describes how to publish Click Git to the Visual Studio Marketplace and how to share a local VSIX build.

Official references:

- [VS Code: Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code: Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)

## 1. Preflight

Run the full local gate:

```powershell
npm install
.\scripts\check.ps1
```

Expected outputs:

- lint passes;
- TypeScript compile/typecheck passes;
- Vitest unit and Git fixture tests pass;
- VS Code Extension Host tests pass;
- `click-git-0.0.1.vsix` is generated.

Before public release, also do the manual smoke test in `README.md`.

## 2. Verify Marketplace Metadata

Check `package.json`:

- `name`: `click-git`
- `publisher`: `wunderforge`
- `displayName`: `Click Git`
- `description`: concise Marketplace summary
- `version`: SemVer, unique for every publish
- `license`: `MIT`
- `repository`, `bugs`, and `homepage`: GitHub URLs
- `icon`: `media/icon.png`

Check public docs:

- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `media/demo.gif`
- `media/screenshot-context-menu.png`
- `media/screenshot-stage-progress.png`

## 3. Package A VSIX

```powershell
npm run package
```

This creates:

```text
dist/click-git-<version>-<timestamp>.vsix
dist/latest-vsix.txt
```

Install locally for a final smoke test:

```powershell
$vsix = Get-Content .\dist\latest-vsix.txt
code --install-extension $vsix
```

Uninstall locally if needed:

```powershell
code --uninstall-extension wunderforge.click-git
```

## 4. Create Or Confirm Marketplace Publisher

Every Marketplace extension needs a publisher ID matching `package.json`.

1. Go to the [Visual Studio Marketplace publisher management page](https://marketplace.visualstudio.com/manage/publishers/).
2. Create or confirm publisher ID `wunderforge`.
3. Make sure the account you use has permission to publish under that publisher.

## 5. Authentication

For manual publishing, `vsce` can still use an Azure DevOps Personal Access Token with Marketplace Manage scope:

```powershell
npx vsce login wunderforge
```

Then paste the token when prompted.

Important: Microsoft documents that global Azure DevOps PATs retire on December 1, 2026. For long-term automated publishing, prefer Microsoft Entra ID based secure automated publishing, as described in the official VS Code publishing documentation.

## 6. Publish

Manual publish:

```powershell
npx vsce publish
```

Or publish an already packaged VSIX from the Marketplace management UI:

1. Open the publisher management page.
2. Select publisher `wunderforge`.
3. Upload the VSIX path listed in `dist/latest-vsix.txt`.

## 7. Version Updates

For future releases:

```powershell
npm version patch
.\scripts\check.ps1
npx vsce publish
```

You can also let `vsce` bump versions:

```powershell
npx vsce publish patch
```

Only publish a version once. Marketplace versions are immutable.

## 8. GitHub Release

Recommended:

1. Tag the release, for example `v0.0.1`.
2. Create a GitHub release.
3. Attach the VSIX path listed in `dist/latest-vsix.txt`.
4. Copy release notes from `CHANGELOG.md`.

## 9. Troubleshooting

- `ERROR Extension package is too large`: inspect `.vscodeignore`.
- `Publisher not found`: create or fix the publisher ID in Marketplace.
- `Personal Access Token verification failed`: confirm Azure DevOps token scope includes Marketplace Manage.
- `Version already exists`: bump `package.json` version and rebuild.
- Local VSIX install does not update: uninstall the old extension, then install the new VSIX.
