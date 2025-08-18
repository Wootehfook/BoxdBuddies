// AI Generated: GitHub Copilot - 2025-08-16
// Enhanced search endpoint with dual caching layer

import {
  jsonResponse,
  errorResponse,
  corsResponse,
  getCachedOrFetch,
  tmdbFetch,
  reduceMovie,
} from "../_lib/common.js";

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  results?: unknown[];
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
}

interface Env {
  MOVIES_DB: D1Database;
  MOVIES_KV: KVNamespace;
  TMDB_API_KEY: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    if (!env.TMDB_API_KEY) {
      return errorResponse(
        "TMDB API key not configured",
        "TMDB_API_KEY_MISSING",
        503
      );
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const page = Math.max(
      1,
      Math.min(500, Number(url.searchParams.get("page") || "1"))
    );

    if (!q) {
      return errorResponse("Missing search query", "MISSING_QUERY", 400);
    }

    if (q.length < 2) {
      return errorResponse(
        "Search query must be at least 2 characters",
        "QUERY_TOO_SHORT",
        400
      );
    }

    // Create cache keys for dual caching
    const cacheKey = `https://api.boxdbud.pages.dev/search?q=${encodeURIComponent(q)}&page=${page}`;
    const kvKey = `search:${q}:${page}`;

    // Use dual caching for optimal performance
    const searchResults = await getCachedOrFetch(
      cacheKey,
      kvKey,
      env.MOVIES_KV,
      async () => {
        console.log(`Searching for "${q}" on page ${page}`);

        // Try local database first for better performance
        try {
          // Get total count of matching records
          const countResult = await env.MOVIES_DB.prepare(
            `SELECT COUNT(*) as total FROM tmdb_movies 
             WHERE title LIKE ? OR original_title LIKE ?`
          )
            .bind(`%${q}%`, `%${q}%`)
            .all();

          const totalRecords = (countResult.results?.[0] as any)?.total || 0;

          if (totalRecords > 0) {
            // Get the paginated results
            const localResults = await env.MOVIES_DB.prepare(
              `SELECT * FROM tmdb_movies 
               WHERE title LIKE ? OR original_title LIKE ?
               ORDER BY popularity DESC
               LIMIT ? OFFSET ?`
            )
              .bind(`%${q}%`, `%${q}%`, 20, (page - 1) * 20)
              .all();

            if (localResults.results && localResults.results.length > 0) {
              console.log(
                `Database search returned ${localResults.results.length} results for "${q}"`
              );

              const movies = (localResults.results as any[]).map((movie) =>
                reduceMovie(movie)
              );

              return {
                movies,
                totalPages: Math.ceil(totalRecords / 20),
                totalRecords,
                source: "database",
              };
            }
          }
        } catch (dbError) {
          console.warn(
            "Database search failed, falling back to TMDB:",
            dbError.message
          );
        }

        // Fallback to TMDB API
        const tmdbResponse = await tmdbFetch(
          `/search/movie?query=${encodeURIComponent(q)}&page=${page}`,
          env
        );

        if (!tmdbResponse.ok) {
          throw new Error(
            `TMDB API error: ${tmdbResponse.status} ${tmdbResponse.statusText}`
          );
        }

        const tmdbData = await tmdbResponse.json();
        const movies = (tmdbData.results || []).map((movie: any) =>
          reduceMovie(movie)
        );

        console.log(`TMDB search returned ${movies.length} results for "${q}"`);

        return {
          movies,
          totalPages: Math.min(tmdbData.total_pages ?? 1, 500), // TMDB limit
          totalRecords: Math.min(tmdbData.total_results ?? 0, 10000),
          source: "tmdb",
        };
      },
      300, // 5 minutes Cloudflare Cache
      900 // 15 minutes KV Cache (shorter for search results to stay fresh)
    );

    return jsonResponse(searchResults, {
      headers: {
        "Cache-Control": "public, max-age=300", // 5 minutes browser cache
      },
    });
  } catch (error) {
    console.error("Search endpoint error:", error);
    return errorResponse("Search failed", "SEARCH_ERROR", 500, {
      message: error.message,
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return corsResponse();
}
