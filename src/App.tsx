/*
 * BoxdBuddy - Movie Watchlist Comparison Tool (Web Version)
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

import { useEffect, useReducer, useCallback } from "react";
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
          payload: friends.map((friend) => {
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
        dispatch({
          type: "SET_ENHANCEMENT_PROGRESS",
          payload: {
            completed: Math.round(progress),
            total: 100,
            status:
              progress < 25
                ? "Scraping user watchlist..."
                : progress < 50
                  ? "Scraping friends' watchlists..."
                  : progress < 75
                    ? "Finding common movies..."
                    : "Enhancing with TMDB data...",
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
          <div className="header-title">
            <h1>
              <img src="/buddio.svg" alt="Buddio" className="buddio-logo" />
              <span className="app-title-text">BoxdBuddy</span>
            </h1>
            <p>Find movies all your friends want to watch</p>
          </div>
        </div>
      </header>

      <main className="app-main">{renderCurrentPage()}</main>

      <footer className="attribution">
        <p>
          <strong>Data Sources & Attribution:</strong>
        </p>
        <p>
          • Watchlist data is scraped from{" "}
          <a
            href="https://letterboxd.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Letterboxd.com
          </a>
          <br />• Movie metadata enhanced with data from{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Movie Database (TMDB)
          </a>
          <br />• BoxdBuddy is not affiliated with Letterboxd or TMDB
        </p>
        <p>
          <em>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </em>
        </p>
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
