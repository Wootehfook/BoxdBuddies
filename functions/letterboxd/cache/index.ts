/*
 * BoxdBuddy - Cache Module (Friends + Watchlist)
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

interface Env {
  MOVIES_DB: any; // D1Database type
  TMDB_API_KEY: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  FEATURE_SERVER_WATCHLIST_CACHE?: string;
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

    // Ensure cached entries include lastUpdated to satisfy schema
    const cachedFriends: CachedFriend[] = friends.map((f) => ({
      ...f,
      lastUpdated: Date.now(),
    }));

    // Cache the results
    await setCachedFriends(context.env.MOVIES_DB, cleanUsername, cachedFriends);

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

// Watchlist Count Cache Functions

interface WatchlistCountEntry {
  count: number;
  etag?: string;
  lastFetchedAt: number;
  source: "client" | "server";
}

const WATCHLIST_CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

// Get cached watchlist count
export async function getCount(
  username: string,
  env: Env
): Promise<WatchlistCountEntry | null> {
  // Check feature flag - use env var if set, otherwise assume enabled for testing
  const featureEnabled = env.FEATURE_SERVER_WATCHLIST_CACHE !== "false";
  if (!featureEnabled) {
    return null;
  }

  try {
    // Try Redis first if available
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      const redisResult = await getCountFromRedis(username, env);
      if (redisResult) {
        return redisResult;
      }
    }

    // Fallback to D1
    return await getCountFromD1(username, env);
  } catch (error) {
    console.error("Error getting cached count:", error);
    return null;
  }
}

// Set cached watchlist count
export async function setCount(
  username: string,
  payload: WatchlistCountEntry,
  env: Env
): Promise<void> {
  // Check feature flag - use env var if set, otherwise assume enabled for testing
  const featureEnabled = env.FEATURE_SERVER_WATCHLIST_CACHE !== "false";
  if (!featureEnabled) {
    return;
  }

  // Validate payload
  if (typeof payload.count !== "number" || payload.count < 0) {
    console.error("Invalid count value");
    return; // Don't throw, just return silently
  }

  try {
    // Store in Redis if available
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      await setCountInRedis(username, payload, env);
    }

    // Also store in D1 as backup
    await setCountInD1(username, payload, env);
  } catch (error) {
    console.error("Error setting cached count:", error);
    throw error;
  }
}

// Acquire lock for cache operations
export async function acquireLock(
  username: string,
  timeoutMs: number,
  env: Env
): Promise<boolean> {
  // Check feature flag - use env var if set, otherwise assume enabled for testing
  const featureEnabled = env.FEATURE_SERVER_WATCHLIST_CACHE !== "false";
  if (!featureEnabled) {
    return true; // No-op when disabled
  }

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // Fallback to D1-based locking
    return await acquireLockD1(username, timeoutMs, env);
  }

  try {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "SET",
        `lock:${username}`,
        "1",
        "NX",
        "PX",
        timeoutMs.toString(),
      ]),
    });

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status}`);
    }

    const result = await response.json();
    // Handle both "OK" response and numeric response (1 for success, 0 for failure)
    return result.result === "OK" || result.result === 1;
  } catch (error) {
    console.error("Error acquiring Redis lock:", error);
    // Fallback to D1
    return await acquireLockD1(username, timeoutMs, env);
  }
}

// Release lock
export async function releaseLock(username: string, env: Env): Promise<void> {
  // Check feature flag - use env var if set, otherwise assume enabled for testing
  const featureEnabled = env.FEATURE_SERVER_WATCHLIST_CACHE !== "false";
  if (!featureEnabled) {
    return; // No-op when disabled
  }

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    await releaseLockD1(username, env);
    return;
  }

  try {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["DEL", `lock:${username}`]),
    });

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status}`);
    }
  } catch (error) {
    console.error("Error releasing Redis lock:", error);
    // Fallback to D1
    await releaseLockD1(username, env);
  }
}

// Helper functions for Redis operations
async function getCountFromRedis(
  username: string,
  env: Env
): Promise<WatchlistCountEntry | null> {
  try {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", `watchlist:count:${username}`]),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (!result.result) {
      return null;
    }

    const data = JSON.parse(result.result);

    // Validate required fields
    if (typeof data.count !== "number" || data.count < 0) {
      console.error("Invalid cache entry: missing or invalid count");
      return null;
    }

    // Check if data is stale (older than 12 hours)
    const now = Date.now();
    if (
      data.lastFetchedAt &&
      now - data.lastFetchedAt > WATCHLIST_CACHE_DURATION_MS
    ) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting count from Redis:", error);
    return null;
  }
}

async function setCountInRedis(
  username: string,
  payload: WatchlistCountEntry,
  env: Env
): Promise<void> {
  try {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "SETEX",
        `watchlist:count:${username}`,
        Math.floor(WATCHLIST_CACHE_DURATION_MS / 1000),
        JSON.stringify(payload),
      ]),
    });

    if (!response.ok) {
      throw new Error(`Redis set failed: ${response.status}`);
    }
  } catch (error) {
    console.error("Error setting count in Redis:", error);
    throw error;
  }
}

// Helper functions for D1 operations
async function getCountFromD1(
  username: string,
  env: Env
): Promise<WatchlistCountEntry | null> {
  try {
    const result = await env.MOVIES_DB.prepare(
      "SELECT value, expires_at FROM watchlist_counts_cache WHERE username = ?"
    )
      .bind(username)
      .first();

    if (!result) {
      return null;
    }

    const now = Date.now();
    if (result.expires_at < now) {
      return null; // Expired
    }

    return JSON.parse(result.value);
  } catch (error) {
    console.error("Error getting count from D1:", error);
    return null;
  }
}

async function setCountInD1(
  username: string,
  payload: WatchlistCountEntry,
  env: Env
): Promise<void> {
  try {
    const expiresAt = Date.now() + WATCHLIST_CACHE_DURATION_MS;

    await env.MOVIES_DB.prepare(
      "INSERT OR REPLACE INTO watchlist_counts_cache (username, value, expires_at) VALUES (?, ?, ?)"
    )
      .bind(username, JSON.stringify(payload), expiresAt)
      .run();
  } catch (error) {
    console.error("Error setting count in D1:", error);
    throw error;
  }
}

async function acquireLockD1(
  username: string,
  timeoutMs: number,
  env: Env
): Promise<boolean> {
  try {
    const lockKey = `lock:${username}`;
    const expiresAt = Date.now() + timeoutMs;

    const result = await env.MOVIES_DB.prepare(
      "INSERT OR IGNORE INTO cache_locks (lock_key, expires_at) VALUES (?, ?)"
    )
      .bind(lockKey, expiresAt)
      .run();

    return result.meta.changes > 0; // True if inserted (lock acquired)
  } catch (error) {
    console.error("Error acquiring D1 lock:", error);
    return false;
  }
}

async function releaseLockD1(username: string, env: Env): Promise<void> {
  try {
    const lockKey = `lock:${username}`;

    await env.MOVIES_DB.prepare("DELETE FROM cache_locks WHERE lock_key = ?")
      .bind(lockKey)
      .run();
  } catch (error) {
    console.error("Error releasing D1 lock:", error);
  }
}
