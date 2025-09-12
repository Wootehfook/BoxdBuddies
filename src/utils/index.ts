/*
 * BoxdBuddies - Utility Functions
 * Copyright (C) 2025 Wootehfook
 */

// API Endpoints configuration
// During development, Cloudflare Functions preview runs on port 8788. Use that
// base so the frontend talks to the functions dev server. In production we
// prefer same-origin paths so the deployed Pages site can route /api/* and
// /letterboxd/* to the Functions runtime.
const DEV_FUNCTIONS_BASE = "http://localhost:8788";
const PROD_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
const BASE = import.meta.env.DEV ? DEV_FUNCTIONS_BASE : PROD_ORIGIN;

export const API_ENDPOINTS = {
  LETTERBOXD_WATCHLIST_COUNT: `${BASE}/letterboxd/watchlist-count`,
  LETTERBOXD_FRIENDS: `${BASE}/letterboxd/friends`,
  // NOTE: API was migrated from /letterboxd/compare to the new Cloudflare function
  // path /api/watchlist-comparison — keep this value aligned with runtime usage
  LETTERBOXD_COMPARE: `${BASE}/api/watchlist-comparison`,
};
