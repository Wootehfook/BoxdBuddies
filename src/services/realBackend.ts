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

// AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
// Real backend service for web version using Cloudflare Functions

/* eslint-disable no-undef */
// Disable eslint warnings for intentional browser API usage

// Type declarations for browser APIs in non-DOM environment
declare const localStorage: Storage;
declare const fetch: typeof globalThis.fetch;

import { logger } from "../utils/logger";
import { WebCacheService } from "./cacheService";
import { API_ENDPOINTS } from "../utils";

export interface Movie {
  id: number;
  title: string;
  year: number;
  posterPath?: string;
  overview?: string;
  rating?: number;
  genre?: string;
  director?: string;
  averageRating?: number;
  friendCount: number;
  friendList?: string[];
  letterboxdSlug?: string;
}

export interface Friend {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  watchlistCount?: number;
}

export interface UserPreferences {
  username: string;
  tmdb_api_key?: string; // Optional for web version
  always_on_top?: boolean;
}

// Use centralized API endpoint configuration

// Real API functions
export const realBackendAPI = {
  // Save user preferences (localStorage for web)
  saveUserPreferences: async (request: {
    username: string;
    tmdbApiKey?: string;
    alwaysOnTop?: boolean;
  }): Promise<void> => {
    // Store in localStorage for web version
    localStorage.setItem("boxdbuddies_user_prefs", JSON.stringify(request));
  },

  // Load user preferences (from localStorage)
  loadUserPreferences: async (): Promise<UserPreferences | null> => {
    const stored = localStorage.getItem("boxdbuddies_user_prefs");
    return stored ? JSON.parse(stored) : null;
  },

  // Fetch friends from API
  fetchFriends: async (
    username: string
  ): Promise<{ friends: Friend[]; cached: boolean; count: number }> => {
    try {
      // Get watchlist cache to attach to request and for telemetry
      const watchlistCache = WebCacheService.getAllWatchlistCounts();

      const response = await fetch(API_ENDPOINTS.LETTERBOXD_FRIENDS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          ...(Object.keys(watchlistCache).length > 0 ? { watchlistCache } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.status}`);
      }

      const data = await response.json();

      // Only perform cache telemetry if we have cache data and friends
      if (
        Object.keys(watchlistCache).length > 0 &&
        data.friends &&
        data.friends.length > 0
      ) {
        let hits = 0;
        let misses = 0;

        // Check each friend against cache
        data.friends.forEach((friend: Friend) => {
          if (watchlistCache[friend.username]) {
            logger.logCacheHit(friend.username);
            hits++;
          } else {
            logger.logCacheMiss(friend.username);
            misses++;
          }
        });

        // Emit telemetry summary
        if (hits > 0 || misses > 0) {
          logger.info(
            `Friends cache telemetry: ${hits} hits, ${misses} misses`
          );
        }
      }

      return data;
    } catch (error) {
      console.error("Error fetching friends:", error);
      throw error;
    }
  },

  // Fetch watchlist count from API
  fetchWatchlistCount: async (
    username: string
  ): Promise<{ count: number; cached: boolean }> => {
    try {
      // Get watchlist cache to attach to request and for telemetry
      const watchlistCache = WebCacheService.getAllWatchlistCounts();

      const response = await fetch(API_ENDPOINTS.LETTERBOXD_WATCHLIST_COUNT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          ...(Object.keys(watchlistCache).length > 0 ? { watchlistCache } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch watchlist count: ${response.status}`);
      }

      const data = await response.json();

      // Check cache for telemetry
      const isInCache = watchlistCache[username] !== undefined;
      let hits = 0;
      let misses = 0;

      if (isInCache) {
        logger.logCacheHit(username);
        hits = 1;
      } else {
        logger.logCacheMiss(username);
        misses = 1;
      }

      // Emit telemetry summary
      const missText = misses === 1 ? "miss" : "misses";
      const hitText = hits === 1 ? "hit" : "hits";
      logger.info(
        `Watchlist count cache telemetry: ${hits} ${hitText}, ${misses} ${missText}`
      );

      return data;
    } catch (error) {
      console.error("Error fetching watchlist count:", error);
      throw error;
    }
  },

  // Scrape Letterboxd friends (placeholder - would need separate API endpoint)
  scrapeLetterboxdFriends: async (username: string): Promise<Friend[]> => {
    // For now, return empty array - this would need a separate scraping endpoint
    console.error(`Would scrape friends for ${username}`);
    return [];
  },

  // Get friends with watchlist counts (placeholder)
  getFriendsWithWatchlistCounts: async (): Promise<Friend[]> => {
    // For now, return empty array - this would need a separate endpoint
    return [];
  },

  // Compare watchlists - calls the real Cloudflare Function
  compareWatchlists: async (request: {
    mainUsername: string;
    friendUsernames: string[];
    tmdbApiKey?: string | null;
    limitTo500?: boolean;
  }): Promise<{ commonMovies: Movie[] }> => {
    try {
      console.error(
        `🔄 Comparing watchlists for ${request.mainUsername} with friends:`,
        request.friendUsernames
      );

      // Get watchlist cache for telemetry
      const watchlistCache = WebCacheService.getAllWatchlistCounts();

      // All usernames involved in comparison
      const allUsernames = [request.mainUsername, ...request.friendUsernames];

      const response = await fetch(API_ENDPOINTS.LETTERBOXD_COMPARE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: request.mainUsername,
          friends: request.friendUsernames,
          ...(Object.keys(watchlistCache).length > 0 ? { watchlistCache } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorData}`
        );
      }

      const data = await response.json();

      // Perform cache telemetry for all users involved
      let hits = 0;
      let misses = 0;

      allUsernames.forEach((username) => {
        if (watchlistCache[username]) {
          logger.logCacheHit(username);
          hits++;
        } else {
          logger.logCacheMiss(username);
          misses++;
        }
      });

      // Emit telemetry summary
      if (hits > 0 || misses > 0) {
        logger.info(`Compare cache telemetry: ${hits} hits, ${misses} misses`);
      }

      // Log API response for debugging (allowed console method)
      console.error(`✅ API response:`, {
        totalMovies: data.movies?.length || 0,
        userWatchlistCount: data.userWatchlistCount,
        friendCounts: data.friendCounts,
      });

      // Transform API response to match frontend expectations
      const commonMovies: Movie[] = (data.movies || []).map(
        (movie: {
          id: number;
          title: string;
          year: number;
          poster_path?: string;
          overview?: string;
          vote_average?: number;
          director?: string;
          runtime?: number;
          letterboxdSlug?: string;
          friendCount: number;
          friendList: string[];
          posterPath?: string;
          rating?: number;
          genre?: string;
        }) => ({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          posterPath: movie.posterPath || movie.poster_path,
          overview: movie.overview,
          rating: movie.rating || movie.vote_average,
          genre: movie.genre,
          director: movie.director,
          averageRating: movie.rating || movie.vote_average, // Use TMDB rating as average
          friendCount: movie.friendCount,
          friendList: movie.friendList,
          letterboxdSlug: movie.letterboxdSlug,
        })
      );

      return { commonMovies };
    } catch (error) {
      console.error("❌ Error comparing watchlists:", error);
      throw error;
    }
  },

  // Set window focus (no-op for web)
  setWindowFocus: async (): Promise<void> => {
    // No-op for web version
  },

  // Set always on top (no-op for web)
  setAlwaysOnTop: async (_alwaysOnTop: boolean): Promise<void> => {
    // No-op for web version
  },
};
