// AI Generated: GitHub Copilot - 2025-08-16
import { jsonResponse, getCache, kvGetJson, kvPutJson, tmdbFetch, reduceMovie } from "../_lib/common";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new globalThis.URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Number(url.searchParams.get("page") || "1");
  if (!q) return jsonResponse({ error: "missing query" }, { status: 400 });

  const cache = getCache();
  const cacheKey = new globalThis.Request(request.url, request);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  // First try our local TMDB database
  try {
    const localResults = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies 
       WHERE title LIKE ? OR original_title LIKE ?
       ORDER BY popularity DESC
       LIMIT ? OFFSET ?`
    ).bind(
      `%${q}%`,
      `%${q}%`, 
      20, 
      (page - 1) * 20
    ).all();

    if (localResults.results && localResults.results.length > 0) {
      const movies = localResults.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster_path: movie.poster_path,
        overview: movie.overview,
        vote_average: movie.vote_average,
        director: movie.director,
        runtime: movie.runtime
      }));

      const payload = { movies, totalPages: Math.ceil(movies.length / 20) };
      const resp = jsonResponse(payload);
      resp.headers.set("Cache-Control", "public, max-age=300");
      
      if (cache) {
        try { await cache.put(cacheKey, resp.clone()); } catch { /* no-op */ }
      }
      return resp;
    }
  } catch (error) {
    console.error('Local database search failed:', error);
  }

  // Fallback to TMDB API with KV caching
  const kvKey = `search:${q.toLowerCase()}:p:${page}`;
  const kvHit = await kvGetJson(env.MOVIES_KV, kvKey);
  if (kvHit) {
    const resp = jsonResponse(kvHit);
    resp.headers.set("Cache-Control", "public, max-age=60");
    return resp;
  }

  const res = await tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&page=${page}`, env);
  if (!res.ok) return jsonResponse({ error: "tmdb_error" }, { status: 502 });
  const data = await res.json();
  const movies = (data.results || []).map(reduceMovie);
  const payload = { movies, totalPages: data.total_pages ?? 1 };
  await kvPutJson(env.MOVIES_KV, kvKey, payload, 300);
  const resp = jsonResponse(payload);
  resp.headers.set("Cache-Control", "public, max-age=300");
  if (cache) {
    try { await cache.put(cacheKey, resp.clone()); } catch { /* no-op */ }
  }
  return resp;
}
