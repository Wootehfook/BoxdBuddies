// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFetch, createMockDb } from "./test-utils";

describe("tmdb backfill integration", () => {
  let mockDb: any;
  let selectSpy: any;
  let updateSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock select returns two rows: one with numeric garbage genres, one with NULL
    selectSpy = vi
      .fn()
      .mockResolvedValue({ results: [{ id: 201 }, { id: 202 }] });

    // update spy captures genre writes
    updateSpy = vi.fn((_genresJson: string, _id: number) => ({
      run: vi.fn().mockResolvedValue({}),
    }));

    mockDb = createMockDb({
      "SELECT id FROM tmdb_movies": {
        bind: vi.fn((_afterId: number, _size: number) => ({ all: selectSpy })),
      },
      "UPDATE TMDB_MOVIES SET GENRES": { bind: updateSpy },
    });
  });

  it("replaces numeric/garbage genres and writes sentinel when TMDB has no genres", async () => {
    // Mock genre list and movie endpoints
    mockFetch(async (url: string) => {
      if (url.includes("/genre/movie/list")) {
        return {
          ok: true,
          json: async () => ({ genres: [{ id: 1, name: "Action" }] }),
        };
      }
      // Movie 201: TMDB returns genres
      if (url.includes("/movie/201")) {
        return {
          ok: true,
          json: async () => ({
            id: 201,
            genres: [{ id: 1, name: "Action" }],
            credits: { crew: [] },
          }),
        };
      }
      // Movie 202: TMDB returns nothing for genres
      if (url.includes("/movie/202")) {
        return {
          ok: true,
          json: async () => ({
            id: 202,
            genres: [],
            genre_ids: [],
            credits: { crew: [] },
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");

    const body = JSON.stringify({
      syncType: "backfillGenres",
      mode: "missing",
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

    // Ensure updateSpy called for both rows
    expect(updateSpy).toHaveBeenCalled();
    const calls = updateSpy.mock.calls;
    // Find the call for id 201 (should have Action) and id 202 (should have Unknown sentinel)
    const callFor201 = calls.find((c: any[]) => c[1] === 201);
    const callFor202 = calls.find((c: any[]) => c[1] === 202);
    expect(callFor201).toBeTruthy();
    expect(callFor202).toBeTruthy();
    expect(callFor201[0]).toBe(JSON.stringify(["Action"]));
    expect(callFor202[0]).toBe(JSON.stringify(["Unknown"]));
  });
});
