/*
 * BoxdBuddy - Letterboxd Friends API Endpoint
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

// Import cache functions and shared Env type to keep types consistent
import { getCount } from "../cache/index.js";
import { debugLog } from "../../_lib/common";
import type { Env as CacheEnv } from "../cache/index.js";

interface Friend {
  username: string;
  displayName?: string;
  watchlistCount?: number;
  profileImageUrl?: string;
}

// Rate limiting - 1 second between requests
// Internal helper: ensures we don't flood Letterboxd with requests when
// scraping multiple users in quick succession. This function is intentionally
// kept module-private to avoid creating a public surface area for the
// functions API.
let lastRequestTime = 0;
const RATE_LIMIT_MS = 1000;

/**
 * Internal rate limiter for scrapers.
 * @internal
 */
async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
}

const friendRowPatterns = [
  /<tr[^>]*>(.*?)<\/tr>/gis,
  /<div[^>]*class="[^"]*person-summary[^"]*"[^>]*>(.*?)<\/div>/gis,
  /<article[^>]*class="[^"]*profile-person[^"]*"[^>]*>(.*?)<\/article>/gis,
];

const namePatterns = [
  /<a[^>]+href="\/[^/]+\/"[^>]*>([^<]+)<\/a>/i,
  /<h3[^>]*>([^<]+)<\/h3>/i,
  /<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/span>/i,
];

const avatarPatterns = [
  /<img[^>]+class="[^"]*avatar[^"]*"[^>]+src="([^"]+)"/i,
  /<img[^>]+src="([^"]+)"[^>]*class="[^"]*avatar[^"]*"/i,
  /<img[^>]+src="([^"]+avatar[^"]*)"[^>]*>/i,
  /<img[^>]+src="([^"]+profile[^"]*)"[^>]*>/i,
  /<img[^>]+src="([^"]+letterboxd[^"]*)"[^>]*>/i,
  /<img[^>]+src="([^"]+)"[^>]*>/i,
];

function extractFriendUsername(elementHtml: string): string | null {
  const usernameMatch = /<a[^>]+href="\/([^/]+)\/"[^>]*>/i.exec(elementHtml);
  return usernameMatch?.[1] ?? null;
}

function extractDisplayName(
  elementHtml: string,
  friendUsername: string
): string | undefined {
  for (const namePattern of namePatterns) {
    const nameMatch = namePattern.exec(elementHtml);
    const candidate = nameMatch?.[1]?.trim();
    if (candidate && candidate !== friendUsername) {
      return candidate;
    }
  }
  return undefined;
}

function normalizeProfileImageUrl(src: string): string | undefined {
  if (src.includes("placeholder") || src.includes("default") || !src.trim()) {
    return undefined;
  }
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return `https://letterboxd.com${src}`;
  return src;
}

function extractProfileImageUrl(
  elementHtml: string,
  friendUsername: string,
  env?: CacheEnv
): string | undefined {
  for (const avatarPattern of avatarPatterns) {
    const avatarMatch = avatarPattern.exec(elementHtml);
    const src = avatarMatch?.[1];
    if (!src) continue;
    const normalized = normalizeProfileImageUrl(src);
    if (!normalized) continue;
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(normalized)) {
      debugLog(env, `Found avatar for ${friendUsername}: ${normalized}`);
      return normalized;
    }
  }
  return undefined;
}

function parseFriendsFromHtml(
  html: string,
  username: string,
  env?: CacheEnv
): Friend[] {
  const friends: Friend[] = [];

  for (const pattern of friendRowPatterns) {
    const matches = html.matchAll(pattern);

    for (const match of matches) {
      const elementHtml = match[1];
      const friendUsername = extractFriendUsername(elementHtml);
      if (!friendUsername) continue;
      if (
        friendUsername === username ||
        friendUsername.includes("/") ||
        friendUsername.length < 2
      ) {
        continue;
      }

      const displayName = extractDisplayName(elementHtml, friendUsername);
      const profileImageUrl = extractProfileImageUrl(
        elementHtml,
        friendUsername,
        env
      );

      friends.push({
        username: friendUsername,
        displayName: displayName === friendUsername ? undefined : displayName,
        watchlistCount: undefined,
        profileImageUrl,
      });
    }

    if (friends.length > 0) {
      break;
    }
  }

  return friends;
}

export async function scrapeLetterboxdFriends(
  username: string,
  env?: CacheEnv
): Promise<Friend[]> {
  try {
    await rateLimit();

    const url = `https://letterboxd.com/${username}/following/`;
    debugLog(env, `Scraping friends from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Letterboxd user not found");
      }
      throw new Error(`Failed to fetch friends page: HTTP ${response.status}`);
    }

    const html = await response.text();

    const friends = parseFriendsFromHtml(html, username, env);

    debugLog(env, `Found ${friends.length} friends for ${username}`);
    return friends;
  } catch (error) {
    debugLog(env as any, `Error scraping Letterboxd friends: ${String(error)}`);
    throw error;
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: CacheEnv;
}) {
  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const {
      username,
      forceRefresh = false,
      watchlistCache,
    } = await context.request.json();

    if (!username || typeof username !== "string") {
      return new Response(JSON.stringify({ error: "Username is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    let cachedForFallback: {
      friends: Friend[];
      lastUpdated: number;
      expiresAt: number;
    } | null = null;

    // Check cache first unless force refresh requested
    if (!forceRefresh) {
      const cached = await getCachedFriends(
        context.env.MOVIES_DB,
        cleanUsername
      );
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        debugLog(
          context.env,
          `Returning cached friends for ${cleanUsername} (${cached.friends.length} friends)`
        );

        // Attach watchlist counts to cached friends
        const friendsWithCounts = await attachWatchlistCounts(
          cached.friends,
          watchlistCache,
          context.env
        );

        return new Response(
          JSON.stringify({
            friends: friendsWithCounts,
            cached: true,
            lastUpdated: new Date(cached.lastUpdated).toISOString(),
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (cached) {
        cachedForFallback = cached;
      }
    }

    // Validate username format
    if (!/^[a-z0-9_-]+$/i.test(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: "Invalid username format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    debugLog(context.env, `Fetching fresh friends for user: ${cleanUsername}`);

    let friends: Friend[] = [];
    try {
      friends = await scrapeLetterboxdFriends(cleanUsername, context.env);
    } catch (error) {
      console.error(
        "Failed to scrape friends, using fallback if available:",
        error
      );

      if (cachedForFallback) {
        const friendsWithCounts = await attachWatchlistCounts(
          cachedForFallback.friends,
          watchlistCache,
          context.env
        );

        return new Response(
          JSON.stringify({
            friends: friendsWithCounts,
            cached: true,
            lastUpdated: new Date(cachedForFallback.lastUpdated).toISOString(),
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // No cached fallback available; surface the failure instead of
      // returning and caching an empty friends list.
      return new Response(
        JSON.stringify({
          error: "failed to fetch friends from Letterboxd",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Attach watchlist counts to fresh friends
    const friendsWithCounts = await attachWatchlistCounts(
      friends,
      watchlistCache,
      context.env
    );

    // Cache the results (setCachedFriends will add lastUpdated)
    await setCachedFriends(
      context.env.MOVIES_DB,
      cleanUsername,
      friendsWithCounts,
      context.env
    );

    return new Response(
      JSON.stringify({
        friends: friendsWithCounts,
        count: friendsWithCounts.length,
        cached: false,
        lastUpdated: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Friends API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

// Watchlist count attachment logic
async function attachWatchlistCounts(
  friends: Friend[],
  clientWatchlistCache: any,
  env: CacheEnv
): Promise<Friend[]> {
  const friendsWithCounts = [];

  for (const friend of friends) {
    const friendWithCount = { ...friend };

    // First try client cache
    const clientEntry = clientWatchlistCache?.[friend.username];
    if (clientEntry) {
      if (typeof clientEntry.count === "number") {
        friendWithCount.watchlistCount = clientEntry.count;
        friendsWithCounts.push(friendWithCount);
        continue;
      }
    }

    // Fall back to server cache if no client cache available
    try {
      const serverEntry = await getCount(friend.username, env);
      if (serverEntry && typeof serverEntry.count === "number") {
        friendWithCount.watchlistCount = serverEntry.count;
      }
    } catch (error) {
      console.error(
        `Error getting server cache for ${friend.username}:`,
        error
      );
      // Continue without watchlist count if server cache fails
    }

    friendsWithCounts.push(friendWithCount);
  }

  return friendsWithCounts;
}

// Cache management functions
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

async function getCachedFriends(
  database: any,
  username: string
): Promise<{
  friends: Friend[];
  lastUpdated: number;
  expiresAt: number;
} | null> {
  try {
    const result = await database
      .prepare(
        `
      SELECT friends_data, last_updated, expires_at 
      FROM friends_cache 
      WHERE username = ?
    `
      )
      .bind(username)
      .first();

    if (!result) {
      return null;
    }

    return {
      friends: JSON.parse(result.friends_data),
      lastUpdated: result.last_updated,
      expiresAt: result.expires_at,
    };
  } catch (error) {
    console.error("Error getting cached friends:", error);
    return null;
  }
}

async function setCachedFriends(
  database: any,
  username: string,
  friends: Friend[],
  env?: CacheEnv
): Promise<void> {
  try {
    const now = Date.now();
    const expiresAt = now + CACHE_DURATION_MS;

    await database
      .prepare(
        `
      INSERT OR REPLACE INTO friends_cache 
      (username, friends_data, last_updated, expires_at) 
      VALUES (?, ?, ?, ?)
    `
      )
      .bind(username, JSON.stringify(friends), now, expiresAt)
      .run();

    debugLog(env, `Cached ${friends.length} friends for ${username}`);
  } catch (error) {
    console.error("Error caching friends:", error);
    // Don't throw - caching is not critical
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
