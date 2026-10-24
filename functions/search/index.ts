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

interface SearchRow {
  id: number;
  title: string;
  year?: number | null;
  poster_path?: string | null;
  overview?: string | null;
  vote_average?: number | null;
  director?: string | null;
  runtime?: number | null;
}

interface SearchCountRow {
  total?: number;
}

interface TmdbSearchMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
  runtime?: number;
}

interface TmdbSearchResponse {
  results?: TmdbSearchMovie[];
  total_pages?: number;
}

// Temporarily unused interface - commenting out to fix lint warnings
// interface MovieSearchResult { ... }

const MAX_SEARCH_PAGE = 50;

function getEdgeCache(): Cache | null {
  const c = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
  return c?.default ?? null;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Number(url.searchParams.get("page") || "1");

  if (!q) return Response.json({ error: "missing query" }, { status: 400 });
  // Bound inputs: each query is a full-table LIKE scan, and a negative/NaN
  // page would produce an invalid OFFSET.
  if (q.length < 2 || q.length > 100) {
    return Response.json(
      { error: "query must be 2-100 characters" },
      { status: 400 }
    );
  }
  if (!Number.isInteger(page) || page < 1 || page > MAX_SEARCH_PAGE) {
    return Response.json(
      { error: `page must be an integer between 1 and ${MAX_SEARCH_PAGE}` },
      { status: 400 }
    );
  }

  // Serve repeated identical queries from the edge cache instead of D1.
  const cache = getEdgeCache();
  const cacheKey = new Request(url.toString(), { method: "GET" });
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }
  const respond = async (body: unknown): Promise<Response> => {
    const res = Response.json(body, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
    if (cache) {
      try {
        await cache.put(cacheKey, res.clone());
      } catch {
        /* cache is best-effort */
      }
    }
    return res;
  };

  // Try local database first
  try {
    const countResult = await env.MOVIES_DB.prepare(
      `SELECT COUNT(*) as total FROM tmdb_movies WHERE title LIKE ? OR original_title LIKE ?`
    )
      .bind(`%${q}%`, `%${q}%`)
      .all();

    const totalRecords =
      (countResult.results?.[0] as SearchCountRow)?.total || 0;

    const localResults = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies WHERE title LIKE ? OR original_title LIKE ? ORDER BY popularity DESC LIMIT ? OFFSET ?`
    )
      .bind(`%${q}%`, `%${q}%`, 20, (page - 1) * 20)
      .all();

    if (localResults.results && localResults.results.length > 0) {
      const movies = (localResults.results as unknown as SearchRow[]).map(
        (movie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          poster_path: movie.poster_path,
          overview: movie.overview,
          vote_average: movie.vote_average,
          director: movie.director,
          runtime: movie.runtime,
        })
      );

      return respond({
        movies,
        totalPages: Math.ceil(totalRecords / 20),
        totalRecords,
      });
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

  const data = (await response.json()) as TmdbSearchResponse;
  const movies = (data.results || []).map((movie) => ({
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

  return respond({ movies, totalPages: data.total_pages ?? 1 });
}
