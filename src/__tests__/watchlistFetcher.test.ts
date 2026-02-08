// AI Generated: GitHub Copilot - 2026-02-07
// Modified by: Woo T. Fook
// Change: Fix TypeScript mock typing issues for Vitest 4.x compatibility
// using vi.spyOn

import { describe, it, beforeEach, afterEach, expect, vi, Mock } from "vitest";
import {
  startWatchlistFetcher,
  stopWatchlistFetcher,
  scheduleChecks,
  runImmediateCheck,
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

const MockedLogger = vi.mocked(logger);

describe("WatchlistFetcher", () => {
  let getWatchlistCountEntrySpy: ReturnType<typeof vi.spyOn>;
  let setWatchlistCountEntrySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset navigator.onLine to ensure test isolation
    Object.defineProperty(globalThis.navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Spy on cache service static methods
    getWatchlistCountEntrySpy = vi.spyOn(
      WebCacheService,
      "getWatchlistCountEntry"
    );
    setWatchlistCountEntrySpy = vi.spyOn(
      WebCacheService,
      "setWatchlistCountEntry"
    );

    // Reset cache service mocks
    getWatchlistCountEntrySpy.mockReturnValue(null);
    setWatchlistCountEntrySpy.mockImplementation(() => {});

    // Stop any running fetcher
    stopWatchlistFetcher();
  });

  afterEach(() => {
    vi.useRealTimers();
    stopWatchlistFetcher();
    vi.restoreAllMocks();
  });

  describe("startWatchlistFetcher", () => {
    it("should not start if featureEnabled is false", () => {
      startWatchlistFetcher({ featureEnabled: false });

      expect(MockedLogger.debug).toHaveBeenCalledWith(
        "Watchlist fetcher disabled via configuration"
      );
    });

    it("should start successfully when featureEnabled is true", () => {
      startWatchlistFetcher({ featureEnabled: true });

      expect(MockedLogger.info).toHaveBeenCalledWith(
        "Watchlist fetcher started"
      );
    });
  });

  describe("scheduleChecks", () => {
    beforeEach(() => {
      startWatchlistFetcher({
        featureEnabled: true,
        refreshWindowMs: 1000,
        batchWindowMs: 100,
      });
    });

    it("should skip usernames with recent cache entries", () => {
      const now = Date.now();
      getWatchlistCountEntrySpy.mockReturnValue({
        count: 5,
        lastFetchedAt: now - 500, // Recent
        version: "1.0.0",
      });

      scheduleChecks(["alice"]);

      expect(MockedLogger.debug).toHaveBeenCalledWith(
        "Cache hit for alice, skipping schedule"
      );
      expect(getPendingQueueLength()).toBe(0);
    });

    it("should schedule usernames with stale cache entries", () => {
      const now = Date.now();
      getWatchlistCountEntrySpy.mockReturnValue({
        count: 5,
        lastFetchedAt: now - 2000, // Stale (older than refreshWindowMs)
        version: "1.0.0",
      });

      scheduleChecks(["alice"]);

      expect(getPendingQueueLength()).toBe(1);
    });

    it("should schedule usernames with no cache entries", () => {
      getWatchlistCountEntrySpy.mockReturnValue(null);

      scheduleChecks(["alice", "bob"]);

      expect(getPendingQueueLength()).toBe(2);
    });

    it("should batch requests after batchWindowMs", async () => {
      getWatchlistCountEntrySpy.mockReturnValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: { alice: 10, bob: 15 } }),
        headers: new Map(),
      });

      scheduleChecks(["alice", "bob"]);

      // Fast-forward past batch window
      vi.advanceTimersByTime(150);

      // Wait for async operations
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledWith(
        "/letterboxd/watchlist-count",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usernames: ["alice", "bob"],
            forceRefresh: false,
          }),
        })
      );
    });
  });

  describe("runImmediateCheck", () => {
    beforeEach(() => {
      startWatchlistFetcher({ featureEnabled: true });
    });

    it("should send correct request body and update cache on 200 with changed count", async () => {
      const now = Date.now();
      getWatchlistCountEntrySpy.mockReturnValue({
        count: 5,
        lastFetchedAt: now - 1000,
        version: "1.0.0",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: { alice: 10 } }),
        headers: new Map([["etag", '"v2"']]),
      });

      await runImmediateCheck(["alice"]);

      expect(mockFetch).toHaveBeenCalledWith(
        "/letterboxd/watchlist-count",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            usernames: ["alice"],
            forceRefresh: false,
          }),
        })
      );

      expect(setWatchlistCountEntrySpy).toHaveBeenCalledWith(
        "alice",
        expect.objectContaining({
          count: 10,
          etag: '"v2"',
          version: "1.0.0",
        })
      );
    });

    it("should handle 304 response by updating lastFetchedAt only", async () => {
      const now = Date.now();
      const existingEntry = {
        count: 5,
        etag: '"v1"',
        lastFetchedAt: now - 1000,
        version: "1.0.0",
      };
      getWatchlistCountEntrySpy.mockReturnValue(existingEntry);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 304,
        json: () => Promise.resolve({}),
        headers: new Map(),
      });

      await runImmediateCheck(["alice"]);

      expect(setWatchlistCountEntrySpy).toHaveBeenCalledWith(
        "alice",
        expect.objectContaining({
          count: 5, // Unchanged
          etag: '"v1"', // Unchanged
          lastFetchedAt: expect.any(Number), // Updated
        })
      );
    });
  });

  describe("backoff behavior", () => {
    beforeEach(() => {
      startWatchlistFetcher({
        featureEnabled: true,
        batchWindowMs: 50,
      });
    });

    it("should apply exponential backoff on network failures", async () => {
      getWatchlistCountEntrySpy.mockReturnValue(null);

      // First failure
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      scheduleChecks(["alice"]);
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(MockedLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Applied backoff to alice")
      );

      // Second attempt should be blocked by backoff
      scheduleChecks(["alice"]);
      expect(MockedLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("alice in backoff until")
      );
    });

    it("should schedule retries with increasing delay", async () => {
      getWatchlistCountEntrySpy.mockReturnValue(null);

      mockFetch.mockRejectedValue(new Error("Network error"));

      // First failure
      await runImmediateCheck(["alice"]);

      // Second failure should have longer backoff
      await runImmediateCheck(["alice"]);

      // Should have two backoff calls with increasing delays
      const backoffCalls = MockedLogger.debug.mock.calls.filter(
        (call: unknown[]) => String(call[0]).includes("Applied backoff")
      );
      expect(backoffCalls.length).toBeGreaterThan(0);
    });
  });

  describe("conditional requests", () => {
    beforeEach(() => {
      startWatchlistFetcher({ featureEnabled: true });
    });

    it("should include conditional headers when etag is available", async () => {
      getWatchlistCountEntrySpy.mockReturnValue({
        count: 5,
        etag: '"v1"',
        lastFetchedAt: Date.now() - 2000,
        version: "1.0.0",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: { alice: 5 } }),
        headers: new Map(),
      });

      await runImmediateCheck(["alice"]);

      expect(mockFetch).toHaveBeenCalledWith(
        "/letterboxd/watchlist-count",
        expect.objectContaining({
          body: JSON.stringify({
            usernames: ["alice"],
            forceRefresh: false,
            conditionalHeaders: { alice: '"v1"' },
          }),
        })
      );
    });
  });

  describe("offline handling", () => {
    beforeEach(() => {
      startWatchlistFetcher({ featureEnabled: true });
    });

    it("should queue usernames when offline", async () => {
      // Mock offline
      Object.defineProperty(globalThis.navigator, "onLine", {
        writable: true,
        value: false,
      });

      getWatchlistCountEntrySpy.mockReturnValue(null);

      await runImmediateCheck(["alice"]);

      // Should not make network request when offline
      expect(mockFetch).not.toHaveBeenCalled();
      expect(MockedLogger.debug).toHaveBeenCalledWith(
        "Offline detected, queuing usernames for later"
      );
    });

    it("should process queued usernames when coming back online", () => {
      // Mock window.addEventListener to capture the online handler
      const addEventListenerSpy = vi.spyOn(
        globalThis.window,
        "addEventListener"
      );

      startWatchlistFetcher({ featureEnabled: true });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "online",
        expect.any(Function)
      );
    });
  });

  describe("telemetry", () => {
    beforeEach(() => {
      startWatchlistFetcher({ featureEnabled: true });
    });

    it("should emit cacheHitSkip telemetry", () => {
      getWatchlistCountEntrySpy.mockReturnValue({
        count: 5,
        lastFetchedAt: Date.now() - 500, // Recent
        version: "1.0.0",
      });

      scheduleChecks(["alice"]);

      expect(MockedLogger.debug).toHaveBeenCalledWith(
        "Watchlist fetcher telemetry: cacheHitSkip",
        { username: "alice" }
      );
    });

    it("should emit cacheMissScheduled telemetry", () => {
      getWatchlistCountEntrySpy.mockReturnValue(null);

      scheduleChecks(["alice"]);

      expect(MockedLogger.debug).toHaveBeenCalledWith(
        "Watchlist fetcher telemetry: cacheMissScheduled",
        { username: "alice" }
      );
    });
  });
});
