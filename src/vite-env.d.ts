/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY?: string;
  // AI Generated: GitHub Copilot - 2025-08-15
  readonly VITE_TMDB_BACKEND?: string; // "true" to enable backend minimal lookup path
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
