import * as vscode from "vscode";
import * as path from "node:path";
import {
  commitFolder,
  diffFolder,
  pullNestedRepos,
  pullRepo,
  restoreFolder,
  stageFolder,
  statusFolder,
  unstageFolder,
  type PullNestedSummary
} from "./operations";

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel("Click Git");

  const register = (command: string, handler: (uri?: vscode.Uri) => Promise<unknown>): void => {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, async (uri?: vscode.Uri) => {
        try {
          ensureTrustedWorkspace();
          return await handler(uri);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          output.appendLine(`[error] ${message}`);
          void vscode.window.showErrorMessage(message, "Show Output").then((choice) => {
            if (choice === "Show Output") {
              output.show(true);
            }
          });
          throw error;
        }
      })
    );
  };

  register("clickGit.stageFolder", async (uri) => {
    const target = getTargetPath(uri);
    const resolved = await withProgress("Click Git: staging folder", () => stageFolder(target));
    output.appendLine(`Staged ${resolved.pathspec} in ${resolved.repoRoot}`);
    void vscode.window.showInformationMessage(`Staged folder: ${resolved.pathspec}`);
    return resolved;
  });

  register("clickGit.unstageFolder", async (uri) => {
    const target = getTargetPath(uri);
    const resolved = await withProgress("Click Git: unstaging folder", () => unstageFolder(target));
    output.appendLine(`Unstaged ${resolved.pathspec} in ${resolved.repoRoot}`);
    void vscode.window.showInformationMessage(`Unstaged folder: ${resolved.pathspec}`);
    return resolved;
  });

  register("clickGit.commitFolder", async (uri) => {
    const target = getTargetPath(uri);
    const message = await vscode.window.showInputBox({
      prompt: "Commit message for selected folder",
      ignoreFocusOut: true
    });
    if (message === undefined) {
      output.appendLine("Commit canceled.");
      return undefined;
    }
    if (message.trim() === "") {
      void vscode.window.showWarningMessage("Commit message is required.");
      return undefined;
    }

    const autoStage = vscode.workspace.getConfiguration("clickGit").get<boolean>("commit.autoStageFolder", true);
    const result = await withProgress("Click Git: committing folder", () => commitFolder(target, message, autoStage));
    output.appendLine(`Committed ${result.resolved.pathspec} in ${result.resolved.repoRoot}: ${result.commit}`);
    void vscode.window.showInformationMessage(`Committed folder ${result.resolved.pathspec}: ${result.commit}`);
    return result;
  });

  register("clickGit.restoreFolder", async (uri) => {
    const target = getTargetPath(uri);
    const choice = await vscode.window.showWarningMessage(
      "Restore tracked changes under the selected folder? Untracked files will be kept.",
      { modal: true },
      "Restore"
    );
    if (choice !== "Restore") {
      output.appendLine("Restore canceled.");
      return undefined;
    }

    const resolved = await withProgress("Click Git: restoring folder", () => restoreFolder(target));
    output.appendLine(`Restored tracked changes under ${resolved.pathspec} in ${resolved.repoRoot}`);
    void vscode.window.showInformationMessage(`Restored folder: ${resolved.pathspec}`);
    return resolved;
  });

  register("clickGit.statusFolder", async (uri) => {
    const target = getTargetPath(uri);
    const result = await statusFolder(target);
    const body = result.output === "" ? "(clean)" : result.output;
    output.appendLine(`Status for ${result.resolved.pathspec} in ${result.resolved.repoRoot}`);
    output.appendLine(body);
    output.show(true);
    return result;
  });

  register("clickGit.diffFolder", async (uri) => {
    const target = getTargetPath(uri);
    const result = await diffFolder(target);
    const body = result.output === "" ? "(no working tree diff)" : result.output;
    output.appendLine(`Diff for ${result.resolved.pathspec} in ${result.resolved.repoRoot}`);
    output.appendLine(body);
    output.show(true);
    return result;
  });

  register("clickGit.pullRepo", async (uri) => {
    const target = getTargetPath(uri);
    const ffOnly = vscode.workspace.getConfiguration("clickGit").get<boolean>("pull.ffOnly", true);
    const result = await withProgress("Click Git: pulling repository", () => pullRepo(target, { ffOnly }));
    output.appendLine(`Pulled repository ${result.resolved.repoRoot}`);
    if (result.resolved.pathspec !== ".") {
      output.appendLine(`Note: pull is repository-scoped; selected folder was ${result.resolved.pathspec}.`);
    }
    output.appendLine(result.output || "(up to date)");
    output.show(true);
    return result;
  });

  register("clickGit.pullNestedRepos", async (uri) => {
    const target = getTargetPath(uri);
    const config = vscode.workspace.getConfiguration("clickGit");
    const summary = await withProgress("Click Git: pulling nested repositories", () =>
      pullNestedRepos(target, {
        ffOnly: config.get<boolean>("pull.ffOnly", true),
        maxDepth: config.get<number>("pullNested.maxDepth", 4),
        includeDirtyRepos: config.get<boolean>("pullNested.includeDirtyRepos", false)
      })
    );
    writePullNestedSummary(output, summary);
    output.show(true);
    return summary;
  });

  context.subscriptions.push(output);
}

export function deactivate(): void {
  // No resources to release.
}

function ensureTrustedWorkspace(): void {
  if (!vscode.workspace.isTrusted) {
    throw new Error("Click Git requires a trusted workspace before running Git commands.");
  }
}

function getTargetPath(uri?: vscode.Uri): string {
  if (uri?.scheme === "file") {
    return uri.fsPath;
  }

  const editorUri = vscode.window.activeTextEditor?.document.uri;
  if (editorUri?.scheme === "file") {
    return path.dirname(editorUri.fsPath);
  }

  const firstWorkspace = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (firstWorkspace?.scheme === "file") {
    return firstWorkspace.fsPath;
  }

  throw new Error("Select a file or folder before running Click Git.");
}

async function withProgress<T>(title: string, task: () => Promise<T>): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false
    },
    task
  );
}

function writePullNestedSummary(output: vscode.OutputChannel, summary: PullNestedSummary): void {
  output.appendLine("Pull nested repositories summary");
  output.appendLine(`Succeeded: ${summary.succeeded.length}`);
  for (const repo of summary.succeeded) {
    output.appendLine(`  OK ${repo}`);
  }
  output.appendLine(`Skipped: ${summary.skipped.length}`);
  for (const skipped of summary.skipped) {
    output.appendLine(`  SKIP ${skipped.repoRoot} (${skipped.reason})`);
  }
  output.appendLine(`Failed: ${summary.failed.length}`);
  for (const failed of summary.failed) {
    output.appendLine(`  FAIL ${failed.repoRoot} (${failed.reason})`);
  }
}
