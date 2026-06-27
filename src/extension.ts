import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("clickGit.stageFolder", () => {
      vscode.window.showInformationMessage("Click Git is starting up.");
    })
  );
}

export function deactivate(): void {
  // No resources to release.
}
