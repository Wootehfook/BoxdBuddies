// AI Generated: GitHub Copilot - 2025-09-20
// Spawn a vitest process and forward all CLI args safely. This avoids
// certain shell parsing issues on Windows when npm forwards flags.
const { spawn } = require("child_process");

const args = process.argv.slice(2);
// Use npx so we pick up the local vitest binary regardless of OS
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(cmd, ["vitest", ...args], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
