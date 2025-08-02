import { useState, useEffect, useRef } from 'react';
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
  watchlistCount?: number;
}

interface EnhancementProgress {
  completed: number;
  total: number;
  status: string;
}

type PageType = 'setup' | 'friend-selection' | 'results';

function App() {
  const [page, setPage] = useState<PageType>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Window state
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  
  // Setup state
  const [username, setUsername] = useState('');
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [userProfile, setUserProfile] = useState<LetterboxdUser | null>(null);
  const [setupProgress, setSetupProgress] = useState({
    profileSaved: false,
    friendsLoaded: false
  });
  
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
    filteredCount: 0,
    databaseDebug: '' // AI Generated: GitHub Copilot - 2025-08-01
  });

  // Update debug info when state changes and ensure window focus
  useEffect(() => {
    setDebugInfo({
      page: page,
      movieCount: comparisonResults.length,
      filteredCount: filteredMovies.length,
      databaseDebug: debugInfo.databaseDebug // Preserve existing debug data
    });
    
    // Ensure window focus when navigating between pages
    ensureWindowFocus();
  }, [page, comparisonResults.length, filteredMovies.length]);

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
        console.log('🔧 FRONTEND: Checking for existing user preferences...');
        const userPrefs = await invoke('load_user_preferences') as any;
        
        if (userPrefs.username && userPrefs.tmdb_api_key) {
          console.log('🔧 FRONTEND: Found existing user preferences, loading user data');
          setUsername(userPrefs.username);
          setTmdbApiKey(userPrefs.tmdb_api_key);
          
          // Restore pin setting if available
          if (userPrefs.always_on_top !== undefined) {
            setIsAlwaysOnTop(userPrefs.always_on_top);
            // Apply the setting to the window
            try {
              await invoke('set_always_on_top', { alwaysOnTop: userPrefs.always_on_top });
            } catch (error) {
              console.error('🔧 FRONTEND: Error setting always on top from preferences:', error);
            }
          }
          
          // Load friends list automatically with watchlist counts
          const friendsResult = await invoke('get_friends_with_watchlist_counts') as Friend[];
          // Filter out the current user from the friends list
          const filteredFriends = friendsResult.filter(friend => friend.username !== userPrefs.username);
          setFriends(filteredFriends);
          
          // Skip setup page and go directly to friend selection
          setPage('friend-selection');
          console.log('🔧 FRONTEND: Skipped setup, going to friend selection');
        } else {
          console.log('🔧 FRONTEND: No existing user preferences found, staying on setup page');
        }
      } catch (err) {
        console.error('🔧 FRONTEND: Error checking existing user:', err);
        // Stay on setup page if there's an error
      }
    };

    checkExistingUser();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // AI Generated: GitHub Copilot - 2025-08-01
  // Temporary debugging function to inspect database contents
  const debugDatabase = async () => {
    try {
      console.log('🔧 DEBUG: debugDatabase function called');
      setIsLoading(true);
      setError(null); // Clear any existing errors
      console.log('🔧 DEBUG: About to call invoke(debug_database_contents)...');
      
      const debugData = await invoke('debug_database_contents') as string;
      console.log('🔧 DEBUG: Database contents received:', debugData);
      console.log('🔧 DEBUG: Debug info type:', typeof debugData);
      console.log('🔧 DEBUG: Debug info length:', debugData.length);
      
      // Store in persistent debug state
      setDebugInfo(prev => ({
        ...prev,
        databaseDebug: debugData
      }));
      
      console.log('🔧 DEBUG: Set debug data in debug panel');
      
    } catch (err) {
      console.error('🔧 DEBUG: Error getting database info:', err);
      setError('Error getting database info: ' + err);
    } finally {
      setIsLoading(false);
      console.log('🔧 DEBUG: debugDatabase function completed');
    }
  };

  const ensureWindowFocus = async () => {
    try {
      await invoke('set_window_focus');
    } catch (err) {
      console.warn('Failed to set window focus:', err);
    }
  };

  const toggleAlwaysOnTop = async () => {
    try {
      const newState = !isAlwaysOnTop;
      await invoke('set_always_on_top', { alwaysOnTop: newState });
      setIsAlwaysOnTop(newState);
      setSuccess(newState ? 'Window pinned on top' : 'Window unpinned');
      
      // Save the preference if we have user data
      if (username && tmdbApiKey) {
        try {
          await invoke('save_user_preferences', {
            request: {
              username: username.trim(),
              tmdbApiKey: tmdbApiKey.trim(),
              alwaysOnTop: newState
            }
          });
          console.log('🔧 FRONTEND: Pin preference saved');
        } catch (saveErr) {
          console.error('🔧 FRONTEND: Error saving pin preference:', saveErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pin');
    }
  };

  const validateInputs = () => {
    if (!username.trim()) {
      setError('Please enter your Letterboxd username');
      return false;
    }
    // TMDB API key is now optional
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
    console.log('🔧 FRONTEND: handleUserSetup called');
    console.log('🔧 FRONTEND: username =', username);
    console.log('🔧 FRONTEND: tmdbApiKey =', tmdbApiKey);
    
    if (!validateInputs()) return;
    
    clearMessages();
    setIsLoading(true);
    setSetupProgress({ profileSaved: false, friendsLoaded: false });
    
    try {
      console.log('🔧 FRONTEND: About to call backendCallWithTimeout for save_user_preferences');
      await backendCallWithTimeout(async () => {
        console.log('🔧 FRONTEND: About to invoke save_user_preferences');
        await invoke('save_user_preferences', {
          request: {
            username: username.trim(),
            tmdbApiKey: tmdbApiKey.trim(),
            alwaysOnTop: isAlwaysOnTop
          }
        });
        console.log('🔧 FRONTEND: save_user_preferences completed successfully');
      });
      
      // Profile saved successfully
      setSetupProgress(prev => ({ ...prev, profileSaved: true }));
      
      // Auto-fetch friends
      try {
        console.log('🔧 FRONTEND: About to fetch friends');
        await invoke<Friend[]>('scrape_letterboxd_friends', {
          username: username.trim()
        });
        
        // After scraping, load friends with watchlist counts
        const friendsWithCounts = await invoke('get_friends_with_watchlist_counts') as Friend[];
        // Filter out the current user from the friends list
        const filteredFriends = friendsWithCounts.filter(friend => friend.username !== username.trim());
        setFriends(filteredFriends);
        setSetupProgress(prev => ({ ...prev, friendsLoaded: true }));
        
        // Proceed directly to friend selection without delay
        setPage('friend-selection');
        
      } catch (friendsError) {
        console.log('🔧 FRONTEND: Friends fetch failed, but profile was saved:', friendsError);
        // Still proceed to friends page even if auto-fetch fails
        setPage('friend-selection');
      }
      
    } catch (err) {
      console.error('🔧 FRONTEND: Error in handleUserSetup:', err);
      console.error('🔧 FRONTEND: Error type:', typeof err);
      console.error('🔧 FRONTEND: Error message:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      console.log('🔧 FRONTEND: handleUserSetup finished, setting isLoading to false');
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
        await invoke<Friend[]>('scrape_letterboxd_friends', {
          username: username.trim()
        });
        
        // After scraping, load friends with watchlist counts
        const friendsWithCounts = await invoke('get_friends_with_watchlist_counts') as Friend[];
        // Filter out the current user from the friends list
        const filteredFriends = friendsWithCounts.filter(friend => friend.username !== username.trim());
        setFriends(filteredFriends);
        setSuccess(`Found ${filteredFriends.length} friends!`);
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
    console.log('🔧 FRONTEND: handleCompareWatchlists called, selectedFriends.length:', selectedFriends.length);
    
    if (selectedFriends.length === 0) {
      console.log('🔧 FRONTEND: No friends selected, showing error');
      setError('Please select at least one friend to compare with');
      return;
    }

    console.log('🔧 FRONTEND: Starting comparison process...');
    clearMessages();
    setIsComparing(true);
    setEnhancementProgress({ completed: 0, total: 0, status: 'Starting comparison...' });

    try {
      console.log('🔧 FRONTEND: About to call backendCallWithTimeout...');
      await backendCallWithTimeout(async () => {
        const friendUsernames = selectedFriends.map(f => f.username);
        console.log('🔧 FRONTEND: Calling compare_watchlists with friends:', friendUsernames);
        
        console.log('🔧 FRONTEND: About to invoke compare_watchlists...');
        const compareResult = await invoke<{commonMovies: Movie[]}>('compare_watchlists', {
          mainUsername: username || 'Wootehfook',
          friendUsernames: friendUsernames,
          tmdbApiKey: tmdbApiKey || null,
          limitTo500: false
        });
        console.log('🔧 FRONTEND: compare_watchlists returned result:', compareResult);
        
        const results = compareResult.commonMovies;
        console.log('🔧 FRONTEND: extracted common movies:', results.length, 'movies');

        if (results.length === 0) {
          console.log('🔧 FRONTEND: No common movies found');
          setError('No common movies found in watchlists');
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
          
          // Transform enhanced movies to match our Movie interface
          const transformedBatch = enhancedBatch.map(movie => ({
            ...movie,
            friendCount: results.find(r => r.title === movie.title && r.year === movie.year)?.friendCount || 0,
            friendList: results.find(r => r.title === movie.title && r.year === movie.year)?.friendList || []
          }));
          
          enhancedResults.push(...transformedBatch);
          
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
      console.error('🚨 FRONTEND: Error in handleCompareWatchlists:', err);
      console.error('🚨 FRONTEND: Error type:', typeof err);
      console.error('🚨 FRONTEND: Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('🚨 FRONTEND: Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      setError(err instanceof Error ? err.message : 'Failed to compare watchlists');
    } finally {
      console.log('🔧 FRONTEND: handleCompareWatchlists finally block, setting isComparing to false');
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
            setupProgress={setupProgress}
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
            isComparing={isComparing}
            enhancementProgress={enhancementProgress}
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
      {/* Debug Panel - Enabled for debugging */}
      {true && (
        <div className="debug-panel">
          Page: {debugInfo.page} | Movies: {debugInfo.movieCount} | Filtered: {debugInfo.filteredCount}
          <button onClick={debugDatabase} style={{marginLeft: '10px', fontSize: '12px'}} disabled={isLoading}>
            Debug DB
          </button>
          {debugInfo.databaseDebug && (
            <div style={{marginTop: '5px', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '100px', overflow: 'auto'}}>
              {debugInfo.databaseDebug}
            </div>
          )}
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🎬 BoxdBuddies</h1>
            <p>Find movies you and your friends want to watch</p>
          </div>
          <div className="pin-container">
            <button 
              onClick={toggleAlwaysOnTop}
              className={`btn-pin ${isAlwaysOnTop ? 'pinned' : ''}`}
              title={isAlwaysOnTop ? 'Unpin window' : 'Pin window on top'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      <main className="app-main">
        {renderCurrentPage()}
      </main>
      
      {/* Subtle toast notifications */}
      {error && (
        <div className="toast toast-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="toast toast-success">
          {success}
        </div>
      )}
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

function SetupPage({ username, setUsername, tmdbApiKey, setTmdbApiKey, onSetup, isLoading, setupProgress }: SetupPageProps) {
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
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
                Get your free TMDB API key here
              </a>
            </small>
          </div>
          
          {/* Progress indicators */}
          {isLoading && (
            <div className="setup-progress">
              <div className="progress-item">
                <span className="progress-icon">
                  {setupProgress.profileSaved ? '✅' : '⏳'}
                </span>
                <span className="progress-text">
                  {setupProgress.profileSaved ? 'Profile saved' : 'Saving profile...'}
                </span>
              </div>
              <div className="progress-item">
                <span className="progress-icon">
                  {setupProgress.friendsLoaded ? '✅' : setupProgress.profileSaved ? '⏳' : '⏸️'}
                </span>
                <span className="progress-text">
                  {setupProgress.friendsLoaded ? 'Friends loaded' : setupProgress.profileSaved ? 'Loading friends...' : 'Loading friends'}
                </span>
              </div>
            </div>
          )}
          
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
  isComparing: boolean;
  enhancementProgress: EnhancementProgress;
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
  enhancementProgress
}: FriendSelectionPageProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressPercent = enhancementProgress.total > 0 
    ? Math.round((enhancementProgress.completed / enhancementProgress.total) * 100) 
    : 0;

  useEffect(() => {
    if (progressBarRef.current && isComparing) {
      const fillElement = progressBarRef.current.querySelector('.progress-bar-fill') as HTMLElement;
      if (fillElement) {
        fillElement.style.width = `${progressPercent}%`;
      }
    }
  }, [progressPercent, isComparing]);

  return (
    <section className="page friends-page">
      <div className="page-header">
        <button onClick={onBackToSetup} className="btn btn-secondary btn-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Setup
        </button>
        <h2>Select Friends</h2>
        <button onClick={onRefreshFriends} disabled={isLoading} className="btn btn-secondary btn-icon">
          {isLoading ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/>
                <path d="M21 4v4h-4"/>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              Refresh
            </>
          )}
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
            {friends
              .sort((a, b) => a.username.localeCompare(b.username))
              .map((friend) => (
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
                  {friend.watchlistCount !== undefined && (
                    <p className="watchlist-count">
                      {friend.watchlistCount === 0 
                        ? "Watchlist: NA" 
                        : `Watchlist: ${friend.watchlistCount} Film${friend.watchlistCount === 1 ? '' : 's'}`
                      }
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="compare-actions">
            <p>{selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected</p>
            {isComparing ? (
              <div className="progress-button-container">
                <div className="progress-info">
                  <h3>{enhancementProgress.status}</h3>
                  <p>
                    {enhancementProgress.completed} of {enhancementProgress.total} movies processed
                  </p>
                </div>
                <div 
                  ref={progressBarRef}
                  className="progress-bar"
                >
                  <div className="progress-bar-fill" />
                </div>
                <div className="progress-text">
                  {progressPercent}% complete
                </div>
              </div>
            ) : (
              <button
                onClick={onCompareWatchlists}
                disabled={selectedFriends.length === 0}
                className="btn btn-primary"
              >
                Compare Watchlists
              </button>
            )}
          </div>
        </>
      )}
      </div> {/* Close page-content */}
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
        <button onClick={onBack} className="btn btn-secondary btn-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Friends
        </button>
        <h2>Movie Matches</h2>
        <button onClick={onNewComparison} className="btn btn-secondary btn-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M2 12h20"/>
          </svg>
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
                  className={`movie-poster-section ${movie.posterPath ? 'has-poster' : 'no-poster'}`}
                  {...(movie.posterPath && {
                    style: { backgroundImage: `url(${movie.posterPath})` }
                  })}
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
