# Scripts Overview

This folder contains developer and CI helper scripts used by BoxdBuddies.
Below are the most relevant scripts that are actively referenced by package.json or tasks.

- scripts/mcp-status.sh — Prints MCP server status and health (Bash)
- scripts/mcp-status.ps1 — Cross-platform wrapper that falls back on Windows if Bash is unavailable
- scripts/mcp-restart.sh — Restarts the MCP servers with basic checks (Bash)
- scripts/mcp-restart.ps1 — Windows wrapper that falls back if Bash isn’t available
- scripts/mcp-stop.sh — Gracefully stops MCP servers and cleans up (Bash)
- scripts/mcp-stop.ps1 — Windows wrapper that falls back if Bash isn’t available
- scripts/sync-favicon.mjs — Syncs base app icon to favicon variants used by the frontend.

Other scripts in this directory are developer utilities for linting, clippy automation,
GPG setup, and local diagnostics. They are optional and not required for normal use.
If a script becomes unused, we’ll either remove it or move it to an attic folder.

AI Generated: GitHub Copilot - 2025-08-14

## Cross-Platform Script Behavior

npm scripts use Bash-first with Windows PowerShell fallbacks for maximum compatibility:

- `npm run mcp:status` → `bash scripts/mcp-status.sh` || `pwsh -NoProfile -File scripts/mcp-status.ps1`
- `npm run mcp:restart` → `bash scripts/mcp-restart.sh` || `pwsh -NoProfile -File scripts/mcp-restart.ps1`
- `npm run mcp:stop` → `bash scripts/mcp-stop.sh` || `pwsh -NoProfile -File scripts/mcp-stop.ps1`

**How it works:**

- **Linux/macOS/WSL**: Uses Bash implementations (full functionality)
- **Windows (no Bash)**: Falls back to PowerShell wrappers (graceful degradation)
- **Windows (with Git Bash/WSL)**: Uses Bash for full MCP capabilities

PowerShell wrappers provide soft-success behavior on Windows systems without Bash, ensuring scripts don't fail but log helpful guidance about enabling full functionality with Git Bash or WSL.

## Testing helpers

- Primary test runner (Vitest): `npm run test`
  - Runs suites under `tests/vitest/**/*.vitest.test.ts`
  - Uses Vite-native environment; `import.meta.env` works as expected
  - Setup file: `vitest.config.ts` with `src/setupTests.ts`

See also: `scripts/attic/README.md` for archived/legacy scripts.

Archived in `scripts/attic/` on 2025-08-16:

- `aggressive-clippy-fix.sh`
- `ultimate-clippy-fix.sh`
- `fix-all-77-issues.sh`
