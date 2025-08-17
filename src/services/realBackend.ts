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

// Cloudflare Functions base URL
const API_BASE = window.location.origin;

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

      const response = await fetch(`${API_BASE}/letterboxd/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: request.mainUsername,
          friends: request.friendUsernames,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorData}`
        );
      }

      const data = await response.json();

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
