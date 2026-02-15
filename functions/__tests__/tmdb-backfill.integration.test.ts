// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockDb,
  createTmdbFetchMock,
  mockFetch,
  okJson,
  runBackfillMissingSync,
} from "./test-utils";

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
    mockFetch(
      createTmdbFetchMock([
        ["/genre/movie/list", okJson({ genres: [{ id: 1, name: "Action" }] })],
        [
          "/movie/201",
          okJson({
            id: 201,
            genres: [{ id: 1, name: "Action" }],
            credits: { crew: [] },
          }),
        ],
        [
          "/movie/202",
          okJson({
            id: 202,
            genres: [],
            genre_ids: [],
            credits: { crew: [] },
          }),
        ],
      ])
    );

    const { json } = await runBackfillMissingSync(mockDb);

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
