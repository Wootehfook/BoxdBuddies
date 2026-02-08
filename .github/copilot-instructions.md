// AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-08

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
- `npm run cloudflare:dev` (Functions preview; serves `dist/` so run `npm run build` first)
- Formatting: `npm run format` (or `npm run format:check` in CI)

## 3) Critical backend patterns

- Handlers export `onRequestGet|onRequestPost|onRequestOptions` and use `functions/_lib/common.js` helpers (`jsonResponse`, `corsHeaders`, `debugLog`, `tmdbFetch`).
- Validation pattern: `request.text()` → enforce ≤1KB → `JSON.parse()` → explicit field checks with clear 400 responses.
- Auth: `Authorization` header must match `env.ADMIN_SECRET` (accepts `Bearer <token>` or raw token) for admin endpoints.
- D1 usage: prefer `.prepare(sql).bind(...).first()` for reads and `.run()` for writes. Use cache helpers in `functions/letterboxd/cache/index.ts` when possible.

## 4) Server data contract (important)

See `functions/README.md` and `functions/_lib/common.js` for contract details (including `poster_path` handling). Keep client URL construction aligned with those sources to avoid drift.

## 5) Files & places to look (high ROI)

- `functions/_lib/common.js` — CORS, logging, TMDB helpers and `reduceMovie` normalization.
- `functions/letterboxd/[username].ts` — scraping + pagination.
- `functions/letterboxd/cache/index.ts` — D1 cache helpers and lock behavior.
- `functions/compare/index.ts` and `functions/api/watchlist-comparison/index.ts` — compare/watchlist logic.
- `src/components/ResultsPage.tsx` — movie card rendering and poster handling.
- `src/index.css` — canonical stylesheet; `src/App.css` is legacy.
- `docs/ai-attribution-update-guide.md` — attribution UI rules and accessibility requirements.

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

Migration checklist: add `migrations/0NN_description.sql`; run via `wrangler d1 execute MOVIES_DB --file=migrations/0NN_description.sql` (note: current script only runs `001_create_tmdb_catalog.sql`).

Test pattern: mock `env.MOVIES_DB` and use exposed DI hooks (e.g., `setCacheFunctionForTesting`) found in `functions/__tests__/` examples.

## 7) Frontend touchpoints & UI conventions

- Canonical stylesheet: `src/index.css` (avoid duplicating base/global rules in `src/App.css`).
- Results grid: `.results-page .movies-grid { grid-template-columns: repeat(auto-fit, 450px); justify-content: center; gap: 2rem; max-width: calc(3 * 450px + 2 * 2rem); margin: 0 auto; }`.
- Movie card sizing (results): `.results-page .movie-card { height: 650px; }`, `.results-page .movie-poster-section { height: 488px; }`, `.results-page .movie-info { height: 162px; }`.
- Genre badges: displayed on movie cards with `.genre-badge` styles in `src/index.css`.
- Accessibility: attribution modal uses a native `<dialog>` with `aria-labelledby="attribution-title"` and `aria-modal="true"`.

## 8) Testing patterns to mirror

- Endpoint auth/validation/rate limit/CORS: `functions/__tests__/watchlist-count-updates.test.ts`.
- Cache integration coverage: `functions/__tests__/friends-cache-integration.test.ts` and `functions/__tests__/cache.unit.test.ts`.
- Modal testing (jsdom): `src/__tests__/attribution-modal.test.tsx` uses `userEvent.setup()` and DOM queries.

## 9) Contributing rules (must follow)

- AI attribution header format (required): `// AI Generated: GitHub Copilot (GPT-5.2-Codex) - YYYY-MM-DD`.
- Keep diffs small, ~100-column width, TypeScript strictness (avoid `any`).
- When adding server endpoints: include `onRequestOptions`, `debugLog`, rate limiting, and DI setters for tests.
- Use Prettier/ESLint scripts before committing (`npm run format`, `npm run lint`).
- Follow Conventional Commits and PR-title rules (changelog automation depends on this). See `README.md`.

## 10) Security & secrets (must follow)

- Never commit secrets or API keys. Use Cloudflare secrets (`wrangler secret put TMDB_API_KEY`, `wrangler secret put ADMIN_SECRET`).
- If code needs new env vars, add placeholders to a local `.env` (do **not** commit) and document usage in `README.md`.
- Treat user input and external responses as untrusted; validate and sanitize server-side.

## 11) Canonical references

- `README.md` — dev setup, Conventional Commits, release workflow.
- `functions/README.md` — endpoint contracts and server conventions.
- `docs/ai-attribution-update-guide.md` — attribution UI rules.
- `docs/server-watchlist-cache-design.md` — cache design rationale (may be ahead of current implementation).
