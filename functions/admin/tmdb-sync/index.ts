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

async function loadGenresMap(apiKey: string): Promise<Map<number, string>> {
  const genresData = await fetchTMDBData("/genre/movie/list", apiKey);
  const genres: Map<number, string> = new Map();
  genresData.genres.forEach((genre: TMDBGenre) => {
    genres.set(genre.id, genre.name);
  });
  return genres;
}

function deriveGenres(
  movieDetails: TMDBMovie,
  fallbackGenreIds: number[] | undefined,
  genres: Map<number, string>,
  sentinel: string
): string[] {
  let movieGenres: string[] = [];
  if (Array.isArray(movieDetails.genres) && movieDetails.genres.length) {
    movieGenres = movieDetails.genres
      .map((g: { id: number; name: string }) => g?.name)
      .filter(Boolean);
  } else if (Array.isArray(fallbackGenreIds) && fallbackGenreIds.length) {
    movieGenres = fallbackGenreIds
      .map((id: number) => genres.get(id))
      .filter(Boolean) as string[];
  }

  return Array.isArray(movieGenres) && movieGenres.length > 0
    ? movieGenres
    : [sentinel];
}

function getReleaseYear(releaseDate?: string | null): number | null {
  return releaseDate ? new Date(releaseDate).getFullYear() : null;
}

async function upsertMovie(
  database: any,
  movieDetails: TMDBMovie,
  director: string,
  finalGenres: string[],
  year: number | null
): Promise<void> {
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
}

async function updateSyncMetadata(
  database: any,
  key: string,
  value: string
): Promise<void> {
  await database
    .prepare(
      `
      INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `
    )
    .bind(key, value)
    .run();
}

function isTimeBudgetExceeded(startTime: number, budgetMs: number): boolean {
  return Date.now() - startTime > budgetMs;
}

async function fetchPopularPage(
  apiKey: string,
  page: number
): Promise<TMDBResponse> {
  return fetchTMDBData(`/movie/popular?page=${page}`, apiKey);
}

async function fetchDiscoverPage(
  apiKey: string,
  page: number,
  releaseYearStart: string,
  releaseYearEnd: string
): Promise<TMDBResponse> {
  const queryParams = [
    `page=${page}`,
    `primary_release_date.gte=${releaseYearStart}`,
    `primary_release_date.lte=${releaseYearEnd}`,
    `sort_by=primary_release_date.desc`,
  ].join("&");
  return fetchTMDBData(`/discover/movie?${queryParams}`, apiKey);
}

async function processPopularResults(options: {
  database: any;
  apiKey: string;
  results: TMDBMovie[];
  genres: Map<number, string>;
  sentinel: string;
  startTime: number;
  timeBudgetMs: number;
  onSynced: () => void;
  onError: (movieTitle: string, error: unknown) => void;
}): Promise<{ synced: number; errors: number; timeUp: boolean }> {
  const {
    database,
    apiKey,
    results,
    genres,
    sentinel,
    startTime,
    timeBudgetMs,
    onSynced,
    onError,
  } = options;
  let pageSynced = 0;
  let pageErrors = 0;
  const batchSize = 10;

  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);

    for (const tmdbMovie of batch) {
      try {
        if (isTimeBudgetExceeded(startTime, timeBudgetMs)) {
          debugLog(undefined, "⏱️ Time budget reached inside batch; stopping");
          return { synced: pageSynced, errors: pageErrors, timeUp: true };
        }
        if (tmdbMovie.adult) continue;

        const { movie: movieDetails, director } = await getMovieDetails(
          tmdbMovie.id,
          apiKey
        );
        const finalGenres = deriveGenres(
          movieDetails,
          tmdbMovie.genre_ids,
          genres,
          sentinel
        );
        const year = getReleaseYear(movieDetails.release_date);
        await upsertMovie(database, movieDetails, director, finalGenres, year);

        pageSynced++;
        onSynced();
      } catch (movieError) {
        onError(tmdbMovie.title, movieError);
        pageErrors++;
      }
    }
  }

  return { synced: pageSynced, errors: pageErrors, timeUp: false };
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
  const genres = await loadGenresMap(apiKey);

  debugLog(undefined, `📚 Loaded ${genres.size} genres`);

  while (syncedCount < maxMovies) {
    if (isTimeBudgetExceeded(startTime, TIME_BUDGET_MS)) {
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

      const finalGenres = deriveGenres(
        movieDetails,
        movieDetails.genre_ids,
        genres,
        sentinel
      );
      const year = getReleaseYear(movieDetails.release_date);
      await upsertMovie(database, movieDetails, director, finalGenres, year);

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
  await updateSyncMetadata(
    database,
    "highest_movie_id_synced",
    highestProcessedId.toString()
  );

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
    const changesUrl = startDate
      ? `/movie/changes?start_date=${startDate}`
      : "/movie/changes";

    const changesResponse = await fetchTMDBData(changesUrl, apiKey);
    const changedMovieIds = changesResponse.results.map((item: any) => item.id);

    debugLog(
      undefined,
      `📋 Found ${changedMovieIds.length} changed movies to sync`
    );

    // Get genre list
    const genres = await loadGenresMap(apiKey);

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

          const finalGenres = deriveGenres(
            movieDetails,
            movieDetails.genre_ids,
            genres,
            sentinel
          );
          const year = getReleaseYear(movieDetails.release_date);
          await upsertMovie(
            database,
            movieDetails,
            director,
            finalGenres,
            year
          );

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
    await updateSyncMetadata(
      database,
      "last_changes_sync",
      new Date().toISOString()
    );
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

  const genres = await loadGenresMap(apiKey);

  debugLog(undefined, `📚 Loaded ${genres.size} genres`);

  const syncPopularPage = async (page: number) => {
    debugLog(undefined, `📄 Processing page ${page}/${actualMaxPages}`);
    if (isTimeBudgetExceeded(startTime, TIME_BUDGET_MS)) {
      debugLog(
        undefined,
        "⏱️ Time budget reached during page sync; returning early"
      );
      return {
        synced: 0,
        errors: 0,
        timeUp: true,
        totalPages: 0,
        hasResults: false,
      };
    }

    const response = await fetchPopularPage(apiKey, page);
    if (!response.results || response.results.length === 0) {
      debugLog(undefined, `⚠️ No results on page ${page}, ending sync`);
      return {
        synced: 0,
        errors: 0,
        timeUp: false,
        totalPages: response.total_pages,
        hasResults: false,
      };
    }

    const processResult = await processPopularResults({
      database,
      apiKey,
      results: response.results,
      genres,
      sentinel,
      startTime,
      timeBudgetMs: TIME_BUDGET_MS,
      onSynced: () => {
        syncedCount++;
        if (syncedCount % 50 === 0) {
          debugLog(undefined, `✅ Synced ${syncedCount} movies so far...`);
        }
      },
      onError: (movieTitle, movieError) => {
        console.error(`❌ Error syncing movie ${movieTitle}:`, movieError);
        errorCount++;
      },
    });

    return {
      synced: processResult.synced,
      errors: processResult.errors,
      timeUp: processResult.timeUp,
      totalPages: response.total_pages,
      hasResults: true,
    };
  };

  for (let page = startPage; page <= actualMaxPages; page++) {
    try {
      const pageResult = await syncPopularPage(page);
      if (!pageResult.hasResults) break;
      if (page >= pageResult.totalPages) {
        debugLog(
          undefined,
          `🏁 Reached end of available pages (${pageResult.totalPages})`
        );
        break;
      }
      if (pageResult.timeUp) break;
    } catch (pageError) {
      console.error(`❌ Error processing page ${page}:`, pageError);
      errorCount++;
    }
  }

  // Update sync metadata
  await updateSyncMetadata(
    database,
    "last_full_sync",
    new Date().toISOString()
  );
  await updateSyncMetadata(
    database,
    "total_movies_synced",
    syncedCount.toString()
  );

  debugLog(
    undefined,
    `🎉 Sync complete! Synced: ${syncedCount}, Errors: ${errorCount}`
  );
  return { synced: syncedCount, errors: errorCount };
}

async function syncTMDBCurrentYear(
  database: any,
  apiKey: string,
  releaseYearStart: string,
  releaseYearEnd: string,
  maxPages: number = 10,
  sentinel: string = "Unknown"
): Promise<{ synced: number; errors: number }> {
  debugLog(
    undefined,
    `📅 Starting TMDB current-year sync from ${releaseYearStart} to ${releaseYearEnd} (max ${maxPages} pages)`
  );

  let syncedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  const TIME_BUDGET_MS = 25000;

  const genres = await loadGenresMap(apiKey);
  debugLog(undefined, `📚 Loaded ${genres.size} genres`);

  for (let page = 1; page <= maxPages; page++) {
    if (isTimeBudgetExceeded(startTime, TIME_BUDGET_MS)) {
      debugLog(undefined, "⏱️ Time budget reached during current-year sync");
      break;
    }

    try {
      const response = await fetchDiscoverPage(
        apiKey,
        page,
        releaseYearStart,
        releaseYearEnd
      );

      if (!response.results || response.results.length === 0) {
        debugLog(undefined, `⚠️ No results on page ${page}, ending sync`);
        break;
      }

      const processResult = await processPopularResults({
        database,
        apiKey,
        results: response.results,
        genres,
        sentinel,
        startTime,
        timeBudgetMs: TIME_BUDGET_MS,
        onSynced: () => {
          syncedCount++;
        },
        onError: (movieTitle, movieError) => {
          console.error(`❌ Error syncing movie ${movieTitle}:`, movieError);
          errorCount++;
        },
      });

      if (processResult.timeUp) break;
      if (page >= response.total_pages) break;
    } catch (pageError) {
      console.error(`❌ Error processing discover page ${page}:`, pageError);
      errorCount++;
    }
  }

  debugLog(
    undefined,
    `🎉 Current-year sync complete! Synced: ${syncedCount}, Errors: ${errorCount}`
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

  const processRow = async (row: { id: number }) => {
    try {
      const names = await fetchNames(row.id);
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
  };

  const processBatch = async (rows: Array<{ id: number }>) => {
    for (const row of rows) {
      if (!withinBudget()) break;
      await processRow(row);
      if (Number.isFinite(limitRemaining()) && processed >= (userLimit ?? 0)) {
        break;
      }
    }
  };

  while (withinBudget()) {
    const remainingNow = limitRemaining();
    if (remainingNow === 0) break;
    const toFetch = Number.isFinite(remainingNow)
      ? Math.min(BATCH_SIZE, remainingNow)
      : BATCH_SIZE;
    const rows = await selectBatch(lastId, toFetch);
    if (!rows.length) break;
    await processBatch(rows);
  }

  return { updated, errors };
}

type SyncRequest = {
  startPage?: number;
  maxPages?: number;
  syncType?: string;
  startMovieId?: number;
  maxMovies?: number;
  startDate?: string;
  releaseYearStart?: string;
  releaseYearEnd?: string;
  limit?: number;
  mode?: "missing" | "all";
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(authHeader: string | null, env: Env): boolean {
  if (!env.ADMIN_SECRET) {
    console.error("❌ ADMIN_SECRET not configured");
    return false;
  }

  const rawHeader = (authHeader || "").trim();
  if (!rawHeader) return false;

  const token = rawHeader.toLowerCase().startsWith("bearer ")
    ? rawHeader.slice(7).trim()
    : rawHeader;

  return token === env.ADMIN_SECRET;
}

async function parseSyncRequest(request: Request): Promise<SyncRequest> {
  return (await request.json().catch(() => ({}))) as SyncRequest;
}

function getSentinel(env: Env): string {
  return env.TMDB_GENRE_SENTINEL || "Unknown";
}

async function handleMovieIdSync(
  body: SyncRequest,
  env: Env
): Promise<Response> {
  if (!body.startMovieId) {
    throw new Error("startMovieId is required for movieId sync type");
  }

  const result = await syncTMDBMoviesByID(
    env.MOVIES_DB,
    env.TMDB_API_KEY,
    body.startMovieId,
    body.maxMovies ?? 100,
    getSentinel(env)
  );

  return jsonResponse(200, {
    success: true,
    message: "ID-based sync completed successfully",
    synced: result.synced,
    errors: result.errors,
    highestId: result.highestId,
    syncType: "movieId",
    timestamp: new Date().toISOString(),
  });
}

async function handleChangesSync(
  body: SyncRequest,
  env: Env
): Promise<Response> {
  const result = await syncTMDBChanges(
    env.MOVIES_DB,
    env.TMDB_API_KEY,
    body.startDate,
    getSentinel(env)
  );

  return jsonResponse(200, {
    success: true,
    message: "Changes sync completed successfully",
    synced: result.synced,
    errors: result.errors,
    syncType: "changes",
    timestamp: new Date().toISOString(),
  });
}

async function handleBackfillGenresSync(
  body: SyncRequest,
  env: Env
): Promise<Response> {
  const result = await backfillGenres(env.MOVIES_DB, env.TMDB_API_KEY, {
    limit: body.limit,
    mode: body.mode,
  });

  return jsonResponse(200, {
    success: true,
    message: "Backfill completed",
    updated: result.updated,
    errors: result.errors,
    syncType: "backfillGenres",
    timestamp: new Date().toISOString(),
  });
}

function assertCurrentYearWindow(body: SyncRequest): {
  releaseYearStart: string;
  releaseYearEnd: string;
} {
  if (!body.releaseYearStart) {
    throw new Error("releaseYearStart is required for current_year sync");
  }
  if (!body.releaseYearEnd) {
    throw new Error("releaseYearEnd is required for current_year sync");
  }

  return {
    releaseYearStart: body.releaseYearStart,
    releaseYearEnd: body.releaseYearEnd,
  };
}

async function handleCurrentYearSync(
  body: SyncRequest,
  env: Env
): Promise<Response> {
  const window = assertCurrentYearWindow(body);
  const result = await syncTMDBCurrentYear(
    env.MOVIES_DB,
    env.TMDB_API_KEY,
    window.releaseYearStart,
    window.releaseYearEnd,
    body.maxPages ?? 10,
    getSentinel(env)
  );

  return jsonResponse(200, {
    success: true,
    message: "Current-year sync completed successfully",
    synced: result.synced,
    errors: result.errors,
    syncType: "current_year",
    releaseYearStart: window.releaseYearStart,
    releaseYearEnd: window.releaseYearEnd,
    timestamp: new Date().toISOString(),
  });
}

async function handlePageSync(body: SyncRequest, env: Env): Promise<Response> {
  const result = await syncTMDBMovies(
    env.MOVIES_DB,
    env.TMDB_API_KEY,
    body.startPage ?? 1,
    body.maxPages ?? 500,
    getSentinel(env)
  );

  return jsonResponse(200, {
    success: true,
    message: "Page-based sync completed successfully",
    synced: result.synced,
    errors: result.errors,
    syncType: "pages",
    timestamp: new Date().toISOString(),
  });
}

function getSyncHandler(
  syncType: string
): (body: SyncRequest, env: Env) => Promise<Response> {
  const handlers: Record<
    string,
    (body: SyncRequest, env: Env) => Promise<Response>
  > = {
    movieId: handleMovieIdSync,
    changes: handleChangesSync,
    backfillGenres: handleBackfillGenresSync,
    current_year: handleCurrentYearSync,
    pages: handlePageSync,
  };

  return handlers[syncType] ?? handlePageSync;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Check if TMDB API key is available
  if (!env.TMDB_API_KEY) {
    console.error("❌ TMDB_API_KEY not found in environment");
    return jsonResponse(500, {
      success: false,
      error: "TMDB API key not configured",
      timestamp: new Date().toISOString(),
    });
  }

  // Authentication check — requires env.ADMIN_SECRET
  const authHeader = request.headers.get("Authorization");
  debugLog(
    env,
    `🔑 Auth header received: ${authHeader ? "Bearer token present" : "No auth header"}`
  );

  if (!isAuthorized(authHeader, env)) {
    console.error("❌ Invalid or missing authorization token");
    return jsonResponse(401, {
      success: false,
      error: "Invalid authorization token",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const body = await parseSyncRequest(request);
    const syncType = body.syncType ?? "pages";
    debugLog(undefined, `🚀 Starting TMDB sync - Type: ${syncType}`);
    const handler = getSyncHandler(syncType);
    return await handler(body, env);
  } catch (error) {
    console.error("❌ TMDB sync failed:", error);
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
