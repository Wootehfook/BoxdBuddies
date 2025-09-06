# Scripts Overview

This folder contains developer and CI helper scripts for BoxdBuddies (web-only).

**Key scripts:**

- `mcp-status.sh` — Prints MCP server status and health.
- `mcp-restart.sh` — Restarts the MCP servers with basic checks.
- `mcp-stop.sh` — Gracefully stops MCP servers and cleans up.
- `sync-favicon.mjs` — Syncs base app icon to favicon variants used by the frontend.
- `backup.ps1` — Backs up web project files (no desktop/tauri support).

Other scripts are for GPG setup, local diagnostics, or are legacy/optional. Unused scripts are removed regularly.

## Testing helpers

- Primary test runner: `npm run test` (Jest)
- Vite-specific tests: `npm run test:vitest` (Vitest)
