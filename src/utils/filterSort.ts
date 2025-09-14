// AI Generated: GitHub Copilot - 2025-09-14
// Utilities for filtering and sorting movie results

import type { Movie } from "../types";

export type SortBy = "title" | "year" | "rating" | "friends";
export type SortDir = "asc" | "desc";

export interface Filters {
  titleQuery: string;
  selectedGenres: string[];
  yearMin: number | null;
  yearMax: number | null;
  sortBy: SortBy;
  sortDir: SortDir;
}

// Normalize titles for searching/sorting: decode common entities, collapse whitespace, lowercase
export function normalizeTitle(raw: string): string {
  if (!raw) return "";
  // Basic normalization similar to ResultsPage.decodeHtmlEntities but lightweight
  let s = raw.replace(/&amp;/g, "&").replace(/&#0*39;?/g, "'");
  s = s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  s = s.replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/\s+/g, " ").trim();
  return s.toLocaleLowerCase();
}

export function getUniqueGenres(movies: ReadonlyArray<Movie>): string[] {
  const set = new Set<string>();
  for (const m of movies) {
    if (m.genres && Array.isArray(m.genres)) {
      for (const g of m.genres) set.add(g);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function getYearBounds(movies: ReadonlyArray<Movie>): {
  min: number | null;
  max: number | null;
} {
  let min: number | null = null;
  let max: number | null = null;
  for (const m of movies) {
    const y = m.year || 0;
    if (!y) continue;
    if (min === null || y < min) min = y;
    if (max === null || y > max) max = y;
  }
  return { min, max };
}

export function filterMovies(
  movies: ReadonlyArray<Movie>,
  filters: Filters
): Movie[] {
  const q = (filters.titleQuery || "").trim().toLocaleLowerCase();
  const genres = (filters.selectedGenres || []).map((g) =>
    g.toLocaleLowerCase()
  );
  const minYear = filters.yearMin || null;
  const maxYear = filters.yearMax || null;

  return movies.filter((m) => {
    const titleMatch = (() => {
      if (!(q && q.length >= 2)) return true;
      const t = normalizeTitle(m.title || "");
      return t.includes(q);
    })();

    if (!titleMatch) return false;

    const genreMatch = (() => {
      if (genres.length === 0) return true;
      const mg = (m.genres || []).map((g) => g.toLocaleLowerCase());
      return mg.some((g) => genres.includes(g));
    })();

    if (!genreMatch) return false;

    const yearMatch = (() => {
      const y = m.year || 0;
      if (minYear !== null && minYear !== undefined) {
        if (!y) return false;
        if (y < minYear) return false;
      }
      if (maxYear !== null && maxYear !== undefined) {
        if (!y) return false;
        if (y > maxYear) return false;
      }
      return true;
    })();

    return yearMatch;
  });
}

export function sortMovies(
  movies: ReadonlyArray<Movie>,
  sortBy: SortBy,
  sortDir: SortDir
): Movie[] {
  const copy = movies.slice();
  function numericCompare(aN: number, bN: number) {
    return sortDir === "asc" ? aN - bN : bN - aN;
  }

  copy.sort((a, b) => {
    if (sortBy === "title") {
      const ta = normalizeTitle(a.title || "");
      const tb = normalizeTitle(b.title || "");
      return sortDir === "asc" ? ta.localeCompare(tb) : tb.localeCompare(ta);
    }

    if (sortBy === "year") {
      const ay = a.year ?? 0;
      const by = b.year ?? 0;
      if (ay === 0 && by === 0) return 0;
      if (ay === 0) return 1;
      if (by === 0) return -1;
      return numericCompare(ay, by);
    }

    if (sortBy === "rating") {
      return numericCompare(a.vote_average ?? 0, b.vote_average ?? 0);
    }

    if (sortBy === "friends") {
      return numericCompare(a.friendCount ?? 0, b.friendCount ?? 0);
    }

    return 0;
  });
  return copy;
}

export function applyFiltersAndSort(
  movies: ReadonlyArray<Movie>,
  filters: Filters
): Movie[] {
  const filtered = filterMovies(movies, filters);
  const sorted = sortMovies(filtered, filters.sortBy, filters.sortDir);
  return sorted;
}
