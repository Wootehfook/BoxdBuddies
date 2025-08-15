# Scripts Overview

This folder contains developer and CI helper scripts used by BoxdBuddies.
Below are the most relevant scripts that are actively referenced by package.json or tasks.

- scripts/mcp-status.sh — Prints MCP server status and health.
- scripts/mcp-restart.sh — Restarts the MCP servers with basic checks.
- scripts/mcp-stop.sh — Gracefully stops MCP servers and cleans up.
- scripts/sync-favicon.mjs — Syncs base app icon to favicon variants used by the frontend.

Other scripts in this directory are developer utilities for linting, clippy automation,
GPG setup, and local diagnostics. They are optional and not required for normal use.
If a script becomes unused, we’ll either remove it or move it to an attic folder.

AI Generated: GitHub Copilot - 2025-08-14

## Testing helpers

- Primary test runner (Jest): `npm run test`
  - Runs tests under `src/**/__tests__` and `src/**/*.{test,spec}.ts(x)`
  - Import.meta is not supported in Jest; such specs are skipped or migrated
- Vitest (optional, import.meta-friendly): `npm run test:vitest`
  - Runs suites under `tests/vitest/**/*.vitest.test.ts`
  - Useful for Vite-specific code paths (e.g., `import.meta.env`)
  - If the command isn’t found, run `npm install` to install dev deps
