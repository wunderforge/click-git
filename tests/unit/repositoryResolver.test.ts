import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTempDir, initRepo, writeFile, type TempDir } from "../helpers/gitFixture";
import { discoverRepositories, resolveRepository, toGitPathspec } from "../../src/repositoryResolver";

const temps: TempDir[] = [];

afterEach(async () => {
  await Promise.all(temps.splice(0).map((temp) => temp.cleanup()));
});

async function temp(): Promise<TempDir> {
  const created = await createTempDir();
  temps.push(created);
  return created;
}

describe("repository resolution", () => {
  it("finds the owning repo from a nested selected folder and returns a POSIX pathspec", async () => {
    const root = await temp();
    await initRepo(root.path);
    const selected = path.join(root.path, "feature work", "weird [x] folder");
    await fs.promises.mkdir(selected, { recursive: true });

    const resolved = await resolveRepository(selected);

    expect(resolved.repoRoot).toBe(root.path);
    expect(resolved.pathspec).toBe("feature work/weird [x] folder");
  });

  it("uses dot as the repo-root pathspec", async () => {
    const root = await temp();
    await initRepo(root.path);

    const resolved = await resolveRepository(root.path);

    expect(resolved.pathspec).toBe(".");
  });

  it("rejects folders outside any repo", async () => {
    const root = await temp();
    await expect(resolveRepository(root.path)).rejects.toThrow("No Git repository found");
  });

  it("supports .git files", async () => {
    const root = await temp();
    await fs.promises.mkdir(path.join(root.path, "repo", "child"), { recursive: true });
    await writeFile(path.join(root.path, "repo", ".git"), "gitdir: ../actual.git\n");

    const resolved = await resolveRepository(path.join(root.path, "repo", "child"));

    expect(resolved.repoRoot).toBe(path.join(root.path, "repo"));
    expect(resolved.pathspec).toBe("child");
  });

  it("converts platform separators to Git path separators", () => {
    expect(toGitPathspec(path.join("a", "b", "c"))).toBe("a/b/c");
  });
});

describe("nested repo discovery", () => {
  it("finds repos without descending into discovered repositories", async () => {
    const root = await temp();
    await initRepo(path.join(root.path, "one"));
    await initRepo(path.join(root.path, "two"));
    await initRepo(path.join(root.path, "one", "nested-ignored"));

    const repos = await discoverRepositories(root.path, 3);

    expect(repos.sort()).toEqual([path.join(root.path, "one"), path.join(root.path, "two")].sort());
  });
});
