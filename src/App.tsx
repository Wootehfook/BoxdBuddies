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

import { useState, useEffect } from "react";
// AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
import "./App.css";

// AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
// API Configuration Constants
const API_ENDPOINTS = {
  LETTERBOXD_FRIENDS: "/letterboxd/friends",
  LETTERBOXD_WATCHLIST_COUNT: "/letterboxd/watchlist-count",
  LETTERBOXD_COMPARE: "/letterboxd/compare",
  LETTERBOXD_AVATAR_PROXY: "/letterboxd/avatar-proxy",
} as const;

// AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
// Generate consistent colors for user display throughout the app
function getUserColors(username: string) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#1DD1A1",
    "#FD79A8",
    "#6C5CE7",
    "#74B9FF",
    "#A29BFE",
    "#1E90FF",
    "#FF7675",
    "#74C0FC",
    "#82CA9D",
    "#F8B500",
  ];

  // Create a simple hash from the username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color consistently
  const colorIndex = Math.abs(hash) % colors.length;
  const baseColor = colors[colorIndex];

  return {
    // For avatar backgrounds
    avatarColor: baseColor,
    // For username bubbles/badges
    color: "#ffffff",
    borderColor: baseColor,
    backgroundColor: baseColor + "33", // Add 20% opacity
  };
}

// AI Generated: GitHub Copilot - 2025-08-16T21:00:00Z
// FriendAvatar component with CORS proxy support
function FriendAvatar({ friend }: { friend: Friend }) {
  const [imageError, setImageError] = useState(false);

  const initials = friend.displayName
    ? friend.displayName.charAt(0).toUpperCase()
    : friend.username.charAt(0).toUpperCase();

  // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
  // Secure URL validation for Letterboxd images to prevent domain spoofing
  const isValidLetterboxdUrl = (url: string): boolean => {
    try {
      const parsedUrl = new window.URL(url);
      // Ensure the hostname ends with .ltrbxd.com (not just contains it)
      return (
        parsedUrl.hostname.endsWith(".ltrbxd.com") ||
        parsedUrl.hostname === "ltrbxd.com"
      );
    } catch {
      return false;
    }
  };

  // Use proxy for Letterboxd images to bypass CORS
  const imageUrl =
    friend.profileImageUrl && isValidLetterboxdUrl(friend.profileImageUrl)
      ? `${API_ENDPOINTS.LETTERBOXD_AVATAR_PROXY}?url=${encodeURIComponent(friend.profileImageUrl)}`
      : friend.profileImageUrl;

  const handleImageError = () => {
    console.error(
      `Failed to load image for ${friend.username}:`,
      friend.profileImageUrl,
      "Proxied URL:",
      imageUrl
    );
    setImageError(true);
  };

  return (
    <div className="friend-avatar">
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={friend.displayName || friend.username}
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <div
          className="avatar-initials"
          style={{
            backgroundColor: getUserColors(friend.username).avatarColor,
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

// AI Generated: GitHub Copilot - 2025-08-16T21:30:00Z
// Famous movie quotes for progress display
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
];

interface Friend {
  username: string;
  displayName?: string;
  watchlistCount?: number;
  profileImageUrl?: string;
}

interface Movie {
  id: number;
  title: string;
  year: number;
  poster_path?: string;
  overview?: string;
  vote_average?: number;
  director?: string;
  runtime?: number;
  genres?: string[]; // Array of genre names
  letterboxdSlug?: string;
  friendCount: number;
  friendList: string[];
}

interface EnhancementProgress {
  completed: number;
  total: number;
  status: string;
}

type PageType = "setup" | "friend-selection" | "results";

function App() {
  const [page, setPage] = useState<PageType>("setup");
  const [username, setUsername] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsLoadingProgress, setFriendsLoadingProgress] = useState(0);
  const [isComparing, setIsComparing] = useState(false);
  const [isLoadingWatchlistCounts, setIsLoadingWatchlistCounts] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancementProgress, setEnhancementProgress] =
    useState<EnhancementProgress>({
      completed: 0,
      total: 100,
      status: "Starting...",
    });
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

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

  const handleUserSetup = async () => {
    if (!username.trim()) {
      setError("Please enter your Letterboxd username");
      return;
    }

    setIsLoading(true);
    setIsLoadingFriends(true);
    setFriendsLoadingProgress(0);
    setError(null);

    try {
      // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
      // Start progress simulation for friends loading with deterministic increments
      const progressInterval = setInterval(() => {
        setFriendsLoadingProgress((prev) => {
          // Use deterministic progress increments instead of random for better UX
          const increment = 8 + prev / 10; // Gradual slowdown as we approach completion
          return Math.min(prev + increment, 95); // Cap at 95% until actual completion
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
      setFriendsLoadingProgress(100);

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
        setFriends(friendsData);
        setIsLoadingFriends(false);
        setPage("friend-selection");

        // Fetch watchlist counts for friends (async, doesn't block UI)
        if (friendsData.length > 0) {
          await fetchWatchlistCounts(friendsData);
        }
      }, 300);
    } catch (err) {
      console.error("User setup failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load user data");
      setIsLoadingFriends(false);
      setFriendsLoadingProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  // AI Generated: GitHub Copilot - 2025-08-16T22:30:00Z
  // Fetch watchlist counts for friends in the background
  const fetchWatchlistCounts = async (friendsData: Friend[]) => {
    try {
      setIsLoadingWatchlistCounts(true);
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

        // Update friends with watchlist counts
        setFriends((prev) =>
          prev.map((friend) => {
            const count = data.results[friend.username];
            if (count !== undefined) {
              return { ...friend, watchlistCount: count };
            }
            // If no result for this friend, keep existing value (might be undefined)
            return friend;
          })
        );
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
      setIsLoadingWatchlistCounts(false);
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
    if (selectedFriends.length === 0) {
      setError("Please select at least one friend to compare with");
      return;
    }

    setIsComparing(true);
    setError(null);
    setEnhancementProgress({
      completed: 0,
      total: 100,
      status: "Starting comparison...",
    });

    // AI Generated: GitHub Copilot - 2025-08-16T22:00:00Z
    // Deterministic progress simulation for better UX
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 85) {
        // Use deterministic increment instead of random for smoother progress
        progress += 3 + progress / 20; // Gradual slowdown
        setEnhancementProgress({
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
      setEnhancementProgress({
        completed: 100,
        total: 100,
        status: "Complete!",
      });

      setMovies(data.movies || []);
      setPage("results");
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Comparison failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to compare watchlists"
      );
    } finally {
      setIsComparing(false);
    }
  };

  const handleBackToFriends = () => {
    setPage("friend-selection");
    setMovies([]);
    setEnhancementProgress({ completed: 0, total: 0, status: "" });
  };

  const handleBackToSetup = () => {
    setPage("setup");
    setFriends([]);
    setSelectedFriends([]);
    setMovies([]);
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

// Setup Page Component
interface SetupPageProps {
  username: string;
  setUsername: (value: string) => void;
  onSetup: () => void;
  isLoading: boolean;
  isLoadingFriends: boolean;
  friendsLoadingProgress: number;
  error: string | null;
}

function SetupPage({
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

// Friend Selection Page Component
interface FriendSelectionPageProps {
  friends: Friend[];
  selectedFriends: Friend[];
  onToggleFriend: (friend: Friend) => void;
  onCompareWatchlists: () => void;
  onBackToSetup: () => void;
  isComparing: boolean;
  isLoadingWatchlistCounts: boolean;
  enhancementProgress: EnhancementProgress;
  currentQuoteIndex: number;
  error: string | null;
}

function FriendSelectionPage({
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

// Results Page Component
interface ResultsPageProps {
  movies: Movie[];
  selectedFriends: Friend[];
  onBack: () => void;
  onNewComparison: () => void;
}

function ResultsPage({ movies, onBack }: ResultsPageProps) {
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
          <span className="movie-count">{movies.length}</span>
          <span className="movie-label">
            Movie Match{movies.length !== 1 ? "es" : ""}
          </span>
        </h2>
      </div>

      <div className="page-content">
        {movies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <img
                src="/buddio.svg"
                alt="Buddio"
                className="buddio-empty-state"
              />
            </div>
            <h3>No common movies found</h3>
            <p>
              Try selecting different friends or check if watchlists are public
            </p>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map((movie, index) => (
              <a
                key={movie.id}
                href={`https://letterboxd.com/film/${movie.letterboxdSlug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="movie-card fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="movie-poster-section has-poster">
                  {movie.poster_path &&
                  movie.poster_path !== "/placeholder-poster.jpg" ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                      alt={`${movie.title} poster`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/200x300/1a1f24/9ab?text=No+Poster";
                      }}
                    />
                  ) : (
                    <img
                      src="https://via.placeholder.com/200x300/1a1f24/9ab?text=Movie+Poster"
                      alt={`${movie.title} placeholder`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>

                <div className="movie-info">
                  <div className="movie-content">
                    <div className="movie-title-section">
                      <h3>
                        {movie.title}
                        {movie.year && movie.year > 0 ? ` (${movie.year})` : ""}
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
                          {movie.friendList.map(
                            (friendName: string, idx: number) => {
                              const friendColors = getUserColors(friendName);
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
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default App;
