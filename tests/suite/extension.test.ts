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
      "clickGit.pushRepo",
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

  test("invokes push with a configured upstream", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "click-git-vscode-push-"));
    try {
      const { bare, local } = await createRemoteBackedRepo(root);
      await vscode.workspace.getConfiguration("clickGit").update("push.confirmBeforePush", false, vscode.ConfigurationTarget.Global);
      await writeFile(path.join(local, "selected", "pushed.txt"), "pushed\n");
      await git(local, ["add", "--", "."]);
      await git(local, ["commit", "-m", "push from command"]);
      const localHead = (await git(local, ["rev-parse", "HEAD"])).trim();

      const result = await vscode.commands.executeCommand<{ target: { branch: string; upstream: string } }>(
        "clickGit.pushRepo",
        vscode.Uri.file(path.join(local, "selected"))
      );

      assert.equal(result.target.branch, "main");
      assert.equal(result.target.upstream, "origin/main");
      assert.equal((await git(bare, ["rev-parse", "main"])).trim(), localHead);
    } finally {
      await vscode.workspace.getConfiguration("clickGit").update("push.confirmBeforePush", undefined, vscode.ConfigurationTarget.Global);
      await fs.promises.rm(root, { recursive: true, force: true });
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

async function createRemoteBackedRepo(parent: string): Promise<{ bare: string; seed: string; local: string }> {
  const bare = path.join(parent, "remote.git");
  const seed = path.join(parent, "seed");
  const local = path.join(parent, "local");
  await fs.promises.mkdir(bare, { recursive: true });
  await git(bare, ["init", "--bare", "-b", "main"]);
  await git(parent, ["clone", bare, seed]);
  await git(seed, ["config", "user.name", "Click Git Tests"]);
  await git(seed, ["config", "user.email", "click-git@example.test"]);
  await writeFile(path.join(seed, "selected", "file.txt"), "base\n");
  await git(seed, ["add", "--", "."]);
  await git(seed, ["commit", "-m", "initial"]);
  await git(seed, ["push", "-u", "origin", "main"]);
  await git(parent, ["clone", bare, local]);
  await git(local, ["config", "user.name", "Click Git Tests"]);
  await git(local, ["config", "user.email", "click-git@example.test"]);
  return { bare, seed, local };
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
