/*
 * TMDB Sync Sentinel + Backfill Unit Tests
 * AI Generated: GitHub Copilot - 2025-09-18
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubGlobal("fetch", vi.fn());

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
    // Mock genre list response (called by backfill for fallback mapping)
    (fetch as any).mockImplementation(async (url: string) => {
      if (url.includes("/genre/movie/list")) {
        return {
          ok: true,
          json: async () => ({ genres: [{ id: 1, name: "Action" }] }),
        };
      }
      // Movie details: no genres and no genre_ids
      if (url.includes("/movie/123")) {
        return {
          ok: true,
          json: async () => ({
            id: 123,
            title: "NoGenresMovie",
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

    // Ensure update bind was called and first argument is JSON.stringify([sentinel])
    expect(bindUpdate).toHaveBeenCalled();
    const firstCallArgs = bindUpdate.mock.calls[0];
    expect(firstCallArgs[0]).toBe(JSON.stringify(["Unknown"]));
    expect(firstCallArgs[1]).toBe(123);
  });
});
