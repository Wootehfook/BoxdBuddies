// AI Generated: GitHub Copilot - 2025-08-16

import type { Env as CacheEnv } from "../letterboxd/cache/index.js";

// D1Result type omitted to avoid unused-local errors

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
}

// Extend the canonical CacheEnv with the KV namespace used by this function
type Env = CacheEnv & { MOVIES_KV: KVNamespace };

// Temporarily unused interface - commenting out to fix lint warnings
// interface MovieSearchResult { ... }

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Number(url.searchParams.get("page") || "1");

  if (!q) return Response.json({ error: "missing query" }, { status: 400 });

  // Try local database first
  try {
    const countResult = await env.MOVIES_DB.prepare(
      `SELECT COUNT(*) as total FROM tmdb_movies WHERE title LIKE ? OR original_title LIKE ?`
    )
      .bind(`%${q}%`, `%${q}%`)
      .all();

    const totalRecords = (countResult.results?.[0] as any)?.total || 0;

    const localResults = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies WHERE title LIKE ? OR original_title LIKE ? ORDER BY popularity DESC LIMIT ? OFFSET ?`
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
        { movies, totalPages: Math.ceil(totalRecords / 20), totalRecords },
        { headers: { "Cache-Control": "public, max-age=300" } }
      );
    }
  } catch (error) {
    console.error("Local database search failed:", error);
  }

  // Fallback to TMDB API
  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&page=${page}&api_key=${env.TMDB_API_KEY}`;

  const response = await fetch(tmdbUrl, {
    headers: { "User-Agent": "Boxdbud.io/1.1.0" },
  });

  if (!response.ok)
    return Response.json({ error: "tmdb_error" }, { status: 502 });

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
    { movies, totalPages: data.total_pages ?? 1 },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
