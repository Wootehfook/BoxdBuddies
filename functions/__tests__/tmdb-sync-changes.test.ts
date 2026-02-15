// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createMockDb,
  createTmdbFetchMock,
  mockFetch,
  okJson,
  runChangesSync,
} from "./test-utils";

describe("tmdb changes sync sentinel", () => {
  let mockDb: any;
  let insertBind: any;

  beforeEach(() => {
    mockFetch(
      createTmdbFetchMock([
        ["/movie/changes", okJson({ results: [{ id: 401 }] })],
        [
          "/movie/401",
          okJson({
            id: 401,
            title: "NoGenresChanged",
            genres: [],
            genre_ids: [],
            credits: { crew: [] },
          }),
        ],
        ["/genre/movie/list", okJson({ genres: [] })],
      ])
    );

    insertBind = vi.fn(() => ({ run: vi.fn().mockResolvedValue({}) }));
    mockDb = createMockDb({
      "INSERT OR REPLACE INTO tmdb_movies": { bind: insertBind },
    });
  });

  it("writes sentinel for changes sync when TMDB has no genres", async () => {
    const { json } = await runChangesSync(mockDb);
    expect(json.success).toBe(true);
    expect(insertBind).toHaveBeenCalled();
    const args = insertBind.mock.calls[0];
    expect(args[12]).toBe(JSON.stringify(["Unknown"]));
  });
});
