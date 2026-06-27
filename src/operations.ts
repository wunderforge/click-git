import { runGit } from "./gitRunner";
import { discoverRepositories, resolveRepository, type ResolvedRepository } from "./repositoryResolver";

export interface PullOptions {
  ffOnly: boolean;
}

export interface PullNestedOptions extends PullOptions {
  maxDepth: number;
  includeDirtyRepos: boolean;
}

export interface PullNestedSummary {
  succeeded: string[];
  skipped: Array<{ repoRoot: string; reason: string }>;
  failed: Array<{ repoRoot: string; reason: string }>;
}

export async function stageFolder(selectedPath: string): Promise<ResolvedRepository> {
  const resolved = await resolveRepository(selectedPath);
  await runGit(resolved.repoRoot, ["add", "--", resolved.pathspec]);
  return resolved;
}

export async function unstageFolder(selectedPath: string): Promise<ResolvedRepository> {
  const resolved = await resolveRepository(selectedPath);
  await runGit(resolved.repoRoot, ["restore", "--staged", "--", resolved.pathspec]);
  return resolved;
}

export async function restoreFolder(selectedPath: string): Promise<ResolvedRepository> {
  const resolved = await resolveRepository(selectedPath);
  await runGit(resolved.repoRoot, ["restore", "--", resolved.pathspec]);
  return resolved;
}

export async function statusFolder(selectedPath: string): Promise<{ resolved: ResolvedRepository; output: string }> {
  const resolved = await resolveRepository(selectedPath);
  const result = await runGit(resolved.repoRoot, ["status", "--short", "--", resolved.pathspec]);
  return { resolved, output: result.stdout.trimEnd() };
}

export async function diffFolder(selectedPath: string): Promise<{ resolved: ResolvedRepository; output: string }> {
  const resolved = await resolveRepository(selectedPath);
  const result = await runGit(resolved.repoRoot, ["diff", "--", resolved.pathspec]);
  return { resolved, output: result.stdout.trimEnd() };
}

export async function commitFolder(selectedPath: string, message: string, autoStage: boolean): Promise<{ resolved: ResolvedRepository; commit: string }> {
  if (message.trim() === "") {
    throw new Error("Commit message is required.");
  }

  const resolved = await resolveRepository(selectedPath);
  if (autoStage) {
    await runGit(resolved.repoRoot, ["add", "--", resolved.pathspec]);
  }

  const staged = await runGit(resolved.repoRoot, ["diff", "--cached", "--name-only", "--", resolved.pathspec]);
  if (staged.stdout.trim() === "") {
    throw new Error("No staged changes found under the selected folder.");
  }

  await runGit(resolved.repoRoot, ["commit", "-m", message, "--", resolved.pathspec]);
  const head = await runGit(resolved.repoRoot, ["rev-parse", "--short", "HEAD"]);
  return { resolved, commit: head.stdout.trim() };
}

export async function pullRepo(selectedPath: string, options: PullOptions): Promise<{ resolved: ResolvedRepository; output: string }> {
  const resolved = await resolveRepository(selectedPath);
  const args = ["pull"];
  if (options.ffOnly) {
    args.push("--ff-only");
  }

  const result = await runGit(resolved.repoRoot, args);
  return { resolved, output: `${result.stdout}${result.stderr}`.trimEnd() };
}

export async function pullNestedRepos(selectedPath: string, options: PullNestedOptions): Promise<PullNestedSummary> {
  const repos = await discoverRepositories(selectedPath, options.maxDepth);
  const summary: PullNestedSummary = { succeeded: [], skipped: [], failed: [] };

  for (const repoRoot of repos) {
    const status = await runGit(repoRoot, ["status", "--porcelain"]);
    if (!options.includeDirtyRepos && status.stdout.trim() !== "") {
      summary.skipped.push({ repoRoot, reason: "dirty" });
      continue;
    }

    const args = ["pull"];
    if (options.ffOnly) {
      args.push("--ff-only");
    }

    try {
      await runGit(repoRoot, args);
      summary.succeeded.push(repoRoot);
    } catch (error) {
      summary.failed.push({
        repoRoot,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  summary.succeeded.sort((a, b) => a.localeCompare(b));
  summary.skipped.sort((a, b) => a.repoRoot.localeCompare(b.repoRoot));
  summary.failed.sort((a, b) => a.repoRoot.localeCompare(b.repoRoot));
  return summary;
}
