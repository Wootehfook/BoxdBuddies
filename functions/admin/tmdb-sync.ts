// AI Generated: GitHub Copilot - 2025-08-16

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  first(): Promise<Record<string, unknown> | null>;
}

interface D1Result {
  success: boolean;
  results?: unknown[];
  meta?: {
    changed_db: boolean;
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  runtime?: number;
  status?: string;
  tagline?: string;
  credits?: {
    crew: Array<{
      job: string;
      name: string;
    }>;
  };
}

interface TMDBChangeResult {
  id: number;
}

interface Env {
  MOVIES_DB: D1Database;
  TMDB_API_KEY: string;
  ADMIN_SECRET: string;
}

// Secure admin endpoint for TMDB synchronization
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Verify admin authorization
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { action, params } = (await request.json()) as {
    action: string;
    params?: { movieId: number };
  };

  switch (action) {
    case "sync_popular":
      return syncPopularMovies(env);
    case "sync_top_rated":
      return syncTopRatedMovies(env);
    case "sync_recent":
      return syncRecentMovies(env);
    case "sync_comprehensive":
      return syncComprehensive(env);
    case "sync_movie":
      return syncSingleMovie(env, params?.movieId || 0);
    case "sync_delta":
      return syncDeltaUpdates(env);
    default:
      return new Response("Invalid action", { status: 400 });
  }
}

async function syncPopularMovies(env: Env) {
  const pages = 50; // Sync top 1000 movies (20 per page)
  let totalSynced = 0;
  let apiCallCount = 0;
  const startTime = Date.now();

  // Check if we've synced recently to avoid unnecessary load
  const lastSync = await env.MOVIES_DB.prepare(
    "SELECT value FROM sync_metadata WHERE key = ?"
  )
    .bind("last_popular_sync")
    .first();

  const lastSyncTime = lastSync?.value
    ? new Date(lastSync.value as string)
    : null;
  const hoursSinceLastSync = lastSyncTime
    ? (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60)
    : 999;

  // Only sync if it's been more than 24 hours
  if (hoursSinceLastSync < 24) {
    return Response.json({
      success: true,
      message: "Sync skipped - last sync was less than 24 hours ago",
      lastSync: lastSyncTime,
      hoursSince: Math.round(hoursSinceLastSync * 100) / 100,
    });
  }

  for (let page = 1; page <= pages; page++) {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?page=${page}&api_key=${env.TMDB_API_KEY}`,
      {
        headers: {
          "User-Agent":
            "BoxdBuddy/1.1.0 (https://boxdbuddy.pages.dev; respectful-bot)",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    apiCallCount++;

    // Handle rate limiting gracefully
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
      console.log(`Rate limited, waiting ${waitTime}ms before retry`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue; // Retry this page
    }

    if (!response.ok) {
      console.log(`API error for page ${page}: ${response.status}`);
      continue;
    }

    const data = (await response.json()) as { results: TMDBMovie[] };
    const movies = data.results || [];

    for (const movie of movies) {
      await upsertMovie(env.MOVIES_DB, movie);
      totalSynced++;
    }

    // Respectful rate limiting: 3.5 requests per second (well under 4/sec limit)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Progress logging every 10 pages
    if (page % 10 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(
        `Progress: ${page}/${pages} pages, ${totalSynced} movies, ${Math.round(elapsed)}s elapsed`
      );
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(
    `Sync completed: ${totalSynced} movies, ${apiCallCount} API calls, ${Math.round(totalTime)}s total`
  );

  await env.MOVIES_DB.prepare(
    "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)"
  )
    .bind("last_popular_sync", new Date().toISOString())
    .run();

  return Response.json({
    success: true,
    synced: totalSynced,
    apiCalls: apiCallCount,
    duration: Math.round(totalTime),
    ratePerSecond: Math.round((apiCallCount / totalTime) * 100) / 100,
  });
}

async function syncTopRatedMovies(env: Env) {
  return syncMovieCategory(env, "top_rated", "last_top_rated_sync", 25); // Top 500 rated movies
}

async function syncRecentMovies(env: Env) {
  return syncMovieCategory(env, "now_playing", "last_recent_sync", 10); // Current movies
}

async function syncMovieCategory(
  env: Env,
  category: string,
  syncKey: string,
  maxPages: number
) {
  let totalSynced = 0;
  let apiCallCount = 0;
  const startTime = Date.now();

  // Check if we've synced this category recently
  const lastSync = await env.MOVIES_DB.prepare(
    "SELECT value FROM sync_metadata WHERE key = ?"
  )
    .bind(syncKey)
    .first();

  const lastSyncTime = lastSync?.value
    ? new Date(lastSync.value as string)
    : null;
  const hoursSinceLastSync = lastSyncTime
    ? (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60)
    : 999;

  // Only sync if it's been more than 12 hours for supplementary categories
  if (hoursSinceLastSync < 12) {
    return Response.json({
      success: true,
      message: `${category} sync skipped - last sync was less than 12 hours ago`,
      category,
      lastSync: lastSyncTime,
      hoursSince: Math.round(hoursSinceLastSync * 100) / 100,
    });
  }

  for (let page = 1; page <= maxPages; page++) {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${category}?page=${page}&api_key=${env.TMDB_API_KEY}`,
      {
        headers: {
          "User-Agent":
            "BoxdBuddy/1.1.0 (https://boxdbuddy.pages.dev; respectful-bot)",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    apiCallCount++;

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    if (!response.ok) continue;

    const data = (await response.json()) as { results: TMDBMovie[] };
    const movies = data.results || [];

    for (const movie of movies) {
      await upsertMovie(env.MOVIES_DB, movie);
      totalSynced++;
    }

    // Respectful rate limiting
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  await env.MOVIES_DB.prepare(
    "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)"
  )
    .bind(syncKey, new Date().toISOString())
    .run();

  const totalTime = (Date.now() - startTime) / 1000;
  return Response.json({
    success: true,
    category,
    synced: totalSynced,
    apiCalls: apiCallCount,
    duration: Math.round(totalTime),
  });
}

async function syncComprehensive(env: Env) {
  const results = [];

  // Sync popular movies first
  results.push(await syncPopularMovies(env));

  // Wait between major operations
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Sync top rated movies
  results.push(await syncTopRatedMovies(env));

  // Wait between major operations
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Sync recent movies
  results.push(await syncRecentMovies(env));

  return Response.json({
    success: true,
    comprehensive: true,
    message: "Comprehensive sync completed across multiple categories",
  });
}

async function upsertMovie(db: D1Database, movie: TMDBMovie) {
  const genres = JSON.stringify(movie.genre_ids || []);

  await db
    .prepare(
      `
    INSERT OR REPLACE INTO tmdb_movies (
      id, title, original_title, release_date, year,
      overview, poster_path, backdrop_path,
      vote_average, vote_count, popularity,
      adult, genres, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `
    )
    .bind(
      movie.id,
      movie.title,
      movie.original_title,
      movie.release_date,
      movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      movie.overview,
      movie.poster_path,
      movie.backdrop_path,
      movie.vote_average,
      movie.vote_count,
      movie.popularity,
      movie.adult ? 1 : 0,
      genres
    )
    .run();
}

async function syncSingleMovie(env: Env, movieId: number) {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=credits&api_key=${env.TMDB_API_KEY}`,
    {
      headers: {
        "User-Agent": "BoxdBuddy/1.1.0",
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    return Response.json({ error: "Movie not found" }, { status: 404 });
  }

  const movie = (await response.json()) as TMDBMovie;
  const director =
    movie.credits?.crew?.find((person) => person.job === "Director")?.name ||
    null;

  await env.MOVIES_DB.prepare(
    `
    UPDATE tmdb_movies 
    SET director = ?, runtime = ?, status = ?, tagline = ?
    WHERE id = ?
  `
  )
    .bind(director, movie.runtime, movie.status, movie.tagline, movie.id)
    .run();

  return Response.json({ success: true, movie: movie.title });
}

async function syncDeltaUpdates(env: Env) {
  // Get last sync time
  const lastSync = await env.MOVIES_DB.prepare(
    "SELECT value FROM sync_metadata WHERE key = ?"
  )
    .bind("last_delta_sync")
    .first();

  const sinceDate =
    lastSync?.value || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch changes from TMDB
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/changes?start_date=${sinceDate}&api_key=${env.TMDB_API_KEY}`,
    {
      headers: {
        "User-Agent": "BoxdBuddy/1.1.0",
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    return Response.json({ error: "Failed to fetch changes" }, { status: 500 });
  }

  const data = (await response.json()) as { results: TMDBChangeResult[] };
  const movieIds = data.results?.map((r) => r.id) || [];

  // Update changed movies
  for (const movieId of movieIds.slice(0, 100)) {
    await syncSingleMovie(env, movieId);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await env.MOVIES_DB.prepare(
    "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)"
  )
    .bind("last_delta_sync", new Date().toISOString())
    .run();

  return Response.json({ success: true, updated: movieIds.length });
}
