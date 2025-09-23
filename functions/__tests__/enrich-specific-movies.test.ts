import { describe, it, expect, vi, beforeEach } from "vitest";

import * as watchlistModule from "../api/watchlist-comparison/index.ts";

function makeRequest(body: any) {
  return new Request("https://example.com/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("enrichment for specific titles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("enriches 'The World's End' and 'Coming Home in the Dark' with genres", async () => {
    // Provide watchlist HTML where both users have both movies (common by slug)
    const sampleHtml = `
      <ul>
        <li class="griditem" data-item-slug="the-worlds-end" data-item-name="The World&amp;#039;s End 2013"></li>
        <li class="griditem" data-item-slug="coming-home-in-the-dark" data-item-name="Coming Home in the Dark 2021"></li>
      </ul>
    `;

    // Mock fetch for Letterboxd scraping
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleHtml,
    } as any);

    // Fake TMDB rows, note: genres may be JSON string of objects
    const worldsEndRow = {
      id: 107985,
      title: "The World's End",
      original_title: "The World's End",
      poster_path: "/worldsend.jpg",
      release_date: "2013-08-23",
      year: 2013,
      vote_average: 7.0,
      popularity: 100,
      genres: JSON.stringify([
        { id: 35, name: "Comedy" },
        { id: 878, name: "Science Fiction" },
        { id: 28, name: "Action" },
      ]),
      runtime: 109,
      director: "Edgar Wright",
    };

    const comingHomeRow = {
      id: 747594,
      title: "Coming Home in the Dark",
      original_title: "Coming Home in the Dark",
      poster_path: "/cominghome.jpg",
      release_date: "2021-10-01",
      year: 2021,
      vote_average: 6.6,
      popularity: 50,
      genres: JSON.stringify([
        { id: 53, name: "Thriller" },
        { id: 80, name: "Crime" },
      ]),
      runtime: 93,
      director: "James Ashcroft",
    };

    // Mock MOVIES_DB.prepare behavior to return appropriate rows based on binding
    const mockPrepare = (sql: string) => {
      return {
        bind: (...args: any[]) => ({
          all: async () => {
            const argStr = args.map((a) => String(a || "").toLowerCase());
            // Decide which row to return by checking if title arguments contain known substrings
            const wantsWorldsEnd = argStr.some(
              (s) => s.includes("world") && s.includes("end")
            );
            const wantsComingHome = argStr.some((s) =>
              s.includes("coming home in the dark")
            );
            if (wantsWorldsEnd) return { results: [worldsEndRow] };
            if (wantsComingHome) return { results: [comingHomeRow] };
            // COUNT(*) query path
            if (/count\(\*\)/i.test(sql)) return { results: [{ c: 2 }] } as any;
            return { results: [] };
          },
          first: async () => ({ c: 2 }),
          run: async () => ({ success: true }),
        }),
        first: async () => ({ c: 2 }),
      } as any;
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

    expect(Array.isArray(data.movies)).toBe(true);
    // Should contain both movies
    const titles = data.movies.map((m: any) => m.title).sort();
    expect(titles).toContain("The World's End");
    expect(titles).toContain("Coming Home in the Dark");

    const worlds = data.movies.find((m: any) => m.title === "The World's End");
    const coming = data.movies.find(
      (m: any) => m.title === "Coming Home in the Dark"
    );

    // Validate details presence
    expect(worlds.poster_path).toBe("/worldsend.jpg");
    expect(Array.isArray(worlds.genres)).toBe(true);
    expect(worlds.genres).toContain("Comedy");
    expect(worlds.genres).toContain("Science Fiction");
    expect(worlds.vote_average).toBeCloseTo(7.0);
    expect(typeof worlds.runtime).toBe("number");

    expect(coming.poster_path).toBe("/cominghome.jpg");
    expect(Array.isArray(coming.genres)).toBe(true);
    expect(coming.genres).toContain("Thriller");
    expect(coming.genres).toContain("Crime");
    expect(coming.vote_average).toBeCloseTo(6.6);
    expect(typeof coming.runtime).toBe("number");
  });
});
