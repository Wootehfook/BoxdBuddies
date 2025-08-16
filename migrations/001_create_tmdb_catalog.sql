-- AI Generated: GitHub Copilot - 2025-08-16

-- TMDB Movie Catalog (server-side only)
CREATE TABLE IF NOT EXISTS tmdb_movies (
    id INTEGER PRIMARY KEY,
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
    adult BOOLEAN DEFAULT 0,
    genres TEXT, -- JSON array
    director TEXT,
    runtime INTEGER,
    status TEXT,
    tagline TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_title ON tmdb_movies(title);
CREATE INDEX IF NOT EXISTS idx_year ON tmdb_movies(year);
CREATE INDEX IF NOT EXISTS idx_popularity ON tmdb_movies(popularity DESC);

-- User session management
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_data TEXT -- JSON with preferences
);

CREATE INDEX IF NOT EXISTS idx_username ON user_sessions(username);
CREATE INDEX IF NOT EXISTS idx_last_active ON user_sessions(last_active);

-- Cached Letterboxd data
CREATE TABLE IF NOT EXISTS letterboxd_cache (
    cache_key TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    data_type TEXT NOT NULL, -- 'watchlist', 'friends', 'profile'
    data TEXT NOT NULL, -- JSON data
    item_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_type ON letterboxd_cache(username, data_type);
CREATE INDEX IF NOT EXISTS idx_expires ON letterboxd_cache(expires_at);

-- Sync metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);