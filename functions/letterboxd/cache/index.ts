/*
 * BoxdBuddy - Friends Cache API Endpoint
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

interface Env {
  MOVIES_DB: any; // D1Database type
  TMDB_API_KEY: string;
}

interface CachedFriend {
  username: string;
  displayName?: string;
  watchlistCount?: number;
  profileImageUrl?: string;
  lastUpdated: number;
}

interface FriendsCache {
  username: string;
  friends: CachedFriend[];
  lastUpdated: number;
  expiresAt: number;
}

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
const STALE_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (serve stale if needed)

export async function onRequestGet(context: { request: Request; env: Env }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const url = new URL(context.request.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check cache first
    const cached = await getCachedFriends(context.env.MOVIES_DB, cleanUsername);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      console.log(
        `Serving cached friends for ${cleanUsername} (${cached.friends.length} friends)`
      );
      return new Response(
        JSON.stringify({
          friends: cached.friends,
          cached: true,
          lastUpdated: new Date(cached.lastUpdated).toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // If cache is stale but exists, serve it while we update in background
    if (cached && cached.expiresAt + STALE_CACHE_DURATION_MS > now) {
      console.log(
        `Serving stale cache for ${cleanUsername}, will update in background`
      );

      // Return stale data immediately
      const response = new Response(
        JSON.stringify({
          friends: cached.friends,
          cached: true,
          stale: true,
          lastUpdated: new Date(cached.lastUpdated).toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

      // Note: In a real implementation, you'd trigger background update here
      // For now, just return the stale data
      return response;
    }

    return new Response(
      JSON.stringify({
        error: "No cached data available, use POST to fetch and cache friends",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Cache GET error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { username, forceRefresh = false } = await context.request.json();

    if (!username) {
      return new Response(JSON.stringify({ error: "Username is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = await getCachedFriends(
        context.env.MOVIES_DB,
        cleanUsername
      );
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        console.log(`Returning cached friends for ${cleanUsername}`);
        return new Response(
          JSON.stringify({
            friends: cached.friends,
            cached: true,
            lastUpdated: new Date(cached.lastUpdated).toISOString(),
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    console.log(`Fetching fresh friends data for ${cleanUsername}`);

    // Import and use the scraping function directly
    const { scrapeLetterboxdFriends } = await import("../friends/index.js");
    const friends = await scrapeLetterboxdFriends(cleanUsername);

    // Cache the results
    await setCachedFriends(context.env.MOVIES_DB, cleanUsername, friends);

    return new Response(
      JSON.stringify({
        friends: friends,
        cached: false,
        lastUpdated: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Cache POST error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

async function getCachedFriends(
  database: any,
  username: string
): Promise<FriendsCache | null> {
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
      username,
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
  friends: CachedFriend[]
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

    console.log(`Cached ${friends.length} friends for ${username}`);
  } catch (error) {
    console.error("Error caching friends:", error);
    // Don't throw - caching is not critical
  }
}

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
