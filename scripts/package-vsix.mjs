import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const dist = path.resolve("dist");
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const out = path.join(dist, `${pkg.name}-${pkg.version}-${stamp}.vsix`);

fs.mkdirSync(dist, { recursive: true });

const prepublish = spawnSync("npm", ["run", "vscode:prepublish"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (prepublish.status !== 0) {
  process.exit(prepublish.status ?? 1);
}

const result = spawnSync("npx", ["vsce", "package", "--no-dependencies", "--out", out], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

fs.writeFileSync(path.join(dist, "latest-vsix.txt"), `${out}\n`, "utf8");
