import { execFile } from "node:child_process";

export interface GitResult {
  stdout: string;
  stderr: string;
}

export class GitError extends Error {
  public readonly cwd: string;
  public readonly args: string[];
  public readonly stdout: string;
  public readonly stderr: string;
  public readonly exitCode: number | null;

  public constructor(message: string, cwd: string, args: string[], stdout: string, stderr: string, exitCode: number | null) {
    super(message);
    this.name = "GitError";
    this.cwd = cwd;
    this.args = args;
    this.stdout = stdout;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

export async function runGit(cwd: string, args: string[]): Promise<GitResult> {
  return new Promise<GitResult>((resolve, reject) => {
    execFile("git", args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      const out = stdout.toString();
      const err = stderr.toString();

      if (error) {
        const exitCode = typeof error.code === "number" ? error.code : null;
        reject(new GitError(err.trim() || error.message, cwd, args, out, err, exitCode));
        return;
      }

      resolve({ stdout: out, stderr: err });
    });
  });
}
