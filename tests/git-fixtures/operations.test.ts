import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { commitFolder, diffFolder, pullNestedRepos, restoreFolder, stageFolder, statusFolder, unstageFolder } from "../../src/operations";
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
  it("skips dirty repos by default and continues after failures", async () => {
    const root = await temp();
    const clean = path.join(root.path, "clean");
    const dirty = path.join(root.path, "dirty");
    const noRemote = path.join(root.path, "no-remote");
    await initRepo(clean);
    await initRepo(dirty);
    await initRepo(noRemote);
    await writeFile(path.join(clean, "file.txt"), "base\n");
    await writeFile(path.join(dirty, "file.txt"), "base\n");
    await writeFile(path.join(noRemote, "file.txt"), "base\n");
    await commitAll(clean, "initial");
    await commitAll(dirty, "initial");
    await commitAll(noRemote, "initial");
    await writeFile(path.join(dirty, "file.txt"), "dirty\n");

    const summary = await pullNestedRepos(root.path, { ffOnly: true, maxDepth: 2, includeDirtyRepos: false });

    expect(summary.skipped).toEqual([{ repoRoot: dirty, reason: "dirty" }]);
    expect(summary.failed.map((failure) => failure.repoRoot).sort()).toEqual([clean, noRemote].sort());
  });
});
