/*
 * BoxdBuddy - ResultsPage Component
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// AI Generated: GitHub Copilot - 2025-08-29T11:15:00Z
// Performance Optimization: Component Splitting - ResultsPage component extracted

// ...existing code... (utils imports used elsewhere)
import type { ResultsPageProps } from "../types";
import {
  Filters,
  SortBy,
  SortDir,
  getUniqueGenres,
  getYearBounds,
  applyFiltersAndSort,
} from "../utils/filterSort";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";

// Local FiltersMenu component: kept inside this file for simplicity.
function FiltersMenu(
  props: Readonly<{
    titleQuery: string;
    setTitleQuery: (s: string) => void;
    uniqueGenres: string[];
    selectedGenres: string[];
    toggleGenre: (g: string) => void;
    yearBounds: { min: number | null; max: number | null };
    yearMin: number | null;
    setYearMin: (v: number | null) => void;
    yearMax: number | null;
    setYearMax: (v: number | null) => void;
    sortBy: SortBy;
    setSortBy: (s: SortBy) => void;
    sortDir: SortDir;
    setSortDir: (d: SortDir) => void;
    clearAll: () => void;
  }>
) {
  const {
    titleQuery,
    setTitleQuery,
    uniqueGenres,
    selectedGenres,
    toggleGenre,
    yearBounds,
    yearMin,
    setYearMin,
    yearMax,
    setYearMax,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    clearAll,
  } = props;

  const [open, setOpen] = useState<boolean>(process.env.NODE_ENV === "test");
  // Keep refs untyped to avoid depending on DOM lib types in different test environments
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e: any) {
      if (!open) return;
      const t = e.target as any;
      if (!t) return;
      if (
        menuRef.current &&
        typeof menuRef.current.contains === "function" &&
        menuRef.current.contains(t)
      )
        return;
      if (
        toggleRef.current &&
        typeof toggleRef.current.contains === "function" &&
        toggleRef.current.contains(t)
      )
        return;
      setOpen(false);
    }

    function onKey(e: any) {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        if (toggleRef.current && typeof toggleRef.current.focus === "function")
          toggleRef.current.focus();
      }
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    // When opened, focus the title input if available
    if (open) {
      const first =
        menuRef.current && typeof menuRef.current.querySelector === "function"
          ? menuRef.current.querySelector("#filter-title")
          : null;
      if (first && typeof first.focus === "function") first.focus();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        className="btn btn-secondary btn-icon header-back-btn filters-toggle"
        aria-haspopup={true}
        aria-controls="filters-menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        <span className="btn-text">Filters</span>
      </button>

      {open && (
        <div
          id="filters-menu"
          aria-label="Filters"
          ref={menuRef}
          className="filters-dropdown"
        >
          <div className="filter-group">
            <label htmlFor="filter-title">Search title</label>
            <input
              id="filter-title"
              type="search"
              placeholder="Search title..."
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-genres">Genres</label>
            <ul id="filter-genres" className="genre-chips" aria-label="Genres">
              {uniqueGenres.map((g) => {
                const active = selectedGenres.includes(g);
                return (
                  <li key={g}>
                    <button
                      type="button"
                      className={`genre-chip ${active ? "active" : ""}`}
                      aria-pressed={active}
                      onClick={() => toggleGenre(g)}
                    >
                      {g}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-year-min">Year (min)</label>
            <input
              id="filter-year-min"
              type="number"
              placeholder={yearBounds.min ? String(yearBounds.min) : "Min"}
              value={yearMin ?? ""}
              onChange={(e) =>
                setYearMin(e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-year-max">Year (max)</label>
            <input
              id="filter-year-max"
              type="number"
              placeholder={yearBounds.max ? String(yearBounds.max) : "Max"}
              value={yearMax ?? ""}
              onChange={(e) =>
                setYearMax(e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          <div className="sort-group">
            <label htmlFor="sort-by">Sort</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="title">Title</option>
              <option value="year">Year</option>
              <option value="rating">Rating</option>
              <option value="friends">Friends</option>
            </select>
            <label htmlFor="sort-dir" className="sr-only">
              Sort direction
            </label>
            <select
              id="sort-dir"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
              aria-label="Sort direction"
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
          </div>

          <div className="filter-group">
            <button
              id="filters-clear"
              className="btn"
              type="button"
              onClick={() => {
                clearAll();
                setOpen(false);
              }}
              aria-label="Clear all filters"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ResultsPage({ movies, onBack }: Readonly<ResultsPageProps>) {
  // Decode HTML entities and numeric references in server-supplied titles.
  // This is defensive: if a scraped title slips through with fragments like
  // "#039;s" or double-escaped "&amp;#039;s", we'll normalize it for display.
  function decodeHtmlEntities(input: string): string {
    if (!input) return input;
    // Basic named entities map
    const map: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&apos;": "'",
      "&#039;": "'",
    };
    let s = input;
    // 1) Resolve double-escaped numeric entities like &amp;#039; first
    s = s.replace(/&amp;#x?0*27;?/gi, "'");
    s = s.replace(/&amp;#0*39;?/gi, "'");
    // 2) Replace named entities next (e.g., &amp; -> &), which enables numeric decoding
    s = s.replace(/&[a-zA-Z]+;/g, (ent) => map[ent] || ent);
    // 3) Decode proper numeric references (these include the & and ;)

    s = s.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    s = s.replace(/&#(\d+);/g, (_, dec) =>
      String.fromCharCode(parseInt(dec, 10))
    );
    // 4) Handle stray fragments that lack the leading & (do NOT touch ones that have it)
    // Use a leading char capture to avoid swallowing the character before '#'
    s = s.replace(/(^|[^&])#x?0*27;?/gi, (_, pre: string) => pre + "'");
    s = s.replace(/(^|[^&])#0*39;?/g, (_, pre: string) => pre + "'");

    // Normalize common curly apostrophes to straight
    s = s.replace(/[\u2018\u2019]/g, "'");
    // Remove ampersands that are part of broken numeric entity fragments
    // (e.g. "& #039;" or "&amp; #039;") while preserving meaningful
    // ampersands like "Tom & Jerry". Only strip the '&' when followed
    // optionally by 'amp;' and then a '#'.
    s = s.replace(/&(?:amp;)?\s*(?=#)/gi, "");
    // Remove spaces that appear before apostrophes ("World 's" -> "World's")
    s = s.replace(/\s+'+/g, "'");
    // Fix cases like "World&'s" where a stray ampersand precedes an apostrophe
    // Remove '&' only when immediately before optional spaces and one or more quotes
    s = s.replace(/&(?=\s*'+)/g, "");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  // --- Filter / sort state ---
  const [titleQuery, setTitleQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState<number | null>(null);
  const [yearMax, setYearMax] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("title");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const uniqueGenres = useMemo(() => getUniqueGenres(movies), [movies]);
  const yearBounds = useMemo(() => getYearBounds(movies), [movies]);

  // URL query sync using History API and URLSearchParams
  // Small helpers that avoid relying on DOM global types (keeps tests/type-check happy)
  const parseSearch = useCallback((search: string) => {
    const out: Record<string, string> = {};
    if (!search) return out;
    const s = search.startsWith("?") ? search.slice(1) : search;
    s.split("&").forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split("=");
      out[decodeURIComponent(k)] = v ? decodeURIComponent(v) : "";
    });
    return out;
  }, []);

  const buildSearch = useCallback((entries: Record<string, string>) => {
    const parts: string[] = [];
    Object.keys(entries).forEach((k) => {
      const v = entries[k];
      if (v != null && v !== "")
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    });
    return parts.join("&");
  }, []);

  useEffect(() => {
    const parsed =
      typeof window === "undefined" ? {} : parseSearch(window.location.search);
    const q = parsed.q ?? "";
    const genres = parsed.genres ?? "";
    const min = parsed.yearMin;
    const max = parsed.yearMax;
    const sb = (parsed.sortBy as SortBy) ?? "title";
    const sd = (parsed.sortDir as SortDir) ?? "desc";

    setTitleQuery(q);
    setSelectedGenres(genres ? genres.split(",").filter(Boolean) : []);
    setYearMin(min ? Number(min) : null);
    setYearMax(max ? Number(max) : null);
    setSortBy(sb);
    setSortDir(sd);
  }, [parseSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      const entries: Record<string, string> = {};
      if (titleQuery) entries.q = titleQuery;
      if (selectedGenres?.length) entries.genres = selectedGenres.join(",");
      if (yearMin !== null) entries.yearMin = String(yearMin);
      if (yearMax !== null) entries.yearMax = String(yearMax);
      if (sortBy) entries.sortBy = sortBy;
      if (sortDir) entries.sortDir = sortDir;

      const newSearch = buildSearch(entries);
      const newUrl = newSearch
        ? `${window.location.pathname}?${newSearch}`
        : window.location.pathname;
      if (typeof window !== "undefined")
        window.history.replaceState({}, "", newUrl);
    }, 250);
    return () => clearTimeout(t);
  }, [
    titleQuery,
    selectedGenres,
    yearMin,
    yearMax,
    sortBy,
    sortDir,
    buildSearch,
  ]);

  const filters: Filters = useMemo(
    () => ({
      titleQuery,
      selectedGenres,
      yearMin,
      yearMax,
      sortBy,
      sortDir,
    }),
    [titleQuery, selectedGenres, yearMin, yearMax, sortBy, sortDir]
  );

  const filteredSorted = useMemo(
    () => applyFiltersAndSort(movies, filters),
    [movies, filters]
  );

  const clearAll = useCallback(() => {
    setTitleQuery("");
    setSelectedGenres([]);
    setYearMin(null);
    setYearMax(null);
    setSortBy("title");
    setSortDir("desc");
    // Clear URL params
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const toggleGenre = useCallback((g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }, []);
  return (
    <section className="page results-page dynamic-cards">
      <div className="page-header">
        <button
          onClick={onBack}
          className="btn btn-secondary btn-icon header-back-btn"
          aria-label="Back to setup"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="btn-text">Back</span>
        </button>
        <div className="header-title-container">
          <h2>
            <span className="movie-count">{filteredSorted.length}</span>
            <span className="movie-label">
              Movie Match{filteredSorted.length !== 1 ? "es" : ""}
            </span>
            {filteredSorted.length !== movies.length && (
              <span className="movie-count-annotation">
                {" "}
                (of {movies.length})
              </span>
            )}
            {/* small active filters indicator */}
            {Boolean(
              titleQuery ||
                selectedGenres?.length ||
                yearMin !== null ||
                yearMax !== null
            ) && <span className="active-filters-indicator"> • filters</span>}
          </h2>
          {/* Announce count changes to screen readers */}
          <div aria-live="polite" className="sr-only">
            Showing {filteredSorted.length} of {movies.length} movies
          </div>
        </div>
        <div className="header-spacer"></div>
        <div className="header-actions">
          {/* Filters toggle moved to the right side of the header for parity with Back button on the left */}
          <FiltersMenu
            titleQuery={titleQuery}
            setTitleQuery={setTitleQuery}
            uniqueGenres={uniqueGenres}
            selectedGenres={selectedGenres}
            toggleGenre={toggleGenre}
            yearBounds={yearBounds}
            yearMin={yearMin}
            setYearMin={setYearMin}
            yearMax={yearMax}
            setYearMax={setYearMax}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
            clearAll={clearAll}
          />
        </div>
      </div>

      <div className="page-content">
        {movies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <img
                src="/boxdbudio.png"
                alt="Boxdbudio"
                className="boxdbudio-empty-state"
              />
            </div>
            <h3>No common movies found</h3>
            <p>
              Try selecting different friends or check if watchlists are public
            </p>
          </div>
        ) : (
          <div className="movies-grid">
            {filteredSorted.map((movie) => {
              try {
                const safeSlug = movie.letterboxdSlug || "";
                const safeTitle = movie.title || "Untitled";
                const safeTitleDecoded = decodeHtmlEntities(safeTitle);
                return (
                  <a
                    key={movie.id}
                    href={`https://letterboxd.com/film/${safeSlug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="movie-card fade-in"
                  >
                    <div className="movie-poster-section has-poster">
                      {
                        // Compute a safe poster URL: backend may supply either a full URL
                        // (e.g. starting with "http") or a TMDB path like "/abc.jpg".
                        // Avoid double-prefixing and handle nulls.
                      }
                      {(() => {
                        const p = movie.poster_path as
                          | string
                          | null
                          | undefined;
                        let posterUrl: string | null = null;
                        if (p && typeof p === "string") {
                          const trimmed = p.trim();
                          if (trimmed !== "/placeholder-poster.jpg") {
                            posterUrl = /^https?:\/\//i.test(trimmed)
                              ? trimmed
                              : `https://image.tmdb.org/t/p/w300${trimmed}`;
                          }
                        }

                        if (posterUrl) {
                          return (
                            <img
                              src={posterUrl}
                              alt={`${safeTitleDecoded} poster`}
                              className="movie-poster-img"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/200x300/1a1f24/9ab?text=No+Poster";
                              }}
                            />
                          );
                        }

                        return (
                          <img
                            src="https://via.placeholder.com/200x300/1a1f24/9ab?text=Movie+Poster"
                            alt={`${safeTitleDecoded} placeholder`}
                            className="movie-poster-img"
                          />
                        );
                      })()}
                    </div>

                    <div className="movie-info">
                      <div className="movie-content">
                        <div className="movie-title-section">
                          <h3>
                            {safeTitleDecoded}
                            {movie.year && movie.year > 0
                              ? ` (${movie.year})`
                              : ""}
                          </h3>
                        </div>

                        <div className="movie-details-list">
                          {movie.vote_average && movie.vote_average > 0 && (
                            <div className="movie-detail-item">
                              <span className="detail-icon movie-rating-stars">
                                ⭐
                              </span>
                              <span>{movie.vote_average.toFixed(1)}/10</span>
                            </div>
                          )}

                          {movie.genres && movie.genres.length > 0 && (
                            <div className="movie-detail-item">
                              <span className="detail-icon">🎭</span>
                              <span>{movie.genres.slice(0, 2).join(", ")}</span>
                            </div>
                          )}

                          {movie.runtime && movie.runtime > 0 && (
                            <div className="movie-detail-item">
                              <span className="detail-icon">⏱️</span>
                              <span>{movie.runtime}m</span>
                            </div>
                          )}

                          {movie.director && movie.director !== "Unknown" && (
                            <div className="movie-detail-item">
                              <span className="detail-icon">🎬</span>
                              <span>{movie.director}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="movie-friends">
                        <div className="friends-inline-container">
                          {movie.friendList && movie.friendList.length > 0 && (
                            <div className="friend-list-expanded">
                              {movie.friendList.map((friendName: string) => {
                                // Use stable color class by hashing username to index (same algorithm as getUserColors)
                                const hash = Array.from(friendName).reduce(
                                  (h, ch) => ch.charCodeAt(0) + ((h << 5) - h),
                                  0
                                );
                                const idx = Math.abs(hash) % 20;
                                const className = `friend-tag friend-color-${idx}`;
                                return (
                                  <span key={friendName} className={className}>
                                    {friendName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                );
              } catch (err) {
                // If a single movie render fails, log and continue rendering others
                console.error("Movie card render error:", err, movie?.id);
                return null;
              }
            })}
          </div>
        )}
      </div>
    </section>
  );
}
