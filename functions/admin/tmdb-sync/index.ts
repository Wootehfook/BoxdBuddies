/*
 * BoxdBuddy - TMDB Full Database Sync
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

import type { Env as CacheEnv } from "../../letterboxd/cache/index.js";
type Env = CacheEnv & { ADMIN_SECRET?: string };

import { debugLog } from "../../_lib/common";

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  runtime?: number;
  status?: string;
  tagline?: string;
}

interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBCredits {
  crew: Array<{
    job: string;
    name: string;
  }>;
}

// Rate limiting - 40 requests per 10 seconds (TMDB limit)
let requestCount = 0;
let windowStart = Date.now();
const MAX_REQUESTS_PER_WINDOW = 35; // Leave some buffer
const WINDOW_MS = 10000;

async function rateLimit() {
  const now = Date.now();

  // Reset window if 10 seconds have passed
  if (now - windowStart >= WINDOW_MS) {
    requestCount = 0;
    windowStart = now;
  }

  // If we've hit the limit, wait for the window to reset
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = WINDOW_MS - (now - windowStart);
    debugLog(undefined, `⏳ Rate limit reached, waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    requestCount = 0;
    windowStart = Date.now();
  }

  requestCount++;
}

async function fetchTMDBData(url: string, apiKey: string): Promise<any> {
  await rateLimit();

  const response = await fetch(
    `https://api.themoviedb.org/3${url}${url.includes("?") ? "&" : "?"}api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

async function getMovieDetails(
  movieId: number,
  apiKey: string
): Promise<{ movie: any; director: string }> {
  // Get movie details
  const movie = await fetchTMDBData(`/movie/${movieId}`, apiKey);

  // Get credits to find director
  const credits: TMDBCredits = await fetchTMDBData(
    `/movie/${movieId}/credits`,
    apiKey
  );
  const director =
    credits.crew.find((person) => person.job === "Director")?.name || "Unknown";

  return { movie, director };
}

async function syncTMDBMoviesByID(
  database: any,
  apiKey: string,
  startMovieId: number,
  maxMovies: number = 100
): Promise<{ synced: number; errors: number; highestId: number }> {
  debugLog(
    undefined,
    `🎬 Starting TMDB incremental sync from movie ID ${startMovieId} (max ${maxMovies} movies)`
  );

  let syncedCount = 0;
  let errorCount = 0;
  let currentId = startMovieId;
  let highestProcessedId = startMovieId - 1;

  // Get genre list first
  const genresData = await fetchTMDBData("/genre/movie/list", apiKey);
  const genres: Map<number, string> = new Map();
  genresData.genres.forEach((genre: TMDBGenre) => {
    genres.set(genre.id, genre.name);
  });

  debugLog(undefined, `📚 Loaded ${genres.size} genres`);

  while (syncedCount < maxMovies) {
    try {
      debugLog(undefined, `🎯 Processing movie ID ${currentId}`);

      // Get movie details
      const { movie: movieDetails, director } = await getMovieDetails(
        currentId,
        apiKey
      );

      // Skip adult content
      if (movieDetails.adult) {
        debugLog(undefined, `⏭️ Skipping adult content: ${movieDetails.title}`);
        currentId++;
        highestProcessedId = currentId - 1;
        continue;
      }

      // Convert genre IDs to names
      const movieGenres =
        movieDetails.genre_ids
          ?.map((id: number) => genres.get(id))
          .filter(Boolean) || [];

      // Extract year from release date
      const year = movieDetails.release_date
        ? new Date(movieDetails.release_date).getFullYear()
        : null;

      // Insert or update movie in database
      await database
        .prepare(
          `
        INSERT OR REPLACE INTO tmdb_movies (
          id, title, original_title, release_date, year, overview, 
          poster_path, backdrop_path, vote_average, vote_count, 
          popularity, adult, genres, director, runtime, status, 
          tagline, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
        )
        .bind(
          movieDetails.id,
          movieDetails.title,
          movieDetails.original_title,
          movieDetails.release_date,
          year,
          movieDetails.overview,
          movieDetails.poster_path,
          movieDetails.backdrop_path,
          movieDetails.vote_average,
          movieDetails.vote_count,
          movieDetails.popularity,
          movieDetails.adult ? 1 : 0,
          JSON.stringify(movieGenres),
          director,
          movieDetails.runtime,
          movieDetails.status,
          movieDetails.tagline
        )
        .run();

      syncedCount++;
      highestProcessedId = currentId;

      if (syncedCount % 25 === 0) {
        debugLog(
          undefined,
          `✅ Synced ${syncedCount} movies so far (current ID: ${currentId})...`
        );
      }
    } catch (movieError) {
      console.error(`❌ Error syncing movie ID ${currentId}:`, movieError);
      errorCount++;

      // If movie doesn't exist (404), it might be deleted or doesn't exist yet
      if (movieError instanceof Error && movieError.message.includes("404")) {
        debugLog(
          undefined,
          `⏭️ Movie ID ${currentId} not found, continuing...`
        );
      }
    }

    currentId++;
  }

  // Update sync metadata with highest processed ID
  await database
    .prepare(
      `
    INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) 
    VALUES ('highest_movie_id_synced', ?, CURRENT_TIMESTAMP)
  `
    )
    .bind(highestProcessedId.toString())
    .run();

  debugLog(
    undefined,
    `🎉 Incremental sync complete! Synced: ${syncedCount}, Errors: ${errorCount}, Highest ID: ${highestProcessedId}`
  );
  return {
    synced: syncedCount,
    errors: errorCount,
    highestId: highestProcessedId,
  };
}

async function syncTMDBChanges(
  database: any,
  apiKey: string,
  startDate?: string
): Promise<{ synced: number; errors: number }> {
  debugLog(
    undefined,
    `🔄 Starting TMDB changes sync from ${startDate || "last 24 hours"}`
  );

  let syncedCount = 0;
  let errorCount = 0;

  try {
    // Build changes URL with optional date parameter
    let changesUrl = "/movie/changes";
    if (startDate) {
      changesUrl += `?start_date=${startDate}`;
    }

    const changesResponse = await fetchTMDBData(changesUrl, apiKey);
    const changedMovieIds = changesResponse.results.map((item: any) => item.id);

    debugLog(
      undefined,
      `📋 Found ${changedMovieIds.length} changed movies to sync`
    );

    // Get genre list
    const genresData = await fetchTMDBData("/genre/movie/list", apiKey);
    const genres: Map<number, string> = new Map();
    genresData.genres.forEach((genre: TMDBGenre) => {
      genres.set(genre.id, genre.name);
    });

    // Process changed movies in batches
    const batchSize = 10;
    for (let i = 0; i < changedMovieIds.length; i += batchSize) {
      const batch = changedMovieIds.slice(i, i + batchSize);

      for (const movieId of batch) {
        try {
          const { movie: movieDetails, director } = await getMovieDetails(
            movieId,
            apiKey
          );

          // Skip adult content
          if (movieDetails.adult) continue;

          const movieGenres =
            movieDetails.genre_ids
              ?.map((id: number) => genres.get(id))
              .filter(Boolean) || [];
          const year = movieDetails.release_date
            ? new Date(movieDetails.release_date).getFullYear()
            : null;

          await database
            .prepare(
              `
            INSERT OR REPLACE INTO tmdb_movies (
              id, title, original_title, release_date, year, overview, 
              poster_path, backdrop_path, vote_average, vote_count, 
              popularity, adult, genres, director, runtime, status, 
              tagline, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `
            )
            .bind(
              movieDetails.id,
              movieDetails.title,
              movieDetails.original_title,
              movieDetails.release_date,
              year,
              movieDetails.overview,
              movieDetails.poster_path,
              movieDetails.backdrop_path,
              movieDetails.vote_average,
              movieDetails.vote_count,
              movieDetails.popularity,
              movieDetails.adult ? 1 : 0,
              JSON.stringify(movieGenres),
              director,
              movieDetails.runtime,
              movieDetails.status,
              movieDetails.tagline
            )
            .run();

          syncedCount++;
        } catch (movieError) {
          console.error(
            `❌ Error syncing changed movie ${movieId}:`,
            movieError
          );
          errorCount++;
        }
      }
    }

    // Update last changes sync date
    await database
      .prepare(
        `
      INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) 
      VALUES ('last_changes_sync', ?, CURRENT_TIMESTAMP)
    `
      )
      .bind(new Date().toISOString())
      .run();
  } catch (error) {
    console.error("❌ Error fetching changes:", error);
    errorCount++;
  }

  debugLog(
    undefined,
    `🎉 Changes sync complete! Synced: ${syncedCount}, Errors: ${errorCount}`
  );
  return { synced: syncedCount, errors: errorCount };
}

async function syncTMDBMovies(
  database: any,
  apiKey: string,
  startPage: number = 1,
  maxPages: number = 10
): Promise<{ synced: number; errors: number }> {
  debugLog(
    undefined,
    `🎬 Starting TMDB sync from page ${startPage} to ${maxPages}`
  );

  // Limit pages per execution to avoid timeout (Cloudflare Pages has 30s limit)
  const maxPagesPerExecution = Math.min(maxPages - startPage + 1, 10);
  const actualMaxPages = startPage + maxPagesPerExecution - 1;

  debugLog(
    undefined,
    `⏰ Limited to ${maxPagesPerExecution} pages per execution (${startPage} to ${actualMaxPages}) to avoid timeout`
  );

  let syncedCount = 0;
  let errorCount = 0;

  // Get genre list first
  const genresData = await fetchTMDBData("/genre/movie/list", apiKey);
  const genres: Map<number, string> = new Map();
  genresData.genres.forEach((genre: TMDBGenre) => {
    genres.set(genre.id, genre.name);
  });

  debugLog(undefined, `📚 Loaded ${genres.size} genres`);

  for (let page = startPage; page <= actualMaxPages; page++) {
    try {
      debugLog(undefined, `📄 Processing page ${page}/${actualMaxPages}`);

      // Get popular movies for this page
      const response: TMDBResponse = await fetchTMDBData(
        `/movie/popular?page=${page}`,
        apiKey
      );

      if (!response.results || response.results.length === 0) {
        debugLog(undefined, `⚠️ No results on page ${page}, ending sync`);
        break;
      }

      // Process movies in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < response.results.length; i += batchSize) {
        const batch = response.results.slice(i, i + batchSize);

        for (const tmdbMovie of batch) {
          try {
            // Skip adult content
            if (tmdbMovie.adult) {
              continue;
            }

            // Get detailed movie information including director
            const { movie: movieDetails, director } = await getMovieDetails(
              tmdbMovie.id,
              apiKey
            );

            // Convert genre IDs to names
            const movieGenres = tmdbMovie.genre_ids
              .map((id: number) => genres.get(id))
              .filter(Boolean);

            // Extract year from release date
            const year = movieDetails.release_date
              ? new Date(movieDetails.release_date).getFullYear()
              : null;

            // Insert or update movie in database
            await database
              .prepare(
                `
              INSERT OR REPLACE INTO tmdb_movies (
                id, title, original_title, release_date, year, overview, 
                poster_path, backdrop_path, vote_average, vote_count, 
                popularity, adult, genres, director, runtime, status, 
                tagline, last_updated
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `
              )
              .bind(
                movieDetails.id,
                movieDetails.title,
                movieDetails.original_title,
                movieDetails.release_date,
                year,
                movieDetails.overview,
                movieDetails.poster_path,
                movieDetails.backdrop_path,
                movieDetails.vote_average,
                movieDetails.vote_count,
                movieDetails.popularity,
                movieDetails.adult ? 1 : 0,
                JSON.stringify(movieGenres),
                director,
                movieDetails.runtime,
                movieDetails.status,
                movieDetails.tagline
              )
              .run();

            syncedCount++;

            if (syncedCount % 50 === 0) {
              debugLog(undefined, `✅ Synced ${syncedCount} movies so far...`);
            }
          } catch (movieError) {
            console.error(
              `❌ Error syncing movie ${tmdbMovie.title}:`,
              movieError
            );
            errorCount++;
          }
        }
      }

      // If we've processed all pages available
      if (page >= response.total_pages) {
        debugLog(
          undefined,
          `🏁 Reached end of available pages (${response.total_pages})`
        );
        break;
      }
    } catch (pageError) {
      console.error(`❌ Error processing page ${page}:`, pageError);
      errorCount++;
    }
  }

  // Update sync metadata
  await database
    .prepare(
      `
    INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) 
    VALUES ('last_full_sync', ?, CURRENT_TIMESTAMP)
  `
    )
    .bind(new Date().toISOString())
    .run();

  await database
    .prepare(
      `
    INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) 
    VALUES ('total_movies_synced', ?, CURRENT_TIMESTAMP)
  `
    )
    .bind(syncedCount.toString())
    .run();

  debugLog(
    undefined,
    `🎉 Sync complete! Synced: ${syncedCount}, Errors: ${errorCount}`
  );
  return { synced: syncedCount, errors: errorCount };
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Check if TMDB API key is available
  if (!env.TMDB_API_KEY) {
    console.error("❌ TMDB_API_KEY not found in environment");
    return new Response(
      JSON.stringify({
        success: false,
        error: "TMDB API key not configured",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Basic authentication check - allow both admin-sync-token and bypass for testing
  const authHeader = request.headers.get("Authorization");
  debugLog(
    undefined,
    `🔑 Auth header received: ${authHeader ? "Bearer token present" : "No auth header"}`
  );

  if (
    !authHeader ||
    (!authHeader.includes("admin-sync-token") &&
      !authHeader.includes("test-token"))
  ) {
    console.error("❌ Invalid or missing authorization token");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid authorization token",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const {
      startPage = 1,
      maxPages = 500,
      syncType = "pages",
      startMovieId,
      maxMovies = 100,
      startDate,
    } = await request.json().catch(() => ({}));

    debugLog(undefined, `🚀 Starting TMDB sync - Type: ${syncType}`);

    let result;

    if (syncType === "movieId") {
      // Incremental sync by movie ID
      if (!startMovieId) {
        throw new Error("startMovieId is required for movieId sync type");
      }
      result = await syncTMDBMoviesByID(
        env.MOVIES_DB,
        env.TMDB_API_KEY,
        startMovieId,
        maxMovies
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `ID-based sync completed successfully`,
          synced: result.synced,
          errors: result.errors,
          highestId: result.highestId,
          syncType: "movieId",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (syncType === "changes") {
      // Incremental sync by changes
      result = await syncTMDBChanges(
        env.MOVIES_DB,
        env.TMDB_API_KEY,
        startDate
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Changes sync completed successfully`,
          synced: result.synced,
          errors: result.errors,
          syncType: "changes",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Traditional page-based sync (default)
      result = await syncTMDBMovies(
        env.MOVIES_DB,
        env.TMDB_API_KEY,
        startPage,
        maxPages
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Page-based sync completed successfully`,
          synced: result.synced,
          errors: result.errors,
          syncType: "pages",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ TMDB sync failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
