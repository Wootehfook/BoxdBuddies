// AI Generated: GitHub Copilot - 2025-09-06
// Provides broad module declarations for various runtime import specifiers
// so TypeScript recognizes imports like '../../_lib/common' and '../../_lib/common.js'

declare module "*_lib/common" {
  export function debugLog(env: any, ...args: any[]): void;
  export function isDebug(env?: any): boolean;
  export const corsHeaders: Record<string, string>;
  export function jsonResponse(data: any, init?: any): Response;
  export function tmdbFetch(
    path: string,
    env: any,
    init?: any
  ): Promise<Response>;
  export function reduceMovie(m: any): any;
}

declare module "*_lib/common.js" {
  export function debugLog(env: any, ...args: any[]): void;
  export function isDebug(env?: any): boolean;
  export const corsHeaders: Record<string, string>;
  export function jsonResponse(data: any, init?: any): Response;
  export function tmdbFetch(
    path: string,
    env: any,
    init?: any
  ): Promise<Response>;
  export function reduceMovie(m: any): any;
}
