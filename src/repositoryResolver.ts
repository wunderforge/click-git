import * as fs from "node:fs";
import * as path from "node:path";

export interface ResolvedRepository {
  repoRoot: string;
  selectedPath: string;
  pathspec: string;
}

export function toGitPathspec(relativePath: string): string {
  if (relativePath === "") {
    return ".";
  }

  return relativePath.split(path.sep).join("/");
}

export function isInsideOrEqual(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function isGitRepositoryRoot(candidate: string): boolean {
  return fs.existsSync(path.join(candidate, ".git"));
}

export async function resolveRepository(selectedPath: string): Promise<ResolvedRepository> {
  let current = path.resolve(selectedPath);
  const stat = await fs.promises.stat(current);
  if (!stat.isDirectory()) {
    current = path.dirname(current);
  }

  const selected = current;
  let probe = current;

  while (true) {
    if (isGitRepositoryRoot(probe)) {
      const relative = path.relative(probe, selected);
      if (!isInsideOrEqual(probe, selected)) {
        throw new Error(`Selected path is outside repository: ${selected}`);
      }

      return {
        repoRoot: probe,
        selectedPath: selected,
        pathspec: toGitPathspec(relative)
      };
    }

    const parent = path.dirname(probe);
    if (parent === probe) {
      throw new Error(`No Git repository found for: ${selected}`);
    }

    probe = parent;
  }
}

export async function discoverRepositories(rootPath: string, maxDepth: number): Promise<string[]> {
  const root = path.resolve(rootPath);
  const repos: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    if (isGitRepositoryRoot(dir)) {
      repos.push(dir);
      return;
    }

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === ".git" || entry.name === "node_modules") {
        continue;
      }

      await walk(path.join(dir, entry.name), depth + 1);
    }
  }

  await walk(root, 0);
  return repos;
}
