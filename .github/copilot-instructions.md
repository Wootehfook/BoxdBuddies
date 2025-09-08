<!-- Copilot Instructions for BoxdBuddies repository -->

# BoxdBuddies — AI Assistant Instructions (Concise)

Purpose: give AI coding agents the exact project context to be productive immediately.

- Architecture and layout
  - Frontend: React 19 + TypeScript via Vite in `src/` (strict TS; React Testing Library tests under `src/__tests__/`).
  - Backend: Cloudflare Pages Functions in `functions/` using D1 (SQLite) and optional Upstash Redis.
  - External: TMDB via `tmdbFetch` and Letterboxd scraping; Cloudflare config in `wrangler.toml`; DB migrations in `migrations/`.

- Run, build, tests
  - Install/dev: `npm install` → `npm run dev` (Vite dev server).
  - Checks: `npm run type-check`, `npm run lint`, `npm run test` (Vitest).
  - Pages Functions preview: `npm run build` → `npm run cloudflare:dev` (serves `dist/` + `functions/`).

- Env and secrets (never hardcode)
  - D1 binding: `env.MOVIES_DB`; Secrets: `TMDB_API_KEY`, `ADMIN_SECRET`.
  - Feature flag: `FEATURE_SERVER_WATCHLIST_CACHE` (`"false"` disables server cache). See `preview.env` for local defaults.
  - Optional Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

- Server functions — patterns to mirror
  - Export `onRequestGet|Post|Options`; add CORS headers. Example: `functions/api/watchlist-count-updates/index.ts`.
  - Use helpers in `functions/_lib/common.js`: `corsHeaders`, `withCORS`, `jsonResponse`, `debugLog`, `isDebug`.
  - Auth: `Authorization` must equal `env.ADMIN_SECRET` (supports `Bearer <token>` or raw token).
  - Validation: read `request.text()`, enforce ≤1KB, parse JSON, return detailed field errors.
  - Rate limit: in-memory Map keyed by `CF-Connecting-IP:username` (see watchlist-count-updates endpoint).
  - Testing DI: expose setters like `setCacheFunctionForTesting` to swap implementations in tests.

- Data access and cache conventions
  - D1 access: `.prepare(...).bind(...).first()` for reads; `.run()` for writes; keep identifiers snake_case.
  - Prefer `functions/letterboxd/cache/index.ts` for watchlist/friends cache (`getCount`, `setCount`, `acquireLock`, `releaseLock`) with 12h TTL and feature-flag awareness; avoid direct SQL to prevent schema drift.
  - Schema note: `migrations/003_create_watchlist_counts_cache.sql` is legacy (`watchlist_count/last_updated`). Current code expects `watchlist_counts_cache (username, value, expires_at)` and `cache_locks (lock_key, expires_at)` for D1 fallback locking—add new migrations if missing; do not modify old ones.

- Letterboxd/TMDB integration
  - Scraping in `functions/letterboxd/[username].ts` (pagination, regex on `data-film-slug`, polite throttling).
  - TMDB utilities: `tmdbFetch` and `reduceMovie` in `functions/_lib/common.js`.

- Frontend specifics to mirror
  - Attribution modal: native `<dialog>` in `src/App.tsx` with trigger text `Data sources & attribution`; closes via `.modal-backdrop-button` or internal Close; `aria-labelledby="attribution-title"`; focus moved in on open; Escape/backdrop close; ref type `useRef<HTMLDialogElement|null>`.
  - See tests `src/__tests__/attribution-modal.test.tsx` (disambiguates duplicate text and clicks the backdrop button deterministically).

- Adding a new endpoint
  1. Place under `functions/<area>/<name>/index.ts` (or `functions/<area>/index.ts`).
  2. Implement `onRequestOptions`, handler(s), CORS, validation, and auth as needed.
  3. Use `debugLog`, apply per-user/IP rate limiting for user-triggered routes, expose DI hooks.
  4. Add tests in `functions/__tests__/` (e.g., `watchlist-count-updates.test.ts`, `friends-cache-integration.test.ts`).

- AI attribution and style
  - Add `// AI Generated: GitHub Copilot - YYYY-MM-DD` to AI-authored files; keep ~100-col width; follow ESLint/Prettier.

References: `README.md`, `package.json` (scripts), `functions/_lib/common.js`, `functions/letterboxd/cache/index.ts`.
