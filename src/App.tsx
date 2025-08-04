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

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/shell";
import "./App.css";
import logger from "./utils/logger";

// AI Generated: GitHub Copilot - 2025-08-01

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

// AI Generated: GitHub Copilot - 2025-01-27
const generateLetterboxdUrl = (movie: Movie) => {
  const baseUrl = "https://letterboxd.com/film/";

  // Use the actual Letterboxd slug if available, otherwise generate one from the title
  if (movie.letterboxdSlug) {
    return `${baseUrl}${movie.letterboxdSlug}/`;
  }

  // Fallback: Create slug from title with year disambiguation if needed
  let slug = movie.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  // For movies that might have year disambiguation (like Hamilton)
  // Add year if it's not the most common/earliest version
  if (movie.year && movie.year > 2000) {
    // This is a heuristic - we might need year disambiguation for newer films
    // with common titles
    const commonTitles = [
      "hamilton",
      "it",
      "dune",
      "ghostbusters",
      "fantastic-four",
    ];
    if (commonTitles.includes(slug)) {
      slug = `${slug}-${movie.year}`;
    }
  }

  return `${baseUrl}${slug}/`;
};

// AI Generated: GitHub Copilot - 2025-08-02
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

interface Movie {
  id: number;
  title: string;
  year: number;
  posterPath?: string;
  overview?: string;
  rating?: number;
  genre?: string;
  director?: string;
  averageRating?: number;
  friendCount: number;
  friendList?: string[];
  letterboxdSlug?: string;
}

interface Friend {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  watchlistCount?: number;
}

// AI Generated: GitHub Copilot - 2025-08-03
interface UserPreferences {
  username: string;
  tmdb_api_key: string;
  always_on_top?: boolean;
}

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

  // Window state
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  // Progress enhancement state
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Setup state
  const [username, setUsername] = useState("");
  const [tmdbApiKey, setTmdbApiKey] = useState("");
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

  // Ensure window focus when navigating between pages
  useEffect(() => {
    ensureWindowFocus();
  }, [page]);

  // Ensure window focus on app startup
  useEffect(() => {
    ensureWindowFocus();
  }, []);

  // Auto-dismiss toast notifications after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Check for existing user preferences on app startup
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        logger.debug("FRONTEND: Checking for existing user preferences...");
        const userPrefs = (await invoke(
          "load_user_preferences"
        )) as UserPreferences;

        if (userPrefs.username && userPrefs.tmdb_api_key) {
          logger.debug(
            "FRONTEND: Found existing user preferences, loading user data"
          );
          setUsername(userPrefs.username);
          setTmdbApiKey(userPrefs.tmdb_api_key);

          // Restore pin setting if available
          if (userPrefs.always_on_top !== undefined) {
            setIsAlwaysOnTop(userPrefs.always_on_top);
            // Apply the setting to the window
            try {
              await invoke("set_always_on_top", {
                alwaysOnTop: userPrefs.always_on_top,
              });
            } catch (error) {
              console.error(
                "🔧 FRONTEND: Error setting always on top from preferences:",
                error
              );
            }
          }

          // Load friends list automatically with watchlist counts
          const friendsResult = (await invoke(
            "get_friends_with_watchlist_counts"
          )) as Friend[];
          // Filter out the current user from the friends list
          const filteredFriends = friendsResult.filter(
            (friend) => friend.username !== userPrefs.username
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
        console.error("🔧 FRONTEND: Error checking existing user:", err);
        // Stay on setup page if there's an error
      }
    };

    checkExistingUser();
  }, []);

  // AI Generated: GitHub Copilot - 2025-08-02
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

  const ensureWindowFocus = async () => {
    try {
      await invoke("set_window_focus");
    } catch (err) {
      logger.warn("Failed to set window focus:", err);
    }
  };

  const toggleAlwaysOnTop = async () => {
    try {
      const newState = !isAlwaysOnTop;
      await invoke("set_always_on_top", { alwaysOnTop: newState });
      setIsAlwaysOnTop(newState);

      // Save the preference if we have user data
      if (username && tmdbApiKey) {
        try {
          await invoke("save_user_preferences", {
            request: {
              username: username.trim(),
              tmdbApiKey: tmdbApiKey.trim(),
              alwaysOnTop: newState,
            },
          });
          logger.debug("FRONTEND: Pin preference saved");
        } catch (saveErr) {
          console.error("🔧 FRONTEND: Error saving pin preference:", saveErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle pin");
    }
  };

  const validateInputs = () => {
    if (!username.trim()) {
      setError("Please enter your Letterboxd username");
      return false;
    }
    // TMDB API key is now optional
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
    logger.debug("FRONTEND: tmdbApiKey =", tmdbApiKey);

    if (!validateInputs()) return;

    clearMessages();
    setIsLoading(true);
    setSetupProgress({ profileSaved: false, friendsLoaded: false });

    try {
      logger.debug(
        "FRONTEND: About to call backendCallWithTimeout for save_user_preferences"
      );
      await backendCallWithTimeout(async () => {
        logger.debug("FRONTEND: About to invoke save_user_preferences");
        await invoke("save_user_preferences", {
          request: {
            username: username.trim(),
            tmdbApiKey: tmdbApiKey.trim(),
            alwaysOnTop: isAlwaysOnTop,
          },
        });
        logger.debug("FRONTEND: save_user_preferences completed successfully");
      });

      // Profile saved successfully
      setSetupProgress((prev) => ({ ...prev, profileSaved: true }));

      // Auto-fetch friends
      try {
        logger.debug("FRONTEND: About to fetch friends");
        await invoke<Friend[]>("scrape_letterboxd_friends", {
          username: username.trim(),
        });

        // After scraping, load friends with watchlist counts
        const friendsWithCounts = (await invoke(
          "get_friends_with_watchlist_counts"
        )) as Friend[];
        // Filter out the current user from the friends list
        const filteredFriends = friendsWithCounts.filter(
          (friend) => friend.username !== username.trim()
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
      console.error("🔧 FRONTEND: Error in handleUserSetup:", err);
      console.error("🔧 FRONTEND: Error type:", typeof err);
      console.error(
        "🔧 FRONTEND: Error message:",
        err instanceof Error ? err.message : String(err)
      );
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
        await invoke<Friend[]>("scrape_letterboxd_friends", {
          username: username.trim(),
        });

        // After scraping, load friends with watchlist counts
        const friendsWithCounts = (await invoke(
          "get_friends_with_watchlist_counts"
        )) as Friend[];
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

        logger.debug("FRONTEND: About to invoke compare_watchlists...");
        const compareResult = await invoke<{ commonMovies: Movie[] }>(
          "compare_watchlists",
          {
            mainUsername: username,
            friendUsernames: friendUsernames,
            tmdbApiKey: tmdbApiKey || null,
            limitTo500: false,
          }
        );
        logger.debug(
          "FRONTEND: compare_watchlists returned result:",
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

        // If we have TMDB API key, enhancement happens in backend during comparison
        // No separate frontend enhancement needed - backend handles caching efficiently
        setEnhancementProgress({
          completed: 100,
          total: 100,
          status: "Complete!",
        });

        // The results already include TMDB data from backend
        setFilteredMovies(results);
        setFilteredMovies(results);
        setPage("results");
        return;
      }, 180000); // 3 minutes for comparison
    } catch (err) {
      console.error("🚨 FRONTEND: Error in handleCompareWatchlists:", err);
      console.error("🚨 FRONTEND: Error type:", typeof err);
      console.error(
        "🚨 FRONTEND: Error message:",
        err instanceof Error ? err.message : "Unknown error"
      );
      console.error(
        "🚨 FRONTEND: Error stack:",
        err instanceof Error ? err.stack : "No stack trace"
      );

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
            tmdbApiKey={tmdbApiKey}
            setTmdbApiKey={setTmdbApiKey}
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
            tmdbApiKey={tmdbApiKey}
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
          </div>
          <div className="pin-container">
            <button
              onClick={toggleAlwaysOnTop}
              className={`btn-pin ${isAlwaysOnTop ? "pinned" : ""}`}
              title={isAlwaysOnTop ? "Unpin window" : "Pin window on top"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isAlwaysOnTop ? (
                  // Pinned (filled pushpin like 📌)
                  <>
                    <circle cx="12" cy="6" r="4" fill="currentColor" />
                    <line x1="12" y1="10" x2="12" y2="21" strokeWidth="3" />
                    <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
                  </>
                ) : (
                  // Unpinned (outline pushpin)
                  <>
                    <circle cx="12" cy="6" r="4" />
                    <line x1="12" y1="10" x2="12" y2="21" strokeWidth="2" />
                    <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
                  </>
                )}
              </svg>
            </button>
            <span className="pin-label">Pin</span>
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
  tmdbApiKey: string;
  setTmdbApiKey: (value: string) => void;
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
  tmdbApiKey,
  setTmdbApiKey,
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

          <div className="form-group">
            <label htmlFor="username">Letterboxd Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Letterboxd Username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tmdb-key">TMDB API Key (Optional)</label>
            <input
              id="tmdb-key"
              type="password"
              value={tmdbApiKey}
              onChange={(e) => setTmdbApiKey(e.target.value)}
              placeholder="Your TMDB API key (optional - for enhanced movie data)"
              disabled={isLoading}
            />
            <small>
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get your free TMDB API key here
              </a>
            </small>
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
  tmdbApiKey: string;
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
  tmdbApiKey,
  currentQuoteIndex,
}: FriendSelectionPageProps) {
  const progressPercent =
    enhancementProgress.total > 0
      ? Math.round(
          (enhancementProgress.completed / enhancementProgress.total) * 100
        )
      : 0;

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
                                ? "Adding TMDB movie details..."
                                : "Complete!"}
                        </p>
                      )}
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
                  {!tmdbApiKey && (
                    <div className="tmdb-info-banner">
                      <div className="tmdb-info-content">
                        <div className="tmdb-info-icon">🎬</div>
                        <div className="tmdb-info-text">
                          <h4>Get Movie Posters & Details!</h4>
                          <p>
                            Add your free TMDB API key to see movie posters,
                            ratings, and descriptions.{" "}
                            <a
                              href="https://www.themoviedb.org/settings/api"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Get one here →
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
      </div>{" "}
      {/* Close page-content */}
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
  // AI Generated: GitHub Copilot - 2025-08-02
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showGenreFilter, setShowGenreFilter] = useState<boolean>(false);

  // AI Generated: GitHub Copilot - 2025-08-02
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

    // AI Generated: GitHub Copilot - 2025-08-02
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

    // AI Generated: GitHub Copilot - 2025-08-02
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

  // AI Generated: GitHub Copilot - 2025-08-02
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

  // AI Generated: GitHub Copilot - 2025-08-02
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
          {/* AI Generated: GitHub Copilot - 2025-08-02 */}
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
                onClick={async () => {
                  // AI Generated: GitHub Copilot - 2025-08-02
                  // Open Letterboxd URL in user's default browser for saved cookies/preferences
                  try {
                    await open(generateLetterboxdUrl(movie));
                  } catch (error) {
                    console.error(
                      "Failed to open URL in default browser:",
                      error
                    );
                    // Fallback to window.open if Tauri API fails
                    window.open(generateLetterboxdUrl(movie), "_blank");
                  }
                }}
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
