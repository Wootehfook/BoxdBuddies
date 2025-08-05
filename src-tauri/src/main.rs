/*
 * BoxdBuddies - Compare Letterboxd watchlists with friends
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

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Utc;
use rusqlite::{Connection, Result as SqliteResult};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::{command, Manager};
// AI Generated: GitHub Copilot - 2025-08-03
// Debug flag to control verbose logging - set to false for production builds
const DEBUG_LOGGING: bool = false;

// Macro for conditional debug logging
macro_rules! debug_log {
    ($($arg:tt)*) => {
        if DEBUG_LOGGING {
            println!($($arg)*);
        }
    };
}

// AI Generated: GitHub Copilot - 2025-08-02
fn safe_parse_year_from_date(date_str: &str) -> Option<i32> {
    if date_str.len() >= 4 {
        date_str[0..4].parse::<i32>().ok()
    } else {
        None
    }
}

// AI Generated: GitHub Copilot - 2025-08-02
fn safe_parse_year_from_date_u32(date_str: &str) -> Option<u32> {
    if date_str.len() >= 4 {
        date_str[0..4].parse::<u32>().ok()
    } else {
        None
    }
}

// Debug logging to workspace file
fn log_debug(message: &str) {
    // Use proper app data directory for log files, not current directory
    let log_file_path = match get_app_data_dir() {
        Ok(dir) => dir.join("debug.log"),
        Err(_) => {
            // Fallback to temp directory if app data dir fails
            std::env::temp_dir().join("BoxdBuddies_debug.log")
        }
    };

    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    let log_entry = format!("[{timestamp}] {message}\n");

    // Print sanitized message to console (no sensitive data)
    let console_time = chrono::Local::now().format("%H:%M:%S");
    println!("[{console_time}] Application log entry created");

    // Write to log file
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
    {
        let _ = file.write_all(log_entry.as_bytes());
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct LetterboxdUser {
    username: String,
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    #[serde(rename = "avatarUrl")]
    avatar_url: Option<String>,
    #[serde(rename = "followersCount")]
    followers_count: Option<u32>,
    #[serde(rename = "followingCount")]
    following_count: Option<u32>,
    #[serde(rename = "filmsCount")]
    films_count: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct LetterboxdFriend {
    username: String,
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    #[serde(rename = "avatarUrl")]
    avatar_url: Option<String>,
    #[serde(rename = "isSelected")]
    is_selected: bool,
    #[serde(rename = "lastSynced")]
    last_synced: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Movie {
    id: u32,
    title: String,
    year: u32,
    #[serde(rename = "posterPath")]
    poster_path: Option<String>,
    overview: Option<String>,
    rating: Option<f64>,
    #[serde(rename = "friendCount")]
    friend_count: u32,
    #[serde(rename = "friendVisual")]
    friend_visual: String,
    #[serde(rename = "friendList")]
    friend_list: Vec<String>,
    genre: Option<String>,
    director: Option<String>,

    #[serde(rename = "averageRating")]
    average_rating: Option<f64>,

    #[serde(rename = "letterboxdSlug")]
    letterboxd_slug: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CompareResult {
    #[serde(rename = "commonMovies")]
    common_movies: Vec<Movie>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct CachedWatchlistMovie {
    id: Option<i64>,
    friend_username: String,
    movie_title: String,
    movie_year: Option<i32>,
    letterboxd_slug: Option<String>,
    tmdb_id: Option<i32>,
    date_added: Option<String>,
    last_updated: String,
}

// AI Generated: GitHub Copilot - 2025-08-02
// TMDB API response structures
#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbSearchResult {
    id: i32,
    title: String,
    original_title: String,
    overview: String,
    release_date: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    vote_average: Option<f64>,
    vote_count: i32,
    popularity: f64,
    genre_ids: Vec<i32>,
    original_language: String,
    adult: bool,
    video: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbSearchResponse {
    page: i32,
    results: Vec<TmdbSearchResult>,
    total_pages: i32,
    total_results: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbGenre {
    id: i32,
    name: String,
}

// AI Generated: GitHub Copilot - 2025-08-02
#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbCredits {
    id: i32,
    cast: Vec<TmdbCastMember>,
    crew: Vec<TmdbCrewMember>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbCastMember {
    id: i32,
    name: String,
    character: String,
    order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbCrewMember {
    id: i32,
    name: String,
    job: String,
    department: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbMovieDetails {
    id: i32,
    title: String,
    original_title: String,
    overview: String,
    release_date: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    vote_average: Option<f64>,
    vote_count: i32,
    popularity: f64,
    runtime: Option<i32>,
    budget: Option<i64>,
    revenue: Option<i64>,
    genres: Vec<TmdbGenre>,
    original_language: String,
    status: String,
    tagline: Option<String>,
    director: Option<String>, // AI Generated: GitHub Copilot - 2025-01-27
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TmdbMovieCache {
    tmdb_id: i32,
    title: String,
    original_title: Option<String>,
    release_date: Option<String>,
    year: Option<i32>,
    overview: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    vote_average: Option<f64>,
    vote_count: Option<i32>,
    popularity: Option<f64>,
    genre_ids: Option<String>,
    runtime: Option<i32>,
    budget: Option<i64>,
    revenue: Option<i64>,
    original_language: Option<String>,
    director: Option<String>,
    last_updated: String,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct FriendSyncStatus {
    friend_username: String,
    last_watchlist_sync: Option<String>,
    watchlist_count: i32,
    sync_status: String,
    last_error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct UserPreferences {
    username: Option<String>,
    tmdb_api_key: Option<String>,
    window_x: Option<i32>,
    window_y: Option<i32>,
    window_width: Option<u32>,
    window_height: Option<u32>,
    always_on_top: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SyncInfo {
    #[serde(rename = "lastSyncDate")]
    last_sync_date: Option<String>,
    #[serde(rename = "friendsCount")]
    friends_count: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct DatabaseFriend {
    username: String,
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    #[serde(rename = "avatarUrl")]
    avatar_url: Option<String>,
    #[serde(rename = "lastUpdated")]
    last_updated: String,
}

fn get_app_data_dir() -> Result<PathBuf, String> {
    let app_data_dir = dirs::config_dir().ok_or("Could not find config directory")?;

    let boxd_dir = app_data_dir.join("BoxdBuddies");

    // Create directory if it doesn't exist
    if !boxd_dir.exists() {
        fs::create_dir_all(&boxd_dir)
            .map_err(|e| format!("Failed to create config directory: {e}"))?;
    }

    Ok(boxd_dir)
}

fn get_preferences_path() -> Result<PathBuf, String> {
    let boxd_dir = get_app_data_dir()?;
    Ok(boxd_dir.join("preferences.json"))
}

fn get_database_path() -> Result<PathBuf, String> {
    let boxd_dir = get_app_data_dir()?;
    Ok(boxd_dir.join("friends.db"))
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveUserPreferencesRequest {
    username: String,
    tmdb_api_key: String,
    always_on_top: Option<bool>,
}

#[command]
async fn save_user_preferences(request: SaveUserPreferencesRequest) -> Result<(), String> {
    log_debug(&format!(
        "🔧 SAVE_USER_PREFERENCES: Called with username='{}', tmdb_api_key='{}'",
        request.username.trim(),
        request.tmdb_api_key.trim()
    ));

    let preferences = UserPreferences {
        username: if request.username.trim().is_empty() {
            None
        } else {
            Some(request.username)
        },
        tmdb_api_key: if request.tmdb_api_key.trim().is_empty() {
            None
        } else {
            Some(request.tmdb_api_key)
        },
        window_x: None,
        window_y: None,
        window_width: None,
        window_height: None,
        always_on_top: request.always_on_top,
    };

    log_debug("🔧 SAVE_USER_PREFERENCES: Attempting to get preferences path...");
    let preferences_path = get_preferences_path()?;
    log_debug(&format!(
        "🔧 SAVE_USER_PREFERENCES: Preferences path: {preferences_path:?}"
    ));

    let json_data = serde_json::to_string_pretty(&preferences)
        .map_err(|e| format!("Failed to serialize preferences: {e}"))?;
    log_debug(&format!(
        "🔧 SAVE_USER_PREFERENCES: Serialized preferences: {json_data}"
    ));

    fs::write(&preferences_path, json_data)
        .map_err(|e| format!("Failed to write preferences file: {e}"))?;

    log_debug(&format!(
        "🔧 SAVE_USER_PREFERENCES: SUCCESS - Saved user preferences to: {preferences_path:?}"
    ));
    Ok(())
}

#[command]
async fn load_user_preferences() -> Result<UserPreferences, String> {
    let preferences_path = get_preferences_path()?;

    if !preferences_path.exists() {
        return Ok(UserPreferences::default());
    }

    let json_data = fs::read_to_string(&preferences_path)
        .map_err(|e| format!("Failed to read preferences file: {e}"))?;

    let preferences: UserPreferences = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to parse preferences file: {e}"))?;

    // AI Generated: GitHub Copilot - 2025-08-02 - Removed verbose logging to prevent spam
    Ok(preferences)
}

// AI Generated: GitHub Copilot - 2025-08-01
#[command]
async fn save_window_position(x: i32, y: i32, width: u32, height: u32) -> Result<(), String> {
    let mut preferences = load_user_preferences().await.unwrap_or_default();
    preferences.window_x = Some(x);
    preferences.window_y = Some(y);
    preferences.window_width = Some(width);
    preferences.window_height = Some(height);

    let preferences_path = get_preferences_path()?;
    let json_data = serde_json::to_string_pretty(&preferences)
        .map_err(|e| format!("Failed to serialize preferences: {e}"))?;

    fs::write(&preferences_path, json_data)
        .map_err(|e| format!("Failed to write preferences file: {e}"))?;

    // AI Generated: GitHub Copilot - 2025-08-02 - Reduced logging verbosity
    debug_log!(
        "💾 Window position saved: {}x{} at ({},{})",
        width,
        height,
        x,
        y
    );
    Ok(())
}

// AI Generated: GitHub Copilot - 2025-08-01
#[command]
async fn get_saved_window_position() -> Result<Option<(i32, i32, u32, u32)>, String> {
    let preferences = load_user_preferences().await?;

    if let (Some(x), Some(y), Some(width), Some(height)) = (
        preferences.window_x,
        preferences.window_y,
        preferences.window_width,
        preferences.window_height,
    ) {
        debug_log!(
            "Retrieved saved window position: x={}, y={}, width={}, height={}",
            x,
            y,
            width,
            height
        );
        Ok(Some((x, y, width, height)))
    } else {
        debug_log!("No saved window position found");
        Ok(None)
    }
}

// AI Generated: GitHub Copilot - 2025-08-01
#[command]
async fn set_always_on_top(
    app_handle: tauri::AppHandle,
    always_on_top: bool,
) -> Result<(), String> {
    debug_log!("🪟 Setting always on top: {}", always_on_top);

    if let Some(window) = app_handle.get_window("main") {
        match window.set_always_on_top(always_on_top) {
            Ok(_) => {
                debug_log!("🪟 Always on top set successfully: {}", always_on_top);
                Ok(())
            }
            Err(e) => {
                // On Linux, always-on-top might not be supported by the window manager
                // Log the error but don't fail completely
                eprintln!(
                    "⚠️ Could not set always on top (this is normal on some Linux systems): {e}"
                );

                // Try to request user attention as an alternative
                if always_on_top {
                    let _ = window
                        .request_user_attention(Some(tauri::UserAttentionType::Informational));
                }

                // Return success even if always-on-top failed (graceful degradation)
                Ok(())
            }
        }
    } else {
        Err("Main window not found".to_string())
    }
}

#[tauri::command]
async fn set_window_focus(app_handle: tauri::AppHandle) -> Result<(), String> {
    debug_log!("🪟 Setting window focus");

    if let Some(window) = app_handle.get_window("main") {
        // Request focus and bring to front
        window
            .set_focus()
            .map_err(|e| format!("Failed to set focus: {e}"))?;

        // Request user attention to bring window to front
        window
            .request_user_attention(Some(tauri::UserAttentionType::Critical))
            .map_err(|e| format!("Failed to request attention: {e}"))?;

        debug_log!("🪟 Window focus set successfully");
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

// AI Generated: GitHub Copilot - 2025-01-27
fn migrate_add_director_column(conn: &Connection) -> SqliteResult<()> {
    // Check if director column already exists
    let mut stmt = conn.prepare("PRAGMA table_info(tmdb_movies)")?;
    let column_iter = stmt.query_map([], |row| {
        row.get::<_, String>(1) // Column name is at index 1
    })?;

    let mut has_director = false;
    for column in column_iter {
        if column? == "director" {
            has_director = true;
            break;
        }
    }

    // Add director column if it doesn't exist
    if !has_director {
        println!("🔄 DATABASE MIGRATION: Adding director column to tmdb_movies table");
        conn.execute("ALTER TABLE tmdb_movies ADD COLUMN director TEXT", [])?;
        println!("✅ DATABASE MIGRATION: Director column added successfully");
    }

    Ok(())
}

fn init_database() -> SqliteResult<Connection> {
    let db_path = get_database_path().map_err(|e| {
        rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CANTOPEN),
            Some(e),
        )
    })?;

    let conn = Connection::open(db_path)?;

    // Create tables
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

    // New caching tables for enhanced performance
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

    // Add migration to handle director column for existing databases
    // AI Generated: GitHub Copilot - 2025-01-27
    migrate_add_director_column(&conn)?;

    // Create indexes for performance
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

    // Initialize sync_info if it doesn't exist
    conn.execute(
        "INSERT OR IGNORE INTO sync_info (id, friends_count) VALUES (1, 0)",
        [],
    )?;

    Ok(conn)
}

#[command]
async fn get_sync_info() -> Result<SyncInfo, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;

    let mut stmt = conn
        .prepare("SELECT last_sync_date, friends_count FROM sync_info WHERE id = 1")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;

    let sync_info = stmt
        .query_row([], |row| {
            Ok(SyncInfo {
                last_sync_date: row.get::<_, Option<String>>(0)?,
                friends_count: row.get::<_, u32>(1)?,
            })
        })
        .map_err(|e| format!("Failed to get sync info: {e}"))?;

    Ok(sync_info)
}

#[command]
async fn get_friends_from_database(
    main_username: Option<String>,
) -> Result<Vec<LetterboxdFriend>, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;

    let mut stmt = conn.prepare("SELECT username, display_name, avatar_url, last_updated FROM friends ORDER BY username")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;

    let friends_iter = stmt
        .query_map([], |row| {
            Ok(LetterboxdFriend {
                username: row.get(0)?,
                display_name: row.get(1)?,
                avatar_url: row.get(2)?,
                is_selected: false,
                last_synced: row.get::<_, Option<String>>(3)?,
            })
        })
        .map_err(|e| format!("Failed to query friends: {e}"))?;

    let mut friends = Vec::new();
    for friend_result in friends_iter {
        let friend = friend_result.map_err(|e| format!("Failed to process friend: {e}"))?;

        // Filter out the main user if provided
        if let Some(ref main_user) = main_username {
            if friend.username.to_lowercase() == main_user.to_lowercase() {
                // Comment out debug logging for production
                // println!("🚫 Filtering out main user '{}' from friends list", friend.username);
                continue;
            }
        }

        friends.push(friend);
    }

    // println!("📋 Loaded {} friends from database (excluding main user)", friends.len());
    Ok(friends)
}

#[command]
async fn get_friends_with_watchlist_counts() -> Result<Vec<serde_json::Value>, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;

    let mut stmt = conn
        .prepare(
            "SELECT f.username, f.display_name, f.avatar_url, f.last_updated,
                COUNT(fw.id) as watchlist_count
         FROM friends f
         LEFT JOIN friend_watchlists fw ON f.username = fw.friend_username
         GROUP BY f.username, f.display_name, f.avatar_url, f.last_updated
         ORDER BY f.username",
        )
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;

    let friends_iter = stmt
        .query_map([], |row| {
            let watchlist_count: i64 = row.get(4).unwrap_or(0);
            Ok(serde_json::json!({
                "username": row.get::<_, String>(0)?,
                "displayName": row.get::<_, Option<String>>(1)?,
                "avatarUrl": row.get::<_, Option<String>>(2)?,
                "lastSynced": row.get::<_, Option<String>>(3)?,
                "watchlistCount": watchlist_count as u32
            }))
        })
        .map_err(|e| format!("Failed to query friends: {e}"))?;

    let mut friends = Vec::new();
    for friend_result in friends_iter {
        let friend = friend_result.map_err(|e| format!("Failed to process friend: {e}"))?;
        friends.push(friend);
    }

    // println!("📋 Loaded {} friends with watchlist counts", friends.len());
    Ok(friends)
}

#[command]
async fn save_friends_to_database(friends: Vec<LetterboxdFriend>) -> Result<(), String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;

    // Begin transaction
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| format!("Failed to begin transaction: {e}"))?;

    // Use INSERT OR REPLACE to update existing friends and add new ones
    let mut stmt = tx.prepare("INSERT OR REPLACE INTO friends (username, display_name, avatar_url, last_updated) VALUES (?1, ?2, ?3, ?4)")
        .map_err(|e| format!("Failed to prepare insert statement: {e}"))?;

    let now = Utc::now().to_rfc3339();
    let friends_count = friends.len();

    for friend in friends {
        stmt.execute([
            friend.username.as_str(),
            friend.display_name.as_deref().unwrap_or(""),
            friend.avatar_url.as_deref().unwrap_or(""),
            &now,
        ])
        .map_err(|e| format!("Failed to insert friend: {e}"))?;
    }

    // Drop the statement to release borrow
    drop(stmt);

    // Update sync info
    tx.execute(
        "UPDATE sync_info SET last_sync_date = ?1, friends_count = ?2 WHERE id = 1",
        [&now, &friends_count.to_string()],
    )
    .map_err(|e| format!("Failed to update sync info: {e}"))?;

    // Commit transaction
    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {e}"))?;

    Ok(())
}

// Cache management functions
#[command]
async fn get_cached_watchlist(
    friend_username: String,
) -> Result<Vec<CachedWatchlistMovie>, String> {
    // println!("🔥 CACHE LOAD: get_cached_watchlist called for user: {friend_username}");
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    // println!("🔥 CACHE LOAD: Database connection successful");

    let mut stmt = conn.prepare(
        "SELECT id, friend_username, movie_title, movie_year, letterboxd_slug, tmdb_id, date_added, last_updated 
         FROM friend_watchlists 
         WHERE friend_username = ?1 
         ORDER BY last_updated DESC"
    ).map_err(|e| format!("Failed to prepare statement: {e}"))?;
    // println!("🔥 CACHE LOAD: SQL statement prepared");

    let watchlist_iter = stmt
        .query_map([friend_username], |row| {
            // Handle movie_year which might be stored as TEXT but we need as integer
            let movie_year: Option<i32> = match row.get::<_, Option<String>>(3)? {
                Some(year_str) => year_str.parse().ok(),
                None => None,
            };

            Ok(CachedWatchlistMovie {
                id: row.get(0)?,
                friend_username: row.get(1)?,
                movie_title: row.get(2)?,
                movie_year,
                letterboxd_slug: row.get(4)?,
                tmdb_id: row.get(5)?,
                date_added: row.get(6)?,
                last_updated: row.get(7)?,
            })
        })
        .map_err(|e| format!("Failed to query watchlist: {e}"))?;
    // println!("🔥 CACHE LOAD: Query executed successfully");

    let mut watchlist = Vec::new();
    let mut row_count = 0;
    // println!("🔥 CACHE LOAD: Starting to process rows...");

    for movie_result in watchlist_iter {
        row_count += 1;
        // if row_count % 50 == 0 {
        //     println!("🔥 CACHE LOAD: Processed {} rows so far...", row_count);
        // }

        match movie_result {
            Ok(movie) => {
                watchlist.push(movie);
            }
            Err(e) => {
                // Keep error logging for debugging issues
                eprintln!("Error processing cached movie row {row_count}: {e}");
                return Err(format!("Failed to process movie at row {row_count}: {e}"));
            }
        }

        // Safety limit to prevent infinite loops
        if row_count > 1000 {
            eprintln!("WARNING: Hit safety limit of 1000 rows while loading cache, stopping");
            break;
        }
    }
    // println!("🔥 CACHE LOAD: Found {watchlist.len()} cached movies (processed {row_count} rows)");

    Ok(watchlist)
}

#[command]
async fn save_watchlist_to_cache(
    friend_username: String,
    movies: Vec<WatchlistMovie>,
) -> Result<(), String> {
    // println!("🔥 FUNCTION ENTRY: save_watchlist_to_cache CALLED");
    // println!("🔥 Function parameters - username: {}, movies: {friend_username, movies.len(}"));
    // println!("🔥 About to initialize database connection...");

    // println!("=== SAVE WATCHLIST TO CACHE STARTED ===");
    // println!("Saving {} movies for {movies.len(}"), friend_username);

    // println!("🔥 Calling init_database()...");
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    // println!("🔥 Database connection successful!");
    let now = Utc::now().to_rfc3339();

    // Ensure the friend exists in the friends table first (required for foreign key)
    println!("🔥 CACHE SAVE: Ensuring friend exists in friends table...");
    {
        let friend_tx = conn
            .unchecked_transaction()
            .map_err(|e| format!("Failed to start friend transaction: {e}"))?;
        friend_tx.execute(
            "INSERT OR IGNORE INTO friends (username, display_name, last_updated) VALUES (?1, ?1, ?2)",
            [&friend_username, &now],
        ).map_err(|e| format!("Failed to ensure friend exists: {e}"))?;
        friend_tx
            .commit()
            .map_err(|e| format!("Failed to commit friend transaction: {e}"))?;
    }

    // Process in smaller batches to avoid hanging on large datasets
    const BATCH_SIZE: usize = 25;

    // Instead of clearing all data, use INSERT OR REPLACE to preserve existing movie details
    println!(
        "Upserting {} movies (preserving existing movie details)...",
        movies.len()
    );

    // First, get the list of current movie slugs in the new watchlist
    let new_slugs: std::collections::HashSet<&str> = movies
        .iter()
        .filter_map(|m| m.letterboxd_slug.as_deref())
        .collect();

    // Remove movies that are no longer in the watchlist
    if !new_slugs.is_empty() {
        let placeholders = new_slugs.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let delete_query = format!(
            "DELETE FROM friend_watchlists WHERE friend_username = ? AND letterboxd_slug NOT IN ({placeholders})"
        );

        let mut params: Vec<&dyn rusqlite::ToSql> = vec![&friend_username];
        for slug in &new_slugs {
            params.push(slug);
        }

        let deleted_count = conn
            .execute(&delete_query, params.as_slice())
            .map_err(|e| format!("Failed to remove old movies: {e}"))?;

        if deleted_count > 0 {
            println!("🗑️ Removed {deleted_count} movies no longer in watchlist");
        }
    }

    println!(
        "Inserting {} new movies in batches of {}...",
        movies.len(),
        BATCH_SIZE
    );

    // Process movies in batches
    for (batch_num, batch) in movies.chunks(BATCH_SIZE).enumerate() {
        let start_idx = batch_num * BATCH_SIZE;
        let end_idx = std::cmp::min(start_idx + BATCH_SIZE, movies.len());

        println!(
            "Processing batch {} (movies {}-{})...",
            batch_num + 1,
            start_idx + 1,
            end_idx
        );

        let batch_tx = conn
            .unchecked_transaction()
            .map_err(|e| format!("Failed to start batch transaction {}: {}", batch_num + 1, e))?;

        for (i, movie) in batch.iter().enumerate() {
            let global_idx = start_idx + i;

            if global_idx % 10 == 0 {
                println!(
                    "  Inserting movie {}/{}: '{}'",
                    global_idx + 1,
                    movies.len(),
                    movie.title
                );
            }

            batch_tx.execute(
                "INSERT OR REPLACE INTO friend_watchlists (friend_username, movie_title, movie_year, letterboxd_slug, last_updated) 
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                [
                    friend_username.as_str(),
                    movie.title.as_str(),
                    &movie.year.map(|y| y.to_string()).unwrap_or_default(),
                    movie.letterboxd_slug.as_deref().unwrap_or(""),
                    &now,
                ],
            ).map_err(|e| format!("Failed to insert movie '{}' (index {}): {}", movie.title, global_idx + 1, e))?;
        }

        println!("  Committing batch {}...", batch_num + 1);
        batch_tx
            .commit()
            .map_err(|e| format!("Failed to commit batch {}: {}", batch_num + 1, e))?;
        println!("  Batch {} committed successfully", batch_num + 1);
    }

    println!("All movies inserted successfully. Updating sync status...");

    // Update friend sync status in a separate transaction
    {
        let sync_tx = conn
            .unchecked_transaction()
            .map_err(|e| format!("Failed to start sync transaction: {e}"))?;
        sync_tx
            .execute(
                "INSERT OR REPLACE INTO friend_sync_status 
             (friend_username, last_watchlist_sync, watchlist_count, sync_status) 
             VALUES (?1, ?2, ?3, 'completed')",
                [&friend_username, &now, &movies.len().to_string()],
            )
            .map_err(|e| format!("Failed to update sync status: {e}"))?;
        sync_tx
            .commit()
            .map_err(|e| format!("Failed to commit sync transaction: {e}"))?;
    }

    println!("=== SAVE WATCHLIST TO CACHE COMPLETED ===");
    Ok(())
}

#[command]
async fn get_friend_sync_status(
    friend_username: String,
) -> Result<Option<FriendSyncStatus>, String> {
    // println!("🔥 SYNC STATUS: Getting sync status for {friend_username}");
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    // println!("🔥 SYNC STATUS: Database connected");

    let mut stmt = conn
        .prepare(
            "SELECT friend_username, last_watchlist_sync, watchlist_count, sync_status, last_error 
         FROM friend_sync_status 
         WHERE friend_username = ?1",
        )
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;
    // println!("🔥 SYNC STATUS: Statement prepared");

    let result = stmt.query_row([friend_username.clone()], |row| {
        Ok(FriendSyncStatus {
            friend_username: row.get(0)?,
            last_watchlist_sync: row.get(1)?,
            watchlist_count: row.get(2)?,
            sync_status: row.get(3)?,
            last_error: row.get(4)?,
        })
    });
    // println!("🔥 SYNC STATUS: Query executed");

    match result {
        Ok(status) => {
            // println!("🔥 SYNC STATUS: Found status for {friend_username}");
            Ok(Some(status))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            // println!("🔥 SYNC STATUS: No status found for {friend_username}");
            Ok(None)
        }
        Err(e) => {
            eprintln!("Error querying sync status for user: {e}");
            Err(format!("Failed to query sync status: {e}"))
        }
    }
}

#[command]
// AI Generated: GitHub Copilot - 2025-08-01
// Function to count watchlist movies in HTML using proper selectors
fn count_watchlist_movies_in_html(document: &Html) -> usize {
    // Use the same selectors as the main scraping function to get accurate counts
    let selectors = [
        "li.poster-container img[alt]", // Movie posters with alt text
        "div.film-poster img[alt]",     // Alternative poster format
        "ul.poster-list li img[alt]",   // Poster list items
    ];

    let mut total_count = 0;

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            let count = document.select(&selector).count();
            if count > 0 {
                total_count = count;
                break; // Use the first selector that finds movies
            }
        }
    }

    // Fallback: if no movies found with selectors, try counting film links in the main content area
    if total_count == 0 {
        if let Ok(content_selector) =
            Selector::parse(".film-list, .poster-list, .js-watchlist-content")
        {
            for content_element in document.select(&content_selector) {
                let content_html = content_element.html();
                total_count = content_html.matches("/film/").count();
                if total_count > 0 {
                    break;
                }
            }
        }
    }

    total_count
}

// AI Generated: GitHub Copilot - 2025-08-01
// Function to get current watchlist count from Letterboxd without full scraping
async fn get_letterboxd_watchlist_count(username: &str) -> Result<usize, String> {
    println!("🔥 COUNT CHECK: Getting current watchlist count from Letterboxd");

    // Validate username
    if username.trim().is_empty() || username.contains('/') || username.contains('\\') {
        return Err("Invalid username format".to_string());
    }

    // Create secure HTTP client with SSL verification
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(10))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    let url = format!("https://letterboxd.com/{username}/watchlist/");
    // Security: Log operation without exposing full URLs containing user data
    println!("🔥 COUNT CHECK: Fetching watchlist page");

    // Security Note: Username in URL is public Letterboxd profile identifier, not sensitive data
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch watchlist page: {e}"))?;

    if response.status() == 404 {
        return Err(format!("Watchlist not found for user '{username}'"));
    }

    if !response.status().is_success() {
        return Err(format!(
            "HTTP error {}: Failed to access watchlist",
            response.status()
        ));
    }

    let html_content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {e}"))?;

    // Parse HTML and count actual watchlist movies using proper selectors
    let film_count = {
        // Parse HTML in a blocking context to avoid Send issues
        let document = Html::parse_document(&html_content);
        count_watchlist_movies_in_html(&document)
    };
    println!("🔥 COUNT CHECK: Found {film_count} actual watchlist movies on page 1");

    // If we find close to 28 movies (typical page size), there might be more pages
    if film_count >= 25 {
        // Quick multi-page count - check a few more pages to get accurate count
        let mut total_count = film_count;
        let mut page = 2;

        while page <= 10 {
            // Check up to 10 pages for a reasonable estimate
            let page_url = format!("https://letterboxd.com/{username}/watchlist/page/{page}/");
            // Security Note: Username in URL is public Letterboxd profile identifier, not sensitive data
            match client.get(&page_url).send().await {
                Ok(page_response) if page_response.status().is_success() => {
                    match page_response.text().await {
                        Ok(page_html) => {
                            let page_film_count = {
                                let page_document = Html::parse_document(&page_html);
                                count_watchlist_movies_in_html(&page_document)
                            };
                            if page_film_count == 0 {
                                break; // No more movies
                            }
                            total_count += page_film_count;
                            page += 1;
                        }
                        Err(_) => break,
                    }
                }
                _ => break, // Stop on error or 404
            }
        }

        println!(
            "🔥 COUNT CHECK: Total estimated count after checking {} pages: {}",
            page - 1,
            total_count
        );
        Ok(total_count)
    } else {
        println!("🔥 COUNT CHECK: Single page watchlist with {film_count} movies");
        Ok(film_count)
    }
}

// AI Generated: GitHub Copilot - 2025-08-01
// Enhanced cache freshness check that also compares movie counts
async fn is_watchlist_cache_fresh_with_count_check(
    friend_username: String,
    max_age_hours: u64,
) -> Result<bool, String> {
    // println!("🔥 CACHE CHECK: Checking cache freshness with count verification for {friend_username} (max age: {max_age_hours} hours)");

    // First check basic time-based freshness
    match get_friend_sync_status(friend_username.clone()).await? {
        Some(status) => {
            debug_log!(
                "🔥 CACHE CHECK: Found sync status - status: {}, last_sync: {:?}",
                status.sync_status,
                status.last_watchlist_sync
            );

            if status.sync_status != "completed" {
                debug_log!("🔥 CACHE CHECK: Sync status not completed, cache not fresh");
                return Ok(false);
            }

            if let Some(last_sync) = status.last_watchlist_sync {
                let last_sync_time = chrono::DateTime::parse_from_rfc3339(&last_sync)
                    .map_err(|e| format!("Failed to parse sync time: {e}"))?;
                let age = Utc::now().signed_duration_since(last_sync_time.with_timezone(&Utc));
                let age_hours = age.num_hours();

                if age_hours >= max_age_hours as i64 {
                    println!("🔥 CACHE CHECK: Cache too old ({age_hours} hours), not fresh");
                    return Ok(false);
                }

                // Only do count verification if cache is older than 2 hours
                // For recent caches (< 2 hours), trust the cached data
                if age_hours < 2 {
                    println!("🔥 CACHE CHECK: Cache is recent ({age_hours} hours), trusting without count verification");
                    return Ok(true);
                }

                // For older caches, verify count matches
                let cached_count = status.watchlist_count as usize;
                println!("🔥 CACHE CHECK: Cached count: {cached_count}");

                match get_letterboxd_watchlist_count(&friend_username).await {
                    Ok(current_count) => {
                        println!("🔥 CACHE CHECK: Current Letterboxd count: {current_count}");
                        let counts_match = cached_count == current_count;
                        println!(
                            "🔥 CACHE CHECK: Cache age: {age_hours} hours, counts match: {counts_match}, is_fresh: {counts_match}"
                        );
                        Ok(counts_match)
                    }
                    Err(e) => {
                        println!("🔥 CACHE CHECK: Failed to get current count, assuming cache is fresh: {e}");
                        // If we can't check current count, assume cache is fresh based on time only
                        Ok(true)
                    }
                }
            } else {
                println!("🔥 CACHE CHECK: No last_sync time found");
                Ok(false)
            }
        }
        None => {
            println!("🔥 CACHE CHECK: No sync status found for user");
            Ok(false)
        }
    }
}

#[command]
async fn is_watchlist_cache_fresh(
    friend_username: String,
    max_age_hours: u64,
) -> Result<bool, String> {
    println!("🔥 CACHE CHECK: Checking cache freshness (max age: {max_age_hours} hours)");
    match get_friend_sync_status(friend_username.clone()).await? {
        Some(status) => {
            println!(
                "🔥 CACHE CHECK: Found sync status - status: {}, last_sync: {:?}",
                status.sync_status, status.last_watchlist_sync
            );
            if let Some(last_sync) = status.last_watchlist_sync {
                let last_sync_time = chrono::DateTime::parse_from_rfc3339(&last_sync)
                    .map_err(|e| format!("Failed to parse sync time: {e}"))?;
                let age = Utc::now().signed_duration_since(last_sync_time.with_timezone(&Utc));
                let age_hours = age.num_hours();
                let is_fresh =
                    age_hours < max_age_hours as i64 && status.sync_status == "completed";
                println!("🔥 CACHE CHECK: Cache age: {age_hours} hours, is_fresh: {is_fresh}");
                Ok(is_fresh)
            } else {
                println!("🔥 CACHE CHECK: No last_sync time found");
                Ok(false)
            }
        }
        None => {
            println!("🔥 CACHE CHECK: No sync status found for user");
            Ok(false)
        }
    }
}

// Enhanced watchlist retrieval with caching
async fn get_watchlist_cached_or_scrape(
    friend_username: String,
    max_cache_age_hours: u64,
) -> Result<Vec<WatchlistMovie>, String> {
    // println!("🔥 WATCHLIST FETCH: get_watchlist_cached_or_scrape called for {friend_username} (max_age: {max_cache_age_hours} hours)");

    // Check if we have fresh cached data with count verification
    if is_watchlist_cache_fresh_with_count_check(friend_username.clone(), max_cache_age_hours)
        .await?
    {
        // println!("🔥 WATCHLIST FETCH: Using cached watchlist for {friend_username}");
        let cached_movies = get_cached_watchlist(friend_username).await?;

        // Convert cached movies back to WatchlistMovie format
        let movies: Vec<WatchlistMovie> = cached_movies
            .into_iter()
            .map(|cached| {
                WatchlistMovie {
                    title: cached.movie_title,
                    year: cached.movie_year.map(|y| y as u32),
                    letterboxd_slug: cached.letterboxd_slug,
                    poster_url: None, // We don't cache poster URLs yet
                }
            })
            .collect();

        // println!("🔥 WATCHLIST FETCH: Returning {} cached movies", movies.len());
        return Ok(movies);
    }

    // Cache is stale or counts don't match, scrape fresh data
    // println!("🔥 WATCHLIST FETCH: Cache stale or counts mismatch, scraping fresh data for {friend_username}");
    match scrape_user_watchlist(&friend_username).await {
        Ok(movies) => {
            // Save to cache for next time
            println!("Saving {} movies to cache for user", movies.len());
            save_watchlist_to_cache(friend_username, movies.clone()).await?;
            Ok(movies)
        }
        Err(e) => {
            // If scraping fails but we have old cached data, use it
            println!("Scraping failed for user, trying cached data: {e}");
            let cached_movies = get_cached_watchlist(friend_username).await?;
            if !cached_movies.is_empty() {
                println!("Using stale cached data as fallback");
                let movies: Vec<WatchlistMovie> = cached_movies
                    .into_iter()
                    .map(|cached| WatchlistMovie {
                        title: cached.movie_title,
                        year: cached.movie_year.map(|y| y as u32),
                        letterboxd_slug: cached.letterboxd_slug,
                        poster_url: None,
                    })
                    .collect();
                Ok(movies)
            } else {
                Err(e)
            }
        }
    }
}

#[command]
async fn scrape_letterboxd_profile(username: String) -> Result<LetterboxdUser, String> {
    // Security: Log operation without exposing sensitive user data
    println!("Scraping real Letterboxd profile");

    // Validate username (basic sanitization)
    if username.trim().is_empty() || username.contains('/') || username.contains('\\') {
        return Err("Invalid username format".to_string());
    }

    let url = format!("https://letterboxd.com/{username}/");

    // Create secure HTTP client with proper headers
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    // Fetch the profile page
    // Security Note: Username in URL is public Letterboxd profile identifier, not sensitive data
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch profile page: {e}"))?;

    if response.status() == 404 {
        return Err(format!("User '{username}' not found on Letterboxd"));
    }

    if !response.status().is_success() {
        return Err(format!(
            "HTTP error {}: Failed to access profile",
            response.status()
        ));
    }

    let html_content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {e}"))?;

    // Parse HTML
    let document = Html::parse_document(&html_content);

    // Extract profile information
    let display_name = extract_display_name(&document, &username);
    let followers_count = extract_followers_count(&document);
    let following_count = extract_following_count(&document);
    let films_count = extract_films_count(&document);

    Ok(LetterboxdUser {
        username: username.clone(),
        display_name,
        avatar_url: None, // TODO: Extract avatar URL
        followers_count,
        following_count,
        films_count,
    })
}

// Helper functions for parsing HTML
fn extract_display_name(document: &Html, username: &str) -> Option<String> {
    // Try to find display name in various possible selectors
    let selectors = ["h1.headline-1", ".profile-header h1", "h1", ".displayname"];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                let text = element.text().collect::<String>().trim().to_string();
                if !text.is_empty() && text != username {
                    // Clean up display name by removing common suffixes
                    let cleaned = clean_display_name(&text);
                    return Some(cleaned);
                }
            }
        }
    }

    None
}

fn clean_display_name(name: &str) -> String {
    // Remove common Letterboxd subscription indicators
    let suffixes_to_remove = [" Pro", " Patron", " HQ"];

    let mut cleaned = name.to_string();
    for suffix in &suffixes_to_remove {
        if cleaned.ends_with(suffix) {
            cleaned = cleaned.strip_suffix(suffix).unwrap_or(&cleaned).to_string();
            break;
        }
    }

    cleaned
}

fn extract_followers_count(document: &Html) -> Option<u32> {
    extract_count_from_links(document, "followers")
}

fn extract_following_count(document: &Html) -> Option<u32> {
    extract_count_from_links(document, "following")
}

fn extract_films_count(document: &Html) -> Option<u32> {
    // Look for films count in profile stats
    let selectors = [
        "a[href*='/films/'] .value",
        ".profile-stats a[href*='/films/']",
        ".statistic .value",
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in document.select(&selector) {
                let text = element.text().collect::<String>();
                if let Some(count) = parse_count(&text) {
                    return Some(count);
                }
            }
        }
    }

    None
}

fn extract_count_from_links(document: &Html, link_type: &str) -> Option<u32> {
    let selector_str = format!("a[href*='/{link_type}/'] .value");

    if let Ok(selector) = Selector::parse(&selector_str) {
        if let Some(element) = document.select(&selector).next() {
            let text = element.text().collect::<String>();
            return parse_count(&text);
        }
    }

    None
}

fn parse_count(text: &str) -> Option<u32> {
    // Remove commas and parse number
    let cleaned = text.trim().replace(',', "");
    cleaned.parse::<u32>().ok()
}

#[command]
async fn scrape_letterboxd_friends(username: String) -> Result<Vec<LetterboxdFriend>, String> {
    // Security: Log operation without exposing sensitive user data
    println!("Scraping real Letterboxd friends");

    // Validate username (basic sanitization)
    if username.trim().is_empty() || username.contains('/') || username.contains('\\') {
        return Err("Invalid username format".to_string());
    }

    // Create secure HTTP client with proper headers
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    let mut all_friends = Vec::new();
    let mut page = 1;
    let max_pages = 10; // Safety limit to prevent infinite loops

    loop {
        // Build the URL for the user's following page with pagination
        let url = if page == 1 {
            format!("https://letterboxd.com/{username}/following/")
        } else {
            format!("https://letterboxd.com/{username}/following/page/{page}/")
        };

        // Security: Log operation without exposing full URLs containing user data
        println!("Scraping friends page {page}");

        // Fetch the friends/following page
        // Security Note: Username in URL is public Letterboxd profile identifier, not sensitive data
        let response = client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch friends page {page}: {e}"))?;

        if response.status() == 404 {
            if page == 1 {
                return Err(format!("Following page not found for user '{username}'"));
            } else {
                // No more pages, break the loop
                break;
            }
        }

        if !response.status().is_success() {
            return Err(format!(
                "HTTP error {}: Failed to access following page {}",
                response.status(),
                page
            ));
        }

        let html_content = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response for page {page}: {e}"))?;

        // Parse HTML
        let document = Html::parse_document(&html_content);

        // Extract friends from this page
        let page_friends = extract_friends_from_html(&document)?;

        // If no friends found on this page, we've reached the end
        if page_friends.is_empty() {
            break;
        }

        println!("Found {} friends on page {}", page_friends.len(), page);
        all_friends.extend(page_friends);

        // Check if there's a next page by looking for pagination in HTML content
        if !has_next_page_in_html(&html_content) || page >= max_pages {
            break;
        }

        page += 1;

        // Add a small delay to be respectful to the server
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    if all_friends.is_empty() {
        return Err("No friends found or following page is private".to_string());
    }

    println!(
        "Total friends found across {} pages: {}",
        page,
        all_friends.len()
    );

    // Save the scraped friends to the database
    if let Err(e) = save_friends_to_database(all_friends.clone()).await {
        eprintln!("🚨 Error saving friends to database: {e}");
        return Err(format!("Failed to save friends to database: {e}"));
    }
    println!(
        "✅ Successfully saved {} friends to the database.",
        all_friends.len()
    );

    Ok(all_friends)
}

fn extract_friends_from_html(document: &Html) -> Result<Vec<LetterboxdFriend>, String> {
    let mut friends = Vec::new();

    // Try different selectors for friend entries
    let selectors = [
        "tbody tr",        // Table rows containing friend data
        ".person-summary", // Person summary cards
        ".profile-person", // Profile person entries
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in document.select(&selector) {
                if let Some(friend) = extract_friend_from_element(&element) {
                    friends.push(friend);
                }
            }

            // If we found friends with this selector, stop trying others
            if !friends.is_empty() {
                break;
            }
        }
    }

    Ok(friends)
}

fn extract_friend_from_element(element: &scraper::ElementRef) -> Option<LetterboxdFriend> {
    // Look for username in links
    let username = extract_username_from_element(element)?;

    // Look for display name
    let display_name = extract_display_name_from_element(element, &username);

    // Look for avatar URL
    let avatar_url = extract_avatar_from_element(element);

    Some(LetterboxdFriend {
        username,
        display_name,
        avatar_url,
        is_selected: false,
        last_synced: None,
    })
}

fn extract_username_from_element(element: &scraper::ElementRef) -> Option<String> {
    // Look for links that point to user profiles
    if let Ok(link_selector) = Selector::parse("a[href*='/']") {
        for link in element.select(&link_selector) {
            if let Some(href) = link.value().attr("href") {
                // Extract username from href like "/username/" or "/username"
                if let Some(username) = extract_username_from_href(href) {
                    return Some(username);
                }
            }
        }
    }

    None
}

fn extract_username_from_href(href: &str) -> Option<String> {
    // Handle different href formats: "/username/", "/username", "https://letterboxd.com/username/"
    let cleaned = href.trim_start_matches("https://letterboxd.com");
    let parts: Vec<&str> = cleaned.split('/').filter(|s| !s.is_empty()).collect();

    if let Some(username) = parts.first() {
        let username = username.to_string();
        // Filter out non-user pages
        if !is_system_page(&username) && is_valid_username(&username) {
            return Some(username);
        }
    }

    None
}

fn extract_display_name_from_element(
    element: &scraper::ElementRef,
    username: &str,
) -> Option<String> {
    // Try to find display name in various elements
    let selectors = [
        "a",              // Link text
        ".name",          // Name class
        "td:first-child", // First table cell
        "h3",             // Heading
        "strong",         // Bold text
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for name_element in element.select(&selector) {
                let text = name_element.text().collect::<String>().trim().to_string();
                if !text.is_empty()
                    && text != username
                    && !text.contains("followers")
                    && !text.contains("following")
                {
                    // Clean up display name by removing common suffixes
                    let cleaned = clean_display_name(&text);
                    return Some(cleaned);
                }
            }
        }
    }

    None
}

fn extract_avatar_from_element(element: &scraper::ElementRef) -> Option<String> {
    // Try different selectors for avatar images
    let selectors = [
        "img.avatar",
        "img[src*='avatar']",
        ".avatar img",
        "img[alt*='avatar']",
        ".profile-avatar img",
        "img[src*='profile']",
        "img[src*='letterboxd']",
        "img", // Last resort - any image
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(img_element) = element.select(&selector).next() {
                if let Some(src) = img_element.value().attr("src") {
                    // Skip placeholder or default images
                    if src.contains("placeholder") || src.contains("default") || src.is_empty() {
                        continue;
                    }

                    // Make sure we have a full URL
                    if src.starts_with("http") {
                        return Some(src.to_string());
                    } else if src.starts_with("/") {
                        return Some(format!("https://letterboxd.com{src}"));
                    } else if src.starts_with("//") {
                        return Some(format!("https:{src}"));
                    }
                }
            }
        }
    }

    None
}

fn is_system_page(username: &str) -> bool {
    // Filter out system pages that aren't user profiles
    matches!(
        username,
        "films"
            | "lists"
            | "members"
            | "journal"
            | "about"
            | "pro"
            | "news"
            | "apps"
            | "help"
            | "terms"
            | "api"
            | "contact"
            | "create-account"
            | "sign-in"
            | "gift-guide"
            | "year-in-review"
            | "followers"
            | "following"
            | "watchlist"
    )
}

fn is_valid_username(username: &str) -> bool {
    // Basic validation for usernames
    !username.is_empty()
        && username.len() <= 50
        && username
            .chars()
            .all(|c| c.is_alphanumeric() || c == '_' || c == '-')
}

fn has_next_page_in_html(html_content: &str) -> bool {
    // Simple string-based check for pagination indicators
    let pagination_indicators = [
        r#"page/"#,         // Any page/ in URLs
        r#"next"#,          // Next button/link
        r#"paginate-next"#, // Pagination next class
        r#"rel="next""#,    // Rel=next attribute
        r#"&gt;"#,          // HTML entity for >
        r#"→"#,             // Arrow character
    ];

    // Look for multiple indicators to be more confident there's a next page
    let mut indicator_count = 0;
    for indicator in &pagination_indicators {
        if html_content.contains(indicator) {
            indicator_count += 1;
        }
    }

    // If we find at least 2 pagination indicators, likely there's a next page
    indicator_count >= 2
}

#[tauri::command]
async fn compare_watchlists(
    main_username: String,
    friend_usernames: Vec<String>,
    tmdb_api_key: Option<String>,
    limit_to500: Option<bool>,
) -> Result<CompareResult, String> {
    println!("=== COMPARE_WATCHLISTS COMMAND STARTED ===");
    println!(
        "Comparing watchlists for main user with {} friends",
        friend_usernames.len()
    );

    let should_limit = limit_to500.unwrap_or(false);
    if should_limit {
        println!("Limiting watchlists to first 500 movies for faster processing");
    }

    if let Some(api_key) = &tmdb_api_key {
        println!(
            "Using TMDB API key: {}...",
            &api_key[..4.min(api_key.len())]
        );
    } else {
        println!("No TMDB API key provided");
    }

    // Step 1: Get main user's watchlist (with caching)
    println!("Getting watchlist for main user");
    let main_watchlist = if should_limit {
        // For limited mode, still scrape fresh to ensure we get the latest
        scrape_user_watchlist_with_limit(&main_username, true).await?
    } else {
        // Use cache-first approach with 24-hour freshness for full lists
        get_watchlist_cached_or_scrape(main_username.clone(), 24).await?
    };
    println!(
        "Found {} movies in {}'s watchlist",
        main_watchlist.len(),
        main_username
    );

    // Step 2: Get all friends' watchlists (with caching)
    // Filter out the main user from friends list to avoid matching against self
    let filtered_friends: Vec<String> = friend_usernames
        .iter()
        .filter(|&friend| friend.to_lowercase() != main_username.to_lowercase())
        .cloned()
        .collect();

    if filtered_friends.len() != friend_usernames.len() {
        println!("DEBUG: Filtered out main user from friends list");
        println!("DEBUG: Original friends: {friend_usernames:?}");
        println!("DEBUG: Filtered friends: {filtered_friends:?}");
    }

    if filtered_friends.is_empty() {
        return Err("No valid friends to compare with (excluding main user)".to_string());
    }

    let mut friend_watchlists_with_names = Vec::new();
    for friend_username in &filtered_friends {
        println!("Getting watchlist for friend");
        let watchlist = if should_limit {
            // For limited mode, still scrape fresh
            match scrape_user_watchlist_with_limit(friend_username, true).await {
                Ok(watchlist) => watchlist,
                Err(e) => {
                    println!("Failed to scrape watchlist for friend: {e}");
                    continue;
                }
            }
        } else {
            // Use cache-first approach with 24-hour freshness
            match get_watchlist_cached_or_scrape(friend_username.clone(), 24).await {
                Ok(watchlist) => watchlist,
                Err(e) => {
                    println!("Failed to get watchlist for friend: {e}");
                    continue;
                }
            }
        };

        println!(
            "Found {} movies in {}'s watchlist",
            watchlist.len(),
            friend_username
        );
        friend_watchlists_with_names.push((friend_username.clone(), watchlist));
    }

    // Extract just the watchlists for existing comparison logic
    let friend_watchlists: Vec<Vec<WatchlistMovie>> = friend_watchlists_with_names
        .iter()
        .map(|(_, watchlist)| watchlist.clone())
        .collect();

    // Step 3: Find common movies across all watchlists
    println!("=== DEBUGGING COMPARISON PROCESS ===");
    println!(
        "Main user '{}' has {} movies",
        main_username,
        main_watchlist.len()
    );
    println!("Processing {} friend watchlists", friend_watchlists.len());

    // Show a few sample movies from each list for debugging
    if !main_watchlist.is_empty() {
        println!("Sample from main user's watchlist:");
        for (i, movie) in main_watchlist.iter().take(3).enumerate() {
            println!("  {}. '{}'", i + 1, movie.title);
        }
    }

    for (friend_idx, friend_watchlist) in friend_watchlists.iter().enumerate() {
        println!(
            "Sample from friend {} watchlist ({} movies):",
            friend_idx + 1,
            friend_watchlist.len()
        );
        for (i, movie) in friend_watchlist.iter().take(3).enumerate() {
            println!("  {}. '{}'", i + 1, movie.title);
        }
    }

    println!("=== STARTING MOVIE COMPARISON ===");
    println!(
        "🔍 DEBUG: About to call find_common_movies with main user having {} movies",
        main_watchlist.len()
    );

    // Show first few movies from main user for debugging
    if !main_watchlist.is_empty() {
        println!("🔍 DEBUG: First 5 movies from main user:");
        for (i, movie) in main_watchlist.iter().take(5).enumerate() {
            println!("  {}. '{}'", i + 1, movie.title);
        }
    }

    // Show first few movies from each friend for debugging
    for (friend_idx, (friend_name, friend_watchlist)) in
        friend_watchlists_with_names.iter().enumerate()
    {
        if !friend_watchlist.is_empty() {
            println!(
                "🔍 DEBUG: First 5 movies from friend {} ({}):",
                friend_idx + 1,
                friend_name
            );
            for (i, movie) in friend_watchlist.iter().take(5).enumerate() {
                println!("  {}. '{}'", i + 1, movie.title);
            }
        }
    }

    let common_movies = find_common_movies(&main_watchlist, &friend_watchlists_with_names);
    println!("=== MOVIE COMPARISON COMPLETED ===");
    println!(
        "Found {} common movies across all watchlists",
        common_movies.len()
    );

    // Step 4: Enhance with TMDB data if API key provided
    println!("=== STARTING MOVIE ENHANCEMENT ===");
    let enhanced_movies = if let Some(api_key) = tmdb_api_key {
        println!("🎬 TMDB: API key provided, enhancing movies with TMDB data");
        enhance_movies_with_tmdb(common_movies, &api_key).await?
    } else {
        println!("🎬 TMDB: No API key provided, using basic enhancement");
        enhance_movies_basic(common_movies)
    };
    println!("=== MOVIE ENHANCEMENT COMPLETED ===");

    println!("=== COMPARE_WATCHLISTS COMMAND COMPLETED ===");
    Ok(CompareResult {
        common_movies: enhanced_movies,
    })
}

// Helper function to scrape a user's watchlist
async fn scrape_user_watchlist(username: &str) -> Result<Vec<WatchlistMovie>, String> {
    scrape_user_watchlist_with_limit(username, false).await
}

// Helper function to scrape a user's watchlist with optional limit
async fn scrape_user_watchlist_with_limit(
    username: &str,
    limit_to_500: bool,
) -> Result<Vec<WatchlistMovie>, String> {
    // Validate username
    if username.trim().is_empty() || username.contains('/') || username.contains('\\') {
        return Err("Invalid username format".to_string());
    }

    // Create secure HTTP client
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    let mut all_movies = Vec::new();
    let mut page = 1;
    let max_pages = 20; // Watchlists can be quite large

    loop {
        // Build URL for watchlist page
        let url = if page == 1 {
            format!("https://letterboxd.com/{username}/watchlist/")
        } else {
            format!("https://letterboxd.com/{username}/watchlist/page/{page}/")
        };

        println!("Scraping watchlist page {page}");

        // Fetch the page
        // Security Note: Username in URL is public Letterboxd profile identifier, not sensitive data
        let response = client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch watchlist page {page}: {e}"))?;

        if response.status() == 404 {
            if page == 1 {
                return Err(format!("Watchlist not found for user '{username}'"));
            } else {
                // No more pages
                break;
            }
        }

        if !response.status().is_success() {
            return Err(format!(
                "HTTP error {}: Failed to access watchlist page {}",
                response.status(),
                page
            ));
        }

        let response_status = response.status();
        let html_content = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response for page {page}: {e}"))?;

        // Parse HTML and extract movies (keeping for debugging even though we don't use it)
        let _document = Html::parse_document(&html_content);

        // Debug: Log detailed information about the HTML content
        println!("=== WATCHLIST DEBUG INFO ===");
        println!("Processing watchlist page request");
        println!("HTML content length: {} chars", html_content.len());
        println!(
            "Response status was successful: {}",
            response_status.is_success()
        );

        // Check for key indicators
        if html_content.contains("WANTS TO SEE") {
            println!("✓ Found 'WANTS TO SEE' text in HTML");
        } else {
            println!("✗ No 'WANTS TO SEE' text found");
        }

        if html_content.contains("/film/") {
            println!("✓ Found '/film/' links in HTML");
            let film_count = html_content.matches("/film/").count();
            println!("  Total '/film/' occurrences: {film_count}");
        } else {
            println!("✗ No '/film/' links found");
        }

        if html_content.contains("watchlist") {
            println!("✓ Found 'watchlist' text in HTML");
        } else {
            println!("✗ No 'watchlist' text found");
        }

        // Sample the first and last parts of HTML to see structure
        let sample_start = if html_content.len() > 500 {
            // Use char_indices to find safe UTF-8 boundary near 500 bytes
            html_content
                .char_indices()
                .take_while(|(i, _)| *i < 500)
                .last()
                .map(|(i, c)| &html_content[..i + c.len_utf8()])
                .unwrap_or(&html_content)
        } else {
            &html_content
        };

        let sample_end = if html_content.len() > 1000 {
            // Use char_indices to find safe UTF-8 boundary for the end sample
            let target_start = html_content.len().saturating_sub(500);
            html_content
                .char_indices()
                .find(|(i, _)| *i >= target_start)
                .map(|(i, _)| &html_content[i..])
                .unwrap_or("")
        } else {
            ""
        };

        println!("HTML start sample:\n{sample_start}\n");
        if !sample_end.is_empty() {
            println!("HTML end sample:\n{sample_end}\n");
        }

        // Try to find specific movie patterns
        let movie_patterns = [
            "Only the Brave",
            "Beerfest",
            "Super Troopers",
            "American Beauty",
            "The Lighthouse",
        ];
        for pattern in &movie_patterns {
            if html_content.contains(pattern) {
                println!("✓ Found movie '{pattern}' in HTML");
            }
        }

        println!("=== END DEBUG INFO ===\n");

        // Simple approach: extract movies from HTML text using patterns
        let page_movies = if html_content.contains("WANTS TO SEE")
            || html_content.contains("watchlist")
        {
            extract_movies_from_html_text(&html_content)
        } else {
            println!("⚠️ HTML doesn't contain expected patterns, trying alternative extraction");
            extract_movies_from_html_text(&html_content) // Try anyway
        };

        if page_movies.is_empty() {
            break;
        }

        println!(
            "Found {} movies on watchlist page {}",
            page_movies.len(),
            page
        );
        all_movies.extend(page_movies);

        // Check if we should limit the results
        if limit_to_500 && all_movies.len() >= 500 {
            println!("Reached limit of 500 movies, stopping pagination");
            break;
        }

        // Check for next page
        if !has_next_page_in_html(&html_content) || page >= max_pages {
            break;
        }

        page += 1;
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    println!(
        "Total movies found in user's watchlist: {}",
        all_movies.len()
    );
    Ok(all_movies)
}

// Helper struct for watchlist movies
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct WatchlistMovie {
    title: String,
    year: Option<u32>,
    letterboxd_slug: Option<String>,
    poster_url: Option<String>,
}

// Extract movies from watchlist HTML (alternative implementation, kept for future use)
#[allow(dead_code)]
fn extract_movies_from_watchlist(document: &Html) -> Result<Vec<WatchlistMovie>, String> {
    let mut movies = Vec::new();

    // Look for film links in the watchlist - try multiple selectors
    let selectors = [
        "a[href*='/film/']",                   // Any link to a film page
        ".poster-container a[href*='/film/']", // Poster links to films
        ".film-poster a[href*='/film/']",      // Film poster links
        "li a[href*='/film/']",                // List items with film links
        ".poster a[href*='/film/']",           // Simple poster links
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in document.select(&selector) {
                if let Some(href) = element.value().attr("href") {
                    // Extract movie info from the href and any available text
                    if let Some(movie) = extract_movie_from_film_link(&element, href) {
                        // Avoid duplicates
                        if !movies.iter().any(|m: &WatchlistMovie| {
                            m.title == movie.title && m.year == movie.year
                        }) {
                            movies.push(movie);
                        }
                    }
                }
            }

            if !movies.is_empty() {
                println!(
                    "Found {} movies using selector: {}",
                    movies.len(),
                    selector_str
                );
                break; // Found movies with this selector, stop trying others
            }
        }
    }

    // If no movies found with selectors, try a broader text-based approach
    if movies.is_empty() {
        println!("No movies found with CSS selectors, trying text-based extraction");
        movies = extract_movies_from_text(document)?;
    }

    Ok(movies)
}

// Extract movie info from a film link element and href
fn extract_movie_from_film_link(
    element: &scraper::ElementRef,
    href: &str,
) -> Option<WatchlistMovie> {
    // Get text content from the link
    let link_text = element.text().collect::<String>().trim().to_string();

    // Try to get title from various attributes or text
    let title_source = if let Some(title_attr) = element.value().attr("title") {
        title_attr.to_string()
    } else if !link_text.is_empty() {
        link_text
    } else {
        // Extract from href as last resort: /film/movie-name-year/ -> movie-name-year
        href.split('/').nth(2)?.replace('-', " ")
    };

    // Parse title and year from the text
    parse_title_and_year(&title_source).map(|(title, year)| WatchlistMovie {
        title,
        year,
        letterboxd_slug: href.split('/').nth(2).map(|s| s.to_string()),
        poster_url: None,
    })
}

// Fallback: extract movies from raw text content
fn extract_movies_from_text(document: &Html) -> Result<Vec<WatchlistMovie>, String> {
    let mut movies = Vec::new();
    let body_text = document
        .select(&Selector::parse("body").unwrap())
        .next()
        .map(|body| body.text().collect::<String>())
        .unwrap_or_default();

    // Look for patterns like "Movie Title (YEAR)" in the text
    let lines: Vec<&str> = body_text.lines().collect();
    for line in lines {
        let line = line.trim();
        if line.contains("(") && line.contains(")") && line.len() > 10 && line.len() < 100 {
            // Check if it looks like a movie title with year
            if let Some((title, year)) = parse_title_and_year(line) {
                if title.len() > 2 && title.len() < 80 {
                    // Reasonable title length
                    movies.push(WatchlistMovie {
                        title,
                        year,
                        letterboxd_slug: None,
                        poster_url: None,
                    });
                }
            }
        }
    }

    // Remove duplicates
    movies.sort_by(|a, b| a.title.cmp(&b.title));
    movies.dedup_by(|a, b| a.title == b.title && a.year == b.year);

    Ok(movies)
}

// Simple text-based movie extraction that should work reliably
fn extract_movies_from_html_text(html_content: &str) -> Vec<WatchlistMovie> {
    let mut movies = Vec::new();

    println!("DEBUG: Starting movie extraction from HTML");

    // Parse HTML properly to extract movie data
    let document = Html::parse_document(html_content);

    // Look for film poster elements with data attributes
    let poster_selector = Selector::parse(".film-poster[data-film-slug]").unwrap();
    let poster_elements: Vec<_> = document.select(&poster_selector).collect();

    println!(
        "DEBUG: Found {} film poster elements",
        poster_elements.len()
    );

    for element in poster_elements {
        // Extract movie slug from data attribute
        if let Some(slug) = element.value().attr("data-film-slug") {
            // Look for the img element with alt text containing the movie title
            let img_selector = Selector::parse("img").unwrap();
            if let Some(img) = element.select(&img_selector).next() {
                if let Some(alt_text) = img.value().attr("alt") {
                    println!("DEBUG: Found movie alt text: '{alt_text}'");

                    // Extract title and year from alt text
                    let (title, year) = extract_title_and_year_from_alt(alt_text);

                    if !title.is_empty() {
                        println!("DEBUG: Extracted movie - Title: '{title}', Year: {year:?}");

                        // Get poster URL if available
                        let poster_url = img.value().attr("src").map(|src| {
                            if src.starts_with("//") {
                                format!("https:{src}")
                            } else if src.starts_with("/") {
                                format!("https://letterboxd.com{src}")
                            } else {
                                src.to_string()
                            }
                        });

                        movies.push(WatchlistMovie {
                            title,
                            year,
                            letterboxd_slug: Some(slug.to_string()),
                            poster_url,
                        });
                    }
                }
            }
        }
    }

    // Alternative approach: look for data-target-link attributes
    if movies.is_empty() {
        println!("DEBUG: No movies found via poster elements, trying target-link approach");

        let link_selector = Selector::parse("[data-target-link*='/film/']").unwrap();
        let link_elements: Vec<_> = document.select(&link_selector).collect();

        println!(
            "DEBUG: Found {} elements with film links",
            link_elements.len()
        );

        for element in link_elements {
            if let Some(target_link) = element.value().attr("data-target-link") {
                // Extract slug from target link like "/film/movie-title/"
                let slug = target_link
                    .trim_start_matches("/film/")
                    .trim_end_matches("/");

                // Look for img alt text in this element
                let img_selector = Selector::parse("img").unwrap();
                if let Some(img) = element.select(&img_selector).next() {
                    if let Some(alt_text) = img.value().attr("alt") {
                        println!("DEBUG: Found movie via target-link - Alt: '{alt_text}'");

                        let (title, year) = extract_title_and_year_from_alt(alt_text);

                        if !title.is_empty() {
                            println!(
                                "DEBUG: Extracted movie via target-link - Title: '{title}', Year: {year:?}"
                            );
                            movies.push(WatchlistMovie {
                                title,
                                year,
                                letterboxd_slug: Some(slug.to_string()),
                                poster_url: None,
                            });
                        }
                    }
                }
            }
        }
    }

    // Remove duplicates
    movies.sort_by(|a, b| a.title.cmp(&b.title));
    movies.dedup_by(|a, b| a.title == b.title && a.year == b.year);

    println!("DEBUG: Final extracted {} unique movies", movies.len());
    movies
}

// Extract title and year from alt text like "Movie Title" or "Movie Title: Subtitle"
fn extract_title_and_year_from_alt(alt_text: &str) -> (String, Option<u32>) {
    // Clean up the alt text
    let cleaned = alt_text.trim();

    // For now, just use the alt text as the title since Letterboxd's alt text
    // doesn't always include years in a consistent format
    let title = cleaned.to_string();

    // Try to extract year if it's in parentheses at the end
    let year = if let Some(year_start) = cleaned.rfind('(') {
        if let Some(year_end) = cleaned[year_start..].find(')') {
            let year_str = &cleaned[year_start + 1..year_start + year_end];
            year_str
                .parse::<u32>()
                .ok()
                .filter(|&y| (1900..=2030).contains(&y))
        } else {
            None
        }
    } else {
        None
    };

    (title, year)
}

// More flexible title and year parsing
// AI Generated: GitHub Copilot - 2025-08-03
#[allow(dead_code)]
fn parse_title_and_year_flexible(text: &str) -> Option<(String, Option<u32>)> {
    // Handle multiple patterns:
    // 1. "Movie Title (2019)"
    // 2. ">Movie Title (2019)<"
    // 3. "Movie Title (2019) </a>"

    // First, clean up HTML tags and extra characters
    let cleaned = text
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("</a>", "")
        .replace("<a", "");

    // Look for the year pattern (YYYY) at the end
    if let Some(year_start) = cleaned.rfind('(') {
        if let Some(year_end) = cleaned[year_start..].find(')') {
            let year_str = &cleaned[year_start + 1..year_start + year_end];

            // Try to parse as year
            if let Ok(year) = year_str.parse::<u32>() {
                if (1900..=2030).contains(&year) {
                    // Extract title (everything before the year)
                    let title_part = &cleaned[..year_start].trim();
                    let title = title_part
                        .replace(">", "")
                        .replace("<", "")
                        .replace("[", "")
                        .replace("]", "")
                        .trim()
                        .to_string();

                    if !title.is_empty() {
                        return Some((title, Some(year)));
                    }
                }
            }
        }
    }

    // Fallback: no year found, just clean up the text as title
    let title = cleaned
        .replace(">", "")
        .replace("<", "")
        .replace("[", "")
        .replace("]", "")
        .replace("(", "")
        .replace(")", "")
        .trim()
        .to_string();

    if title.len() > 2 && title.len() < 80 {
        Some((title, None))
    } else {
        None
    }
}

// Parse title and year from strings like "The Climb (2019)"
fn parse_title_and_year(text: &str) -> Option<(String, Option<u32>)> {
    // Look for pattern "Title (YYYY)"
    if let Some(last_paren) = text.rfind('(') {
        if let Some(close_paren) = text[last_paren..].find(')') {
            let year_str = &text[last_paren + 1..last_paren + close_paren];
            if let Ok(year) = year_str.parse::<u32>() {
                if (1800..=2030).contains(&year) {
                    // Reasonable year range
                    let title = text[..last_paren].trim().to_string();
                    return Some((title, Some(year)));
                }
            }
        }
    }

    // No year found, return just the title
    Some((text.trim().to_string(), None))
}

// Find common movies across watchlists (ANY friend has it)
fn find_common_movies(
    main_watchlist: &[WatchlistMovie],
    friend_watchlists_with_names: &[(String, Vec<WatchlistMovie>)],
) -> Vec<(WatchlistMovie, u32, Vec<String>)> {
    if friend_watchlists_with_names.is_empty() {
        println!("DEBUG: No friend watchlists provided");
        return Vec::new();
    }

    println!("DEBUG: Main watchlist has {} movies", main_watchlist.len());
    println!(
        "DEBUG: Checking against {} friend watchlists",
        friend_watchlists_with_names.len()
    );
    for (i, (friend_name, friend_watchlist)) in friend_watchlists_with_names.iter().enumerate() {
        println!(
            "DEBUG: Friend {} ({}) has {} movies",
            i + 1,
            friend_name,
            friend_watchlist.len()
        );
    }

    let mut common_movies = Vec::new();

    // For each movie in main user's watchlist
    for (idx, movie) in main_watchlist.iter().enumerate() {
        if idx < 3 {
            println!(
                "DEBUG: Checking main movie #{}: '{}' ({})",
                idx + 1,
                movie.title,
                movie.year.unwrap_or(0)
            );
        }

        // Track which friends have this movie
        let mut friend_count = 0u32;
        let mut friends_with_movie = Vec::new();

        for (friend_idx, (friend_name, friend_watchlist)) in
            friend_watchlists_with_names.iter().enumerate()
        {
            let mut found_in_this_friend = false;

            for friend_movie in friend_watchlist.iter() {
                if movie.title.to_lowercase() == friend_movie.title.to_lowercase() {
                    found_in_this_friend = true;
                    friend_count += 1;
                    friends_with_movie.push(friend_name.clone());
                    if idx < 3 {
                        println!(
                            "DEBUG: '{}' found in friend {}'s list",
                            movie.title,
                            friend_idx + 1
                        );
                    }
                    break;
                }
            }

            if !found_in_this_friend && idx < 3 {
                println!(
                    "DEBUG: '{}' NOT found in friend {}'s list",
                    movie.title,
                    friend_idx + 1
                );
            }
        }

        // If ANY friend has it (friend_count > 0), include it
        if friend_count > 0 {
            common_movies.push((movie.clone(), friend_count, friends_with_movie));
            println!(
                "DEBUG: COMMON MOVIE FOUND! '{}' is in {} friend watchlists",
                movie.title, friend_count
            );
        }
    }

    println!("DEBUG: Found {} total common movies", common_movies.len());
    common_movies
}

// AI Generated: GitHub Copilot - 2025-08-02
// TMDB API Functions
async fn search_tmdb_movie(
    api_key: &str,
    title: &str,
    year: Option<i32>,
) -> Result<Option<TmdbSearchResult>, String> {
    let client = reqwest::Client::builder()
        .user_agent("BoxdBuddies/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    let mut query_params = vec![
        ("api_key", api_key),
        ("query", title),
        ("include_adult", "false"),
    ];

    // Add year if provided for better matching
    let year_str;
    if let Some(y) = year {
        year_str = y.to_string();
        query_params.push(("year", &year_str));
    }

    let url = "https://api.themoviedb.org/3/search/movie";

    println!("🎬 TMDB SEARCH: Searching for '{title}' (year: {year:?})");

    let response = client
        .get(url)
        .query(&query_params)
        .send()
        .await
        .map_err(|e| format!("Failed to send TMDB search request: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("TMDB API error: {}", response.status()));
    }

    let search_response: TmdbSearchResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse TMDB search response: {e}"))?;

    if search_response.results.is_empty() {
        println!("🎬 TMDB SEARCH: No results found for '{title}'");
        return Ok(None);
    }

    // Find best match
    let mut best_match = &search_response.results[0];

    // If year is provided, prefer exact year matches
    if let Some(target_year) = year {
        for result in &search_response.results {
            if let Some(ref release_date) = result.release_date {
                if let Some(release_year) = safe_parse_year_from_date(release_date) {
                    if release_year == target_year {
                        best_match = result;
                        break;
                    }
                }
            }
        }
    } else {
        // When no year is provided, use smarter matching:
        // 1. Prefer exact title matches
        // 2. Avoid documentaries (titles with "making of", "behind the scenes", etc.)
        // 3. Prefer higher popularity scores
        let mut candidates: Vec<&TmdbSearchResult> = search_response.results.iter().collect();

        // Filter out documentaries and "making of" content
        candidates.retain(|result| {
            let title_lower = result.title.to_lowercase();
            !title_lower.contains("making of")
                && !title_lower.contains("behind the scenes")
                && !title_lower.contains("exploring the set")
                && !title_lower.contains("documentary")
                && result.title.to_lowercase() == title.to_lowercase() // Exact title match
        });

        // If we filtered out everything, fall back to original results but still avoid documentaries
        if candidates.is_empty() {
            candidates = search_response.results.iter().collect();
            candidates.retain(|result| {
                let title_lower = result.title.to_lowercase();
                !title_lower.contains("making of")
                    && !title_lower.contains("behind the scenes")
                    && !title_lower.contains("exploring the set")
            });
        }

        // If we still have candidates, pick the most popular one
        if !candidates.is_empty() {
            // Sort by popularity (descending) and vote_average (descending)
            candidates.sort_by(|a, b| {
                b.popularity
                    .partial_cmp(&a.popularity)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then(
                        b.vote_average
                            .unwrap_or(0.0)
                            .partial_cmp(&a.vote_average.unwrap_or(0.0))
                            .unwrap_or(std::cmp::Ordering::Equal),
                    )
            });
            best_match = candidates[0];
        }
    }

    println!(
        "🎬 TMDB SEARCH: Found match '{}' (ID: {}) - Popularity: {:.1}, Vote: {:.1}",
        best_match.title,
        best_match.id,
        best_match.popularity,
        best_match.vote_average.unwrap_or(0.0)
    );
    Ok(Some(best_match.clone()))
}

async fn get_tmdb_movie_details(api_key: &str, tmdb_id: i32) -> Result<TmdbMovieDetails, String> {
    let client = reqwest::Client::builder()
        .user_agent("BoxdBuddies/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    let url = format!("https://api.themoviedb.org/3/movie/{tmdb_id}");

    println!("🎬 TMDB DETAILS: Fetching details for ID {tmdb_id}");

    let response = client
        .get(&url)
        .query(&[("api_key", api_key)])
        .send()
        .await
        .map_err(|e| format!("Failed to send TMDB details request: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("TMDB API error: {}", response.status()));
    }

    let movie_details: TmdbMovieDetails = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse TMDB movie details: {e}"))?;

    println!(
        "🎬 TMDB DETAILS: Retrieved details for '{}'",
        movie_details.title
    );
    Ok(movie_details)
}

// AI Generated: GitHub Copilot - 2025-08-02
async fn get_tmdb_movie_credits(api_key: &str, tmdb_id: i32) -> Result<Option<String>, String> {
    let client = reqwest::Client::builder()
        .user_agent("BoxdBuddies/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    let url = format!("https://api.themoviedb.org/3/movie/{tmdb_id}/credits");

    println!("🎬 TMDB CREDITS: Fetching credits for ID {tmdb_id}");

    let response = client
        .get(&url)
        .query(&[("api_key", api_key)])
        .send()
        .await
        .map_err(|e| format!("Failed to send TMDB credits request: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "TMDB credits request failed with status: {}",
            response.status()
        ));
    }

    let credits: TmdbCredits = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse TMDB credits response: {e}"))?;

    // Find the director in the crew
    let director = credits
        .crew
        .iter()
        .find(|member| member.job == "Director")
        .map(|member| member.name.clone());

    if let Some(ref director_name) = director {
        println!("🎬 TMDB CREDITS: Found director '{director_name}'");
    } else {
        println!("🎬 TMDB CREDITS: No director found");
    }

    Ok(director)
}

// AI Generated: GitHub Copilot - 2025-08-03
#[allow(dead_code)]
async fn cache_tmdb_movie(conn: &Connection, tmdb_movie: &TmdbMovieDetails) -> SqliteResult<()> {
    cache_tmdb_movie_sync(conn, tmdb_movie)
}

fn cache_tmdb_movie_sync(conn: &Connection, tmdb_movie: &TmdbMovieDetails) -> SqliteResult<()> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // Debug logging for release_date
    println!(
        "🎬 CACHE DEBUG: Processing movie '{}' with release_date: {:?}",
        tmdb_movie.title, tmdb_movie.release_date
    );

    let year = tmdb_movie
        .release_date
        .as_ref()
        .filter(|date| {
            println!(
                "🎬 CACHE DEBUG: Checking date length: '{}' (len: {})",
                date,
                date.len()
            );
            !date.is_empty() && date.len() >= 4
        })
        .and_then(|date| {
            println!("🎬 CACHE DEBUG: Parsing year from date: '{date}'");
            safe_parse_year_from_date(date)
        });
    let genre_ids =
        serde_json::to_string(&tmdb_movie.genres.iter().map(|g| g.id).collect::<Vec<_>>())
            .unwrap_or_default();

    conn.execute(
        "INSERT OR REPLACE INTO tmdb_movies (
            tmdb_id, title, original_title, release_date, year, overview,
            poster_path, backdrop_path, vote_average, vote_count, popularity,
            genre_ids, runtime, budget, revenue, original_language,
            director, last_updated, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
        &[
            &tmdb_movie.id as &dyn rusqlite::ToSql,
            &tmdb_movie.title,
            &tmdb_movie.original_title,
            &tmdb_movie.release_date,
            &year,
            &tmdb_movie.overview,
            &tmdb_movie.poster_path,
            &tmdb_movie.backdrop_path,
            &tmdb_movie.vote_average.unwrap_or(0.0),
            &tmdb_movie.vote_count,
            &tmdb_movie.popularity,
            &genre_ids,
            &tmdb_movie.runtime,
            &tmdb_movie.budget,
            &tmdb_movie.revenue,
            &tmdb_movie.original_language,
            &tmdb_movie.director,
            &now,
            &now,
        ] as &[&dyn rusqlite::ToSql],
    )?;

    println!(
        "🎬 TMDB CACHE: Cached movie '{}' (ID: {})",
        tmdb_movie.title, tmdb_movie.id
    );
    Ok(())
}

// Search for cached movie by title and year in tmdb_movies table
fn get_cached_tmdb_movie_by_title_sync(
    conn: &Connection,
    title: &str,
    year: Option<i32>,
) -> SqliteResult<Option<TmdbMovieCache>> {
    if let Some(y) = year {
        // Search with year
        let mut stmt = conn.prepare(
            "SELECT tmdb_id, title, original_title, release_date, year, overview,
                    poster_path, backdrop_path, vote_average, vote_count, popularity,
                    genre_ids, runtime, budget, revenue, original_language,
                    director, last_updated, created_at
             FROM tmdb_movies WHERE (title = ?1 OR original_title = ?1) AND year = ?2 LIMIT 1",
        )?;

        let mut rows = stmt.query_map([title, &y.to_string()], |row| {
            Ok(TmdbMovieCache {
                tmdb_id: row.get(0)?,
                title: row.get(1)?,
                original_title: row.get(2)?,
                release_date: row.get(3)?,
                year: row.get(4)?,
                overview: row.get(5)?,
                poster_path: row.get(6)?,
                backdrop_path: row.get(7)?,
                vote_average: row.get(8)?,
                vote_count: row.get(9)?,
                popularity: row.get(10)?,
                genre_ids: row.get(11)?,
                runtime: row.get(12)?,
                budget: row.get(13)?,
                revenue: row.get(14)?,
                original_language: row.get(15)?,
                director: row.get(16)?,
                last_updated: row.get(17)?,
                created_at: row.get(18)?,
            })
        })?;

        if let Some(movie) = rows.next() {
            return Ok(Some(movie?));
        }
    } else {
        // Search without year
        let mut stmt = conn.prepare(
            "SELECT tmdb_id, title, original_title, release_date, year, overview,
                    poster_path, backdrop_path, vote_average, vote_count, popularity,
                    genre_ids, runtime, budget, revenue, original_language,
                    director, last_updated, created_at
             FROM tmdb_movies WHERE (title = ?1 OR original_title = ?1) LIMIT 1",
        )?;

        let mut rows = stmt.query_map([title], |row| {
            Ok(TmdbMovieCache {
                tmdb_id: row.get(0)?,
                title: row.get(1)?,
                original_title: row.get(2)?,
                release_date: row.get(3)?,
                year: row.get(4)?,
                overview: row.get(5)?,
                poster_path: row.get(6)?,
                backdrop_path: row.get(7)?,
                vote_average: row.get(8)?,
                vote_count: row.get(9)?,
                popularity: row.get(10)?,
                genre_ids: row.get(11)?,
                runtime: row.get(12)?,
                budget: row.get(13)?,
                revenue: row.get(14)?,
                original_language: row.get(15)?,
                director: row.get(16)?,
                last_updated: row.get(17)?,
                created_at: row.get(18)?,
            })
        })?;

        if let Some(movie) = rows.next() {
            return Ok(Some(movie?));
        }
    }

    Ok(None)
}

// AI Generated: GitHub Copilot - 2025-08-03
#[allow(dead_code)]
async fn get_cached_tmdb_movie(
    conn: &Connection,
    tmdb_id: i32,
) -> SqliteResult<Option<TmdbMovieCache>> {
    get_cached_tmdb_movie_sync(conn, tmdb_id)
}

fn get_cached_tmdb_movie_sync(
    conn: &Connection,
    tmdb_id: i32,
) -> SqliteResult<Option<TmdbMovieCache>> {
    let mut stmt = conn.prepare(
        "SELECT tmdb_id, title, original_title, release_date, year, overview,
                poster_path, backdrop_path, vote_average, vote_count, popularity,
                genre_ids, runtime, budget, revenue, original_language,
                director, last_updated, created_at
         FROM tmdb_movies WHERE tmdb_id = ?1",
    )?;

    let mut movie_iter = stmt.query_map([tmdb_id], |row| {
        Ok(TmdbMovieCache {
            tmdb_id: row.get(0)?,
            title: row.get(1)?,
            original_title: row.get(2)?,
            release_date: row.get(3)?,
            year: row.get(4)?,
            overview: row.get(5)?,
            poster_path: row.get(6)?,
            backdrop_path: row.get(7)?,
            vote_average: row.get(8)?,
            vote_count: row.get(9)?,
            popularity: row.get(10)?,
            genre_ids: row.get(11)?,
            runtime: row.get(12)?,
            budget: row.get(13)?,
            revenue: row.get(14)?,
            original_language: row.get(15)?,
            director: row.get(16)?,
            last_updated: row.get(17)?,
            created_at: row.get(18)?,
        })
    })?;

    movie_iter.next().transpose()
}

// AI Generated: GitHub Copilot - 2025-08-03
#[allow(dead_code)]
async fn get_movie_tmdb_id(
    conn: &Connection,
    title: &str,
    year: Option<i32>,
) -> SqliteResult<Option<i32>> {
    get_movie_tmdb_id_sync(conn, title, year)
}

fn get_movie_tmdb_id_sync(
    conn: &Connection,
    title: &str,
    year: Option<i32>,
) -> SqliteResult<Option<i32>> {
    let mut stmt = conn.prepare(
        "SELECT tmdb_id FROM friend_watchlists WHERE movie_title = ?1 AND movie_year = ?2 AND tmdb_id IS NOT NULL LIMIT 1"
    )?;

    let mut tmdb_id_iter = stmt.query_map(
        [title, &year.map(|y| y.to_string()).unwrap_or_default()],
        |row| row.get::<_, i32>(0),
    )?;

    tmdb_id_iter.next().transpose()
}

// AI Generated: GitHub Copilot - 2025-08-03
#[allow(dead_code)]
async fn update_movie_tmdb_id(
    conn: &Connection,
    title: &str,
    year: Option<i32>,
    tmdb_id: i32,
) -> SqliteResult<()> {
    update_movie_tmdb_id_sync(conn, title, year, tmdb_id)
}

fn update_movie_tmdb_id_sync(
    conn: &Connection,
    title: &str,
    year: Option<i32>,
    tmdb_id: i32,
) -> SqliteResult<()> {
    conn.execute(
        "UPDATE friend_watchlists SET tmdb_id = ?1 WHERE movie_title = ?2 AND movie_year = ?3",
        (tmdb_id, title, year),
    )?;
    Ok(())
}

// AI Generated: GitHub Copilot - 2025-08-03
#[allow(dead_code)]
fn create_enhanced_movie_from_details(
    movie: &WatchlistMovie,
    details: &TmdbMovieDetails,
    friend_count: u32,
    friend_list: Vec<String>,
) -> Movie {
    let poster_path = details
        .poster_path
        .as_ref()
        .map(|path| format!("https://image.tmdb.org/t/p/w500{path}"));

    let year = details
        .release_date
        .as_ref()
        .and_then(|date| safe_parse_year_from_date_u32(date))
        .unwrap_or(movie.year.unwrap_or(0));

    let genres = if details.genres.is_empty() {
        None
    } else {
        Some(
            details
                .genres
                .iter()
                .map(|g| g.name.clone())
                .collect::<Vec<_>>()
                .join(", "),
        )
    };

    Movie {
        id: details.id as u32,
        title: movie.title.clone(),
        year,
        poster_path,
        overview: Some(details.overview.clone()),
        rating: details.vote_average,
        friend_count,
        friend_visual: create_friend_visual(friend_count),
        friend_list,
        genre: genres,
        director: None, // TODO: Add director from credits API
        average_rating: details.vote_average,
        letterboxd_slug: movie.letterboxd_slug.clone(),
    }
}

// AI Generated: GitHub Copilot - 2025-08-02
fn create_enhanced_movie_from_details_with_director(
    movie: &WatchlistMovie,
    details: &TmdbMovieDetails,
    director: Option<String>,
    friend_count: u32,
    friend_list: Vec<String>,
) -> Movie {
    let poster_path = details
        .poster_path
        .as_ref()
        .map(|path| format!("https://image.tmdb.org/t/p/w500{path}"));

    let year = details
        .release_date
        .as_ref()
        .and_then(|date| safe_parse_year_from_date_u32(date))
        .unwrap_or(movie.year.unwrap_or(0));

    let genres = if details.genres.is_empty() {
        None
    } else {
        Some(
            details
                .genres
                .iter()
                .map(|g| g.name.clone())
                .collect::<Vec<_>>()
                .join(", "),
        )
    };

    Movie {
        id: details.id as u32,
        title: movie.title.clone(),
        year,
        poster_path,
        overview: Some(details.overview.clone()),
        rating: details.vote_average,
        friend_count,
        friend_visual: create_friend_visual(friend_count),
        friend_list,
        genre: genres,
        director: director.clone(), // Now we pass the actual director from credits API
        average_rating: details.vote_average,
        letterboxd_slug: movie.letterboxd_slug.clone(),
    }
}

// AI Generated: GitHub Copilot - 2025-08-02
// Map TMDB genre IDs to their corresponding names
fn tmdb_genre_id_to_name(id: i32) -> Option<String> {
    match id {
        28 => Some("Action".to_string()),
        12 => Some("Adventure".to_string()),
        16 => Some("Animation".to_string()),
        35 => Some("Comedy".to_string()),
        80 => Some("Crime".to_string()),
        99 => Some("Documentary".to_string()),
        18 => Some("Drama".to_string()),
        10751 => Some("Family".to_string()),
        14 => Some("Fantasy".to_string()),
        36 => Some("History".to_string()),
        27 => Some("Horror".to_string()),
        10402 => Some("Music".to_string()),
        9648 => Some("Mystery".to_string()),
        10749 => Some("Romance".to_string()),
        878 => Some("Science Fiction".to_string()),
        10770 => Some("TV Movie".to_string()),
        53 => Some("Thriller".to_string()),
        10752 => Some("War".to_string()),
        37 => Some("Western".to_string()),
        _ => None,
    }
}

fn create_enhanced_movie_from_cache(
    movie: &WatchlistMovie,
    cached: &TmdbMovieCache,
    friend_count: u32,
    friend_list: Vec<String>,
) -> Movie {
    let poster_path = cached
        .poster_path
        .as_ref()
        .map(|path| format!("https://image.tmdb.org/t/p/w500{path}"));

    let year = cached.year.unwrap_or(movie.year.unwrap_or(0) as i32) as u32;

    // AI Generated: GitHub Copilot - 2025-08-02
    // Parse genre_ids from cache and convert to genre names
    let genre = if let Some(genre_ids_str) = &cached.genre_ids {
        match serde_json::from_str::<Vec<i32>>(genre_ids_str) {
            Ok(genre_ids) => {
                let genre_names: Vec<String> = genre_ids
                    .iter()
                    .filter_map(|id| tmdb_genre_id_to_name(*id))
                    .collect();
                if genre_names.is_empty() {
                    None
                } else {
                    Some(genre_names.join(", "))
                }
            }
            Err(e) => {
                println!("🔥 GENRE PARSE: Failed to parse genre_ids: {e}");
                None
            }
        }
    } else {
        None
    };

    // AI Generated: GitHub Copilot - 2025-08-02
    // Debug director information
    println!(
        "🔥 DIRECTOR DEBUG: Movie '{}' - cached director: {:?}",
        movie.title, cached.director
    );

    Movie {
        id: cached.tmdb_id as u32,
        title: movie.title.clone(),
        year,
        poster_path,
        overview: cached.overview.clone(),
        rating: cached.vote_average,
        friend_count,
        friend_visual: create_friend_visual(friend_count),
        friend_list,
        genre,
        director: cached.director.clone(), // AI Generated: GitHub Copilot - 2025-01-27
        average_rating: cached.vote_average,
        letterboxd_slug: movie.letterboxd_slug.clone(),
    }
}

fn create_fallback_movie(
    movie: &WatchlistMovie,
    friend_count: u32,
    friend_list: Vec<String>,
) -> Movie {
    Movie {
        id: fastrand::u32(1000000..),
        title: movie.title.clone(),
        year: movie.year.unwrap_or(0),
        poster_path: movie.poster_url.clone(),
        overview: Some(format!(
            "Available on Letterboxd: https://letterboxd.com/film/{}/",
            movie
                .letterboxd_slug
                .as_deref()
                .unwrap_or(&movie.title.to_lowercase().replace(' ', "-"))
        )),
        rating: None,
        friend_count,
        friend_visual: create_friend_visual(friend_count),
        friend_list,
        genre: None,
        director: None,
        average_rating: None,
        letterboxd_slug: movie.letterboxd_slug.clone(),
    }
}

// AI Generated: GitHub Copilot - 2025-08-02
// Enhanced movie processing with TMDB integration
async fn enhance_movies_with_tmdb(
    watchlist_movies: Vec<(WatchlistMovie, u32, Vec<String>)>,
    api_key: &str,
) -> Result<Vec<Movie>, String> {
    let mut enhanced_movies = Vec::new();
    let total_movies = watchlist_movies.len();

    println!("🎬 TMDB: Enhancing {total_movies} movies with TMDB data");

    for (i, (movie, friend_count, friend_list)) in watchlist_movies.into_iter().enumerate() {
        println!(
            "🎬 TMDB: Processing movie {}/{}: '{}'",
            i + 1,
            total_movies,
            movie.title
        );

        // Add rate limiting to respect TMDB API limits (40 requests per second)
        if i > 0 && i % 39 == 0 {
            println!("🎬 TMDB: Rate limiting - waiting 1 second");
            tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        }

        match enhance_movie_with_tmdb_standalone(api_key, &movie, friend_count, friend_list.clone())
            .await
        {
            Ok(enhanced_movie) => {
                enhanced_movies.push(enhanced_movie);
            }
            Err(e) => {
                println!(
                    "🎬 TMDB: Failed to enhance '{}': {}, using fallback",
                    movie.title, e
                );
                enhanced_movies.push(create_fallback_movie(&movie, friend_count, friend_list));
            }
        }
    }

    println!(
        "🎬 TMDB: Successfully enhanced {} movies",
        enhanced_movies.len()
    );
    Ok(enhanced_movies)
}

// AI Generated: GitHub Copilot - 2025-08-02
// Standalone version that manages its own database connection
async fn enhance_movie_with_tmdb_standalone(
    api_key: &str,
    movie: &WatchlistMovie,
    friend_count: u32,
    friend_list: Vec<String>,
) -> Result<Movie, String> {
    // Check if we have a cached TMDB ID for this movie
    // Check persistent TMDB cache first by title/year
    let cached_movie = {
        let db_path = get_database_path()?;
        let conn =
            Connection::open(&db_path).map_err(|e| format!("Failed to open database: {e}"))?;
        get_cached_tmdb_movie_by_title_sync(&conn, &movie.title, movie.year.map(|y| y as i32))
            .map_err(|e| format!("Database error: {e}"))?
    };

    if let Some(cached) = cached_movie {
        println!(
            "🎬 TMDB ENHANCE: Using persistent cache for '{}' (ID: {})",
            movie.title, cached.tmdb_id
        );
        // AI Generated: GitHub Copilot - 2025-08-02 - Debug director information
        println!(
            "🔥 DIRECTOR DEBUG: Movie '{}' - cached director: {:?}",
            movie.title, cached.director
        );

        // AI Generated: GitHub Copilot - 2025-08-02
        // If director is missing from cache, refresh from TMDB
        if cached.director.is_none() {
            println!(
                "🔥 DIRECTOR REFRESH: Director is missing for '{}', refreshing from TMDB...",
                movie.title
            );
            // Fall through to fresh TMDB lookup instead of using cache
        } else {
            return Ok(create_enhanced_movie_from_cache(
                movie,
                &cached,
                friend_count,
                friend_list,
            ));
        }
    }

    // Fallback: Check if movie has TMDB ID in friend_watchlists
    let cached_tmdb_id = {
        let db_path = get_database_path()?;
        let conn =
            Connection::open(&db_path).map_err(|e| format!("Failed to open database: {e}"))?;
        get_movie_tmdb_id_sync(&conn, &movie.title, movie.year.map(|y| y as i32))
            .map_err(|e| format!("Database error: {e}"))?
    };

    // Check cache by ID if we have a TMDB ID from watchlists
    if let Some(tmdb_id) = cached_tmdb_id {
        let cached_movie = {
            let db_path = get_database_path()?;
            let conn =
                Connection::open(&db_path).map_err(|e| format!("Failed to open database: {e}"))?;
            get_cached_tmdb_movie_sync(&conn, tmdb_id)
                .map_err(|e| format!("Database error: {e}"))?
        };

        if let Some(cached) = cached_movie {
            println!(
                "🎬 TMDB ENHANCE: Using cached data for '{}' (ID: {})",
                movie.title, tmdb_id
            );
            return Ok(create_enhanced_movie_from_cache(
                movie,
                &cached,
                friend_count,
                friend_list,
            ));
        }
    }

    // Search TMDB for the movie
    println!(
        "🎬 TMDB SEARCH DEBUG: Movie '{}' has year: {:?}",
        movie.title, movie.year
    );
    match search_tmdb_movie(api_key, &movie.title, movie.year.map(|y| y as i32)).await? {
        Some(search_result) => {
            // Get detailed information and credits
            match get_tmdb_movie_details(api_key, search_result.id).await {
                Ok(mut details) => {
                    // Fetch director from credits
                    let director = match get_tmdb_movie_credits(api_key, search_result.id).await {
                        Ok(director_opt) => director_opt,
                        Err(e) => {
                            println!(
                                "🎬 TMDB ENHANCE: Failed to get credits for '{}': {}",
                                movie.title, e
                            );
                            None
                        }
                    };

                    // Add director to details before caching
                    details.director = director.clone();

                    // Cache the result
                    {
                        let db_path = get_database_path()?;
                        let conn = Connection::open(&db_path)
                            .map_err(|e| format!("Failed to open database: {e}"))?;
                        if let Err(e) = cache_tmdb_movie_sync(&conn, &details) {
                            println!("🎬 TMDB ENHANCE: Warning - failed to cache movie: {e}");
                        }

                        // Update the movie record with TMDB ID
                        if let Err(e) = update_movie_tmdb_id_sync(
                            &conn,
                            &movie.title,
                            movie.year.map(|y| y as i32),
                            search_result.id,
                        ) {
                            println!("🎬 TMDB ENHANCE: Warning - failed to update TMDB ID: {e}");
                        }
                    }

                    Ok(create_enhanced_movie_from_details_with_director(
                        movie,
                        &details,
                        director,
                        friend_count,
                        friend_list,
                    ))
                }
                Err(e) => {
                    println!(
                        "🎬 TMDB ENHANCE: Failed to get details for '{}': {}",
                        movie.title, e
                    );
                    Ok(create_fallback_movie(movie, friend_count, friend_list))
                }
            }
        }
        None => {
            println!("🎬 TMDB ENHANCE: No TMDB match found for '{}'", movie.title);
            Ok(create_fallback_movie(movie, friend_count, friend_list))
        }
    }
}

// Convert watchlist movies to Movie structs with friend count visualization
fn enhance_movies_basic(watchlist_movies: Vec<(WatchlistMovie, u32, Vec<String>)>) -> Vec<Movie> {
    watchlist_movies
        .into_iter()
        .enumerate()
        .map(|(i, (movie, friend_count, friend_list))| {
            // Create a visual representation based on friend count
            let friend_visual = create_friend_visual(friend_count);

            Movie {
                id: i as u32, // Use index as temporary ID
                title: movie.title.clone(),
                year: movie.year.unwrap_or(0),
                poster_path: movie.poster_url.clone(),
                overview: Some(format!(
                    "Available on Letterboxd: https://letterboxd.com/film/{}/",
                    movie
                        .letterboxd_slug
                        .as_deref()
                        .unwrap_or(&movie.title.to_lowercase().replace(' ', "-"))
                )),
                rating: None, // TODO: Could enhance with TMDB data
                friend_count,
                friend_visual,
                friend_list,
                genre: None,          // TODO: Add genre from TMDB
                director: None,       // TODO: Add director from TMDB
                average_rating: None, // TODO: Add from TMDB
                letterboxd_slug: movie.letterboxd_slug.clone(),
            }
        })
        .collect()
}

// Create creative visual representation of friend count
fn create_friend_visual(count: u32) -> String {
    match count {
        0 => "".to_string(),                          // Should not happen with ANY logic
        1 => "👤".to_string(),                        // Single person
        2 => "👥".to_string(),                        // Two people
        3 => "👥👤".to_string(),                      // Three people
        4 => "👥👥".to_string(),                      // Four people
        5 => "👥👥👤".to_string(),                    // Five people
        6 => "👥👥👥".to_string(),                    // Six people
        7 => "👥👥👥👤".to_string(),                  // Seven people
        8 => "👥👥👥👥".to_string(),                  // Eight people
        9 => "👥👥👥👥👤".to_string(),                // Nine people
        10 => "👥👥👥👥👥".to_string(),               // Ten people
        n if n <= 15 => format!("👥👥👥👥👥+ ({n})"), // More than 10
        n if n <= 25 => format!("🎭🎭🎭 ({n})"),      // Theater masks for large groups
        n if n <= 50 => format!("🏟️ ({n})"),          // Stadium for very large groups
        n => format!("🌍 ({n})"),                     // Globe for massive groups
    }
}

// Check watchlist sizes before full comparison
#[tauri::command]
async fn check_watchlist_sizes(
    main_username: String,
    friend_usernames: Vec<String>,
) -> Result<Vec<(String, usize)>, String> {
    let mut sizes = Vec::new();

    // Check main user's watchlist size
    let main_size = get_watchlist_size(&main_username).await?;
    sizes.push((main_username, main_size));

    // Check friends' watchlist sizes
    for friend_username in friend_usernames {
        let friend_size = get_watchlist_size(&friend_username).await?;
        sizes.push((friend_username, friend_size));
    }

    Ok(sizes)
}

// Get approximate watchlist size by checking first few pages
async fn get_watchlist_size(username: &str) -> Result<usize, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(10))
        .https_only(true) // Enforce HTTPS-only connections
        .build()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;

    let url = format!("https://letterboxd.com/{username}/watchlist/");
    // Security Note: Username in URL is public Letterboxd profile identifier, not sensitive data
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch watchlist: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let html_content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {e}"))?;

    // Use the same movie extraction logic as the main scraper to be consistent
    let movies_on_page = extract_movies_from_html_text(&html_content).len();

    println!("DEBUG: get_watchlist_size: found {movies_on_page} movies on first page");

    // If we have 28 movies (full page), check if there are more pages
    if movies_on_page >= 28 {
        // Check if there's a "next page" link or pagination
        if has_next_page_in_html(&html_content) {
            // If there's pagination, we need to estimate the total
            // Try to find page numbers in the HTML
            let re = regex::Regex::new(r"/watchlist/page/(\d+)/").unwrap();
            let mut max_page = 1;

            for captures in re.captures_iter(&html_content) {
                if let Ok(page_num) = captures[1].parse::<u32>() {
                    max_page = max_page.max(page_num);
                }
            }

            println!("DEBUG: get_watchlist_size: detected max page {max_page}");

            // If we found pagination, estimate total movies
            if max_page > 1 {
                // Conservative estimate: (max_page - 1) * 28 + movies_on_first_page
                // This might slightly underestimate, but it's safer
                let estimated_total = ((max_page - 1) as usize * 28) + movies_on_page;
                println!("DEBUG: get_watchlist_size: estimated total {estimated_total}");
                return Ok(estimated_total);
            } else {
                // No pagination detected but has "next" link - assume at least 2 pages
                let estimated_total = 28 + movies_on_page; // Conservative estimate
                println!(
                    "DEBUG: get_watchlist_size: estimated total (no pagination) {estimated_total}"
                );
                return Ok(estimated_total);
            }
        }
    }

    // If no pagination or small watchlist, return actual count
    println!("DEBUG: get_watchlist_size: small watchlist, actual count {movies_on_page}");
    Ok(movies_on_page)
}

// AI Generated: GitHub Copilot - 2025-08-02
#[command]
async fn get_database_info() -> Result<String, String> {
    let db_path = get_database_path()?;
    let mut info = format!("Database path: {db_path:?}\n");

    if !db_path.exists() {
        info.push_str("❌ Database file does not exist\n");
        return Ok(info);
    }

    let file_size = std::fs::metadata(&db_path)
        .map_err(|e| format!("Failed to get file metadata: {e}"))?
        .len();

    info.push_str(&format!(
        "📊 Database size: {} bytes ({:.1} KB)\n",
        file_size,
        file_size as f64 / 1024.0
    ));

    // Connect to database and get table info
    match Connection::open(&db_path) {
        Ok(conn) => {
            // Check friend_watchlists table
            if let Ok(count) = conn.query_row("SELECT COUNT(*) FROM friend_watchlists", [], |row| {
                row.get::<_, i64>(0)
            }) {
                info.push_str(&format!("🎬 Movies in cache: {count}\n"));
            }

            // Check friends table
            if let Ok(count) = conn.query_row("SELECT COUNT(*) FROM friends", [], |row| {
                row.get::<_, i64>(0)
            }) {
                info.push_str(&format!("👥 Friends in database: {count}\n"));
            }

            // Check for TMDB data
            if let Ok(count) = conn.query_row(
                "SELECT COUNT(*) FROM friend_watchlists WHERE poster_url IS NOT NULL",
                [],
                |row| row.get::<_, i64>(0),
            ) {
                info.push_str(&format!("🖼️ Movies with posters: {count}\n"));
            }
        }
        Err(e) => {
            info.push_str(&format!("❌ Failed to connect to database: {e}\n"));
        }
    }

    Ok(info)
}

// AI Generated: GitHub Copilot - 2025-08-01
#[command]
async fn get_letterboxd_watchlist_count_cmd(username: String) -> Result<usize, String> {
    get_letterboxd_watchlist_count(&username).await
}

// AI Generated: GitHub Copilot - 2025-08-01
#[command]
async fn is_watchlist_cache_fresh_with_count_check_cmd(
    friend_username: String,
    max_age_hours: u64,
) -> Result<bool, String> {
    is_watchlist_cache_fresh_with_count_check(friend_username, max_age_hours).await
}

// AI Generated: GitHub Copilot - 2025-01-23
#[tauri::command]
async fn clear_movie_cache(movie_title: String) -> Result<String, String> {
    let app_data_dir =
        get_app_data_dir().map_err(|e| format!("Failed to get app data dir: {e}"))?;
    let db_path = app_data_dir.join("friends.db");

    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open database: {e}"))?;

    println!("🗑️ CLEAR CACHE: Clearing cache for movie '{movie_title}'");

    // Clear TMDB ID from friend_watchlists table (this will force a fresh TMDB lookup)
    let watchlist_updated = conn
        .execute(
            "UPDATE friend_watchlists SET tmdb_id = NULL WHERE movie_title = ?1",
            [&movie_title],
        )
        .map_err(|e| format!("Failed to clear cached TMDB data: {e}"))?;

    println!(
        "🗑️ CLEAR CACHE: Updated {watchlist_updated} rows in friend_watchlists for '{movie_title}'"
    );

    Ok(format!(
        "Cleared cache for movie: {movie_title} (updated {watchlist_updated} watchlist entries)"
    ))
}

fn main() {
    // Log application startup and data directory location
    if let Ok(data_dir) = get_app_data_dir() {
        debug_log!("🚀 BoxdBuddies starting up");
        debug_log!("📁 App data directory: {:?}", data_dir);
        debug_log!("📊 Database location: {:?}", data_dir.join("friends.db"));
        debug_log!(
            "⚙️  Preferences location: {:?}",
            data_dir.join("preferences.json")
        );
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scrape_letterboxd_profile,
            scrape_letterboxd_friends,
            compare_watchlists,
            check_watchlist_sizes,
            save_user_preferences,
            load_user_preferences,
            get_sync_info,
            get_friends_from_database,
            get_friends_with_watchlist_counts,
            save_friends_to_database,
            get_cached_watchlist,
            save_watchlist_to_cache,
            get_friend_sync_status,
            is_watchlist_cache_fresh,
            get_database_info, // Add diagnostic command
            get_letterboxd_watchlist_count_cmd,
            is_watchlist_cache_fresh_with_count_check_cmd,
            save_window_position,
            get_saved_window_position,
            set_always_on_top,
            set_window_focus,
            clear_movie_cache
        ])
        .setup(|app| {
            // Get the main window - first we need to get the handle
            let app_handle = app.handle();

            tauri::async_runtime::spawn(async move {
                // Get the main window after spawn to avoid borrowing issues
                if let Some(main_window) = app_handle.get_window("main") {
                    // Restore saved window position
                    if let Ok(Some((x, y, width, height))) = get_saved_window_position().await {
                        debug_log!(
                            "🪟 Restoring window position: x={}, y={}, width={}, height={}",
                            x,
                            y,
                            width,
                            height
                        );
                        let _ = main_window.set_position(tauri::Position::Physical(
                            tauri::PhysicalPosition { x, y },
                        ));
                        let _ = main_window
                            .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }));
                    } else {
                        debug_log!("🪟 No saved window position found, using defaults");
                        // Center the window if no saved position
                        let _ = main_window.center();
                    }

                    // Set up window event listeners for position and size changes with debouncing
                    let window_clone = main_window.clone();
                    let save_timer = std::sync::Arc::new(std::sync::Mutex::new(
                        None::<tokio::task::JoinHandle<()>>,
                    ));

                    main_window.on_window_event(move |event| {
                        match event {
                            tauri::WindowEvent::Moved(position) => {
                                // AI Generated: GitHub Copilot - 2025-08-02
                                // Debounce window position saving to prevent spam during drag
                                let x = position.x;
                                let y = position.y;
                                let window_clone_inner = window_clone.clone();
                                let timer_clone = save_timer.clone();

                                tauri::async_runtime::spawn(async move {
                                    // Cancel previous timer if it exists
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        if let Some(handle) = timer_guard.take() {
                                            handle.abort();
                                        }
                                    }

                                    // Create new debounced save timer (500ms delay)
                                    let new_handle = tokio::spawn(async move {
                                        tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                            .await;
                                        if let Ok(size) = window_clone_inner.inner_size() {
                                            let _ =
                                                save_window_position(x, y, size.width, size.height)
                                                    .await;
                                        }
                                    });

                                    // Store the new timer handle
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        *timer_guard = Some(new_handle);
                                    }
                                });
                            }
                            tauri::WindowEvent::Resized(size) => {
                                // AI Generated: GitHub Copilot - 2025-08-02
                                // Debounce window size saving to prevent spam during resize
                                let width = size.width;
                                let height = size.height;
                                let window_clone_inner = window_clone.clone();
                                let timer_clone = save_timer.clone();

                                tauri::async_runtime::spawn(async move {
                                    // Cancel previous timer if it exists
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        if let Some(handle) = timer_guard.take() {
                                            handle.abort();
                                        }
                                    }

                                    // Create new debounced save timer (500ms delay)
                                    let new_handle = tokio::spawn(async move {
                                        tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                            .await;
                                        if let Ok(position) = window_clone_inner.outer_position() {
                                            let _ = save_window_position(
                                                position.x, position.y, width, height,
                                            )
                                            .await;
                                        }
                                    });

                                    // Store the new timer handle
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        *timer_guard = Some(new_handle);
                                    }
                                });
                            }
                            _ => {}
                        }
                    });
                } else {
                    debug_log!("🪟 Warning: Could not find main window");
                }
            });

            // AI Generated: GitHub Copilot - 2025-01-29
            // Removed hardcoded test data creation to allow real friend discovery
            println!(
                "🚀 APP SETUP: Application started - ready for real Letterboxd friend discovery"
            );
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
