// AI Generated: GitHub Copilot - 2025-09-06
// Type declarations for functions/_lib/common.js - ES module matching runtime helper
// These are ambient declarations used by Cloudflare Pages Functions build.

export declare const corsHeaders: Record<string, string>;

export declare function withCORS(response: Response): Response;

export declare function jsonResponse(
  data: unknown,
  init?: globalThis.ResponseInit
): Response;

// Use the global Cache type from DOM lib
export declare function getCache(): globalThis.Cache | undefined | null;

export interface KvNamespaceLike {
  get(key: string, options?: { type?: string }): Promise<unknown>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
}

export declare function kvGetJson<T = unknown>(
  kv: KvNamespaceLike | null | undefined,
  key: string
): Promise<T | null>;

export declare function kvPutJson(
  kv: KvNamespaceLike | null | undefined,
  key: string,
  value: unknown,
  ttl?: number
): Promise<void>;

export interface TmdbEnvLike {
  TMDB_API_KEY?: string;
}

export declare function tmdbFetch(
  path: string,
  env: TmdbEnvLike,
  init?: globalThis.RequestInit
): Promise<Response>;

export interface ReducedMovie {
  id: unknown;
  title: unknown;
  year: number | null;
  poster_path: string | null;
  overview: unknown;
  rating: unknown;
  runtime: unknown;
}

export interface TmdbMovieInput {
  id?: unknown;
  title?: unknown;
  release_date?: string | Date | null;
  poster_path?: string | null;
  overview?: unknown;
  vote_average?: unknown;
  runtime?: unknown;
}

export declare function reduceMovie(m: TmdbMovieInput): ReducedMovie;

export declare function toYear(
  d: string | number | Date | null | undefined
): number | null;

export type DebugEnvLike = object;

export declare function isDebug(env?: DebugEnvLike | null): boolean;

export declare function debugLog(
  env: DebugEnvLike | null | undefined,
  ...args: unknown[]
): void;

// Canonical declarations live in functions/_types/*.d.ts — keep these lightweight

export declare function parseGenresToNames(
  genres: unknown
): string[] | undefined;
