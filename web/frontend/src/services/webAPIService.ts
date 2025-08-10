/*
 * BoxdBuddies - Movie Watchlist Comparison Tool
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import axios from "axios";
import { logger } from "../utils/logger";

// Cloudflare Worker API endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://boxdbuddies-api.your-domain.workers.dev";

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
  tmdb_api_key: string;
  always_on_top?: boolean;
}

export interface ComparisonRequest {
  mainUsername: string;
  friendUsernames: string[];
  tmdbApiKey?: string;
  limitTo500?: boolean;
}

export interface ComparisonResult {
  commonMovies: Movie[];
}

class WebAPIService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 180000, // 3 minutes for long operations
  });

  // Save user preferences (web version uses localStorage)
  async saveUserPreferences(request: UserPreferences): Promise<void> {
    try {
      localStorage.setItem("boxdbuddies_user_prefs", JSON.stringify(request));
      logger.debug("User preferences saved to localStorage");
    } catch (error) {
      logger.error("Error saving user preferences:", error);
      throw error;
    }
  }

  // Load user preferences from localStorage
  async loadUserPreferences(): Promise<UserPreferences> {
    try {
      const stored = localStorage.getItem("boxdbuddies_user_prefs");
      if (stored) {
        const prefs = JSON.parse(stored);
        logger.debug("User preferences loaded from localStorage");
        return prefs;
      }
      throw new Error("No user preferences found");
    } catch (error) {
      logger.debug("No existing user preferences found");
      throw error;
    }
  }

  // Scrape Letterboxd friends using Cloudflare Worker
  async scrapeLetterboxdFriends(username: string): Promise<Friend[]> {
    try {
      logger.debug(`Scraping friends for ${username}`);
      const response = await this.apiClient.post("/api/scrape-friends", {
        username: username.trim(),
      });
      
      const friends = response.data.friends || [];
      logger.debug(`Found ${friends.length} friends for ${username}`);
      return friends;
    } catch (error) {
      logger.error("Error scraping Letterboxd friends:", error);
      throw new Error("Failed to scrape friends. Please check the username and try again.");
    }
  }

  // Get friends with watchlist counts
  async getFriendsWithWatchlistCounts(): Promise<Friend[]> {
    try {
      // For web version, we'll store friends in localStorage temporarily
      const friendsData = localStorage.getItem("boxdbuddies_friends");
      if (friendsData) {
        const friends = JSON.parse(friendsData);
        logger.debug(`Retrieved ${friends.length} friends from cache`);
        return friends;
      }
      return [];
    } catch (error) {
      logger.error("Error getting friends with watchlist counts:", error);
      return [];
    }
  }

  // Compare watchlists using Cloudflare Worker
  async compareWatchlists(request: ComparisonRequest): Promise<ComparisonResult> {
    try {
      logger.debug("Starting watchlist comparison", request);
      const response = await this.apiClient.post("/api/compare-watchlists", request);
      
      const result = response.data;
      logger.debug(`Comparison complete: ${result.commonMovies?.length || 0} common movies found`);
      return result;
    } catch (error) {
      logger.error("Error comparing watchlists:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error("API endpoint not found. Please check the Cloudflare Worker deployment.");
        } else if (error.response && error.response.status >= 500) {
          throw new Error("Server error occurred. Please try again later.");
        } else if (error.code === "ECONNABORTED") {
          throw new Error("Request timed out. This comparison is taking longer than expected.");
        }
      }
      throw new Error("Failed to compare watchlists. Please check your internet connection and try again.");
    }
  }

  // Window control functions (no-ops for web version)
  async setWindowFocus(): Promise<void> {
    // No-op for web version
    logger.debug("setWindowFocus called (no-op for web)");
  }

  async setAlwaysOnTop(_alwaysOnTop: boolean): Promise<void> {
    // No-op for web version  
    logger.debug("setAlwaysOnTop called (no-op for web)");
  }

  // Store friends temporarily in localStorage
  async storeFriends(friends: Friend[]): Promise<void> {
    try {
      localStorage.setItem("boxdbuddies_friends", JSON.stringify(friends));
      logger.debug(`Stored ${friends.length} friends in localStorage`);
    } catch (error) {
      logger.error("Error storing friends:", error);
    }
  }
}

export const webAPIService = new WebAPIService();
export default webAPIService;