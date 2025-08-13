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

// AI Generated: GitHub Copilot - 2025-08-12
import { invoke } from "@tauri-apps/api/core";
import { Movie } from "./tmdbService";
import { logger } from "../utils/logger";

// Updated User interface to match Rust backend
export interface User {
  id: string;
  username: string;
  watchlist: Movie[];
}

// Database interfaces
export interface SyncInfo {
  lastSyncDate?: string;
  friendsCount: number;
}

export interface LetterboxdFriend {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isSelected?: boolean;
  lastSynced?: string;
}

class TauriService {
  // Search movies using Rust backend
  async searchMovies(query: string, apiKey?: string): Promise<Movie[]> {
    try {
      const movies = await invoke<Movie[]>("search_movies_tmdb", {
        query,
        apiKey,
        page: 1,
      });
      return movies;
    } catch (error) {
      logger.error("Error searching movies via Rust:", error);
      throw new Error("Failed to search movies");
    }
  }

  // Get popular movies using Rust backend
  async getPopularMovies(apiKey?: string): Promise<Movie[]> {
    try {
      const movies = await invoke<Movie[]>("get_popular_movies_tmdb", {
        apiKey,
        page: 1,
      });
      return movies;
    } catch (error) {
      logger.error("Error fetching popular movies via Rust:", error);
      throw new Error("Failed to fetch popular movies");
    }
  }

  // Create a new user with sample watchlist
  async createUser(username: string): Promise<User> {
    try {
      const user = await invoke<User>("create_user", { username });
      return user;
    } catch (error) {
      logger.error("Error creating user via Rust:", error);
      throw new Error("Failed to create user");
    }
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await invoke<User[]>("get_all_users");
      return users;
    } catch (error) {
      logger.error("Error fetching users via Rust:", error);
      return [];
    }
  }

  // Add movie to user's watchlist
  async addMovieToWatchlist(userId: string, movie: Movie): Promise<void> {
    try {
      await invoke("add_movie_to_user_watchlist", {
        userId,
        movie,
      });
    } catch (error) {
      logger.error("Error adding movie via Rust:", error);
      throw new Error("Failed to add movie to watchlist");
    }
  }

  // Remove movie from user's watchlist
  async removeMovieFromWatchlist(
    userId: string,
    movieId: number
  ): Promise<void> {
    try {
      await invoke("remove_movie_from_user_watchlist", {
        userId,
        movieId,
      });
    } catch (error) {
      logger.error("Error removing movie via Rust:", error);
      throw new Error("Failed to remove movie from watchlist");
    }
  }

  // Find common movies among all users
  async findCommonMovies(): Promise<Movie[]> {
    try {
      const commonMovies = await invoke<Movie[]>("find_common_movies");
      return commonMovies;
    } catch (error) {
      logger.error("Error finding common movies via Rust:", error);
      return [];
    }
  }

  // Export user's watchlist as JSON
  async exportWatchlist(userId: string): Promise<string> {
    try {
      const json = await invoke<string>("export_watchlist", { userId });
      return json;
    } catch (error) {
      logger.error("Error exporting watchlist via Rust:", error);
      throw new Error("Failed to export watchlist");
    }
  }

  // Database operations for friends
  async getSyncInfo(): Promise<SyncInfo> {
    try {
      const syncInfo = await invoke<SyncInfo>("get_sync_info");
      return syncInfo;
    } catch (error) {
      logger.error("Error getting sync info:", error);
      throw new Error("Failed to get sync info");
    }
  }

  async getFriendsFromDatabase(): Promise<LetterboxdFriend[]> {
    try {
      const friends = await invoke<LetterboxdFriend[]>(
        "get_friends_from_database"
      );
      return friends;
    } catch (error) {
      logger.error("Error getting friends from database:", error);
      throw new Error("Failed to get friends from database");
    }
  }

  async saveFriendsToDatabase(friends: LetterboxdFriend[]): Promise<void> {
    try {
      await invoke("save_friends_to_database", { friends });
    } catch (error) {
      logger.error("Error saving friends to database:", error);
      throw new Error("Failed to save friends to database");
    }
  }
}

export const tauriService = new TauriService();
export default tauriService;
