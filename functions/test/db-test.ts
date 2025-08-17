/*
 * Test endpoint to verify TMDB database connection
 * AI Generated: GitHub Copilot - 2025-08-16
 */

interface Env {
  MOVIES_DB: any; // D1Database type
}

export async function onRequestGet(context: { env: Env }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    // Test database connection
    const countResult = await context.env.MOVIES_DB.prepare(
      `
      SELECT COUNT(*) as movie_count FROM tmdb_movies
    `
    ).first();

    // Get a sample movie
    const sampleResult = await context.env.MOVIES_DB.prepare(
      `
      SELECT title, year, poster_path, vote_average 
      FROM tmdb_movies 
      WHERE poster_path IS NOT NULL 
      LIMIT 1
    `
    ).first();

    // Test specific movie lookup
    const testResult = await context.env.MOVIES_DB.prepare(
      `
      SELECT title, year, poster_path, vote_average 
      FROM tmdb_movies 
      WHERE LOWER(title) = 'the matrix'
    `
    ).first();

    return new Response(
      JSON.stringify({
        success: true,
        database_connected: true,
        movie_count: countResult?.movie_count || 0,
        sample_movie: sampleResult,
        matrix_lookup: testResult,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Database test error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
