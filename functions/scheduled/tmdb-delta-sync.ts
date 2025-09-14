// AI Generated: GitHub Copilot - 2025-08-16

// D1 types omitted to avoid unused-local errors

import type { Env as CacheEnv } from "../letterboxd/cache/index.js";
type Env = CacheEnv;

// Scheduled trigger for daily TMDB delta updates
type TMDBMovie = {
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
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  status?: string;
  tagline?: string;
  credits?: { crew: Array<{ job: string; name: string }> };
};

async function getLastDeltaSync(env: Env): Promise<string> {
  const lastSync = await env.MOVIES_DB.prepare(
    "SELECT value FROM sync_metadata WHERE key = ?"
  )
    .bind("last_delta_sync")
    .first();
  return (
    lastSync?.value || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  );
}

async function fetchChangedMovieIds(
  env: Env,
  sinceDate: string
): Promise<number[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/changes?start_date=${sinceDate}`,
    {
      headers: {
        Authorization: `Bearer ${env.TMDB_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch TMDB changes");
  const data = (await res.json()) as { results: Array<{ id: number }> };
  return data.results?.map((r) => r.id) || [];
}

async function fetchMovie(
  env: Env,
  movieId: number
): Promise<TMDBMovie | null> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=credits`,
    {
      headers: {
        Authorization: `Bearer ${env.TMDB_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) return null;
  return (await res.json()) as TMDBMovie;
}

function extractDirector(movie: TMDBMovie): string | null {
  return movie.credits?.crew?.find((p) => p.job === "Director")?.name || null;
}

function extractGenresJson(movie: TMDBMovie): string {
  const names = Array.isArray(movie.genres)
    ? movie.genres.map((g) => g?.name).filter((n): n is string => Boolean(n))
    : [];
  return JSON.stringify(names);
}

async function upsertMovie(
  env: Env,
  movie: TMDBMovie,
  director: string | null,
  genresJson: string
) {
  await env.MOVIES_DB.prepare(
    `
    INSERT OR REPLACE INTO tmdb_movies (
      id, title, original_title, release_date, year,
      overview, poster_path, backdrop_path,
      vote_average, vote_count, popularity,
      adult, genres, director, runtime, status, tagline, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      genresJson,
      director,
      movie.runtime,
      movie.status,
      movie.tagline
    )
    .run();
}

async function setLastDeltaSync(env: Env) {
  await env.MOVIES_DB.prepare(
    "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)"
  )
    .bind("last_delta_sync", new Date().toISOString())
    .run();
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;
  try {
    const sinceDate = await getLastDeltaSync(env);
    const movieIds = await fetchChangedMovieIds(env, sinceDate);

    let updated = 0;
    for (const movieId of movieIds.slice(0, 100)) {
      const movie = await fetchMovie(env, movieId);
      if (movie) {
        const director = extractDirector(movie);
        const genresJson = extractGenresJson(movie);
        await upsertMovie(env, movie, director, genresJson);
        updated++;
      }
      // Respectful rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await setLastDeltaSync(env);

    return Response.json({
      success: true,
      checked: movieIds.length,
      updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
