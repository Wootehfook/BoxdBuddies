// AI Generated: GitHub Copilot - 2025-01-18
// Batch movie enhancement endpoint with intelligent year-based matching

import {
  jsonResponse,
  errorResponse,
  corsResponse,
  tmdbFetch,
  reduceMovie,
  toYear,
} from "../../_lib/common.js";

/**
 * Enhance multiple movies with TMDB data using intelligent matching
 * @param {Object} context - Request context
 * @param {Request} context.request - Request object
 * @param {Object} context.env - Environment object
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.TMDB_API_KEY) {
      return errorResponse(
        "TMDB API key not configured",
        "TMDB_API_KEY_MISSING",
        503
      );
    }

    const body = await request.json();
    if (!body.movies || !Array.isArray(body.movies)) {
      return errorResponse(
        "Request must include 'movies' array",
        "INVALID_REQUEST_FORMAT",
        400
      );
    }

    // Rate limit: max 50 movies per request
    if (body.movies.length > 50) {
      return errorResponse(
        "Maximum 50 movies allowed per request",
        "RATE_LIMIT_EXCEEDED",
        400,
        { maxMovies: 50, providedMovies: body.movies.length }
      );
    }

    console.log(`Enhancing ${body.movies.length} movies with TMDB data`);

    const enhancedMovies = [];
    const errors = [];

    // Process movies in parallel with some rate limiting
    const batchSize = 10;
    for (let i = 0; i < body.movies.length; i += batchSize) {
      const batch = body.movies.slice(i, i + batchSize);

      const batchPromises = batch.map(async (movie, index) => {
        try {
          const enhanced = await enhanceMovie(movie, env);
          return { index: i + index, movie: enhanced };
        } catch (error) {
          console.error(`Error enhancing movie ${movie.title}:`, error);
          return {
            index: i + index,
            error: {
              title: movie.title,
              year: movie.year,
              message: error.message,
            },
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.movie) {
            enhancedMovies[result.value.index] = result.value.movie;
          } else if (result.value.error) {
            errors.push(result.value.error);
          }
        } else {
          errors.push({
            title: "Unknown",
            message: result.reason?.message || "Unknown error",
          });
        }
      });

      // Small delay between batches to be respectful to TMDB API
      if (i + batchSize < body.movies.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Filter out undefined entries and maintain order
    const results = enhancedMovies.filter((movie) => movie !== undefined);

    return jsonResponse(
      {
        success: true,
        enhanced: results.length,
        errors: errors.length,
        total: body.movies.length,
        movies: results,
        ...(errors.length > 0 && { errorDetails: errors }),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300", // 5 minutes cache for batch results
        },
      }
    );
  } catch (error) {
    console.error("Batch enhancement error:", error);
    return errorResponse(
      "Failed to enhance movies",
      "BATCH_ENHANCEMENT_ERROR",
      500,
      { message: error.message }
    );
  }
}

/**
 * Enhance a single movie with intelligent matching
 */
async function enhanceMovie(inputMovie, env) {
  if (!inputMovie.title) {
    throw new Error("Movie title is required");
  }

  // Try local database first with intelligent matching
  try {
    const localResult = await findMovieInDatabase(inputMovie, env);
    if (localResult) {
      console.log(`Database hit for: ${inputMovie.title} (${inputMovie.year})`);
      return reduceMovie(localResult);
    }
  } catch (dbError) {
    console.warn("Database search failed:", dbError.message);
  }

  // Fallback to TMDB API search with year-based matching
  return await findMovieViaTMDB(inputMovie, env);
}

/**
 * Find movie in local database with fuzzy matching
 */
async function findMovieInDatabase(inputMovie, env) {
  const searchTitle = inputMovie.title.trim();
  const searchYear = inputMovie.year;

  // Try exact title match first
  let query = `
    SELECT * FROM tmdb_movies 
    WHERE (title = ? OR original_title = ?)
  `;
  let bindings = [searchTitle, searchTitle];

  // Add year constraint if provided
  if (searchYear) {
    query += ` AND (year = ? OR year IS NULL)`;
    bindings.push(searchYear);
  }

  query += ` ORDER BY popularity DESC LIMIT 1`;

  let result = await env.MOVIES_DB.prepare(query)
    .bind(...bindings)
    .first();

  if (result) return result;

  // Try fuzzy title match
  query = `
    SELECT * FROM tmdb_movies 
    WHERE (title LIKE ? OR original_title LIKE ?)
  `;
  bindings = [`%${searchTitle}%`, `%${searchTitle}%`];

  if (searchYear) {
    query += ` AND (year = ? OR year IS NULL)`;
    bindings.push(searchYear);
  }

  query += ` ORDER BY popularity DESC LIMIT 1`;

  result = await env.MOVIES_DB.prepare(query)
    .bind(...bindings)
    .first();

  return result;
}

/**
 * Find movie via TMDB API with intelligent year matching
 */
async function findMovieViaTMDB(inputMovie, env) {
  const searchTitle = encodeURIComponent(inputMovie.title.trim());
  const searchYear = inputMovie.year;

  // Search TMDB API
  const response = await tmdbFetch(`/search/movie?query=${searchTitle}`, env);

  if (!response.ok) {
    throw new Error(`TMDB search failed: ${response.status}`);
  }

  const searchData = await response.json();

  if (!searchData.results || searchData.results.length === 0) {
    throw new Error("No movies found");
  }

  // Intelligent year-based matching
  let bestMatch = searchData.results[0]; // Default to first result

  if (searchYear) {
    // Look for exact year match
    const exactYearMatch = searchData.results.find((movie) => {
      const movieYear = toYear(movie.release_date);
      return movieYear === searchYear;
    });

    if (exactYearMatch) {
      bestMatch = exactYearMatch;
    } else {
      // Look for close year match (within 2 years)
      const closeYearMatch = searchData.results.find((movie) => {
        const movieYear = toYear(movie.release_date);
        return movieYear && Math.abs(movieYear - searchYear) <= 2;
      });

      if (closeYearMatch) {
        bestMatch = closeYearMatch;
      }
    }
  }

  return reduceMovie(bestMatch);
}

// Handle CORS preflight
export async function onRequestOptions() {
  return corsResponse();
}
