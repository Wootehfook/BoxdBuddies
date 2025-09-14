/*
 * Boxdbud.io - Movie Watchlist Comparison Tool (Web Version)
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

import { useEffect, useReducer, useCallback, useState, useRef } from "react";
// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Updated imports
import "./App.css";

// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Import extracted components
import { SetupPage } from "./components/SetupPage";
import { FriendSelectionPage } from "./components/FriendSelectionPage";
import { ResultsPage } from "./components/ResultsPage";

// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Import types and utilities
import type { AppState, AppAction, Friend } from "./types";
import { API_ENDPOINTS, FAMOUS_MOVIE_QUOTES } from "./utils";

// AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Removed getUserColors function (now in utils)

// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Removed inline FriendAvatar component

// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Removed duplicate FAMOUS_MOVIE_QUOTES

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_USERNAME":
      return { ...state, username: action.payload };
    case "SET_FRIENDS":
      return { ...state, friends: action.payload };
    case "SET_SELECTED_FRIENDS":
      return { ...state, selectedFriends: action.payload };
    case "TOGGLE_FRIEND": {
      const isSelected = state.selectedFriends.some(
        (f) => f.username === action.payload.username
      );
      return {
        ...state,
        selectedFriends: isSelected
          ? state.selectedFriends.filter(
              (f) => f.username !== action.payload.username
            )
          : [...state.selectedFriends, action.payload],
      };
    }
    case "SET_MOVIES":
      return { ...state, movies: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_LOADING_FRIENDS":
      return { ...state, isLoadingFriends: action.payload };
    case "SET_FRIENDS_LOADING_PROGRESS":
      return { ...state, friendsLoadingProgress: action.payload };
    case "SET_COMPARING":
      return { ...state, isComparing: action.payload };
    case "SET_LOADING_WATCHLIST_COUNTS":
      return { ...state, isLoadingWatchlistCounts: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_ENHANCEMENT_PROGRESS":
      return { ...state, enhancementProgress: action.payload };
    case "SET_CURRENT_QUOTE_INDEX":
      return { ...state, currentQuoteIndex: action.payload };
    case "RESET_STATE":
      return {
        ...initialState,
        username: state.username, // Preserve username
      };
    default:
      return state;
  }
}

const initialState: AppState = {
  page: "setup",
  username: "",
  friends: [],
  selectedFriends: [],
  movies: [],
  isLoading: false,
  isLoadingFriends: false,
  friendsLoadingProgress: 0,
  isComparing: false,
  isLoadingWatchlistCounts: false,
  error: null,
  enhancementProgress: {
    completed: 0,
    total: 100,
    status: "Starting...",
  },
  currentQuoteIndex: 0,
};

function App() {
  // Performance Optimization: Consolidated State Management with useReducer
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Extract state values for easier access
  const {
    page,
    username,
    friends,
    selectedFriends,
    movies,
    isLoading,
    isLoadingFriends,
    friendsLoadingProgress,
    isComparing,
    isLoadingWatchlistCounts,
    error,
    enhancementProgress,
    currentQuoteIndex,
  } = state;

  // Local UI state for the attribution modal
  const [showAttribution, setShowAttribution] = useState(false);
  // Use a typed HTMLDialogElement ref for safe dialog method access
  const modalRef = useRef<HTMLDialogElement | null>(null);

  // When modal opens, show the native dialog when available and move focus into it for accessibility
  useEffect(() => {
    const dialog = modalRef.current;
    if (showAttribution && dialog) {
      try {
        if (typeof dialog.showModal === "function") dialog.showModal();
      } catch {
        // ignore if not supported
      }
      // Defer focus to allow dialog to be visible
      setTimeout(() => dialog?.focus(), 0);
    } else if (!showAttribution && dialog) {
      try {
        if (typeof dialog.close === "function") dialog.close();
      } catch {
        // ignore
      }
    }
  }, [showAttribution]);

  // Performance Optimization: Efficient Quote Rotation with useCallback
  const rotateQuote = useCallback(() => {
    dispatch({
      type: "SET_CURRENT_QUOTE_INDEX",
      payload: (currentQuoteIndex + 1) % FAMOUS_MOVIE_QUOTES.length,
    });
  }, [currentQuoteIndex]);

  // Rotate movie quotes during comparison
  useEffect(() => {
    let quoteInterval: ReturnType<typeof setInterval>;

    if (isComparing) {
      quoteInterval = setInterval(rotateQuote, 4000); // Change quote every 4 seconds
    }

    return () => {
      if (quoteInterval) {
        clearInterval(quoteInterval);
      }
    };
  }, [isComparing, rotateQuote]);

  const handleUserSetup = async () => {
    if (!username.trim()) {
      dispatch({
        type: "SET_ERROR",
        payload: "Please enter your Letterboxd username",
      });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_LOADING_FRIENDS", payload: true });
    dispatch({ type: "SET_FRIENDS_LOADING_PROGRESS", payload: 0 });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
      // Start progress simulation for friends loading with deterministic increments
      const progressInterval = setInterval(() => {
        dispatch({
          type: "SET_FRIENDS_LOADING_PROGRESS",
          payload: Math.min(
            friendsLoadingProgress + 8 + friendsLoadingProgress / 10,
            95
          ),
        });
      }, 800);

      // Use the enhanced friends endpoint with caching and profile pictures
      const response = await window.fetch(API_ENDPOINTS.LETTERBOXD_FRIENDS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          username: username.trim(),
          _timestamp: Date.now(), // Cache busting
        }),
      });

      // Clear progress interval and set to 100%
      clearInterval(progressInterval);
      dispatch({ type: "SET_FRIENDS_LOADING_PROGRESS", payload: 100 });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Delay slightly to show 100% completion
      setTimeout(async () => {
        const friendsData = data.friends || [];
        dispatch({ type: "SET_FRIENDS", payload: friendsData });
        dispatch({ type: "SET_LOADING_FRIENDS", payload: false });
        dispatch({ type: "SET_PAGE", payload: "friend-selection" });

        // Fetch watchlist counts for friends (async, doesn't block UI)
        if (friendsData.length > 0) {
          await fetchWatchlistCounts(friendsData);
        }
      }, 300);
    } catch (err) {
      console.error("User setup failed:", err);
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error ? err.message : "Failed to load user data",
      });
      dispatch({ type: "SET_LOADING_FRIENDS", payload: false });
      dispatch({ type: "SET_FRIENDS_LOADING_PROGRESS", payload: 0 });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // AI Generated: GitHub Copilot - 2025-08-16T22:30:00Z
  // Fetch watchlist counts for friends in the background
  const fetchWatchlistCounts = async (friendsData: Friend[]) => {
    try {
      dispatch({ type: "SET_LOADING_WATCHLIST_COUNTS", payload: true });
      const usernames = friendsData.map((f) => f.username);

      const response = await window.fetch(
        API_ENDPOINTS.LETTERBOXD_WATCHLIST_COUNT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usernames,
            forceRefresh: false, // Use cache for better performance, profile page method is accurate anyway
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update friends with watchlist counts using functional update
        dispatch({
          type: "SET_FRIENDS",
          payload: friendsData.map((friend) => {
            const count = data.results[friend.username];
            if (count !== undefined) {
              return { ...friend, watchlistCount: count };
            }
            // If no result for this friend, keep existing value (might be undefined)
            return friend;
          }),
        });
      } else {
        console.error(
          "Watchlist count API failed:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to fetch watchlist counts:", error);
      // Don't show error to user - this is a nice-to-have feature
    } finally {
      dispatch({ type: "SET_LOADING_WATCHLIST_COUNTS", payload: false });
    }
  };

  const toggleFriend = (friend: Friend) => {
    dispatch({ type: "TOGGLE_FRIEND", payload: friend });
  };

  const handleCompareWatchlists = async () => {
    if (selectedFriends.length === 0) {
      dispatch({
        type: "SET_ERROR",
        payload: "Please select at least one friend to compare with",
      });
      return;
    }

    dispatch({ type: "SET_COMPARING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({
      type: "SET_ENHANCEMENT_PROGRESS",
      payload: {
        completed: 0,
        total: 100,
        status: "Starting comparison...",
      },
    });

    // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
    // Performance Optimization: Efficient Progress Simulation
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 85) {
        // Use deterministic increment instead of random for smoother progress
        progress += 3 + progress / 20; // Gradual slowdown

        let enhancementStatus = "Enhancing with catalog data...";
        if (progress < 25) enhancementStatus = "Scraping user watchlist...";
        else if (progress < 50)
          enhancementStatus = "Scraping friends' watchlists...";
        else if (progress < 75) enhancementStatus = "Finding common movies...";

        dispatch({
          type: "SET_ENHANCEMENT_PROGRESS",
          payload: {
            completed: Math.round(progress),
            total: 100,
            status: enhancementStatus,
          },
        });
      }
    }, 300);

    try {
      const friendUsernames = selectedFriends.map((f) => f.username);

      const response = await window.fetch(API_ENDPOINTS.LETTERBOXD_COMPARE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          friends: friendUsernames,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Display debug information if available
      if (data.debug) {
        console.error("🔍 Watchlist Comparison Debug Info");
        console.error("📡 Request:", data.debug.requestReceived);
        console.error("📊 Movie Counts:", data.debug.movieCounts);
        console.error("🎬 Sample Movies:", data.debug.sampleMovies);
        console.error("🔗 Matching Results:", data.debug.matchingInfo);
        console.error("🧩 Enrichment Sources:", data.debug.enrichment);

        // Show detailed scraping results
        console.error("📋 Scraping Results Details:");
        Object.entries(data.debug.scrapingResults).forEach(
          ([username, result]) => {
            console.error(`  ${username}:`, result);
            // Also log the JSON string to ensure it's visible
            console.error(
              `  ${username} (JSON):`,
              JSON.stringify(result, null, 2)
            );
          }
        );
      }

      clearInterval(progressInterval);
      dispatch({
        type: "SET_ENHANCEMENT_PROGRESS",
        payload: {
          completed: 100,
          total: 100,
          status: "Complete!",
        },
      });

      dispatch({ type: "SET_MOVIES", payload: data.movies || [] });
      dispatch({ type: "SET_PAGE", payload: "results" });
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Comparison failed:", err);
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error ? err.message : "Failed to compare watchlists",
      });
    } finally {
      dispatch({ type: "SET_COMPARING", payload: false });
    }
  };

  const handleBackToFriends = () => {
    dispatch({ type: "SET_PAGE", payload: "friend-selection" });
    dispatch({ type: "SET_MOVIES", payload: [] });
    dispatch({
      type: "SET_ENHANCEMENT_PROGRESS",
      payload: { completed: 0, total: 0, status: "" },
    });
  };

  const handleUsernameChange = (value: string) => {
    dispatch({ type: "SET_USERNAME", payload: value });
  };

  const handleBackToSetup = () => {
    dispatch({ type: "SET_PAGE", payload: "setup" });
    dispatch({ type: "SET_FRIENDS", payload: [] });
    dispatch({ type: "SET_SELECTED_FRIENDS", payload: [] });
    dispatch({ type: "SET_MOVIES", payload: [] });
  };

  const renderCurrentPage = () => {
    switch (page) {
      case "setup":
        return (
          <SetupPage
            username={username}
            setUsername={handleUsernameChange}
            onSetup={handleUserSetup}
            isLoading={isLoading}
            isLoadingFriends={isLoadingFriends}
            friendsLoadingProgress={friendsLoadingProgress}
            error={error}
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
            isComparing={isComparing}
            isLoadingWatchlistCounts={isLoadingWatchlistCounts}
            enhancementProgress={enhancementProgress}
            currentQuoteIndex={currentQuoteIndex}
            error={error}
          />
        );
      case "results":
        return (
          <ResultsPage
            movies={movies}
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
          <div className="logo-wrapper left-logo" aria-hidden="true">
            <img
              src="/boxdbudio.png"
              alt="Boxdbud.io logo"
              className="boxdbudio-logo"
            />
          </div>
          <div className="header-title">
            <h1 className="app-title-text brand" aria-label="Boxdbud dot io">
              <span className="brand-word">Boxdbud</span>
              <span className="brand-dot">.</span>
              <span className="brand-tld">io</span>
            </h1>
            <p className="app-subtitle">
              Find movies all your friends want to watch
            </p>
          </div>
          <div className="logo-wrapper right-logo" aria-hidden="true">
            <img
              src="/boxdbudio.png"
              alt="Boxdbud.io logo (mirrored)"
              className="boxdbudio-logo mirrored"
            />
          </div>
        </div>
      </header>

      <main className="app-main">{renderCurrentPage()}</main>

      {/* Centered single link that opens a modal with data source & attribution info */}
      <footer className="attribution">
        <div className="attribution-center">
          <button
            className="attribution-link"
            onClick={() => setShowAttribution(true)}
            aria-haspopup="dialog"
          >
            Data sources & attribution
          </button>
        </div>

        {showAttribution && (
          <>
            <button
              className="modal-backdrop-button"
              aria-label="Close data sources and attribution dialog"
              onClick={() => setShowAttribution(false)}
            />
            <dialog
              className="modal"
              aria-labelledby="attribution-title"
              aria-modal="true"
              ref={(el) => {
                modalRef.current = el;
              }}
              tabIndex={-1}
              onClose={() => setShowAttribution(false)}
            >
              <h3 id="attribution-title">Data Sources & Attribution</h3>
              <div className="modal-body">
                <p>
                  • Watchlist data is scraped from{" "}
                  <a
                    href="https://letterboxd.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Letterboxd.com
                  </a>
                </p>
                <p>
                  • Movie metadata enhanced with data from{" "}
                  <a
                    href="https://www.themoviedb.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    The Movie Database (TMDB)
                  </a>
                </p>
                <p>• Boxdbud.io is not affiliated with Letterboxd or TMDB</p>
                <p>
                  <em>
                    This product uses the TMDB API but is not endorsed or
                    certified by TMDB.
                  </em>
                </p>
                <hr />
                <h4>Contribute & Support</h4>
                <p>
                  • View source on GitHub:{" "}
                  <a
                    href="https://github.com/Wootehfook/BoxdBuddies"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open BoxdBuddies repository on GitHub in a new tab"
                  >
                    github.com/Wootehfook/BoxdBuddies
                  </a>
                </p>
                <p>
                  • Found an issue?{" "}
                  <a
                    href="https://github.com/Wootehfook/BoxdBuddies/issues/new?labels=bug"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Report a bug on GitHub in a new tab"
                  >
                    Report a bug
                  </a>
                </p>
                <p>
                  • Have an idea?{" "}
                  <a
                    href="https://github.com/Wootehfook/BoxdBuddies/issues/new?labels=enhancement"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Request a feature on GitHub in a new tab"
                  >
                    Request a feature
                  </a>
                </p>
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => setShowAttribution(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </dialog>
          </>
        )}
      </footer>
    </div>
  );
}

// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Removed inline SetupPageProps interface

// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Removed inline SetupPage component

// AI Generated: GitHub Copilot - 2025-08-29T11:30:00Z
// Performance Optimization: Component Splitting - Removed inline FriendSelectionPage and ResultsPage components

export default App;
