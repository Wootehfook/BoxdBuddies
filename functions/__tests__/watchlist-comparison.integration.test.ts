import { describe, it, expect, vi, beforeEach } from "vitest";

// Import the function under test
import * as watchlistModule from "../api/watchlist-comparison/index.ts";

// Build a minimal Request helper
function makeRequest(body: any) {
  return new Request("https://example.com/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("watchlist-comparison function (integration)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Shared fixture: two users with one common movie, mocked D1 that records SQL.
  async function runComparison(extraEnv: Record<string, unknown> = {}) {
    const sampleHtml = `
      <ul>
        <li class="griditem" data-item-slug="test-movie" data-item-name="Test Movie 2023"></li>
      </ul>
    `;

    // Mock fetch used by the function to scrape Letterboxd
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleHtml,
    } as any);

    const fakeRow = {
      id: 42,
      title: "Test Movie",
      original_title: "Test Movie",
      poster_path: "/test.jpg",
      release_date: "2023-01-01",
      year: 2023,
      vote_average: 8.3,
      popularity: 10,
    };

    const sqlSeen: string[] = [];
    const mockPrepare = (sql: string) => {
      sqlSeen.push(sql);
      return {
        bind: () => ({
          all: async () => ({ results: [fakeRow] }),
          first: async () => ({ c: 1 }),
          run: async () => ({ success: true }),
        }),
        // support direct .first() calls (COUNT query)
        first: async () => ({ c: 1 }),
      };
    };

    const env: any = {
      MOVIES_DB: { prepare: mockPrepare },
      TMDB_API_KEY: "test",
      ...extraEnv,
    };

    const res = await (watchlistModule as any).onRequestPost({
      request: makeRequest({ username: "alice", friends: ["bob"] }),
      env,
    });
    return { res, data: await res.json(), sqlSeen };
  }

  const isCatalogCount = (sql: string) =>
    /SELECT\s+COUNT\(\*\)\s+as\s+c\s+FROM\s+tmdb_movies/i.test(sql);

  it("with DEBUG enabled: enriches movies and returns tmdb_catalog_count", async () => {
    const { data, sqlSeen } = await runComparison({ DEBUG: "true" });

    expect(Array.isArray(data.movies)).toBe(true);
    expect(data.debug).toBeDefined();
    expect(data.debug.db).toBeDefined();
    expect(typeof data.debug.db.tmdb_catalog_count).toBe("number");
    expect(sqlSeen.some(isCatalogCount)).toBe(true);
    // If movies were returned, ensure they have expected shape or source marker
    if (data.movies.length > 0) {
      expect(
        data.movies[0].poster_path === "/test.jpg" ||
          data.movies[0].source === "db"
      ).toBeTruthy();
      // Also ensure enrichment telemetry reports at least one hit
      expect(typeof data.debug.db.enrichment_hits).toBe("number");
      expect(
        data.debug.db.enrichment_hits + data.debug.db.enrichment_misses
      ).toBe(data.movies.length);
    }
  });

  it("in production (no DEBUG): omits debug payload and skips the full-table COUNT", async () => {
    const { res, data, sqlSeen } = await runComparison();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.movies)).toBe(true);
    expect(data.movies.length).toBeGreaterThan(0);
    expect(data.debug).toBeUndefined();
    // The ~1M-row COUNT(*) must not run on the production request path.
    expect(sqlSeen.some(isCatalogCount)).toBe(false);
  });

  it("rejects invalid usernames with 400 before scraping", async () => {
    globalThis.fetch = vi.fn();
    const res = await (watchlistModule as any).onRequestPost({
      request: makeRequest({ username: "alice", friends: ["../../film/x"] }),
      env: { MOVIES_DB: { prepare: vi.fn() }, TMDB_API_KEY: "test" },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid username format");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects non-string usernames with 400 instead of crashing", async () => {
    globalThis.fetch = vi.fn();
    const res = await (watchlistModule as any).onRequestPost({
      request: makeRequest({ usernames: [1, 2] }),
      env: { MOVIES_DB: { prepare: vi.fn() }, TMDB_API_KEY: "test" },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).not.toMatch(/trim is not a function/);
  });

  it("returns a generic 500 message when scraping fails (no internal details)", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("secret internal detail"));
    const res = await (watchlistModule as any).onRequestPost({
      request: makeRequest({ username: "alice", friends: ["bob"] }),
      env: { MOVIES_DB: { prepare: vi.fn() }, TMDB_API_KEY: "test" },
    });
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("secret internal detail");
  });
});
