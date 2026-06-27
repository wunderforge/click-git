import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFile } from "node:child_process";

export interface TempDir {
  path: string;
  cleanup: () => Promise<void>;
}

export async function createTempDir(prefix = "click-git-"): Promise<TempDir> {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix));
  return {
    path: dir,
    cleanup: async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  };
}

export async function git(cwd: string, args: string[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    execFile("git", args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${stderr.toString().trim() || error.message}\nargs: git ${args.join(" ")}\ncwd: ${cwd}`));
        return;
      }

      resolve(stdout.toString());
    });
  });
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, content, "utf8");
}

export async function initRepo(repoPath: string): Promise<void> {
  await fs.promises.mkdir(repoPath, { recursive: true });
  await git(repoPath, ["init", "-b", "main"]);
  await git(repoPath, ["config", "user.name", "Click Git Tests"]);
  await git(repoPath, ["config", "user.email", "click-git@example.test"]);
}

export async function commitAll(repoPath: string, message: string): Promise<void> {
  await git(repoPath, ["add", "--", "."]);
  await git(repoPath, ["commit", "-m", message]);
}

export async function status(repoPath: string, pathspec?: string): Promise<string[]> {
  const args = ["status", "--porcelain"];
  if (pathspec) {
    args.push("--", pathspec);
  }

  const output = await git(repoPath, args);
  return output.replace(/\r?\n$/, "").split(/\r?\n/).filter((line) => line.length > 0);
}
