// AI Generated: GitHub Copilot - 2025-08-17
// Dynamic route handler for Letterboxd user watchlists
// Route: /letterboxd/[username]

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  results?: any[];
}

interface LetterboxdMovie {
  title: string;
  year: number;
  letterboxd_url: string;
  letterboxd_slug: string;
}

import { debugLog } from "../_lib/common";

interface Env {
  MOVIES_DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
  params: { username: string };
}) {
  const { env, params } = context;
  const username = params.username;

  if (!username) {
    return Response.json({ error: "Username required" }, { status: 400 });
  }

  try {
    debugLog(env, `🔥 Fetching watchlist for user: ${username}`);

    // Check cache first
    const cacheKey = `watchlist_${username}`;
    const cached = await env.MOVIES_DB.prepare(
      `SELECT data, expires_at FROM letterboxd_cache 
       WHERE cache_key = ? AND expires_at > datetime('now')`
    )
      .bind(cacheKey)
      .first();

    if (cached) {
      debugLog(env, `🔥 Using cached watchlist for ${username}`);
      const movies = JSON.parse(cached.data as string);
      return Response.json(
        {
          movies,
          count: movies.length,
          cached: true,
          username,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // If not cached, scrape from Letterboxd
    debugLog(env, `🔥 Scraping fresh watchlist for ${username}`);
    const movies = await scrapeUserWatchlist(username, env);

    // Cache the results for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await env.MOVIES_DB.prepare(
      `INSERT OR REPLACE INTO letterboxd_cache 
       (cache_key, username, data_type, data, item_count, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        cacheKey,
        username,
        "watchlist",
        JSON.stringify(movies),
        movies.length,
        expiresAt
      )
      .run();

    return Response.json(
      {
        movies,
        count: movies.length,
        cached: false,
        username,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error(`❌ Error fetching watchlist for ${username}:`, error);
    return Response.json(
      {
        error: "Failed to fetch watchlist",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function scrapeUserWatchlist(
  username: string,
  env?: Env
): Promise<LetterboxdMovie[]> {
  const movies: LetterboxdMovie[] = [];
  let page = 1;
  const maxPages = 50; // Safety limit

  while (page <= maxPages) {
    debugLog(env, `🔥 Scraping page ${page} for ${username}`);

    const url = `https://letterboxd.com/${username}/watchlist/page/${page}/`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BoxdBuddy/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        debugLog(env, `🔥 Reached end of watchlist at page ${page}`);
        break;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Check if we've reached the end (no more movies)
    if (!html.includes("data-film-slug=")) {
      debugLog(env, `🔥 No more movies found at page ${page}`);
      break;
    }

    // Extract movie data from the page
    const movieMatches = html.matchAll(
      /data-film-slug="([^"]+)".*?alt="([^"]+)".*?Released (\d{4})/gs
    );
    let pageMovieCount = 0;

    for (const match of movieMatches) {
      const slug = match[1];
      const title = match[2]
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'");
      const year = parseInt(match[3]);

      movies.push({
        title,
        year,
        letterboxd_slug: slug,
        letterboxd_url: `https://letterboxd.com/film/${slug}/`,
      });
      pageMovieCount++;
    }

    debugLog(env, `🔥 Found ${pageMovieCount} movies on page ${page}`);

    if (pageMovieCount === 0) {
      debugLog(env, `🔥 No movies found on page ${page}, stopping`);
      break;
    }

    page++;

    // Small delay between requests to be respectful
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  debugLog(env, `🔥 Total movies scraped for ${username}: ${movies.length}`);
  return movies;
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
