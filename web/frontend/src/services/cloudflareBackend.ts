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

// AI Generated: GitHub Copilot - 2025-01-07
// Enhanced backend service for Cloudflare Pages deployment

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
  always_on_top?: boolean;
}

// Configuration for API endpoints
const API_CONFIG = {
  // Use environment variables for different deployment environments
  BASE_URL: import.meta.env.VITE_API_URL || 'https://boxdbuddy.pages.dev',
  USE_WORKER_API: import.meta.env.VITE_USE_WORKER_API === 'true',
  FALLBACK_TO_MOCK: import.meta.env.VITE_FALLBACK_TO_MOCK !== 'false',
};

// Enhanced API client for Cloudflare Worker endpoints
class CloudflareBackendAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  // Health check for worker API
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.warn('Worker API health check failed:', error);
      return false;
    }
  }

  // Get user's friends from Letterboxd profile
  async getFriends(username: string): Promise<Friend[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/friends?username=${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.friends || [];
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      if (API_CONFIG.FALLBACK_TO_MOCK) {
        return await this.getFriendsMock(username);
      }
      throw error;
    }
  }

  // Scrape user's watchlist
  async scrapeWatchlist(username: string, onProgress?: (progress: number) => void): Promise<Movie[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scrape-watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Simulate progress updates for UI
      if (onProgress) {
        onProgress(100);
      }
      
      return data.watchlist || [];
    } catch (error) {
      console.error('Failed to scrape watchlist:', error);
      if (API_CONFIG.FALLBACK_TO_MOCK) {
        return await this.scrapeWatchlistMock(username, onProgress);
      }
      throw error;
    }
  }

  // Compare watchlists between friends
  async compareWatchlists(
    friends: string[],
    onProgress?: (current: number, total: number, status: string) => void
  ): Promise<Movie[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/compare-watchlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friends })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Simulate progress updates for UI
      if (onProgress) {
        onProgress(friends.length, friends.length, 'Comparison complete');
      }
      
      return data.movies || [];
    } catch (error) {
      console.error('Failed to compare watchlists:', error);
      if (API_CONFIG.FALLBACK_TO_MOCK) {
        return await this.compareWatchlistsMock(friends, onProgress);
      }
      throw error;
    }
  }

  // Get TMDB movie cache statistics
  async getTMDBCacheStats(): Promise<{ count: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tmdb-movies`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get TMDB cache stats:', error);
      return { count: 2060, message: 'Mock data - 2,060+ movies cached' };
    }
  }

  // Mock implementations as fallbacks
  private async getFriendsMock(_username: string): Promise<Friend[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      { username: 'alice_watches', displayName: 'Alice', watchlistCount: 127 },
      { username: 'bob_cinema', displayName: 'Bob', watchlistCount: 89 },
      { username: 'charlie_films', displayName: 'Charlie', watchlistCount: 156 },
    ];
  }

  private async scrapeWatchlistMock(username: string, onProgress?: (progress: number) => void): Promise<Movie[]> {
    // Simulate scraping progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (onProgress) onProgress(i);
    }

    return [
      {
        id: 1,
        title: 'The Matrix',
        year: 1999,
        posterPath: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        overview: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
        averageRating: 8.7,
        genre: 'Action, Sci-Fi',
        director: 'The Wachowskis',
        friendCount: 1,
        friendList: [username],
        letterboxdSlug: 'the-matrix'
      }
    ];
  }

  private async compareWatchlistsMock(
    friends: string[],
    onProgress?: (current: number, total: number, status: string) => void
  ): Promise<Movie[]> {
    // Simulate comparison progress
    for (let i = 0; i < friends.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onProgress) {
        onProgress(i + 1, friends.length, `Processing ${friends[i]}...`);
      }
    }

    return [
      {
        id: 1,
        title: 'The Matrix',
        year: 1999,
        posterPath: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        overview: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
        averageRating: 8.7,
        genre: 'Action, Sci-Fi',
        director: 'The Wachowskis',
        friendCount: friends.length,
        friendList: friends,
        letterboxdSlug: 'the-matrix'
      },
      {
        id: 2,
        title: 'Inception',
        year: 2010,
        posterPath: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
        overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious.',
        averageRating: 8.4,
        genre: 'Action, Sci-Fi, Adventure',
        director: 'Christopher Nolan',
        friendCount: friends.length,
        friendList: friends,
        letterboxdSlug: 'inception'
      }
    ];
  }
}

// Export the enhanced backend API
export const secureBackendAPI = new CloudflareBackendAPI();