import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "src/setupTests.ts",
    testTimeout: 20000,
  },
});
