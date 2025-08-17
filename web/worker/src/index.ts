/*
 * BoxdBuddies - Cloudflare Worker API
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// AI Generated: GitHub Copilot - 2025-01-07
// Cloudflare Worker for BoxdBuddies API endpoints

export interface Env {
  DB: D1Database;
  TMDB_API_KEY: string;
  ENVIRONMENT: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check endpoint
      if (path === '/api/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get friends endpoint
      if (path === '/api/friends' && request.method === 'GET') {
        return await handleGetFriends(env);
      }

      // Scrape watchlist endpoint
      if (path === '/api/scrape-watchlist' && request.method === 'POST') {
        const body = await request.json();
        return await handleScrapeWatchlist(body, env);
      }

      // Compare watchlists endpoint
      if (path === '/api/compare-watchlists' && request.method === 'POST') {
        const body = await request.json();
        return await handleCompareWatchlists(body, env);
      }

      // Get TMDB movies endpoint
      if (path === '/api/tmdb-movies' && request.method === 'GET') {
        return await handleGetTMDBMovies(env);
      }

      // 404 for unmatched routes
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};

// Handler functions
async function handleGetFriends(env: Env): Promise<Response> {
  const stmt = env.DB.prepare('SELECT * FROM friends ORDER BY username');
  const { results } = await stmt.all();
  
  return new Response(JSON.stringify({ friends: results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleScrapeWatchlist(body: any, env: Env): Promise<Response> {
  const { username } = body;
  
  if (!username) {
    return new Response(JSON.stringify({ error: 'Username required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // TODO: Implement Letterboxd scraping logic
  // For now, return mock data
  const mockWatchlist = [
    {
      title: 'The Matrix',
      year: 1999,
      letterboxdSlug: 'the-matrix',
      tmdbId: 603
    },
    {
      title: 'Inception',
      year: 2010,
      letterboxdSlug: 'inception',
      tmdbId: 27205
    }
  ];

  return new Response(JSON.stringify({ 
    username,
    watchlist: mockWatchlist,
    count: mockWatchlist.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleCompareWatchlists(body: any, env: Env): Promise<Response> {
  const { friends } = body;
  
  if (!friends || !Array.isArray(friends)) {
    return new Response(JSON.stringify({ error: 'Friends array required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // TODO: Implement watchlist comparison logic with D1 database
  // For now, return mock common movies
  const mockCommonMovies = [
    {
      id: 1,
      title: 'The Matrix',
      year: 1999,
      posterPath: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      overview: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
      rating: 8.7,
      genre: 'Action, Sci-Fi',
      director: 'The Wachowskis',
      averageRating: 8.7,
      friendCount: friends.length,
      friendList: friends,
      letterboxdSlug: 'the-matrix'
    }
  ];

  return new Response(JSON.stringify({ 
    movies: mockCommonMovies,
    totalCount: mockCommonMovies.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetTMDBMovies(env: Env): Promise<Response> {
  const stmt = env.DB.prepare('SELECT COUNT(*) as count FROM tmdb_movies');
  const { results } = await stmt.all();
  
  return new Response(JSON.stringify({ 
    count: results[0]?.count || 0,
    message: 'TMDB movies cache status'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}