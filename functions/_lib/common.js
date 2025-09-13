// AI Generated: GitHub Copilot - 2025-08-17
// Enhanced utilities for Cloudflare Pages Functions with CORS and dual caching

const TMDB_BASE = "https://api.themoviedb.org/3";

export const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function withCORS(response) {
  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export function jsonResponse(data, init = {}) {
  const resp = new globalThis.Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
  return withCORS(resp);
}

export function getCache() {
  try {
    // Pages Functions support caches.default
    const g = globalThis;
    return g.caches?.default;
  } catch {
    return undefined;
  }
}

export async function kvGetJson(kv, key) {
  if (!kv) return null;
  try {
    const v = await kv.get(key, { type: "json" });
    return v ?? null;
  } catch {
    return null;
  }
}

export async function kvPutJson(kv, key, value, ttl = 3600) {
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch {
    // ignore
  }
}

export async function tmdbFetch(path, env, init) {
  const url = new globalThis.URL(path, TMDB_BASE);
  url.searchParams.set("api_key", env.TMDB_API_KEY || "");
  return globalThis.fetch(url.toString(), {
    headers: {
  "User-Agent": "Boxdbud.io/1.1.0",
    },
    ...init,
  });
}

export function reduceMovie(m) {
  // Normalize movie objects for transport to clients.
  // Contract: `poster_path` is returned as a TMDB relative path (e.g. `/abc123.jpg`) or `null`.
  // Frontends should prefix with the desired TMDB image base/size when building image URLs.
  // Returning the relative path keeps the data small and lets consumers choose an image size.
  return {
    id: m.id,
    title: m.title,
    year: m.release_date ? new Date(m.release_date).getFullYear() : null,
    // Prefer explicit null for absent values to keep JSON shape stable
    poster_path: m.poster_path ? m.poster_path : null,
    overview: m.overview,
    rating: m.vote_average,
    runtime: m.runtime,
  };
}

/**
 * Extracts the year from a date string or Date object.
 * @param {string|Date|null|undefined} d - The date to extract the year from. Can be a date string, Date object, or null/undefined.
 * @returns {number|null} The year as a four-digit number, or null if the input is falsy or invalid.
 */
// AI Generated: GitHub Copilot - 2025-08-18
export function toYear(d) {
  if (!d) return null;
  const date = new Date(d);
  return !Number.isNaN(date.getTime()) ? date.getFullYear() : null;
}

// AI Generated: GitHub Copilot - 2025-09-06
// Debug logging helper - keep logging controlled in production environments.
export function isDebug(env) {
  try {
    if (!env) return false;
    // Accept string 'true' for DEBUG or non-production NODE_ENV
    if (String(env.DEBUG).toLowerCase() === "true") return true;
    if (env.NODE_ENV && String(env.NODE_ENV).toLowerCase() !== "production")
      return true;
    return false;
  } catch {
    return false;
  }
}

export function debugLog(env, ...args) {
  try {
    // Intentionally use console.log here; debug gating happens via isDebug(env)
    if (
      isDebug(env) &&
      typeof console !== "undefined" &&
      typeof console.log === "function"
    ) {
      console.log(...args);
    }
  } catch (err) {
    // Avoid throwing from logging; only surface secondary logging errors when debugging
    try {
      if (
        isDebug(env) &&
        typeof console !== "undefined" &&
        typeof console.error === "function"
      ) {
        console.error("debugLog error:", err);
      }
    } catch {
      // swallow any errors from error logging to ensure debugLog never throws
    }
  }
}
