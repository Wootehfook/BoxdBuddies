// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createMockDb,
  createTmdbFetchMock,
  mockFetch,
  okJson,
  runPagesSync,
} from "./test-utils";

describe("tmdb page sync sentinel", () => {
  let mockDb: any;
  let insertBind: any;

  beforeEach(() => {
    mockFetch(
      createTmdbFetchMock([
        [
          "/movie/popular",
          okJson({
            page: 1,
            results: [{ id: 301, genre_ids: [] }],
            total_pages: 1,
            total_results: 1,
          }),
        ],
        [
          "/movie/301",
          okJson({
            id: 301,
            title: "NoGenresPageMovie",
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

  it("writes sentinel for page-based sync when TMDB has no genres", async () => {
    const { json } = await runPagesSync(mockDb);
    expect(json.success).toBe(true);

    expect(insertBind).toHaveBeenCalled();
    const args = insertBind.mock.calls[0];
    // One of the bound args should be the genres JSON; ensure sentinel is present somewhere in the args
    const found = args.includes(JSON.stringify(["Unknown"]));
    expect(found).toBe(true);
  });
});
