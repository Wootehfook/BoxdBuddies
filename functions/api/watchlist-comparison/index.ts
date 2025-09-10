// AI Generated: GitHub Copilot - 2025-08-29
// Letterboxd Watchlist Comparison API - Renamed to avoid adblocker issues
// Deployment trigger: Enhanced matching algorithm with multi-strategy normalization

// D1PreparedStatement type intentionally omitted here to avoid unused-local errors

// D1Result omitted to avoid unused-local errors

import { debugLog } from "../../_lib/common";
import type { Env as CacheEnv } from "../../letterboxd/cache/index.js";
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
  poster_path?: string;
  overview?: string;
  vote_average?: number;
  director?: string;
  runtime?: number;
  genres?: string[]; // Array of genre names
  letterboxdSlug?: string;
  friendCount: number;
  friendList: string[];
  // AI Generated: GitHub Copilot - 2025-08-30
  // Source information for debugging/telemetry (db | tmdb_api | fallback)
  source?: string;
}

// (Removed unused testLetterboxdConnection helper to satisfy lint rules)

// Simple Letterboxd scraper with pagination support
async function scrapeLetterboxdWatchlist(
  username: string,
  env?: Env
): Promise<LetterboxdMovie[]> {
  const allMovies: LetterboxdMovie[] = [];
  let page = 1;
  const maxPages = 10; // Safety limit to prevent infinite loops

  debugLog(env, `Starting scrape for ${username}`);

  while (page <= maxPages) {
    const url =
      page === 1
        ? `https://letterboxd.com/${username}/watchlist/`
        : `https://letterboxd.com/${username}/watchlist/page/${page}/`;

    debugLog(env, `Scraping page ${page} for ${username}: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "BoxdBuddy/1.1.0 (https://boxdbuddy.pages.dev) - Watchlist Comparison Tool",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      if (!response.ok) {
        if (response.status === 404 && page > 1) {
          debugLog(
            env,
            `Page ${page} not found for ${username}, stopping pagination`
          );
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      debugLog(env, `Page ${page} HTML length: ${html.length}`);

      // AI Generated: GitHub Copilot - 2025-08-30
      // Improved parsing: find all griditem elements first, then extract attributes
      const gridItemRegex =
        /<li[^>]*class="[^"]*griditem[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
      let gridMatch;
      let pageMovieCount = 0;

      while ((gridMatch = gridItemRegex.exec(html)) !== null) {
        const gridContent = gridMatch[1];

        // Extract slug and title from within this grid item
        const slugMatch = gridContent.match(/data-item-slug="([^"]+)"/);
        const nameMatch = gridContent.match(/data-item-name="([^"]+)"/);

        if (slugMatch && nameMatch) {
          const slug = slugMatch[1];
          const titleWithYear = nameMatch[1];
          pageMovieCount++;

          // Extract title and year from "Title Year" format
          const yearRegex = /^(.+?)\s+(\d{4})$/;
          const yearMatch = yearRegex.exec(titleWithYear);
          if (yearMatch) {
            allMovies.push({
              title: yearMatch[1].trim(),
              year: parseInt(yearMatch[2]),
              slug: slug,
            });
          } else {
            // No year found, use 0 as default
            allMovies.push({
              title: titleWithYear.trim(),
              year: 0,
              slug: slug,
            });
          }

          // Debug: Log first few matches from first page
          if (page === 1 && pageMovieCount <= 3) {
            debugLog(
              env,
              `Page ${page} Match ${pageMovieCount}: slug="${slug}", title="${titleWithYear}"`
            );
          }
        }
      }

      debugLog(env, `Page ${page}: found ${pageMovieCount} movies`);

      // If no movies found on this page, we've reached the end
      if (pageMovieCount === 0) {
        debugLog(env, `No movies found on page ${page}, stopping pagination`);
        break;
      }

      // Rate limiting between pages
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
      }

      page++;
    } catch (error) {
      console.error(`Error scraping page ${page} for ${username}:`, error);
      if (page === 1) {
        // If first page fails, throw the error
        throw error;
      } else {
        // For subsequent pages, just stop pagination
        debugLog(env, `Stopping pagination due to error on page ${page}`);
        break;
      }
    }
  }

  debugLog(
    env,
    `Scraped ${allMovies.length} total movies from ${username}'s watchlist across ${page - 1} pages`
  );
  return allMovies;
}

// AI Generated: GitHub Copilot - 2025-08-29T12:30:00Z
// Performance Optimization: Efficient Common Movies Algorithm - Optimized intersection finding for large datasets

// Extended movie interface for common movies with user information
interface CommonMovie extends LetterboxdMovie {
  friendCount: number;
  friendList: string[];
}

// Find movies that appear in multiple watchlists using efficient set operations
function findCommonMovies(
  watchlists: { username: string; movies: LetterboxdMovie[] }[],
  env?: Env
): CommonMovie[] {
  if (watchlists.length < 2) return [];

  const startTime = Date.now();

  // Create a map for efficient lookups: normalized key -> {movie, users[], count}
  const movieMap = new Map<
    string,
    { movie: LetterboxdMovie; users: string[]; count: number }
  >();

  // Process each watchlist and build the movie map
  for (const watchlist of watchlists) {
    debugLog(
      env,
      `Processing ${watchlist.username} with ${watchlist.movies.length} movies`
    );

    // Use a Set to track movies we've already processed for this user
    const processedMovies = new Set<string>();

    for (const movie of watchlist.movies) {
      // AI Generated: GitHub Copilot - 2025-08-30
      // Use Letterboxd slug as primary key - more reliable than title normalization
      const movieKey = movie.slug;

      // Skip if we've already processed this movie for this user
      if (processedMovies.has(movieKey)) continue;

      // Check if this movie already exists in our map
      const existing = movieMap.get(movieKey);
      if (existing) {
        // Movie already exists, increment count and add user
        existing.count++;
        if (!existing.users.includes(watchlist.username)) {
          existing.users.push(watchlist.username);
        }
        debugLog(
          env,
          `Found common movie: "${movie.title}" (${movie.year}) slug="${movie.slug}" - now with users: ${existing.users.join(", ")}`
        );
      } else {
        // First time seeing this movie
        movieMap.set(movieKey, {
          movie: { ...movie }, // Clone to avoid mutations
          users: [watchlist.username],
          count: 1,
        });
      }

      processedMovies.add(movieKey);
    }
  }

  debugLog(env, `Total unique movies in map: ${movieMap.size}`);
  const moviesWithMultipleUsers = Array.from(movieMap.values()).filter(
    (m) => m.count >= 2
  );
  debugLog(env, `Movies with count >= 2: ${moviesWithMultipleUsers.length}`);

  // Debug: Show some sample movies with counts
  debugLog(env, "Sample movie map entries (slug-based keys):");
  const sampleEntries = Array.from(movieMap.entries()).slice(0, 5);
  sampleEntries.forEach(([key, data]) => {
    debugLog(
      env,
      `  slug="${key}": "${data.movie.title}" (${data.movie.year}) count=${data.count}, users=[${data.users.join(", ")}]`
    );
  });

  if (moviesWithMultipleUsers.length > 0) {
    debugLog(env, "Movies with multiple users:");
    moviesWithMultipleUsers.slice(0, 3).forEach((data) => {
      debugLog(
        env,
        `  "${data.movie.title}" (${data.movie.year}): count=${data.count}, users=[${data.users.join(", ")}]`
      );
    });
  }

  // Filter to movies that appear in at least 2 watchlists
  const commonMovies: CommonMovie[] = [];
  Array.from(movieMap.values()).forEach((data) => {
    if (data.count >= 2) {
      // Add user information to the movie for frontend display
      const movieWithUsers: CommonMovie = {
        ...data.movie,
        friendCount: data.count,
        friendList: data.users,
      };
      commonMovies.push(movieWithUsers);
    }
  });

  // Sort by popularity (movies with more users first, then by year)
  commonMovies.sort((a, b) => {
    // Primary sort: more users first
    if (a.friendCount !== b.friendCount) {
      return b.friendCount - a.friendCount;
    }
    // Secondary sort: by year (newer first)
    return b.year - a.year;
  });

  const duration = Date.now() - startTime;
  debugLog(
    env,
    `Found ${commonMovies.length} common movies in ${duration}ms using simplified algorithm`
  );

  return commonMovies;
}

// AI Generated: GitHub Copilot - 2025-08-30
// Helpers for TMDB data processing
const normalizeTitle = (t: string) =>
  t
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019\u201C\u201D'"`]/g, "") // quotes
    .replace(/[:.,!\-–—()\[\]{}]/g, " ") // punctuation
    .replace(/\s+/g, " ");

const parseYear = (date?: string | null): number => {
  if (!date) return 0;
  const m = /^(\d{4})/.exec(date);
  return m ? parseInt(m[1]) : 0;
};

// AI Generated: GitHub Copilot - 2025-08-29T12:00:00Z
// Performance Optimization: Parallel Processing - Enhanced TMDB data processing with batch queries and concurrency control

// Enhance movies with TMDB data from database using parallel processing
async function enhanceWithTMDBData(
  movies: CommonMovie[],
  env: Env
): Promise<Movie[]> {
  if (movies.length === 0) return [];

  const BATCH_SIZE = 10; // Process 10 movies concurrently
  const enhancedMovies: Movie[] = [];

  const mapTmdbRowToMovie = (
    tmdb: any,
    base: CommonMovie,
    source: string
  ): Movie => ({
    id: Number(tmdb.id),
    title: (tmdb.title || tmdb.original_title || base.title) as string,
    year: Number(tmdb.year ?? parseYear(tmdb.release_date) ?? base.year),
    poster_path: tmdb.poster_path ?? undefined,
    overview: tmdb.overview ?? undefined,
    vote_average:
      typeof tmdb.vote_average === "number" ? tmdb.vote_average : undefined,
    director: tmdb.director ?? undefined,
    runtime: typeof tmdb.runtime === "number" ? tmdb.runtime : undefined,
    letterboxdSlug: base.slug,
    friendCount: base.friendCount,
    friendList: base.friendList,
    source,
  });

  // D1-only matching with multiple strategies (no TMDB API fallback)
  const findTmdbRowForMovie = async (
    m: CommonMovie
  ): Promise<Record<string, unknown> | null> => {
    const y = Number.isFinite(m.year) ? m.year : 0;
    const t = m.title;

    // 1) Exact (case-insensitive) with year tolerance
    const exactWithYear = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies
       WHERE (LOWER(title) = LOWER(?) OR LOWER(original_title) = LOWER(?))
         AND (? = 0 OR year IS NULL OR abs(year - ?) <= 1)
       ORDER BY popularity DESC
       LIMIT 1`
    )
      .bind(t, t, y, y)
      .all();
    if (exactWithYear.results && exactWithYear.results.length > 0) {
      return exactWithYear.results[0] as any;
    }

    // 2) LIKE with year tolerance
    const likeWithYear = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies
       WHERE (title LIKE ? OR original_title LIKE ?)
         AND (? = 0 OR year IS NULL OR abs(year - ?) <= 1)
       ORDER BY popularity DESC
       LIMIT 1`
    )
      .bind(`%${t}%`, `%${t}%`, y, y)
      .all();
    if (likeWithYear.results && likeWithYear.results.length > 0) {
      return likeWithYear.results[0] as any;
    }

    // 3) Exact without year
    const exactNoYear = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies
       WHERE LOWER(title) = LOWER(?) OR LOWER(original_title) = LOWER(?)
       ORDER BY popularity DESC
       LIMIT 1`
    )
      .bind(t, t)
      .all();
    if (exactNoYear.results && exactNoYear.results.length > 0) {
      return exactNoYear.results[0] as any;
    }

    // 4) LIKE without year + simple scoring by normalized title and year proximity
    const likeNoYear = await env.MOVIES_DB.prepare(
      `SELECT * FROM tmdb_movies
       WHERE title LIKE ? OR original_title LIKE ?
       ORDER BY popularity DESC
       LIMIT 5`
    )
      .bind(`%${t}%`, `%${t}%`)
      .all();
    const candidates = (likeNoYear.results || []) as any[];
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
  };

  // Process movies in batches to avoid overwhelming the database
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);

    // Create batch queries for parallel execution
    const batchPromises = batch.map(async (movie) => {
      try {
        const tmdbRow = await findTmdbRowForMovie(movie);
        if (tmdbRow) {
          return mapTmdbRowToMovie(tmdbRow, movie, "db");
        }
        // D1-only per requirements: no TMDB API fallback
        debugLog(
          env,
          `D1 enrichment miss for "${movie.title}" (${movie.year}); returning minimal fallback`
        );
        return {
          id: Math.floor(Math.random() * 1_000_000),
          title: movie.title,
          year: movie.year,
          letterboxdSlug: movie.slug,
          friendCount: movie.friendCount,
          friendList: movie.friendList,
          source: "fallback",
        };
      } catch (error) {
        console.error(`Error enhancing movie "${movie.title}":`, error);
        // Return basic movie data as fallback
        return {
          id: Math.floor(Math.random() * 1000000),
          title: movie.title,
          year: movie.year,
          letterboxdSlug: movie.slug,
          friendCount: movie.friendCount, // Preserve friend information
          friendList: movie.friendList, // Preserve friend information
          source: "fallback",
        };
      }
    });

    // Wait for this batch to complete before processing the next
    const batchResults = await Promise.all(batchPromises);
    enhancedMovies.push(...batchResults);

    // Small delay between batches to prevent database overload
    if (i + BATCH_SIZE < movies.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  debugLog(
    env,
    `Enhanced ${enhancedMovies.length} movies with TMDB data using parallel processing`
  );
  return enhancedMovies;
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
    const enhancedMovies = await enhanceWithTMDBData(commonMovies, env);

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
          "Cache-Control": "no-store, no-cache, must-revalidate",
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
