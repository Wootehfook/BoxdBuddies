/*
 * BoxdBuddy - Root middleware for all Pages Functions
 * Copyright (C) 2025 Wootehfook
 * AI Generated: Claude Opus 5.5 - 2026-10-24
 *
 * Runs before every Function route listed in public/_routes.json:
 *  - Answers CORS preflight itself, only for allow-listed origins
 *  - Replaces any handler-set wildcard CORS with an origin allowlist
 *  - Adds security headers to every API response
 *  - Converts uncaught exceptions into a generic 500 (details logged only)
 */

import {
  API_SECURITY_HEADERS,
  CORS_HEADERS_ALLOWED,
  CORS_METHODS,
  isAllowedOrigin,
  jsonError,
} from "./_lib/security";

type MiddlewareContext = {
  request: Request;
  next: () => Promise<Response>;
};

function applyCors(headers: Headers, origin: string | null): void {
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Methods");
  headers.delete("Access-Control-Allow-Headers");
  headers.delete("Access-Control-Allow-Credentials");
  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", CORS_METHODS);
    headers.set("Access-Control-Allow-Headers", CORS_HEADERS_ALLOWED);
    headers.set("Access-Control-Max-Age", "600");
  }
  const vary = headers.get("Vary");
  if (!vary || !/\borigin\b/i.test(vary)) {
    headers.set("Vary", vary ? `${vary}, Origin` : "Origin");
  }
}

function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
}

export async function finalizeResponse(
  response: Response,
  origin: string | null
): Promise<Response> {
  // Clone into a mutable response (fetch()-derived responses are immutable).
  const out = new Response(response.body, response);
  applyCors(out.headers, origin);
  applySecurityHeaders(out.headers);
  return out;
}

export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const { request } = context;
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    const preflight = new Response(null, { status: 204 });
    applyCors(preflight.headers, origin);
    applySecurityHeaders(preflight.headers);
    return preflight;
  }

  let response: Response;
  try {
    response = await context.next();
  } catch (error) {
    console.error("Unhandled function error:", {
      path: new URL(request.url).pathname,
      method: request.method,
      error: error instanceof Error ? error.stack || error.message : error,
    });
    response = jsonError("Internal server error", 500);
  }

  return finalizeResponse(response, origin);
}
