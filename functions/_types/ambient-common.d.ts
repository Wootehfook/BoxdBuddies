// AI Generated: GitHub Copilot - 2025-09-06
// Explicit ambient declarations for runtime helper import variants
declare module "../../_lib/common" {
  export const corsHeaders: Record<string, string>;
  export function withCORS(response: Response): Response;
  export function jsonResponse(data: any, init?: any): Response;
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
  export function parseGenresToNames(genres: unknown): string[] | undefined;
  export function toYear(d: any): number | null;
  export function isDebug(env?: any): boolean;
  export function debugLog(env: any, ...args: any[]): void;
}

declare module "../../_lib/common.js" {
  export const corsHeaders: Record<string, string>;
  export function withCORS(response: Response): Response;
  export function jsonResponse(data: any, init?: any): Response;
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
  export function parseGenresToNames(genres: unknown): string[] | undefined;
  export function toYear(d: any): number | null;
  export function isDebug(env?: any): boolean;
  export function debugLog(env: any, ...args: any[]): void;
}
