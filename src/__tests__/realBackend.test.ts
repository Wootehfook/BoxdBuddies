/*
 * BoxdBuddies - Movie Watchlist Comparison Tool
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock WebCacheService
vi.mock("../services/cacheService", () => ({
  WebCacheService: {
    getAllWatchlistCounts: vi.fn(),
  },
}));

// Mock logger
vi.mock("../utils/logger", () => ({
  logger: {
    logCacheHit: vi.fn(),
    logCacheMiss: vi.fn(),
    info: vi.fn(),
  },
  incrementMetric: vi.fn(),
}));

// Set up window mock before importing modules
(globalThis as any).window = {
  location: { origin: "http://localhost:3000" },
};

// Import modules - no longer mocking realBackend since we want to test actual implementation
import { WebCacheService } from "../services/cacheService";
import { logger } from "../utils/logger";
import { realBackendAPI } from "../services/realBackend";

describe("realBackendAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.origin
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchFriends", () => {
    it("should attach watchlistCache to POST body when cache exists", async () => {
      const mockCache = { alice: { count: 5 }, bob: { count: 10 } };
      (WebCacheService.getAllWatchlistCounts as any).mockReturnValue(mockCache);

      const mockResponse = {
        friends: [
          { username: "alice", displayName: "Alice" },
          { username: "charlie", displayName: "Charlie" },
        ],
        cached: false,
        count: 2,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await realBackendAPI.fetchFriends("testuser");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/letterboxd/friends",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"username":"testuser"'),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(logger.logCacheHit).toHaveBeenCalledWith("alice");
      expect(logger.logCacheMiss).toHaveBeenCalledWith("charlie");
      expect(logger.info).toHaveBeenCalledWith(
        "Friends cache telemetry: 1 hits, 1 misses"
      );
    });

    it("should not attach watchlistCache when cache is empty", async () => {
      (WebCacheService.getAllWatchlistCounts as any).mockReturnValue({});

      const mockResponse = {
        friends: [{ username: "alice", displayName: "Alice" }],
        cached: false,
        count: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await realBackendAPI.fetchFriends("testuser");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/letterboxd/friends",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"username":"testuser"'),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(logger.logCacheHit).not.toHaveBeenCalled();
      expect(logger.logCacheMiss).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      (WebCacheService.getAllWatchlistCounts as any).mockReturnValue({});
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(realBackendAPI.fetchFriends("testuser")).rejects.toThrow(
        "Failed to fetch friends: 500"
      );
    });
  });

  describe("fetchWatchlistCount", () => {
    it("should attach watchlistCache and emit telemetry for cache hit", async () => {
      const mockCache = { testuser: { count: 15 } };
      (WebCacheService.getAllWatchlistCounts as any).mockReturnValue(mockCache);

      const mockResponse = { count: 15, cached: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await realBackendAPI.fetchWatchlistCount("testuser");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/letterboxd/watchlist-count",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"username":"testuser"'),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(logger.logCacheHit).toHaveBeenCalledWith("testuser");
      expect(logger.info).toHaveBeenCalledWith(
        "Watchlist count cache telemetry: 1 hit, 0 misses"
      );
    });

    it("should emit telemetry for cache miss", async () => {
      const mockCache = { otheruser: { count: 5 } };
      (WebCacheService.getAllWatchlistCounts as any).mockReturnValue(mockCache);

      const mockResponse = { count: 20, cached: false };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await realBackendAPI.fetchWatchlistCount("testuser");

      expect(result).toEqual(mockResponse);
      expect(logger.logCacheMiss).toHaveBeenCalledWith("testuser");
      expect(logger.info).toHaveBeenCalledWith(
        "Watchlist count cache telemetry: 0 hits, 1 miss"
      );
    });
  });

  describe("compareWatchlists", () => {
    it("should attach watchlistCache and emit telemetry for multiple users", async () => {
      const mockCache = { mainuser: { count: 10 }, friend1: { count: 8 } };
      (WebCacheService.getAllWatchlistCounts as any).mockReturnValue(mockCache);

      const mockResponse = {
        movies: [
          {
            id: 1,
            title: "Test Movie",
            year: 2023,
            friendCount: 2,
            friendList: ["mainuser", "friend1"],
          },
        ],
        userWatchlistCount: 10,
        friendCounts: { friend1: 8 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await realBackendAPI.compareWatchlists({
        mainUsername: "mainuser",
        friendUsernames: ["friend1", "friend2"],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/watchlist-comparison",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"username":"mainuser"'),
        })
      );

      expect(logger.logCacheHit).toHaveBeenCalledWith("mainuser");
      expect(logger.logCacheHit).toHaveBeenCalledWith("friend1");
      expect(logger.logCacheMiss).toHaveBeenCalledWith("friend2");
      expect(logger.info).toHaveBeenCalledWith(
        "Compare cache telemetry: 2 hits, 1 misses"
      );
    });
  });
});
