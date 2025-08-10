/*
 * BoxdBuddies Cloudflare Worker API
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// AI Generated: GitHub Copilot - 2025-08-10

export interface Env {
  ALLOWED_ORIGINS: string;
  ENVIRONMENT: string;
}

export interface Movie {
  id: number;
  title: string;
  year: number;
  posterPath?: string;
  overview?: string;
  rating?: number;
  genre?: string;
  director?: string;
  averageRating?: number;
  friendCount: number;
  friendList?: string[];
  letterboxdSlug?: string;
}

export interface Friend {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  watchlistCount?: number;
}

export interface ComparisonRequest {
  mainUsername: string;
  friendUsernames: string[];
  tmdbApiKey?: string;
  limitTo500?: boolean;
}

export interface ComparisonResult {
  commonMovies: Movie[];
}

// CORS headers
function getCorsHeaders(origin: string, env: Env): Record<string, string> {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Letterboxd scraping functions
async function scrapeLetterboxdFriends(username: string): Promise<Friend[]> {
  try {
    console.log(`Scraping friends for ${username}`);
    
    const url = `https://letterboxd.com/${username}/following/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch friends page: ${response.status}`);
    }

    const html = await response.text();
    const friends: Friend[] = [];

    // Parse friend cards from HTML
    // This is a simplified parser - in production you'd want more robust parsing
    const friendMatches = html.matchAll(/<a[^>]*href="\/([^\/]+)\/"[^>]*class="[^"]*person[^"]*"[^>]*>/g);
    
    for (const match of friendMatches) {
      const username = match[1];
      if (username && !username.includes('letterboxd.com') && username !== 'films') {
        friends.push({
          username,
          displayName: username,
          watchlistCount: Math.floor(Math.random() * 200) + 10, // Mock data for demo
        });
      }
    }

    console.log(`Found ${friends.length} friends for ${username}`);
    return friends.slice(0, 20); // Limit to first 20 friends
  } catch (error) {
    console.error('Error scraping friends:', error);
    throw new Error('Failed to scrape friends from Letterboxd');
  }
}

async function scrapeWatchlist(username: string): Promise<Movie[]> {
  try {
    console.log(`Scraping watchlist for ${username}`);
    
    const url = `https://letterboxd.com/${username}/watchlist/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist: ${response.status}`);
    }

    const html = await response.text();
    const movies: Movie[] = [];
    let movieId = 1;

    // Simple regex to extract movie titles and years from Letterboxd
    // This is a basic implementation - production would need more robust parsing
    const movieMatches = html.matchAll(/<img[^>]*alt="([^"]+)"[^>]*>/g);
    
    for (const match of movieMatches) {
      const fullTitle = match[1];
      if (fullTitle && !fullTitle.includes('Avatar') && fullTitle.length > 2) {
        // Extract year from title like "Movie Title (2023)"
        const yearMatch = fullTitle.match(/\((\d{4})\)$/);
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        const title = fullTitle.replace(/\s*\(\d{4}\)$/, '');

        movies.push({
          id: movieId++,
          title,
          year,
          friendCount: 1,
          friendList: [username],
        });
      }
    }

    console.log(`Found ${movies.length} movies in ${username}'s watchlist`);
    return movies.slice(0, 50); // Limit for demo
  } catch (error) {
    console.error(`Error scraping watchlist for ${username}:`, error);
    return []; // Return empty array on error
  }
}

async function enhanceMoviesWithTMDB(movies: Movie[], apiKey?: string): Promise<Movie[]> {
  if (!apiKey) {
    console.log('No TMDB API key provided, skipping enhancement');
    return movies;
  }

  console.log(`Enhancing ${movies.length} movies with TMDB data`);
  const enhanced: Movie[] = [];

  for (const movie of movies) {
    try {
      // Search for movie on TMDB
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movie.title)}&year=${movie.year}`;
      const searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          const tmdbMovie = searchData.results[0];
          
          enhanced.push({
            ...movie,
            overview: tmdbMovie.overview,
            posterPath: tmdbMovie.poster_path 
              ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
              : undefined,
            averageRating: tmdbMovie.vote_average,
            genre: 'Drama', // Simplified - would need genre lookup
          });
        } else {
          enhanced.push(movie);
        }
      } else {
        enhanced.push(movie);
      }
    } catch (error) {
      console.error(`Error enhancing movie ${movie.title}:`, error);
      enhanced.push(movie);
    }
  }

  return enhanced;
}

async function compareWatchlists(request: ComparisonRequest): Promise<ComparisonResult> {
  try {
    console.log('Starting watchlist comparison', request);
    
    // Scrape main user's watchlist
    const mainWatchlist = await scrapeWatchlist(request.mainUsername);
    
    // Scrape friends' watchlists
    const friendWatchlists: Record<string, Movie[]> = {};
    for (const friendUsername of request.friendUsernames) {
      friendWatchlists[friendUsername] = await scrapeWatchlist(friendUsername);
    }

    // Find common movies
    const commonMovies: Movie[] = [];
    
    for (const movie of mainWatchlist) {
      const friendsWithMovie: string[] = [request.mainUsername];
      
      for (const [friendUsername, watchlist] of Object.entries(friendWatchlists)) {
        const hasMovie = watchlist.some(
          m => m.title.toLowerCase() === movie.title.toLowerCase() && 
               Math.abs(m.year - movie.year) <= 1
        );
        
        if (hasMovie) {
          friendsWithMovie.push(friendUsername);
        }
      }
      
      if (friendsWithMovie.length > 1) { // At least main user + 1 friend
        commonMovies.push({
          ...movie,
          friendCount: friendsWithMovie.length,
          friendList: friendsWithMovie,
        });
      }
    }

    // Enhance with TMDB data if API key provided
    const enhancedMovies = await enhanceMoviesWithTMDB(commonMovies, request.tmdbApiKey);
    
    console.log(`Found ${enhancedMovies.length} common movies`);
    
    return {
      commonMovies: enhancedMovies,
    };
  } catch (error) {
    console.error('Error comparing watchlists:', error);
    throw new Error('Failed to compare watchlists');
  }
}

// Main Worker handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin, env);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Scrape friends endpoint
    if (url.pathname === '/api/scrape-friends' && request.method === 'POST') {
      try {
        const body = await request.json() as { username: string };
        const friends = await scrapeLetterboxdFriends(body.username);
        
        return new Response(
          JSON.stringify({ friends }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error('Error in scrape-friends:', error);
        return new Response(
          JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Failed to scrape friends' 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }

    // Compare watchlists endpoint
    if (url.pathname === '/api/compare-watchlists' && request.method === 'POST') {
      try {
        const compareRequest = await request.json() as ComparisonRequest;
        const result = await compareWatchlists(compareRequest);
        
        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error('Error in compare-watchlists:', error);
        return new Response(
          JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Failed to compare watchlists' 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }

    // 404 for unmatched routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  },
};