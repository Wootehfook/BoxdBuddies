/*
 * Consolidated Cache Module Unit Tests
 * AI Generated: GitHub Copilot - 2025-09-07
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

let mockD1Database: any;

beforeEach(() => {
  mockD1Database = {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
      })),
    })),
  };
  vi.resetModules();
  vi.clearAllMocks();
});

vi.stubGlobal("fetch", vi.fn());

describe("Cache Module", () => {
  it("getCount returns null when feature disabled", async () => {
    const { getCount } = await import("../letterboxd/cache/index.js");
    const env = {
      FEATURE_SERVER_WATCHLIST_CACHE: "false",
      MOVIES_DB: mockD1Database,
      TMDB_API_KEY: "test-key",
    } as any;
    const result = await getCount("testuser", env);
    expect(result).toBeNull();
  });

  it("getCount returns Redis value when fresh", async () => {
    const { getCount } = await import("../letterboxd/cache/index.js");
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          result: JSON.stringify({
            count: 5,
            lastFetchedAt: Date.now(),
            source: "client",
          }),
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    const env = {
      UPSTASH_REDIS_REST_URL: "https://r",
      UPSTASH_REDIS_REST_TOKEN: "t",
      MOVIES_DB: mockD1Database,
      TMDB_API_KEY: "test-key",
    } as any;
    const result = await getCount("u", env);
    expect(result).toEqual(expect.objectContaining({ count: 5 }));
  });

  it("setCount stores to D1 when Redis unavailable", async () => {
    const { setCount } = await import("../letterboxd/cache/index.js");
    const mockRun = vi.fn().mockResolvedValue({});
    mockD1Database.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({ run: mockRun }),
    });
    const env = { MOVIES_DB: mockD1Database, TMDB_API_KEY: "test-key" } as any;
    await setCount(
      "u",
      { count: 2, lastFetchedAt: Date.now(), source: "server" },
      env
    );
    expect(mockRun).toHaveBeenCalled();
  });
});
