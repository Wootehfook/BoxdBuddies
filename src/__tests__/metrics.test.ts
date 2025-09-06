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

import { describe, it, expect, beforeEach, vi } from "vitest";
import { incrementMetric, getMetric, resetMetric } from "../utils/logger";
import { WebCacheService } from "../services/cacheService";
import {
  scheduleChecks,
  startWatchlistFetcher,
} from "../services/watchlistFetcher";

describe("Metrics", () => {
  beforeEach(() => {
    resetMetric();
  });

  describe("incrementMetric", () => {
    it("should increment metric by 1 by default", () => {
      incrementMetric("test.metric");
      expect(getMetric("test.metric")).toBe(1);

      incrementMetric("test.metric");
      expect(getMetric("test.metric")).toBe(2);
    });

    it("should increment metric by specified value", () => {
      incrementMetric("test.metric", 5);
      expect(getMetric("test.metric")).toBe(5);

      incrementMetric("test.metric", 3);
      expect(getMetric("test.metric")).toBe(8);
    });

    it("should return 0 for non-existent metric", () => {
      expect(getMetric("nonexistent")).toBe(0);
    });
  });

  describe("resetMetric", () => {
    it("should reset specific metric", () => {
      incrementMetric("test.metric", 5);
      expect(getMetric("test.metric")).toBe(5);

      resetMetric("test.metric");
      expect(getMetric("test.metric")).toBe(0);
    });

    it("should reset all metrics when no name provided", () => {
      incrementMetric("metric1", 1);
      incrementMetric("metric2", 2);
      expect(getMetric("metric1")).toBe(1);
      expect(getMetric("metric2")).toBe(2);

      resetMetric();
      expect(getMetric("metric1")).toBe(0);
      expect(getMetric("metric2")).toBe(0);
    });
  });

  describe("Cache Service Instrumentation", () => {
    it("should increment cache.miss when entry does not exist", () => {
      WebCacheService.getWatchlistCountEntry("nonexistentuser");
      expect(getMetric("cache.miss")).toBe(1);
      expect(getMetric("cache.hit")).toBe(0);
    });
  });

  describe("Watchlist Fetcher Instrumentation", () => {
    beforeEach(() => {
      startWatchlistFetcher({ featureEnabled: true });
    });

    it("should increment cache.miss.scheduled when scheduling stale user", () => {
      // Mock stale entry (old lastFetchedAt)
      const mockGetWatchlistCountEntry = vi.fn().mockReturnValue({
        count: 10,
        lastFetchedAt: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
        version: "1.0.0",
      });

      // Temporarily replace the method
      const original = WebCacheService.getWatchlistCountEntry;
      WebCacheService.getWatchlistCountEntry = mockGetWatchlistCountEntry;

      scheduleChecks(["staleuser"]);
      expect(getMetric("cache.miss.scheduled")).toBe(1);

      // Restore
      WebCacheService.getWatchlistCountEntry = original;
    });

    it("should not increment cache.miss.scheduled for fresh cache hit", () => {
      // Mock fresh entry
      const mockGetWatchlistCountEntry = vi.fn().mockReturnValue({
        count: 10,
        lastFetchedAt: Date.now() - 1000, // Recent
        version: "1.0.0",
      });

      // Temporarily replace the method
      const original = WebCacheService.getWatchlistCountEntry;
      WebCacheService.getWatchlistCountEntry = mockGetWatchlistCountEntry;

      scheduleChecks(["freshuser"]);
      expect(getMetric("cache.miss.scheduled")).toBe(0);

      // Restore
      WebCacheService.getWatchlistCountEntry = original;
    });
  });
});
