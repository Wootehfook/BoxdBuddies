/*
 * BoxdBuddy - TMDB API Test
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

interface Env {
  MOVIES_DB: any;
  TMDB_API_KEY: string;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { env } = context;

  if (!env.TMDB_API_KEY) {
    return Response.json(
      {
        success: false,
        error: "TMDB_API_KEY not configured",
      },
      { status: 500 }
    );
  }

  try {
    // Test TMDB API with a simple call
    const response = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${env.TMDB_API_KEY}`
    );

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: `TMDB API error: ${response.status} ${response.statusText}`,
          apiKeyLength: env.TMDB_API_KEY.length,
          apiKeyStart: env.TMDB_API_KEY.substring(0, 8) + "...",
          timestamp: new Date().toISOString(),
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return Response.json({
      success: true,
      message: "TMDB API key is valid",
      apiKeyLength: env.TMDB_API_KEY.length,
      apiKeyStart: env.TMDB_API_KEY.substring(0, 8) + "...",
      tmdbConfig: {
        imageBaseUrl: data.images.secure_base_url,
        posterSizes: data.images.poster_sizes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        apiKeyLength: env.TMDB_API_KEY ? env.TMDB_API_KEY.length : 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
