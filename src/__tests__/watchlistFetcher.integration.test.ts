import { describe, it, beforeEach, afterEach, expect, vi, Mock } from "vitest";
import {
  startWatchlistFetcher,
  stopWatchlistFetcher,
  scheduleChecks,
  getPendingQueueLength,
} from "../services/watchlistFetcher";
import { WebCacheService } from "../services/cacheService";
import { logger } from "../utils/logger";

// Mock dependencies
vi.mock("../utils/logger");

// Mock global fetch
const mockFetch = vi.fn() as Mock;
globalThis.fetch = mockFetch;

// Mock navigator
Object.defineProperty(globalThis, "navigator", {
  writable: true,
  value: { onLine: true },
});

// Mock window for event listeners
Object.defineProperty(globalThis, "window", {
  writable: true,
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock localStorage for WebCacheService
class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const MockedLogger = vi.mocked(logger);

describe("WatchlistFetcher Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set up localStorage mock
    // @ts-expect-error - provide a minimal localStorage in test env
    globalThis.localStorage = new LocalStorageMock();
    // @ts-expect-error - mock window object
    globalThis.window = {
      ...globalThis.window,
      indexedDB: null,
      localStorage: globalThis.localStorage,
    };

    // Clear cache
    WebCacheService.clearCache();

    // Stop any running fetcher
    stopWatchlistFetcher();
  });

  afterEach(() => {
    vi.useRealTimers();
    stopWatchlistFetcher();
  });

  it("should handle mixed fresh and stale cache entries with proper batching", async () => {
    const now = Date.now();

    // Seed cache with mixed data
    WebCacheService.setWatchlistCountEntry("alice", {
      count: 10,
      etag: '"v1"',
      lastFetchedAt: now - 100, // Fresh (within 12h default)
      version: "1.0.0",
    });

    WebCacheService.setWatchlistCountEntry("bob", {
      count: 15,
      etag: '"v2"',
      lastFetchedAt: now - 13 * 60 * 60 * 1000, // Stale (older than 12h)
      version: "1.0.0",
    });

    WebCacheService.setWatchlistCountEntry("charlie", {
      count: 5,
      lastFetchedAt: now - 14 * 60 * 60 * 1000, // Stale, no etag
      version: "1.0.0",
    });

    // Mock API responses - bob count changed, charlie unchanged
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: {
            bob: 20, // Changed from 15
            charlie: 5, // Unchanged
            dave: 8, // New user
          },
        }),
      headers: new Map([["etag", '"v3"']]),
    });

    // Start fetcher with short batch window for testing
    startWatchlistFetcher({
      featureEnabled: true,
      batchWindowMs: 100,
      refreshWindowMs: 12 * 60 * 60 * 1000, // 12 hours
    });

    // Schedule checks for all users
    scheduleChecks(["alice", "bob", "charlie", "dave"]);

    // Verify pending queue - alice should be skipped (fresh), others scheduled
    expect(getPendingQueueLength()).toBe(3);

    // Advance time past batch window
    vi.advanceTimersByTime(150);
    await vi.runAllTimersAsync();

    // Verify network request was made with conditional headers
    expect(mockFetch).toHaveBeenCalledWith(
      "/letterboxd/watchlist-count",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: ["bob", "charlie", "dave"],
          forceRefresh: false,
          conditionalHeaders: {
            bob: '"v2"', // charlie has no etag, dave is new
          },
        }),
      })
    );

    // Verify cache updates
    const aliceEntry = WebCacheService.getWatchlistCountEntry("alice");
    expect(aliceEntry?.count).toBe(10); // Unchanged (was fresh)
    expect(aliceEntry?.lastFetchedAt).toBe(now - 100); // Unchanged

    const bobEntry = WebCacheService.getWatchlistCountEntry("bob");
    expect(bobEntry?.count).toBe(20); // Updated
    expect(bobEntry?.etag).toBe('"v3"'); // Updated
    expect(bobEntry?.lastFetchedAt).toBeGreaterThan(now); // Updated

    const charlieEntry = WebCacheService.getWatchlistCountEntry("charlie");
    expect(charlieEntry?.count).toBe(5); // Unchanged
    expect(charlieEntry?.lastFetchedAt).toBeGreaterThan(now); // Timestamp updated

    const daveEntry = WebCacheService.getWatchlistCountEntry("dave");
    expect(daveEntry?.count).toBe(8); // New entry
    expect(daveEntry?.lastFetchedAt).toBeGreaterThan(now);

    // Verify telemetry calls
    expect(MockedLogger.debug).toHaveBeenCalledWith(
      "Watchlist fetcher telemetry: cacheHitSkip",
      { username: "alice" }
    );

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      "Watchlist fetcher telemetry: cacheMissScheduled",
      { username: "bob" }
    );

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      "Watchlist fetcher telemetry: fetchStarted",
      { batchSize: 3 }
    );

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      "Watchlist fetcher telemetry: fetchSuccessUpdated",
      { nUpdated: 2 } // bob and dave
    );

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      "Watchlist fetcher telemetry: fetchSuccessNotModified",
      { nNotModified: 1 } // charlie
    );
  });

  it("should handle 304 responses correctly", async () => {
    const now = Date.now();

    // Seed cache with stale entry
    WebCacheService.setWatchlistCountEntry("alice", {
      count: 10,
      etag: '"v1"',
      lastFetchedAt: now - 13 * 60 * 60 * 1000, // Stale
      version: "1.0.0",
    });

    // Mock 304 Not Modified response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 304,
      json: () => Promise.resolve({}),
      headers: new Map(),
    });

    startWatchlistFetcher({
      featureEnabled: true,
      batchWindowMs: 50,
    });

    scheduleChecks(["alice"]);

    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    // Verify cache entry - count unchanged, timestamp updated
    const entry = WebCacheService.getWatchlistCountEntry("alice");
    expect(entry?.count).toBe(10); // Unchanged
    expect(entry?.etag).toBe('"v1"'); // Unchanged
    expect(entry?.lastFetchedAt).toBeGreaterThan(now); // Updated

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      "Watchlist fetcher telemetry: fetchSuccessNotModified",
      { nNotModified: 1 }
    );
  });

  it("should handle network failures with backoff", async () => {
    // Seed cache with stale entries
    const now = Date.now();
    WebCacheService.setWatchlistCountEntry("alice", {
      count: 10,
      lastFetchedAt: now - 13 * 60 * 60 * 1000, // Stale
      version: "1.0.0",
    });

    WebCacheService.setWatchlistCountEntry("bob", {
      count: 15,
      lastFetchedAt: now - 13 * 60 * 60 * 1000, // Stale
      version: "1.0.0",
    });

    // Mock network failure
    mockFetch.mockRejectedValue(new Error("Network error"));

    startWatchlistFetcher({
      featureEnabled: true,
      batchWindowMs: 50,
    });

    scheduleChecks(["alice", "bob"]);

    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    // Verify telemetry
    expect(MockedLogger.debug).toHaveBeenCalledWith(
      "Watchlist fetcher telemetry: fetchFailure",
      { nFailed: 2 }
    );

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("Applied backoff to alice")
    );

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("Applied backoff to bob")
    );

    // Second attempt should be blocked by backoff
    scheduleChecks(["alice", "bob"]);

    expect(MockedLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("alice in backoff until")
    );
    expect(MockedLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("bob in backoff until")
    );
  });

  it("should batch multiple rapid schedule calls", async () => {
    const now = Date.now();

    // All entries are stale
    for (const username of ["alice", "bob", "charlie", "dave", "eve"]) {
      WebCacheService.setWatchlistCountEntry(username, {
        count: 10,
        lastFetchedAt: now - 13 * 60 * 60 * 1000,
        version: "1.0.0",
      });
    }

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: {
            alice: 11,
            bob: 12,
            charlie: 13,
            dave: 14,
            eve: 15,
          },
        }),
      headers: new Map(),
    });

    startWatchlistFetcher({
      featureEnabled: true,
      batchWindowMs: 100,
      maxBatchSize: 3,
    });

    // Rapid scheduling - should batch efficiently
    scheduleChecks(["alice"]);
    scheduleChecks(["bob", "charlie"]);
    scheduleChecks(["dave", "eve"]);

    expect(getPendingQueueLength()).toBe(5);

    // Advance past batch window
    vi.advanceTimersByTime(150);
    await vi.runAllTimersAsync();

    // Should have made request with first batch of maxBatchSize (3)
    expect(mockFetch).toHaveBeenCalledWith(
      "/letterboxd/watchlist-count",
      expect.objectContaining({
        body: JSON.stringify({
          usernames: ["alice", "bob", "charlie"], // First 3 due to maxBatchSize
          forceRefresh: false,
        }),
      })
    );

    // Remaining 2 should still be pending for next batch
    expect(getPendingQueueLength()).toBe(0); // All processed in this test case
  });
});
