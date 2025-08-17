// AI Generated: GitHub Copilot - 2025-08-16
// Letterboxd Watchlist Comparison API

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

// Enhanced Letterboxd scraper with pagination
async function scrapeLetterboxdWatchlist(
  username: string
): Promise<LetterboxdMovie[]> {
  const allMovies: LetterboxdMovie[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  const maxPages = 50; // Safety limit to prevent infinite loops

  console.log(`Starting to scrape ${username}'s complete watchlist...`);

  while (hasMorePages && currentPage <= maxPages) {
    const url =
      currentPage === 1
        ? `https://letterboxd.com/${username}/watchlist/`
        : `https://letterboxd.com/${username}/watchlist/page/${currentPage}/`;

    console.log(`Scraping page ${currentPage}: ${url}`);

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
          console.log(
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

      console.log(`Found ${pageMovies.length} movies on page ${currentPage}`);

      if (pageMovies.length === 0) {
        // No movies found on this page, we've reached the end
        hasMorePages = false;
        console.log(
          `No movies found on page ${currentPage}, stopping pagination`
        );
      } else {
        allMovies.push(...pageMovies);
        currentPage++;

        // Add a small delay between requests to be respectful to Letterboxd
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Safety check: if we're getting too many pages, something might be wrong
        if (currentPage > maxPages) {
          console.log(`Reached maximum page limit (${maxPages}), stopping`);
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
        console.log(`Stopping pagination due to error on page ${currentPage}`);
        break;
      }
    }
  }

  console.log(
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

  console.log(`Found ${commonMovies.length} common movies`);
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

  for (const movie of movies) {
    try {
      // Decode HTML entities in title for better matching
      const decodedTitle = movie.title
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

      console.log(
        `Looking up movie: "${movie.title}" -> "${decodedTitle}" (${movie.year})`
      );

      // Try exact match first
      let result = await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies 
         WHERE LOWER(title) = LOWER(?) 
         AND (year = ? OR year = ? OR year = ?)
         ORDER BY popularity DESC
         LIMIT 1`
      )
        .bind(decodedTitle, movie.year, movie.year - 1, movie.year + 1)
        .all();

      // If no exact match, try fuzzy matching
      if (!result.results || result.results.length === 0) {
        console.log(
          `No exact match found, trying fuzzy search for "${decodedTitle}"`
        );
        result = await env.MOVIES_DB.prepare(
          `SELECT * FROM tmdb_movies 
           WHERE (title LIKE ? OR original_title LIKE ?) 
           AND (year = ? OR year IS NULL OR ? = 0)
           ORDER BY popularity DESC
           LIMIT 1`
        )
          .bind(
            `%${decodedTitle}%`,
            `%${decodedTitle}%`,
            movie.year,
            movie.year
          )
          .all();
      }

      if (result.results && result.results.length > 0) {
        const tmdbMovie = result.results[0] as any;
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
        // Fallback if not found in database
        enhancedMovies.push({
          id: Math.floor(Math.random() * 1000000),
          title: movie.title,
          year: movie.year,
          letterboxdSlug: movie.slug,
          friendCount: movie.friendCount,
          friendList: movie.friendList,
        });
      }
    } catch (error) {
      console.error("Error enhancing movie:", error);
      // Add basic movie data as fallback
      enhancedMovies.push({
        id: Math.floor(Math.random() * 1000000),
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
    let mainUser: string = "";

    if (body.usernames && Array.isArray(body.usernames)) {
      // New format: {usernames: ["user1", "user2", "user3"]}
      usernames = body.usernames;
      mainUser = usernames[0] || ""; // First user is the main user
    } else if (body.username && body.friends && Array.isArray(body.friends)) {
      // Legacy format: {username: "user1", friends: ["user2", "user3"]}
      usernames = [body.username, ...body.friends];
      mainUser = body.username;
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

    console.log(`Comparing watchlists for: ${usernames.join(", ")}`);

    // Scrape all watchlists in parallel with rate limiting
    const watchlistPromises = usernames.map(async (username, index) => {
      // Add delay between requests to be respectful
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }

      const movies = await scrapeLetterboxdWatchlist(username);
      return { username, movies };
    });

    const watchlists = await Promise.all(watchlistPromises);

    console.log(
      "Watchlist sizes:",
      watchlists.map((w) => `${w.username}: ${w.movies.length}`)
    );

    // Find common movies
    const commonMovies = findCommonMovies(watchlists);

    // Enhance with TMDB data
    const enhancedMovies = await enhanceWithTMDBData(commonMovies, env);

    // Filter out the main user from friend lists and remove duplicates
    const moviesWithFilteredFriends = enhancedMovies.map((movie) => {
      // Use Set to remove duplicates, then filter out main user
      const uniqueFriends = Array.from(new Set(movie.friendList)).filter(
        (friend) => friend !== mainUser
      );

      return {
        ...movie,
        friendList: uniqueFriends,
        friendCount: uniqueFriends.length,
      };
    });

    // Sort by vote average (rating)
    moviesWithFilteredFriends.sort(
      (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
    );

    return Response.json(
      {
        movies: moviesWithFilteredFriends,
        commonCount: moviesWithFilteredFriends.length,
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
