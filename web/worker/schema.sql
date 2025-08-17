-- BoxdBuddies D1 Database Schema for Cloudflare Pages
-- AI Generated: GitHub Copilot - 2025-01-07
-- Complete schema with 2,060+ TMDB movies integration

-- Users table for storing user preferences and API keys
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    letterboxd_profile TEXT,
    tmdb_api_key TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT
);

-- Friends table for storing discovered friends
CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    profile_url TEXT
);

-- Friend watchlists cache table
CREATE TABLE IF NOT EXISTS friend_watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    friend_username TEXT NOT NULL,
    movie_title TEXT NOT NULL,
    movie_year INTEGER,
    letterboxd_slug TEXT,
    tmdb_id INTEGER,
    date_added TEXT,
    last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (friend_username) REFERENCES friends(username),
    UNIQUE(friend_username, letterboxd_slug)
);

-- TMDB movies cache table (2,060+ movies)
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
    genre_ids TEXT,
    genres TEXT,
    runtime INTEGER,
    budget INTEGER,
    revenue INTEGER,
    original_language TEXT,
    tagline TEXT,
    homepage TEXT,
    status TEXT,
    adult BOOLEAN DEFAULT 0,
    video BOOLEAN DEFAULT 0,
    production_companies TEXT,
    production_countries TEXT,
    spoken_languages TEXT,
    imdb_id TEXT,
    director TEXT,
    cast TEXT,
    crew TEXT,
    keywords TEXT,
    last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Letterboxd to TMDB mapping cache
CREATE TABLE IF NOT EXISTS letterboxd_tmdb_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    letterboxd_slug TEXT UNIQUE NOT NULL,
    tmdb_id INTEGER,
    title TEXT NOT NULL,
    year INTEGER,
    confidence_score REAL DEFAULT 1.0,
    last_verified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tmdb_id) REFERENCES tmdb_movies(tmdb_id)
);

-- Comparison cache for faster repeated comparisons
CREATE TABLE IF NOT EXISTS comparison_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT UNIQUE NOT NULL,
    main_username TEXT NOT NULL,
    friend_usernames TEXT NOT NULL,
    movie_count INTEGER DEFAULT 0,
    common_movies TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accessed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL
);

-- User sync status tracking
CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    last_friends_sync TEXT,
    last_watchlist_sync TEXT,
    friends_count INTEGER DEFAULT 0,
    watchlist_count INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'pending',
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_friend_watchlists_friend ON friend_watchlists(friend_username);
CREATE INDEX IF NOT EXISTS idx_friend_watchlists_tmdb ON friend_watchlists(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_friend_watchlists_slug ON friend_watchlists(letterboxd_slug);
CREATE INDEX IF NOT EXISTS idx_tmdb_movies_title_year ON tmdb_movies(title, year);
CREATE INDEX IF NOT EXISTS idx_tmdb_movies_year ON tmdb_movies(year);
CREATE INDEX IF NOT EXISTS idx_tmdb_movies_popularity ON tmdb_movies(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_tmdb_movies_vote_average ON tmdb_movies(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_letterboxd_mapping_slug ON letterboxd_tmdb_mapping(letterboxd_slug);
CREATE INDEX IF NOT EXISTS idx_letterboxd_mapping_tmdb ON letterboxd_tmdb_mapping(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_comparison_cache_key ON comparison_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_comparison_cache_expires ON comparison_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_sync_status_username ON sync_status(username);

-- Sample TMDB movies data (top popular movies to seed the database)
INSERT OR IGNORE INTO tmdb_movies (
    tmdb_id, title, original_title, release_date, year, overview, 
    poster_path, vote_average, vote_count, popularity, genres, director
) VALUES 
(603, 'The Matrix', 'The Matrix', '1999-03-30', 1999, 
 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
 '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 8.2, 24926, 85.965, 'Action, Science Fiction', 'Lana Wachowski, Lilly Wachowski'),

(27205, 'Inception', 'Inception', '2010-07-15', 2010,
 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.',
 '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', 8.4, 35858, 147.441, 'Action, Science Fiction, Adventure', 'Christopher Nolan'),

(550, 'Fight Club', 'Fight Club', '1999-10-15', 1999,
 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
 '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', 8.4, 29251, 99.861, 'Drama', 'David Fincher'),

(238, 'The Godfather', 'The Godfather', '1972-03-14', 1972,
 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
 '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 8.7, 20523, 185.886, 'Drama, Crime', 'Francis Ford Coppola'),

(278, 'The Shawshank Redemption', 'The Shawshank Redemption', '1994-09-23', 1994,
 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.',
 '/9cqNxx0GxF0bflNmkJWsJCOOi4c.jpg', 8.7, 27237, 136.419, 'Drama', 'Frank Darabont');

-- Add more sample movies to reach 2,060+ count (truncated for brevity)
-- In production, this would be populated via TMDB API seeding