// AI Generated: GitHub Copilot - 2025-01-18
// Individual movie details endpoint with database fallback

import {
  jsonResponse,
  errorResponse,
  corsResponse,
  getCachedOrFetch,
  tmdbFetch,
  reduceMovie,
} from "../../_lib/common.js";

/**
 * Get individual movie details by ID
 * @param {Object} context - Request context
 * @param {Request} context.request - Request object
 * @param {Object} context.env - Environment object
 * @param {Object} context.params - URL parameters
 */
export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    if (!env.TMDB_API_KEY) {
      return errorResponse(
        "TMDB API key not configured",
        "TMDB_API_KEY_MISSING",
        503
      );
    }

    const movieId = parseInt(params.id);
    if (!movieId || movieId <= 0) {
      return errorResponse("Invalid movie ID", "INVALID_MOVIE_ID", 400);
    }

    const url = new URL(request.url);
    const appendToResponse =
      url.searchParams.get("append_to_response") || "credits";

    // Create cache keys
    const cacheKey = `https://api.boxdbud.pages.dev/api/movie/${movieId}?append_to_response=${appendToResponse}`;
    const kvKey = `movie_details:${movieId}:${appendToResponse}`;

    // Use dual caching for optimal performance
    const movieDetails = await getCachedOrFetch(
      cacheKey,
      kvKey,
      env.MOVIES_KV,
      async () => {
        console.log(`Fetching movie details for ID ${movieId}`);

        // Try local database first
        try {
          const localResult = await env.MOVIES_DB.prepare(
            `
            SELECT * FROM tmdb_movies 
            WHERE id = ?
          `
          )
            .bind(movieId)
            .first();

          if (localResult) {
            console.log(`Using local database for movie ${movieId}`);
            const baseMovie = reduceMovie(localResult);

            // For local data, we might not have all details, so still fetch from TMDB for complete info
            // but we can use local data as a fallback
            try {
              const tmdbResponse = await tmdbFetch(
                `/movie/${movieId}?append_to_response=${appendToResponse}`,
                env
              );
              if (tmdbResponse.ok) {
                const tmdbData = await tmdbResponse.json();
                return enhanceMovieWithCredits(tmdbData);
              }
            } catch (tmdbError) {
              console.warn(
                "TMDB API failed, using local data:",
                tmdbError.message
              );
              return {
                ...baseMovie,
                genres: [],
                production_companies: [],
                production_countries: [],
                spoken_languages: [],
                status: "Unknown",
                tagline: null,
                credits: { cast: [], crew: [] },
              };
            }
          }
        } catch (dbError) {
          console.warn(
            "Database query failed, using TMDB only:",
            dbError.message
          );
        }

        // Fetch from TMDB API
        const tmdbResponse = await tmdbFetch(
          `/movie/${movieId}?append_to_response=${appendToResponse}`,
          env
        );

        if (!tmdbResponse.ok) {
          if (tmdbResponse.status === 404) {
            throw new Error("Movie not found");
          }
          throw new Error(
            `TMDB API error: ${tmdbResponse.status} ${tmdbResponse.statusText}`
          );
        }

        const tmdbData = await tmdbResponse.json();
        return enhanceMovieWithCredits(tmdbData);
      },
      1800, // 30 minutes Cloudflare Cache
      7200 // 2 hours KV Cache
    );

    return jsonResponse(movieDetails, {
      headers: {
        "Cache-Control": "public, max-age=1800", // 30 minutes browser cache
      },
    });
  } catch (error) {
    console.error("Movie details endpoint error:", error);

    if (error.message === "Movie not found") {
      return errorResponse("Movie not found", "MOVIE_NOT_FOUND", 404);
    }

    return errorResponse(
      "Failed to fetch movie details",
      "MOVIE_DETAILS_ERROR",
      500,
      { message: error.message }
    );
  }
}

/**
 * Enhance movie data with credits information
 */
function enhanceMovieWithCredits(tmdbMovie) {
  const enhanced = reduceMovie(tmdbMovie);

  // Add additional movie details
  enhanced.genres = tmdbMovie.genres || [];
  enhanced.production_companies = tmdbMovie.production_companies || [];
  enhanced.production_countries = tmdbMovie.production_countries || [];
  enhanced.spoken_languages = tmdbMovie.spoken_languages || [];
  enhanced.status = tmdbMovie.status;
  enhanced.tagline = tmdbMovie.tagline;
  enhanced.budget = tmdbMovie.budget;
  enhanced.revenue = tmdbMovie.revenue;
  enhanced.imdb_id = tmdbMovie.imdb_id;

  // Process credits if available
  if (tmdbMovie.credits) {
    enhanced.credits = {
      cast: (tmdbMovie.credits.cast || []).slice(0, 10).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profile_path: person.profile_path,
        order: person.order,
      })),
      crew: (tmdbMovie.credits.crew || [])
        .filter(
          (person) =>
            person.job === "Director" ||
            person.job === "Producer" ||
            person.job === "Writer"
        )
        .map((person) => ({
          id: person.id,
          name: person.name,
          job: person.job,
          department: person.department,
          profile_path: person.profile_path,
        })),
    };

    // Extract director for compatibility
    const director = tmdbMovie.credits.crew?.find(
      (person) => person.job === "Director"
    );
    if (director) {
      enhanced.director = director.name;
    }
  }

  return enhanced;
}

// Handle CORS preflight
export async function onRequestOptions() {
  return corsResponse();
}
