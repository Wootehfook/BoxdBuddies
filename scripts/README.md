# Scripts Overview

This folder contains developer and CI helper scripts for BoxdBuddies (web-only).

**Key scripts:**

- `sync-favicon.mjs` — Syncs base app icon to favicon variants used by the frontend.
- `backup.ps1` — Backs up web project files (no desktop/tauri support).

Other scripts are for GPG setup, local diagnostics, or are legacy/optional. Unused scripts are removed regularly.

## Testing helpers

- Primary test runner: `npm run test` (Vitest)
- One-off run: `npm run test:run`
- Watch mode: `npm run test:watch`
