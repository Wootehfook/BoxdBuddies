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

import { WebCacheService } from "./cacheService";

// Add fetch global declaration for web environment
declare const fetch: typeof globalThis.fetch;

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
  total_common: number;
  watchlists: Array<{
    username: string;
    count: number;
  }>;
}

export class CloudflareBackend {
  private static BASE_URL = import.meta.env.PROD
    ? "https://boxdbuddy.pages.dev/api"
    : "http://localhost:8788/api";

  static async fetchWatchlist(
    username: string,
    forceRefresh = false
  ): Promise<{
    movies: MovieData[];
    cached: boolean;
    count: number;
  }> {
    // Check local cache first
    if (!forceRefresh) {
      const cached = WebCacheService.getWatchlist(username);
      if (cached) {
        return { movies: cached, cached: true, count: cached.length };
      }
    }

    const response = await fetch(
      `${this.BASE_URL}/letterboxd?username=${encodeURIComponent(username)}&action=watchlist`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch watchlist");
    }

    const data = (await response.json()) as {
      movies: MovieData[];
      count: number;
      cached: boolean;
    };

    // Save to local cache
    WebCacheService.setWatchlist(username, data.movies);

    return data;
  }

  static async fetchFriends(username: string): Promise<{
    friends: string[];
    cached: boolean;
    count: number;
  }> {
    const cached = WebCacheService.getFriends(username);
    if (cached) {
      return { friends: cached, cached: true, count: cached.length };
    }

    const response = await fetch(
      `${this.BASE_URL}/letterboxd?username=${encodeURIComponent(username)}&action=friends`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch friends");
    }

    const data = (await response.json()) as {
      friends: string[];
      count: number;
      cached: boolean;
    };

    WebCacheService.setFriends(username, data.friends);

    return data;
  }

  static async compareWatchlists(
    usernames: string[]
  ): Promise<ComparisonResult> {
    // Check cache first
    const cached = WebCacheService.getComparison(usernames);
    if (cached) {
      // Convert cached result to expected format
      return {
        common_movies: cached.common_movies,
        total_common: cached.common_movies.length,
        watchlists: [], // Will be populated from API response
      };
    }

    const response = await fetch(`${this.BASE_URL}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames }),
    });

    if (!response.ok) {
      throw new Error("Failed to compare watchlists");
    }

    const result = (await response.json()) as ComparisonResult;

    // Save to cache
    const cacheableResult = {
      ...result,
      unique_to: {},
      timestamp: Date.now(),
    };
    WebCacheService.setComparison(usernames, cacheableResult);

    return result;
  }

  static async checkForUpdates(username: string): Promise<boolean> {
    try {
      // Get current count from API
      const response = await fetch(
        `${this.BASE_URL}/letterboxd?username=${encodeURIComponent(username)}&action=watchlist&count_only=true`
      );

      if (!response.ok) return false;

      const { count } = (await response.json()) as { count: number };

      return WebCacheService.shouldRefreshWatchlist(username, count);
    } catch {
      return false;
    }
  }

  static async searchMovies(
    query: string,
    page = 1
  ): Promise<{
    movies: MovieData[];
    totalPages: number;
  }> {
    const response = await fetch(
      `${this.BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`
    );

    if (!response.ok) {
      throw new Error("Failed to search movies");
    }

    return (await response.json()) as {
      movies: MovieData[];
      totalPages: number;
    };
  }
}
