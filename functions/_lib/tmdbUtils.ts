// AI Generated: GitHub Copilot - 2025-08-31
// Shared TMDB API utilities for real-time movie data fetching

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  runtime?: number;
  status?: string;
  tagline?: string;
}

interface TMDBCredits {
  crew: Array<{
    job: string;
    name: string;
  }>;
}

interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

// Rate limiting - 40 requests per 10 seconds (TMDB limit)
let requestCount = 0;
let windowStart = Date.now();
const MAX_REQUESTS_PER_WINDOW = 35; // Leave some buffer
const WINDOW_MS = 10000;

async function rateLimit() {
  const now = Date.now();

  // Reset window if 10 seconds have passed
  if (now - windowStart >= WINDOW_MS) {
    requestCount = 0;
    windowStart = now;
  }

  // If we've hit the limit, wait for the window to reset
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = WINDOW_MS - (now - windowStart);
    console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    requestCount = 0;
    windowStart = Date.now();
  }

  requestCount++;
}

export async function fetchTMDBData(url: string, apiKey: string): Promise<any> {
  await rateLimit();

  const response = await fetch(
    `https://api.themoviedb.org/3${url}${url.includes("?") ? "&" : "?"}api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function getMovieDetails(
  movieId: number,
  apiKey: string
): Promise<{ movie: any; director: string }> {
  // Get movie details
  const movie = await fetchTMDBData(`/movie/${movieId}`, apiKey);

  // Get credits to find director
  const credits: TMDBCredits = await fetchTMDBData(
    `/movie/${movieId}/credits`,
    apiKey
  );
  const director =
    credits.crew.find((person) => person.job === "Director")?.name || "Unknown";

  return { movie, director };
}

export async function searchTMDBMovies(
  query: string,
  year?: number,
  apiKey?: string
): Promise<TMDBSearchResponse> {
  if (!apiKey) {
    throw new Error("TMDB API key is required");
  }

  let searchUrl = `/search/movie?query=${encodeURIComponent(query)}`;
  if (year && year > 0) {
    searchUrl += `&year=${year}`;
  }

  return await fetchTMDBData(searchUrl, apiKey);
}

export async function enhanceMovieWithTMDBData(
  title: string,
  year: number,
  apiKey: string
): Promise<any | null> {
  try {
    console.log(`🔍 Searching TMDB for: "${title}" (${year})`);

    // Search for the movie
    const searchResponse = await searchTMDBMovies(title, year, apiKey);

    if (!searchResponse.results || searchResponse.results.length === 0) {
      console.log(`❌ No TMDB results found for "${title}" (${year})`);
      return null;
    }

    // Get the best match (first result, as TMDB orders by relevance)
    const tmdbMovie = searchResponse.results[0];

    // Get detailed movie information including director
    const { movie: movieDetails, director } = await getMovieDetails(
      tmdbMovie.id,
      apiKey
    );

    // Extract year from release date
    const movieYear = movieDetails.release_date
      ? new Date(movieDetails.release_date).getFullYear()
      : null;

    console.log(`✅ Found TMDB match for "${title}":`, {
      letterboxdTitle: title,
      letterboxdYear: year,
      tmdbTitle: movieDetails.title,
      tmdbYear: movieYear,
      tmdbId: movieDetails.id,
    });

    return {
      id: movieDetails.id,
      title: movieDetails.title,
      year: movieYear || year,
      poster_path: movieDetails.poster_path,
      overview: movieDetails.overview,
      vote_average: movieDetails.vote_average,
      director: director,
      runtime: movieDetails.runtime,
    };
  } catch (error) {
    console.error(`❌ Error enhancing movie "${title}" with TMDB data:`, error);
    return null;
  }
}
