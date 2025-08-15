import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// AI Generated: GitHub Copilot - 2025-08-15
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["tests/vitest/**/*.vitest.test.ts"],
    exclude: [],
  },
});
