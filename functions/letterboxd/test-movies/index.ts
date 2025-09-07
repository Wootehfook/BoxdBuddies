/*
 * BoxdBuddy - Test Movies in TMDB Database
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot - 2025-08-16
 */

import type { Env as CacheEnv } from "../cache/index.js";
type Env = CacheEnv;

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const searchTitle = url.searchParams.get("title");

  try {
    let result;

    if (searchTitle) {
      // Search for specific movie
      result = await context.env.MOVIES_DB.prepare(
        `
        SELECT * FROM tmdb_movies 
        WHERE LOWER(title) LIKE LOWER(?)
        ORDER BY vote_average DESC
        LIMIT 10
      `
      )
        .bind(`%${searchTitle}%`)
        .all();
    } else {
      // Show sample of horror/thriller movies that might be in watchlists
      result = await context.env.MOVIES_DB.prepare(
        `
        SELECT * FROM tmdb_movies 
        WHERE LOWER(title) LIKE '%pulse%' 
        OR LOWER(title) LIKE '%tale%' 
        OR LOWER(title) LIKE '%two sisters%'
        OR LOWER(title) LIKE '%horror%'
        OR LOWER(title) LIKE '%saw%'
        OR LOWER(title) LIKE '%ring%'
        ORDER BY vote_average DESC
        LIMIT 20
      `
      ).all();
    }

    return new Response(
      JSON.stringify(
        {
          search: searchTitle || "horror/thriller movies",
          count: result.results?.length || 0,
          movies: result.results,
        },
        null,
        2
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
