/*
 * Boxdbud.io - Letterboxd Watchlist Count API Endpoint
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

import { debugLog } from "../../_lib/common";
import type { D1DatabaseLike, Env as CacheEnv } from "../cache/index.js";

interface WatchlistCount {
  username: string;
  count: number;
  lastUpdated: number;
}

// Rate limiting - 1 second between requests to be respectful to Letterboxd
let lastRequestTime = 0;
const RATE_LIMIT_MS = 1000;

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  DNT: "1",
  Connection: "keep-alive",
};

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

function parseCountText(text: string): number {
  return Number.parseInt(text.replaceAll(",", ""), 10);
}

// Profile stats patterns, e.g. "WATCHLIST [314]"
const PROFILE_PATTERNS = [
  // Profile stats: "WATCHLIST [314]"
  /<h2[^>]*>.*?WATCHLIST.*?<\/h2>\s*<a[^>]+href="\/[^/]+\/watchlist\/"[^>]*>.*?(\d+(?:,\d+)*)/is,
  // Link with number after watchlist heading
  /WATCHLIST<\/.*?>\s*<a[^>]+href="\/[^/]+\/watchlist\/"[^>]*>\s*(\d+(?:,\d+)*)/is,
  // Direct link pattern: <a href="/username/watchlist/">314</a>
  /<a[^>]+href="\/[^/]+\/watchlist\/"[^>]*>\s*(\d+(?:,\d+)*)/i,
  // Alternative stats section layout
  /<div[^>]*class="[^"]*statistic[^"]*"[^>]*>.*?watchlist.*?(\d+(?:,\d+)*)/is,
];

function findProfileCount(html: string): number | null {
  for (const pattern of PROFILE_PATTERNS) {
    const match = pattern.exec(html);
    if (match) {
      return parseCountText(match[1]);
    }
  }
  return null;
}

// Page title / meta description / page heading - number extracted separately
const METADATA_PATTERNS = [
  // Page title: "Watchlist • wootehfook • Letterboxd" or "123 films • Watchlist • wootehfook"
  /<title[^>]*>([^<]*watchlist[^<]*)<\/title>/i,
  // Meta description with count
  /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*watchlist[^"']*)/i,
  // Header section - number extracted from the heading text afterwards
  /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/h1>/i,
];

function findMetadataCount(html: string): number | null {
  for (const pattern of METADATA_PATTERNS) {
    const match = pattern.exec(html);
    if (match) {
      const numberMatch = /(\d[\d,]*)/.exec(match[1]);
      if (numberMatch) {
        return parseCountText(numberMatch[1]);
      }
    }
  }
  return null;
}

// Find "<n> films" shortly after an anchor element (breadcrumb, page heading)
// in two linear steps instead of one backtracking-heavy regex.
function findNearbyFilmsCount(html: string, anchor: RegExp): number | null {
  const anchorMatch = anchor.exec(html);
  if (!anchorMatch) {
    return null;
  }
  const start = anchorMatch.index + anchorMatch[0].length;
  const windowText = html.slice(start, start + 2000);
  const numberMatch = /(\d[\d,]*)\s+films?/i.exec(windowText);
  return numberMatch ? parseCountText(numberMatch[1]) : null;
}

function findContentCount(html: string): number | null {
  // Direct pattern in body: "123 films in watchlist"
  const direct = /(\d[\d,]*)\s+films?\s+in\s+watchlist/i.exec(html);
  if (direct) {
    return parseCountText(direct[1]);
  }
  // Navigation breadcrumb / page heading with count
  const anchors = [
    /<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>/i,
    /<div[^>]*class="[^"]*page-heading[^"]*"[^>]*>/i,
  ];
  for (const anchor of anchors) {
    const nearby = findNearbyFilmsCount(html, anchor);
    if (nearby !== null) {
      return nearby;
    }
  }
  // Alternative single film pattern
  if (/1\s+film\s+in\s+watchlist/i.test(html)) {
    return 1;
  }
  return null;
}

// Letterboxd often includes JSON-LD structured data
function findJsonLdCount(html: string): number | null {
  const jsonLdMatch =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is.exec(
      html
    );
  if (!jsonLdMatch) {
    return null;
  }
  try {
    const jsonData = JSON.parse(jsonLdMatch[1]);
    // JSON-LD may encode the count as a string ("216") or a number; coerce
    // and reject non-finite values so a bad type never leaks into the API.
    const raw = jsonData.numberOfItems ?? jsonData.totalCount;
    const count = Number(raw);
    if (Number.isFinite(count) && count >= 0) {
      return count;
    }
  } catch {
    // JSON parsing failed, continue with other methods
  }
  return null;
}

// Letterboxd shows 72 films per watchlist page
const ITEMS_PER_PAGE = 72;

// Pagination info often reveals the total count
function findPaginationCount(
  html: string
): { count: number; estimated: boolean } | null {
  // "Showing 1-72 of 123 results" gives a true film total
  const totalMatch = /showing\s+[\d,-]+\s+of\s+(\d[\d,]*)/i.exec(html);
  if (totalMatch) {
    return { count: parseCountText(totalMatch[1]), estimated: false };
  }
  // "Page 1 of 3" gives the number of *pages*, not films — estimate the film
  // count from the page count (assume a full last page).
  const pageOfMatch = /page\s+\d+\s+of\s+(\d+)/i.exec(html);
  if (pageOfMatch) {
    return {
      count: Number.parseInt(pageOfMatch[1], 10) * ITEMS_PER_PAGE,
      estimated: true,
    };
  }
  // Estimate from last page link (same per-page assumption)
  const lastPageMatch =
    /<a[^>]+href="[^"]*page\/(\d+)"[^>]*>.*?(?:last|»|next)/i.exec(html);
  if (lastPageMatch) {
    return {
      count: Number.parseInt(lastPageMatch[1], 10) * ITEMS_PER_PAGE,
      estimated: true,
    };
  }
  return null;
}

const EMPTY_PATTERNS = [
  /no\s+films?\s+in\s+watchlist/i,
  /watchlist\s+is\s+empty/i,
  /hasn't\s+added\s+any\s+films?\s+to\s+their\s+watchlist/i,
];

function isEmptyWatchlist(html: string): boolean {
  return EMPTY_PATTERNS.some((pattern) => pattern.test(html));
}

// Count film posters in the grid as a fallback
function countFilmPosters(html: string): number | null {
  if (!/<ul[^>]*class="[^"]*poster-list[^"]*"[^>]*>/i.test(html)) {
    return null;
  }
  const posterMatches = html.match(
    /<li[^>]*class="[^"]*poster-container[^"]*"/gi
  );
  return posterMatches ? posterMatches.length : null;
}

async function fetchProfileCount(
  username: string,
  env?: CacheEnv
): Promise<number | null> {
  const profileUrl = `https://letterboxd.com/${username}/`;
  debugLog(env, `Checking profile page for watchlist count: ${profileUrl}`);

  const profileResponse = await fetch(profileUrl, {
    headers: BROWSER_HEADERS,
  });
  if (!profileResponse.ok) {
    return null;
  }
  return findProfileCount(await profileResponse.text());
}

// Returns the page HTML, or null when the watchlist is private / missing (404)
async function fetchWatchlistPage(
  username: string,
  env?: CacheEnv
): Promise<string | null> {
  const watchlistUrl = `https://letterboxd.com/${username}/watchlist/`;
  debugLog(env, `Scraping watchlist count from: ${watchlistUrl}`);

  const response = await fetch(watchlistUrl, {
    headers: BROWSER_HEADERS,
  });
  if (!response.ok) {
    if (response.status === 404) {
      debugLog(
        env,
        `User "${username}" watchlist not found (private or doesn't exist)`
      );
      return null;
    }
    throw new Error(`Failed to fetch watchlist page: HTTP ${response.status}`);
  }
  return response.text();
}

async function scrapeWatchlistCount(
  username: string,
  env?: CacheEnv
): Promise<number> {
  try {
    await rateLimit();
    const profileCount = await fetchProfileCount(username, env);
    if (profileCount !== null) {
      debugLog(
        env,
        `Found watchlist count for ${username} from profile: ${profileCount}`
      );
      return profileCount;
    }

    // Fallback to watchlist page if profile doesn't have the info
    await rateLimit();
    const html = await fetchWatchlistPage(username, env);
    if (html === null) {
      return 0;
    }

    const metadataCount = findMetadataCount(html);
    if (metadataCount !== null) {
      debugLog(
        env,
        `Found watchlist count for ${username} in metadata: ${metadataCount}`
      );
      return metadataCount;
    }

    const contentCount = findContentCount(html);
    if (contentCount !== null) {
      debugLog(
        env,
        `Found watchlist count for ${username} in content: ${contentCount}`
      );
      return contentCount;
    }

    const jsonLdCount = findJsonLdCount(html);
    if (jsonLdCount !== null) {
      debugLog(
        env,
        `Found watchlist count for ${username} in JSON-LD: ${jsonLdCount}`
      );
      return jsonLdCount;
    }

    const pagination = findPaginationCount(html);
    if (pagination !== null) {
      debugLog(
        env,
        pagination.estimated
          ? `Estimated watchlist count for ${username} from pagination: ~${pagination.count}`
          : `Found watchlist count for ${username} from pagination: ${pagination.count}`
      );
      return pagination.count;
    }

    if (isEmptyWatchlist(html)) {
      debugLog(env, `Found empty watchlist for ${username}`);
      return 0;
    }

    const posterCount = countFilmPosters(html);
    if (posterCount !== null) {
      debugLog(env, `Counted ${posterCount} film posters for ${username}`);
      return posterCount;
    }

    debugLog(
      env,
      `Could not determine watchlist count for ${username}, defaulting to 0`
    );
    return 0;
  } catch (error) {
    console.error(`Error scraping watchlist count for ${username}:`, error);
    throw error;
  }
}

// Serve from cache when fresh, otherwise scrape and cache the result
async function resolveWatchlistCount(
  env: CacheEnv,
  username: string,
  forceRefresh: boolean
): Promise<number> {
  if (!forceRefresh) {
    const cached = await getCachedWatchlistCount(env.MOVIES_DB, username);
    if (cached && cached.lastUpdated > Date.now() - CACHE_DURATION_MS) {
      debugLog(
        env,
        `Using cached watchlist count for ${username}: ${cached.count}`
      );
      return cached.count;
    }
  }

  const count = await scrapeWatchlistCount(username, env);
  await setCachedWatchlistCount(env.MOVIES_DB, username, count, env);
  return count;
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
    const { usernames, forceRefresh = false } = await context.request.json();

    if (!usernames || !Array.isArray(usernames)) {
      return new Response(
        JSON.stringify({ error: "Array of usernames is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const results: Record<string, number> = {};
    const errors: Record<string, string> = {};

    for (const username of usernames) {
      if (!username || typeof username !== "string") {
        errors[username] = "Invalid username";
        continue;
      }

      const cleanUsername = username.trim().toLowerCase();

      // Validate username format
      if (!/^[a-z0-9_-]+$/i.test(cleanUsername)) {
        errors[cleanUsername] = "Invalid username format";
        continue;
      }

      try {
        results[cleanUsername] = await resolveWatchlistCount(
          context.env,
          cleanUsername,
          forceRefresh
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors[cleanUsername] = errorMessage;
        console.error(
          `Failed to get watchlist count for ${cleanUsername}:`,
          errorMessage
        );
      }
    }

    return new Response(
      JSON.stringify({
        results,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Watchlist count API error:", error);

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

// Cache management functions
async function getCachedWatchlistCount(
  database: D1DatabaseLike,
  username: string
): Promise<WatchlistCount | null> {
  try {
    const result = await database
      .prepare(
        `
      SELECT username, watchlist_count, last_updated
      FROM watchlist_counts_cache
      WHERE username = ?
    `
      )
      .bind(username)
      .first<{
        username: string;
        watchlist_count: number;
        last_updated: number;
      }>();

    if (!result) {
      return null;
    }

    return {
      username: result.username,
      count: result.watchlist_count,
      lastUpdated: result.last_updated,
    };
  } catch (error) {
    console.error("Error getting cached watchlist count:", error);
    return null;
  }
}

async function setCachedWatchlistCount(
  database: D1DatabaseLike,
  username: string,
  count: number,
  env?: CacheEnv
): Promise<void> {
  try {
    const now = Date.now();

    await database
      .prepare(
        `
      INSERT OR REPLACE INTO watchlist_counts_cache
      (username, watchlist_count, last_updated)
      VALUES (?, ?, ?)
    `
      )
      .bind(username, count, now)
      .run();

    debugLog(env, `Cached watchlist count for ${username}: ${count}`);
  } catch (error) {
    console.error("Error caching watchlist count:", error);
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
