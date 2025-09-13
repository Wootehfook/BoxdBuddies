/*
 * BoxdBuddy - SetupPage Component
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

// AI Generated: GitHub Copilot - 2025-08-29T10:45:00Z
// Performance Optimization: Component Splitting - SetupPage component extracted

import type { SetupPageProps } from "../types";

export function SetupPage({
  username,
  setUsername,
  onSetup,
  isLoading,
  isLoadingFriends,
  friendsLoadingProgress,
  error,
}: SetupPageProps) {
  return (
    <section className="page setup-page">
      <div className="page-content">
        <div className="setup-card">
          <h2>Get Started</h2>
          <p>Enter your Letterboxd username to load friend list</p>

          <div className="form-group">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Letterboxd Username"
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && onSetup()}
            />
          </div>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {isLoadingFriends && (
            <div className="loading-progress">
              <div className="progress-message">Loading your friends...</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${friendsLoadingProgress}%` }}
                ></div>
              </div>
              <div className="progress-percentage">
                {Math.round(friendsLoadingProgress)}%
              </div>
            </div>
          )}

          <button
            onClick={onSetup}
            disabled={isLoading || !username.trim()}
            className="btn btn-primary"
          >
            {isLoading ? "Loading friends..." : "Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}
