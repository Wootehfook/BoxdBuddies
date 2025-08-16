// AI Generated: GitHub Copilot - 2025-08-16
// Common utilities for Cloudflare Workers functions

export function jsonResponse(data, options = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
}

export function getCache() {
  return caches.default;
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
    await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
  } catch (error) {
    console.error('KV put failed:', error);
  }
}

export async function tmdbFetch(endpoint, env) {
  const baseUrl = "https://api.themoviedb.org/3";
  const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${env.TMDB_API_KEY}`;
  
  return fetch(url, {
    headers: {
      "User-Agent": "BoxdBuddy/1.1.0",
    },
  });
}

export function reduceMovie(movie) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
    poster_path: movie.poster_path,
    overview: movie.overview,
    vote_average: movie.vote_average,
    runtime: movie.runtime,
  };
}