// AI Generated: GitHub Copilot - 2025-09-09
// Test endpoint: Robust D1-only movie lookup to validate enrichment matching

import type { Env as CacheEnv } from "../letterboxd/cache/index.js";
import { debugLog } from "../_lib/common";
type Env = CacheEnv;

function normalizeTitle(t: string) {
  return t
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function parseYear(date?: string | null): number {
  if (!date) return 0;
  const m = /^(\d{4})/.exec(date);
  return m ? parseInt(m[1]) : 0;
}

async function findTmdbRowForMovie(title: string, year: number, env: Env) {
  const y = Number.isFinite(year) ? year : 0;
  const t = title;

  // 1) Exact (CI) with year tolerance
  let res = await env.MOVIES_DB.prepare(
    `SELECT * FROM tmdb_movies
     WHERE (LOWER(title) = LOWER(?) OR LOWER(original_title) = LOWER(?))
       AND (? = 0 OR year IS NULL OR abs(year - ?) <= 1)
     ORDER BY popularity DESC
     LIMIT 1`
  )
    .bind(t, t, y, y)
    .all();
  if (res.results && res.results.length > 0) return res.results[0];

  // 2) LIKE with year tolerance
  res = await env.MOVIES_DB.prepare(
    `SELECT * FROM tmdb_movies
     WHERE (title LIKE ? OR original_title LIKE ?)
       AND (? = 0 OR year IS NULL OR abs(year - ?) <= 1)
     ORDER BY popularity DESC
     LIMIT 1`
  )
    .bind(`%${t}%`, `%${t}%`, y, y)
    .all();
  if (res.results && res.results.length > 0) return res.results[0];

  // 3) Exact without year
  res = await env.MOVIES_DB.prepare(
    `SELECT * FROM tmdb_movies
     WHERE LOWER(title) = LOWER(?) OR LOWER(original_title) = LOWER(?)
     ORDER BY popularity DESC
     LIMIT 1`
  )
    .bind(t, t)
    .all();
  if (res.results && res.results.length > 0) return res.results[0];

  // 4) LIKE without year + simple scoring
  res = await env.MOVIES_DB.prepare(
    `SELECT * FROM tmdb_movies
     WHERE title LIKE ? OR original_title LIKE ?
     ORDER BY popularity DESC
     LIMIT 10`
  )
    .bind(`%${t}%`, `%${t}%`)
    .all();
  const candidates = (res.results || []) as any[];
  if (candidates.length > 0) {
    const want = normalizeTitle(t);
    const wantYear = y || 0;
    let best: any = null;
    let bestScore = -Infinity;
    for (const c of candidates) {
      const ct = normalizeTitle(String(c.title || c.original_title || ""));
      const cy = Number(c.year || parseYear(c.release_date) || 0);
      let score = 0;
      if (ct === want) score += 5;
      if (!score && ct.includes(want)) score += 2;
      if (wantYear && cy && Math.abs(cy - wantYear) <= 1) score += 2;
      score += Number(c.popularity || 0) / 100;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (best) return best;
  }

  return null;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const yearParam = url.searchParams.get("year") || "0";
  const y = Number(yearParam);

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!q) {
    return new Response(JSON.stringify({ error: "missing q" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  try {
    const match = await findTmdbRowForMovie(q, y, context.env);
    if (!match) {
      return new Response(JSON.stringify({ found: false, title: q, year: y }), {
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    return new Response(JSON.stringify({ found: true, q, year: y, match }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (err) {
    // Avoid exposing stack traces; log internally when debug is enabled
    debugLog(context.env as any, "movie-lookup error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
