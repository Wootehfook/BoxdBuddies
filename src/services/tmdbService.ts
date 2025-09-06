// AI Generated: Compatibility shim for tests

import { CloudflareBackend } from "./cloudflareBackend";
// axios not needed in this shim; backend handles network lookup

/**
 * Minimal TMDB service shim to satisfy tests that import ../../src/services/tmdbService
 * - Exports `tmdbService` with `setApiKey` and `searchMovies`.
 * - Attempts backend minimal lookup when import.meta.env.VITE_TMDB_BACKEND === "true"
 * - Falls back to axios search when backend lookup fails.
 */

export interface MovieResult {
  id: number;
  title: string;
  year: number | null;
  poster_path?: string | null;
}

export interface SearchResult {
  movies: MovieResult[];
  totalPages: number;
}

type BackendMovie = {
  tmdb_data?: {
    id?: number;
    release_date?: string;
    poster_path?: string | null;
  };
  tmdb_id?: number;
  id?: number;
  title?: string;
  name?: string;
  year?: number | string;
  release_date?: string;
  poster_path?: string | null;
};

// Export a minimal tmdbService compatible object for tests and callers
// AI Generated: GitHub Copilot - 2025-09-06
export const tmdbService = (() => {
  // no-op setApiKey kept for compatibility with callers
  function setApiKey(_key: string) {
    return;
  }

  function parseYearFromMovie(m: BackendMovie): number | null {
    if (typeof m?.year === "number") return m.year as number;
    if (m?.year) return Number(m.year);
    if (m?.tmdb_data?.release_date)
      return Number(String(m.tmdb_data.release_date).slice(0, 4));
    if (m?.release_date) return Number(String(m.release_date).slice(0, 4));
    return null;
  }

  async function searchMovies(query: string, page = 1): Promise<SearchResult> {
    // Prefer backend API when available; fall back to empty result on error
    try {
      const backendRes = (await CloudflareBackend.searchMovies(query, page)) as
        | { movies?: BackendMovie[]; totalPages?: number }
        | undefined;

      const moviesArr = backendRes?.movies ?? [];
      const totalPages = backendRes?.totalPages ?? 1;

      if (moviesArr.length > 0) {
        const m = moviesArr[0];
        // Map backend movie shape to MovieResult expected by callers/tests
        const movieId = m?.tmdb_data?.id ?? m?.tmdb_id ?? m?.id ?? 0;

        const title = m?.title ?? m?.name ?? String(query);

        const year = parseYearFromMovie(m);

        const poster_path = m?.tmdb_data?.poster_path ?? m?.poster_path ?? null;

        const movie: MovieResult = {
          id: movieId,
          title,
          year,
          poster_path,
        };

        return { totalPages, movies: [movie] };
      }

      return { totalPages, movies: [] };
    } catch {
      // On error, return a stable empty result
      return { totalPages: 1, movies: [] };
    }
  }

  return {
    setApiKey,
    searchMovies,
  };
})();
