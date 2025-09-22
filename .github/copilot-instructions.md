<!-- Copilot / AI contributor instructions for Boxdbud.io -->

# Boxdbud.io — AI Assistant Quick Guide

Purpose: Give an AI contributor the precise repo knowledge, patterns, and templates needed to be productive quickly.

## 1) High-level architecture

- Frontend: React + TypeScript (Vite) in `src/` (strict TS, React Testing Library under `src/__tests__/`).
- Backend: Cloudflare Pages Functions in `functions/` using D1 (SQLite) for caching and TMDB enrichment.
- Migrations live in `migrations/` (snake_case). Cloudflare config: `wrangler.toml`.
- Public assets in `public/`. Shared server utils in `functions/_lib/common.js`.

Data flow (big picture)

- User enters Letterboxd usernames in the web app → frontend calls Functions under `functions/letterboxd/*` and `functions/api/*`.
- Server scrapes Letterboxd (pagination, polite throttling) and enriches with TMDB via `tmdbFetch`/`reduceMovie`.
- Results and counts are cached in D1 (helpers in `functions/letterboxd/cache/index.ts`) and served back to the UI.

## 2) Run / build / test (quick)

- `npm install`
- `npm run dev` (frontend)
- `npm run type-check`, `npm run lint`, `npm run test` (Vitest)
- `npm run cloudflare:dev` (Functions preview)

## 3) Critical backend patterns

- Handlers export `onRequestGet|onRequestPost|onRequestOptions` and use `functions/_lib/common.js` helpers (`jsonResponse`, `corsHeaders`, `debugLog`, `tmdbFetch`).
- Validation pattern: `request.text()` → enforce ≤1KB → `JSON.parse()` → explicit field checks with clear 400 responses.
- Auth: `Authorization` header must match `env.ADMIN_SECRET` (accepts `Bearer <token>` or raw token) for admin endpoints.
- D1 usage: prefer `.prepare(sql).bind(...).first()` for reads and `.run()` for writes. Use cache helpers in `functions/letterboxd/cache/index.ts` when possible.

## 4) Server data contract (important)

- `poster_path` returned by server endpoints is a TMDB relative path (e.g. `/kqjL17yufvn9OVLyXYpvtyrFfak.jpg`) or `null`.
- Clients should prefix the TMDB image base and desired size when building image URLs, e.g. `https://image.tmdb.org/t/p/w300${poster_path}`.

Rationale: returning a relative path keeps payloads smaller and lets clients choose an image size.

## 5) Files & places to look (high ROI)

- `functions/_lib/common.js` — CORS, logging, TMDB helpers and `reduceMovie` normalization.
- `functions/letterboxd/[username].ts` — scraping + pagination.
- `functions/letterboxd/cache/index.ts` — D1 cache helpers and lock behavior.
- `functions/compare/index.ts` and `functions/api/watchlist-comparison/index.ts` — compare/watchlist logic.
- `src/components/ResultsPage.tsx` — movie card rendering and poster handling.
- `src/index.css` — canonical stylesheet; `src/App.css` is legacy.

## 6) Quick templates (copy/paste when adding code)

Function endpoint skeleton (short):

```ts
export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const t = await request.text();
  if (t.length > 1024) return jsonResponse(400, { error: "payload too large" });
  let body;
  try {
    body = JSON.parse(t);
  } catch (e) {
    return jsonResponse(400, { error: "invalid json" });
  }
  // optional auth
  const auth = (request.headers.get("authorization") || "").replace(
    "Bearer ",
    ""
  );
  if (env.ADMIN_SECRET && auth !== env.ADMIN_SECRET)
    return jsonResponse(401, { error: "unauthorized" });
  // ... use cache helpers or env.MOVIES_DB
}
```

Migration checklist: add `migrations/0NN_description.sql`; run via `wrangler d1 execute MOVIES_DB --file=migrations/0NN_description.sql` (see `package.json` scripts).

Test pattern: mock `env.MOVIES_DB` and use exposed DI hooks (e.g., `setCacheFunctionForTesting`) found in `functions/__tests__/` examples.

## 7) Frontend touchpoints & UI conventions

- Canonical stylesheet: `src/index.css` (avoid duplicating base/global rules in `src/App.css`).
- Results grid: `.results-page .movies-grid { grid-template-columns: repeat(auto-fit, 450px); justify-content: center; gap: 2rem; max-width: calc(3 * 450px + 2 * 2rem); margin: 0 auto; }`.
- Movie card sizing (results): `.results-page .movie-card { height: 650px; }`, `.results-page .movie-poster-section { height: 488px; }`, `.results-page .movie-info { height: 162px; }`.
- Accessibility: attribution modal uses a native `<dialog>` with `aria-labelledby="attribution-title"` and `aria-modal="true"`.

## 8) Testing patterns to mirror

- Endpoint auth/validation/rate limit/CORS: `functions/__tests__/watchlist-count-updates.test.ts`.
- Cache integration coverage: `functions/__tests__/friends-cache-integration.test.ts` and `functions/__tests__/cache.unit.test.ts`.
- Modal testing (jsdom): `src/__tests__/attribution-modal.test.tsx` uses `userEvent.setup()` and DOM queries.

## 9) Contributing (AI-specific rules)

- Add at top of AI-authored files: `// AI Generated: GitHub Copilot - YYYY-MM-DD`.
- Keep diffs small, ~100-column width, TypeScript strictness (avoid `any`).
- When adding server endpoints: include `onRequestOptions`, `debugLog`, rate limiting, and DI setters for tests.

References: `README.md`, `functions/_lib/common.js`, `functions/letterboxd/cache/index.ts`, `migrations/`, `docs/server-watchlist-cache-design.md`.

If you'd like, I can add a new file template (Function + test) under `tools/templates/` — tell me to proceed and I'll create it.

## 10) MCP servers and VS Code extensions (for AI agents)

This repo includes helper scripts and conventions to improve AI agent capabilities via MCP (Model Context Protocol). Below is what’s available, how to start it, and safe defaults.

### Available MCP servers (by role)

- Primary (recommended):
  - `@memory` — persistent knowledge/memory graph to keep context across steps.
  - `@github` — GitHub operations (PRs, issues, reviews, releases, searches) when authorized.
  - `@sequentialthinking` — planning/analysis helper for stepwise problem-solving.
- Secondary (optional):
  - `@codacy` — code quality checks via Codacy CLI.
  - `@playwright` — UI testing helpers.
  - `@markitdown` — content rendering/markdown utilities.

Note: These are logical server names mirrored by our scripts; the actual runtime is provided by your MCP-capable client/extension.

### Ensure MCP servers are running

Choose the path that matches your environment.

1. Dev Container or Linux-like shell (recommended)

- Scripts:
  - `scripts/mcp-restart.sh` — stop then start MCP servers via the devcontainer bootstrap.
  - `scripts/mcp-status.sh` — status check. Use `MCP_STATUS_VERBOSE=1` for details.
  - `scripts/mcp-stop.sh` — stop MCP-related processes.
- Commands (run inside the Dev Container, WSL, or Git Bash):

```bash
# Restart servers
bash ./scripts/mcp-restart.sh

# Check status (verbose)
MCP_STATUS_VERBOSE=1 bash ./scripts/mcp-status.sh
```

Notes:

- Startup uses `.devcontainer/start-mcp-servers.sh` and attempts to prepare common MCP servers.
- These scripts use Linux utilities (`pgrep`, etc.) and the VS Code CLI (`code`). They won’t run in plain Windows PowerShell without WSL/Git Bash.

2. Windows host without Dev Container

- Install a VS Code extension that can host MCP servers. Keep it local-first; only enable what you need for this repo.
- Verify/install extensions from PowerShell (examples):

```powershell
# List common assistants you may already have installed
code --list-extensions | Select-String -Pattern 'github.copilot|github.copilot-chat|Continue.continue'

# Install GitHub Copilot and Copilot Chat
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat

# Optional: a local-first MCP-capable host
code --install-extension Continue.continue
```

- In your MCP host extension settings, enable the servers you want (`@memory`, `@github`, `@sequentialthinking`). The exact UI varies by extension (look for “MCP servers” / “Providers”).

### Security guidance (least privilege)

- Prefer local-first MCP hosts; keep optional network access disabled by default.
- GitHub access:
  - Use a short-lived Personal Access Token with minimal scopes (e.g., `repo:read`, `read:org` only if needed).
  - Store tokens in VS Code Secret Storage or the extension’s credential store. Never commit tokens to the repo.
- Disable telemetry in third-party extensions unless required.
- Periodically review enabled MCP servers and disable anything not needed for this repo.
- Follow org security policies on managed devices.

### Troubleshooting

- Status script fails on Windows: run it in WSL/Git Bash or use the Dev Container.
- MCP servers not detected: ensure your MCP host extension is installed and that `@memory`, `@github`, and `@sequentialthinking` are enabled.
- `code` CLI not found: install VS Code and ensure `code` is on `PATH`.
- Script suggests `npm run mcp:start`: this repo doesn’t define that script; use `bash ./scripts/mcp-restart.sh` instead.

### Why this helps here

- Our workflows benefit from:
  - `@github` for PR/review automation and repository insights.
  - `@sequentialthinking` for multi-step plans across frontend and Functions code.
  - `@memory` for keeping context between edits and test runs.
