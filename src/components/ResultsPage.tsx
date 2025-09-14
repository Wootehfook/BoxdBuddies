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
            <span className="movie-count">{movies.length}</span>
            <span className="movie-label">
              Movie Match{movies.length !== 1 ? "es" : ""}
            </span>
          </h2>
        </div>
        <div className="header-spacer"></div>
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
            {movies.map((movie) => {
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
