/*
 * Database helpers extracted from main.rs
 * AI Generated: GitHub Copilot - 2025-08-11
 */
use rusqlite::{Connection, Result as SqliteResult};
use std::fs;
use std::path::PathBuf;

pub fn get_database_path() -> Result<PathBuf, String> {
    let mut dir = tauri::api::path::data_dir().ok_or("Failed to get data dir")?;
    dir.push("BoxdBuddies");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create data dir: {e}"))?;
    dir.push("boxdbuddies.db");
    Ok(dir)
}

// AI Generated: GitHub Copilot - 2025-08-11
pub fn get_app_data_dir() -> Result<PathBuf, String> {
    let mut dir = tauri::api::path::data_dir().ok_or("Failed to get data dir")?;
    dir.push("BoxdBuddies");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create data dir: {e}"))?;
    Ok(dir)
}

pub fn init_database() -> SqliteResult<Connection> {
    let db_path = get_database_path().map_err(|e| rusqlite::Error::InvalidPath(e.into()))?;
    let conn = Connection::open(&db_path)?;
    // AI Generated: GitHub Copilot - 2025-08-11
    // Clippy: remove needless borrow for generic args
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS friends (
            username TEXT PRIMARY KEY,
            display_name TEXT,
            avatar_url TEXT,
            last_updated TEXT
        );
        CREATE TABLE IF NOT EXISTS friend_watchlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            friend_username TEXT NOT NULL,
            movie_title TEXT NOT NULL,
            movie_year TEXT,
            letterboxd_slug TEXT,
            tmdb_id INTEGER,
            date_added TEXT,
            last_updated TEXT,
            FOREIGN KEY(friend_username) REFERENCES friends(username)
        );
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
            runtime INTEGER,
            budget INTEGER,
            revenue INTEGER,
            original_language TEXT,
            director TEXT,
            last_updated TEXT,
            created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS letterboxd_tmdb_mapping (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year INTEGER,
            tmdb_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sync_info (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_sync_date TEXT,
            friends_count INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS comparison_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            main_username TEXT NOT NULL,
            friend_usernames TEXT NOT NULL,
            result_json TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            accessed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_friend_watchlists_username ON friend_watchlists(friend_username);
        CREATE INDEX IF NOT EXISTS idx_friend_watchlists_tmdb ON friend_watchlists(tmdb_id);
        CREATE INDEX IF NOT EXISTS idx_tmdb_movies_title_year ON tmdb_movies(title, year);
        CREATE INDEX IF NOT EXISTS idx_letterboxd_mapping_title_year ON letterboxd_tmdb_mapping(title, year);
        CREATE INDEX IF NOT EXISTS idx_comparison_cache_main_user ON comparison_cache(main_username);
        CREATE INDEX IF NOT EXISTS idx_comparison_cache_accessed ON comparison_cache(accessed_at);
        "#,
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO sync_info (id, friends_count) VALUES (1, 0)",
        [],
    )?;
    Ok(conn)
}

// (Removed unused touch_sync_info function)
