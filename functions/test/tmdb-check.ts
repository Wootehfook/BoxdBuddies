// AI Generated: GitHub Copilot - 2025-08-16
export async function onRequest(context: any) {
  const { env } = context;

  try {
    // Check TMDB database contents
    const database = env.MOVIES_DB;

    // Get total count
    const countResult = await database
      .prepare(
        `
      SELECT COUNT(*) as count FROM tmdb_movies
    `
      )
      .first();

    // Get sample movies
    const sampleMovies = await database
      .prepare(
        `
      SELECT title, year, poster_path, vote_average 
      FROM tmdb_movies 
      ORDER BY vote_average DESC 
      LIMIT 10
    `
      )
      .all();

    // Search for specific movies from the user's list
    const specificMovies = [
      "Hamilton",
      "The Farewell",
      "Sweetheart",
      "Pulse",
      "Kwaidan",
    ];

    const searches = [];
    for (const movie of specificMovies) {
      const result = await database
        .prepare(
          `
        SELECT title, year, poster_path, vote_average 
        FROM tmdb_movies 
        WHERE LOWER(title) LIKE LOWER(?)
        LIMIT 3
      `
        )
        .bind(`%${movie}%`)
        .all();

      searches.push({
        searchTerm: movie,
        results: result.results || [],
      });
    }

    return Response.json({
      totalMovies: countResult?.count || 0,
      sampleMovies: sampleMovies.results || [],
      specificSearches: searches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
