// AI Generated: GitHub Copilot - 2025-01-18
// Popular movies endpoint with pagination and dual caching

import {
  jsonResponse,
  errorResponse,
  corsResponse,
  getCachedOrFetch,
  tmdbFetch,
  reduceMovie,
} from "../_lib/common.js";

/**
 * Get popular movies with pagination and caching
 * @param {Object} context - Request context
 * @param {Request} context.request - Request object
 * @param {Object} context.env - Environment object with MOVIES_DB, MOVIES_KV, TMDB_API_KEY
 */
export async function onRequestGet(context) {
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
    const page = Math.max(
      1,
      Math.min(500, Number(url.searchParams.get("page") || "1"))
    );
    const region = url.searchParams.get("region") || "US";

    // Create cache keys
    const cacheKey = `https://api.boxdbud.pages.dev/api/popular?page=${page}&region=${region}`;
    const kvKey = `popular_movies:${page}:${region}`;

    // Use dual caching for optimal performance
    const popularMovies = await getCachedOrFetch(
      cacheKey,
      kvKey,
      env.MOVIES_KV,
      async () => {
        console.log(
          `Fetching popular movies page ${page} for region ${region}`
        );

        // Try local database first for better performance
        try {
          const localResult = await env.MOVIES_DB.prepare(
            `
            SELECT * FROM tmdb_movies 
            WHERE popularity IS NOT NULL 
            ORDER BY popularity DESC 
            LIMIT 20 OFFSET ?
          `
          )
            .bind((page - 1) * 20)
            .all();

          if (localResult.results && localResult.results.length > 0) {
            console.log(`Using local database for popular movies page ${page}`);
            return {
              page,
              total_pages: 500, // TMDB limit
              total_results: 10000, // Estimated
              movies: localResult.results.map((movie) => ({
                ...reduceMovie(movie),
                popularity: movie.popularity,
              })),
            };
          }
        } catch (dbError) {
          console.warn(
            "Database query failed, falling back to TMDB:",
            dbError.message
          );
        }

        // Fallback to TMDB API
        const tmdbResponse = await tmdbFetch(
          `/movie/popular?page=${page}&region=${region}`,
          env
        );

        if (!tmdbResponse.ok) {
          throw new Error(
            `TMDB API error: ${tmdbResponse.status} ${tmdbResponse.statusText}`
          );
        }

        const tmdbData = await tmdbResponse.json();

        return {
          page: tmdbData.page,
          total_pages: Math.min(tmdbData.total_pages, 500), // TMDB limit
          total_results: Math.min(tmdbData.total_results, 10000),
          movies: (tmdbData.results || []).map((movie) => ({
            ...reduceMovie(movie),
            popularity: movie.popularity,
          })),
        };
      },
      300, // 5 minutes Cloudflare Cache
      1800 // 30 minutes KV Cache
    );

    return jsonResponse(popularMovies, {
      headers: {
        "Cache-Control": "public, max-age=300", // 5 minutes browser cache
      },
    });
  } catch (error) {
    console.error("Popular movies endpoint error:", error);
    return errorResponse(
      "Failed to fetch popular movies",
      "POPULAR_MOVIES_ERROR",
      500,
      { message: error.message }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return corsResponse();
}
