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
