import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/git-fixtures/**/*.test.ts"],
    testTimeout: 30000
  }
});
