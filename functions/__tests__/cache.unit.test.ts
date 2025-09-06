/*
 * BoxdBuddy - Cache Module Unit Tests
 * Copyright (C) 2025 Wootehfook
 * AI Generated: Claude Sonnet 4 - 2025-01-02
 */

// Tests use flexible env fixtures during cleanup; keep types by including TMDB_API_KEY where needed

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
  // Note: redis client mocked via global fetch
});

// Mock fetch for Redis requests
vi.stubGlobal("fetch", vi.fn());

describe("Cache Module", () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure global mocks (like fetch) have no lingering call history between tests
    vi.clearAllMocks();
  });

  describe("getCount", () => {
    it("should return null when feature is disabled", async () => {
      const { getCount } = await import("../letterboxd/cache/index.js");

      const env = {
        FEATURE_SERVER_WATCHLIST_CACHE: "false",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await getCount("testuser", env);
      expect(result).toBeNull();
    });

    it("should return cached count from Redis when available and fresh", async () => {
      const { getCount } = await import("../letterboxd/cache/index.js");

      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            result: JSON.stringify({
              count: 42,
              etag: "test-etag",
              lastFetchedAt: Date.now() - 1000, // 1 second ago
              source: "client",
            }),
          }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await getCount("testuser", env);

      expect(result).toEqual({
        count: 42,
        etag: "test-etag",
        lastFetchedAt: expect.any(Number),
        source: "client",
      });
      expect(fetch).toHaveBeenCalledWith(
        "https://test-redis.upstash.io",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
          body: JSON.stringify(["GET", "watchlist:count:testuser"]),
        })
      );
    });

    it("should return null for stale cache entries", async () => {
      const { getCount } = await import("../letterboxd/cache/index.js");

      const staleTime = Date.now() - 13 * 60 * 60 * 1000; // 13 hours ago
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            result: JSON.stringify({
              count: 42,
              lastFetchedAt: staleTime,
              source: "client",
            }),
          }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await getCount("testuser", env);
      expect(result).toBeNull();
    });

    it("should return cached count from D1 when Redis unavailable", async () => {
      const { getCount } = await import("../letterboxd/cache/index.js");

      const mockFirst = vi.fn().mockResolvedValue({
        value: JSON.stringify({
          count: 24,
          lastFetchedAt: Date.now() - 1000,
          source: "server",
        }),
        expires_at: Date.now() + 10000,
      });

      mockD1Database.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: mockFirst,
        }),
      });

      const env = {
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await getCount("testuser", env);

      expect(result).toEqual({
        count: 24,
        etag: undefined,
        lastFetchedAt: expect.any(Number),
        source: "server",
      });
      expect(mockFirst).toHaveBeenCalled();
    });

    it("should handle invalid cache entries gracefully", async () => {
      const { getCount } = await import("../letterboxd/cache/index.js");

      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            result: JSON.stringify({
              // Missing required fields
              invalid: "data",
            }),
          }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await getCount("testuser", env);
      expect(result).toBeNull();
    });

    it("should handle Redis errors gracefully", async () => {
      const { getCount } = await import("../letterboxd/cache/index.js");

      vi.mocked(fetch).mockRejectedValue(new Error("Redis connection failed"));

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await getCount("testuser", env);
      expect(result).toBeNull();
    });
  });

  describe("setCount", () => {
    it("should do nothing when feature is disabled", async () => {
      const { setCount } = await import("../letterboxd/cache/index.js");

      const env = {
        FEATURE_SERVER_WATCHLIST_CACHE: "false",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const payload = {
        count: 42,
        lastFetchedAt: Date.now(),
        source: "client",
      };

      await setCount("testuser", payload, env);

      expect(fetch).not.toHaveBeenCalled();
      expect(mockD1Database.prepare).not.toHaveBeenCalled();
    });

    it("should store count in Redis when available", async () => {
      const { setCount } = await import("../letterboxd/cache/index.js");

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ result: "OK" }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const payload = {
        count: 42,
        etag: "test-etag",
        lastFetchedAt: Date.now(),
        source: "client",
      };

      await setCount("testuser", payload, env);

      expect(fetch).toHaveBeenCalledWith(
        "https://test-redis.upstash.io",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("SETEX"),
        })
      );
    });

    it("should store count in D1 when Redis unavailable", async () => {
      const { setCount } = await import("../letterboxd/cache/index.js");

      const mockRun = vi.fn().mockResolvedValue({});

      mockD1Database.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: mockRun,
        }),
      });

      const env = {
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      };

      const payload = {
        count: 42,
        lastFetchedAt: Date.now(),
        source: "server",
      };

      await setCount("testuser", payload, env);

      expect(mockRun).toHaveBeenCalled();
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO watchlist_counts_cache")
      );
    });

    it("should validate payload and reject invalid data", async () => {
      const { setCount } = await import("../letterboxd/cache/index.js");

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      };

      // Test invalid count
      const invalidPayload = {
        count: -5, // Invalid negative count
        lastFetchedAt: Date.now(),
        source: "client",
      };

      await expect(
        setCount("testuser", invalidPayload, env)
      ).resolves.not.toThrow(); // Should not throw, just log error

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("acquireLock", () => {
    it("should return true when feature disabled", async () => {
      const { acquireLock } = await import("../letterboxd/cache/index.js");

      const env = {
        FEATURE_SERVER_WATCHLIST_CACHE: "false",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await acquireLock("testuser", 60000, env);
      expect(result).toBe(true);
    });

    it("should acquire lock using Redis SETNX", async () => {
      const { acquireLock } = await import("../letterboxd/cache/index.js");

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ result: 1 }), // Redis SETNX returns 1 for success
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
      };

      const result = await acquireLock("testuser", 60000, env);

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        "https://test-redis.upstash.io",
        expect.objectContaining({
          body: expect.stringContaining("SET"),
        })
      );
    });

    it("should fail to acquire lock when already locked", async () => {
      const { acquireLock } = await import("../letterboxd/cache/index.js");

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ result: 0 }), // Redis SETNX returns 0 for failure
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
      };

      const result = await acquireLock("testuser", 60000, env);
      expect(result).toBe(false);
    });

    it("should use D1 fallback for locking", async () => {
      const { acquireLock } = await import("../letterboxd/cache/index.js");

      // Mock D1 to return successful insert with changes > 0
      const mockRun = vi.fn().mockResolvedValue({
        meta: { changes: 1 }, // Successfully inserted (lock acquired)
      });

      mockD1Database.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: mockRun,
        }),
      });

      const env = {
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      const result = await acquireLock("testuser", 60000, env);
      expect(result).toBe(true);
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe("releaseLock", () => {
    it("should do nothing when feature disabled", async () => {
      const { releaseLock } = await import("../letterboxd/cache/index.js");

      const env = {
        FEATURE_SERVER_WATCHLIST_CACHE: "false",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      await releaseLock("testuser", env);

      expect(fetch).not.toHaveBeenCalled();
      expect(mockD1Database.prepare).not.toHaveBeenCalled();
    });

    it("should release lock using Redis DEL", async () => {
      const { releaseLock } = await import("../letterboxd/cache/index.js");

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ result: 1 }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      await releaseLock("testuser", env);

      expect(fetch).toHaveBeenCalledWith(
        "https://test-redis.upstash.io",
        expect.objectContaining({
          body: expect.stringContaining("DEL"),
        })
      );
    });

    it("should handle errors gracefully", async () => {
      const { releaseLock } = await import("../letterboxd/cache/index.js");

      vi.mocked(fetch).mockRejectedValue(new Error("Redis error"));

      const env = {
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        MOVIES_DB: mockD1Database,
        TMDB_API_KEY: "test-key",
      } as any;

      await expect(releaseLock("testuser", env)).resolves.not.toThrow();
    });
  });
});
