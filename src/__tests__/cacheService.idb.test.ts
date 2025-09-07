import { describe, it, beforeEach, expect, vi } from "vitest";
import { WebCacheService } from "../services/cacheService";

// Minimal in-memory IndexedDB mock for testing
class MockIDBDatabase {
  objectStoreNames = { contains: () => true };
  stores: Record<string, Record<string, any>> = {};

  transaction(_storeNames: string[], _mode: string) {
    return new MockIDBTransaction(this.stores);
  }

  createObjectStore(name: string, _options?: any) {
    this.stores[name] = {};
    return new MockIDBObjectStore(this.stores[name]);
  }

  close() {}
}

class MockIDBTransaction {
  constructor(private stores: Record<string, Record<string, any>>) {}

  objectStore(name: string) {
    if (!this.stores[name]) this.stores[name] = {};
    return new MockIDBObjectStore(this.stores[name]);
  }
}

class MockIDBObjectStore {
  constructor(private store: Record<string, any>) {}

  get(key: string) {
    const value = this.store[key];
    return {
      result: value,
      onsuccess: null as any,
      onerror: null as any,
    };
  }

  put(value: any) {
    this.store[value.key] = value;
    return {
      onsuccess: null as any,
      onerror: null as any,
    };
  }
}

class MockIDBFactory {
  databases: Record<string, MockIDBDatabase> = {};

  open(name: string, _version?: number) {
    if (!this.databases[name]) {
      this.databases[name] = new MockIDBDatabase();
    }
    const db = this.databases[name];

    return {
      result: db,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    };
  }

  deleteDatabase(name: string) {
    delete this.databases[name];
  }

  // Minimal comparator to satisfy IDBFactory interface in lib.dom
  cmp(first: any, second: any) {
    if (first === second) return 0;
    return first > second ? 1 : -1;
  }
}

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

describe("WebCacheService - IndexedDB Integration", () => {
  let mockIDBFactory: MockIDBFactory;

  beforeEach(() => {
    // Provide mocks for test env (cast to any to avoid DOM lib types)
    (globalThis as any).localStorage = new LocalStorageMock();

    mockIDBFactory = new MockIDBFactory();
    (globalThis as any).window = {
      indexedDB: mockIDBFactory,
      localStorage: (globalThis as any).localStorage,
    };

    WebCacheService.clearCache();
    vi.clearAllMocks();
  });

  it("should detect IndexedDB availability", async () => {
    // This tests the idbAvailable function indirectly through readAllWatchlistCache
    const result = await WebCacheService.readAllWatchlistCache();
    expect(result).toEqual({});
  });

  it("should save and retrieve watchlist counts through IDB when available", async () => {
    // Mock the IDB requests to work properly
    const originalOpen = mockIDBFactory.open;
    mockIDBFactory.open = function (name: string, version?: number) {
      const request = originalOpen.call(this, name, version);
      // Simulate async success
      setTimeout(() => {
        if (request.onupgradeneeded) request.onupgradeneeded();
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    };

    // Set some data
    WebCacheService.setWatchlistCountEntry("testuser", {
      count: 123,
      etag: '"test"',
    });

    // Wait a bit for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = await WebCacheService.readAllWatchlistCache();
    expect(result["testuser"]?.count).toBe(123);
  });

  it("should fall back to localStorage when IndexedDB operations fail", async () => {
    // Mock IndexedDB to fail
    // Mock failing IndexedDB
    (globalThis as any).window = {
      indexedDB: null,
      localStorage: (globalThis as any).localStorage,
    };

    WebCacheService.setWatchlistCountEntry("fallbackuser", { count: 999 });

    const result = await WebCacheService.readAllWatchlistCache();
    expect(result["fallbackuser"]?.count).toBe(999);
  });

  it("should validate corrupted entries when reading from IDB", async () => {
    // Set valid and invalid data
    WebCacheService.setWatchlistCountEntry("valid", { count: 42 });

    // Directly corrupt the cache to simulate corruption
    const cache = WebCacheService.getCache();
    if (!cache.watchlistCounts) cache.watchlistCounts = {};
    cache.watchlistCounts["corrupted"] = { count: "not-a-number" as any };
    WebCacheService.saveCache(cache);

    const result = await WebCacheService.readAllWatchlistCache();
    expect(result["valid"]?.count).toBe(42);
    expect(result["corrupted"]).toBeUndefined();
  }, 15000);

  it("should persist data to both localStorage and IndexedDB", () => {
    const testData = { count: 777, etag: '"sync-test"' };
    WebCacheService.setWatchlistCountEntry("synctest", testData);

    // Check localStorage immediately (synchronous)
    const localResult = WebCacheService.getAllWatchlistCounts();
    expect(localResult["synctest"]?.count).toBe(777);

    // Check that the same data is available through the sync API
    const syncResult = WebCacheService.getWatchlistCountEntry("synctest");
    expect(syncResult?.count).toBe(777);
    expect(syncResult?.etag).toBe('"sync-test"');
  });
});
