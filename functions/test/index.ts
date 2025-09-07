// AI Generated: GitHub Copilot - 2025-08-16
// Simple test endpoint to verify function deployment

import type { Env as CacheEnv } from "../letterboxd/cache/index.js";
type Env = CacheEnv & { ADMIN_SECRET?: string };

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    // Test database connection
    const dbTest = await env.MOVIES_DB.prepare("SELECT 1 as test").first();

    return Response.json({
      status: "success",
      database: dbTest ? "connected" : "not connected",
      hasApiKey: !!env.TMDB_API_KEY,
      hasAdminSecret: !!env.ADMIN_SECRET,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        hasApiKey: !!env.TMDB_API_KEY,
        hasAdminSecret: !!env.ADMIN_SECRET,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
