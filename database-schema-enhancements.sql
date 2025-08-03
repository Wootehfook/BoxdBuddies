-- BoxdBuddies Enhanced Database Schema
-- Extensions for watchlist and movie caching

-- Current tables (already implemented):
-- friends: stores friend information
-- sync_info: tracks sync status

-- New tables for enhanced caching:

-- 1. Watchlist caching per friend
CREATE TABLE IF NOT EXISTS friend_watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    friend_username TEXT NOT NULL,
    movie_title TEXT NOT NULL,
    movie_year INTEGER,
    letterboxd_slug TEXT, -- e.g., "the-matrix-1999"
    tmdb_id INTEGER,
    date_added TEXT, -- When user added to their watchlist
    last_updated TEXT NOT NULL, -- When we cached this data
    FOREIGN KEY (friend_username) REFERENCES friends(username),
    UNIQUE(friend_username, letterboxd_slug)
);

-- 2. TMDB movie data cache
CREATE TABLE IF NOT EXISTS tmdb_movies (
    tmdb_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    original_title TEXT,
    release_date TEXT,
    year INTEGER,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    vote_average REAL,
    vote_count INTEGER,
    popularity REAL,
    genre_ids TEXT, -- JSON array as string
    runtime INTEGER,
    budget INTEGER,
    revenue INTEGER,
    original_language TEXT,
    last_updated TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 3. Letterboxd to TMDB mapping cache
CREATE TABLE IF NOT EXISTS letterboxd_tmdb_mapping (
    letterboxd_slug TEXT PRIMARY KEY,
    tmdb_id INTEGER,
    title TEXT NOT NULL,
    year INTEGER,
    confidence_score REAL, -- How confident we are in this mapping (0.0-1.0)
    last_verified TEXT NOT NULL,
    FOREIGN KEY (tmdb_id) REFERENCES tmdb_movies(tmdb_id)
);

-- 4. Watchlist sync tracking per friend
CREATE TABLE IF NOT EXISTS friend_sync_status (
    friend_username TEXT PRIMARY KEY,
    last_watchlist_sync TEXT,
    watchlist_count INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'failed'
    last_error TEXT,
    FOREIGN KEY (friend_username) REFERENCES friends(username)
);

-- 5. Comparison results cache
CREATE TABLE IF NOT EXISTS comparison_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    main_username TEXT NOT NULL,
    friend_usernames TEXT NOT NULL, -- JSON array as string
    result_data TEXT NOT NULL, -- JSON result as string
    created_at TEXT NOT NULL,
    accessed_at TEXT NOT NULL, -- For LRU cleanup
    UNIQUE(main_username, friend_usernames)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_watchlists_username ON friend_watchlists(friend_username);
CREATE INDEX IF NOT EXISTS idx_friend_watchlists_tmdb ON friend_watchlists(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_tmdb_movies_title_year ON tmdb_movies(title, year);
CREATE INDEX IF NOT EXISTS idx_letterboxd_mapping_title_year ON letterboxd_tmdb_mapping(title, year);
CREATE INDEX IF NOT EXISTS idx_comparison_cache_main_user ON comparison_cache(main_username);
CREATE INDEX IF NOT EXISTS idx_comparison_cache_accessed ON comparison_cache(accessed_at);

-- Data retention and cleanup policies
-- Movies older than 30 days should be re-verified
-- Watchlists older than 7 days should be re-synced
-- Comparison cache older than 24 hours should be refreshed
-- TMDB data older than 30 days should be updated
