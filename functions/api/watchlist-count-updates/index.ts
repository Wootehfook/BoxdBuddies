/*
 * BoxdBuddy - Watchlist Count Updates API Endpoint
 * Copyright (C) 2025 Wootehfook
 * AI Generated: Claude Sonnet 4 - 2025-01-02
 */

// Import cache function
import { setCount } from "../../letterboxd/cache/index.js";

// Export for testing
export { setCount };

interface Env {
  MOVIES_DB: any; // D1Database type
  TMDB_API_KEY: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  ADMIN_SECRET?: string;
  FEATURE_SERVER_WATCHLIST_CACHE?: string;
}

// Allow dependency injection for testing
let cacheSetCount = setCount;
export function setCacheFunctionForTesting(fn: typeof setCount) {
  cacheSetCount = fn;
}

interface UpdatePayload {
  username: string;
  count: number;
  etag?: string;
  lastFetchedAt?: number;
  source?: "client";
}

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 6; // 6 requests per 10 minutes per IP/username

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Validate authentication
function authenticateRequest(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");

  if (!env.ADMIN_SECRET) {
    console.error("ADMIN_SECRET not configured");
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Support both "Bearer <token>" and direct token formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === env.ADMIN_SECRET;
}

// Rate limiting by IP + username combination
function checkRateLimit(
  request: Request,
  username: string
): { allowed: boolean; remaining: number } {
  const clientIP =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";

  const key = `${clientIP}:${username}`;
  const now = Date.now();

  // Clean up old entries
  for (const [k, v] of rateLimitMap.entries()) {
    if (v.resetTime < now) {
      rateLimitMap.delete(k);
    }
  }

  const current = rateLimitMap.get(key);

  if (!current || current.resetTime < now) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  current.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count };
}

// Validate payload structure and values
function validatePayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof payload !== "object" || payload === null) {
    errors.push("Payload must be a JSON object");
    return { valid: false, errors };
  }

  // Required fields
  if (typeof payload.username !== "string" || !payload.username.trim()) {
    errors.push("username is required and must be a non-empty string");
  }

  if (typeof payload.count !== "number") {
    errors.push("count is required and must be a number");
  } else if (payload.count < 0) {
    errors.push("count must be >= 0");
  } else if (!Number.isInteger(payload.count)) {
    errors.push("count must be an integer");
  }

  // Optional fields validation
  if (payload.etag !== undefined && typeof payload.etag !== "string") {
    errors.push("etag must be a string if provided");
  }

  if (payload.lastFetchedAt !== undefined) {
    if (typeof payload.lastFetchedAt !== "number") {
      errors.push("lastFetchedAt must be a number if provided");
    } else {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (
        payload.lastFetchedAt > now + 60000 ||
        payload.lastFetchedAt < now - maxAge
      ) {
        errors.push("lastFetchedAt timestamp is unreasonable");
      }
    }
  }

  if (payload.source !== undefined && payload.source !== "client") {
    errors.push('source must be "client" if provided');
  }

  // Username sanitization
  if (typeof payload.username === "string") {
    const username = payload.username.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push("username contains invalid characters");
    }
    if (username.length > 50) {
      errors.push("username is too long (max 50 characters)");
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // Feature flag check
    if (
      !env.FEATURE_SERVER_WATCHLIST_CACHE ||
      env.FEATURE_SERVER_WATCHLIST_CACHE === "false"
    ) {
      return new Response(
        JSON.stringify({ error: "Server-side cache is disabled" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Authentication
    if (!authenticateRequest(request, env)) {
      console.warn("Unauthorized watchlist count update attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse and validate payload
    let payload: UpdatePayload;
    try {
      const body = await request.text();

      // Check payload size (max 1KB)
      if (body.length > 1024) {
        return new Response(
          JSON.stringify({ error: "Payload too large (max 1KB)" }),
          {
            status: 413,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      payload = JSON.parse(body);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate payload structure
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const username = payload.username.trim().toLowerCase();

    // Rate limiting
    const rateCheck = checkRateLimit(request, username);
    if (!rateCheck.allowed) {
      console.warn(`Rate limit exceeded for ${username}`);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString(),
            ...corsHeaders,
          },
        }
      );
    }

    // Set lastFetchedAt if missing and feature flag is truthy
    if (!payload.lastFetchedAt && env.FEATURE_SERVER_WATCHLIST_CACHE) {
      payload.lastFetchedAt = Date.now();
    }

    // Prepare cache entry
    const cachePayload = {
      count: payload.count,
      etag: payload.etag,
      lastFetchedAt: payload.lastFetchedAt || Date.now(),
      source: payload.source ?? "client",
    };

    // Store in cache
    try {
      await cacheSetCount(username, cachePayload, env);

      // Log successful update
      console.log(
        `Watchlist count update accepted for ${username}: count=${payload.count}, source=${cachePayload.source}`
      );

      return new Response(
        JSON.stringify({
          success: true,
          username,
          count: payload.count,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (err) {
      console.error("setCount error:", err);
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (error) {
    console.error("Watchlist count update error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
