// AI Generated: GitHub Copilot - 2025-08-16T23:30:00Z
// Letterboxd Watchlist Comparison API

import { debugLog } from "../../_lib/common";
import type { Env as CacheEnv } from "../cache/index.js";

// Structured logging utility for production
const logger = {
  info: (message: string, meta?: any) => {
    debugLog(
      undefined,
      JSON.stringify({
        level: "info",
        message,
        meta,
        timestamp: new Date().toISOString(),
      })
    );
  },
  error: (message: string, error?: any) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error?.message || error,
        timestamp: new Date().toISOString(),
      })
    );
  },
  warn: (message: string, meta?: any) => {
    debugLog(
      undefined,
      JSON.stringify({
        level: "warn",
        message,
        meta,
        timestamp: new Date().toISOString(),
      })
    );
  },
};

type Env = CacheEnv;

interface LetterboxdMovie {
  title: string;
  year: number;
  slug: string;
}

interface Movie {
  id: number;
  title: string;
  year: number;
  poster_path?: string | null;
  overview?: string | null;
  vote_average?: number | null;
  director?: string | null;
  runtime?: number | null;
  letterboxdSlug?: string | null;
  friendCount: number;
  friendList: string[];
}

function decodeHTMLEntities(text: string): string {
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#039;": "'",
    "&#x27;": "'",
    "&nbsp;": " ",
    "&mdash;": "-",
    "&ndash;": "-",
  };

  let decoded = text.replace(
    /&[a-zA-Z][a-zA-Z0-9]*;/g,
    (entity) => entityMap[entity] || entity
  );
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  );
  return decoded;
}

export function normalizeTitleForSearch(text: string): {
  normalized: string;
  stripped: string;
} {
  if (!text) return { normalized: "", stripped: "" };
  let s = decodeHTMLEntities(text);
  // Handle double-escaped numeric entities and literal fragments
  s = s.replace(/&amp;#x?0*27;?/gi, "'");
  s = s.replace(/&amp;#0*39;?/gi, "'");
  s = s.replace(/#x27;?/gi, "'");
  s = s.replace(/#0*39;?/g, "'");
  // Normalize various apostrophes/quotes to ASCII
  s = s.replace(/[\u2018\u2019\u201A\uFF07\u02BC\u201B]/g, "'");
  s = s.replace(/[\u201C\u201D\u201E]/g, '"');
  s = s.replace(/[\u2013\u2014]/g, "-");
  // Remove ampersands that remain only when they are part of broken numeric
  // entity fragments (e.g. "& #039;", "&amp; #039;") — preserve meaningful
  // ampersands like "Tom & Jerry". We remove the '&' only when it's
  // followed (possibly after 'amp;' and whitespace) by a '#'.
  s = s.replace(/&(?:amp;)?\s*(?=#)/gi, "");
  // Remove spaces before apostrophes produced by patterns like " &#039;s" -> "'s"
  s = s.replace(/\s+'+/g, "'");
  s = s.replace(/\s+/g, " ").trim();
  const stripped = s.replace(/'+/g, "");
  return { normalized: s, stripped };
}

/**
 * Parse the inner HTML of a single <li class="poster-container"> block
 * and return a LetterboxdMovie or null when parsing fails.
 */
function parseLiContent(liContent: string): LetterboxdMovie | null {
  const slugMatch = /data-film-slug=["']([^"']*)["']/.exec(liContent);
  const imgAltMatch = /<img[^>]+alt=["']([^"']+)["'][^>]*>/.exec(liContent);
  const slug = slugMatch ? slugMatch[1] : "";
  const titleWithYear = imgAltMatch ? imgAltMatch[1] : "";
  if (!titleWithYear) return null;
  const yearRe = /^(.+?)\s+(\d{4})$/;
  const ym = yearRe.exec(titleWithYear);
  if (ym) return { title: ym[1].trim(), year: parseInt(ym[2], 10), slug };
  // If no year is present, still return the title (year 0)
  return { title: titleWithYear.trim(), year: 0, slug };
}

/**
 * Extract all LetterboxdMovie entries from the page HTML by finding
 * <li class="poster-container"> blocks and parsing each one.
 */
function extractMoviesFromHtml(html: string): LetterboxdMovie[] {
  const pageMovies: LetterboxdMovie[] = [];
  const liRegex =
    /<li[^>]*class=["']poster-container["'][^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;
  while ((liMatch = liRegex.exec(html)) !== null) {
    const liContent = liMatch[1];
    const movie = parseLiContent(liContent);
    if (movie) pageMovies.push(movie);
  }
  return pageMovies;
}

async function scrapeLetterboxdWatchlist(
  username: string,
  env?: Env
): Promise<LetterboxdMovie[]> {
  const allMovies: LetterboxdMovie[] = [];
  let page = 1;
  const maxPages = 50;
  logger.info(`Starting to scrape watchlist`, { username });

  while (page <= maxPages) {
    const url =
      page === 1
        ? `https://letterboxd.com/${username}/watchlist/`
        : `https://letterboxd.com/${username}/watchlist/page/${page}/`;
    debugLog(env, `Scraping ${url}`);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Boxdbud.io/1.0" },
      });
      if (!res.ok) {
        if (page === 1)
          throw new Error(`Failed to fetch ${url}: ${res.status}`);
        break;
      }
      const html = await res.text();
      console.log(`DEBUG: fetched page ${page} html length: ${html.length}`);
      console.log(`DEBUG: fetched html snippet: ${html.slice(0, 200)}`);
      const pageMovies = extractMoviesFromHtml(html);
      if (pageMovies.length === 0) break;
      allMovies.push(...pageMovies);
      page++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      debugLog(env, `Error scraping ${url}: ${String(e)}`);
      break;
    }
  }

  debugLog(env, `Scraped ${allMovies.length} movies for ${username}`);
  return allMovies;
}

function findCommonMovies(
  watchlists: { username: string; movies: LetterboxdMovie[] }[]
) {
  const counts = new Map<string, { movie: LetterboxdMovie; users: string[] }>();
  for (const w of watchlists) {
    for (const m of w.movies) {
      // Use a normalized title for matching so that different encodings of
      // apostrophes/quotes still count as the same movie across users.
      const { normalized } = normalizeTitleForSearch(m.title);
      const key = `${normalized.toLowerCase()}-${m.year}`;
      const existing = counts.get(key);
      if (existing) {
        if (!existing.users.includes(w.username))
          existing.users.push(w.username);
      } else counts.set(key, { movie: m, users: [w.username] });
    }
  }
  const commons: Array<
    LetterboxdMovie & { friendCount: number; friendList: string[] }
  > = [];
  for (const [, v] of counts)
    if (v.users.length >= 2)
      commons.push({
        ...v.movie,
        friendCount: v.users.length,
        friendList: v.users,
      });
  return commons;
}

async function enhanceWithTMDBData(
  movies: Array<
    LetterboxdMovie & { friendCount: number; friendList: string[] }
  >,
  env: Env
): Promise<Movie[]> {
  // resolved will hold the final Movie[]
  const generateFallbackId = (t: string, y: number) => {
    let h = 0;
    const s = `${t.toLowerCase()}-${y}`;
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
    return Math.abs(h % 100000) + 900000;
  };

  // DB helper: try the REPLACE-stripped match
  async function dbFindStripped(titleStripped: string, year: number) {
    try {
      return await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies WHERE LOWER(REPLACE(title, ?, '')) = LOWER(?) AND (year=? OR year=? OR year=?) ORDER BY popularity DESC LIMIT 1`
      )
        .bind("'", titleStripped, year, year - 1, year + 1)
        .all();
    } catch (e) {
      debugLog(env, `Stripped REPLACE lookup failed: ${String(e)}`);
      return null;
    }
  }

  async function dbFindExact(title: string, year: number) {
    try {
      return await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies WHERE LOWER(title)=LOWER(?) AND (year=? OR year=? OR year=?) ORDER BY popularity DESC LIMIT 1`
      )
        .bind(title, year, year - 1, year + 1)
        .all();
    } catch (e) {
      debugLog(env, `Exact lookup failed: ${String(e)}`);
      return null;
    }
  }

  async function dbFindLike(title: string) {
    try {
      return await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies WHERE LOWER(title) LIKE LOWER(?) ORDER BY popularity DESC LIMIT 1`
      )
        .bind(`%${title}%`)
        .all();
    } catch (e) {
      debugLog(env, `DB LIKE fallback failed: ${String(e)}`);
      return null;
    }
  }

  function buildMovieFromRow(
    r: any,
    movie: LetterboxdMovie & { friendCount: number; friendList: string[] }
  ): Movie {
    return {
      id: r.id,
      title: r.title,
      year: r.year || movie.year,
      poster_path: r.poster_path ?? null,
      overview: r.overview ?? null,
      vote_average: r.vote_average ?? null,
      director: r.director ?? null,
      runtime: r.runtime ?? null,
      letterboxdSlug: movie.slug,
      friendCount: movie.friendCount,
      friendList: movie.friendList,
    };
  }

  async function resolveMovie(
    movie: LetterboxdMovie & { friendCount: number; friendList: string[] }
  ): Promise<Movie> {
    try {
      const { normalized, stripped } = normalizeTitleForSearch(movie.title);

      if (stripped) {
        const strippedResult = await dbFindStripped(stripped, movie.year);
        if (strippedResult?.results?.length)
          return buildMovieFromRow(strippedResult.results[0], movie);
      }

      let searchTitle = normalized;
      if (movie.slug) {
        const slugTitle = movie.slug
          .replace(/-\d{4}$/, "")
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" ");
        if (slugTitle && slugTitle.toLowerCase() !== normalized.toLowerCase())
          searchTitle = slugTitle;
      }

      let result = await dbFindExact(searchTitle, movie.year);
      if (!result?.results?.length && stripped)
        result = await dbFindStripped(stripped, movie.year);
      if (!result?.results?.length && searchTitle !== normalized)
        result = await dbFindExact(normalized, movie.year);
      if (!result?.results?.length && searchTitle)
        result = await dbFindLike(searchTitle);

      if (result?.results?.length)
        return buildMovieFromRow(result.results[0], movie);

      return {
        id: generateFallbackId(normalized, movie.year),
        title: normalized,
        year: movie.year,
        letterboxdSlug: movie.slug,
        friendCount: movie.friendCount,
        friendList: movie.friendList,
      };
    } catch (e) {
      debugLog(env, `Enhance error for ${movie.title}: ${String(e)}`);
      const { normalized: fallbackTitle } = normalizeTitleForSearch(
        movie.title
      );
      return {
        id: generateFallbackId(fallbackTitle, movie.year),
        title: fallbackTitle,
        year: movie.year,
        letterboxdSlug: movie.slug,
        friendCount: movie.friendCount,
        friendList: movie.friendList,
      };
    }
  }

  const resolved = await Promise.all(movies.map(resolveMovie));
  return resolved;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  try {
    const body = (await request.json()) as {
      usernames?: string[];
      username?: string;
      friends?: string[];
    };
    let usernames: string[] = [];
    if (body.usernames && Array.isArray(body.usernames))
      usernames = body.usernames;
    else if (body.username && body.friends && Array.isArray(body.friends))
      usernames = [body.username, ...body.friends];
    usernames = usernames
      .filter((u) => u && typeof u === "string")
      .map((u) => u.trim())
      .slice(0, 10);
    if (usernames.length < 2)
      return new Response(
        JSON.stringify({ error: "At least 2 usernames are required" }),
        { status: 400 }
      );

    const watchlists = await Promise.all(
      usernames.map(async (u, idx) => {
        if (idx > 0) await new Promise((r) => setTimeout(r, 500));
        const movies = await scrapeLetterboxdWatchlist(u, env);
        return { username: u, movies };
      })
    );

    console.log(
      "DEBUG: watchlists sizes",
      watchlists.map((w) => ({ username: w.username, size: w.movies.length }))
    );
    const commonMovies = findCommonMovies(watchlists);
    console.log("DEBUG: commonMovies count", commonMovies.length);
    const enhanced = await enhanceWithTMDBData(commonMovies, env);

    const moviesWithFilteredFriends = enhanced.map((m) => ({
      ...m,
      friendList: Array.from(new Set(m.friendList)),
      friendCount: Array.from(new Set(m.friendList)).length,
    }));
    const moviesWithMultipleFriends = moviesWithFilteredFriends.filter(
      (m) => m.friendCount >= 2
    );
    moviesWithMultipleFriends.sort(
      (a, b) =>
        b.friendCount - a.friendCount ||
        (b.vote_average || 0) - (a.vote_average || 0)
    );

    return new Response(
      JSON.stringify({
        movies: moviesWithMultipleFriends,
        commonCount: moviesWithMultipleFriends.length,
        usernames,
        watchlistSizes: watchlists.map((w) => ({
          username: w.username,
          size: w.movies.length,
        })),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Comparison error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Failed to compare watchlists",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
