<!-- Copilot / AI contributor instructions for BoxdBuddies -->

# Quick guide for the next AI contributor

Purpose: Give an AI agent the exact repo knowledge and quick templates needed to be productive immediately.

1. High-level architecture

- Frontend: React + TypeScript (Vite) in `src/`.
- Backend: Cloudflare Pages Functions in `functions/` using D1 (SQLite) for enrichment & caching.

2. Run / build / test (quick)

- `npm install`
- `npm run dev` (frontend)
- `npm run type-check`, `npm run lint`, `npm run test` (Vitest)
- `npm run cloudflare:dev` (Functions preview)

3. Critical patterns (copy/paste examples exist in repo)

- Handlers export `onRequestGet|onRequestPost|onRequestOptions` and use `functions/_lib/common.js` helpers (`jsonResponse`, `corsHeaders`, `debugLog`, `tmdbFetch`).
- Validation: `request.text()` → size limit (<=1KB) → `JSON.parse()` → explicit field checks + clear 400 responses.
- Auth: `Authorization` header must match `env.ADMIN_SECRET` (accepts `Bearer x` or raw token) for admin endpoints.
- D1 usage: `.prepare(sql).bind(...).first()` for reads; `.run()` for writes. Use `functions/letterboxd/cache/index.ts` helpers for cache operations.

4. Files & places to look (high ROI)

- `functions/_lib/common.js` — CORS, logging, TMDB helpers
- `functions/letterboxd/[username].ts` — scraping + pagination
- `functions/letterboxd/cache/index.ts` — D1 cache helpers and lock behavior
- `migrations/*.sql` — DB schema; add migrations (snake_case) instead of editing history
- `src/index.css` — canonical stylesheet; `src/App.css` is legacy

5. Quick templates (use when adding code)

- Function endpoint skeleton (short):

  ```ts
  export async function onRequestPost(ctx) {
    const { request, env } = ctx;
    const t = await request.text();
    if (t.length > 1024)
      return jsonResponse(400, { error: "payload too large" });
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

- Migration checklist: add `migrations/0NN_description.sql`; run via `wrangler d1 execute MOVIES_DB --file=migrations/0NN_description.sql` (see `package.json` scripts).

- Test pattern: mock `env.MOVIES_DB` and use exposed DI hooks (e.g., `setCacheFunctionForTesting`) found in `functions/__tests__/` examples.

6. AI contributor contract (what the agent should produce)

- Inputs: changed files + a brief PR description.
- Outputs: focused edits, tests covering new behavior, migration file (if schema change), and updated docs when public API changes.
- Success criteria: Typecheck passes (`npm run type-check`), unit tests pass, and no lint errors.
- Error modes to handle: missing env vars, D1 timeouts, malformed request bodies, and rate-limit collisions.

7. Small, repo-specific rules

- Add at top of AI-generated files: `// AI Generated: GitHub Copilot - YYYY-MM-DD`.
- Keep diffs small, 100-column width, strict TypeScript (avoid `any`).
- When adding server endpoints: include `onRequestOptions`, `debugLog`, rate-limiting, and a DI setter for tests.

References: `README.md`, `functions/_lib/common.js`, `functions/letterboxd/cache/index.ts`, `migrations/`, `docs/server-watchlist-cache-design.md`.

If you'd like, I can also add a new file template (Function + test) under `tools/templates/` — tell me to proceed and I'll create it.
