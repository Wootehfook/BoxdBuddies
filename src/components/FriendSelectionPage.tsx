/*
 * BoxdBuddy - FriendSelectionPage Component
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

// AI Generated: GitHub Copilot - 2025-08-29T11:00:00Z
// Performance Optimization: Component Splitting - FriendSelectionPage component extracted

import { FAMOUS_MOVIE_QUOTES } from "../utils";
import { FriendAvatar } from "./FriendAvatar";
import type { FriendSelectionPageProps } from "../types";

export function FriendSelectionPage({
  friends,
  selectedFriends,
  onToggleFriend,
  onCompareWatchlists,
  onBackToSetup,
  isComparing,
  isLoadingWatchlistCounts,
  enhancementProgress,
  currentQuoteIndex,
  error,
}: FriendSelectionPageProps) {
  const progressPercent = Math.round(
    (enhancementProgress.completed / enhancementProgress.total) * 100
  );

  return (
    <section className="page friends-page">
      <div className="page-header">
        <button onClick={onBackToSetup} className="btn btn-secondary btn-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Setup
        </button>
        <h2>Select Friends</h2>
      </div>

      <div className="page-content">
        {friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No friends found</h3>
            <p>
              Make sure your Letterboxd profile is public and you have added
              some friends!
            </p>
          </div>
        ) : (
          <>
            <div className="friends-grid">
              {friends.map((friend, index) => (
                <div
                  key={friend.username}
                  className={`friend-card fade-in ${selectedFriends.some((f) => f.username === friend.username) ? "selected" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => onToggleFriend(friend)}
                >
                  <div className="friend-avatar">
                    <FriendAvatar friend={friend} />
                  </div>
                  <div className="friend-info">
                    <h3>{friend.displayName || friend.username}</h3>
                    <p>@{friend.username}</p>
                    {friend.watchlistCount !== undefined ? (
                      <p className="watchlist-count">
                        {friend.watchlistCount === 0
                          ? "Watchlist: NA"
                          : `Watchlist: ${friend.watchlistCount} Film${friend.watchlistCount === 1 ? "" : "s"}`}
                      </p>
                    ) : isLoadingWatchlistCounts ? (
                      <p className="watchlist-count">
                        <span className="loading-dots">
                          Loading watchlist...
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="compare-actions">
              {error && (
                <div className="error-message">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {isComparing ? (
                <div className="progress-button-container">
                  <div className="progress-info">
                    <h3>Comparing Watchlists...</h3>
                    <div className="progress-details">
                      <p>Progress: {progressPercent}% complete</p>
                      <p className="progress-status">
                        {enhancementProgress.status}
                      </p>
                    </div>
                    <div className="movie-quote-display">
                      <p className="movie-quote">
                        "{FAMOUS_MOVIE_QUOTES[currentQuoteIndex].quote}"
                      </p>
                      <p className="movie-source">
                        — {FAMOUS_MOVIE_QUOTES[currentQuoteIndex].movie}
                      </p>
                    </div>
                  </div>
                  <div className="progress-bar-modern">
                    <div
                      className="progress-bar-fill-modern"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div className="progress-percentage-modern">
                      {progressPercent}%
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="friends-selected-text">
                    {selectedFriends.length} friend
                    {selectedFriends.length !== 1 ? "s" : ""} selected
                  </p>
                  <button
                    onClick={onCompareWatchlists}
                    disabled={selectedFriends.length === 0}
                    className="btn btn-primary"
                  >
                    Compare Watchlists
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
