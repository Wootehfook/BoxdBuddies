// AI Generated: GitHub Copilot - 2025-08-29
// Letterboxd Watchlist Comparison API - Renamed to avoid adblocker issues
// Deployment trigger: Enhanced matching algorithm with multi-strategy normalization

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<D1Result>;
  first(): Promise<Record<string, unknown> | null>;
}

interface D1Result {
  success: boolean;
  results?: unknown[];
}

interface Env {
  MOVIES_DB: D1Database;
  TMDB_API_KEY: string;
}

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
  username: string
): Promise<LetterboxdMovie[]> {
  const allMovies: LetterboxdMovie[] = [];
  let page = 1;
  const maxPages = 10; // Safety limit to prevent infinite loops

  console.log(`Starting scrape for ${username}`);

  while (page <= maxPages) {
    const url =
      page === 1
        ? `https://letterboxd.com/${username}/watchlist/`
        : `https://letterboxd.com/${username}/watchlist/page/${page}/`;

    console.log(`Scraping page ${page} for ${username}: ${url}`);

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
          console.log(
            `Page ${page} not found for ${username}, stopping pagination`
          );
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`Page ${page} HTML length: ${html.length}`);

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
          const yearMatch = titleWithYear.match(/^(.+?)\s+(\d{4})$/);
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
            console.log(
              `Page ${page} Match ${pageMovieCount}: slug="${slug}", title="${titleWithYear}"`
            );
          }
        }
      }

      console.log(`Page ${page}: found ${pageMovieCount} movies`);

      // If no movies found on this page, we've reached the end
      if (pageMovieCount === 0) {
        console.log(`No movies found on page ${page}, stopping pagination`);
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
        console.log(`Stopping pagination due to error on page ${page}`);
        break;
      }
    }
  }

  console.log(
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
  watchlists: { username: string; movies: LetterboxdMovie[] }[]
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
    console.log(
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
        console.log(
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

  console.log(`Total unique movies in map: ${movieMap.size}`);
  const moviesWithMultipleUsers = Array.from(movieMap.values()).filter(
    (m) => m.count >= 2
  );
  console.log(`Movies with count >= 2: ${moviesWithMultipleUsers.length}`);

  // Debug: Show some sample movies with counts
  console.log("Sample movie map entries (slug-based keys):");
  const sampleEntries = Array.from(movieMap.entries()).slice(0, 5);
  sampleEntries.forEach(([key, data]) => {
    console.log(
      `  slug="${key}": "${data.movie.title}" (${data.movie.year}) count=${data.count}, users=[${data.users.join(", ")}]`
    );
  });

  if (moviesWithMultipleUsers.length > 0) {
    console.log("Movies with multiple users:");
    moviesWithMultipleUsers.slice(0, 3).forEach((data) => {
      console.log(
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
  console.log(
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

  const fetchTmdbFromApi = async (m: CommonMovie): Promise<Movie | null> => {
    try {
      if (!env.TMDB_API_KEY) {
        console.error("TMDB_API_KEY is not configured in environment");
        return null;
      }

      const qs: string[] = [];
      const pushQS = (k: string, v: string | number | boolean | undefined) => {
        if (v === undefined) return;
        qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      };
      pushQS("api_key", env.TMDB_API_KEY);
      pushQS("query", m.title);
      pushQS("include_adult", false);
      pushQS("language", "en-US");
      pushQS("page", 1);
      if (m.year && m.year > 0) {
        pushQS("year", m.year);
        pushQS("primary_release_year", m.year);
      }
      const url = `https://api.themoviedb.org/3/search/movie?${qs.join("&")}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        console.error("TMDB search failed:", res.status, res.statusText);
        return null;
      }
      const data = (await res.json()) as {
        results?: Array<Record<string, unknown>>;
      };

      const results = (data.results || []) as any[];
      if (results.length === 0) return null;

      // Prefer exact year/title matches if possible
      const wantYear = m.year || 0;
      const normWant = normalizeTitle(m.title);
      const scored = results.map((r) => {
        const ry = parseYear(r.release_date);
        const title = normalizeTitle(r.title || r.original_title || "");
        let score = 0;
        if (wantYear && ry === wantYear) score += 3;
        if (title === normWant) score += 3;
        // small bonus for close titles
        if (!score && title.includes(normWant)) score += 1;
        return { r, score, pop: Number(r.popularity || 0) };
      });

      scored.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return b.pop - a.pop;
      });

      const best = scored[0]?.r;
      if (!best) return null;

      // Fetch details to enrich with runtime, genres, and director
      const detailQs: string[] = [];
      const pushDetail = (
        k: string,
        v: string | number | boolean | undefined
      ) => {
        if (v === undefined) return;
        detailQs.push(
          `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
        );
      };
      pushDetail("api_key", env.TMDB_API_KEY);
      pushDetail("language", "en-US");
      pushDetail("append_to_response", "credits");
      const detailUrl = `https://api.themoviedb.org/3/movie/${best.id}?${detailQs.join("&")}`;
      const detRes = await fetch(detailUrl, {
        headers: { Accept: "application/json" },
      });
      let enriched: any = best;
      if (detRes.ok) {
        const det = (await detRes.json()) as any;
        enriched = {
          ...best,
          runtime: det.runtime,
          genres: Array.isArray(det.genres)
            ? det.genres
                .map((g: any) => (typeof g.name === "string" ? g.name : ""))
                .filter(Boolean)
            : undefined,
          // Extract director from crew
          director: Array.isArray(det.credits?.crew)
            ? det.credits.crew.find((c: any) => c.job === "Director")?.name ||
              undefined
            : undefined,
        };
      }

      const mapped = mapTmdbRowToMovie(enriched, m, "tmdb_api");
      if (Array.isArray(enriched.genres)) {
        mapped.genres = enriched.genres as string[];
      }
      if (typeof enriched.runtime === "number") {
        mapped.runtime = enriched.runtime as number;
      }
      if (typeof enriched.director === "string") {
        mapped.director = enriched.director as string;
      }
      return mapped;
    } catch (e) {
      console.error("TMDB API error for", m.title, e);
      return null;
    }
  };

  // Process movies in batches to avoid overwhelming the database
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);

    // Create batch queries for parallel execution
    const batchPromises = batch.map(async (movie) => {
      try {
        // Prepare the query for this movie
        const stmt = env.MOVIES_DB.prepare(
          `SELECT * FROM tmdb_movies 
           WHERE (title LIKE ? OR original_title LIKE ?) 
           AND (year = ? OR year IS NULL OR ? = 0)
           ORDER BY popularity DESC
           LIMIT 1`
        ).bind(`%${movie.title}%`, `%${movie.title}%`, movie.year, movie.year);

        const result = await stmt.all();

        if (result.results && result.results.length > 0) {
          const tmdbMovie = result.results[0] as any;
          return mapTmdbRowToMovie(tmdbMovie, movie, "db");
        } else {
          // Try TMDB API as fallback
          const fromApi = await fetchTmdbFromApi(movie);
          if (fromApi) return fromApi;

          // Final fallback if API also fails
          return {
            id: Math.floor(Math.random() * 1_000_000),
            title: movie.title,
            year: movie.year,
            letterboxdSlug: movie.slug,
            friendCount: movie.friendCount,
            friendList: movie.friendList,
            source: "fallback",
          };
        }
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

  console.log(
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

    console.log(`Starting comparison for: ${usernames.join(", ")}`);

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
        const movies = await scrapeLetterboxdWatchlist(username);
        const duration = Date.now() - startTime;
        console.log(
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

    console.log(
      "Watchlist scraping completed:",
      watchlists.map(
        (w) => `${w.username}: ${w.movies.length} movies (${w.duration}ms)`
      )
    );

    // Add debug logging for the first few movies from each user
    watchlists.forEach((watchlist) => {
      console.log(
        `${watchlist.username} sample movies:`,
        watchlist.movies.slice(0, 5).map((m) => `"${m.title}" (${m.year})`)
      );

      // Also show normalized versions to help debug matching issues
      console.log(
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

    console.log(`Common movies found: ${commonMovies.length}`);
    if (commonMovies.length > 0) {
      console.log(
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
          "Cache-Control": "public, max-age=300",
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
