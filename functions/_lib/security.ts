/*
 * BoxdBuddy - Shared security helpers for Pages Functions
 * Copyright (C) 2025 Wootehfook
 * AI Generated: Claude Opus 5.5 - 2026-10-24
 *
 * Centralizes input validation, CORS origin policy, constant-time secret
 * comparison and generic error responses so every handler applies the same
 * rules.
 */

/** Letterboxd usernames: letters, digits, underscore (hyphen kept for back-compat). */
export const USERNAME_PATTERN = /^[a-z0-9_-]{1,50}$/i;
export const MAX_COMPARE_USERS = 10;
export const MIN_COMPARE_USERS = 2;

export class InputError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

/**
 * Validate a single username. Returns the trimmed value (case preserved so
 * downstream display/matching behaviour is unchanged) or throws InputError.
 */
export function parseUsername(value: unknown): string {
  if (typeof value !== "string") {
    throw new InputError("Username must be a string");
  }
  const trimmed = value.trim();
  if (!USERNAME_PATTERN.test(trimmed)) {
    throw new InputError("Invalid username format");
  }
  return trimmed;
}

/** Non-throwing variant for call sites that prefer a boolean check. */
export function isValidUsername(value: unknown): value is string {
  return typeof value === "string" && USERNAME_PATTERN.test(value.trim());
}

/**
 * Normalise the request body shapes accepted by the comparison endpoints:
 *   { username, friends: [] }  or  { usernames: [] }
 * Validates every entry, removes case-insensitive duplicates and enforces
 * the 2..10 user bounds. Throws InputError on any invalid entry rather than
 * silently dropping it, so clients get a clear 400.
 */
export function parseUsernameList(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    throw new InputError("Request body must be a JSON object");
  }
  const b = body as {
    username?: unknown;
    friends?: unknown;
    usernames?: unknown;
  };

  let raw: unknown[];
  if (b.username !== undefined && Array.isArray(b.friends)) {
    raw = [b.username, ...b.friends];
  } else if (Array.isArray(b.usernames)) {
    raw = b.usernames;
  } else {
    throw new InputError(
      "Either { username, friends } or { usernames } is required"
    );
  }

  if (raw.length > MAX_COMPARE_USERS) {
    throw new InputError(`At most ${MAX_COMPARE_USERS} usernames are allowed`);
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of raw) {
    const name = parseUsername(entry);
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
  }

  if (result.length < MIN_COMPARE_USERS) {
    throw new InputError(
      `At least ${MIN_COMPARE_USERS} valid usernames are required`
    );
  }
  return result;
}

/**
 * Constant-time secret comparison. Both inputs are hashed to fixed-length
 * SHA-256 digests first so neither length nor early mismatch leaks timing.
 * Works in the Workers runtime and in Node (tests).
 */
export async function secretEquals(
  provided: string | null | undefined,
  expected: string | null | undefined
): Promise<boolean> {
  if (!provided || !expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

/**
 * Extract the admin token from an Authorization header. Accepts
 * "Bearer <token>" (preferred) and, for backwards compatibility with existing
 * scripts, a raw token.
 */
export function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed) return null;
  const match = /^Bearer\s+(.+)$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

export async function isAdminRequest(
  request: Request,
  adminSecret: string | undefined
): Promise<boolean> {
  if (!adminSecret) return false;
  const token = extractBearerToken(request.headers.get("Authorization"));
  return secretEquals(token, adminSecret);
}

/* ------------------------------------------------------------------ */
/* CORS                                                                */
/* ------------------------------------------------------------------ */

const PRODUCTION_ORIGINS = ["https://boxdbud.io", "https://www.boxdbud.io"];
const DEV_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
/** Cloudflare Pages preview deployments for this project only. */
const PREVIEW_ORIGIN_PATTERN = /^https:\/\/[a-z0-9-]+\.boxdbud\.pages\.dev$/;

export function isAllowedOrigin(origin: string | null): origin is string {
  if (!origin) return false;
  return (
    PRODUCTION_ORIGINS.includes(origin) ||
    DEV_ORIGIN_PATTERN.test(origin) ||
    PREVIEW_ORIGIN_PATTERN.test(origin) ||
    origin === "https://boxdbud.pages.dev"
  );
}

export const CORS_METHODS = "GET, POST, OPTIONS";
export const CORS_HEADERS_ALLOWED = "Content-Type, Authorization";

/** Security headers applied to every Function (API) response. */
export const API_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-site",
};

/** Generic JSON error response that never echoes internal error details. */
export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
