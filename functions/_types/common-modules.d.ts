// AI Generated: GitHub Copilot - 2025-09-06
// Provides broad module declarations for various runtime import specifiers
// so TypeScript recognizes imports like '../../_lib/common' and '../../_lib/common.js'

declare module "*_lib/common" {
  export interface KvNamespaceLike {
    get(key: string, options?: { type?: string }): Promise<unknown>;
    put(
      key: string,
      value: string,
      options?: { expirationTtl?: number }
    ): Promise<void>;
  }

  export interface TmdbEnvLike {
    TMDB_API_KEY?: string;
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

  export interface ReducedMovie {
    id: unknown;
    title: unknown;
    year: number | null;
    poster_path: string | null;
    overview: unknown;
    rating: unknown;
    runtime: unknown;
  }

  export type DebugEnvLike = object;

  export function debugLog(
    env: DebugEnvLike | null | undefined,
    ...args: unknown[]
  ): void;
  export function isDebug(env?: DebugEnvLike | null): boolean;
  export const corsHeaders: Record<string, string>;
  export function jsonResponse(
    data: unknown,
    init?: globalThis.ResponseInit
  ): Response;
  export function tmdbFetch(
    path: string,
    env: TmdbEnvLike,
    init?: globalThis.RequestInit
  ): Promise<Response>;
  export function reduceMovie(m: TmdbMovieInput): ReducedMovie;
  export function parseGenresToNames(genres: unknown): string[] | undefined;
}

declare module "*_lib/common.js" {
  export interface KvNamespaceLike {
    get(key: string, options?: { type?: string }): Promise<unknown>;
    put(
      key: string,
      value: string,
      options?: { expirationTtl?: number }
    ): Promise<void>;
  }

  export interface TmdbEnvLike {
    TMDB_API_KEY?: string;
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

  export interface ReducedMovie {
    id: unknown;
    title: unknown;
    year: number | null;
    poster_path: string | null;
    overview: unknown;
    rating: unknown;
    runtime: unknown;
  }

  export type DebugEnvLike = object;

  export function debugLog(
    env: DebugEnvLike | null | undefined,
    ...args: unknown[]
  ): void;
  export function isDebug(env?: DebugEnvLike | null): boolean;
  export const corsHeaders: Record<string, string>;
  export function jsonResponse(
    data: unknown,
    init?: globalThis.ResponseInit
  ): Response;
  export function tmdbFetch(
    path: string,
    env: TmdbEnvLike,
    init?: globalThis.RequestInit
  ): Promise<Response>;
  export function reduceMovie(m: TmdbMovieInput): ReducedMovie;
  export function parseGenresToNames(genres: unknown): string[] | undefined;
}
