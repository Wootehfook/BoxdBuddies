// AI Generated: GitHub Copilot - 2025-08-17
// Enhanced health check endpoint with detailed service status reporting

import { jsonResponse, errorResponse, corsResponse } from "../_lib/common.js";

// Define interfaces for TypeScript-like structure in JSDoc
/**
 * @typedef {Object} Env
 * @property {Object} MOVIES_DB - D1 Database instance
 * @property {Object} MOVIES_KV - KV Namespace instance
 * @property {string} TMDB_API_KEY - TMDB API key
 */

/**
 * Enhanced health check with service status details
 * @param {Object} context - Request context
 * @param {Request} context.request - Request object
 * @param {Env} context.env - Environment object
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Detailed service health checks
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    project: "boxdbud",
    environment: "cloudflare-pages",
    path: url.pathname,
    method: request.method,
    functions_working: true,
    services: {
      database: { status: "unknown", message: null },
      kv_storage: { status: "unknown", message: null },
      tmdb_api: { status: "unknown", message: null },
    },
  };

  // Test database connectivity
  try {
    if (env.MOVIES_DB) {
      const dbResult = await env.MOVIES_DB.prepare("SELECT 1 as test").all();
      healthStatus.services.database = {
        status: dbResult.success ? "healthy" : "degraded",
        message: dbResult.success
          ? "Database responsive"
          : "Database query failed",
      };
    } else {
      healthStatus.services.database = {
        status: "unavailable",
        message: "Database not configured",
      };
    }
  } catch (error) {
    healthStatus.services.database = {
      status: "error",
      message: `Database error: ${error.message}`,
    };
  }

  // Test KV storage
  try {
    if (env.MOVIES_KV) {
      const testKey = `health_check_${Date.now()}`;
      await env.MOVIES_KV.put(testKey, "test_value", { expirationTtl: 60 });
      const testValue = await env.MOVIES_KV.get(testKey);
      healthStatus.services.kv_storage = {
        status: testValue === "test_value" ? "healthy" : "degraded",
        message:
          testValue === "test_value"
            ? "KV storage responsive"
            : "KV storage read/write failed",
      };
    } else {
      healthStatus.services.kv_storage = {
        status: "unavailable",
        message: "KV storage not configured",
      };
    }
  } catch (error) {
    healthStatus.services.kv_storage = {
      status: "error",
      message: `KV storage error: ${error.message}`,
    };
  }

  // Test TMDB API connectivity
  try {
    if (env.TMDB_API_KEY) {
      const tmdbTestUrl = `https://api.themoviedb.org/3/configuration?api_key=${env.TMDB_API_KEY}`;
      const tmdbResponse = await fetch(tmdbTestUrl, {
        headers: { "User-Agent": "BoxdBuddy/1.1.0" },
      });
      healthStatus.services.tmdb_api = {
        status: tmdbResponse.ok ? "healthy" : "degraded",
        message: tmdbResponse.ok
          ? "TMDB API responsive"
          : `TMDB API returned ${tmdbResponse.status}`,
      };
    } else {
      healthStatus.services.tmdb_api = {
        status: "unavailable",
        message: "TMDB API key not configured",
      };
    }
  } catch (error) {
    healthStatus.services.tmdb_api = {
      status: "error",
      message: `TMDB API error: ${error.message}`,
    };
  }

  // Determine overall status
  const serviceStatuses = Object.values(healthStatus.services).map(
    (s) => s.status
  );
  if (serviceStatuses.includes("error")) {
    healthStatus.status = "error";
  } else if (serviceStatuses.includes("degraded")) {
    healthStatus.status = "degraded";
  } else if (
    serviceStatuses.every((s) => s === "healthy" || s === "unavailable")
  ) {
    healthStatus.status = "ok";
  }

  const statusCode =
    healthStatus.status === "ok"
      ? 200
      : healthStatus.status === "degraded"
        ? 200
        : 503;

  return jsonResponse(healthStatus, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// Handle CORS preflight
export async function onRequestOptions() {
  return corsResponse();
}
