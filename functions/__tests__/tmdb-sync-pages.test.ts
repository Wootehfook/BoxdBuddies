// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch, createMockDb } from "./test-utils";

describe("tmdb page sync sentinel", () => {
  let mockDb: any;
  let insertBind: any;

  beforeEach(() => {
    // Mock popular movies response (one movie id 301)
    mockFetch(async (url: string) => {
      if (url.includes("/movie/popular")) {
        return {
          ok: true,
          json: async () => ({
            page: 1,
            results: [{ id: 301, genre_ids: [] }],
            total_pages: 1,
            total_results: 1,
          }),
        };
      }
      if (url.includes("/movie/301")) {
        return {
          ok: true,
          json: async () => ({
            id: 301,
            title: "NoGenresPageMovie",
            genres: [],
            genre_ids: [],
            credits: { crew: [] },
          }),
        };
      }
      if (url.includes("/genre/movie/list")) {
        return { ok: true, json: async () => ({ genres: [] }) };
      }
      return { ok: false, status: 404 };
    });

    insertBind = vi.fn(() => ({ run: vi.fn().mockResolvedValue({}) }));
    mockDb = createMockDb({
      "INSERT OR REPLACE INTO tmdb_movies": { bind: insertBind },
    });
  });

  it("writes sentinel for page-based sync when TMDB has no genres", async () => {
    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");

    const body = JSON.stringify({
      syncType: "pages",
      startPage: 1,
      maxPages: 1,
    });
    const req = new Request("http://localhost/admin/tmdb-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-secret",
      },
      body,
    });

    const env = {
      TMDB_API_KEY: "k",
      MOVIES_DB: mockDb,
      ADMIN_SECRET: "test-secret",
    } as any;

    const res = await onRequestPost({ request: req, env } as any);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(insertBind).toHaveBeenCalled();
    const args = insertBind.mock.calls[0];
    // One of the bound args should be the genres JSON; ensure sentinel is present somewhere in the args
    const found = args.some((a: any) => a === JSON.stringify(["Unknown"]));
    expect(found).toBe(true);
  });
});
