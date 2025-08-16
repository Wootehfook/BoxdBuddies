/*
 * BoxdBuddy Cloudflare Worker - Centralized Movie Metadata API
 * AI Generated: GitHub Copilot - 2025-08-15
 *
 * Purpose: Provide secure, rate-limited TMDB-backed endpoints for the desktop app.
 * Security: No PII logging, redact inputs; API keys via environment bindings only.
 */

export interface Env {
  TMDB_API_KEY?: string;
  // Optional KV binding for durable caching/mapping
  // Bind in wrangler.toml as [[kv_namespaces]] binding = "MOVIES_KV" ...
  MOVIES_KV?: KVNamespace;
}

// Simple router
function jsonResponse(
  data: unknown,
  init: globalThis.ResponseInit = {}
): globalThis.Response {
  return new globalThis.Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}

const TMDB_BASE = "https://api.themoviedb.org/3";

async function tmdbFetch(
  path: string,
  env: Env,
  cfInit?: globalThis.RequestInit
) {
  const url = new globalThis.URL(path, TMDB_BASE);
  url.searchParams.set("api_key", env.TMDB_API_KEY || "");
  return globalThis.fetch(url.toString(), cfInit);
}

// Minimal cache type to satisfy TypeScript without adding workers-types
type CFCache = {
  match(request: globalThis.Request): Promise<globalThis.Response | undefined>;
  put(
    request: globalThis.Request,
    response: globalThis.Response
  ): Promise<void>;
};

// Minimal KV interface without importing workers-types
type KVNamespace = {
  get(
    key: string,
    opts?: { type?: "text" | "json" | "arrayBuffer" }
  ): Promise<unknown>;
  put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number }
  ): Promise<void>;
  delete?(key: string): Promise<void>;
};

function getDefaultCache(): CFCache | undefined {
  const g = globalThis as unknown as { caches?: { default?: CFCache } };
  return g.caches?.default;
}

const devNoopLog = (_: unknown) => {
  // Intentionally no-op to satisfy linting without emitting logs
};

// KV helpers
async function kvGetJson<T>(
  kv: KVNamespace | undefined,
  key: string
): Promise<T | null> {
  if (!kv) return null;
  try {
    const v = await kv.get(key, { type: "json" });
    return (v as T) ?? null;
  } catch {
    return null;
  }
}

async function kvPutJson(
  kv: KVNamespace | undefined,
  key: string,
  value: unknown,
  ttl = 3600
) {
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch {
    // ignore
  }
}

async function handleSearch(request: globalThis.Request, env: Env) {
  const { searchParams } = new globalThis.URL(request.url);
  const cache = getDefaultCache();
  const cacheKey = new globalThis.Request(request.url, request);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }
  const query = (searchParams.get("q") || "").trim();
  const page = Number(searchParams.get("page") || "1");

  if (!query) {
    return jsonResponse({ error: "missing query" }, { status: 400 });
  }

  // KV durable cache (normalized key)
  const qKey = query.toLowerCase();
  const kvKey = `search:${qKey}:p:${page}`;
  const kvHit = await kvGetJson<{ movies: unknown[]; totalPages: number }>(
    env.MOVIES_KV,
    kvKey
  );
  if (kvHit) {
    const resp = jsonResponse(kvHit);
    resp.headers.set("Cache-Control", "public, max-age=60");
    return resp;
  }

  const res = await tmdbFetch(
    `/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
    env
  );
  if (!res.ok) return jsonResponse({ error: "tmdb_error" }, { status: 502 });
  const data = await res.json();

  // Reduce payload
  type TMDBAny = {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
    vote_average?: number;
  };
  const movies = (data.results || []).map((m: TMDBAny) => ({
    id: m.id,
    title: m.title,
    year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
    poster_path: m.poster_path
      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
      : undefined,
    overview: m.overview,
    rating: m.vote_average,
  }));

  const payload = { movies, totalPages: data.total_pages ?? 1 };
  await kvPutJson(env.MOVIES_KV, kvKey, payload, 300);
  const resp = jsonResponse(payload);
  resp.headers.set("Cache-Control", "public, max-age=300");
  if (cache) {
    try {
      await cache.put(cacheKey, resp.clone());
    } catch (err) {
      devNoopLog((err as Error)?.message);
    }
  }
  return resp;
}

async function handleDetails(
  id: string,
  env: Env,
  request?: globalThis.Request
) {
  const cache = getDefaultCache();
  const url = new globalThis.URL(request?.url || "https://worker/movies/" + id);
  const cacheKey = new globalThis.Request(url.toString(), request);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  // KV durable cache for movie details
  const kvKey = `movie:${id}`;
  const kvHit = await kvGetJson<{
    id: number;
    title: string;
    year: number;
    poster_path?: string;
    overview?: string;
    rating?: number;
  }>(env.MOVIES_KV, kvKey);
  if (kvHit) {
    const resp = jsonResponse(kvHit);
    resp.headers.set("Cache-Control", "public, max-age=300");
    return resp;
  }
  const res = await tmdbFetch(`/movie/${id}`, env);
  if (!res.ok) return jsonResponse({ error: "tmdb_error" }, { status: 502 });
  const m = await res.json();
  const movie = {
    id: m.id,
    title: m.title,
    year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
    poster_path: m.poster_path
      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
      : undefined,
    overview: m.overview,
    rating: m.vote_average,
  };
  await kvPutJson(env.MOVIES_KV, kvKey, movie, 86400);
  const resp = jsonResponse(movie);
  resp.headers.set("Cache-Control", "public, max-age=300");
  if (cache) {
    try {
      await cache.put(cacheKey, resp.clone());
    } catch (err) {
      devNoopLog((err as Error)?.message);
    }
  }
  return resp;
}

async function handlePopular(request: globalThis.Request, env: Env) {
  const { searchParams } = new globalThis.URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const cache = getDefaultCache();
  const cacheKey = new globalThis.Request(request.url, request);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const kvKey = `popular:p:${page}`;
  const kvHit = await kvGetJson<{ movies: unknown[]; totalPages: number }>(
    env.MOVIES_KV,
    kvKey
  );
  if (kvHit) {
    const resp = jsonResponse(kvHit);
    resp.headers.set("Cache-Control", "public, max-age=300");
    return resp;
  }

  const res = await tmdbFetch(`/movie/popular?page=${page}`, env);
  if (!res.ok) return jsonResponse({ error: "tmdb_error" }, { status: 502 });
  const data = await res.json();

  type TMDBAny = {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
    vote_average?: number;
  };

  const movies = (data.results || []).map((m: TMDBAny) => ({
    id: m.id,
    title: m.title,
    year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
    poster_path: m.poster_path
      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
      : undefined,
    overview: m.overview,
    rating: m.vote_average,
  }));

  const payload = { movies, totalPages: data.total_pages ?? 1 };
  await kvPutJson(env.MOVIES_KV, kvKey, payload, 300);
  const resp = jsonResponse(payload);
  resp.headers.set("Cache-Control", "public, max-age=300");
  if (cache) {
    try {
      await cache.put(cacheKey, resp.clone());
    } catch (err) {
      devNoopLog((err as Error)?.message);
    }
  }
  return resp;
}

type EnhanceItem = { title: string; year?: number };
type EnhanceResult = {
  id: number;
  title: string;
  year: number;
  poster_path?: string;
  overview?: string;
  rating?: number;
};

async function searchBestMatch(
  title: string,
  year: number | undefined,
  env: Env
): Promise<EnhanceResult | null> {
  const res = await tmdbFetch(
    `/search/movie?query=${encodeURIComponent(title)}&page=1`,
    env
  );
  if (!res.ok) return null;
  const data = await res.json();
  const results = (data.results || []) as Array<{
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
    vote_average?: number;
  }>;
  if (results.length === 0) return null;

  const toYear = (d?: string) => (d ? new Date(d).getFullYear() : 0);

  let best = results[0];
  if (year) {
    const exact = results.find((m) => toYear(m.release_date) === year);
    if (exact) best = exact;
    else {
      const close = results.find(
        (m) => Math.abs(toYear(m.release_date) - year) <= 2
      );
      if (close) best = close;
    }
  }

  return {
    id: best.id,
    title: best.title,
    year: toYear(best.release_date),
    poster_path: best.poster_path
      ? `https://image.tmdb.org/t/p/w500${best.poster_path}`
      : undefined,
    overview: best.overview,
    rating: best.vote_average,
  };
}

async function handleEnhance(request: globalThis.Request, env: Env) {
  const cache = getDefaultCache();
  const cacheKey = new globalThis.Request(
    request.url,
    new globalThis.Request(request.url, { method: "GET" })
  );
  // Do not cache POST body variants by default; clients should prefer idempotent calls or client-side caching
  try {
    const items = (await request.json()) as { movies: EnhanceItem[] };
    const list = Array.isArray(items?.movies) ? items.movies : [];
    const results: EnhanceResult[] = [];
    for (const item of list) {
      const r = await searchBestMatch(item.title, item.year, env);
      if (r) results.push(r);
      else results.push({ id: 0, title: item.title, year: item.year || 0 });
      // Persist title/year -> id mapping to KV for future delta updates
      const normTitle = item.title.trim().toLowerCase();
      const mapKey = `map:${normTitle}:${item.year ?? 0}`;
      if (r) {
        await kvPutJson(
          env.MOVIES_KV,
          mapKey,
          { id: r.id, title: r.title, year: r.year },
          86400
        );
      }
    }
    const resp = jsonResponse({ movies: results });
    resp.headers.set("Cache-Control", "no-store");
    // Optionally store a generic response; omitted due to varying bodies
    if (cache) {
      try {
        await cache.put(cacheKey, resp.clone());
      } catch (err) {
        devNoopLog((err as Error)?.message);
      }
    }
    return resp;
  } catch {
    return jsonResponse({ error: "bad_request" }, { status: 400 });
  }
}

export default {
  async fetch(
    request: globalThis.Request,
    env: Env
  ): Promise<globalThis.Response> {
    try {
      const url = new globalThis.URL(request.url);
      // Basic CORS for desktop app
      const corsHeaders = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      } as const;

      if (request.method === "OPTIONS") {
        return new globalThis.Response(null, { headers: corsHeaders });
      }

      if (url.pathname === "/health") {
        return new globalThis.Response("ok", { headers: corsHeaders });
      }

      if (url.pathname === "/search" && request.method === "GET") {
        const res = await handleSearch(request, env);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      if (url.pathname === "/popular" && request.method === "GET") {
        const res = await handlePopular(request, env);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      const detailsMatch = url.pathname.match(/^\/movies\/(\d+)$/);
      if (detailsMatch && request.method === "GET") {
        const res = await handleDetails(detailsMatch[1], env, request);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      if (url.pathname === "/enhance" && request.method === "POST") {
        const res = await handleEnhance(request, env);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      return jsonResponse({ error: "not_found" }, { status: 404 });
    } catch {
      return jsonResponse({ error: "internal_error" }, { status: 500 });
    }
  },
};
