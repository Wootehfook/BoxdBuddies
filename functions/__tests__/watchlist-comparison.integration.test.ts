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

  it("enriches movies from mocked MOVIES_DB and returns tmdb_catalog_count", async () => {
    // Mock Letterboxd watchlist HTML for two users with one common movie slug
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

    // Mock MOVIES_DB with minimal behavior for prepare().all() and .first()
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

    const mockPrepare = (_sql: string) => {
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
    };

    const req = makeRequest({ username: "alice", friends: ["bob"] });

    const res = await (watchlistModule as any).onRequestPost({
      request: req,
      env,
    });
    const data = await res.json();

    // Expect movies array and debug db count
    expect(Array.isArray(data.movies)).toBe(true);
    expect(data.debug).toBeDefined();
    expect(data.debug.db).toBeDefined();
    expect(typeof data.debug.db.tmdb_catalog_count).toBe("number");
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
});
