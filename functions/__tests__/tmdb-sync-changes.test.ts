// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch, createMockDb } from "./test-utils";

describe("tmdb changes sync sentinel", () => {
  let mockDb: any;
  let insertBind: any;

  beforeEach(() => {
    // Mock changes list to include movie 401 and genre list empty
    mockFetch(async (url: string) => {
      if (url.includes("/movie/changes")) {
        return { ok: true, json: async () => ({ results: [{ id: 401 }] }) };
      }
      if (url.includes("/movie/401")) {
        return {
          ok: true,
          json: async () => ({
            id: 401,
            title: "NoGenresChanged",
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

  it("writes sentinel for changes sync when TMDB has no genres", async () => {
    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");

    const body = JSON.stringify({
      syncType: "changes",
      startDate: "2025-01-01",
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
    expect(args[12]).toBe(JSON.stringify(["Unknown"]));
  });
});
