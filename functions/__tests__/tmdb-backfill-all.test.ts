// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockFetch, createMockDb } from "./test-utils";

describe("tmdb backfill all mode", () => {
  let mockDb: any;
  let selectSpy: any;
  let updateSpy: any;

  beforeEach(() => {
    selectSpy = vi.fn().mockResolvedValue({ results: [{ id: 601 }] });
    updateSpy = vi.fn((_genresJson: string, _id: number) => ({
      run: vi.fn().mockResolvedValue({}),
    }));

    mockDb = createMockDb({
      "SELECT id FROM tmdb_movies": {
        bind: vi.fn((_afterId: number, _size: number) => ({ all: selectSpy })),
      },
      "UPDATE TMDB_MOVIES SET GENRES": { bind: updateSpy },
    });

    mockFetch(async (url: string) => {
      if (url.includes("/genre/movie/list")) {
        return {
          ok: true,
          json: async () => ({ genres: [{ id: 1, name: "Action" }] }),
        };
      }
      if (url.includes("/movie/601")) {
        return {
          ok: true,
          json: async () => ({ id: 601, genres: [], credits: { crew: [] } }),
        };
      }
      return { ok: false, status: 404 };
    });
  });

  it("recomputes for all rows and writes sentinel when missing", async () => {
    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");

    const body = JSON.stringify({
      syncType: "backfillGenres",
      mode: "all",
      limit: 10,
    });
    const req = new Request("http://localhost/admin/tmdb-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body,
    });

    const env = { TMDB_API_KEY: "k", MOVIES_DB: mockDb } as any;

    const res = await onRequestPost({ request: req, env } as any);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(updateSpy).toHaveBeenCalled();
    const args = updateSpy.mock.calls[0];
    expect(args[0]).toBe(JSON.stringify(["Unknown"]));
  });
});
