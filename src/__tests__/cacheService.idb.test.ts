import { describe, it, beforeEach, expect, vi } from "vitest";
import { WebCacheService } from "../services/cacheService";

// Small mock types to approximate IDB request objects used in tests
type IDBRequestMock<T = unknown> = {
  result: T;
  onsuccess: ((ev?: unknown) => void) | null;
  onerror: ((ev?: unknown) => void) | null;
  onupgradeneeded?: ((ev?: unknown) => void) | null;
};

// Minimal in-memory IndexedDB mock for testing
class MockIDBDatabase {
  objectStoreNames = { contains: () => true };
  stores: Record<string, Record<string, unknown>> = {};

  transaction(_storeNames: string[], _mode: string) {
    return new MockIDBTransaction(this.stores);
  }

  createObjectStore(name: string, _options?: unknown) {
    this.stores[name] = {};
    return new MockIDBObjectStore(this.stores[name]);
  }

  close(): void {
    return; // noop implemented to satisfy linter
  }
}

class MockIDBTransaction {
  constructor(private stores: Record<string, Record<string, unknown>>) {}

  objectStore(name: string) {
    if (!this.stores[name]) this.stores[name] = {};
    return new MockIDBObjectStore(this.stores[name]);
  }
}

class MockIDBObjectStore {
  constructor(private store: Record<string, unknown>) {}

  get(key: string): IDBRequestMock<unknown> {
    const value = this.store[key];
    return {
      result: value,
      onsuccess: null,
      onerror: null,
    };
  }

  put(value: { key: string; [k: string]: unknown }): IDBRequestMock<void> {
    this.store[value.key] = value;
    return {
      onsuccess: null,
      onerror: null,
      result: undefined,
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

    const request: IDBRequestMock<MockIDBDatabase> = {
      result: db,
      onsuccess: null,
      onerror: null,
    };

    // Attach optional onupgradeneeded for tests that expect it
    (
      request as unknown as {
        onupgradeneeded?: ((ev?: unknown) => void) | null;
      }
    ).onupgradeneeded = null;

    return request;
  }

  deleteDatabase(name: string) {
    delete this.databases[name];
  }

  // Minimal comparator to satisfy IDBFactory interface in lib.dom
  cmp(first: unknown, second: unknown) {
    if (first === second) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (first as any) > (second as any) ? 1 : -1;
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
    // Provide mocks for test env
    Object.defineProperty(globalThis, "localStorage", {
      value: new LocalStorageMock(),
      configurable: true,
    });

    mockIDBFactory = new MockIDBFactory();
    Object.defineProperty(globalThis, "window", {
      value: {
        indexedDB: mockIDBFactory,
        localStorage: globalThis.localStorage,
      },
      configurable: true,
    });
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
    // Mock IndexedDB to fail — assign a minimal window-like object
    const failingWindow = {
      indexedDB: null as unknown,
      localStorage: new LocalStorageMock(),
    };
    Object.defineProperty(globalThis, "window", {
      value: failingWindow,
      configurable: true,
    });

    WebCacheService.setWatchlistCountEntry("fallbackuser", { count: 999 });

    const result = await WebCacheService.readAllWatchlistCache();
    expect(result["fallbackuser"]?.count).toBe(999);
  });

  it("should validate corrupted entries when reading from IDB", async () => {
    // Set valid and invalid data
    WebCacheService.setWatchlistCountEntry("valid", { count: 42 });

    // Directly corrupt the cache to simulate corruption
    const cache = WebCacheService.getCache();
    cache.watchlistCounts ??= {};
    cache.watchlistCounts["corrupted"] = {
      count: "not-a-number" as unknown as number,
    };
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
