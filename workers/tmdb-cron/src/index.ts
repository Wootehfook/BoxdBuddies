/*
 * BoxdBuddy - TMDB Cron Sync Worker
 * Copyright (C) 2025 Wootehfook
 * License: AGPL-3.0-or-later
 * AI Generated: GitHub Copilot - 2026-02-11T01:58:00Z
 *
 * Cloudflare Worker that performs daily TMDB database synchronization:
 * - Delta sync: Re-syncs movies that changed on TMDB since last run
 * - Incremental ID sync: Discovers new movies by walking forward from 
 *   highest synced movie ID
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

interface Env {
  MOVIES_DB: D1Database;
  TMDB_API_KEY: string;
  ADMIN_SECRET?: string;
  DEBUG?: string;
}

interface TMDBMovieDetail {
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
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  status?: string;
  tagline?: string;
  credits?: {
    crew: Array<{ job: string; name: string }>;
  };
}

interface TMDBChangesResponse {
  results: Array<{ id: number }>;
  page: number;
  total_pages: number;
  total_results: number;
}

interface SyncResult {
  success: boolean;
  synced: number;
  errors: number;
  skipped: number;
  message: string;
}

// ============================================================================
// Constants
// ============================================================================

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const USER_AGENT = "Boxdbud.io/1.1.0";
const MAX_REQUESTS_PER_WINDOW = 35; // TMDB allows 40/10s, leave buffer
const WINDOW_MS = 10000; // 10 seconds
const TIME_BUDGET_MS = 25000; // 25 seconds (stay under CF 30s limit)
const RATE_LIMIT_RETRY_MS = 2000; // Wait 2s on 429 errors

// Rate limiter state (module-level for persistence across requests)
let requestCount = 0;
let windowStart = Date.now();

// ============================================================================
// Rate Limiter
// ============================================================================

/**
 * Sliding window rate limiter for TMDB API requests.
 * Ensures we stay under 35 requests per 10 seconds.
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();

  // Reset window if 10 seconds have passed
  if (now - windowStart >= WINDOW_MS) {
    requestCount = 0;
    windowStart = now;
  }

  // If we've hit the limit, wait for the window to reset
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = WINDOW_MS - (now - windowStart);
    console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    requestCount = 0;
    windowStart = Date.now();
  }

  requestCount++;
}

// ============================================================================
// TMDB API Helpers
// ============================================================================

/**
 * Make a rate-limited GET request to TMDB API v3.
 * Uses api_key query parameter for authentication.
 */
async function tmdbGet<T>(path: string, apiKey: string): Promise<T> {
  await rateLimit();

  const url = `${TMDB_BASE_URL}${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    if (response.status === 429) {
      throw new Error("RATE_LIMITED");
    }
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch movie details with credits appended, extract director.
 * Returns null if movie doesn't exist (404) or is adult content.
 */
async function getMovieWithDirector(
  movieId: number,
  apiKey: string
): Promise<{ movie: TMDBMovieDetail; director: string } | null> {
  try {
    const movie = await tmdbGet<TMDBMovieDetail>(
      `/movie/${movieId}?append_to_response=credits`,
      apiKey
    );

    // Skip adult content
    if (movie.adult) {
      return null;
    }

    const director =
      movie.credits?.crew?.find((person) => person.job === "Director")
        ?.name || "Unknown";

    return { movie, director };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NOT_FOUND" || error.message === "RATE_LIMITED")
    ) {
      throw error;
    }
    throw error;
  }
}

/**
 * Extract genre names from movie detail and return as JSON string.
 */
function genresJson(movie: TMDBMovieDetail): string {
  const names = Array.isArray(movie.genres)
    ? movie.genres
        .map((g) => g?.name)
        .filter((n): n is string => Boolean(n))
    : [];
  return JSON.stringify(names.length > 0 ? names : ["Unknown"]);
}

/**
 * Extract 4-digit release year from date string.
 */
function releaseYear(releaseDate?: string | null): number | null {
  return releaseDate ? new Date(releaseDate).getFullYear() : null;
}

/**
 * Check if time budget has been exceeded.
 */
function timeUp(startTime: number): boolean {
  return Date.now() - startTime > TIME_BUDGET_MS;
}

// ============================================================================
// D1 Database Helpers
// ============================================================================

/**
 * Upsert a movie into the tmdb_movies table.
 */
async function upsertMovie(
  db: D1Database,
  movie: TMDBMovieDetail,
  director: string,
  genres: string,
  year: number | null
): Promise<void> {
  await db
    .prepare(
      `
      INSERT OR REPLACE INTO tmdb_movies (
        id, title, original_title, release_date, year, overview,
        poster_path, backdrop_path, vote_average, vote_count,
        popularity, adult, genres, director, runtime, status,
        tagline, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        CURRENT_TIMESTAMP)
    `
    )
    .bind(
      movie.id,
      movie.title,
      movie.original_title,
      movie.release_date,
      year,
      movie.overview,
      movie.poster_path,
      movie.backdrop_path,
      movie.vote_average,
      movie.vote_count,
      movie.popularity,
      movie.adult ? 1 : 0,
      genres,
      director,
      movie.runtime,
      movie.status,
      movie.tagline
    )
    .run();
}

/**
 * Get the highest movie ID we've synced so far.
 */
async function getHighestSyncedId(db: D1Database): Promise<number> {
  const result = await db
    .prepare("SELECT value FROM sync_metadata WHERE key = ?")
    .bind("highest_movie_id_synced")
    .first<{ value: string }>();

  return result?.value ? Number.parseInt(result.value, 10) : 0;
}

/**
 * Persist the highest movie ID we've synced.
 */
async function setHighestSyncedId(
  db: D1Database,
  id: number
): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`
    )
    .bind("highest_movie_id_synced", id.toString())
    .run();
}

/**
 * Get the last delta sync timestamp, default to 24 hours ago.
 */
async function getLastDeltaSync(db: D1Database): Promise<string> {
  const result = await db
    .prepare("SELECT value FROM sync_metadata WHERE key = ?")
    .bind("last_delta_sync")
    .first<{ value: string }>();

  if (result?.value) {
    return result.value;
  }

  // Default to 24 hours ago
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Persist the current timestamp as last delta sync time.
 */
async function setLastDeltaSync(db: D1Database): Promise<void> {
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  await db
    .prepare(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`
    )
    .bind("last_delta_sync", now)
    .run();
}

// ============================================================================
// Sync Strategy: Incremental ID Walk
// ============================================================================

/**
 * Process a single movie ID during incremental sync.
 * Returns: "synced", "skipped", "not_found", "rate_limited", or "error"
 */
async function processSingleMovie(
  db: D1Database,
  apiKey: string,
  movieId: number
): Promise<"synced" | "skipped" | "not_found" | "rate_limited" | "error"> {
  try {
    const result = await getMovieWithDirector(movieId, apiKey);

    if (result === null) {
      // Adult content, skip
      return "skipped";
    }

    const { movie, director } = result;
    const genres = genresJson(movie);
    const year = releaseYear(movie.release_date);

    await upsertMovie(db, movie, director, genres, year);
    await setHighestSyncedId(db, movieId);

    return "synced";
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return "not_found";
      } else if (error.message === "RATE_LIMITED") {
        return "rate_limited";
      }
    }
    console.error(`❌ Error syncing movie ID ${movieId}:`, error);
    return "error";
  }
}

/**
 * Incremental ID sync: walk forward from highest synced movie ID,
 * discovering new movies. Stops at first NOT_FOUND or when time is up.
 */
async function incrementalIdSync(
  db: D1Database,
  apiKey: string,
  maxMovies = 80
): Promise<SyncResult> {
  const startTime = Date.now();
  let synced = 0;
  let errors = 0;
  let skipped = 0;

  try {
    let currentId = await getHighestSyncedId(db);
    console.log(
      `🔄 Starting incremental sync from movie ID ${currentId}...`
    );

    let processedCount = 0;
    while (processedCount < maxMovies && !timeUp(startTime)) {
      currentId++;

      const result = await processSingleMovie(db, apiKey, currentId);

      if (result === "not_found") {
        console.log(`✅ Reached end of TMDB catalog at ID ${currentId}`);
        break;
      } else if (result === "rate_limited") {
        console.log(`⏳ Rate limited at ID ${currentId}, waiting...`);
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT_RETRY_MS)
        );
        // Don't increment processedCount, retry this ID
        currentId--;
        continue;
      } else if (result === "synced") {
        synced++;
        processedCount++;
      } else if (result === "skipped") {
        skipped++;
        processedCount++;
      } else if (result === "error") {
        errors++;
        processedCount++;
      }
    }

    if (timeUp(startTime)) {
      console.log("⏱️ Time budget reached for incremental sync");
    }

    const elapsed = Date.now() - startTime;
    const message = `Incremental sync: ${synced} synced, ${skipped} skipped, ${errors} errors in ${elapsed}ms`;
    console.log(`✅ ${message}`);

    return { success: true, synced, errors, skipped, message };
  } catch (error) {
    const message = `Incremental sync failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`❌ ${message}`);
    return { success: false, synced, errors, skipped, message };
  }
}

// ============================================================================
// Sync Strategy: Delta Changes
// ============================================================================

/**
 * Process a single movie ID during delta sync.
 * Returns: "synced", "skipped", "not_found", "rate_limited", or "error"
 */
async function processDeltaMovie(
  db: D1Database,
  apiKey: string,
  movieId: number
): Promise<"synced" | "skipped" | "not_found" | "rate_limited" | "error"> {
  try {
    const result = await getMovieWithDirector(movieId, apiKey);

    if (result === null) {
      // Adult content, skip
      return "skipped";
    }

    const { movie, director } = result;
    const genres = genresJson(movie);
    const year = releaseYear(movie.release_date);

    await upsertMovie(db, movie, director, genres, year);
    return "synced";
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return "not_found";
      } else if (error.message === "RATE_LIMITED") {
        return "rate_limited";
      }
    }
    console.error(`❌ Error syncing movie ID ${movieId}:`, error);
    return "error";
  }
}

/**
 * Delta sync: fetch movies that changed on TMDB since last sync
 * and re-upsert them to catch metadata updates.
 */
async function deltaSyncChanges(
  db: D1Database,
  apiKey: string
): Promise<SyncResult> {
  const startTime = Date.now();
  let synced = 0;
  let errors = 0;
  let skipped = 0;

  try {
    const sinceDate = await getLastDeltaSync(db);
    console.log(
      `🔄 Starting delta sync for changes since ${sinceDate}...`
    );

    const changesData = await tmdbGet<TMDBChangesResponse>(
      `/movie/changes?start_date=${sinceDate}`,
      apiKey
    );

    const changedIds = changesData.results?.map((r) => r.id) || [];
    console.log(`📋 Found ${changedIds.length} changed movies`);

    for (const movieId of changedIds) {
      if (timeUp(startTime)) {
        console.log("⏱️ Time budget reached for delta sync");
        break;
      }

      const result = await processDeltaMovie(db, apiKey, movieId);

      if (result === "synced") {
        synced++;
      } else if (result === "skipped" || result === "not_found") {
        skipped++;
      } else if (result === "rate_limited") {
        console.log(`⏳ Rate limited at ID ${movieId}, waiting...`);
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT_RETRY_MS)
        );
        // Note: We don't retry in delta sync, just move to next
      } else if (result === "error") {
        errors++;
      }
    }

    // Update the last delta sync timestamp
    await setLastDeltaSync(db);

    const elapsed = Date.now() - startTime;
    const message = `Delta sync: ${synced} synced, ${skipped} skipped, ${errors} errors in ${elapsed}ms`;
    console.log(`✅ ${message}`);

    return { success: true, synced, errors, skipped, message };
  } catch (error) {
    const message = `Delta sync failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`❌ ${message}`);
    return { success: false, synced, errors, skipped, message };
  }
}

// ============================================================================
// Worker Exports
// ============================================================================

/**
 * Scheduled event handler - runs on cron trigger (daily at 04:00 UTC).
 * Executes both delta sync and incremental sync independently.
 */
export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env
  ): Promise<void> {
    console.log(
      `🕐 Cron triggered at ${new Date(event.scheduledTime).toISOString()}`
    );

    // Run delta sync first (catches updates to existing movies)
    const deltaResult = await deltaSyncChanges(
      env.MOVIES_DB,
      env.TMDB_API_KEY
    );

    // Run incremental ID sync (discovers new movies)
    const incrementalResult = await incrementalIdSync(
      env.MOVIES_DB,
      env.TMDB_API_KEY,
      80
    );

    console.log("📊 Summary:");
    console.log(`  Delta: ${deltaResult.message}`);
    console.log(`  Incremental: ${incrementalResult.message}`);
  },

  /**
   * HTTP fetch handler - allows manual triggering and status checks.
   * GET /status - returns sync statistics
   * POST /run - manually trigger sync (requires ADMIN_SECRET)
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // GET /status - return sync statistics
    if (request.method === "GET" && url.pathname === "/status") {
      try {
        const totalMovies = await env.MOVIES_DB.prepare(
          "SELECT COUNT(*) as count FROM tmdb_movies"
        ).first<{ count: number }>();

        const highestId = await getHighestSyncedId(env.MOVIES_DB);
        const lastDelta = await getLastDeltaSync(env.MOVIES_DB);

        return new Response(
          JSON.stringify(
            {
              total_movies: totalMovies?.count || 0,
              highest_movie_id_synced: highestId,
              last_delta_sync: lastDelta,
            },
            null,
            2
          ),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Status endpoint error:", error);
        return new Response(
          JSON.stringify({
            error:
              error instanceof Error
                ? error.message
                : "Internal server error",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /run - manually trigger sync
    if (request.method === "POST" && url.pathname === "/run") {
      // Check authentication
      const authHeader = request.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");

      if (env.ADMIN_SECRET && token !== env.ADMIN_SECRET) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("🚀 Manual sync triggered via HTTP");

      // Run both syncs
      const deltaResult = await deltaSyncChanges(
        env.MOVIES_DB,
        env.TMDB_API_KEY
      );

      const incrementalResult = await incrementalIdSync(
        env.MOVIES_DB,
        env.TMDB_API_KEY,
        80
      );

      return new Response(
        JSON.stringify(
          {
            delta: deltaResult,
            incremental: incrementalResult,
          },
          null,
          2
        ),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Default response for unknown routes
    return new Response("Not Found", { status: 404 });
  },
};
