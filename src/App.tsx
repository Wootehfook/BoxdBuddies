import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { movieEnhancementService } from './services/movieEnhancementService';
import './App.css';

// AI Generated: GitHub Copilot - 2025-08-01

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
}

interface LetterboxdUser {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  filmsCount?: number;
}

interface Friend {
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface EnhancementProgress {
  completed: number;
  total: number;
  status: string;
}

type PageType = 'setup' | 'friend-selection' | 'progress' | 'results';

function App() {
  const [page, setPage] = useState<PageType>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Setup state
  const [username, setUsername] = useState('');
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [userProfile, setUserProfile] = useState<LetterboxdUser | null>(null);
  
  // Friend selection state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  
  // Comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [enhancementProgress, setEnhancementProgress] = useState<EnhancementProgress>({
    completed: 0,
    total: 0,
    status: 'Initializing...'
  });
  const [comparisonResults, setComparisonResults] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    page: page,
    movieCount: 0,
    filteredCount: 0
  });

  // Update debug info when state changes
  useEffect(() => {
    setDebugInfo({
      page: page,
      movieCount: comparisonResults.length,
      filteredCount: filteredMovies.length
    });
  }, [page, comparisonResults.length, filteredMovies.length]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const validateInputs = () => {
    if (!username.trim()) {
      setError('Please enter your Letterboxd username');
      return false;
    }
    if (!tmdbApiKey.trim()) {
      setError('Please enter your TMDB API key');
      return false;
    }
    return true;
  };

  const backendCallWithTimeout = async (
    operation: () => Promise<any>,
    timeoutMs: number = 120000 // 2 minutes
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs / 1000} seconds`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };

  const handleUserSetup = async () => {
    if (!validateInputs()) return;
    
    clearMessages();
    setIsLoading(true);
    
    try {
      await backendCallWithTimeout(async () => {
        const profile = await invoke<LetterboxdUser>('save_user_profile', {
          username: username.trim(),
          tmdbApiKey: tmdbApiKey.trim()
        });
        
        setUserProfile(profile);
        setSuccess('Profile saved successfully!');
        
        // Auto-fetch friends after successful setup
        const friendsList = await invoke<Friend[]>('get_letterboxd_friends', {
          username: username.trim()
        });
        
        setFriends(friendsList);
        setPage('friend-selection');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendsFetch = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    clearMessages();
    setIsLoading(true);
    
    try {
      await backendCallWithTimeout(async () => {
        const friendsList = await invoke<Friend[]>('get_letterboxd_friends', {
          username: username.trim()
        });
        
        setFriends(friendsList);
        setSuccess(`Found ${friendsList.length} friends!`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriend = (friend: Friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.username === friend.username);
      if (isSelected) {
        return prev.filter(f => f.username !== friend.username);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleCompareWatchlists = async () => {
    if (selectedFriends.length === 0) {
      setError('Please select at least one friend to compare with');
      return;
    }

    clearMessages();
    setIsComparing(true);
    setPage('progress');
    setEnhancementProgress({ completed: 0, total: 0, status: 'Starting comparison...' });

    try {
      await backendCallWithTimeout(async () => {
        const friendUsernames = selectedFriends.map(f => f.username);
        const results = await invoke<Movie[]>('compare_watchlists', {
          friends: friendUsernames
        });

        if (results.length === 0) {
          setError('No common movies found in watchlists');
          setPage('friend-selection');
          return;
        }

        setComparisonResults(results);
        setFilteredMovies(results);
        
        // Start enhancement process
        setEnhancementProgress({ 
          completed: 0, 
          total: results.length, 
          status: 'Enhancing movie data with TMDB...' 
        });

        // Process movies in batches for better UX
        const batchSize = 25;
        const enhancedResults: Movie[] = [];

        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          const enhancedBatch = await movieEnhancementService.enhanceMovies(batch);
          enhancedResults.push(...enhancedBatch);
          
          setEnhancementProgress({
            completed: enhancedResults.length,
            total: results.length,
            status: `Enhanced ${enhancedResults.length} of ${results.length} movies...`
          });

          // Small delay to prevent overwhelming the UI
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setComparisonResults(enhancedResults);
        setFilteredMovies(enhancedResults);
        setPage('results');
      }, 180000); // 3 minutes for comparison
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare watchlists');
      setPage('friend-selection');
    } finally {
      setIsComparing(false);
    }
  };

  const handleBackToFriends = () => {
    setPage('friend-selection');
    setComparisonResults([]);
    setFilteredMovies([]);
    setEnhancementProgress({ completed: 0, total: 0, status: '' });
  };

  const handleBackToSetup = () => {
    setPage('setup');
    setFriends([]);
    setSelectedFriends([]);
    setComparisonResults([]);
    setFilteredMovies([]);
    setUserProfile(null);
  };

  const renderCurrentPage = () => {
    switch (page) {
      case 'setup':
        return (
          <SetupPage
            username={username}
            setUsername={setUsername}
            tmdbApiKey={tmdbApiKey}
            setTmdbApiKey={setTmdbApiKey}
            onSetup={handleUserSetup}
            isLoading={isLoading}
          />
        );
      case 'friend-selection':
        return (
          <FriendSelectionPage
            friends={friends}
            selectedFriends={selectedFriends}
            onToggleFriend={toggleFriend}
            onCompareWatchlists={handleCompareWatchlists}
            onBackToSetup={handleBackToSetup}
            onRefreshFriends={handleFriendsFetch}
            isLoading={isLoading}
          />
        );
      case 'progress':
        return (
          <ProgressPage
            isComparing={isComparing}
            enhancementProgress={enhancementProgress}
            onBack={handleBackToFriends}
          />
        );
      case 'results':
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
      {/* Debug Panel - Hidden for better UX */}
      {false && (
        <div className="debug-panel">
          Page: {debugInfo.page} | Movies: {debugInfo.movieCount} | Filtered: {debugInfo.filteredCount}
        </div>
      )}

      <header className="app-header">
        <h1>🎬 BoxdBuddies</h1>
        <p>Find movies you and your friends want to watch</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="message error">
            <p>{error}</p>
            <button onClick={clearMessages} className="btn-close">×</button>
          </div>
        )}
        
        {success && (
          <div className="message success">
            <p>{success}</p>
            <button onClick={clearMessages} className="btn-close">×</button>
          </div>
        )}

        {renderCurrentPage()}
      </main>
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
}

function SetupPage({ username, setUsername, tmdbApiKey, setTmdbApiKey, onSetup, isLoading }: SetupPageProps) {
  return (
    <section className="page setup-page">
      <div className="page-content">
        <div className="setup-card">
          <h2>Get Started</h2>
          <p>Enter your details to compare Letterboxd watchlists with friends</p>
          
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
            <label htmlFor="tmdb-key">TMDB API Key</label>
            <input
              id="tmdb-key"
              type="password"
              value={tmdbApiKey}
              onChange={(e) => setTmdbApiKey(e.target.value)}
              placeholder="Your TMDB API key"
              disabled={isLoading}
            />
            <small>
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
                Get your free TMDB API key here
              </a>
            </small>
          </div>
          
          <button 
            onClick={onSetup} 
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
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
}

function FriendSelectionPage({ 
  friends, 
  selectedFriends, 
  onToggleFriend, 
  onCompareWatchlists, 
  onBackToSetup, 
  onRefreshFriends,
  isLoading 
}: FriendSelectionPageProps) {
  return (
    <section className="page friends-page">
      <div className="page-header">
        <button onClick={onBackToSetup} className="btn btn-secondary">
          ← Back to Setup
        </button>
        <h2>Select Friends</h2>
        <button onClick={onRefreshFriends} disabled={isLoading} className="btn btn-secondary">
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>
      
      <div className="page-content">
      {friends.length === 0 ? (
        <div className="empty-state">
          <p>No friends found or still loading...</p>
          <button onClick={onRefreshFriends} disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Loading...' : 'Try Again'}
          </button>
        </div>
      ) : (
        <>
          <div className="friends-grid">
            {friends.map((friend) => (
              <div
                key={friend.username}
                className={`friend-card ${selectedFriends.some(f => f.username === friend.username) ? 'selected' : ''}`}
                onClick={() => onToggleFriend(friend)}
              >
                <div className="friend-avatar">
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt={`${friend.displayName || friend.username} avatar`} />
                  ) : (
                    friend.displayName ? friend.displayName.charAt(0).toUpperCase() : friend.username.charAt(0).toUpperCase()
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
            <p>{selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected</p>
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
      </div> {/* Close page-content */}
    </section>
  );
}

// Progress Page Component
interface ProgressPageProps {
  isComparing: boolean;
  enhancementProgress: { completed: number; total: number; status: string };
  onBack: () => void;
}

function ProgressPage({ isComparing, enhancementProgress, onBack }: ProgressPageProps) {
  const progressPercent = enhancementProgress.total > 0 
    ? Math.round((enhancementProgress.completed / enhancementProgress.total) * 100) 
    : 0;

  return (
    <section className="page progress-page">
      <div className="page-header">
        <button onClick={onBack} className="btn btn-secondary" disabled={isComparing}>
          ← Back to Friends
        </button>
        <h2>Comparing Watchlists</h2>
      </div>
      
      <div className="page-content">
        <div className="progress-container">
          <div className="progress-info">
            <h3>{enhancementProgress.status}</h3>
            <p>
              {enhancementProgress.completed} of {enhancementProgress.total} movies processed
            </p>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          <div className="progress-percent">
            {progressPercent}% complete
          </div>
        </div>
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

function ResultsPage({ movies, selectedFriends, onBack, onNewComparison }: ResultsPageProps) {
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>(movies);
  const [sortBy, setSortBy] = useState<'friends' | 'rating' | 'year'>('friends');
  const [minFriends, setMinFriends] = useState<number>(1);

  useEffect(() => {
    let filtered = movies.filter(movie => movie.friendCount >= minFriends);
    
    // Sort movies
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'friends':
          return b.friendCount - a.friendCount;
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        default:
          return 0;
      }
    });
    
    setFilteredMovies(filtered);
  }, [movies, sortBy, minFriends]);

  return (
    <section className="page results-page">
      <div className="page-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Friends
        </button>
        <h2>Movie Matches</h2>
        <button onClick={onNewComparison} className="btn btn-secondary">
          New Comparison
        </button>
      </div>
      
      <div className="page-content">
        <div className="results-controls">
          <div className="filter-group">
            <label htmlFor="sort-by">Sort by:</label>
            <select 
              id="sort-by"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'friends' | 'rating' | 'year')}
            >
              <option value="friends">Friend Count</option>
              <option value="rating">Rating</option>
              <option value="year">Year</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="min-friends">Min friends:</label>
            <input
              id="min-friends"
              type="number"
              min="1"
              max={selectedFriends.length}
              value={minFriends}
              onChange={(e) => setMinFriends(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

      {filteredMovies.length === 0 ? (
        <div className="empty-state">
          <h3>No movies found</h3>
          <p>Try adjusting your filters or select different friends.</p>
        </div>
      ) : (
        <>
          <div className="results-count">
            <p>{filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} found</p>
          </div>
          
          <div className="movies-grid">
            {filteredMovies.map((movie, index) => (
              <div 
                key={index} 
                className="movie-card"
              >
                <div 
                  className="movie-poster-section"
                  style={{
                    backgroundImage: movie.posterPath ? `url(${movie.posterPath})` : 'none'
                  }}
                />
                
                <div className="movie-info">
                  <h3>{movie.title}{movie.year && movie.year > 0 ? ` (${movie.year})` : ''}</h3>
                  
                  <div className="movie-details">
                    {movie.genre && (
                      <span className="movie-genre">{movie.genre}</span>
                    )}
                  </div>
                  
                  {movie.director && (
                    <p className="movie-director">Directed by {movie.director}</p>
                  )}
                  
                  {movie.averageRating && (
                    <div className="movie-rating">
                      <span>⭐ {movie.averageRating.toFixed(1)}/10</span>
                    </div>
                  )}
                  
                  <div className="movie-friends">
                    <div className="friend-count-visual">
                      <span className="friend-visual">
                        {'🎫'.repeat(movie.friendCount)}
                      </span>
                      <span className="friend-count-text">
                        {movie.friendCount} friend{movie.friendCount !== 1 ? 's' : ''} want{movie.friendCount === 1 ? 's' : ''} to see this
                      </span>
                    </div>
                    
                    {movie.friendList && movie.friendList.length > 0 && (
                      <div className="friend-list-expanded">
                        {movie.friendList.map((friendName: string, idx: number) => (
                          <span key={idx} className="friend-tag">
                            {friendName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </section>
  );
}

export default App;
