/*
 * Database helpers - unified with main.rs schema
 * AI Generated: GitHub Copilot - 2025-08-13
 */
use rusqlite::{Connection, Result as SqliteResult};
use std::fs;
use std::path::PathBuf;

// AI Generated: GitHub Copilot - 2025-08-14
pub fn get_app_data_dir() -> Result<PathBuf, String> {
    // Determine candidate base directories (config then data) to maximize compatibility
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(cfg) = dirs::config_dir() {
        candidates.push(cfg);
    }
    if let Some(dat) = dirs::data_dir() {
        candidates.push(dat);
    }

    // Build folder candidates in priority order
    // 1) Legacy name under config (BoxdBuddies)
    // 2) New name under config (BoxdBuddy)
    // 3) Legacy name under data
    // 4) New name under data
    let mut folder_candidates: Vec<PathBuf> = Vec::new();
    for base in &candidates {
        folder_candidates.push(base.join("BoxdBuddies"));
        folder_candidates.push(base.join("BoxdBuddy"));
    }

    // Choose first existing folder; otherwise create the first preferred new path (config/BoxdBuddy)
    if let Some(existing) = folder_candidates.iter().find(|p| p.exists()) {
        return Ok(existing.clone());
    }

    // Fall back to config/BoxdBuddy (or first available base)
    let base = candidates
        .into_iter()
        .next()
        .ok_or("Could not find a suitable base directory")?;
    let target = base.join("BoxdBuddy");
    if !target.exists() {
        fs::create_dir_all(&target).map_err(|e| format!("Failed to create data dir: {e}"))?;
    }
    Ok(target)
}

// AI Generated: GitHub Copilot - 2025-08-14
pub fn get_database_path() -> Result<PathBuf, String> {
    // Keep legacy filename to avoid breaking existing installs.
    // If a newer friends.db exists, migrate it back to the legacy name.
    let dir = get_app_data_dir()?;
    let legacy = dir.join("boxdbuddies.db");
    let newer = dir.join("friends.db");
    if newer.exists() && !legacy.exists() {
        if let Err(e) = fs::rename(&newer, &legacy) {
            return Err(format!("Failed to migrate database filename: {e}"));
        }
    }
    Ok(legacy)
}

fn migrate_add_director_column(conn: &Connection) -> SqliteResult<()> {
    let mut has_director = false;
    let mut stmt = conn.prepare("PRAGMA table_info(tmdb_movies)")?;
    let columns = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(1)?, row.get::<_, String>(2)?))
    })?;
    for col in columns {
        let (name, _ty) = col?;
        if name == "director" {
            has_director = true;
            break;
        }
    }
    if !has_director {
        conn.execute("ALTER TABLE tmdb_movies ADD COLUMN director TEXT", [])?;
    }
    Ok(())
}

pub fn init_database() -> SqliteResult<Connection> {
    let db_path = get_database_path().map_err(|e| rusqlite::Error::InvalidPath(e.into()))?;
    let conn = Connection::open(&db_path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;

    // Schema aligned with main.rs
    conn.execute(
        "CREATE TABLE IF NOT EXISTS friends (
            username TEXT PRIMARY KEY,
            display_name TEXT,
            avatar_url TEXT,
            last_updated TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_info (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_sync_date TEXT,
            friends_count INTEGER DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS friend_watchlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            friend_username TEXT NOT NULL,
            movie_title TEXT NOT NULL,
            movie_year INTEGER,
            letterboxd_slug TEXT,
            tmdb_id INTEGER,
            date_added TEXT,
            last_updated TEXT NOT NULL,
            FOREIGN KEY (friend_username) REFERENCES friends(username),
            UNIQUE(friend_username, letterboxd_slug)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tmdb_movies (
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
            last_updated TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS letterboxd_tmdb_mapping (
            letterboxd_slug TEXT PRIMARY KEY,
            tmdb_id INTEGER,
            title TEXT NOT NULL,
            year INTEGER,
            confidence_score REAL,
            last_verified TEXT NOT NULL,
            FOREIGN KEY (tmdb_id) REFERENCES tmdb_movies(tmdb_id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS friend_sync_status (
            friend_username TEXT PRIMARY KEY,
            last_watchlist_sync TEXT,
            watchlist_count INTEGER DEFAULT 0,
            sync_status TEXT DEFAULT 'pending',
            last_error TEXT,
            FOREIGN KEY (friend_username) REFERENCES friends(username)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS comparison_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            main_username TEXT NOT NULL,
            friend_usernames TEXT NOT NULL,
            result_data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            accessed_at TEXT NOT NULL,
            UNIQUE(main_username, friend_usernames)
        )",
        [],
    )?;

    // Indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_friend_watchlists_username ON friend_watchlists(friend_username)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_friend_watchlists_tmdb ON friend_watchlists(tmdb_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tmdb_movies_title_year ON tmdb_movies(title, year)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_letterboxd_mapping_title_year ON letterboxd_tmdb_mapping(title, year)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_comparison_cache_main_user ON comparison_cache(main_username)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_comparison_cache_accessed ON comparison_cache(accessed_at)",
        [],
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO sync_info (id, friends_count) VALUES (1, 0)",
        [],
    )?;

    // Migration for older DBs missing director column
    migrate_add_director_column(&conn)?;

    Ok(conn)
}

// (End unified DB helpers)
