import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { commitFolder, diffFolder, getPushTarget, pullNestedRepos, pullRepo, pushRepo, restoreFolder, stageFolder, statusFolder, unstageFolder } from "../../src/operations";
import { commitAll, createTempDir, git, initRepo, status, writeFile, type TempDir } from "../helpers/gitFixture";

const temps: TempDir[] = [];

afterEach(async () => {
  await Promise.all(temps.splice(0).map((temp) => temp.cleanup()));
});

async function temp(): Promise<TempDir> {
  const created = await createTempDir();
  temps.push(created);
  return created;
}

async function createTwoFolderRepo(): Promise<{ repo: string; selected: string; outside: string }> {
  const root = await temp();
  const repo = root.path;
  await initRepo(repo);
  const selected = path.join(repo, "selected folder");
  const outside = path.join(repo, "outside");
  await writeFile(path.join(selected, "tracked.txt"), "base\n");
  await writeFile(path.join(selected, "delete-me.txt"), "delete\n");
  await writeFile(path.join(outside, "outside.txt"), "base\n");
  await commitAll(repo, "initial");
  return { repo, selected, outside };
}

describe("folder-scoped Git operations", () => {
  it("stages modified, deleted, and untracked files under selected folder only", async () => {
    const { repo, selected, outside } = await createTwoFolderRepo();
    await writeFile(path.join(selected, "tracked.txt"), "changed\n");
    await fs.promises.rm(path.join(selected, "delete-me.txt"));
    await writeFile(path.join(selected, "new file.txt"), "new\n");
    await writeFile(path.join(outside, "outside.txt"), "changed\n");

    await stageFolder(selected);

    expect((await status(repo)).sort()).toEqual([
      "D  \"selected folder/delete-me.txt\"",
      "A  \"selected folder/new file.txt\"",
      "M  \"selected folder/tracked.txt\"",
      " M outside/outside.txt"
    ].sort());
  });

  it("unstages selected folder without unstaging outside files", async () => {
    const { repo, selected, outside } = await createTwoFolderRepo();
    await writeFile(path.join(selected, "tracked.txt"), "selected\n");
    await writeFile(path.join(outside, "outside.txt"), "outside\n");
    await git(repo, ["add", "--", "."]);

    await unstageFolder(selected);

    expect((await status(repo)).sort()).toEqual([
      " M \"selected folder/tracked.txt\"",
      "M  outside/outside.txt"
    ].sort());
  });

  it("commits only the selected folder and leaves unrelated staged files staged", async () => {
    const { repo, selected, outside } = await createTwoFolderRepo();
    await writeFile(path.join(selected, "tracked.txt"), "selected\n");
    await writeFile(path.join(outside, "outside.txt"), "outside\n");
    await git(repo, ["add", "--", "outside"]);

    const result = await commitFolder(selected, "commit selected", true);
    const committedFiles = await git(repo, ["show", "--name-only", "--format=", result.commit]);

    expect(committedFiles.trim().split(/\r?\n/)).toEqual(["selected folder/tracked.txt"]);
    expect(await status(repo)).toEqual(["M  outside/outside.txt"]);
  });

  it("restores tracked changes under selected folder and keeps untracked files", async () => {
    const { repo, selected, outside } = await createTwoFolderRepo();
    await writeFile(path.join(selected, "tracked.txt"), "selected\n");
    await writeFile(path.join(selected, "untracked.txt"), "keep\n");
    await writeFile(path.join(outside, "outside.txt"), "outside\n");

    await restoreFolder(selected);

    expect((await fs.promises.readFile(path.join(selected, "tracked.txt"), "utf8")).replace(/\r\n/g, "\n")).toBe("base\n");
    expect(await fs.promises.readFile(path.join(selected, "untracked.txt"), "utf8")).toBe("keep\n");
    expect((await status(repo)).sort()).toEqual([" M outside/outside.txt", "?? \"selected folder/untracked.txt\""].sort());
  });

  it("status and diff are scoped to selected folder", async () => {
    const { selected, outside } = await createTwoFolderRepo();
    await writeFile(path.join(selected, "tracked.txt"), "selected\n");
    await writeFile(path.join(outside, "outside.txt"), "outside\n");

    const statusResult = await statusFolder(selected);
    const diffResult = await diffFolder(selected);

    expect(statusResult.output).toContain("selected folder/tracked.txt");
    expect(statusResult.output).not.toContain("outside");
    expect(diffResult.output).toContain("selected");
    expect(diffResult.output).not.toContain("outside");
  });
});

describe("nested repository pull", () => {
  it("pulls a selected subfolder at the owning repo root", async () => {
    const root = await temp();
    const { local, seed } = await createRemoteBackedRepo(root.path, "single");
    await writeFile(path.join(seed, "selected", "remote.txt"), "remote\n");
    await git(seed, ["add", "--", "."]);
    await git(seed, ["commit", "-m", "remote update"]);
    await git(seed, ["push"]);

    const result = await pullRepo(path.join(local, "selected"), { ffOnly: true });

    expect(result.resolved.repoRoot).toBe(local);
    expect(result.resolved.pathspec).toBe("selected");
    expect(await fs.promises.readFile(path.join(local, "selected", "remote.txt"), "utf8")).toContain("remote");
  });

  it("summarizes succeeded, skipped, and failed nested repos", async () => {
    const root = await temp();
    const workspace = path.join(root.path, "workspace");
    const remotes = path.join(root.path, "remotes");
    await fs.promises.mkdir(workspace, { recursive: true });
    const { local: clean, seed } = await createRemoteBackedRepo(workspace, "clean", remotes);
    const dirty = path.join(workspace, "dirty");
    const noRemote = path.join(workspace, "no-remote");
    await initRepo(dirty);
    await initRepo(noRemote);
    await writeFile(path.join(dirty, "file.txt"), "base\n");
    await writeFile(path.join(noRemote, "file.txt"), "base\n");
    await commitAll(dirty, "initial");
    await commitAll(noRemote, "initial");
    await writeFile(path.join(seed, "remote.txt"), "remote\n");
    await git(seed, ["add", "--", "."]);
    await git(seed, ["commit", "-m", "remote update"]);
    await git(seed, ["push"]);
    await writeFile(path.join(dirty, "file.txt"), "dirty\n");

    const summary = await pullNestedRepos(workspace, { ffOnly: true, maxDepth: 2, includeDirtyRepos: false });

    expect(summary.succeeded).toEqual([clean]);
    expect(summary.skipped).toEqual([{ repoRoot: dirty, reason: "dirty" }]);
    expect(summary.failed.map((failure) => failure.repoRoot)).toEqual([noRemote]);
    expect(await fs.promises.readFile(path.join(clean, "remote.txt"), "utf8")).toContain("remote");
  });
});

describe("safe repository push", () => {
  it("pushes the owning repository to the current branch upstream", async () => {
    const root = await temp();
    const { bare, local } = await createRemoteBackedRepo(root.path, "pushable");
    await writeFile(path.join(local, "selected", "local.txt"), "local\n");
    await git(local, ["add", "--", "."]);
    await git(local, ["commit", "-m", "local update"]);
    const localHead = (await git(local, ["rev-parse", "HEAD"])).trim();

    const target = await getPushTarget(path.join(local, "selected"));
    const result = await pushRepo(target);

    expect(target.resolved.repoRoot).toBe(local);
    expect(target.resolved.pathspec).toBe("selected");
    expect(target.branch).toBe("main");
    expect(target.upstream).toBe("origin/main");
    expect(result.target).toBe(target);
    expect((await git(bare, ["rev-parse", "main"])).trim()).toBe(localHead);
  });

  it("fails closed when the current branch has no upstream", async () => {
    const root = await temp();
    const repo = path.join(root.path, "no-upstream");
    await initRepo(repo);
    await writeFile(path.join(repo, "selected", "file.txt"), "base\n");
    await commitAll(repo, "initial");

    await expect(getPushTarget(path.join(repo, "selected"))).rejects.toThrow(/No upstream configured/);
  });

  it("fails closed from detached HEAD", async () => {
    const root = await temp();
    const { local } = await createRemoteBackedRepo(root.path, "detached");
    const head = (await git(local, ["rev-parse", "HEAD"])).trim();
    await git(local, ["checkout", "--detach", head]);

    await expect(getPushTarget(path.join(local, "selected"))).rejects.toThrow(/named current branch/);
  });

  it("does not guess origin or set upstream automatically", async () => {
    const root = await temp();
    const bare = path.join(root.path, "origin.git");
    const repo = path.join(root.path, "local");
    await fs.promises.mkdir(bare, { recursive: true });
    await git(bare, ["init", "--bare", "-b", "main"]);
    await initRepo(repo);
    await git(repo, ["remote", "add", "origin", bare]);
    await writeFile(path.join(repo, "selected", "file.txt"), "base\n");
    await commitAll(repo, "initial");

    await expect(getPushTarget(path.join(repo, "selected"))).rejects.toThrow(/No upstream configured/);
    await expect(git(repo, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])).rejects.toThrow();
  });
});

async function createRemoteBackedRepo(parent: string, name: string, remoteParent = parent): Promise<{ bare: string; seed: string; local: string }> {
  const bare = path.join(remoteParent, `${name}.git`);
  const seed = path.join(remoteParent, `${name}-seed`);
  const local = path.join(parent, name);

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
