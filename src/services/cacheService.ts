// Cache Service for BoxdBuddies
// Handles local database caching operations

import { invoke } from "@tauri-apps/api/tauri";

export interface CachedWatchlistMovie {
  id?: number;
  friend_username: string;
  movie_title: string;
  movie_year?: number;
  letterboxd_slug?: string;
  tmdb_id?: number;
  date_added?: string;
  last_updated: string;
}

export interface FriendSyncStatus {
  friend_username: string;
  last_watchlist_sync?: string;
  watchlist_count: number;
  sync_status: string;
  last_error?: string;
}

export interface WatchlistMovie {
  title: string;
  year?: number;
  letterboxd_slug?: string;
  poster_url?: string;
}

class CacheService {
  /**
   * Get cached watchlist for a friend
   */
  async getCachedWatchlist(
    friendUsername: string
  ): Promise<CachedWatchlistMovie[]> {
    try {
      return await invoke<CachedWatchlistMovie[]>("get_cached_watchlist", {
        friendUsername,
      });
    } catch (error) {
      console.error("Failed to get cached watchlist:", error);
      throw error;
    }
  }

  /**
   * Save watchlist to cache
   */
  async saveWatchlistToCache(
    friendUsername: string,
    movies: WatchlistMovie[]
  ): Promise<void> {
    try {
      await invoke("save_watchlist_to_cache", {
        friendUsername,
        movies,
      });
    } catch (error) {
      console.error("Failed to save watchlist to cache:", error);
      throw error;
    }
  }

  /**
   * Get sync status for a friend
   */
  async getFriendSyncStatus(
    friendUsername: string
  ): Promise<FriendSyncStatus | null> {
    try {
      return await invoke<FriendSyncStatus | null>("get_friend_sync_status", {
        friendUsername,
      });
    } catch (error) {
      console.error("Failed to get friend sync status:", error);
      throw error;
    }
  }

  /**
   * Check if watchlist cache is fresh
   */
  async isWatchlistCacheFresh(
    friendUsername: string,
    maxAgeHours: number = 24
  ): Promise<boolean> {
    try {
      return await invoke<boolean>("is_watchlist_cache_fresh", {
        friendUsername,
        maxAgeHours,
      });
    } catch (error) {
      console.error("Failed to check cache freshness:", error);
      return false;
    }
  }

  /**
   * Get cache status for multiple friends
   */
  async getFriendsCacheStatus(
    friendUsernames: string[]
  ): Promise<Record<string, FriendSyncStatus | null>> {
    const statuses: Record<string, FriendSyncStatus | null> = {};

    await Promise.all(
      friendUsernames.map(async (username) => {
        try {
          statuses[username] = await this.getFriendSyncStatus(username);
        } catch (error) {
          console.error(`Failed to get cache status for ${username}:`, error);
          statuses[username] = null;
        }
      })
    );

    return statuses;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalCachedFriends: number;
    totalCachedMovies: number;
    oldestCacheDate?: string;
    newestCacheDate?: string;
  }> {
    // This would need a new backend function to aggregate cache statistics
    // For now, return a placeholder
    return {
      totalCachedFriends: 0,
      totalCachedMovies: 0,
    };
  }

  /**
   * Format cache age for display
   */
  formatCacheAge(lastUpdated: string): string {
    try {
      const lastUpdate = new Date(lastUpdated);
      const now = new Date();
      const diffMs = now.getTime() - lastUpdate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        return "Just now";
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
      } else {
        return lastUpdate.toLocaleDateString();
      }
    } catch (error) {
      return "Unknown";
    }
  }

  /**
   * Check if cache needs refresh (older than specified hours)
   */
  needsRefresh(lastUpdated: string, maxAgeHours: number = 24): boolean {
    try {
      const lastUpdate = new Date(lastUpdated);
      const now = new Date();
      const diffMs = now.getTime() - lastUpdate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      return diffHours > maxAgeHours;
    } catch (error) {
      return true; // If we can't parse the date, assume refresh is needed
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
