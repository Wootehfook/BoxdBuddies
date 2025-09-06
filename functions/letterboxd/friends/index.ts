/*
 * BoxdBuddy - Letterboxd Friends API Endpoint
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

// Import cache functions
import { getCount } from "../cache/index.js";
import { debugLog } from "../../_lib/common";

interface Env {
  MOVIES_DB: any; // D1Database type
  TMDB_API_KEY: string;
  FEATURE_SERVER_WATCHLIST_CACHE?: string;
}

interface Friend {
  username: string;
  displayName?: string;
  watchlistCount?: number;
  profileImageUrl?: string;
}

// Rate limiting - 1 second between requests
let lastRequestTime = 0;
const RATE_LIMIT_MS = 1000;

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

export async function scrapeLetterboxdFriends(
  username: string,
  env?: Env
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
        throw new Error();
      }
      throw new Error(`Failed to fetch friends page: HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse friends from the following page using proper DOM parsing approach
    const friends: Friend[] = [];

    // Look for friend elements - Letterboxd uses table rows or person summary elements
    const friendRowPatterns = [
      /<tr[^>]*>(.*?)<\/tr>/gis,
      /<div[^>]*class="[^"]*person-summary[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<article[^>]*class="[^"]*profile-person[^"]*"[^>]*>(.*?)<\/article>/gis,
    ];

    for (const pattern of friendRowPatterns) {
      const matches = html.matchAll(pattern);

      for (const match of matches) {
        const elementHtml = match[1];

        // Extract username from links
        const usernameMatch = elementHtml.match(
          /<a[^>]+href="\/([^\/]+)\/"[^>]*>/i
        );
        if (!usernameMatch) continue;

        const friendUsername = usernameMatch[1];

        // Skip if this is the user themselves or invalid usernames
        if (
          friendUsername === username ||
          friendUsername.includes("/") ||
          friendUsername.length < 2
        ) {
          continue;
        }

        // Extract display name
        let displayName: string | undefined;
        const namePatterns = [
          /<a[^>]+href=\"\/[^\/]+\/\"[^>]*>([^<]+)<\/a>/i,
          /<h3[^>]*>([^<]+)<\/h3>/i,
          /<span[^>]*class=\"[^\"]*name[^\"]*\"[^>]*>([^<]+)<\/span>/i,
        ];

        for (const namePattern of namePatterns) {
          const nameMatch = elementHtml.match(namePattern);
          if (
            nameMatch &&
            nameMatch[1] &&
            nameMatch[1].trim() !== friendUsername
          ) {
            displayName = nameMatch[1].trim();
            break;
          }
        }

        // Extract avatar using desktop version's approach
        let profileImageUrl: string | undefined;
        const avatarPatterns = [
          /<img[^>]+class="[^"]*avatar[^"]*"[^>]+src="([^"]+)"/i,
          /<img[^>]+src="([^"]+)"[^>]*class="[^"]*avatar[^"]*"/i,
          /<img[^>]+src="([^"]+avatar[^"]*)"[^>]*>/i,
          /<img[^>]+src="([^"]+profile[^"]*)"[^>]*>/i,
          /<img[^>]+src="([^"]+letterboxd[^"]*)"[^>]*>/i,
          /<img[^>]+src="([^"]+)"[^>]*>/i,
        ];

        for (const avatarPattern of avatarPatterns) {
          const avatarMatch = elementHtml.match(avatarPattern);
          if (avatarMatch && avatarMatch[1]) {
            const src = avatarMatch[1];

            // Skip placeholder or default images
            if (
              src.includes("placeholder") ||
              src.includes("default") ||
              !src.trim()
            ) {
              continue;
            }

            // Normalize URL
            if (src.startsWith("http")) {
              profileImageUrl = src;
            } else if (src.startsWith("/")) {
              profileImageUrl = `https://letterboxd.com${src}`;
            } else if (src.startsWith("//")) {
              profileImageUrl = `https:${src}`;
            } else {
              profileImageUrl = src;
            }

            // Validate it looks like an image URL
            if (
              profileImageUrl &&
              /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(profileImageUrl)
            ) {
              debugLog(
                env,
                `Found avatar for ${friendUsername}: ${profileImageUrl}`
              );
              break;
            } else {
              profileImageUrl = undefined;
            }
          }
        }

        // Skip watchlist count fetching for now - will be enhanced in next step
        let watchlistCount: number | undefined;

        friends.push({
          username: friendUsername,
          displayName: displayName !== friendUsername ? displayName : undefined,
          watchlistCount,
          profileImageUrl,
        });
      }

      // If we found friends with this pattern, stop trying other patterns
      if (friends.length > 0) {
        break;
      }
    }

    debugLog(env, `Found ${friends.length} friends for ${username}`);
    return friends;
  } catch (error) {
    console.error("Error scraping Letterboxd friends:", error);
    throw error;
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
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

    const friends = await scrapeLetterboxdFriends(cleanUsername, context.env);

    // Attach watchlist counts to fresh friends
    const friendsWithCounts = await attachWatchlistCounts(
      friends,
      watchlistCache,
      context.env
    );

    // Cache the results
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
  env: Env
): Promise<Friend[]> {
  const friendsWithCounts = [];

  for (const friend of friends) {
    const friendWithCount = { ...friend };

    // First try client cache
    if (clientWatchlistCache && clientWatchlistCache[friend.username]) {
      const clientEntry = clientWatchlistCache[friend.username];
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
  env?: Env
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
