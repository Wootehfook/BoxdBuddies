// AI Generated: GitHub Copilot - 2025-08-29
// Letterboxd Watchlist Comparison API - Renamed to avoid adblocker issues
// Deployment trigger: Enhanced matching algorithm with multi-strategy normalization

// D1PreparedStatement type intentionally omitted here to avoid unused-local errors

// D1Result omitted to avoid unused-local errors

import { debugLog, parseGenresToNames } from "../../_lib/common";
import type { Env as CacheEnv } from "../../letterboxd/cache/index.js";

type Env = CacheEnv;

// Small types used locally
interface LetterboxdMovie {
  title: string;
  year: number;
  slug: string;
}

interface CommonMovie extends LetterboxdMovie {
  friendCount: number;
  friendList: string[];
}

interface Movie {
  id: number;
  title: string;
  year: number;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
  director?: string;
  runtime?: number;
  genres?: string[];
  letterboxdSlug?: string;
  friendCount: number;
  friendList: string[];
  source?: string;
}

interface ComparisonRequestBody {
  username?: string;
  friends?: string[];
  usernames?: string[]; // Legacy support
}

const replaceAllSafe = (
  input: string,
  pattern: RegExp | string,
  replacement: string
) => {
  if (typeof pattern === "string") {
    return input.split(pattern).join(replacement);
  }
  return input.replace(pattern, replacement);
};

const replaceAllCompat = (
  input: string,
  pattern: RegExp,
  replacement: string | ((substring: string, ...args: string[]) => string)
) => {
  const candidate = input as string & {
    replaceAll?: (
      p: RegExp,
      r: string | ((substring: string, ...args: string[]) => string)
    ) => string;
  };
  if (typeof candidate.replaceAll === "function") {
    return candidate.replaceAll(pattern, replacement);
  }
  if (typeof replacement === "string") {
    return input.replace(pattern, replacement);
  }
  return input.replace(pattern, replacement);
};

// Utility helpers
const normalizeTitle = (t: string) => {
  let out = t.toLowerCase().trim();
  out = replaceAllCompat(out, /[\u2018\u2019\u201C\u201D'"`]/g, ""); // quotes
  out = replaceAllCompat(out, /[\p{P}\p{S}]/gu, " "); // punctuation and symbols
  out = replaceAllCompat(out, /\s+/g, " ");
  return out;
};

const decodeHtmlEntities = (str: string): string => {
  let out = replaceAllCompat(str, /&#(\d+);/g, (_: string, dec: string) =>
    String.fromCodePoint(Number.parseInt(dec, 10))
  );
  out = replaceAllCompat(out, /&#x([0-9a-fA-F]+);/g, (_: string, hex: string) =>
    String.fromCodePoint(Number.parseInt(hex, 16))
  );
  // Unescape named entities first, then '&' last to avoid double-unescaping
  out = replaceAllSafe(out, "&apos;", "'");
  out = replaceAllSafe(out, "&quot;", '"');
  out = replaceAllSafe(out, "&lt;", "<");
  out = replaceAllSafe(out, "&gt;", ">");
  out = replaceAllSafe(out, "&copy;", "©");
  out = replaceAllSafe(out, "&amp;", "&");
  return out;
};

const parseYear = (date?: string | null): number => {
  if (!date) return 0;
  const m = /^(\d{4})/.exec(date);
  return m ? Number.parseInt(m[1], 10) : 0;
};

const trimEndWhitespace = (value: string) => {
  let end = value.length;
  while (end > 0 && /\s/.test(value[end - 1])) end--;
  return value.slice(0, end);
};

const extractTrailingYear = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length < 4) return { title: trimmed, year: 0, hasYear: false };
  const yearStr = trimmed.slice(-4);
  if (!/^\d{4}$/.test(yearStr)) {
    return { title: trimmed, year: 0, hasYear: false };
  }
  let title = trimEndWhitespace(trimmed.slice(0, -4));
  if (title.endsWith("(")) {
    title = trimEndWhitespace(title.slice(0, -1));
  }
  if (!title) return { title: trimmed, year: 0, hasYear: false };
  return { title, year: Number.parseInt(yearStr, 10), hasYear: true };
};

const parseTitleYear = (raw: string) => {
  const decoded = decodeHtmlEntities(raw);
  const extracted = extractTrailingYear(decoded);
  if (extracted.hasYear) {
    return {
      title: extracted.title.trim(),
      year: extracted.year,
    };
  }
  return { title: decoded.trim(), year: 0 };
};

const addMovieFromRaw = (
  out: LetterboxdMovie[],
  seenSlugs: Set<string>,
  slug: string,
  raw: string
) => {
  const s = slug.trim();
  if (!s || seenSlugs.has(s)) return;
  const { title, year } = parseTitleYear(raw);
  out.push({ title, year, slug: s });
  seenSlugs.add(s);
};

const findNearbyTitle = (chunk: string) =>
  /data-item-name=["']([^"'<>]+)["']/i.exec(chunk)?.[1] ||
  /data-film-name=["']([^"'<>]+)["']/i.exec(chunk)?.[1] ||
  /alt=["']([^"'<>]+)["']/i.exec(chunk)?.[1];

const sliceBounded = (
  html: string,
  startIndex: number,
  maxLen: number,
  endTag?: string
) => {
  const limit = Math.min(html.length, startIndex + maxLen);
  if (endTag) {
    const endIndex = html.indexOf(endTag, startIndex);
    if (endIndex !== -1) {
      const end = Math.min(limit, endIndex + endTag.length);
      if (end > startIndex) return html.slice(startIndex, end);
    }
  }
  return html.slice(startIndex, limit);
};

const scanGridItems = (
  html: string,
  out: LetterboxdMovie[],
  seenSlugs: Set<string>
) => {
  const gridItemOpenTag =
    /<li\b[^>]*\bclass=["'][^"']*\bgriditem\b[^"']*["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = gridItemOpenTag.exec(html)) !== null) {
    const openTag = m[0];
    const slug = /data-item-slug=["']([^"'<>]+)["']/i.exec(openTag)?.[1];
    const name = /data-item-name=["']([^"'<>]+)["']/i.exec(openTag)?.[1];
    if (!slug || !name) continue;
    addMovieFromRaw(out, seenSlugs, slug, name);
  }
};

const scanPosterItems = (
  html: string,
  out: LetterboxdMovie[],
  seenSlugs: Set<string>
) => {
  const posterLiOpenTag =
    /<li\b[^>]*\bclass=["'][^"']*\bposter-container\b[^"']*["'][^>]*>/gi;
  let liMatch: RegExpExecArray | null;
  while ((liMatch = posterLiOpenTag.exec(html)) !== null) {
    const liBlock = sliceBounded(html, liMatch.index, 2000, "</li>");
    const slug = /data-film-slug=["']([^"'<>]+)["']/i.exec(liBlock)?.[1];
    const nameAttr = /data-item-name=["']([^"'<>]+)["']/i.exec(liBlock)?.[1];
    const imgAlt = /<img\b[^>]*\balt=["']([^"'<>]+)["'][^>]*>/i.exec(
      liBlock
    )?.[1];
    const raw = nameAttr || imgAlt;
    if (!slug || !raw) continue;
    addMovieFromRaw(out, seenSlugs, slug, raw);
  }
};

const scanGenericSlugs = (
  html: string,
  out: LetterboxdMovie[],
  seenSlugs: Set<string>
) => {
  const genericSlugRegex = /data-film-slug=["']([a-z0-9-]+)["']/gi;
  let gm: RegExpExecArray | null;
  while ((gm = genericSlugRegex.exec(html)) !== null) {
    const slug = (gm[1] || "").trim();
    if (!slug || seenSlugs.has(slug)) continue;
    const tail = html.slice(gm.index, Math.min(html.length, gm.index + 400));
    const raw = findNearbyTitle(tail);
    if (!raw) continue;
    addMovieFromRaw(out, seenSlugs, slug, raw);
  }
};

const scanLinkFallback = (
  html: string,
  out: LetterboxdMovie[],
  seenSlugs: Set<string>
) => {
  const linkRegex = /href=["']\/film\/([a-z0-9-]+)\/["'][^>]*>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRegex.exec(html)) !== null) {
    const slug = (lm[1] || "").trim();
    if (!slug || seenSlugs.has(slug)) continue;
    const tail = html.slice(lm.index, Math.min(html.length, lm.index + 400));
    const altMatch = /alt=["']([^"'<>]+)["']/i.exec(tail);
    const raw = altMatch ? altMatch[1].trim() : replaceAllSafe(slug, "-", " ");
    addMovieFromRaw(out, seenSlugs, slug, raw);
  }
};

const scanTargetLinkFallback = (
  html: string,
  out: LetterboxdMovie[],
  seenSlugs: Set<string>
) => {
  const targetLinkRegex = /data-target-link=["']\/film\/([a-z0-9-]+)\/["']/gi;
  let tm: RegExpExecArray | null;
  while ((tm = targetLinkRegex.exec(html)) !== null) {
    const slug = (tm[1] || "").trim();
    if (!slug || seenSlugs.has(slug)) continue;
    const tail = html.slice(tm.index, Math.min(html.length, tm.index + 400));
    const altMatch = /alt=["']([^"'<>]+)["']/i.exec(tail);
    const nameMatch = /data-item-name=["']([^"'<>]+)["']/i.exec(tail);
    const raw = (altMatch?.[1] || nameMatch?.[1] || "").trim();
    if (!raw) continue;
    addMovieFromRaw(out, seenSlugs, slug, raw);
  }
};

const scanFilmPosterFallback = (
  html: string,
  out: LetterboxdMovie[],
  seenSlugs: Set<string>
) => {
  const marker = "film-poster";
  let idx = html.indexOf(marker);
  while (idx !== -1) {
    const tagStart = html.lastIndexOf("<", idx);
    const tagEnd = html.indexOf(">", idx);
    if (tagStart === -1 || tagEnd === -1) break;
    const nextIdx = html.indexOf(marker, tagEnd + 1);
    const tag = html.slice(tagStart, tagEnd + 1);
    if (!/class=/.test(tag) || !/film-poster/.test(tag)) {
      idx = nextIdx;
      continue;
    }
    const chunk = sliceBounded(html, tagStart, 600);
    const slug =
      /data-film-slug=["']([a-z0-9-]+)["']/i.exec(chunk)?.[1] ||
      /data-target-link=["']\/film\/([a-z0-9-]+)\/["']/i.exec(chunk)?.[1] ||
      /href=["']\/film\/([a-z0-9-]+)\/["']/i.exec(chunk)?.[1];
    const raw = findNearbyTitle(chunk);
    if (!slug || !raw || seenSlugs.has(slug)) {
      idx = nextIdx;
      continue;
    }
    addMovieFromRaw(out, seenSlugs, slug, raw);
    idx = nextIdx;
  }
};

// Parse Letterboxd watchlist page HTML for grid items. Lightweight and resilient.
function parseMoviesFromHtml(html: string): LetterboxdMovie[] {
  const out: LetterboxdMovie[] = [];
  const seenSlugs = new Set<string>();
  scanGridItems(html, out, seenSlugs);
  scanPosterItems(html, out, seenSlugs);
  scanGenericSlugs(html, out, seenSlugs);
  scanLinkFallback(html, out, seenSlugs);
  scanTargetLinkFallback(html, out, seenSlugs);
  scanFilmPosterFallback(html, out, seenSlugs);

  return out;
}

async function fetchWatchlistPage(
  username: string,
  page: number,
  env: Env
): Promise<LetterboxdMovie[]> {
  const url =
    page === 1
      ? `https://letterboxd.com/${username}/watchlist/`
      : `https://letterboxd.com/${username}/watchlist/page/${page}/`;
  const res = await fetch(url, {
    headers: {
      // Use a realistic browser UA and headers to avoid simplistic bot gating
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://letterboxd.com/",
      "Cache-Control": "no-cache",
    },
  });
  if (!res.ok) {
    if (res.status === 404 && page > 1) return [];
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const html = await res.text();
  debugLog(
    env,
    `Fetched HTML for ${username} page ${page}: length=${html.length}`
  );
  if (html.length > 0) {
    const bodyStart = html.indexOf("<body");
    const sampleStart = Math.max(bodyStart, 0);
    const sample = html.slice(sampleStart, sampleStart + 500).trim();
    const normalizedSample = replaceAllCompat(sample, /\s+/g, " ");
    debugLog(env, `HTML sample (from body): ${normalizedSample}`);
  }
  return parseMoviesFromHtml(html);
}

const getUsernamesFromBody = (body: ComparisonRequestBody) => {
  if (body.username && body.friends) {
    return { userList: [body.username, ...body.friends] };
  }
  if (body.usernames && Array.isArray(body.usernames)) {
    return { userList: body.usernames };
  }
  return {
    userList: [],
    error: "Either { username, friends } or { usernames } is required",
  };
};

const initDebugInfo = (usernames: string[]) => ({
  requestReceived: {
    usernames: usernames,
    timestamp: new Date().toISOString(),
  },
  scrapingResults: {},
  movieCounts: {},
  sampleMovies: {},
  matchingInfo: {
    totalUnique: 0,
    commonCount: 0,
    commonMovies: [],
  },
  db: {
    tmdb_catalog_count: null,
    enrichment_hits: 0,
    enrichment_misses: 0,
  },
});

const scrapeAllWatchlists = async (
  usernames: string[],
  env: Env,
  debugInfo: any
) => {
  const watchlistPromises = usernames.map(async (username, index) => {
    const baseDelay = 500; // Start with 500ms
    const maxDelay = 3000; // Max 3 seconds
    const delay = Math.min(baseDelay * Math.pow(1.5, index), maxDelay);

    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const startTime = Date.now();
    try {
      const movies = await scrapeLetterboxdWatchlist(username, env);
      const duration = Date.now() - startTime;
      debugLog(
        env,
        `Scraped ${username}: ${movies.length} movies in ${duration}ms`
      );

      debugInfo.scrapingResults[username] = {
        count: movies.length,
        timeMs: duration,
        success: movies.length > 0,
      };
      debugInfo.movieCounts[username] = movies.length;
      debugInfo.sampleMovies[username] = movies.slice(0, 3).map((m) => ({
        title: m.title,
        year: m.year,
      }));

      return { username, movies, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Failed to scrape ${username} after ${duration}ms:`, error);

      debugInfo.scrapingResults[username] = {
        count: 0,
        timeMs: duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
      };

      throw error;
    }
  });

  const scrapingTimeout = 30000; // 30 second timeout
  return Promise.race([
    Promise.all(watchlistPromises),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Watchlist scraping timeout")),
        scrapingTimeout
      )
    ),
  ]);
};

const logWatchlistSamples = (watchlists: any[], env: Env) => {
  watchlists.forEach((watchlist) => {
    debugLog(
      env,
      `${watchlist.username} sample movies:`,
      watchlist.movies
        .slice(0, 5)
        .map((m: LetterboxdMovie) => `"${m.title}" (${m.year})`)
    );
    debugLog(
      env,
      `${watchlist.username} normalized samples:`,
      watchlist.movies.slice(0, 3).map((m: LetterboxdMovie) => {
        const normalized = normalizeTitle(m.title);
        return `"${normalized}" (${m.year})`;
      })
    );
  });
};

const updateMatchingDebug = (
  watchlists: { username: string; movies: LetterboxdMovie[] }[],
  commonMovies: CommonMovie[],
  debugInfo: any
) => {
  debugInfo.matchingInfo.totalUnique = new Set(
    watchlists.flatMap((w) => w.movies.map((m) => `${m.title}-${m.year}`))
  ).size;
  debugInfo.matchingInfo.commonCount = commonMovies.length;
  debugInfo.matchingInfo.commonMovies = commonMovies.slice(0, 5).map((m) => ({
    title: m.title,
    year: m.year,
    users: m.friendList,
  }));
};

const reportTmdbCatalogCount = async (env: Env, debugInfo: any) => {
  try {
    const countRes = await env.MOVIES_DB.prepare(
      `SELECT COUNT(*) as c FROM tmdb_movies`
    ).first();
    debugInfo.db.tmdb_catalog_count =
      (countRes && (countRes.c || countRes["c"])) || 0;
  } catch (err) {
    debugInfo.db.tmdb_catalog_count = null;
    debugLog(
      env,
      "Failed to read tmdb_movies count for debug:",
      err instanceof Error ? err.message : String(err)
    );
  }
};

const enhanceCommonMovies = async (
  commonMovies: CommonMovie[],
  env: Env,
  debugInfo: any
) => {
  const { isDebug } = await import("../../_lib/common");
  const enableMatchingDebug = Boolean(
    isDebug(env) || (env && (env as any).DEBUG_MATCHING)
  );
  const enhancedMovies = await enhanceWithTMDBData(
    commonMovies,
    env,
    enableMatchingDebug ? debugInfo : undefined
  );
  if (!enableMatchingDebug && debugInfo?.matchingInfo) {
    delete debugInfo.matchingInfo.candidates;
  }
  return { enhancedMovies, enableMatchingDebug };
};

const updateEnrichmentStats = (
  enhancedMovies: Movie[],
  debugInfo: any,
  env: Env
) => {
  try {
    enhancedMovies.forEach((m) => {
      if ((m.source || "db") === "db") debugInfo.db.enrichment_hits++;
      else debugInfo.db.enrichment_misses++;
    });
  } catch (err) {
    debugLog(
      env,
      "Failed to compute enrichment telemetry:",
      err instanceof Error ? err.message : String(err)
    );
  }

  const sourceCounts: Record<string, number> = {};
  enhancedMovies.forEach((m) => {
    const src = m.source || "unknown";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  debugInfo.enrichment = { sourceCounts };
};

let fallbackIdCounter = 0;
const nextFallbackId = () => {
  fallbackIdCounter = (fallbackIdCounter + 1) % 1_000_000;
  return fallbackIdCounter;
};

export async function scrapeLetterboxdWatchlist(
  username: string,
  env: Env
): Promise<LetterboxdMovie[]> {
  const all: LetterboxdMovie[] = [];
  const maxPages = 10;
  debugLog(env, `Starting scrape for ${username}`);
  for (let p = 1; p <= maxPages; p++) {
    const pageMovies = await fetchWatchlistPage(username, p, env);
    all.push(...pageMovies);
    if (pageMovies.length === 0) break;
    // polite delay

    await new Promise((r) => setTimeout(r, 400));
  }
  debugLog(env, `Scraped ${all.length} movies for ${username}`);
  return all;
}

export function findCommonMovies(
  watchlists: { username: string; movies: LetterboxdMovie[] }[],
  _env?: Env
): CommonMovie[] {
  if (watchlists.length < 2) return [];
  const map = new Map<
    string,
    { movie: LetterboxdMovie; users: string[]; count: number }
  >();
  for (const w of watchlists) {
    const seen = new Set<string>();
    for (const m of w.movies) {
      if (seen.has(m.slug)) continue;
      const ex = map.get(m.slug);
      if (ex) {
        ex.count++;
        if (!ex.users.includes(w.username)) ex.users.push(w.username);
      } else {
        map.set(m.slug, { movie: { ...m }, users: [w.username], count: 1 });
      }
      seen.add(m.slug);
    }
  }
  const common = Array.from(map.values())
    .filter((v) => v.count >= 2)
    .map((v) => ({ ...v.movie, friendCount: v.count, friendList: v.users }));
  common.sort((a, b) => b.friendCount - a.friendCount || b.year - a.year);
  return common;
}

export async function enhanceWithTMDBData(
  movies: CommonMovie[],
  env: Env,
  debugInfo?: any
): Promise<Movie[]> {
  if (movies.length === 0) return [];
  const BATCH = 10;
  const out: Movie[] = [];

  const mapTmdb = (row: any, base: CommonMovie, source: string): Movie => {
    // Parse genres via shared helper
    const gnames = parseGenresToNames(row.genres);
    const genres: string[] | undefined = gnames ? [...gnames] : undefined;

    return {
      id: Number(row.id),
      title: row.title || row.original_title || base.title,
      year: Number(row.year ?? parseYear(row.release_date) ?? base.year),
      poster_path: row.poster_path ?? null,
      overview: row.overview ?? undefined,
      vote_average:
        typeof row.vote_average === "number" ? row.vote_average : undefined,
      director: row.director ?? undefined,
      runtime: typeof row.runtime === "number" ? row.runtime : undefined,
      genres,
      letterboxdSlug: base.slug,
      friendCount: base.friendCount,
      friendList: base.friendList,
      source,
    };
  };

  const mapRowsForDebug = (rows: any[] | undefined) =>
    (rows || []).map((r) => ({
      id: r.id,
      title: r.title,
      original_title: r.original_title,
      year: r.year,
      popularity: r.popularity,
    }));

  const findRow = async (m: CommonMovie) => {
    let year = Number.isFinite(m.year) ? m.year : 0;
    let title = m.title || "";
    const extracted = extractTrailingYear(title);
    if (extracted.hasYear) {
      if (!year) year = extracted.year;
      title = extracted.title.trim();
    }

    const key = m.slug || `${m.title}-${m.year}`;
    if (debugInfo?.matchingInfo) {
      debugInfo.matchingInfo.candidates =
        debugInfo.matchingInfo.candidates || {};
      debugInfo.matchingInfo.candidates[key] =
        debugInfo.matchingInfo.candidates[key] || {};
    }

    const exactWithYear = async () => {
      const res = await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies WHERE (LOWER(title)=LOWER(?) OR LOWER(original_title)=LOWER(?)) AND (? = 0 OR year IS NULL OR abs(year - ?) <= 1) ORDER BY popularity DESC LIMIT 1`
      )
        .bind(title, title, year, year)
        .all();
      if (debugInfo?.matchingInfo)
        debugInfo.matchingInfo.candidates[key].exactWithYear = mapRowsForDebug(
          res.results
        );
      return res.results?.[0] ?? null;
    };

    const likeWithYear = async () => {
      const res = await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies WHERE (title LIKE ? OR original_title LIKE ?) AND (? = 0 OR year IS NULL OR abs(year - ?) <= 1) ORDER BY popularity DESC LIMIT 1`
      )
        .bind(`%${title}%`, `%${title}%`, year, year)
        .all();
      if (debugInfo?.matchingInfo)
        debugInfo.matchingInfo.candidates[key].likeWithYear = mapRowsForDebug(
          res.results
        );
      return res.results?.[0] ?? null;
    };

    const exactNoYear = async () => {
      const res = await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies WHERE LOWER(title)=LOWER(?) OR LOWER(original_title)=LOWER(?) ORDER BY popularity DESC LIMIT 1`
      )
        .bind(title, title)
        .all();
      if (debugInfo?.matchingInfo)
        debugInfo.matchingInfo.candidates[key].exactNoYear = mapRowsForDebug(
          res.results
        );
      return res.results?.[0] ?? null;
    };

    const likeNoYear = async () => {
      const res = await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies WHERE title LIKE ? OR original_title LIKE ? ORDER BY popularity DESC LIMIT 5`
      )
        .bind(`%${title}%`, `%${title}%`)
        .all();
      const candidates = res.results || [];
      if (debugInfo?.matchingInfo)
        debugInfo.matchingInfo.candidates[key].likeNoYear =
          mapRowsForDebug(candidates);
      if (candidates.length === 0) return null;
      const want = normalizeTitle(title);
      const wantYear = year || 0;
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
      return best || null;
    };

    return (
      (await exactWithYear()) ||
      (await likeWithYear()) ||
      (await exactNoYear()) ||
      (await likeNoYear()) ||
      null
    );
  };

  for (let i = 0; i < movies.length; i += BATCH) {
    const batch = movies.slice(i, i + BATCH);

    const results = await Promise.all(
      batch.map(async (m) => {
        try {
          const r = await findRow(m);
          if (r) return mapTmdb(r, m, "db");
          debugLog(env, `D1 miss for "${m.title}" (${m.year})`);
          return {
            id: nextFallbackId(),
            title: m.title,
            year: m.year,
            letterboxdSlug: m.slug,
            friendCount: m.friendCount,
            friendList: m.friendList,
            source: "fallback",
          } as Movie;
        } catch (err) {
          console.error("Enhancement error for", m.title, err);
          return {
            id: nextFallbackId(),
            title: m.title,
            year: m.year,
            letterboxdSlug: m.slug,
            friendCount: m.friendCount,
            friendList: m.friendList,
            source: "fallback",
          } as Movie;
        }
      })
    );
    out.push(...results);
    if (i + BATCH < movies.length) await new Promise((r) => setTimeout(r, 50));
  }
  debugLog(env, `Enhanced ${out.length} movies`);
  return out;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as ComparisonRequestBody;
    const { userList, error } = getUsernamesFromBody(body);
    if (error) {
      return Response.json({ error }, { status: 400 });
    }
    if (userList.length < 2) {
      return Response.json(
        { error: "At least 2 usernames are required for comparison" },
        { status: 400 }
      );
    }

    const usernames = userList
      .filter((u) => u.trim())
      .map((u) => u.trim())
      .slice(0, 10);
    if (usernames.length < 2) {
      return Response.json(
        { error: "At least 2 valid usernames are required" },
        { status: 400 }
      );
    }

    debugLog(env, `Starting comparison for: ${usernames.join(", ")}`);

    const debugInfo: any = initDebugInfo(usernames);

    // AI Generated: GitHub Copilot - 2025-08-29T12:15:00Z
    // Performance Optimization: Smart Rate Limiting - Optimized parallel scraping with intelligent delays
    const watchlists = await scrapeAllWatchlists(usernames, env, debugInfo);

    debugLog(
      env,
      "Watchlist scraping completed:",
      watchlists.map(
        (w) => `${w.username}: ${w.movies.length} movies (${w.duration}ms)`
      )
    );

    // Add debug logging for the first few movies from each user
    logWatchlistSamples(watchlists, env);

    // Find common movies
    const commonMovies = findCommonMovies(watchlists);

    // Update debug info with matching results
    updateMatchingDebug(watchlists, commonMovies, debugInfo);

    debugLog(env, `Common movies found: ${commonMovies.length}`);
    if (commonMovies.length > 0) {
      debugLog(
        env,
        "Sample common movies:",
        commonMovies
          .slice(0, 3)
          .map((m) => `"${m.title}" (${m.year}) - ${m.friendList.join(", ")}`)
      );
    }

    // Enhance with TMDB data
    // Report TMDB catalog size (best-effort) to help debug empty DB issues
    await reportTmdbCatalogCount(env, debugInfo);

    const { enhancedMovies } = await enhanceCommonMovies(
      commonMovies,
      env,
      debugInfo
    );
    updateEnrichmentStats(enhancedMovies, debugInfo, env);

    // Sort by vote average (rating)
    enhancedMovies.sort(
      (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
    );

    // Adaptive caching:
    // - If all results are enriched from DB (source === 'db'), allow a short cache.
    // - If any fallback entries exist (e.g., missing enrichment), disable caching to avoid persisting placeholders.
    const allFromDb =
      enhancedMovies.length > 0 &&
      enhancedMovies.every((m) => (m.source || "db") === "db");
    const cacheHeader = allFromDb
      ? "public, max-age=60, s-maxage=60, stale-while-revalidate=60"
      : "no-store, no-cache, must-revalidate";

    return Response.json(
      {
        movies: enhancedMovies,
        commonCount: enhancedMovies.length,
        usernames: usernames,
        watchlistSizes: watchlists.map((w) => ({
          username: w.username,
          size: w.movies.length,
        })),
        debug: debugInfo, // Always include debug info for troubleshooting
      },
      {
        headers: {
          "Cache-Control": cacheHeader,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    );
  } catch (error) {
    console.error("Comparison error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to compare watchlists",
        details:
          "Make sure all usernames exist on Letterboxd and have public watchlists",
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
