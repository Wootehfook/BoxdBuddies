// AI Generated: GitHub Copilot - 2025-08-29
// Letterboxd Watchlist Comparison API - Renamed to avoid adblocker issues
// Deployment trigger: Enhanced matching algorithm with multi-strategy normalization

// D1PreparedStatement type intentionally omitted here to avoid unused-local errors

// D1Result omitted to avoid unused-local errors

import { debugLog } from "../../_lib/common";
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

// Utility helpers
const normalizeTitle = (t: string) =>
  t
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019\u201C\u201D'"`]/g, "") // quotes
    .replace(/[\p{P}\p{S}]/gu, " ") // punctuation and symbols (unicode-aware)
    .replace(/\s+/g, " ");

const decodeHtmlEntities = (str: string): string => {
  return (
    str
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
      // Unescape named entities first, then '&' last to avoid double-unescaping
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&copy;/g, "©")
      .replace(/&amp;/g, "&")
  );
};

const parseYear = (date?: string | null): number => {
  if (!date) return 0;
  const m = /^(\d{4})/.exec(date);
  return m ? parseInt(m[1], 10) : 0;
};

// Parse Letterboxd watchlist page HTML for grid items. Lightweight and resilient.
function parseMoviesFromHtml(html: string): LetterboxdMovie[] {
  const out: LetterboxdMovie[] = [];
  const seenSlugs = new Set<string>();
  // 1) Modern grid markup variant: <li class="griditem" data-item-slug="..." data-item-name="Title 2021">
  const gridItemOpenTag = /<li[^>]*class=["'][^"']*griditem[^"']*["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  const yearRegex = /^(.*?)\s+(\d{4})$/;
  while ((m = gridItemOpenTag.exec(html)) !== null) {
    const openTag = m[0];
    const slug = /data-item-slug=["']([^"']+)["']/i.exec(openTag)?.[1];
    const name = /data-item-name=["']([^"']+)["']/i.exec(openTag)?.[1];
    if (!slug || !name) continue;
    const decodedName = decodeHtmlEntities(name);
    const ym = yearRegex.exec(decodedName);
    const push = () => {
      if (seenSlugs.has(slug.trim())) return;
      if (ym?.[2])
        out.push({
          title: decodeHtmlEntities(ym[1]).trim(),
          year: parseInt(ym[2], 10),
          slug: slug.trim(),
        });
      else out.push({ title: decodedName.trim(), year: 0, slug: slug.trim() });
      seenSlugs.add(slug.trim());
    };
    push();
  }

  // 2) Legacy/alternate markup: <li class="poster-container" data-film-slug="..."> ... <img alt="Title 2021">
  const posterLiRegex =
    /<li[^>]*class=["'][^"']*poster-container[^"']*["'][^>]*>[\s\S]*?<\/li>/gi;
  let liMatch: RegExpExecArray | null;
  while ((liMatch = posterLiRegex.exec(html)) !== null) {
    const liBlock = liMatch[0];
    const slug = /data-film-slug=["']([^"']+)["']/i.exec(liBlock)?.[1];
    // Accept either data-item-name or <img alt="...">
    const nameAttr = /data-item-name=["']([^"']+)["']/i.exec(liBlock)?.[1];
    const imgAlt = /<img[^>]*alt=["']([^"']+)["'][^>]*>/i.exec(liBlock)?.[1];
    const raw = nameAttr || imgAlt;
    if (!slug || !raw) continue;
    const decodedRaw = decodeHtmlEntities(raw);
    const ym = yearRegex.exec(decodedRaw);
    const s = slug.trim();
    if (seenSlugs.has(s)) continue;
    if (ym?.[2])
      out.push({
        title: decodeHtmlEntities(ym[1]).trim(),
        year: parseInt(ym[2], 10),
        slug: s,
      });
    else out.push({ title: decodedRaw.trim(), year: 0, slug: s });
    seenSlugs.add(s);
  }

  // 3) Generic fallback: scan for data-film-slug and capture a nearby title via
  // data-item-name, data-film-name, or img alt regardless of surrounding tags
  // This helps when the class names change but attribute semantics remain.
  const genericRegex =
    /data-film-slug=["']([^"']+)["'][\s\S]{0,400}?(?:data-item-name=["']([^"']+)["']|data-film-name=["']([^"']+)["']|alt=["']([^"']+)["'])/gi;
  let gm: RegExpExecArray | null;
  while ((gm = genericRegex.exec(html)) !== null) {
    const slug = (gm[1] || "").trim();
    const raw = (gm[2] || gm[3] || gm[4] || "").trim();
    if (!slug || !raw) continue;
    if (seenSlugs.has(slug)) continue;
    const decodedRaw = decodeHtmlEntities(raw);
    const ym = yearRegex.exec(decodedRaw);
    if (ym?.[2])
      out.push({
        title: decodeHtmlEntities(ym[1]).trim(),
        year: parseInt(ym[2], 10),
        slug,
      });
    else out.push({ title: decodedRaw.trim(), year: 0, slug });
    seenSlugs.add(slug);
  }

  // 4) Link-based fallback: scan for /film/<slug>/ anchors and attempt to capture
  // a nearby <img alt="Title 2021"> within a small window. This is resilient to
  // class/attribute churn as long as the link structure remains.
  const linkRegex = /href=["']\/film\/([a-z0-9-]+)\/["'][^>]*>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRegex.exec(html)) !== null) {
    const slug = (lm[1] || "").trim();
    if (!slug || seenSlugs.has(slug)) continue;
    // Look ahead up to 400 chars for an alt title
    const tail = html.slice(lm.index, Math.min(html.length, lm.index + 400));
    const altMatch = /alt=["']([^"']+)["']/i.exec(tail);
    const raw = altMatch ? altMatch[1].trim() : slug.replace(/-/g, " ");
    const decodedRaw = decodeHtmlEntities(raw);
    const ym = yearRegex.exec(decodedRaw);
    const title = ym?.[1]
      ? decodeHtmlEntities(ym[1]).trim()
      : decodedRaw.trim();
    const year = ym?.[2] ? parseInt(ym[2], 10) : 0;
    out.push({ title, year, slug });
    seenSlugs.add(slug);
  }

  // 5) Additional fallback: data-target-link="/film/slug/" with nearby img alt
  const targetLinkRegex =
    /data-target-link=["']\/film\/([a-z0-9-]+)\/["'][\s\S]{0,400}?(?:alt=["']([^"']+)["']|data-item-name=["']([^"']+)["'])/gi;
  let tm: RegExpExecArray | null;
  while ((tm = targetLinkRegex.exec(html)) !== null) {
    const slug = (tm[1] || "").trim();
    const raw = (tm[2] || tm[3] || "").trim();
    if (!slug || !raw || seenSlugs.has(slug)) continue;
    const decodedRaw = decodeHtmlEntities(raw);
    const ym = yearRegex.exec(decodedRaw);
    if (ym?.[2])
      out.push({
        title: decodeHtmlEntities(ym[1]).trim(),
        year: parseInt(ym[2], 10),
        slug,
      });
    else out.push({ title: decodedRaw.trim(), year: 0, slug });
    seenSlugs.add(slug);
  }

  // 6) Film-poster class fallback: <div class="film-poster"> or similar with data attributes
  const filmPosterRegex =
    /<[^>]*class=["'][^"']*film-poster[^"']*["'][^>]*>[\s\S]{0,500}?(?:data-film-slug=["']([^"']+)["']|data-target-link=["']\/film\/([^"']+)\/["']|href=["']\/film\/([^"']+)\/["'])[\s\S]{0,200}?(?:alt=["']([^"']+)["']|data-item-name=["']([^"']+)["'])/gi;
  let fm: RegExpExecArray | null;
  while ((fm = filmPosterRegex.exec(html)) !== null) {
    const slug = (fm[1] || fm[2] || fm[3] || "").trim();
    const raw = (fm[4] || fm[5] || "").trim();
    if (!slug || !raw || seenSlugs.has(slug)) continue;
    const decodedRaw = decodeHtmlEntities(raw);
    const ym = yearRegex.exec(decodedRaw);
    if (ym?.[2])
      out.push({
        title: decodeHtmlEntities(ym[1]).trim(),
        year: parseInt(ym[2], 10),
        slug,
      });
    else out.push({ title: decodedRaw.trim(), year: 0, slug });
    seenSlugs.add(slug);
  }

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
    const sampleStart = bodyStart > 0 ? bodyStart : 0;
    const sample = html
      .slice(sampleStart, sampleStart + 500)
      .replace(/\s+/g, " ")
      .trim();
    debugLog(env, `HTML sample (from body): ${sample}`);
  }
  return parseMoviesFromHtml(html);
}

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
    // Parse genres column (can be JSON string or array of strings/objects)
    let genres: string[] | undefined;
    try {
      const raw = (row as any).genres;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          genres = parsed as string[];
        } else if (
          parsed.length > 0 &&
          parsed[0] &&
          typeof (parsed[0] as any).name === "string"
        ) {
          genres = (parsed as Array<{ id?: number; name: string }>)
            .map((g) => g.name)
            .filter(Boolean);
        }
      }
    } catch {
      // ignore parse errors; leave genres undefined
    }

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
    const ym = /\((\d{4})\)\s*$/.exec(title);
    if (ym?.[1]) {
      const p = Number(ym[1]);
      if (!year) year = p;
      title = title.replace(/\s*\(\d{4}\)\s*$/, "").trim();
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
            id: Math.floor(Math.random() * 1_000_000),
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
            id: Math.floor(Math.random() * 1_000_000),
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
    const body = (await request.json()) as {
      username?: string;
      friends?: string[];
      usernames?: string[]; // Legacy support
    };

    // Support both formats: new format { username, friends } and legacy { usernames }
    let allUsernames: string[];
    if (body.username && body.friends) {
      // New format: user + friends
      allUsernames = [body.username, ...body.friends];
    } else if (body.usernames && Array.isArray(body.usernames)) {
      // Legacy format
      allUsernames = body.usernames;
    } else {
      return Response.json(
        { error: "Either { username, friends } or { usernames } is required" },
        { status: 400 }
      );
    }

    if (allUsernames.length < 2) {
      return Response.json(
        { error: "At least 2 usernames are required for comparison" },
        { status: 400 }
      );
    }

    const usernames = allUsernames
      .filter((u) => u.trim())
      .map((u) => u.trim())
      .slice(0, 10); // Limit to 10 users

    if (usernames.length < 2) {
      return Response.json(
        { error: "At least 2 valid usernames are required" },
        { status: 400 }
      );
    }

    debugLog(env, `Starting comparison for: ${usernames.join(", ")}`);

    // Create debug data structure for troubleshooting
    const debugInfo: any = {
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
    };

    // AI Generated: GitHub Copilot - 2025-08-29T12:15:00Z
    // Performance Optimization: Smart Rate Limiting - Optimized parallel scraping with intelligent delays
    const watchlistPromises = usernames.map(async (username, index) => {
      // Implement exponential backoff for rate limiting
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

        // Capture debug info
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
        console.error(
          `Failed to scrape ${username} after ${duration}ms:`,
          error
        );

        // Capture error in debug info
        debugInfo.scrapingResults[username] = {
          count: 0,
          timeMs: duration,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
          stack: error instanceof Error ? error.stack : undefined,
        };

        throw error;
      }
    });

    // Execute all scraping operations with timeout protection
    const scrapingTimeout = 30000; // 30 second timeout
    const watchlists = await Promise.race([
      Promise.all(watchlistPromises),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Watchlist scraping timeout")),
          scrapingTimeout
        )
      ),
    ]);

    debugLog(
      env,
      "Watchlist scraping completed:",
      watchlists.map(
        (w) => `${w.username}: ${w.movies.length} movies (${w.duration}ms)`
      )
    );

    // Add debug logging for the first few movies from each user
    watchlists.forEach((watchlist) => {
      debugLog(
        env,
        `${watchlist.username} sample movies:`,
        watchlist.movies.slice(0, 5).map((m) => `"${m.title}" (${m.year})`)
      );

      // Also show normalized versions to help debug matching issues
      debugLog(
        env,
        `${watchlist.username} normalized samples:`,
        watchlist.movies.slice(0, 3).map((m) => {
          const normalized = normalizeTitle(m.title);
          return `"${normalized}" (${m.year})`;
        })
      );
    });

    // Find common movies
    const commonMovies = findCommonMovies(watchlists);

    // Update debug info with matching results
    debugInfo.matchingInfo.totalUnique = new Set(
      watchlists.flatMap((w) => w.movies.map((m) => `${m.title}-${m.year}`))
    ).size;
    debugInfo.matchingInfo.commonCount = commonMovies.length;
    debugInfo.matchingInfo.commonMovies = commonMovies.slice(0, 5).map((m) => ({
      title: m.title,
      year: m.year,
      users: m.friendList,
    }));

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
    try {
      const countRes = await env.MOVIES_DB.prepare(
        `SELECT COUNT(*) as c FROM tmdb_movies`
      ).first();
      debugInfo.db.tmdb_catalog_count =
        (countRes && (countRes.c || countRes["c"])) || 0;
    } catch (err) {
      // Best-effort only: if the DB read fails, record null but continue
      debugInfo.db.tmdb_catalog_count = null;
      debugLog(
        env,
        "Failed to read tmdb_movies count for debug:",
        err instanceof Error ? err.message : String(err)
      );
    }

    // Gate detailed matching candidates telemetry. Enable when isDebug(env) or env.DEBUG_MATCHING is truthy.
    // Use shared helper isDebug to decide whether to enable verbose matching telemetry
    const { isDebug } = await import("../../_lib/common");
    const enableMatchingDebug = Boolean(
      isDebug(env) || (env && (env as any).DEBUG_MATCHING)
    );
    const enhancedMovies = await enhanceWithTMDBData(
      commonMovies,
      env,
      enableMatchingDebug ? debugInfo : undefined
    );

    // Count how many movies were enriched from DB vs fallback
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

    // Append simple enrichment stats to debug
    const sourceCounts: Record<string, number> = {};
    enhancedMovies.forEach((m) => {
      const src = m.source || "unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    debugInfo.enrichment = { sourceCounts };

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

    // If matching debug is disabled, strip verbose candidates from debug info before returning
    if (!enableMatchingDebug && debugInfo?.matchingInfo) {
      delete debugInfo.matchingInfo.candidates;
    }

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
