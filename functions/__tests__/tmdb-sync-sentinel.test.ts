/*
 * TMDB Sync Sentinel + Backfill Unit Tests
 * AI Generated: GitHub Copilot - 2025-09-18
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTmdbFetchMock,
  mockFetch,
  okJson,
  runBackfillMissingSync,
} from "./test-utils";

describe("tmdb-sync backfill sentinel", () => {
  let mockDb: any;
  let mockSelectAll: any;
  let bindUpdate: any;

  beforeEach(() => {
    vi.resetAllMocks();

    // select batch returns one movie id
    mockSelectAll = vi.fn().mockResolvedValue({ results: [{ id: 123 }] });

    // update bind spy to capture the bound genres JSON
    bindUpdate = vi.fn((_genresJson: string, _id: number) => ({
      run: vi.fn().mockResolvedValue({}),
    }));

    // prepare mock: return different bind handlers depending on SQL
    const prepareMock = vi.fn((sql: string) => {
      if (sql.includes("SELECT id FROM tmdb_movies")) {
        return {
          bind: vi.fn((_afterId: number, _size: number) => ({
            all: mockSelectAll,
          })),
        };
      }
      if (
        sql.trim().toUpperCase().startsWith("UPDATE TMDB_MOVIES SET GENRES")
      ) {
        return { bind: bindUpdate };
      }
      // default: provide a run/first placeholder
      return {
        bind: vi.fn(() => ({
          run: vi.fn().mockResolvedValue({}),
          first: vi.fn().mockResolvedValue(null),
        })),
      };
    });

    mockDb = { prepare: prepareMock } as any;
  });

  it("writes sentinel when TMDB returns no genres", async () => {
    mockFetch(
      createTmdbFetchMock([
        ["/genre/movie/list", okJson({ genres: [{ id: 1, name: "Action" }] })],
        [
          "/movie/123",
          okJson({
            id: 123,
            title: "NoGenresMovie",
            genres: [],
            genre_ids: [],
            credits: { crew: [] },
          }),
        ],
      ])
    );

    const { json } = await runBackfillMissingSync(mockDb);

    expect(json.success).toBe(true);

    // Ensure update bind was called and first argument is JSON.stringify([sentinel])
    expect(bindUpdate).toHaveBeenCalled();
    const firstCallArgs = bindUpdate.mock.calls[0];
    expect(firstCallArgs[0]).toBe(JSON.stringify(["Unknown"]));
    expect(firstCallArgs[1]).toBe(123);
  });
});
