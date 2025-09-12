// AI Generated: GitHub Copilot - 2025-08-17
import {
  jsonResponse,
  getCache,
  kvGetJson,
  kvPutJson,
  tmdbFetch,
  reduceMovie,
} from "../_lib/common";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new globalThis.URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");

  const cache = getCache();
  // AI Generated: GitHub Copilot - 2025-08-18
  // Use RequestInit for second parameter, not a Request object
  const cacheKey = new globalThis.Request(request.url);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const kvKey = `popular:p:${page}`;
  const kvHit = await kvGetJson(env.MOVIES_KV, kvKey);
  if (kvHit) {
    const resp = jsonResponse(kvHit);
    resp.headers.set("Cache-Control", "public, max-age=300");
    return resp;
  }

  const res = await tmdbFetch(`/movie/popular?page=${page}`, env);
  if (!res.ok) return jsonResponse({ error: "tmdb_error" }, { status: 502 });
  const data = await res.json();
  const movies = (data.results || []).map(reduceMovie);
  const payload = { movies, totalPages: data.total_pages ?? 1 };
  await kvPutJson(env.MOVIES_KV, kvKey, payload, 300);
  const resp = jsonResponse(payload);
  resp.headers.set("Cache-Control", "public, max-age=300");
  if (cache) {
    try {
      await cache.put(cacheKey, resp.clone());
    } catch {
      /* no-op */
    }
  }
  return resp;
}
