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
          "BoxdBuddy/1.1.0 (https://boxdbuddy.pages.dev) - Watchlist Comparison Tool",
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
      const yearMatch = titleWithYear.match(/^(.+?)\s+(\d{4})$/);
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

    console.log(`Scraped ${movies.length} movies from ${username}'s watchlist`);
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
    console.log(
      `Processing ${watchlist.username} with ${watchlist.movies.length} movies`
    );

    // Use a Set for this watchlist to avoid duplicates within a single user's list
    const userMovies = new Set<string>();

    for (const movie of watchlist.movies) {
      // Create multiple normalized keys for movie matching to handle edge cases
      const normalizedTitle = movie.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "") // Remove punctuation
        .replace(/\s+/g, " "); // Normalize whitespace

      // Try multiple matching strategies
      const keys = [
        `${normalizedTitle}-${movie.year}`, // Exact match
        `${normalizedTitle}-0`, // Title only (ignore year)
        `${movie.title.toLowerCase().trim()}-${movie.year}`, // Original approach
      ];

      // Also add a key without year if year is 0 or invalid
      if (movie.year === 0 || !movie.year) {
        keys.push(normalizedTitle);
      }

      let movieProcessed = false;

      for (const key of keys) {
        // Skip if this user already has this movie (avoid duplicates)
        if (userMovies.has(key)) continue;

        const existing = movieMap.get(key);
        if (existing) {
          // Movie already exists, increment count and add user
          existing.count++;
          if (!existing.users.includes(watchlist.username)) {
            existing.users.push(watchlist.username);
          }
          console.log(
            `Found common movie: "${movie.title}" (${movie.year}) - now with users: ${existing.users.join(", ")}`
          );
          userMovies.add(key);
          movieProcessed = true;
          break; // Found a match, don't process other keys
        }
      }

      if (!movieProcessed) {
        // First time seeing this movie - use the primary key
        const primaryKey = keys[0];
        movieMap.set(primaryKey, {
          movie: { ...movie }, // Clone to avoid mutations
          users: [watchlist.username],
          count: 1,
        });
        userMovies.add(primaryKey);
      }
    }
  }

  console.log(`Total unique movies in map: ${movieMap.size}`);
  console.log(
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
  console.log(
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
          return {
            id: tmdbMovie.id,
            title: tmdbMovie.title,
            year: tmdbMovie.year || movie.year,
            poster_path: tmdbMovie.poster_path,
            overview: tmdbMovie.overview,
            vote_average: tmdbMovie.vote_average,
            director: tmdbMovie.director,
            runtime: tmdbMovie.runtime,
            letterboxdSlug: movie.slug, // Preserve original slug
            friendCount: movie.friendCount, // Preserve friend information
            friendList: movie.friendList, // Preserve friend information
          };
        } else {
          // Fallback if not found in database
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
          const normalized = m.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, "")
            .replace(/\s+/g, " ");
          return `"${normalized}" (${m.year})`;
        })
      );
    });

    // Find common movies
    const commonMovies = findCommonMovies(watchlists);

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
