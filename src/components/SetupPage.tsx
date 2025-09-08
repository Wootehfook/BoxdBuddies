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
import { useEffect } from "react";

export function SetupPage({
  username,
  setUsername,
  onSetup,
  isLoading,
  isLoadingFriends,
  friendsLoadingProgress,
  error,
}: Readonly<SetupPageProps>) {
  useEffect(() => {
    try {
      const el =
        typeof document !== "undefined"
          ? document.getElementById("setup-progress-fill")
          : null;
      if (el?.style) {
        el.style.width = `${Math.round(friendsLoadingProgress)}%`;
      }
    } catch {
      // ignore in test environment
    }
  }, [friendsLoadingProgress]);
  return (
    <section className="page setup-page">
      <div className="page-content">
        <div className="setup-card">
          <h2>Get Started</h2>
          <p>
            Enter your Letterboxd username to load your friends and compare
            watchlists
          </p>

          <div className="form-group">
            <label htmlFor="username">Your Letterboxd Username</label>
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
                  id="setup-progress-fill"
                  className="progress-fill"
                  aria-hidden="true"
                ></div>
              </div>
              <div className="progress-percentage">
                {Math.round(friendsLoadingProgress)}%
              </div>

              {/* Progress steps using .progress-item; JS will toggle .completed */}
              <div className="setup-progress" aria-hidden="false">
                {
                  // Define three simple steps for the setup flow
                }
                {[
                  {
                    key: "username",
                    text: "Username accepted",
                    done: username.trim().length > 0,
                  },
                  {
                    key: "loading",
                    text: "Loading friends",
                    done: friendsLoadingProgress >= 100,
                  },
                  {
                    key: "complete",
                    text: "Friends loaded",
                    done: friendsLoadingProgress >= 100 && !isLoadingFriends,
                  },
                ].map((step) => (
                  <div
                    key={step.key}
                    className={`progress-item ${step.done ? "completed" : ""}`}
                  >
                    <div className="progress-icon" aria-hidden>
                      {step.done ? "✅" : "•"}
                    </div>
                    <div className="progress-text">{step.text}</div>
                  </div>
                ))}
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
