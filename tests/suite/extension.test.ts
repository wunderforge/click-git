import * as assert from "assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFile } from "node:child_process";
import * as vscode from "vscode";

suite("Click Git extension", () => {
  setup(async () => {
    const extension = vscode.extensions.getExtension("wunderforge.click-git");
    assert.ok(extension, "development extension should be discoverable");
    await extension.activate();
  });

  test("registers MVP commands", async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const command of [
      "clickGit.stageFolder",
      "clickGit.unstageFolder",
      "clickGit.commitFolder",
      "clickGit.restoreFolder",
      "clickGit.statusFolder",
      "clickGit.diffFolder",
      "clickGit.pullRepo",
      "clickGit.pullNestedRepos"
    ]) {
      assert.ok(commands.includes(command), `${command} should be registered`);
    }
  });

  test("invokes stage and status with a folder URI", async () => {
    const repo = await createRepo();
    try {
      const selected = path.join(repo, "selected");
      await writeFile(path.join(selected, "file.txt"), "changed\n");

      await vscode.commands.executeCommand("clickGit.stageFolder", vscode.Uri.file(selected));
      const status = await git(repo, ["status", "--porcelain"]);
      assert.ok(status.includes("M  selected/file.txt"));

      const result = await vscode.commands.executeCommand<{ output: string }>("clickGit.statusFolder", vscode.Uri.file(selected));
      assert.ok(result.output.includes("selected/file.txt"));
    } finally {
      await fs.promises.rm(repo, { recursive: true, force: true });
    }
  });
});

async function createRepo(): Promise<string> {
  const repo = await fs.promises.mkdtemp(path.join(os.tmpdir(), "click-git-vscode-"));
  await git(repo, ["init", "-b", "main"]);
  await git(repo, ["config", "user.name", "Click Git Tests"]);
  await git(repo, ["config", "user.email", "click-git@example.test"]);
  await writeFile(path.join(repo, "selected", "file.txt"), "base\n");
  await git(repo, ["add", "--", "."]);
  await git(repo, ["commit", "-m", "initial"]);
  return repo;
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, content, "utf8");
}

async function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.toString() || error.message));
        return;
      }
      resolve(stdout.toString());
    });
  });
}
