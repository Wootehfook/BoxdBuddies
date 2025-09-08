<!-- Copilot Instructions for BoxdBuddies repository -->

# BoxdBuddies — AI Assistant Instructions (Concise)

Purpose: Give AI coding agents the concrete, project-specific context to be productive fast.

Tech stack and layout

- Frontend: React + TypeScript (Vite) in `src/`
- Backend: Cloudflare Pages Functions in `functions/` with D1 (SQLite) cache; TMDB integration
- Migrations live in `migrations/` (snake_case). Cloudflare config: `wrangler.toml`

Run, build, and checks

- Install/dev: `npm install` → `npm run dev` (Vite)
- Typecheck/lint/tests: `npm run type-check`, `npm run lint`, `npm run test` (Vitest)
- Pages Functions preview: `npm run cloudflare:dev` (serves built `dist/`)

Environment and secrets (never hardcode)

- D1 binding: `env.MOVIES_DB`
- Secrets: `TMDB_API_KEY`, `ADMIN_SECRET`
- Feature flag: `FEATURE_SERVER_WATCHLIST_CACHE` (`"false"` disables server cache)
- Optional Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

Backend patterns (see files)

- Logging: `debugLog(env, ...)` gated by `isDebug(env)` in `functions/_lib/common.js`
- Endpoints export `onRequestGet|Post|Options` with CORS. Example: `functions/api/watchlist-count-updates/index.ts`
- Auth: `Authorization` must match `env.ADMIN_SECRET` (accepts `Bearer <token>` or raw token)
- Validation: parse `request.text()` → size ≤ 1KB → JSON → detailed field checks
- Rate limiting: in-memory Map keyed by `CF-Connecting-IP` + username (see watchlist-count-updates)
- DI hooks: expose setters like `setCacheFunctionForTesting` to swap implementations in tests
- CORS helpers and JSON response helpers available in `common.js` (`corsHeaders`, `withCORS`, `jsonResponse`)

Data access (D1) conventions

- Use `.prepare(...).bind(...).first()` for reads; `.run()` for writes
- Keep SQL identifiers snake_case; add new migrations rather than editing existing ones
- Prefer cache helpers in `functions/letterboxd/cache/index.ts` (`getCount`/`setCount`, friends cache); avoid hand-crafted SQL for cache tables to bypass schema drift

Letterboxd/TMDB integration

- Scraping: `functions/letterboxd/[username].ts` paginates, regex-parses `data-film-slug`, throttles politely
- TMDB helpers: `tmdbFetch`, `reduceMovie` in `functions/_lib/common.js`

Frontend touchpoints

- API calls from `src/` services/components; strict TypeScript (no `any`); React Testing Library used under `src/__tests__/`
- Attribution modal (frontend): native `<dialog>` in `src/App.tsx` with a centered trigger button labeled `Data sources & attribution`.
  - Uses a backdrop button element (`.modal-backdrop-button`) for closing; dialog also has an internal Close button and `onClose` handler to sync React state.
  - Dialog has `aria-labelledby="attribution-title"` and `aria-modal="true"` for accessibility.
  - Focus is moved into the dialog on open; Escape and backdrop click close it.
  - Types: dialog ref uses `useRef<HTMLDialogElement | null>` and `eslint.config.js` declares `HTMLDialogElement` as a global to satisfy ESLint.

Testing patterns to mirror

- Endpoint auth/validation/rate limit/CORS: `functions/__tests__/watchlist-count-updates.test.ts`
- Cache integration: `functions/__tests__/friends-cache-integration.test.ts`
- Modal testing in jsdom: `src/__tests__/attribution-modal.test.tsx` uses `userEvent.setup()`, disambiguates duplicate text (button vs heading) via `findAllByText` and tag checks, and closes via the backdrop button for determinism (jsdom’s `<dialog>` role support can vary).

MCP servers (optional)

- Purpose: augment AI workflows (planning, repo ops, code quality, docs). Categories used in scripts: primary `@memory`, `@github`, `@sequentialthinking`; secondary `@codacy`, `@playwright`, `@markitdown`.
- Dev Container: MCP setup runs automatically via `.devcontainer/setup-with-mcp.sh` (postCreate). Manual start inside the container: `./.devcontainer/start-mcp-servers.sh`.
- Status/maintenance (run in Linux shell: Dev Container/WSL/Git Bash):
  - Status: `bash scripts/mcp-status.sh` (set `MCP_STATUS_VERBOSE=1` for details)
  - Restart: `bash scripts/mcp-restart.sh`
  - Stop: `bash scripts/mcp-stop.sh`
- Notes: the scripts are light-weight helpers that check VS Code CLI and attempt basic setup. They are non-blocking in CI and safe to ignore locally if you don’t use MCP.

When adding a new Function endpoint

1. Place under `functions/<area>/<name>/index.ts` (or `functions/<area>/index.ts`)
2. Implement `onRequestOptions`, request handler(s), input validation, and auth (if needed)
3. Use `debugLog`, add rate limiting for user-triggered endpoints, and DI hooks for testability
4. Add unit tests in `functions/__tests__/` mirroring the examples above

AI attribution and style

- Add at top of AI-authored files: `// AI Generated: GitHub Copilot - YYYY-MM-DD`
- Respect ~100 col width, strict TS, and ESLint/Prettier

References

- `README.md` (overview and run scripts), `package.json` (scripts), `functions/_lib/common.js` (shared utils)

Notes

- Watchlist count cache schema has evolved; migration `003_create_watchlist_counts_cache.sql` shows the initial structure, but current code expects `(username, value, expires_at)` columns. Always prefer `cache/index.ts` helpers (`getCount`/`setCount`) over direct SQL to avoid schema mismatches.
- Cache locks table: code expects `cache_locks (lock_key, expires_at)` for D1 locking fallback
- If schema changes are required, add a new migration under `migrations/` rather than modifying existing ones
- CSS: `.modal-backdrop` was removed; use `.modal-backdrop-button` for the interactive backdrop that covers the viewport behind the `<dialog>`.
