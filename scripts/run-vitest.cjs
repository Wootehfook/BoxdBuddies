// AI Generated: GitHub Copilot - 2025-09-20
// Spawn a vitest process and forward all CLI args safely. This avoids
// certain shell parsing issues on Windows when npm forwards flags.
const { spawn } = require("child_process");

const args = process.argv.slice(2);
// Resolve local vitest binary from node_modules/.bin (handles Windows .cmd)
const path = require("path");
const bin = path.join(__dirname, "..", "node_modules", ".bin", process.platform === "win32" ? "vitest.cmd" : "vitest");
const child = spawn(bin, args, {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
