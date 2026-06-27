import * as assert from "assert";
import * as vscode from "vscode";

suite("Click Git extension", () => {
  test("registers stage command", async () => {
    const extension = vscode.extensions.getExtension("wunderforge.click-git");
    assert.ok(extension, "development extension should be discoverable");
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("clickGit.stageFolder"));
  });
});
