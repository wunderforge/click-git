import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const target = path.join(dist, "click-git-0.0.1.vsix");

fs.mkdirSync(dist, { recursive: true });

try {
  fs.rmSync(target, { force: true });
} catch (error) {
  console.warn(`Could not remove existing package at ${target}: ${error.message}`);
}
