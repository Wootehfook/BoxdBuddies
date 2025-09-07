// AI Generated: GitHub Copilot - 2025-08-16

// D1 types omitted to avoid unused-local errors

import type { Env as CacheEnv } from "../letterboxd/cache/index.js";
type Env = CacheEnv;

// Scheduled trigger for daily TMDB delta updates
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    // Get last sync time
    const lastSync = await env.MOVIES_DB.prepare(
      "SELECT value FROM sync_metadata WHERE key = ?"
    )
      .bind("last_delta_sync")
      .first();

    const sinceDate =
      lastSync?.value ||
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch changes from TMDB
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/changes?start_date=${sinceDate}`,
      {
        headers: {
          Authorization: `Bearer ${env.TMDB_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch TMDB changes");
    }

    const data = (await response.json()) as { results: Array<{ id: number }> };
    const movieIds = data.results?.map((r) => r.id) || [];

    let updated = 0;
    // Update changed movies (limit to 100 per run to avoid timeouts)
    for (const movieId of movieIds.slice(0, 100)) {
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=credits`,
        {
          headers: {
            Authorization: `Bearer ${env.TMDB_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (movieResponse.ok) {
        const movie = (await movieResponse.json()) as {
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
        };

        const director =
          movie.credits?.crew?.find((person) => person.job === "Director")
            ?.name || null;

        const genres = JSON.stringify(movie.genre_ids || []);

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
            movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : null,
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

        updated++;
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update last sync timestamp
    await env.MOVIES_DB.prepare(
      "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)"
    )
      .bind("last_delta_sync", new Date().toISOString())
      .run();

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
