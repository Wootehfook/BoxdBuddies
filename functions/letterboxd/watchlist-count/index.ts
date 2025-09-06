/*
 * BoxdBuddy - Letterboxd Watchlist Count API Endpoint
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

import { debugLog } from "../../_lib/common.js";

interface Env {
  MOVIES_DB: any; // D1Database type
}

interface WatchlistCount {
  username: string;
  count: number;
  lastUpdated: number;
}

// Rate limiting - 1 second between requests to be respectful to Letterboxd
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

async function scrapeWatchlistCount(username: string): Promise<number> {
  try {
    await rateLimit();

    // First try the profile page which often has more reliable stats
    const profileUrl = `https://letterboxd.com/${username}/`;
    debugLog(
      undefined,
      `Checking profile page for watchlist count: ${profileUrl}`
    );

    const profileResponse = await fetch(profileUrl, {
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

    if (profileResponse.ok) {
      const profileHtml = await profileResponse.text();

      // Look for watchlist link with count on profile page
      const profilePatterns = [
        // Profile stats: "WATCHLIST [314]"
        /<h2[^>]*>.*?WATCHLIST.*?<\/h2>\s*<a[^>]+href="\/[^\/]+\/watchlist\/"[^>]*>.*?(\d+(?:,\d+)*)/is,
        // Link with number after watchlist heading
        /WATCHLIST<\/.*?>\s*<a[^>]+href="\/[^\/]+\/watchlist\/"[^>]*>\s*(\d+(?:,\d+)*)/is,
        // Direct link pattern: <a href="/username/watchlist/">314</a>
        /<a[^>]+href="\/[^\/]+\/watchlist\/"[^>]*>\s*(\d+(?:,\d+)*)/i,
        // Alternative stats section layout
        /<div[^>]*class="[^"]*statistic[^"]*"[^>]*>.*?watchlist.*?(\d+(?:,\d+)*)/is,
      ];

      for (const pattern of profilePatterns) {
        const match = profileHtml.match(pattern);
        if (match) {
          const count = parseInt(match[1].replace(/,/g, ""));
          debugLog(
            undefined,
            `Found watchlist count for ${username} from profile: ${count}`
          );
          return count;
        }
      }
    }

    // Fallback to watchlist page if profile doesn't have the info
    await rateLimit();
    const watchlistUrl = `https://letterboxd.com/${username}/watchlist/`;
    debugLog(undefined, `Scraping watchlist count from: ${watchlistUrl}`);

    const response = await fetch(watchlistUrl, {
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
        console.log(
          `User "${username}" watchlist not found (private or doesn't exist)`
        );
        return 0;
      }
      throw new Error(
        `Failed to fetch watchlist page: HTTP ${response.status}`
      );
    }

    const html = await response.text();

    // Look for watchlist count in page metadata and headers (most efficient)
    const countPatterns = [
      // Page title: "Watchlist • wootehfook • Letterboxd" or "123 films • Watchlist • wootehfook"
      /<title[^>]*>([^<]*watchlist[^<]*)<\/title>/i,
      // Meta description with count
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*watchlist[^"']*)/i,
      // Header section with count
      /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*\d+[^<]*)<\/h1>/i,
      // Direct pattern in body: "123 films in watchlist"
      /(\d+(?:,\d+)*)\s+films?\s+in\s+watchlist/i,
      // Navigation breadcrumb with count
      /<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>.*?(\d+(?:,\d+)*)\s+films?/is,
      // Page heading with count
      /<div[^>]*class="[^"]*page-heading[^"]*"[^>]*>.*?(\d+(?:,\d+)*)\s+films?/is,
      // Alternative single film pattern
      /(1)\s+film\s+in\s+watchlist/i,
    ];

    // First, try to extract from page title and meta tags (most reliable)
    for (let i = 0; i < countPatterns.length; i++) {
      const pattern = countPatterns[i];
      const match = html.match(pattern);
      if (match) {
        // For title and meta patterns, extract number from the matched text
        if (i <= 2) {
          const numberMatch = match[1].match(/(\d+(?:,\d+)*)/);
          if (numberMatch) {
            const count = parseInt(numberMatch[1].replace(/,/g, ""));
            debugLog(
              undefined,
              `Found watchlist count for ${username} in metadata: ${count}`
            );
            return count;
          }
        } else {
          // For direct number patterns
          const count = parseInt(match[1].replace(/,/g, ""));
          debugLog(
            undefined,
            `Found watchlist count for ${username} in content: ${count}`
          );
          return count;
        }
      }
    }

    // Check for JSON-LD structured data (Letterboxd often includes this)
    const jsonLdMatch = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is
    );
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData.numberOfItems || jsonData.totalCount) {
          const count = jsonData.numberOfItems || jsonData.totalCount;
          debugLog(
            undefined,
            `Found watchlist count for ${username} in JSON-LD: ${count}`
          );
          return count;
        }
      } catch {
        // JSON parsing failed, continue with other methods
      }
    }

    // Look for pagination info which often reveals total count
    const paginationPatterns = [
      // "Page 1 of 3" - multiply page size by total pages
      /page\s+\d+\s+of\s+(\d+)/i,
      // "Showing 1-72 of 123 results"
      /showing\s+[\d,-]+\s+of\s+(\d+(?:,\d+)*)/i,
      // Look for last page number to estimate total
      /<a[^>]+href="[^"]*page\/(\d+)"[^>]*>.*?(?:last|»|next)/i,
    ];

    for (const pattern of paginationPatterns) {
      const match = html.match(pattern);
      if (match) {
        if (pattern.source.includes("of")) {
          // Direct total count
          const count = parseInt(match[1].replace(/,/g, ""));
          debugLog(
            undefined,
            `Found watchlist count for ${username} from pagination: ${count}`
          );
          return count;
        } else {
          // Estimate from last page (assume 72 items per page, Letterboxd standard)
          const lastPage = parseInt(match[1]);
          const estimatedCount = lastPage * 72;
          debugLog(
            undefined,
            `Estimated watchlist count for ${username} from pagination: ~${estimatedCount}`
          );
          return estimatedCount;
        }
      }
    }

    // Check if the watchlist page shows "no films" or empty state
    const emptyPatterns = [
      /no\s+films?\s+in\s+watchlist/i,
      /watchlist\s+is\s+empty/i,
      /hasn't\s+added\s+any\s+films?\s+to\s+their\s+watchlist/i,
    ];

    for (const pattern of emptyPatterns) {
      if (html.match(pattern)) {
        console.log(`Found empty watchlist for ${username}`);
        return 0;
      }
    }

    // If we can access the page but no clear count found, check for film grid
    const filmGridMatch = html.match(
      /<ul[^>]*class="[^"]*poster-list[^"]*"[^>]*>/i
    );
    if (filmGridMatch) {
      // Count film posters as a fallback
      const posterMatches = html.match(
        /<li[^>]*class="[^"]*poster-container[^"]*"/gi
      );
      if (posterMatches) {
        const count = posterMatches.length;
        debugLog(undefined, `Counted ${count} film posters for ${username}`);
        return count;
      }
    }

    debugLog(
      undefined,
      `Could not determine watchlist count for ${username}, defaulting to 0`
    );
    return 0;
  } catch (error) {
    console.error(`Error scraping watchlist count for ${username}:`, error);
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
        // Check cache first unless force refresh requested
        if (!forceRefresh) {
          const cached = await getCachedWatchlistCount(
            context.env.MOVIES_DB,
            cleanUsername
          );
          const now = Date.now();
          const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

          if (cached && cached.lastUpdated > now - CACHE_DURATION) {
            console.log(
              `Using cached watchlist count for ${cleanUsername}: ${cached.count}`
            );
            results[cleanUsername] = cached.count;
            continue;
          }
        }

        // Scrape fresh count
        const count = await scrapeWatchlistCount(cleanUsername);
        results[cleanUsername] = count;

        // Cache the result
        await setCachedWatchlistCount(
          context.env.MOVIES_DB,
          cleanUsername,
          count
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
  database: any,
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
      .first();

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
  database: any,
  username: string,
  count: number
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

    console.log(`Cached watchlist count for ${username}: ${count}`);
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
