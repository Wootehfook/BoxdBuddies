// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mockFetch,
  createMockDb,
  createAdminEnv,
  createAdminSyncRequest,
} from "./test-utils";

describe("tmdb movieId sync sentinel", () => {
  let mockDb: any;
  let insertBind: any;

  beforeEach(() => {
    mockFetch(async (url: string) => {
      if (url.includes("/genre/movie/list")) {
        return { ok: true, json: async () => ({ genres: [] }) };
      }
      if (url.includes("/movie/501")) {
        return {
          ok: true,
          json: async () => ({
            id: 501,
            title: "NoGenresById",
            genres: [],
            genre_ids: [],
            credits: { crew: [] },
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    insertBind = vi.fn(() => ({ run: vi.fn().mockResolvedValue({}) }));
    mockDb = createMockDb({
      "INSERT OR REPLACE INTO tmdb_movies": { bind: insertBind },
      "INSERT OR REPLACE INTO SYNC_METADATA": {
        bind: vi.fn(() => ({ run: vi.fn().mockResolvedValue({}) })),
      },
    });
  });

  it("writes sentinel for movieId sync when TMDB has no genres", async () => {
    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");

    const req = createAdminSyncRequest({
      syncType: "movieId",
      startMovieId: 501,
      maxMovies: 1,
    });

    const env = createAdminEnv(mockDb);

    const res = await onRequestPost({ request: req, env } as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(insertBind).toHaveBeenCalled();
    const args = insertBind.mock.calls[0];
    expect(args[12]).toBe(JSON.stringify(["Unknown"]));
  });
});
