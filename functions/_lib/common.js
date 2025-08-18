// AI Generated: GitHub Copilot - 2025-08-16
// Common utilities for Cloudflare Workers functions

// CORS headers for cross-origin requests
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function jsonResponse(data, options = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...options.headers,
    },
    ...options,
  });
}

export function getCache() {
  return caches.default;
}

// Enhanced dual caching with Cloudflare Cache and KV
export async function getCachedOrFetch(
  cacheKey,
  kvKey,
  kv,
  fetchFn,
  cacheTtl = 3600,
  kvTtl = 86400
) {
  // Try Cloudflare Cache first (faster)
  const cache = getCache();
  const cacheRequest = new Request(cacheKey);
  let cachedResponse = await cache.match(cacheRequest);

  if (cachedResponse) {
    console.log(`Cache hit: ${cacheKey}`);
    return await cachedResponse.json();
  }

  // Try KV storage second (persistent)
  const kvData = await kvGetJson(kv, kvKey);
  if (kvData) {
    console.log(`KV hit: ${kvKey}`);
    // Store in cache for next time
    const response = new Response(JSON.stringify(kvData), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${cacheTtl}`,
      },
    });
    await cache.put(cacheRequest, response.clone());
    return kvData;
  }

  // Fetch fresh data
  console.log(`Fetching fresh data for: ${cacheKey}`);
  const freshData = await fetchFn();

  // Store in both caches
  const response = new Response(JSON.stringify(freshData), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cacheTtl}`,
    },
  });
  await cache.put(cacheRequest, response.clone());
  await kvPutJson(kv, kvKey, freshData, kvTtl);

  return freshData;
}

export async function kvGetJson(kv, key) {
  try {
    const value = await kv.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function kvPutJson(kv, key, data, ttl = 3600) {
  try {
    const serializedData = JSON.stringify(data);
    await kv.put(key, serializedData, { expirationTtl: ttl });
    return true;
  } catch (error) {
    console.error("KV put failed:", error);
    return false;
  }
}

// Enhanced error response with specific error codes
export function errorResponse(
  message,
  code = "UNKNOWN_ERROR",
  status = 500,
  details = null
) {
  const errorData = {
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    errorData.error.details = details;
  }

  return jsonResponse(errorData, { status });
}

// Handle CORS preflight requests
export function corsResponse() {
  return new Response(null, {
    headers: CORS_HEADERS,
  });
}

export async function tmdbFetch(endpoint, env) {
  const baseUrl = "https://api.themoviedb.org/3";
  // Ensure proper URL construction with consistent parameter handling
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${baseUrl}${endpoint}${separator}api_key=${env.TMDB_API_KEY}`;

  return fetch(url, {
    headers: {
      "User-Agent": "BoxdBuddy/1.1.0",
      Accept: "application/json",
    },
  });
}

// Utility for consistent year handling
export function toYear(dateString) {
  if (!dateString) return null;
  try {
    return new Date(dateString).getFullYear();
  } catch {
    return null;
  }
}

// Generate full poster URL with fallback handling
export function getFullPosterUrl(posterPath, size = "w500") {
  if (!posterPath) return null;
  const baseUrl = "https://image.tmdb.org/t/p/";
  return `${baseUrl}${size}${posterPath}`;
}

export function reduceMovie(movie) {
  return {
    id: movie.id,
    title: movie.title,
    year: toYear(movie.release_date),
    poster_path: movie.poster_path,
    poster_url: getFullPosterUrl(movie.poster_path),
    overview: movie.overview,
    vote_average: movie.vote_average,
    runtime: movie.runtime,
    director: movie.director, // Include director if available
  };
}
