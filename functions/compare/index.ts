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
}

interface MovieData {
  letterboxd_slug: string;
  title: string;
  year: number | null;
  letterboxd_url: string;
  tmdb_data?: {
    id: number;
    poster_path: string | null;
    vote_average: number;
    overview: string;
    director: string | null;
    runtime: number | null;
  };
}

interface Env {
  MOVIES_DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const { usernames } = (await request.json()) as { usernames: string[] };

  if (!usernames || usernames.length < 2) {
    return Response.json(
      { error: "At least 2 usernames required" },
      { status: 400 }
    );
  }

  // Fetch all watchlists
  const watchlists = await Promise.all(
    usernames.map(async (username: string) => {
      const cacheKey = `watchlist:${username}`;
      const cached = await env.MOVIES_DB.prepare(
        `SELECT data FROM letterboxd_cache 
         WHERE cache_key = ? AND expires_at > CURRENT_TIMESTAMP`
      )
        .bind(cacheKey)
        .first();

      if (cached && cached.data) {
        return {
          username,
          movies: JSON.parse(cached.data as string) as MovieData[],
        };
      }

      // If not cached, return empty (client should fetch first)
      return { username, movies: [] as MovieData[] };
    })
  );

  // Find common movies
  const movieMaps = watchlists.map(
    (w) =>
      new Map(w.movies.map((m: MovieData) => [`${m.title}:${m.year || ""}`, m]))
  );

  const commonMovies: MovieData[] = [];
  const firstMap = movieMaps[0];

  if (firstMap) {
    for (const [key, movie] of firstMap.entries()) {
      if (movieMaps.every((map) => map.has(key))) {
        // Enhance with TMDB data
        const enhanced = await enhanceWithTMDB(env, movie);
        commonMovies.push(enhanced);
      }
    }
  }

  // Sort by popularity or rating
  commonMovies.sort(
    (a, b) =>
      (b.tmdb_data?.vote_average || 0) - (a.tmdb_data?.vote_average || 0)
  );

  return Response.json({
    common_movies: commonMovies,
    total_common: commonMovies.length,
    watchlists: watchlists.map((w) => ({
      username: w.username,
      count: w.movies.length,
    })),
  });
}

async function enhanceWithTMDB(env: Env, movie: MovieData): Promise<MovieData> {
  // Search in our TMDB database
  const tmdbMovie = await env.MOVIES_DB.prepare(
    `SELECT * FROM tmdb_movies 
     WHERE title = ? AND year = ?
     LIMIT 1`
  )
    .bind(movie.title, movie.year)
    .first();

  if (tmdbMovie) {
    return {
      ...movie,
      tmdb_data: {
        id: tmdbMovie.id as number,
        poster_path: tmdbMovie.poster_path as string | null,
        vote_average: tmdbMovie.vote_average as number,
        overview: tmdbMovie.overview as string,
        director: tmdbMovie.director as string | null,
        runtime: tmdbMovie.runtime as number | null,
      },
    };
  }

  return movie;
}
