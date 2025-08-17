/*
 * BoxdBuddies - Movie Watchlist Comparison Tool
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

import React, { useState, useEffect, useCallback } from "react";
import "./index.css";
import logger from "./utils/logger";
import { calculateProgressPercent } from "./utils/progressUtils";
import {
  realBackendAPI as backendAPI,
  type Movie,
  type Friend,
} from "./services/realBackend";

// AI Generated: GitHub Copilot - 2025-01-07

// Color generation utilities for consistent friend colors
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

const generateFriendColor = (username: string) => {
  const hash = hashString(username.toLowerCase());

  // Generate HSL values with guardrails for readability
  const hue = hash % 360; // Full hue range for variety
  const saturation = 60 + (hash % 30); // 60-90% saturation for vibrant but not oversaturated
  const lightness = 50 + (hash % 20); // 50-70% lightness for good contrast

  const hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const borderHsl = `hsl(${hue}, ${saturation + 10}%, ${lightness + 15}%)`;
  const bgHsl = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.2)`;

  return {
    color: hsl,
    borderColor: borderHsl,
    backgroundColor: bgHsl,
  };
};

// AI Generated: GitHub Copilot - 2025-01-07
const generateLetterboxdUrl = (movie: Movie) => {
  const baseUrl = "https://letterboxd.com/film/";

  // Use the actual Letterboxd slug if available, otherwise generate one from the title
  if (movie.letterboxdSlug) {
    return `${baseUrl}${movie.letterboxdSlug}/`;
  }

  // Fallback: Create slug from title with year disambiguation if needed
  const slug = movie.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  return `${baseUrl}${slug}/`;
};

// AI Generated: GitHub Copilot - 2025-01-07
const FAMOUS_MOVIE_QUOTES = [
  { quote: "May the Force be with you.", movie: "Star Wars" },
  { quote: "I'll be back.", movie: "The Terminator" },
  { quote: "Here's looking at you, kid.", movie: "Casablanca" },
  { quote: "You can't handle the truth!", movie: "A Few Good Men" },
  { quote: "Houston, we have a problem.", movie: "Apollo 13" },
  {
    quote: "Frankly, my dear, I don't give a damn.",
    movie: "Gone with the Wind",
  },
  { quote: "I see dead people.", movie: "The Sixth Sense" },
  { quote: "You're gonna need a bigger boat.", movie: "Jaws" },
  { quote: "Nobody puts Baby in a corner.", movie: "Dirty Dancing" },
  { quote: "Life is like a box of chocolates.", movie: "Forrest Gump" },
  { quote: "I feel the need... the need for speed!", movie: "Top Gun" },
  { quote: "Show me the money!", movie: "Jerry Maguire" },
  { quote: "After all this time? Always.", movie: "Harry Potter" },
  { quote: "Why so serious?", movie: "The Dark Knight" },
  { quote: "I am inevitable.", movie: "Avengers: Endgame" },
  { quote: "That's what I'm talking about!", movie: "Rush Hour" },
  {
    quote: "Keep your friends close, but your enemies closer.",
    movie: "The Godfather",
  },
  { quote: "The truth is out there.", movie: "The X-Files" },
  { quote: "I have a very particular set of skills.", movie: "Taken" },
  { quote: "Say hello to my little friend!", movie: "Scarface" },
];

interface EnhancementProgress {
  completed: number;
  total: number;
  status: string;
}

type PageType = "setup" | "friend-selection" | "results";

function App() {
  const [page, setPage] = useState<PageType>("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Progress enhancement state
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Setup state
  const [username, setUsername] = useState("");
  const [setupProgress, setSetupProgress] = useState({
    profileSaved: false,
    friendsLoaded: false,
  });

  // Friend selection state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);

  // Comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [enhancementProgress, setEnhancementProgress] =
    useState<EnhancementProgress>({
      completed: 0,
      total: 0,
      status: "Initializing...",
    });
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  // Auto-dismiss toast notifications after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Return undefined explicitly for the case when there's no error or success
    return undefined;
  }, [error, success]);

  // Check for existing user preferences on app startup
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        logger.debug("FRONTEND: Checking for existing user preferences...");
        const userPrefs = await backendAPI.loadUserPreferences();

        if (userPrefs?.username) {
          logger.debug(
            "FRONTEND: Found existing user preferences, loading user data"
          );
          setUsername(userPrefs.username);

          // Load friends list automatically with watchlist counts
          const friendsResult =
            await backendAPI.getFriendsWithWatchlistCounts();
          // Filter out the current user from the friends list
          const filteredFriends = friendsResult.filter(
            (friend: Friend) => friend.username !== userPrefs.username
          );
          setFriends(filteredFriends);

          // Skip setup page and go directly to friend selection
          setPage("friend-selection");
          logger.debug("FRONTEND: Skipped setup, going to friend selection");
        } else {
          logger.debug(
            "FRONTEND: No existing user preferences found, staying on setup page"
          );
        }
      } catch (err) {
        logger.error("FRONTEND: Error checking existing user:", err);
        // Stay on setup page if there's an error
      }
    };

    checkExistingUser();
  }, []);

  // AI Generated: GitHub Copilot - 2025-01-07
  // Rotate movie quotes during comparison
  useEffect(() => {
    let quoteInterval: ReturnType<typeof setInterval>;

    if (isComparing) {
      quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % FAMOUS_MOVIE_QUOTES.length);
      }, 4000); // Change quote every 4 seconds
    }

    return () => {
      if (quoteInterval) {
        clearInterval(quoteInterval);
      }
    };
  }, [isComparing]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const validateInputs = () => {
    if (!username.trim()) {
      setError("Please enter your Letterboxd username");
      return false;
    }
    // TMDB API key is optional
    return true;
  };

  const backendCallWithTimeout = async <T = unknown,>(
    operation: () => Promise<T>,
    timeoutMs: number = 120000 // 2 minutes
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Operation timed out after ${timeoutMs / 1000} seconds`)
        );
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };

  const handleUserSetup = async () => {
    logger.debug("FRONTEND: handleUserSetup called");
    logger.debug("FRONTEND: username =", username);

    if (!validateInputs()) return;

    clearMessages();
    setIsLoading(true);
    setSetupProgress({ profileSaved: false, friendsLoaded: false });

    try {
      logger.debug(
        "FRONTEND: About to call backendCallWithTimeout for save_user_preferences"
      );
      await backendCallWithTimeout(async () => {
        logger.debug("FRONTEND: About to save user preferences");
        await backendAPI.saveUserPreferences({
          username: username.trim(),
          alwaysOnTop: false,
        });
        logger.debug("FRONTEND: save_user_preferences completed successfully");
      });

      // Profile saved successfully
      setSetupProgress((prev) => ({ ...prev, profileSaved: true }));

      // Auto-fetch friends
      try {
        logger.debug("FRONTEND: About to fetch friends");
        await backendAPI.scrapeLetterboxdFriends(username.trim());

        // After scraping, load friends with watchlist counts
        const friendsWithCounts =
          await backendAPI.getFriendsWithWatchlistCounts();
        // Filter out the current user from the friends list
        const filteredFriends = friendsWithCounts.filter(
          (friend: Friend) => friend.username !== username.trim()
        );
        setFriends(filteredFriends);
        setSetupProgress((prev) => ({ ...prev, friendsLoaded: true }));

        // Proceed directly to friend selection without delay
        setPage("friend-selection");
      } catch (friendsError) {
        logger.debug(
          "FRONTEND: Friends fetch failed, but profile was saved:",
          friendsError
        );
        // Still proceed to friends page even if auto-fetch fails
        setPage("friend-selection");
      }
    } catch (err) {
      logger.error("FRONTEND: Error in handleUserSetup:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      logger.debug(
        "FRONTEND: handleUserSetup finished, setting isLoading to false"
      );
      setIsLoading(false);
    }
  };

  const handleFriendsFetch = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    clearMessages();
    setIsLoading(true);

    try {
      await backendCallWithTimeout(async () => {
        await backendAPI.scrapeLetterboxdFriends(username.trim());

        // After scraping, load friends with watchlist counts
        const friendsWithCounts =
          await backendAPI.getFriendsWithWatchlistCounts();
        // Filter out the current user from the friends list
        const filteredFriends = friendsWithCounts.filter(
          (friend) => friend.username !== username.trim()
        );
        setFriends(filteredFriends);
        setSuccess(`Found ${filteredFriends.length} friends!`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch friends");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriend = (friend: Friend) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f.username === friend.username);
      if (isSelected) {
        return prev.filter((f) => f.username !== friend.username);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleCompareWatchlists = async () => {
    logger.debug(
      "FRONTEND: handleCompareWatchlists called, selectedFriends.length:",
      selectedFriends.length
    );

    if (selectedFriends.length === 0) {
      logger.debug("FRONTEND: No friends selected, showing error");
      setError("Please select at least one friend to compare with");
      return;
    }

    logger.debug("FRONTEND: Starting comparison process...");
    clearMessages();
    setIsComparing(true);
    setEnhancementProgress({
      completed: 0,
      total: 100,
      status: "Starting comparison...",
    });

    // Simulate progress during backend comparison
    let progressSimulation: ReturnType<typeof setInterval> | null = null;
    const startProgressSimulation = () => {
      let progress = 0;
      progressSimulation = setInterval(() => {
        if (progress < 85) {
          // Simulate up to 85% during comparison phase
          progress += Math.random() * 6 + 1; // Random increment between 1-7
          setEnhancementProgress(() => ({
            completed: Math.round(progress),
            total: 100,
            status:
              progress < 25
                ? "Loading watchlists from cache..."
                : progress < 50
                  ? "Comparing movies..."
                  : progress < 75
                    ? "Processing results..."
                    : "Almost ready...",
          }));
        }
      }, 300); // Update every 300ms for smoother animation
    };

    const stopProgressSimulation = () => {
      if (progressSimulation) {
        clearInterval(progressSimulation);
        progressSimulation = null;
      }
    };

    try {
      logger.debug("FRONTEND: About to call backendCallWithTimeout...");
      startProgressSimulation(); // Start simulating progress during backend work

      await backendCallWithTimeout(async () => {
        const friendUsernames = selectedFriends.map((f) => f.username);
        logger.debug(
          "FRONTEND: Calling compare_watchlists with friends:",
          friendUsernames
        );

        logger.debug("FRONTEND: About to call compareWatchlists...");
        const compareResult = await backendAPI.compareWatchlists({
          mainUsername: username,
          friendUsernames: friendUsernames,
          limitTo500: false,
        });
        logger.debug(
          "FRONTEND: compareWatchlists returned result:",
          compareResult
        );

        const results = compareResult.commonMovies;
        logger.debug(
          "FRONTEND: extracted common movies:",
          results.length,
          "movies"
        );

        if (results.length === 0) {
          logger.debug("FRONTEND: No common movies found");
          setError("No common movies found in watchlists");
          return;
        }

        setFilteredMovies(results);

        // Stop progress simulation and continue with real enhancement tracking
        stopProgressSimulation();

        // Complete progress
        setEnhancementProgress({
          completed: 100,
          total: 100,
          status: "Complete!",
        });

        // The results already include movie data
        setFilteredMovies(results);
        setPage("results");
        return;
      }, 180000); // 3 minutes for comparison
    } catch (err) {
      logger.error("FRONTEND: Error in handleCompareWatchlists:", err);

      stopProgressSimulation(); // Clean up progress simulation on error
      setError(
        err instanceof Error ? err.message : "Failed to compare watchlists"
      );
    } finally {
      logger.debug(
        "FRONTEND: handleCompareWatchlists finally block, setting isComparing to false"
      );
      stopProgressSimulation(); // Ensure progress simulation is stopped
      setIsComparing(false);
    }
  };

  const handleBackToFriends = () => {
    setPage("friend-selection");
    setFilteredMovies([]);
    setEnhancementProgress({ completed: 0, total: 0, status: "" });
  };

  const handleBackToSetup = () => {
    setPage("setup");
    setFriends([]);
    setSelectedFriends([]);
    setFilteredMovies([]);
  };

  const renderCurrentPage = () => {
    switch (page) {
      case "setup":
        return (
          <SetupPage
            username={username}
            setUsername={setUsername}
            onSetup={handleUserSetup}
            isLoading={isLoading}
            setupProgress={setupProgress}
          />
        );
      case "friend-selection":
        return (
          <FriendSelectionPage
            friends={friends}
            selectedFriends={selectedFriends}
            onToggleFriend={toggleFriend}
            onCompareWatchlists={handleCompareWatchlists}
            onBackToSetup={handleBackToSetup}
            onRefreshFriends={handleFriendsFetch}
            isLoading={isLoading}
            isComparing={isComparing}
            enhancementProgress={enhancementProgress}
            currentQuoteIndex={currentQuoteIndex}
          />
        );
      case "results":
        return (
          <ResultsPage
            movies={filteredMovies}
            selectedFriends={selectedFriends}
            onBack={handleBackToFriends}
            onNewComparison={handleBackToSetup}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🎬 BoxdBuddies</h1>
            <p>Find movies you and your friends want to watch</p>
            <div className="web-demo-badge">
              <span>Web Demo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">{renderCurrentPage()}</main>

      {/* Subtle toast notifications */}
      {error && <div className="toast toast-error">{error}</div>}

      {success && <div className="toast toast-success">{success}</div>}
    </div>
  );
}

// Setup Page Component
interface SetupPageProps {
  username: string;
  setUsername: (value: string) => void;
  onSetup: () => void;
  isLoading: boolean;
  setupProgress: {
    profileSaved: boolean;
    friendsLoaded: boolean;
  };
}

function SetupPage({
  username,
  setUsername,
  onSetup,
  isLoading,
  setupProgress,
}: SetupPageProps) {
  return (
    <section className="page setup-page">
      <div className="page-content">
        <div className="setup-card">
          <h2>Get Started</h2>
          <p>
            Enter your details to compare Letterboxd watchlists with friends
          </p>
          <div className="demo-notice">
            <p>
              <strong>Web Demo:</strong> This is a demonstration version with
              sample data. For the full experience with real Letterboxd
              integration, download the desktop app.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="username">Letterboxd Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Letterboxd Username (demo mode)"
              disabled={isLoading}
            />
          </div>

          {/* Progress indicators */}
          {isLoading && (
            <div className="setup-progress">
              <div className="progress-item">
                <span className="progress-icon">
                  {setupProgress.profileSaved ? "✅" : "⏳"}
                </span>
                <span className="progress-text">
                  {setupProgress.profileSaved
                    ? "Profile saved"
                    : "Saving profile..."}
                </span>
              </div>
              <div className="progress-item">
                <span className="progress-icon">
                  {setupProgress.friendsLoaded
                    ? "✅"
                    : setupProgress.profileSaved
                      ? "⏳"
                      : "⏸️"}
                </span>
                <span className="progress-text">
                  {setupProgress.friendsLoaded
                    ? "Friends loaded"
                    : setupProgress.profileSaved
                      ? "Loading friends..."
                      : "Loading friends"}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onSetup}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "Setting up..." : "Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}

// Friend Selection Page Component
interface FriendSelectionPageProps {
  friends: Friend[];
  selectedFriends: Friend[];
  onToggleFriend: (friend: Friend) => void;
  onCompareWatchlists: () => void;
  onBackToSetup: () => void;
  onRefreshFriends: () => void;
  isLoading: boolean;
  isComparing: boolean;
  enhancementProgress: EnhancementProgress;
  currentQuoteIndex: number;
}

function FriendSelectionPage({
  friends,
  selectedFriends,
  onToggleFriend,
  onCompareWatchlists,
  onBackToSetup,
  onRefreshFriends,
  isLoading,
  isComparing,
  enhancementProgress,
  currentQuoteIndex,
}: FriendSelectionPageProps) {
  const progressPercent = calculateProgressPercent(
    enhancementProgress.completed,
    enhancementProgress.total
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
        <button
          onClick={onRefreshFriends}
          disabled={isLoading}
          className="btn btn-secondary btn-icon"
        >
          {isLoading ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64" />
                <path d="M21 4v4h-4" />
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>
      <div className="page-content">
        {isLoading ? (
          <div className="friends-grid">
            {/* Skeleton loading friends */}
            {[...Array(4)].map((_, index) => (
              <div key={index} className="friend-card loading-skeleton">
                <div className="friend-avatar loading-skeleton"></div>
                <div className="friend-info">
                  <div className="loading-skeleton name"></div>
                  <div className="loading-skeleton username"></div>
                  <div className="loading-skeleton watchlist"></div>
                </div>
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No friends added yet</h3>
            <p>Add some friends to start comparing watchlists!</p>
            <button
              onClick={onRefreshFriends}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="loading-dots">Loading</span>
                </>
              ) : (
                "Try Again"
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="friends-grid">
              {friends
                .sort((a, b) => a.username.localeCompare(b.username))
                .map((friend, index) => (
                  <div
                    key={friend.username}
                    className={`friend-card fade-in ${selectedFriends.some((f) => f.username === friend.username) ? "selected" : ""}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => onToggleFriend(friend)}
                  >
                    <div className="friend-avatar">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={`${friend.displayName || friend.username} avatar`}
                        />
                      ) : friend.displayName ? (
                        friend.displayName.charAt(0).toUpperCase()
                      ) : (
                        friend.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="friend-info">
                      <h3>{friend.displayName || friend.username}</h3>
                      <p>@{friend.username}</p>
                      {friend.watchlistCount !== undefined && (
                        <p className="watchlist-count">
                          {friend.watchlistCount === 0
                            ? "Watchlist: NA"
                            : `Watchlist: ${friend.watchlistCount} Film${friend.watchlistCount === 1 ? "" : "s"}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="compare-actions">
              {isComparing ? (
                <div className="progress-button-container">
                  <div className="progress-info">
                    <h3>Comparing Watchlists...</h3>
                    <div className="progress-details">
                      <p>Progress: {progressPercent}% complete</p>
                      {enhancementProgress.total > 0 && (
                        <p className="progress-status">
                          {enhancementProgress.completed === 0
                            ? "Getting ready to compare..."
                            : enhancementProgress.completed < 85
                              ? "Comparing watchlists..."
                              : enhancementProgress.completed < 100
                                ? "Adding movie details..."
                                : "Complete!"}
                        </p>
                      )}
                    </div>
                    <div className="movie-quote-display">
                      <p className="movie-quote">
                        "{FAMOUS_MOVIE_QUOTES[currentQuoteIndex]?.quote}"
                      </p>
                      <p className="movie-source">
                        — {FAMOUS_MOVIE_QUOTES[currentQuoteIndex]?.movie}
                      </p>
                    </div>
                  </div>
                  <div className="progress-bar-modern">
                    <div
                      className="progress-bar-fill-modern"
                      // Dynamic width based on progress percentage
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
                    disabled={selectedFriends.length === 0 || isComparing}
                    className={`btn btn-primary ${isComparing ? "loading" : ""}`}
                  >
                    {isComparing ? (
                      <>
                        <svg
                          className="loading-spinner"
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="60 40"
                            strokeDashoffset="0"
                          >
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              values="0 12 12;360 12 12"
                              dur="1s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        </svg>
                        <span className="loading-dots">Comparing</span>
                      </>
                    ) : (
                      "Compare Watchlists"
                    )}
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

// Results Page Component
function ResultsPage({
  movies,
  onBack,
}: {
  movies: Movie[];
  selectedFriends: Friend[];
  onBack: () => void;
  onNewComparison: () => void;
}) {
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>(movies);
  const [sortBy, setSortBy] = useState<"friends" | "rating" | "year">(
    "friends"
  );
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showGenreFilter, setShowGenreFilter] = useState<boolean>(false);

  // AI Generated: GitHub Copilot - 2025-01-07
  // Optimize movie card click handler to prevent re-renders
  const handleMovieCardClick = useCallback(async (movie: Movie) => {
    // Open Letterboxd URL in new tab for web version
    try {
      window.open(generateLetterboxdUrl(movie), "_blank");
    } catch (error) {
      logger.error("Failed to open URL:", error);
    }
  }, []);

  // Extract unique genres from all movies
  const availableGenres = React.useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach((movie) => {
      if (movie.genre) {
        // Split comma-separated genres and add each one
        movie.genre.split(", ").forEach((genre) => {
          genreSet.add(genre.trim());
        });
      }
    });
    return Array.from(genreSet).sort();
  }, [movies]);

  useEffect(() => {
    let filtered = [...movies];

    // Apply genre filtering first
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((movie) => {
        if (!movie.genre) return false;
        const movieGenres = movie.genre.split(", ").map((g) => g.trim());
        // Movie must have at least one of the selected genres
        return selectedGenres.some((selectedGenre) =>
          movieGenres.includes(selectedGenre)
        );
      });
    }

    // Sort movies with multi-level sorting: friends first, then rating as tiebreaker
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "friends": {
          // Primary sort: friend count (descending)
          const friendDiff = b.friendCount - a.friendCount;
          if (friendDiff !== 0) return friendDiff;
          // Secondary sort: average rating (descending) for tiebreaker
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        case "rating": {
          // Primary sort: rating (descending)
          const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          // Secondary sort: friend count (descending) for tiebreaker
          return b.friendCount - a.friendCount;
        }
        case "year": {
          // Primary sort: year (descending)
          const yearDiff = (b.year || 0) - (a.year || 0);
          if (yearDiff !== 0) return yearDiff;
          // Secondary sort: friend count (descending) for tiebreaker
          return b.friendCount - a.friendCount;
        }
        default:
          return 0;
      }
    });

    setFilteredMovies(filtered);
  }, [movies, sortBy, selectedGenres]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const clearGenreFilter = () => {
    setSelectedGenres([]);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".filter-dropdown")) {
        setShowSortMenu(false);
        setShowGenreFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section className="page results-page">
      <div className="page-header">
        <button onClick={onBack} className="btn btn-secondary btn-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Friends
        </button>
        <h2>
          <span className="movie-count">{filteredMovies.length}</span>
          <span className="movie-label">
            Movie Match{filteredMovies.length !== 1 ? "es" : ""}
          </span>
        </h2>
        <div className="header-controls">
          {/* Genre Filter Dropdown */}
          <div className="filter-dropdown">
            <button
              onClick={() => setShowGenreFilter(!showGenreFilter)}
              className={`btn btn-secondary ${selectedGenres.length > 0 ? "active" : ""}`}
              title="Filter by genre"
            >
              Filter
              {selectedGenres.length > 0 && (
                <span className="filter-badge">{selectedGenres.length}</span>
              )}
            </button>
            {showGenreFilter && (
              <div className="dropdown-menu genre-filter-menu">
                <div className="dropdown-header">
                  <span>Filter by Genre</span>
                  {selectedGenres.length > 0 && (
                    <button
                      onClick={clearGenreFilter}
                      className="clear-filter-btn"
                      title="Clear all genres"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="genre-options">
                  {availableGenres.map((genre) => (
                    <label key={genre} className="genre-option">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                      />
                      <span className="checkmark"></span>
                      <span className="genre-name">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="filter-dropdown">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="btn btn-secondary"
              title="Sort movies"
            >
              Sort
            </button>
            {showSortMenu && (
              <div className="dropdown-menu">
                <button
                  onClick={() => {
                    setSortBy("friends");
                    setShowSortMenu(false);
                  }}
                >
                  Friend Count
                </button>
                <button
                  onClick={() => {
                    setSortBy("rating");
                    setShowSortMenu(false);
                  }}
                >
                  Rating
                </button>
                <button
                  onClick={() => {
                    setSortBy("year");
                    setShowSortMenu(false);
                  }}
                >
                  Year
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {filteredMovies.length === 0 ? (
          <div className="empty-state">
            <h3>No movies found</h3>
            <p>Try selecting different friends for comparison.</p>
          </div>
        ) : (
          <div className="movies-grid">
            {filteredMovies.map((movie, index) => (
              <div
                key={index}
                className="movie-card fade-in clickable"
                onClick={() => handleMovieCardClick(movie)}
              >
                <div
                  className={`movie-poster-section ${movie.posterPath ? "has-poster" : "no-poster"}`}
                  {...(movie.posterPath && {
                    style: { backgroundImage: `url(${movie.posterPath})` },
                  })}
                />

                <div className="movie-info">
                  <div className="movie-content">
                    <div className="movie-title-section">
                      <h3>
                        {movie.title}
                        {movie.year && movie.year > 0 ? ` (${movie.year})` : ""}
                      </h3>
                    </div>

                    <div className="movie-details-list">
                      {movie.director && (
                        <div className="movie-detail-item">
                          <span className="detail-icon">🎬</span>
                          <span>Directed by {movie.director}</span>
                        </div>
                      )}

                      {movie.genre && (
                        <div className="movie-detail-item">
                          <span className="detail-icon">🎭</span>
                          <span>{movie.genre}</span>
                        </div>
                      )}

                      {movie.averageRating && (
                        <div className="movie-detail-item">
                          <span className="detail-icon movie-rating-stars">
                            ⭐
                          </span>
                          <span>{movie.averageRating.toFixed(1)}/10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="movie-friends">
                    <div className="friends-inline-container">
                      {movie.friendList && movie.friendList.length > 0 && (
                        <div className="friend-list-expanded">
                          {movie.friendList.map(
                            (friendName: string, idx: number) => {
                              const friendColors =
                                generateFriendColor(friendName);
                              return (
                                <span
                                  key={idx}
                                  className="friend-tag"
                                  style={{
                                    borderColor: friendColors.borderColor,
                                    backgroundColor:
                                      friendColors.backgroundColor,
                                    color: "#fff",
                                  }}
                                >
                                  {friendName}
                                </span>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default App;
