// AI Generated: GitHub Copilot - 2025-08-16
// Letterboxd Watchlist Comparison API

import { debugLog } from "../_lib/common";
import type { Env as CacheEnv } from "../letterboxd/cache/index.js";
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
}

// Simple Letterboxd scraper
async function scrapeLetterboxdWatchlist(
  username: string
): Promise<LetterboxdMovie[]> {
  const url = `https://letterboxd.com/${username}/watchlist/`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Boxdbud.io/1.1.0 (https://boxdbud.pages.dev) - Watchlist Comparison Tool",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch watchlist for ${username}: ${response.status}`
      );
    }

    const html = await response.text();
    const movies: LetterboxdMovie[] = [];

    // Parse Letterboxd HTML for movie data
    // Look for film poster containers with data attributes
    const filmRegex =
      /<li[^>]*class="poster-container"[^>]*>[\s\S]*?data-film-slug="([^"]+)"[\s\S]*?<img[^>]+alt="([^"]+)"[^>]*>/g;

    let match;
    while ((match = filmRegex.exec(html)) !== null) {
      const slug = match[1];
      const titleWithYear = match[2];

      // Extract title and year from "Title Year" format
      const yearRegex = /^(.+?)\s+(\d{4})$/;
      const yearMatch = yearRegex.exec(titleWithYear);
      if (yearMatch) {
        movies.push({
          title: yearMatch[1].trim(),
          year: parseInt(yearMatch[2]),
          slug: slug,
        });
      } else {
        // No year found, use 0 as default
        movies.push({
          title: titleWithYear.trim(),
          year: 0,
          slug: slug,
        });
      }
    }

    debugLog(
      undefined,
      `Scraped ${movies.length} movies from ${username}'s watchlist`
    );
    return movies;
  } catch (error) {
    console.error(`Error scraping ${username}:`, error);
    throw new Error(
      `Failed to scrape watchlist for ${username}. Make sure the username exists and the watchlist is public.`
    );
  }
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

  // Create a map for efficient lookups: movie key -> {movie, users[], count}
  const movieMap = new Map<
    string,
    { movie: LetterboxdMovie; users: string[]; count: number }
  >();

  // Process each watchlist and build the movie map
  for (const watchlist of watchlists) {
    debugLog(
      undefined,
      `Processing ${watchlist.username} with ${watchlist.movies.length} movies`
    );

    // Use a Set for this watchlist to avoid duplicates within a single user's list
    const userMovies = new Set<string>();

    for (const movie of watchlist.movies) {
      // Create a normalized key for movie matching
      const key = `${movie.title.toLowerCase().trim()}-${movie.year}`;

      // Skip if this user already has this movie (avoid duplicates)
      if (userMovies.has(key)) continue;
      userMovies.add(key);

      const existing = movieMap.get(key);
      if (existing) {
        // Movie already exists, increment count and add user
        existing.count++;
        if (!existing.users.includes(watchlist.username)) {
          existing.users.push(watchlist.username);
        }
        debugLog(
          undefined,
          `Found common movie: "${movie.title}" (${movie.year}) - now with users: ${existing.users.join(", ")}`
        );
      } else {
        // First time seeing this movie
        movieMap.set(key, {
          movie: { ...movie }, // Clone to avoid mutations
          users: [watchlist.username],
          count: 1,
        });
      }
    }
  }

  debugLog(undefined, `Total unique movies in map: ${movieMap.size}`);
  debugLog(
    undefined,
    `Movies with count >= 2: ${Array.from(movieMap.values()).filter((m) => m.count >= 2).length}`
  );

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
    undefined,
    `Found ${commonMovies.length} common movies in ${duration}ms using optimized algorithm`
  );

  return commonMovies;
}

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

  // Process movies in batches to avoid overwhelming the database
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);

    // Create batch queries for parallel execution
    const batchPromises = batch.map(async (movie) => {
      try {
        // Use a tolerant year matcher: accept exact year, ±1 year, or any year when unknown (0)
        // This avoids false negatives when Letterboxd and TMDB differ by release year (festival vs. wide release).
        const y = Number.isFinite(movie.year) ? movie.year : 0;
        const stmt = env.MOVIES_DB.prepare(
          `SELECT * FROM tmdb_movies
           WHERE (title LIKE ? OR original_title LIKE ?)
             AND (? = 0 OR year IS NULL OR abs(year - ?) <= 1)
           ORDER BY popularity DESC
           LIMIT 1`
        ).bind(`%${movie.title}%`, `%${movie.title}%`, y, y);

        const result = await stmt.all();

        if (result.results && result.results.length > 0) {
          const tmdbMovie: any = result.results[0];

          // Parse genres from D1 row (stored as JSON text or array)
          let genres: string[] | undefined;
          try {
            const raw = tmdbMovie.genres;
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed)) {
              if (parsed.length > 0 && typeof parsed[0] === "string") {
                genres = parsed as string[];
              } else if (
                parsed.length > 0 &&
                parsed[0] &&
                typeof parsed[0].name === "string"
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
            id: tmdbMovie.id,
            title: tmdbMovie.title,
            year: tmdbMovie.year || movie.year,
            poster_path: tmdbMovie.poster_path,
            overview: tmdbMovie.overview,
            vote_average: tmdbMovie.vote_average,
            director: tmdbMovie.director,
            runtime: tmdbMovie.runtime,
            genres,
            letterboxdSlug: movie.slug, // Preserve original slug
            friendCount: movie.friendCount, // Preserve friend information
            friendList: movie.friendList, // Preserve friend information
          };
        } else {
          // Fallback if not found in database
          debugLog(
            env,
            `No TMDB match in D1 for "${movie.title}" (${movie.year}); returning placeholder`
          );
          return {
            id: Math.floor(Math.random() * 1000000),
            title: movie.title,
            year: movie.year,
            letterboxdSlug: movie.slug,
            friendCount: movie.friendCount, // Preserve friend information
            friendList: movie.friendList, // Preserve friend information
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
    undefined,
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
        debugLog(
          env,
          `Scraped ${username}: ${movies.length} movies in ${duration}ms`
        );
        return { username, movies, duration };
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
          `Failed to scrape ${username} after ${duration}ms:`,
          error
        );
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
        watchlist.movies.slice(0, 3).map((m) => `"${m.title}" (${m.year})`)
      );
    });

    // Find common movies
    const commonMovies = findCommonMovies(watchlists);

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
