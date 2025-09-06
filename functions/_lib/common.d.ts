// AI Generated: GitHub Copilot - 2025-09-06
// Type declarations for functions/_lib/common.js - ES module matching runtime helper
export const corsHeaders: Record<string, string>;

export function withCORS(response: Response): Response;

export function jsonResponse(data: any, init?: any): Response;

// Use the global Cache type from DOM lib
export function getCache(): globalThis.Cache | undefined | null;

export function kvGetJson(kv: any, key: string): Promise<any | null>;

export function kvPutJson(
  kv: any,
  key: string,
  value: any,
  ttl?: number
): Promise<void>;

export function tmdbFetch(
  path: string,
  env: any,
  init?: any
): Promise<Response>;

export function reduceMovie(m: any): any;

export function toYear(d: any): number | null;

export function isDebug(env?: any): boolean;

export function debugLog(env: any, ...args: any[]): void;

// Neutralized duplicate declarations in functions/_lib to avoid conflicts.
// Canonical declarations live in functions/_types/*.d.ts
