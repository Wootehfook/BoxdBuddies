// AI Generated: GitHub Copilot - 2025-08-16
import { jsonResponse, getCache, kvGetJson, kvPutJson, tmdbFetch, reduceMovie } from "../../_lib/common";

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const id = params.id;

  const cache = getCache();
  const cacheKey = new globalThis.Request(request.url, request);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const kvKey = `movie:${id}`;
  const kvHit = await kvGetJson(env.MOVIES_KV, kvKey);
  if (kvHit) {
    const resp = jsonResponse(kvHit);
    resp.headers.set("Cache-Control", "public, max-age=300");
    return resp;
  }

  const res = await tmdbFetch(`/movie/${id}`, env);
  if (!res.ok) return jsonResponse({ error: "tmdb_error" }, { status: 502 });
  const m = await res.json();
  const movie = reduceMovie(m);
  await kvPutJson(env.MOVIES_KV, kvKey, movie, 86400);
  const resp = jsonResponse(movie);
  resp.headers.set("Cache-Control", "public, max-age=300");
  if (cache) { try { await cache.put(cacheKey, resp.clone()); } catch { /* no-op */ } }
  return resp;
}
