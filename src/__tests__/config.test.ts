/**
 * Configuration Tests
 * Tests for watchlist cache and feature flag configurations
 */

import { describe, it, expect } from "vitest";
import {
  REFRESH_WINDOW_MS,
  BATCH_WINDOW_MS,
  MAX_BATCH_SIZE,
} from "../config/watchlistCache";
import {
  FEATURE_WATCHLIST_CACHE,
  FEATURE_WATCHLIST_FETCHER,
} from "../config/featureFlags";

describe("Watchlist Cache Configuration", () => {
  it("should export valid numeric constants", () => {
    expect(typeof REFRESH_WINDOW_MS).toBe("number");
    expect(typeof BATCH_WINDOW_MS).toBe("number");
    expect(typeof MAX_BATCH_SIZE).toBe("number");

    expect(REFRESH_WINDOW_MS).toBeGreaterThan(0);
    expect(BATCH_WINDOW_MS).toBeGreaterThan(0);
    expect(MAX_BATCH_SIZE).toBeGreaterThan(0);
  });

  it("should have expected default values", () => {
    expect(REFRESH_WINDOW_MS).toBe(12 * 60 * 60 * 1000); // 12 hours in ms
    expect(BATCH_WINDOW_MS).toBe(5 * 1000); // 5 seconds in ms
    expect(MAX_BATCH_SIZE).toBe(50);
  });
});

describe("Feature Flags Configuration", () => {
  it("should export valid boolean constants", () => {
    expect(typeof FEATURE_WATCHLIST_CACHE).toBe("boolean");
    expect(typeof FEATURE_WATCHLIST_FETCHER).toBe("boolean");
  });

  it("should have expected default values", () => {
    expect(FEATURE_WATCHLIST_CACHE).toBe(false);
    expect(FEATURE_WATCHLIST_FETCHER).toBe(false);
  });
});
