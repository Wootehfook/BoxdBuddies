// AI Generated: GitHub Copilot - 2025-08-16

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  first(): Promise<Record<string, unknown> | null>;
}

interface D1Result {
  success: boolean;
  results?: unknown[];
}

interface MovieData {
  letterboxd_slug: string;
  title: string;
  year: number | null;
  letterboxd_url: string;
}

interface Env {
  MOVIES_DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  const action = url.searchParams.get("action");
  const countOnly = url.searchParams.get("count_only") === "true";

  if (!username) {
    return Response.json({ error: "Username required" }, { status: 400 });
  }

  switch (action) {
    case "watchlist":
      return getWatchlist(env, username, countOnly);
    case "friends":
      return getFriends(env, username);
    default:
      return Response.json({ error: "Invalid action" }, { status: 400 });
  }
}

async function getWatchlist(env: Env, username: string, countOnly = false) {
  const cacheKey = `watchlist:${username}`;

  // Check cache first
  const cached = await env.MOVIES_DB.prepare(
    `SELECT data, item_count, expires_at FROM letterboxd_cache 
     WHERE cache_key = ? AND expires_at > CURRENT_TIMESTAMP`
  )
    .bind(cacheKey)
    .first();

  if (cached && cached.data) {
    if (countOnly) {
      return Response.json({ count: cached.item_count });
    }
    return Response.json({
      movies: JSON.parse(cached.data as string),
      count: cached.item_count,
      cached: true,
    });
  }

  // If count only and not cached, do a quick scrape for count
  if (countOnly) {
    const count = await getWatchlistCount(username);
    return Response.json({ count });
  }

  // Scrape from Letterboxd
  const movies = await scrapeWatchlist(username);

  // Cache for 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await env.MOVIES_DB.prepare(
    `INSERT OR REPLACE INTO letterboxd_cache 
     (cache_key, username, data_type, data, item_count, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      cacheKey,
      username,
      "watchlist",
      JSON.stringify(movies),
      movies.length,
      expiresAt
    )
    .run();

  return Response.json({
    movies,
    count: movies.length,
    cached: false,
  });
}

async function getWatchlistCount(username: string): Promise<number> {
  try {
    const url = `https://letterboxd.com/${username}/watchlist/`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BoxdBuddy/1.0)",
      },
    });

    if (!response.ok) return 0;

    const html = await response.text();

    // Look for pagination info or count
    const countMatch = html.match(
      /Showing [\d,]+ to [\d,]+ of ([\d,]+) entries/
    );
    if (countMatch) {
      return parseInt(countMatch[1].replace(/,/g, ""));
    }

    // Fallback: count movie elements on first page
    const movieMatches = html.matchAll(
      /<div class="poster" data-film-slug="([^"]+)"/g
    );
    return Array.from(movieMatches).length;
  } catch {
    return 0;
  }
}

async function scrapeWatchlist(username: string): Promise<MovieData[]> {
  const movies: MovieData[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 10) {
    const url = `https://letterboxd.com/${username}/watchlist/page/${page}/`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BoxdBuddy/1.0)",
      },
    });

    if (!response.ok) break;

    const html = await response.text();
    const movieMatches = html.matchAll(
      /<div class="poster" data-film-slug="([^"]+)"[^>]*>[\s\S]*?<img[^>]*alt="([^"]+)"[^>]*>/g
    );

    let pageMovies = 0;
    for (const match of movieMatches) {
      const [, slug, title] = match;

      // Extract year from title if present
      const yearMatch = title.match(/\((\d{4})\)$/);
      const cleanTitle = title.replace(/\s*\(\d{4}\)$/, "");
      const year = yearMatch ? parseInt(yearMatch[1]) : null;

      movies.push({
        letterboxd_slug: slug,
        title: cleanTitle,
        year,
        letterboxd_url: `https://letterboxd.com/film/${slug}/`,
      });
      pageMovies++;
    }

    hasMore = pageMovies > 0;
    page++;

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return movies;
}

async function getFriends(env: Env, username: string) {
  const cacheKey = `friends:${username}`;

  const cached = await env.MOVIES_DB.prepare(
    `SELECT data, item_count, expires_at FROM letterboxd_cache 
     WHERE cache_key = ? AND expires_at > CURRENT_TIMESTAMP`
  )
    .bind(cacheKey)
    .first();

  if (cached && cached.data) {
    return Response.json({
      friends: JSON.parse(cached.data as string),
      count: cached.item_count,
      cached: true,
    });
  }

  // Scrape friends list
  const url = `https://letterboxd.com/${username}/following/`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BoxdBuddy/1.0)",
    },
  });

  if (!response.ok) {
    return Response.json({ error: "Failed to fetch friends" }, { status: 500 });
  }

  const html = await response.text();
  const friendMatches = html.matchAll(
    /<a[^>]*href="\/([^/]+)\/"[^>]*class="[^"]*avatar[^"]*"[^>]*>/g
  );

  const friends = Array.from(friendMatches).map((match) => match[1]);

  // Cache for 7 days
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  await env.MOVIES_DB.prepare(
    `INSERT OR REPLACE INTO letterboxd_cache 
     (cache_key, username, data_type, data, item_count, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      cacheKey,
      username,
      "friends",
      JSON.stringify(friends),
      friends.length,
      expiresAt
    )
    .run();

  return Response.json({
    friends,
    count: friends.length,
    cached: false,
  });
}
