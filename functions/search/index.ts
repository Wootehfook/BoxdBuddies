// AI Generated: GitHub Copilot - 2025-08-16

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  results?: unknown[];
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
}

interface Env {
  MOVIES_DB: D1Database;
  MOVIES_KV: KVNamespace;
  TMDB_API_KEY: string;
}

interface MovieSearchResult {
  id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  overview: string | null;
  vote_average: number;
  runtime: number | null;
  director?: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Number(url.searchParams.get("page") || "1");

  if (!q) {
    return Response.json({ error: "missing query" }, { status: 400 });
  }

  // Try local database first
  try {
    const localResults = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies 
       WHERE title LIKE ? OR original_title LIKE ?
       ORDER BY popularity DESC
       LIMIT ? OFFSET ?`
    )
      .bind(`%${q}%`, `%${q}%`, 20, (page - 1) * 20)
      .all();

    if (localResults.results && localResults.results.length > 0) {
      const movies = (localResults.results as any[]).map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster_path: movie.poster_path,
        overview: movie.overview,
        vote_average: movie.vote_average,
        director: movie.director,
        runtime: movie.runtime,
      }));

      return Response.json(
        {
          movies,
          totalPages: Math.ceil(movies.length / 20),
        },
        {
          headers: { "Cache-Control": "public, max-age=300" },
        }
      );
    }
  } catch (error) {
    console.error("Local database search failed:", error);
  }

  // Fallback to TMDB API
  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&page=${page}&api_key=${env.TMDB_API_KEY}`;

  const response = await fetch(tmdbUrl, {
    headers: {
      "User-Agent": "BoxdBuddy/1.1.0",
    },
  });

  if (!response.ok) {
    return Response.json({ error: "tmdb_error" }, { status: 502 });
  }

  const data = await response.json();
  const movies = (data.results || []).map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : null,
    poster_path: movie.poster_path,
    overview: movie.overview,
    vote_average: movie.vote_average,
    runtime: movie.runtime,
  }));

  return Response.json(
    {
      movies,
      totalPages: data.total_pages ?? 1,
    },
    {
      headers: { "Cache-Control": "public, max-age=300" },
    }
  );
}
