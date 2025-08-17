/*
 * BoxdBuddy - TMDB Daily Update Job
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

interface Env {
  MOVIES_DB: any; // D1Database type
  TMDB_API_KEY: string;
}

// AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
// Temporarily unused interface - commenting out to fix lint warnings
// interface TMDBMovie {
//   id: number;
//   title: string;
//   original_title: string;
//   release_date: string;
//   overview: string;
//   poster_path: string | null;
//   backdrop_path: string | null;
//   vote_average: number;
//   vote_count: number;
//   popularity: number;
//   adult: boolean;
//   genre_ids: number[];
//   runtime?: number;
//   status?: string;
//   tagline?: string;
// }

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

// Rate limiting for TMDB API
let requestCount = 0;
let windowStart = Date.now();
const MAX_REQUESTS_PER_WINDOW = 35;
const WINDOW_MS = 10000;

async function rateLimit() {
  const now = Date.now();

  if (now - windowStart >= WINDOW_MS) {
    requestCount = 0;
    windowStart = now;
  }

  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = WINDOW_MS - (now - windowStart);
    console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
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
  const movie = await fetchTMDBData(`/movie/${movieId}`, apiKey);
  const credits: TMDBCredits = await fetchTMDBData(
    `/movie/${movieId}/credits`,
    apiKey
  );
  const director =
    credits.crew.find((person) => person.job === "Director")?.name || "Unknown";

  return { movie, director };
}

async function updateRecentMovies(
  database: any,
  apiKey: string
): Promise<{ updated: number; new: number; errors: number }> {
  console.log(`🔄 Starting daily TMDB update job`);

  let updatedCount = 0;
  let newCount = 0;
  let errorCount = 0;

  try {
    // Get genre list
    const genresData = await fetchTMDBData("/genre/movie/list", apiKey);
    const genres: Map<number, string> = new Map();
    genresData.genres.forEach((genre: TMDBGenre) => {
      genres.set(genre.id, genre.name);
    });

    // Get latest popular movies (first 5 pages to catch new releases)
    for (let page = 1; page <= 5; page++) {
      console.log(`📄 Processing recent movies page ${page}/5`);

      const response = await fetchTMDBData(
        `/movie/popular?page=${page}`,
        apiKey
      );

      for (const tmdbMovie of response.results) {
        try {
          if (tmdbMovie.adult) continue;

          // Check if movie exists in our database
          const existingMovie = await database
            .prepare(
              `
            SELECT id, last_updated FROM tmdb_movies WHERE id = ?
          `
            )
            .bind(tmdbMovie.id)
            .first();

          // Skip if movie was updated recently (within 7 days)
          if (existingMovie) {
            const lastUpdated = new Date(existingMovie.last_updated);
            const daysSinceUpdate =
              (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceUpdate < 7) {
              continue; // Skip recently updated movies
            }
          }

          // Get detailed movie information
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

          // Insert or update movie
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

          if (existingMovie) {
            updatedCount++;
          } else {
            newCount++;
          }
        } catch (movieError) {
          console.error(
            `❌ Error updating movie ${tmdbMovie.title}:`,
            movieError
          );
          errorCount++;
        }
      }
    }

    // Also check for newly released movies (movies released in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    console.log(
      `🆕 Checking for new releases from ${thirtyDaysAgo} to ${today}`
    );

    for (let page = 1; page <= 3; page++) {
      const newReleases = await fetchTMDBData(
        `/discover/movie?primary_release_date.gte=${thirtyDaysAgo}&primary_release_date.lte=${today}&sort_by=popularity.desc&page=${page}`,
        apiKey
      );

      for (const tmdbMovie of newReleases.results) {
        try {
          if (tmdbMovie.adult) continue;

          const existingMovie = await database
            .prepare(
              `
            SELECT id FROM tmdb_movies WHERE id = ?
          `
            )
            .bind(tmdbMovie.id)
            .first();

          if (!existingMovie) {
            const { movie: movieDetails, director } = await getMovieDetails(
              tmdbMovie.id,
              apiKey
            );
            const movieGenres = tmdbMovie.genre_ids
              .map((id: number) => genres.get(id))
              .filter(Boolean);
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

            newCount++;
          }
        } catch (movieError) {
          console.error(
            `❌ Error processing new release ${tmdbMovie.title}:`,
            movieError
          );
          errorCount++;
        }
      }
    }

    // Update sync metadata
    await database
      .prepare(
        `
      INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) 
      VALUES ('last_daily_sync', ?, CURRENT_TIMESTAMP)
    `
      )
      .bind(new Date().toISOString())
      .run();

    console.log(
      `✅ Daily update complete! Updated: ${updatedCount}, New: ${newCount}, Errors: ${errorCount}`
    );
    return { updated: updatedCount, new: newCount, errors: errorCount };
  } catch (error) {
    console.error("❌ Daily update failed:", error);
    throw error;
  }
}

export default {
  async scheduled(event: any, env: Env, _ctx: any): Promise<void> {
    console.log(
      `🕐 Daily TMDB update job triggered at ${new Date().toISOString()}`
    );

    try {
      const result = await updateRecentMovies(env.MOVIES_DB, env.TMDB_API_KEY);

      console.log(`🎉 Daily update completed successfully:`, result);
    } catch (error) {
      console.error("❌ Daily update job failed:", error);

      // You could add error reporting here (email, Slack, etc.)
    }
  },

  // Also allow manual triggering via HTTP
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== "Bearer admin-sync-token") {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      console.log(`🔄 Manual daily update triggered`);

      const result = await updateRecentMovies(env.MOVIES_DB, env.TMDB_API_KEY);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Daily update completed successfully",
          updated: result.updated,
          new: result.new,
          errors: result.errors,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ Manual daily update failed:", error);

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
  },
};
