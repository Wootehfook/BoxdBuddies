// AI Generated: GitHub Copilot - 2025-08-16
import { jsonResponse, tmdbFetch, toYear, kvPutJson, kvGetJson, corsHeaders } from "../_lib/common";

function normalizeTitleYear(title, year) {
  const t = String(title || "").trim();
  const y = typeof year === "number" ? year : Number(year) || 0;
  return { t, y };
}

async function fetchDetailsById(id, env) {
  const res = await tmdbFetch(`/movie/${id}`, env);
  if (!res.ok) return null;
  const m = await res.json();
  return {
    id: m.id,
    title: m.title,
    year: toYear(m.release_date),
    poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : undefined,
    overview: m.overview,
    rating: m.vote_average,
  };
}

async function searchBestMatch(title, year, env) {
  const res = await tmdbFetch(`/search/movie?query=${encodeURIComponent(title)}&page=1`, env);
  if (!res.ok) return null;
  const data = await res.json();
  const results = (data.results || []);
  if (results.length === 0) return null;

  let best = results[0];
  const y = typeof year === "number" ? year : Number(year) || 0;
  if (y) {
    const exact = results.find((m) => toYear(m.release_date) === y);
    if (exact) best = exact; else {
      const close = results.find((m) => Math.abs(toYear(m.release_date) - y) <= 2);
      if (close) best = close;
    }
  }

  return {
    id: best.id,
    title: best.title,
    year: toYear(best.release_date),
    poster_path: best.poster_path ? `https://image.tmdb.org/t/p/w500${best.poster_path}` : undefined,
    overview: best.overview,
    rating: best.vote_average,
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const items = Array.isArray(body?.movies) ? body.movies : [];
    const results = [];
    for (const item of items) {
      const { t, y } = normalizeTitleYear(item?.title, item?.year);
      if (!t) {
        results.push({ id: 0, title: "", year: 0 });
        continue;
      }

      const mapKey = `map:${t.toLowerCase()}:${y}`;
      const mapped = await kvGetJson(env.MOVIES_KV, mapKey);
      if (mapped?.id) {
        const det = await fetchDetailsById(mapped.id, env);
        if (det) { results.push(det); continue; }
      }

      const r = await searchBestMatch(t, y, env);
      if (r) {
        results.push(r);
        await kvPutJson(env.MOVIES_KV, mapKey, { id: r.id, title: r.title, year: r.year }, 86400);
      } else {
        results.push({ id: 0, title: t, year: y });
      }
    }
    const resp = jsonResponse({ movies: results });
    resp.headers.set("Cache-Control", "no-store");
    return resp;
  } catch {
    return jsonResponse({ error: "bad_request" }, { status: 400 });
  }
}

export async function onRequestOptions() {
  // CORS preflight for POST
  return new globalThis.Response(null, { headers: corsHeaders });
}
