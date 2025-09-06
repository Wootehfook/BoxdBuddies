import { describe, it, beforeEach, expect, vi } from "vitest";
import { WebCacheService } from "../services/cacheService";

// Minimal localStorage mock for test environment
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

// Mock IndexedDB as unavailable for most tests

describe("WebCacheService - watchlistCounts", () => {
  beforeEach(() => {
    // @ts-expect-error - provide a minimal localStorage in test env
    globalThis.localStorage = new LocalStorageMock();
    // @ts-expect-error - mock window object with proper IDBFactory type
    globalThis.window = {
      indexedDB: null as any,
      localStorage: globalThis.localStorage,
    };
    WebCacheService.clearCache();
    vi.clearAllMocks();
  });

  it("sets and reads a single watchlist count entry", () => {
    WebCacheService.setWatchlistCountEntry("alice", {
      count: 5,
      etag: '"v1"',
      lastFetchedAt: 123456,
      version: "1.0.0",
    });

    const entry = WebCacheService.getWatchlistCountEntry("alice");
    expect(entry).not.toBeNull();
    expect(entry?.count).toBe(5);
    expect(entry?.etag).toBe('"v1"');
  });

  it("returns an empty map when no counts exist", () => {
    const all = WebCacheService.getAllWatchlistCounts();
    expect(Object.keys(all).length).toBe(0);
  });

  it("getAllWatchlistCounts returns inserted entries and skips corrupted ones", () => {
    // Insert a valid entry via set API
    WebCacheService.setWatchlistCountEntry("bob", { count: 3 });
    // Insert a corrupted entry directly into underlying cache to simulate corruption
    const raw = JSON.parse(
      globalThis.localStorage.getItem("boxdbuddy_cache") || "{}"
    );
    raw.watchlistCounts = raw.watchlistCounts || {};
    raw.watchlistCounts["corrupt"] = { count: "not-a-number" }; // corrupted
    globalThis.localStorage.setItem("boxdbuddy_cache", JSON.stringify(raw));

    const all = WebCacheService.getAllWatchlistCounts();
    expect(all["bob"].count).toBe(3);
    expect(all["corrupt"]).toBeUndefined();
  });

  it("readAllWatchlistCache returns the same data as getAllWatchlistCounts when IDB unavailable", async () => {
    WebCacheService.setWatchlistCountEntry("alice", {
      count: 10,
      etag: '"v2"',
    });
    WebCacheService.setWatchlistCountEntry("bob", { count: 5 });

    const syncResult = WebCacheService.getAllWatchlistCounts();
    const asyncResult = await WebCacheService.readAllWatchlistCache();

    expect(asyncResult).toEqual(syncResult);
    expect(asyncResult["alice"].count).toBe(10);
    expect(asyncResult["bob"].count).toBe(5);
  });

  it("falls back to localStorage when initialization fails", async () => {
    // Set up data in localStorage first
    WebCacheService.setWatchlistCountEntry("fallback", { count: 42 });

    const result = await WebCacheService.readAllWatchlistCache();
    expect(result["fallback"].count).toBe(42);
  });
});
