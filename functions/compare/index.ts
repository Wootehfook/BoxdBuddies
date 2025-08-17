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

// Find movies that appear in multiple watchlists
function findCommonMovies(
  watchlists: { username: string; movies: LetterboxdMovie[] }[]
): LetterboxdMovie[] {
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
        existing.users.push(watchlist.username);
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
  const commonMovies: LetterboxdMovie[] = [];
  for (const [, data] of movieCounts) {
    if (data.count >= 2) {
      commonMovies.push(data.movie);
    }
  }

  console.log(`Found ${commonMovies.length} common movies`);
  return commonMovies;
}

// Enhance movies with TMDB data from database
async function enhanceWithTMDBData(
  movies: LetterboxdMovie[],
  env: Env
): Promise<Movie[]> {
  const enhancedMovies: Movie[] = [];

  for (const movie of movies) {
    try {
      // Look up movie in our database with fuzzy matching
      const result = await env.MOVIES_DB.prepare(
        `SELECT * FROM tmdb_movies 
         WHERE (title LIKE ? OR original_title LIKE ?) 
         AND (year = ? OR year IS NULL OR ? = 0)
         ORDER BY popularity DESC
         LIMIT 1`
      )
        .bind(`%${movie.title}%`, `%${movie.title}%`, movie.year, movie.year)
        .all();

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
        });
      } else {
        // Fallback if not found in database
        enhancedMovies.push({
          id: Math.floor(Math.random() * 1000000),
          title: movie.title,
          year: movie.year,
        });
      }
    } catch (error) {
      console.error("Error enhancing movie:", error);
      // Add basic movie data as fallback
      enhancedMovies.push({
        id: Math.floor(Math.random() * 1000000),
        title: movie.title,
        year: movie.year,
      });
    }
  }

  return enhancedMovies;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as { usernames: string[] };

    if (
      !body.usernames ||
      !Array.isArray(body.usernames) ||
      body.usernames.length < 2
    ) {
      return Response.json(
        { error: "At least 2 usernames are required" },
        { status: 400 }
      );
    }

    const usernames = body.usernames
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
