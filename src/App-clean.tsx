import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { movieEnhancementService } from "./services/movieEnhancementService";
import "./App.css";

interface Movie {
  id: number;
  title: string;
  year: number;
  posterPath?: string;
  overview?: string;
  rating?: number;
}

interface LetterboxdUser {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  filmsCount?: number;
}

interface LetterboxdFriend {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isSelected: boolean;
  watchlist?: Movie[];
  lastSynced?: string;
}

interface UserData {
  mainUser: LetterboxdUser | null;
  friends: LetterboxdFriend[];
  tmdbApiKey?: string;
}

// Page navigation types
type AppPage = "welcome" | "friends" | "progress" | "results";

function App() {
  // Page state
  const [currentPage, setCurrentPage] = useState<AppPage>("welcome");

  const [userData, setUserData] = useState<UserData>({
    mainUser: null,
    friends: [],
    tmdbApiKey: undefined,
  });

  // Form state
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");

  // UI state
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [_isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isComparingWatchlists, setIsComparingWatchlists] = useState(false);
  const [isEnhancingMovies, setIsEnhancingMovies] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [enhancementProgress, setEnhancementProgress] = useState({
    completed: 0,
    total: 0,
    status: "Initializing...",
  });

  // Results state
  const [commonMovies, setCommonMovies] = useState<any[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("title");

  // Handle user profile loading
  const handleUserProfile = async () => {
    if (!username.trim()) return;

    setIsLoadingProfile(true);
    setErrorMessage("");

    try {
      const profile = await invoke<LetterboxdUser>("get_letterboxd_profile", {
        username,
      });

      setUserData((prevData) => ({
        ...prevData,
        mainUser: profile,
        tmdbApiKey: apiKey || undefined,
      }));

      // Set TMDB API key if provided
      if (apiKey.trim()) {
        movieEnhancementService.setApiKey(apiKey.trim());
      }

      setCurrentPage("friends");
      await loadFriendsList();
    } catch (error) {
      console.error("Error loading profile:", error);
      setErrorMessage(`Failed to load profile: ${error}`);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load friends list
  const loadFriendsList = async (targetUsername?: string) => {
    const usernameToUse = targetUsername || userData.mainUser?.username;
    if (!usernameToUse) return;

    setIsLoadingFriends(true);
    setErrorMessage("");

    try {
      const friends = await invoke<LetterboxdFriend[]>(
        "get_letterboxd_friends",
        {
          username: usernameToUse,
        }
      );

      setUserData((prevData) => {
        const newData = {
          ...prevData,
          friends: friends.map((friend) => ({ ...friend, isSelected: false })),
        };
        return newData;
      });
    } catch (error) {
      console.error("Error loading friends:", error);
      setErrorMessage(`Failed to load friends: ${error}`);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Compare watchlists
  const compareWatchlists = async () => {
    if (!userData.mainUser) return;

    const selectedFriends = userData.friends.filter((f) => f.isSelected);
    if (selectedFriends.length === 0) {
      setErrorMessage(
        "Please select at least one friend to compare watchlists with."
      );
      return;
    }

    setCurrentPage("progress");
    setIsComparingWatchlists(true);
    setErrorMessage("");

    try {
      const usernames = [
        userData.mainUser.username,
        ...selectedFriends.map((f) => f.username),
      ];

      console.log("Comparing watchlists for users:", usernames);
      const result = await invoke<any[]>("compare_watchlists", { usernames });

      if (!result || result.length === 0) {
        setErrorMessage("No common movies found between the selected users.");
        return;
      }

      setCommonMovies(result);
      setIsComparingWatchlists(false);

      // Start movie enhancement
      await performComparison(result);
    } catch (error) {
      console.error("Error comparing watchlists:", error);
      setErrorMessage(`Failed to compare watchlists: ${error}`);
      setIsComparingWatchlists(false);
    }
  };

  // Perform comparison and enhancement
  const performComparison = async (movies: any[]) => {
    if (!userData.mainUser) return;

    setIsEnhancingMovies(true);
    setEnhancementProgress({
      completed: 0,
      total: movies.length,
      status: "Starting enhancement...",
    });

    try {
      const enhancedMovies = await movieEnhancementService.enhanceMovies(
        movies,
        (current, total) =>
          setEnhancementProgress({
            completed: current,
            total: total,
            status: `Enhanced ${current} of ${total} movies...`,
          })
      );

      setCommonMovies(enhancedMovies);
      setFilteredMovies(enhancedMovies);
      setCurrentPage("results");
    } catch (error) {
      console.error("Error enhancing movies:", error);
      setErrorMessage(`Failed to enhance movies: ${error}`);
    } finally {
      setIsEnhancingMovies(false);
    }
  };

  // Filter and sort movies effect
  useEffect(() => {
    let filtered = [...commonMovies];

    // Apply search filter
    if (searchFilter.trim()) {
      filtered = filtered.filter((movie) =>
        movie.title.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "year":
          return b.year - a.year; // Newest first
        case "rating":
          return (b.rating || 0) - (a.rating || 0); // Highest first
        default:
          return 0;
      }
    });

    setFilteredMovies(filtered);
  }, [commonMovies, searchFilter, sortBy]);

  // Clear user data and reset to welcome page
  const clearUserData = () => {
    setUserData({
      mainUser: null,
      friends: [],
      tmdbApiKey: undefined,
    });
    setUsername("");
    setApiKey("");
    setCommonMovies([]);
    setFilteredMovies([]);
    setSearchFilter("");
    setSortBy("title");
    setErrorMessage("");
    setCurrentPage("welcome");
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">BoxdBuddies</h1>
        <p className="subtitle">
          Find movies to watch together with your Letterboxd friends
        </p>
      </header>

      <main className="main">
        {currentPage === "welcome" && (
          <WelcomePage
            username={username}
            setUsername={setUsername}
            apiKey={apiKey}
            setApiKey={setApiKey}
            isLoadingProfile={isLoadingProfile}
            errorMessage={errorMessage}
            onConnect={handleUserProfile}
          />
        )}

        {currentPage === "friends" && userData.mainUser && (
          <FriendsPage
            userProfile={userData.mainUser}
            friends={userData.friends}
            selectedFriends={userData.friends.filter((f) => f.isSelected)}
            setSelectedFriends={(friends) => {
              setUserData((prev) => ({
                ...prev,
                friends: prev.friends.map((f) => ({
                  ...f,
                  isSelected: friends.some((sf) => sf.username === f.username),
                })),
              }));
            }}
            onCompareWatchlists={compareWatchlists}
            onBack={() => setCurrentPage("welcome")}
          />
        )}

        {currentPage === "progress" && (
          <ProgressPage
            isComparing={isComparingWatchlists || isEnhancingMovies}
            enhancementProgress={enhancementProgress}
            onBack={() => setCurrentPage("friends")}
          />
        )}

        {currentPage === "results" && (
          <ResultsPage
            userProfile={userData.mainUser}
            selectedFriends={userData.friends.filter((f) => f.isSelected)}
            filteredMovies={filteredMovies}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onBack={() => setCurrentPage("friends")}
            onClearData={clearUserData}
          />
        )}
      </main>
    </div>
  );
}

// Welcome Page Component
interface WelcomePageProps {
  username: string;
  setUsername: (value: string) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  isLoadingProfile: boolean;
  errorMessage: string;
  onConnect: () => void;
}

function WelcomePage({
  username,
  setUsername,
  apiKey,
  setApiKey,
  isLoadingProfile,
  errorMessage,
  onConnect,
}: WelcomePageProps) {
  return (
    <section className="setup-section">
      <div className="setup-card">
        <h2>Connect Your Letterboxd Account</h2>
        <p>
          Enter your Letterboxd username to import your profile and friends list
        </p>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <div className="form-group">
          <label htmlFor="username">Letterboxd Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={isLoadingProfile}
          />
        </div>

        <div className="form-group">
          <label htmlFor="api-key">TMDB API Key (Optional)</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="For enhanced movie details and posters"
            disabled={isLoadingProfile}
          />
          <small>
            Get your free API key at{" "}
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              TMDB
            </a>
          </small>
        </div>

        <button
          onClick={onConnect}
          disabled={!username.trim() || isLoadingProfile}
          className="btn btn-primary"
        >
          {isLoadingProfile ? "Loading Profile..." : "Connect Account"}
        </button>
      </div>
    </section>
  );
}

// Friends Page Component
interface FriendsPageProps {
  userProfile: any;
  friends: any[];
  selectedFriends: any[];
  setSelectedFriends: (friends: any[]) => void;
  onCompareWatchlists: () => void;
  onBack: () => void;
}

function FriendsPage({
  userProfile,
  friends,
  selectedFriends,
  setSelectedFriends,
  onCompareWatchlists,
  onBack,
}: FriendsPageProps) {
  const toggleFriend = (friend: any) => {
    setSelectedFriends(
      selectedFriends.some((f) => f.username === friend.username)
        ? selectedFriends.filter((f) => f.username !== friend.username)
        : [...selectedFriends, friend]
    );
  };

  return (
    <section className="friends-section">
      <div className="friends-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back
        </button>
        <h2>Select Friends to Compare</h2>
        <p>
          Choose friends to compare watchlists with{" "}
          {userProfile?.displayName || userProfile?.username}
        </p>
      </div>

      {friends.length === 0 ? (
        <div className="no-friends">
          <p>
            No friends found. Make sure your Letterboxd profile is public and
            you&apos;re following other users.
          </p>
        </div>
      ) : (
        <>
          <div className="friends-grid">
            {friends.map((friend) => (
              <div
                key={friend.username}
                className={`friend-card ${selectedFriends.some((f) => f.username === friend.username) ? "selected" : ""}`}
                onClick={() => toggleFriend(friend)}
              >
                <div className="friend-avatar">
                  {friend.avatarUrl && (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.displayName || friend.username}
                    />
                  )}
                </div>
                <div className="friend-info">
                  <h3>{friend.displayName || friend.username}</h3>
                  <p>@{friend.username}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="compare-actions">
            <p>
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
          </div>
        </>
      )}
    </section>
  );
}

// Progress Page Component
interface ProgressPageProps {
  isComparing: boolean;
  enhancementProgress: { completed: number; total: number; status: string };
  onBack: () => void;
}

function ProgressPage({
  isComparing,
  enhancementProgress,
  onBack,
}: ProgressPageProps) {
  const progressPercent =
    enhancementProgress.total > 0
      ? Math.round(
          (enhancementProgress.completed / enhancementProgress.total) * 100
        )
      : 0;

  return (
    <section className="progress-section">
      <div className="progress-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back
        </button>
        <h2>Comparing Watchlists</h2>
        <p>Finding movies in common and enhancing with additional details...</p>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {enhancementProgress.total > 0 && (
            <span>
              {enhancementProgress.completed} of {enhancementProgress.total}{" "}
              movies processed
            </span>
          )}
          <span>{enhancementProgress.status}</span>
        </div>
      </div>

      {isComparing && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>This may take a moment...</p>
        </div>
      )}
    </section>
  );
}

// Results Page Component
interface ResultsPageProps {
  userProfile: any;
  selectedFriends: any[];
  filteredMovies: any[];
  searchFilter: string;
  setSearchFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  onBack: () => void;
  onClearData: () => void;
}

function ResultsPage({
  userProfile,
  selectedFriends,
  filteredMovies,
  searchFilter,
  setSearchFilter,
  sortBy,
  setSortBy,
  onBack,
  onClearData,
}: ResultsPageProps) {
  return (
    <section className="results-section">
      <div className="results-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back
        </button>
        <h2>Shared Movies</h2>
        <p>
          Movies found in common between{" "}
          {userProfile?.displayName || userProfile?.username} and{" "}
          {selectedFriends.length} friend
          {selectedFriends.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="results-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="title">Sort by Title</option>
            <option value="year">Sort by Year</option>
            <option value="rating">Sort by Rating</option>
            <option value="popularity">Sort by Popularity</option>
          </select>
        </div>

        <button onClick={onClearData} className="btn btn-outline">
          Start Over
        </button>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="no-results">
          <p>
            No shared movies found{searchFilter ? " matching your search" : ""}.
          </p>
          {searchFilter && (
            <button
              onClick={() => setSearchFilter("")}
              className="btn btn-secondary"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="results-count">
            <p>
              {filteredMovies.length} movie
              {filteredMovies.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="movies-grid">
            {filteredMovies.map((movie, index) => (
              <div key={index} className="movie-card">
                {movie.enhanced?.poster_path && (
                  <div className="movie-poster">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${movie.enhanced.poster_path}`}
                      alt={movie.title}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="movie-info">
                  <h3>{movie.title}</h3>
                  {movie.enhanced?.release_date && (
                    <p className="movie-year">
                      {new Date(movie.enhanced.release_date).getFullYear()}
                    </p>
                  )}
                  {movie.enhanced?.vote_average && (
                    <div className="movie-rating">
                      <span>
                        ⭐ {movie.enhanced.vote_average.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                  {movie.enhanced?.overview && (
                    <p className="movie-overview">{movie.enhanced.overview}</p>
                  )}
                  <div className="movie-friends">
                    <p>Also on:</p>
                    <div className="friends-list">
                      {movie.friends.map((friend: any, idx: number) => (
                        <span key={idx} className="friend-tag">
                          {friend.displayName || friend.username}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default App;
