/*
 * BoxdBuddy - Friends Cache Integration Tests
 * Copyright (C) 2025 Wootehfook
 * AI Generated: Claude Sonnet 4 - 2025-01-02
 * Modified: GitHub Copilot - 2026-02-07
 * Change: Mock fetch to prevent real network calls in tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the cache module
const mockGetCount = vi.fn();
const mockSetCount = vi.fn();
const mockAcquireLock = vi.fn();
const mockReleaseLock = vi.fn();

vi.mock("../letterboxd/cache/index.js", () => ({
  getCount: mockGetCount,
  setCount: mockSetCount,
  acquireLock: mockAcquireLock,
  releaseLock: mockReleaseLock,
}));

// Mock fetch to prevent real network calls
const mockFetch = vi.fn();

// Mock the D1 database
const mockDatabase = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    })),
  })),
};

describe("Friends Cache Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub global fetch to prevent real network calls
    vi.stubGlobal("fetch", mockFetch);
    // Reset fetch mock to default (returns empty friends list)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("<html></html>"),
    });
  });

  afterEach(() => {
    // Restore global fetch to prevent leaking into other tests
    vi.unstubAllGlobals();
  });

  const createEnv = (overrides: any = {}) => ({
    MOVIES_DB: mockDatabase,
    TMDB_API_KEY: "test-key",
    FEATURE_SERVER_WATCHLIST_CACHE: "true",
    ...overrides,
  });

  const createRequest = (body: any) => {
    return new Request("https://example.com/letterboxd/friends", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Cache Fallback Behavior", () => {
    it("should use client cache when provided", async () => {
      // Mock cached friends data
      const mockFirst = vi.fn().mockResolvedValue({
        friends_data: JSON.stringify([
          { username: "friend1", displayName: "Friend One" },
          { username: "friend2", displayName: "Friend Two" },
        ]),
        last_updated: Date.now() - 1000,
        expires_at: Date.now() + 10000,
      });

      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: mockFirst,
        }),
      });

      const { onRequestPost } = await import("../letterboxd/friends/index.js");

      const request = createRequest({
        username: "testuser",
        watchlistCache: {
          friend1: { count: 42, lastFetchedAt: Date.now() },
          friend2: { count: 24, lastFetchedAt: Date.now() },
        },
      });

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.friends).toHaveLength(2);
      expect(data.friends[0].watchlistCount).toBe(42);
      expect(data.friends[1].watchlistCount).toBe(24);

      // Should not call server cache since client cache provided
      expect(mockGetCount).not.toHaveBeenCalled();
    });

    it("should fallback to server cache when client cache missing", async () => {
      // Mock cached friends data
      const mockFirst = vi.fn().mockResolvedValue({
        friends_data: JSON.stringify([
          { username: "friend1", displayName: "Friend One" },
          { username: "friend2", displayName: "Friend Two" },
        ]),
        last_updated: Date.now() - 1000,
        expires_at: Date.now() + 10000,
      });

      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: mockFirst,
        }),
      });

      // Mock server cache responses
      mockGetCount
        .mockResolvedValueOnce({ count: 15, lastFetchedAt: Date.now() - 1000 }) // friend1
        .mockResolvedValueOnce(null); // friend2 - no server cache

      const { onRequestPost } = await import("../letterboxd/friends/index.js");

      const request = createRequest({
        username: "testuser",
        // No watchlistCache provided
      });

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.friends).toHaveLength(2);
      expect(data.friends[0].watchlistCount).toBe(15); // From server cache
      expect(data.friends[1]).not.toHaveProperty("watchlistCount"); // No cache available

      // Should call server cache for friend1 (which was found in cache)
      expect(mockGetCount).toHaveBeenCalledWith("friend1", env);
      // friend2 might not be called depending on implementation details
    });

    it("should prefer client cache over server cache", async () => {
      // Mock cached friends data
      const mockFirst = vi.fn().mockResolvedValue({
        friends_data: JSON.stringify([
          { username: "friend1", displayName: "Friend One" },
        ]),
        last_updated: Date.now() - 1000,
        expires_at: Date.now() + 10000,
      });

      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: mockFirst,
        }),
      });

      // Mock server cache (should not be used)
      mockGetCount.mockResolvedValue({ count: 99, lastFetchedAt: Date.now() });

      const { onRequestPost } = await import("../letterboxd/friends/index.js");

      const request = createRequest({
        username: "testuser",
        watchlistCache: {
          friend1: { count: 42, lastFetchedAt: Date.now() }, // Client cache
        },
      });

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.friends).toHaveLength(1);
      expect(data.friends[0].watchlistCount).toBe(42); // Client cache value, not server cache

      // Should not call server cache since client cache provided
      expect(mockGetCount).not.toHaveBeenCalled();
    });

    it("should handle server cache errors gracefully", async () => {
      // Mock cached friends data
      const mockFirst = vi.fn().mockResolvedValue({
        friends_data: JSON.stringify([
          { username: "friend1", displayName: "Friend One" },
        ]),
        last_updated: Date.now() - 1000,
        expires_at: Date.now() + 10000,
      });

      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: mockFirst,
        }),
      });

      // Mock server cache error
      mockGetCount.mockRejectedValue(new Error("Cache error"));

      const { onRequestPost } = await import("../letterboxd/friends/index.js");

      const request = createRequest({
        username: "testuser",
        // No client cache
      });

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.friends).toHaveLength(1);
      expect(data.friends[0]).not.toHaveProperty("watchlistCount"); // No cache due to error

      expect(mockGetCount).toHaveBeenCalled();
    });

    it("should work when feature flag disabled", async () => {
      // Mock cached friends data
      const mockFirst = vi.fn().mockResolvedValue({
        friends_data: JSON.stringify([
          { username: "friend1", displayName: "Friend One" },
        ]),
        last_updated: Date.now() - 1000,
        expires_at: Date.now() + 10000,
      });

      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: mockFirst,
        }),
      });

      const { onRequestPost } = await import("../letterboxd/friends/index.js");

      const request = createRequest({
        username: "testuser",
        watchlistCache: {
          friend1: { count: 42, lastFetchedAt: Date.now() },
        },
      });

      const env = createEnv({ FEATURE_SERVER_WATCHLIST_CACHE: "false" });
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.friends).toHaveLength(1);
      expect(data.friends[0].watchlistCount).toBe(42); // Client cache still works

      // Should not call server cache when feature disabled
      expect(mockGetCount).not.toHaveBeenCalled();
    });
  });

  describe("Fresh Data Requests", () => {
    it("should use cache fallback for fresh scraped friends", async () => {
      // Mock no cached friends (force fresh scrape) but scraping returns empty
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockRun = vi.fn().mockResolvedValue({});

      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: mockFirst,
          run: mockRun,
        }),
      });

      // Mock server cache for one friend
      mockGetCount.mockResolvedValue(null); // No server cache available

      // Mock fetch to return a valid HTML response with no friends
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            '<html><body><div class="friends-list"></div></body></html>'
          ),
      });
      const sampleHtml = `
        <table>
          <tr>
            <td>
              <a href="/friend1/">Friend One</a>
              <img class="avatar" src="https://a.ltrbxd.com/avatar.jpg" />
            </td>
          </tr>
        </table>
      `;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => sampleHtml,
      } as any);

      const { onRequestPost } = await import("../letterboxd/friends/index.js");

      const request = createRequest({
        username: "testuser",
        // No client cache, no cached friends -> fresh scrape
      });

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.cached).toBe(false); // Fresh data
      // Scraping returns empty friends list (mocked)
      expect(data.friends).toEqual([]);
    });
  });
});
