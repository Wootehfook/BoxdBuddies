/*
 * BoxdBuddy - TMDB Full Database Sync
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

import type { Env as CacheEnv } from "../../letterboxd/cache/index.js";
type Env = CacheEnv & { ADMIN_SECRET?: string; TMDB_GENRE_SENTINEL?: string };

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
  genres?: Array<{ id: number; name: string }>; // present in detail responses
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

// Note: credits shape is accessed directly from appended details response; no dedicated interface needed

// Rate limiting - 40 requests per 10 seconds (TMDB limit)
let requestCount = 0;
let windowStart = Date.now();
const MAX_REQUESTS_PER_WINDOW = 35; // Leave some buffer
const WINDOW_MS = 10000;
const TMDB_REQUEST_TIMEOUT_MS = 8000; // Abort slow TMDB requests to keep within CF time limits

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

  const ControllerCtor = (globalThis as any).AbortController as
    | (new () => { abort: (reason?: any) => void; signal: any })
    | undefined;
  const controller = ControllerCtor ? new ControllerCtor() : undefined;
  const timeout = setTimeout(
    () => controller?.abort("timeout"),
    TMDB_REQUEST_TIMEOUT_MS
  );
  let response: Response;
  try {
    response = await fetch(
      `https://api.themoviedb.org/3${url}${url.includes("?") ? "&" : "?"}api_key=${apiKey}`,
      controller ? { signal: (controller as any).signal } : undefined
    );
  } catch (e) {
    throw new Error(
      e instanceof Error && e.name === "AbortError"
        ? `TMDB API timeout after ${TMDB_REQUEST_TIMEOUT_MS}ms for ${url}`
        : `TMDB API fetch error for ${url}: ${String(e)}`
    );
  } finally {
    clearTimeout(timeout);
  }

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
  // Get movie details and credits in a single request to reduce API calls
  const movie = await fetchTMDBData(
    `/movie/${movieId}?append_to_response=credits`,
    apiKey
  );
  const director =
    movie.credits?.crew?.find((person: any) => person.job === "Director")
      ?.name || "Unknown";

  return { movie, director };
}

async function syncTMDBMoviesByID(
  database: any,
  apiKey: string,
  startMovieId: number,
  maxMovies: number = 100,
  sentinel: string = "Unknown"
): Promise<{ synced: number; errors: number; highestId: number }> {
  debugLog(
    undefined,
    `🎬 Starting TMDB incremental sync from movie ID ${startMovieId} (max ${maxMovies} movies)`
  );

  let syncedCount = 0;
  let errorCount = 0;
  let currentId = startMovieId;
  let highestProcessedId = startMovieId - 1;
  const startTime = Date.now();
  const TIME_BUDGET_MS = 25000; // Try to return within ~25s to avoid CF 30s cap

  // Get genre list first
  const genresData = await fetchTMDBData("/genre/movie/list", apiKey);
  const genres: Map<number, string> = new Map();
  genresData.genres.forEach((genre: TMDBGenre) => {
    genres.set(genre.id, genre.name);
  });

  debugLog(undefined, `📚 Loaded ${genres.size} genres`);

  while (syncedCount < maxMovies) {
    if (Date.now() - startTime > TIME_BUDGET_MS) {
      debugLog(
        undefined,
        "⏱️ Time budget reached, returning early to avoid timeout"
      );
      break;
    }
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

      // Derive genre names from movie details; prefer detailed `genres` array fallback to `genre_ids`
      let movieGenres: string[] = [];
      if (Array.isArray(movieDetails.genres) && movieDetails.genres.length) {
        movieGenres = movieDetails.genres
          .map((g: { id: number; name: string }) => g?.name)
          .filter(Boolean);
      } else if (
        Array.isArray(movieDetails.genre_ids) &&
        movieDetails.genre_ids.length
      ) {
        movieGenres = movieDetails.genre_ids
          .map((id: number) => genres.get(id))
          .filter(Boolean) as string[];
      }

      // If no genres were derived, write a sentinel so downstream processes don't repeatedly treat
      // this row as missing. Use ['Unknown'] to indicate attempted lookup with no TMDB match.
      const finalGenres =
        Array.isArray(movieGenres) && movieGenres.length > 0
          ? movieGenres
          : [sentinel];

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
          JSON.stringify(finalGenres),
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
        // Treat missing IDs as processed for purposes of advancing the resume pointer,
        // so subsequent runs do not repeatedly retry the same gap.
        highestProcessedId = currentId;
      } else if (
        movieError instanceof Error &&
        movieError.message.includes("timeout")
      ) {
        debugLog(
          undefined,
          `⏱️ TMDB request timeout for movie ID ${currentId}, skipping`
        );
        highestProcessedId = currentId;
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
  startDate?: string,
  sentinel: string = "Unknown"
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

          // Derive genre names from detailed response
          let movieGenres: string[] = [];
          if (
            Array.isArray(movieDetails.genres) &&
            movieDetails.genres.length
          ) {
            movieGenres = movieDetails.genres
              .map((g: { id: number; name: string }) => g?.name)
              .filter(Boolean);
          } else if (
            Array.isArray(movieDetails.genre_ids) &&
            movieDetails.genre_ids.length
          ) {
            movieGenres = movieDetails.genre_ids
              .map((id: number) => genres.get(id))
              .filter(Boolean) as string[];
          }
          const finalGenres =
            Array.isArray(movieGenres) && movieGenres.length > 0
              ? movieGenres
              : [sentinel];
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
              JSON.stringify(finalGenres),
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
  maxPages: number = 10,
  sentinel: string = "Unknown"
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
  const startTime = Date.now();
  const TIME_BUDGET_MS = 25000; // Stay below CF 30s cap
  let timeUp = false;

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

      // Time budget check
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        debugLog(
          undefined,
          "⏱️ Time budget reached during page sync; returning early"
        );
        timeUp = true;
        break;
      }

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
            if (Date.now() - startTime > TIME_BUDGET_MS) {
              debugLog(
                undefined,
                "⏱️ Time budget reached inside batch; stopping"
              );
              timeUp = true;
              break;
            }
            // Skip adult content
            if (tmdbMovie.adult) {
              continue;
            }

            // Get detailed movie information including director
            const { movie: movieDetails, director } = await getMovieDetails(
              tmdbMovie.id,
              apiKey
            );

            // Convert to genre names; prefer details.genres, fallback to list's genre_ids
            let movieGenres: string[] = [];
            if (
              Array.isArray(movieDetails.genres) &&
              movieDetails.genres.length
            ) {
              movieGenres = movieDetails.genres
                .map((g: { id: number; name: string }) => g?.name)
                .filter(Boolean);
            } else if (
              Array.isArray(tmdbMovie.genre_ids) &&
              tmdbMovie.genre_ids.length
            ) {
              movieGenres = tmdbMovie.genre_ids
                .map((id: number) => genres.get(id))
                .filter(Boolean) as string[];
            }

            const finalGenres =
              Array.isArray(movieGenres) && movieGenres.length > 0
                ? movieGenres
                : [sentinel];

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
                JSON.stringify(finalGenres),
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
        if (timeUp) break;
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
    if (timeUp) break;
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

// Backfill genres for existing movies
async function backfillGenres(
  database: any,
  apiKey: string,
  options?: { limit?: number; mode?: "missing" | "all" },
  sentinel: string = "Unknown"
): Promise<{ updated: number; errors: number }> {
  const userLimit = options?.limit;
  const mode = options?.mode ?? "missing";
  const BATCH_SIZE = 30;
  const TIME_BUDGET_MS = 25000; // keep under CF's 30s cap
  const startTime = Date.now();

  // Load genre dictionary once for fallback mapping
  const genres: Map<number, string> = await (async () => {
    const gData = await fetchTMDBData("/genre/movie/list", apiKey);
    const map = new Map<number, string>();
    gData.genres.forEach((g: TMDBGenre) => map.set(g.id, g.name));
    return map;
  })();

  // Consider NULL/empty/empty-array/'null' as missing. Also treat any genres value
  // that contains no alphabetic characters (e.g. numeric garbage like '123' or '["123"]')
  // as missing so it will be re-fetched from TMDB.
  // SQLite GLOB supports basic character classes; 'NOT GLOB "*[A-Za-z]*"' matches strings
  // without any ASCII letters.
  const missingCond =
    "(genres IS NULL OR TRIM(genres) = '' OR genres = '[]' OR genres = 'null' OR (genres NOT GLOB '*[A-Za-z]*'))";
  const baseWhere = mode === "missing" ? missingCond : "1=1";

  let updated = 0;
  let errors = 0;
  let lastId = 0;
  let processed = 0;

  const selectBatch = async (afterId: number, size: number) => {
    const res = await database
      .prepare(
        `SELECT id FROM tmdb_movies WHERE ${baseWhere} AND id > ? ORDER BY id LIMIT ?`
      )
      .bind(afterId, size)
      .all();
    return ((res?.results as any[]) || []) as Array<{ id: number }>;
  };

  const fetchNames = async (movieId: number): Promise<string[]> => {
    try {
      const { movie: details } = await getMovieDetails(movieId, apiKey);
      if (Array.isArray(details.genres) && details.genres.length) {
        return details.genres
          .map((g: { id: number; name: string }) => g?.name)
          .filter(Boolean);
      }
      if (Array.isArray(details.genre_ids) && details.genre_ids.length) {
        return details.genre_ids
          .map((id: number) => genres.get(id))
          .filter(Boolean) as string[];
      }
      return [];
    } catch (e) {
      // If movie not found or TMDB request fails for this movie, return empty to signal no genres.
      // The caller will store ['Unknown'] for empty genre results so the row isn't retried repeatedly.
      debugLog(
        undefined,
        `⚠️ fetchNames failed for movie ${movieId}: ${String(e)}`
      );
      return [];
    }
  };

  const updateRow = async (movieId: number, names: string[]) => {
    await database
      .prepare(
        `UPDATE tmdb_movies SET genres = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(JSON.stringify(names), movieId)
      .run();
  };

  const withinBudget = () => Date.now() - startTime <= TIME_BUDGET_MS;
  const limitRemaining = () =>
    typeof userLimit === "number" && userLimit > 0
      ? Math.max(0, userLimit - processed)
      : Number.POSITIVE_INFINITY;

  while (withinBudget()) {
    const remainingNow = limitRemaining();
    if (remainingNow === 0) break;
    const toFetch = Number.isFinite(remainingNow)
      ? Math.min(BATCH_SIZE, remainingNow)
      : BATCH_SIZE;
    const rows = await selectBatch(lastId, toFetch);
    if (!rows.length) break;

    for (const row of rows) {
      if (!withinBudget()) break;
      try {
        const names = await fetchNames(row.id);
        // If no genres found, write a sentinel value so the row won't be repeatedly selected as "missing".
        // Use sentinel from env (default "Unknown") to indicate attempted lookup with no TMDB match or an error.
        const finalNames =
          Array.isArray(names) && names.length > 0 ? names : [sentinel];
        await updateRow(row.id, finalNames);
        updated++;
      } catch (e) {
        console.error(`Failed to backfill genres for movie ${row.id}:`, e);
        errors++;
      } finally {
        processed++;
        lastId = row.id;
      }
      if (Number.isFinite(remainingNow) && processed >= (userLimit ?? 0)) break;
    }
  }

  return { updated, errors };
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
      limit,
      mode,
    } = await request.json().catch(() => ({}));

    debugLog(undefined, `🚀 Starting TMDB sync - Type: ${syncType}`);

    let result;

    if (syncType === "movieId") {
      // Incremental sync by movie ID
      if (!startMovieId) {
        throw new Error("startMovieId is required for movieId sync type");
      }
      const sentinelVal = env.TMDB_GENRE_SENTINEL || "Unknown";
      result = await syncTMDBMoviesByID(
        env.MOVIES_DB,
        env.TMDB_API_KEY,
        startMovieId,
        maxMovies,
        sentinelVal
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
      const sentinelVal = env.TMDB_GENRE_SENTINEL || "Unknown";
      result = await syncTMDBChanges(
        env.MOVIES_DB,
        env.TMDB_API_KEY,
        startDate,
        sentinelVal
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
    } else if (syncType === "backfillGenres") {
      const result = await backfillGenres(env.MOVIES_DB, env.TMDB_API_KEY, {
        limit,
        mode,
      });
      return new Response(
        JSON.stringify({
          success: true,
          message: `Backfill completed`,
          updated: result.updated,
          errors: result.errors,
          syncType: "backfillGenres",
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Traditional page-based sync (default)
      const sentinelVal = env.TMDB_GENRE_SENTINEL || "Unknown";
      result = await syncTMDBMovies(
        env.MOVIES_DB,
        env.TMDB_API_KEY,
        startPage,
        maxPages,
        sentinelVal
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
