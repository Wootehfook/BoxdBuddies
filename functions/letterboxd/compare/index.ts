// AI Generated: GitHub Copilot - 2025-08-16T23:30:00Z
// Letterboxd Watchlist Comparison API

// AI Generated: GitHub Copilot - 2025-08-16T23:30:00Z
import { debugLog } from "../../_lib/common";

// Structured logging utility for production
const logger = {
  info: (message: string, meta?: any) => {
    // Gate informational logs through debugLog so they can be disabled in production
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
    // Use debugLog for warnings too; keep errors on console.error
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
  letterboxdSlug?: string;
  friendCount: number;
  friendList: string[];
}

// AI Generated: GitHub Copilot - 2025-08-17T04:25:00Z
// Enhanced HTML entity decoding function to prevent double-escaping issues
function decodeHTMLEntities(text: string): string {
  // Comprehensive entity map with numeric character references
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#039;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#x60;": "`",
    "&#x3D;": "=",
    "&nbsp;": " ",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&hellip;": "…",
    "&mdash;": "—",
    "&ndash;": "–",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": "\u201C",
    "&rdquo;": "\u201D",
  };

  // First pass: decode named entities
  let decoded = text.replace(/&[a-zA-Z][a-zA-Z0-9]*;/g, (entity) => {
    return entityMap[entity] || entity;
  });

  // Second pass: decode numeric character references
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    const codePoint = parseInt(hex, 16);
    return codePoint > 0 && codePoint < 0x10ffff
      ? String.fromCharCode(codePoint)
      : match;
  });

  decoded = decoded.replace(/&#([0-9]+);/g, (match, decimal) => {
    const codePoint = parseInt(decimal, 10);
    return codePoint > 0 && codePoint < 0x10ffff
      ? String.fromCharCode(codePoint)
      : match;
  });

  return decoded;
}

// Enhanced Letterboxd scraper with pagination
async function scrapeLetterboxdWatchlist(
  username: string,
  env?: Env
): Promise<LetterboxdMovie[]> {
  const allMovies: LetterboxdMovie[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  const maxPages = 50; // Safety limit to prevent infinite loops

  logger.info(`Starting to scrape watchlist`, { username });

  while (hasMorePages && currentPage <= maxPages) {
    const url =
      currentPage === 1
        ? `https://letterboxd.com/${username}/watchlist/`
        : `https://letterboxd.com/${username}/watchlist/page/${currentPage}/`;

    debugLog(env, `Scraping page ${currentPage}: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "BoxdBuddy/1.1.0 (https://boxdbuddy.pages.dev) - Watchlist Comparison Tool",
        },
      });

      if (!response.ok) {
        if (currentPage === 1) {
          throw new Error(
            `Failed to fetch watchlist for ${username}: ${response.status}`
          );
        } else {
          // If we can't fetch a page beyond the first, we've likely hit the end
          debugLog(
            env,
            `Page ${currentPage} returned ${response.status}, stopping pagination`
          );
          break;
        }
      }

      const html = await response.text();

      // Check if this page has any movies
      const filmRegex =
        /<li[^>]*class="poster-container"[^>]*>[\s\S]*?data-film-slug="([^"]+)"[\s\S]*?<img[^>]+alt="([^"]+)"[^>]*>/g;
      const pageMovies: LetterboxdMovie[] = [];

      let match;
      while ((match = filmRegex.exec(html)) !== null) {
        const slug = match[1];
        const titleWithYear = match[2];

        // Extract title and year from "Title Year" format
        const yearMatch = titleWithYear.match(/^(.+?)\s+(\d{4})$/);
        if (yearMatch) {
          pageMovies.push({
            title: yearMatch[1].trim(),
            year: parseInt(yearMatch[2]),
            slug: slug,
          });
        } else {
          // No year found, use 0 as default
          pageMovies.push({
            title: titleWithYear.trim(),
            year: 0,
            slug: slug,
          });
        }
      }

      debugLog(env, `Found ${pageMovies.length} movies on page ${currentPage}`);

      if (pageMovies.length === 0) {
        // No movies found on this page, we've reached the end
        hasMorePages = false;
        debugLog(
          env,
          `No movies found on page ${currentPage}, stopping pagination`
        );
      } else {
        allMovies.push(...pageMovies);
        currentPage++;

        // Add a small delay between requests to be respectful to Letterboxd
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Safety check: if we're getting too many pages, something might be wrong
        if (currentPage > maxPages) {
          debugLog(env, `Reached maximum page limit (${maxPages}), stopping`);
          break;
        }
      }
    } catch (error) {
      console.error(
        `Error scraping page ${currentPage} for ${username}:`,
        error
      );
      if (currentPage === 1) {
        // If the first page fails, re-throw the error
        throw error;
      } else {
        // If a later page fails, just stop pagination
        debugLog(
          env,
          `Stopping pagination due to error on page ${currentPage}`
        );
        break;
      }
    }
  }

  debugLog(
    env,
    `Completed scraping ${username}: ${allMovies.length} total movies across ${currentPage - 1} pages`
  );
  return allMovies;
}

// Find movies that appear in multiple watchlists
function findCommonMovies(
  watchlists: { username: string; movies: LetterboxdMovie[] }[]
): Array<LetterboxdMovie & { friendCount: number; friendList: string[] }> {
  if (watchlists.length < 2) return [];

  const movieCounts = new Map<
    string,
    { movie: LetterboxdMovie; count: number; users: string[] }
  >();

  // Count occurrences of each movie across all watchlists
  for (const watchlist of watchlists) {
    for (const movie of watchlist.movies) {
      const key = `${movie.title.toLowerCase()}-${movie.year}`;
      const existing = movieCounts.get(key);

      if (existing) {
        existing.count++;
        // Only add username if it's not already in the users array
        if (!existing.users.includes(watchlist.username)) {
          existing.users.push(watchlist.username);
        }
      } else {
        movieCounts.set(key, {
          movie,
          count: 1,
          users: [watchlist.username],
        });
      }
    }
  }

  // Return movies that appear in at least 2 watchlists
  const commonMovies: Array<
    LetterboxdMovie & { friendCount: number; friendList: string[] }
  > = [];
  for (const [, data] of movieCounts) {
    if (data.count >= 2) {
      commonMovies.push({
        ...data.movie,
        friendCount: data.count,
        friendList: data.users,
      });
    }
  }

  logger.info(`Found common movies`, { count: commonMovies.length });
  return commonMovies;
}

// Enhance movies with TMDB data from database
async function enhanceWithTMDBData(
  movies: Array<
    LetterboxdMovie & { friendCount: number; friendList: string[] }
  >,
  env: Env
): Promise<Movie[]> {
  const enhancedMovies: Movie[] = [];

  // Helper: deterministic fallback ID generator used when TMDB lookup fails
  const generateFallbackId = (title: string, year: number): number => {
    let hash = 0;
    const str = `${title.toLowerCase()}-${year}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive ID between 900000-999999 to avoid conflicts with real TMDB IDs
    return Math.abs(hash % 100000) + 900000;
  };

  for (const movie of movies) {
    try {
      // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
      // Decode HTML entities using a more robust approach to prevent double-escaping
      const decodedTitle = decodeHTMLEntities(movie.title);

      // Extract a cleaner title from the Letterboxd slug if available
      let searchTitle = decodedTitle;
      if (movie.slug) {
        // Convert slug to title: "the-vanishing-1993" -> "The Vanishing"
        const slugTitle = movie.slug
          .replace(/-\d{4}$/, "") // Remove year suffix
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Use slug-derived title if it's different and seems more specific
        if (
          slugTitle.length > 0 &&
          slugTitle.toLowerCase() !== decodedTitle.toLowerCase()
        ) {
          debugLog(
            env,
            `Using slug-derived title: "${slugTitle}" instead of "${decodedTitle}"`
          );
          searchTitle = slugTitle;
        }
      }

      debugLog(
        env,
        `Looking up movie: "${movie.title}" -> "${searchTitle}" (${movie.year}) [slug: ${movie.slug}]`
      );

      // Try exact match first (strict)
      let result = await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies 
         WHERE LOWER(title) = LOWER(?) 
         AND (year = ? OR year = ? OR year = ?)
         ORDER BY popularity DESC
         LIMIT 1`
      )
        .bind(searchTitle, movie.year, movie.year - 1, movie.year + 1)
        .all();

      // If no exact match with slug title, try exact match with original title
      if (
        (!result.results || result.results.length === 0) &&
        searchTitle !== decodedTitle
      ) {
        debugLog(
          env,
          `No match with slug title, trying original title: "${decodedTitle}"`
        );
        result = await env.MOVIES_DB.prepare(
          `SELECT * FROM tmdb_movies 
           WHERE LOWER(title) = LOWER(?) 
           AND (year = ? OR year = ? OR year = ?)
           ORDER BY popularity DESC
           LIMIT 1`
        )
          .bind(decodedTitle, movie.year, movie.year - 1, movie.year + 1)
          .all();
      }

      // If still no exact match, try more precise fuzzy matching
      if (!result.results || result.results.length === 0) {
        const titleLength = searchTitle.length;
        if (titleLength >= 6) {
          // Lowered threshold but with better logic
          debugLog(
            env,
            `No exact match found, trying precise fuzzy search for "${searchTitle}"`
          );

          // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
          // More precise fuzzy matching to avoid false positives like "The Fall" matching "The Fall Guy"

          // For short titles like "The Fall", be extremely strict to prevent false matches
          if (titleLength <= 12) {
            debugLog(
              env,
              `Short title detected, using exact prefix matching to prevent false positives`
            );

            // Try multiple exact patterns before giving up:
            // 1. Exact match (already tried above)
            // 2. Title followed by year: "The Fall (2019)"
            // 3. Title followed by colon: "The Fall: Subtitle"
            // 4. Title as complete word at start

            const patterns = [
              `${searchTitle} (%`, // "The Fall (2019)"
              `${searchTitle}:%`, // "The Fall: Subtitle"
              `${searchTitle}.%`, // "The Fall. Subtitle"
            ];

            for (const pattern of patterns) {
              result = await env.MOVIES_DB.prepare(
                `SELECT * FROM tmdb_movies 
                 WHERE LOWER(title) LIKE LOWER(?)
                 AND (year = ? OR year = ? OR year = ?)
                 ORDER BY popularity DESC
                 LIMIT 1`
              )
                .bind(pattern, movie.year, movie.year - 1, movie.year + 1)
                .all();

              if (result.results && result.results.length > 0) {
                debugLog(env, `Found match with pattern: ${pattern}`);
                break;
              }
            }
          } else {
            // For longer titles, use the original fuzzy logic but with stricter constraints
            result = await env.MOVIES_DB.prepare(
              `SELECT * FROM tmdb_movies 
               WHERE (title LIKE ? OR original_title LIKE ?) 
               AND (year = ? OR year IS NULL OR ? = 0)
               AND LENGTH(title) BETWEEN ? AND ?
               ORDER BY popularity DESC
               LIMIT 1`
            )
              .bind(
                `%${searchTitle}%`,
                `%${searchTitle}%`,
                movie.year,
                movie.year,
                Math.max(titleLength - 3, Math.floor(titleLength * 0.8)), // Stricter minimum length
                titleLength + 8 // Reasonable maximum length
              )
              .all();
          }
        } else {
          debugLog(env, `Title "${searchTitle}" too short for fuzzy matching`);
        }
      }

      if (result.results && result.results.length > 0) {
        const tmdbMovie = result.results[0] as any;

        // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
        // Enhanced logging to help debug movie matching
        debugLog(env, `✅ Found TMDB match for "${movie.title}":`, {
          letterboxdTitle: movie.title,
          letterboxdSlug: movie.slug,
          letterboxdYear: movie.year,
          tmdbTitle: tmdbMovie.title,
          tmdbYear: tmdbMovie.year,
          tmdbId: tmdbMovie.id,
        });

        enhancedMovies.push({
          id: tmdbMovie.id,
          title: tmdbMovie.title,
          year: tmdbMovie.year || movie.year,
          poster_path: tmdbMovie.poster_path,
          overview: tmdbMovie.overview,
          vote_average: tmdbMovie.vote_average,
          director: tmdbMovie.director,
          runtime: tmdbMovie.runtime,
          letterboxdSlug: movie.slug,
          friendCount: movie.friendCount,
          friendList: movie.friendList,
        });
      } else {
        // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
        // Enhanced logging for failed matches
        debugLog(
          env,
          `❌ No TMDB match found for "${movie.title}" (${movie.year}) [slug: ${movie.slug}]`
        );

        // Use deterministic fallback ID generator
        // Fallback if not found in database
        enhancedMovies.push({
          id: generateFallbackId(movie.title, movie.year),
          title: movie.title,
          year: movie.year,
          letterboxdSlug: movie.slug,
          friendCount: movie.friendCount,
          friendList: movie.friendList,
        });
      }
    } catch (error) {
      // Use deterministic fallback ID generator
      console.error("Error enhancing movie:", error);
      // Add basic movie data as fallback
      enhancedMovies.push({
        id: generateFallbackId(movie.title, movie.year),
        title: movie.title,
        year: movie.year,
        letterboxdSlug: movie.slug,
        friendCount: movie.friendCount,
        friendList: movie.friendList,
      });
    }
  }

  return enhancedMovies;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      usernames?: string[];
      username?: string;
      friends?: string[];
    };

    // Support both formats: new format {usernames: []} and legacy format {username: "", friends: []}
    let usernames: string[] = [];

    if (body.usernames && Array.isArray(body.usernames)) {
      // New format: {usernames: ["user1", "user2", "user3"]}
      usernames = body.usernames;
    } else if (body.username && body.friends && Array.isArray(body.friends)) {
      // Legacy format: {username: "user1", friends: ["user2", "user3"]}
      usernames = [body.username, ...body.friends];
    }

    // Clean and validate usernames
    usernames = usernames
      .filter((u) => u && typeof u === "string" && u.trim())
      .map((u) => u.trim())
      .slice(0, 10); // Limit to 10 users

    if (usernames.length < 2) {
      return Response.json(
        { error: "At least 2 usernames are required" },
        { status: 400 }
      );
    }

    debugLog(env, `Comparing watchlists for: ${usernames.join(", ")}`);

    // Scrape all watchlists in parallel with rate limiting
    const watchlistPromises = usernames.map(async (username, index) => {
      // Add delay between requests to be respectful
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }

      const movies = await scrapeLetterboxdWatchlist(username, env);
      return { username, movies };
    });

    const watchlists = await Promise.all(watchlistPromises);

    debugLog(
      env,
      "Watchlist sizes:",
      watchlists.map((w) => `${w.username}: ${w.movies.length}`)
    );

    // Find common movies
    const commonMovies = findCommonMovies(watchlists);

    // Enhance with TMDB data
    const enhancedMovies = await enhanceWithTMDBData(commonMovies, env);

    // Remove duplicates from friend lists but keep all users including main user
    const moviesWithFilteredFriends = enhancedMovies.map((movie) => {
      // Use Set to remove duplicates, but keep main user if they have the movie
      const uniqueFriends = Array.from(new Set(movie.friendList));

      return {
        ...movie,
        friendList: uniqueFriends,
        friendCount: uniqueFriends.length,
      };
    });

    // Filter out movies that don't have at least 2 friends after deduplication
    const moviesWithMultipleFriends = moviesWithFilteredFriends.filter(
      (movie) => movie.friendCount >= 2
    );

    // Sort by friend count (descending) first, then by rating (descending)
    moviesWithMultipleFriends.sort((a, b) => {
      // Primary sort: number of common friends (more friends = higher priority)
      const friendCountDiff = b.friendCount - a.friendCount;
      if (friendCountDiff !== 0) {
        return friendCountDiff;
      }

      // Secondary sort: TMDB rating (higher rating = higher priority)
      return (b.vote_average || 0) - (a.vote_average || 0);
    });

    return Response.json(
      {
        movies: moviesWithMultipleFriends,
        commonCount: moviesWithMultipleFriends.length,
        usernames: usernames,
        watchlistSizes: watchlists.map((w) => ({
          username: w.username,
          size: w.movies.length,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
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
    },
  });
}
