<!-- Copilot Instructions for BoxdBuddies repository -->

# BoxdBuddies — AI Assistant Guide

Purpose: Equip AI coding agents with just-enough context to be productive immediately in this repo.

## Architecture and layout

- Frontend: React + TypeScript via Vite in `src/` (strict TS, React Testing Library under `src/__tests__/`).
- Backend: Cloudflare Pages Functions in `functions/` using D1 (SQLite) for caching and TMDB enrichment.
- Migrations live in `migrations/` (snake_case). Cloudflare config: `wrangler.toml`.
- Public assets in `public/`. Shared server utils in `functions/_lib/common.js`.

Data flow (big picture)

- User enters Letterboxd usernames in the web app → frontend calls Functions under `functions/letterboxd/*` and `functions/api/*`.
- Server scrapes Letterboxd (pagination, polite throttling) and enriches with TMDB via `tmdbFetch`/`reduceMovie`.
- Results and counts are cached in D1 (helpers in `functions/letterboxd/cache/index.ts`) and served back to the UI.

## Run, build, and checks

- Install + dev: `npm install` → `npm run dev` (serves Vite dev server).
- Typecheck/lint/tests: `npm run type-check`, `npm run lint`, `npm run test` (Vitest).
- Pages Functions preview (serves built `dist/`): `npm run cloudflare:dev`.
- Build: `npm run build` (TypeScript compile then Vite build).

## Environment and secrets (never hardcode)

- D1 binding: `env.MOVIES_DB`.
- Secrets: `TMDB_API_KEY`, `ADMIN_SECRET`.
- Feature flag: `FEATURE_SERVER_WATCHLIST_CACHE` (`"false"` disables server cache).
- Optional Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Backend patterns and conventions

- Handlers export `onRequestGet|Post|Options` and use CORS helpers from `common.js` (`corsHeaders`, `withCORS`, `jsonResponse`). Example: `functions/api/watchlist-count-updates/index.ts`.
- Auth: header `Authorization` must equal `env.ADMIN_SECRET` (supports `Bearer <token>` or raw token).
- Validation: read `request.text()` → enforce ≤1KB → JSON.parse → explicit field checks with detailed errors.
- Rate limiting: in-memory Map keyed by `CF-Connecting-IP` + username; see `watchlist-count-updates` tests.
- Logging: `debugLog(env, ...)` gated by `isDebug(env)` in `functions/_lib/common.js`.
- DI/testability: expose setters like `setCacheFunctionForTesting` to replace implementations in tests.

### D1 access

- Reads: `.prepare(sql).bind(...).first()`; writes: `.run()`.
- SQL identifiers are snake_case; add new files in `migrations/` rather than editing existing ones.
- Prefer cache helpers in `functions/letterboxd/cache/index.ts` (`getCount`/`setCount`, friends cache) to avoid schema drift.
- Cache locks fallback expects `cache_locks (lock_key, expires_at)`.

### Letterboxd/TMDB integration

- Scraping: `functions/letterboxd/[username].ts` paginates and regex-parses `data-film-slug`, with polite throttling.
- TMDB: use `tmdbFetch` and `reduceMovie` from `functions/_lib/common.js`.

## Frontend touchpoints and UI patterns

- API calls originate from `src/` services/components. Types are strict; avoid `any`.
- Attribution modal: native `<dialog>` in `src/App.tsx` with trigger button text `Data sources & attribution`.
  - Backdrop close uses a button with class `.modal-backdrop-button`; dialog also has a Close button and `onClose` syncs React state.
  - Accessibility: `aria-labelledby="attribution-title"`, `aria-modal="true"`; focus moves into dialog; Escape/backdrop close.
  - Types: dialog ref is `useRef<HTMLDialogElement | null>`; `eslint.config.js` declares `HTMLDialogElement` global.

### CSS/layout conventions

- Canonical stylesheet is `src/index.css`; `src/App.css` is legacy—avoid duplicating base/global rules.
- Use page-scoped selectors to out-specificity legacy styles:
  - Results grid: `.results-page .movies-grid { grid-template-columns: repeat(auto-fit, 450px); justify-content: center; gap: 2rem; max-width: calc(3 * 450px + 2 * 2rem); margin: 0 auto; }`
  - Friends grid: `.friends-page .friends-grid { grid-template-columns: repeat(auto-fit, 350px); justify-content: center; gap: 1.5rem; max-width: calc(3 * 350px + 2 * 1.5rem); margin: 0 auto; }`
  - Movie card sizing (results): `.results-page .movie-card { height: 650px; }`, `.results-page .movie-poster-section { height: 488px; }`, `.results-page .movie-info { height: 162px; }`.
- Links on cards: `color: inherit; text-decoration: none`.
- Mobile: keep grids centered; reduce columns with auto-fit/minmax; drop max-width caps under media queries.
- Avoid non-standard selectors like `:has()`/`:contains`; drive state with classes (e.g., `.progress-item.completed`).

## Testing patterns to mirror

- Endpoint auth/validation/rate limit/CORS: `functions/__tests__/watchlist-count-updates.test.ts`.
- Cache integration coverage: `functions/__tests__/friends-cache-integration.test.ts` and `functions/__tests__/cache.unit.test.ts`.
- Modal testing (jsdom): `src/__tests__/attribution-modal.test.tsx` uses `userEvent.setup()`, disambiguates duplicate text via `findAllByText` + tag checks, closes via backdrop button.

## Contributing here (AI-specific)

- Add at top of AI-authored files: `// AI Generated: GitHub Copilot - YYYY-MM-DD`.
- Respect ~100 col width, TypeScript strictness, ESLint/Prettier. Prefer minimal, focused diffs.
- When adding a new Function endpoint:
  1. Place under `functions/<area>/<name>/index.ts` (or `functions/<area>/index.ts`).
  2. Implement `onRequestOptions`, handler(s), validation, and auth (if needed).
  3. Use `debugLog`, add rate limiting for user-triggered endpoints, and DI hooks for tests.
  4. Add unit tests in `functions/__tests__/` mirroring the examples above.

References: `README.md` (run scripts), `package.json` (scripts), `functions/_lib/common.js` (utils), `docs/server-watchlist-cache-design.md` (design details).

Notes

- Watchlist cache schema evolved; prefer helpers over direct SQL. Current expectations: `(username, value, expires_at)` for counts.
- CSS: `.modal-backdrop` was removed; use `.modal-backdrop-button` to cover/close behind the `<dialog>`.
