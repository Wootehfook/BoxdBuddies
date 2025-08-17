// AI Generated: GitHub Copilot - 2025-08-16
export async function onRequest(context: any) {
  const { env } = context;

  try {
    const database = env.MOVIES_DB;

    // Search for common movies with very broad patterns
    const searches = [
      { term: "Hamilton", pattern: "%hamilton%" },
      { term: "Farewell", pattern: "%farewell%" },
      { term: "Sweetheart", pattern: "%sweetheart%" },
      { term: "Pulse", pattern: "%pulse%" },
      { term: "Kwaidan", pattern: "%kwaidan%" },
      { term: "Tale Two Sisters", pattern: "%tale%sisters%" },
      { term: "Coming Home Dark", pattern: "%coming%home%" },
      { term: "Last Year Marienbad", pattern: "%marienbad%" },
      { term: "World End", pattern: "%world%end%" },
    ];

    const results = [];
    for (const search of searches) {
      const result = await database
        .prepare(
          `
        SELECT title, year, poster_path, vote_average 
        FROM tmdb_movies 
        WHERE LOWER(title) LIKE LOWER(?)
        ORDER BY vote_average DESC
        LIMIT 5
      `
        )
        .bind(search.pattern)
        .all();

      results.push({
        searchTerm: search.term,
        pattern: search.pattern,
        count: result.results?.length || 0,
        results: result.results || [],
      });
    }

    // Also check total database stats
    const stats = await database
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN year >= 2000 THEN 1 END) as modern_movies,
        COUNT(CASE WHEN vote_average >= 7 THEN 1 END) as good_movies
      FROM tmdb_movies
    `
      )
      .first();

    return Response.json({
      searches: results,
      stats: stats,
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
