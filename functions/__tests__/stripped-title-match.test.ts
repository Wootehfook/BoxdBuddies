import { describe, it, expect, vi, beforeEach } from "vitest";

import * as compareModule from "../letterboxd/compare/index.ts";

function makeRequest(body: any) {
  return new Request("https://example.com/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("stripped title DB lookup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("matches via REPLACE(title, '\\'', '') path", async () => {
    const pageHtml = `
      <li class="poster-container" data-film-slug="the-worlds-end"><img alt="The World&amp;#039;s End 2013"></li>
    `;

    globalThis.fetch = vi.fn().mockImplementation((url: any) => {
      const u = String(url || "");
      if (u.includes("/page/")) {
        return Promise.resolve({ ok: true, text: async () => "" } as any);
      }
      return Promise.resolve({ ok: true, text: async () => pageHtml } as any);
    });

    // TMDB row to return
    const tmdbRow = {
      id: 333,
      title: "The World's End",
      poster_path: "/worldsend.jpg",
      year: 2013,
    };

    // Mock prepare to inspect SQL and return tmdbRow only when REPLACE used
    const mockPrepare = (sql: string) => {
      const hasReplace = sql.includes("REPLACE(title");
      return {
        bind: (..._args: any[]) => ({
          all: async () => ({ results: hasReplace ? [tmdbRow] : [] }),
          first: async () => ({ c: hasReplace ? 1 : 0 }),
          run: async () => ({ success: true }),
        }),
        all: async () => ({ results: hasReplace ? [tmdbRow] : [] }),
        first: async () => ({ c: hasReplace ? 1 : 0 }),
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

    expect(Array.isArray(data.movies)).toBe(true);
    expect(data.movies.length).toBeGreaterThan(0);

    const found = data.movies.find(
      (m: any) => m.id === 333 || m.title === "The World's End"
    );
    expect(found).toBeTruthy();
    if (found) {
      expect(found.poster_path).toBe("/worldsend.jpg");
    }
  });
});
