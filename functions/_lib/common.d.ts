// AI Generated: GitHub Copilot - 2025-09-06
// Type declarations for functions/_lib/common.js - ES module matching runtime helper
export const corsHeaders: Record<string, string>;
// AI Generated: GitHub Copilot - 2025-09-06
// Type declarations for functions/_lib/common.js - ES module matching runtime helper
// These are ambient declarations used by Cloudflare Pages Functions build.

export declare const corsHeaders: Record<string, string>;

export declare function withCORS(response: Response): Response;

export declare function jsonResponse(data: any, init?: any): Response;

// Use the global Cache type from DOM lib
export declare function getCache(): globalThis.Cache | undefined | null;

export declare function kvGetJson(kv: any, key: string): Promise<any | null>;

export declare function kvPutJson(
  kv: any,
  key: string,
  value: any,
  ttl?: number
): Promise<void>;

export declare function tmdbFetch(
  path: string,
  env: any,
  init?: any
): Promise<Response>;

export declare function reduceMovie(m: any): any;

export declare function toYear(d: any): number | null;

export declare function isDebug(env?: any): boolean;

export declare function debugLog(env: any, ...args: any[]): void;

// Neutralized duplicate declarations in functions/_lib to avoid conflicts.
// Canonical declarations live in functions/_types/*.d.ts
