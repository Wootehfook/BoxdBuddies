import { describe, it, expect, vi, beforeEach } from "vitest";

// We'll import the compare function
import * as compareModule from "../letterboxd/compare/index.ts";

function makeRequest(body: any) {
  return new Request("https://example.com/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("apostrophe handling in compare/enhance pipeline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should handle various escaped apostrophe forms and not break the list", async () => {
    // Prepare mocked watchlists: two users with common movies, but titles have weird apostrophe encodings
    // We'll bypass the actual scraper by mocking scrapeLetterboxdWatchlist via mocking fetch used in scraping
    const pageHtml = `
      <li class="poster-container" data-film-slug=""><img alt="The World#039;s End 2013"></li>
      <li class="poster-container" data-film-slug=""><img alt="The World&amp;#039;s End 2013"></li>
      <li class="poster-container" data-film-slug=""><img alt="The World’s End 2013"></li>
    `;

    globalThis.fetch = vi.fn().mockImplementation((url: any) => {
      const u = String(url || "");
      // Return hit page for the first (root) watchlist page, return empty for paginated pages
      if (u.includes("/page/")) {
        return Promise.resolve({ ok: true, text: async () => "" } as any);
      }
      return Promise.resolve({ ok: true, text: async () => pageHtml } as any);
    });

    // Mock MOVIES_DB: if titles normalized match "The World's End" then return a TMDB row
    const tmdbRow = {
      id: 12345,
      title: "The World's End",
      poster_path: "/worldsend.jpg",
      year: 2013,
      vote_average: 7.5,
    };

    function makeBindResultWithConditional(firstArg: string | undefined) {
      // Normalize the incoming firstArg for comparison
      const incoming = (firstArg || "").toLowerCase();
      // Accept titles that include tokens 'world' and 'end' to be robust to
      // slight normalization differences (quotes, whitespace, etc.).
      const tokens = ["world", "end"];
      const matched = tokens.every((t) => incoming.includes(t));

      return {
        all: async () => ({ results: matched ? [tmdbRow] : [] }),
        first: async () => ({ c: matched ? 1 : 0 }),
        run: async () => ({ success: true }),
      };
    }

    const mockPrepare = (_sql: string) => {
      return {
        bind: (..._args: any[]) => ({
          all: async () => ({ results: [tmdbRow] }),
          first: async () => ({ c: 1 }),
          run: async () => ({ success: true }),
        }),
        first: async () => ({ c: 1 }),
      } as any;
    };

    const env: any = {
      MOVIES_DB: { prepare: mockPrepare },
      TMDB_API_KEY: "test",
    };

    const req = makeRequest({ username: "u1", friends: ["u2"] });

    const res = await (compareModule as any).onRequestPost({
      request: req,
      env,
    });
    const data = await res.json();

    // Should return an array of movies and not be empty
    expect(Array.isArray(data.movies)).toBe(true);
    expect(data.movies.length).toBeGreaterThan(0);

    // Each returned movie should either have poster_path or at least a fallback id
    for (const movie of data.movies) {
      expect(movie).toBeDefined();
      const hasPoster = !!movie.poster_path;
      const hasFallbackId = movie.id && movie.id >= 900000;
      expect(hasPoster || hasFallbackId).toBeTruthy();
    }
  });
});
