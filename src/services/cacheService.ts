/**
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

// AI Generated: GitHub Copilot - 2025-08-16

import { incrementMetric } from "../utils/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface UserCache {
  username?: string;
  friends?: CacheEntry<string[]>;
  watchlists?: Record<string, CacheEntry<MovieData[]>>;
  comparisons?: Record<string, CacheEntry<ComparisonResult>>;
  watchlistCounts?: Record<string, WatchlistCountEntry>;
}

interface MovieData {
  letterboxd_slug: string;
  title: string;
  year: number | null;
  letterboxd_url: string;
  tmdb_data?: {
    id: number;
    poster_path: string | null;
    vote_average: number;
    overview: string;
    director: string | null;
    runtime: number | null;
  };
}

interface ComparisonResult {
  common_movies: MovieData[];
  unique_to: Record<string, MovieData[]>;
  timestamp: number;
}

interface WatchlistCountEntry {
  count: number;
  etag?: string;
  lastFetchedAt?: number;
  version?: string;
}

export class WebCacheService {
  private static CACHE_KEY = "boxdbuddy_cache";
  private static CACHE_VERSION = "1.0.0";

  static getCache(): UserCache {
    try {
      const cached = window.localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  static saveCache(cache: UserCache): void {
    try {
      window.localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to save cache:", e);
    }
  }

  static getUsername(): string | null {
    const cache = this.getCache();
    return cache.username || null;
  }

  static setUsername(username: string): void {
    const cache = this.getCache();
    cache.username = username;
    this.saveCache(cache);
  }

  static getFriends(_username: string): string[] | null {
    const cache = this.getCache();
    const entry = cache.friends;

    if (!entry || entry.version !== this.CACHE_VERSION) {
      return null;
    }

    // Cache expires after 7 days
    const isExpired = Date.now() - entry.timestamp > 7 * 24 * 60 * 60 * 1000;
    return isExpired ? null : entry.data;
  }

  static setFriends(_username: string, friends: string[]): void {
    const cache = this.getCache();
    cache.friends = {
      data: friends,
      timestamp: Date.now(),
      version: this.CACHE_VERSION,
    };
    this.saveCache(cache);
  }

  static getWatchlist(username: string): MovieData[] | null {
    const cache = this.getCache();
    const entry = cache.watchlists?.[username];

    if (!entry || entry.version !== this.CACHE_VERSION) {
      return null;
    }

    // Cache expires after 24 hours
    const isExpired = Date.now() - entry.timestamp > 24 * 60 * 60 * 1000;
    return isExpired ? null : entry.data;
  }

  static setWatchlist(username: string, movies: MovieData[]): void {
    const cache = this.getCache();
    if (!cache.watchlists) cache.watchlists = {};

    cache.watchlists[username] = {
      data: movies,
      timestamp: Date.now(),
      version: this.CACHE_VERSION,
    };
    this.saveCache(cache);
  }

  static shouldRefreshWatchlist(
    username: string,
    currentCount: number
  ): boolean {
    const cached = this.getWatchlist(username);
    if (!cached) return true;

    // Refresh if count changed
    return cached.length !== currentCount;
  }

  static getComparison(usernames: string[]): ComparisonResult | null {
    const key = usernames.sort().join(":");
    const cache = this.getCache();
    const entry = cache.comparisons?.[key];

    if (!entry || entry.version !== this.CACHE_VERSION) {
      return null;
    }

    // Cache expires after 24 hours
    const isExpired = Date.now() - entry.timestamp > 24 * 60 * 60 * 1000;
    return isExpired ? null : entry.data;
  }

  static setComparison(usernames: string[], result: ComparisonResult): void {
    const key = usernames.sort().join(":");
    const cache = this.getCache();
    if (!cache.comparisons) cache.comparisons = {};

    cache.comparisons[key] = {
      data: result,
      timestamp: Date.now(),
      version: this.CACHE_VERSION,
    };
    this.saveCache(cache);
  }

  static clearCache(): void {
    window.localStorage.removeItem(this.CACHE_KEY);
  }

  static clearExpiredEntries(): void {
    const cache = this.getCache();
    const now = Date.now();

    // Clean expired watchlists
    if (cache.watchlists) {
      for (const [key, entry] of Object.entries(cache.watchlists)) {
        if (now - entry.timestamp > 24 * 60 * 60 * 1000) {
          delete cache.watchlists[key];
        }
      }
    }

    // Clean expired comparisons
    if (cache.comparisons) {
      for (const [key, entry] of Object.entries(cache.comparisons)) {
        if (now - entry.timestamp > 24 * 60 * 60 * 1000) {
          delete cache.comparisons[key];
        }
      }
    }

    this.saveCache(cache);
  }

  // Watchlist count methods
  static setWatchlistCountEntry(
    username: string,
    entry: WatchlistCountEntry
  ): void {
    const cache = this.getCache();
    if (!cache.watchlistCounts) cache.watchlistCounts = {};

    cache.watchlistCounts[username] = {
      ...entry,
      version: this.CACHE_VERSION,
    };
    this.saveCache(cache);
  }

  static getWatchlistCountEntry(username: string): WatchlistCountEntry | null {
    const cache = this.getCache();
    const entry = cache.watchlistCounts?.[username];

    if (!entry || entry.version !== this.CACHE_VERSION) {
      incrementMetric("cache.miss");
      return null;
    }

    incrementMetric("cache.hit");
    return entry;
  }

  static getAllWatchlistCounts(): Record<string, WatchlistCountEntry> {
    const cache = this.getCache();
    const counts = cache.watchlistCounts || {};

    // Filter out corrupted entries
    const validCounts: Record<string, WatchlistCountEntry> = {};
    for (const [username, entry] of Object.entries(counts)) {
      if (
        entry &&
        typeof entry.count === "number" &&
        entry.count >= 0 &&
        entry.version === this.CACHE_VERSION
      ) {
        validCounts[username] = entry;
      }
    }

    return validCounts;
  }

  static async readAllWatchlistCache(): Promise<
    Record<string, WatchlistCountEntry>
  > {
    // For now, just return the synchronous version
    // In a real implementation, this might check IndexedDB first
    return this.getAllWatchlistCounts();
  }

  static clearWatchlistCounts(): void {
    const cache = this.getCache();
    if (cache.watchlistCounts) {
      cache.watchlistCounts = {};
      this.saveCache(cache);
    }
  }

  // IndexedDB availability check (mock for now)
  static isIDBAvailable(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window;
  }
}
