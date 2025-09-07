/*
 * BoxdBuddies - Utility Functions
 * Copyright (C) 2025 Wootehfook
 */

// API Endpoints configuration
export const API_ENDPOINTS = {
  LETTERBOXD_WATCHLIST_COUNT: `${typeof window !== "undefined" ? window.location.origin : ""}/letterboxd/watchlist-count`,
  LETTERBOXD_FRIENDS: `${typeof window !== "undefined" ? window.location.origin : ""}/letterboxd/friends`,
  // NOTE: API was migrated from /letterboxd/compare to the new Cloudflare function
  // path /api/watchlist-comparison — keep this value aligned with runtime usage
  LETTERBOXD_COMPARE: `${typeof window !== "undefined" ? window.location.origin : ""}/api/watchlist-comparison`,
};
