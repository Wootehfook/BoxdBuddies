/*
 * Tauri command handlers extracted from main.rs
 * AI Generated: GitHub Copilot - 2025-08-11
 */
use chrono::Utc;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::command;
// (cache freshness & count commands are exposed directly; internal helpers removed from main)
use crate::{
    db::{get_database_path, init_database, get_app_data_dir},
    models::{enhance_movies_basic, CachedWatchlistMovie, CompareResult, WatchlistMovie, LetterboxdUser},
    scrape::{extract_movies_from_html_text, find_common_movies, scrape_user_watchlist_with_limit, scrape_letterboxd_profile_internal, extract_friends_from_html, has_next_page_in_html},
    tmdb,
};

pub use crate::preferences::{
    get_saved_window_position, load_user_preferences, save_user_preferences, save_window_position,
    set_always_on_top, set_window_focus,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LetterboxdFriend {
    pub username: String,
    #[serde(rename = "displayName")] pub display_name: Option<String>,
    #[serde(rename = "avatarUrl")] pub avatar_url: Option<String>,
    #[serde(rename = "isSelected")] pub is_selected: bool,
    #[serde(skip_serializing_if = "Option::is_none")] pub last_synced: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FriendSyncStatus {
    pub friend_username: String,
    pub last_watchlist_sync: Option<String>,
    pub watchlist_count: i32,
    pub sync_status: String,
    pub last_error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncInfo {
    #[serde(rename = "lastSyncDate")] pub last_sync_date: Option<String>,
    #[serde(rename = "friendsCount")] pub friends_count: u32,
}

#[command]
pub async fn get_sync_info() -> Result<SyncInfo, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    let mut stmt = conn
        .prepare("SELECT last_sync_date, friends_count FROM sync_info WHERE id = 1")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;
    let sync_info = stmt
        .query_row([], |row| {
            Ok(SyncInfo { last_sync_date: row.get(0)?, friends_count: row.get(1)? })
        })
        .map_err(|e| format!("Failed to get sync info: {e}"))?;
    Ok(sync_info)
}

#[command]
pub async fn get_friends_from_database(
    main_username: Option<String>,
) -> Result<Vec<LetterboxdFriend>, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    let mut stmt = conn.prepare("SELECT username, display_name, avatar_url, last_updated FROM friends ORDER BY username")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;
    let friends_iter = stmt.query_map([], |row| {
        Ok(LetterboxdFriend { username: row.get(0)?, display_name: row.get(1)?, avatar_url: row.get(2)?, is_selected: false, last_synced: row.get(3)? })
    }).map_err(|e| format!("Failed to query friends: {e}"))?;
    let mut friends = Vec::new();
    for friend_result in friends_iter { let friend = friend_result.map_err(|e| format!("Failed to process friend: {e}"))?; if let Some(ref main_user) = main_username { if friend.username.eq_ignore_ascii_case(main_user) { continue; } } friends.push(friend);}    Ok(friends)
}

#[command]
pub async fn get_friends_with_watchlist_counts() -> Result<Vec<serde_json::Value>, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    let mut stmt = conn.prepare("SELECT f.username, f.display_name, f.avatar_url, f.last_updated, COUNT(fw.id) as watchlist_count FROM friends f LEFT JOIN friend_watchlists fw ON f.username = fw.friend_username GROUP BY f.username, f.display_name, f.avatar_url, f.last_updated ORDER BY f.username")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;
    let friends_iter = stmt.query_map([], |row| { let watchlist_count: i64 = row.get(4).unwrap_or(0); Ok(serde_json::json!({"username": row.get::<_, String>(0)?, "displayName": row.get::<_, Option<String>>(1)?, "avatarUrl": row.get::<_, Option<String>>(2)?, "lastSynced": row.get::<_, Option<String>>(3)?, "watchlistCount": watchlist_count as u32 }))}).map_err(|e| format!("Failed to query friends: {e}"))?;    let mut friends = Vec::new(); for friend_result in friends_iter { friends.push(friend_result.map_err(|e| format!("Failed to process friend: {e}"))?); } Ok(friends)
}

#[command]
pub async fn save_friends_to_database(friends: Vec<LetterboxdFriend>) -> Result<(), String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    let tx = conn.unchecked_transaction().map_err(|e| format!("Failed to begin transaction: {e}"))?;
    let mut stmt = tx.prepare("INSERT OR REPLACE INTO friends (username, display_name, avatar_url, last_updated) VALUES (?1, ?2, ?3, ?4)")
        .map_err(|e| format!("Failed to prepare insert statement: {e}"))?;
    let now = Utc::now().to_rfc3339();
    let friends_count = friends.len();
    for friend in friends { stmt.execute([ friend.username.as_str(), friend.display_name.as_deref().unwrap_or(""), friend.avatar_url.as_deref().unwrap_or(""), &now, ]).map_err(|e| format!("Failed to insert friend: {e}"))?; }
    drop(stmt);
    tx.execute("UPDATE sync_info SET last_sync_date = ?1, friends_count = ?2 WHERE id = 1", [&now, &friends_count.to_string()])
        .map_err(|e| format!("Failed to update sync info: {e}"))?;
    tx.commit().map_err(|e| format!("Failed to commit transaction: {e}"))?;
    Ok(())
}

#[command]
pub async fn get_cached_watchlist(friend_username: String) -> Result<Vec<CachedWatchlistMovie>, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    let mut stmt = conn.prepare("SELECT id, friend_username, movie_title, movie_year, letterboxd_slug, tmdb_id, date_added, last_updated FROM friend_watchlists WHERE friend_username = ?1 ORDER BY last_updated DESC")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;
    let watchlist_iter = stmt.query_map([friend_username], |row| {
        let movie_year: Option<i32> = match row.get::<_, Option<String>>(3)? { Some(year_str) => year_str.parse().ok(), None => None };
        Ok(CachedWatchlistMovie { id: row.get(0)?, friend_username: row.get(1)?, movie_title: row.get(2)?, movie_year, letterboxd_slug: row.get(4)?, tmdb_id: row.get(5)?, date_added: row.get(6)?, last_updated: row.get(7)?, })
    }).map_err(|e| format!("Failed to query watchlist: {e}"))?;
    let mut watchlist = Vec::new();
    for movie_result in watchlist_iter { match movie_result { Ok(movie) => watchlist.push(movie), Err(e) => { eprintln!("Error processing cached movie: {e}"); return Err(format!("Failed to process cached movie: {e}")); } } }
    Ok(watchlist)
}

#[command]
pub async fn save_watchlist_to_cache(friend_username: String, movies: Vec<WatchlistMovie>) -> Result<(), String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    let now = Utc::now().to_rfc3339();
    {
        let friend_tx = conn.unchecked_transaction().map_err(|e| format!("Failed to start friend transaction: {e}"))?;
        friend_tx.execute("INSERT OR IGNORE INTO friends (username, display_name, last_updated) VALUES (?1, ?1, ?2)", [&friend_username, &now])
            .map_err(|e| format!("Failed to ensure friend exists: {e}"))?;
        friend_tx.commit().map_err(|e| format!("Failed to commit friend transaction: {e}"))?;
    }
    const BATCH_SIZE: usize = 25;
    let new_slugs: std::collections::HashSet<&str> = movies.iter().filter_map(|m| m.letterboxd_slug.as_deref()).collect();
    if !new_slugs.is_empty() {
        let placeholders = new_slugs.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let delete_query = format!("DELETE FROM friend_watchlists WHERE friend_username = ? AND letterboxd_slug NOT IN ({placeholders})");
        let mut params: Vec<&dyn rusqlite::ToSql> = vec![&friend_username];
        for slug in &new_slugs { params.push(slug); }
        conn.execute(&delete_query, params.as_slice()).map_err(|e| format!("Failed to remove old movies: {e}"))?;
    }
    for (batch_num, batch) in movies.chunks(BATCH_SIZE).enumerate() {
        let tx = conn.unchecked_transaction().map_err(|e| format!("Failed to start batch transaction: {e}"))?;
        {
            let mut stmt = tx.prepare("INSERT OR REPLACE INTO friend_watchlists (friend_username, movie_title, movie_year, letterboxd_slug, tmdb_id, date_added, last_updated) VALUES (?1, ?2, ?3, ?4, (SELECT tmdb_id FROM friend_watchlists WHERE friend_username = ?1 AND letterboxd_slug = ?4), COALESCE((SELECT date_added FROM friend_watchlists WHERE friend_username = ?1 AND letterboxd_slug = ?4), ?5), ?6)")
                .map_err(|e| format!("Failed to prepare insert statement: {e}"))?;
            for movie in batch {
                let year_str = movie.year.map(|y| y.to_string());
                stmt.execute(rusqlite::params![
                    &friend_username,
                    &movie.title,
                    &year_str.as_deref(),
                    &movie.letterboxd_slug,
                    &now,
                    &now,
                ]).map_err(|e| format!("Failed to insert movie '{}': {e}", movie.title))?;
            }
        }
        tx.commit().map_err(|e| format!("Failed to commit batch {batch_num}: {e}"))?;
    }
    Ok(())
}

#[command]
pub async fn compare_watchlists(
    main_username: String,
    friend_usernames: Vec<String>,
    tmdb_api_key: Option<String>,
) -> Result<CompareResult, String> {
    let main_watchlist = scrape_user_watchlist_with_limit(&main_username, true).await?;
    let mut friend_watchlists_with_names: Vec<(String, Vec<WatchlistMovie>)> = Vec::new();
    for friend_username in friend_usernames.iter() {
        match scrape_user_watchlist_with_limit(friend_username, true).await {
            Ok(wl) => friend_watchlists_with_names.push((friend_username.clone(), wl)),
            Err(e) => println!("⚠️ Failed to scrape friend '{friend_username}': {e}"),
        }
    }
    let common_movies = find_common_movies(&main_watchlist, &friend_watchlists_with_names);
    let enhanced_movies = if let Some(api_key) = tmdb_api_key { tmdb::enhance_movies_with_tmdb(common_movies, &api_key).await? } else { enhance_movies_basic(common_movies) };
    Ok(CompareResult { common_movies: enhanced_movies })
}

#[command]
pub async fn check_watchlist_sizes(
    main_username: String,
    friend_usernames: Vec<String>,
) -> Result<Vec<(String, usize)>, String> {
    let mut sizes = Vec::new();
    let main_size = get_watchlist_size(&main_username).await?; sizes.push((main_username, main_size));
    for friend_username in friend_usernames { let friend_size = get_watchlist_size(&friend_username).await?; sizes.push((friend_username, friend_size)); }
    Ok(sizes)
}

#[command]
pub async fn get_database_info() -> Result<String, String> {
    let db_path = get_database_path()?; let mut info = format!("Database path: {db_path:?}\n");
    if !db_path.exists() { info.push_str("❌ Database file does not exist\n"); return Ok(info); }
    let file_size = std::fs::metadata(&db_path).map_err(|e| format!("Failed to get file metadata: {e}"))?.len();
    info.push_str(&format!("📊 Database size: {} bytes ({:.1} KB)\n", file_size, file_size as f64 / 1024.0));
    match Connection::open(&db_path) { Ok(conn) => {
        if let Ok(count) = conn.query_row("SELECT COUNT(*) FROM friend_watchlists", [], |row| row.get::<_, i64>(0)) { info.push_str(&format!("🎬 Movies in cache: {count}\n")); }
        if let Ok(count) = conn.query_row("SELECT COUNT(*) FROM friends", [], |row| row.get::<_, i64>(0)) { info.push_str(&format!("👥 Friends in database: {count}\n")); }
        if let Ok(count) = conn.query_row("SELECT COUNT(*) FROM friend_watchlists WHERE poster_url IS NOT NULL", [], |row| row.get::<_, i64>(0)) { info.push_str(&format!("🖼️ Movies with posters: {count}\n")); }
    } Err(e) => info.push_str(&format!("❌ Failed to connect to database: {e}\n")), }
    Ok(info)
}

#[command]
pub async fn get_letterboxd_watchlist_count_cmd(username: String) -> Result<usize, String> {
    if username.trim().is_empty() || username.contains('/') || username.contains('\\') {
        return Err("Invalid username format".into());
    }
    let client = reqwest::Client::builder()
        .user_agent("BoxdBuddies/1.0")
        .timeout(std::time::Duration::from_secs(10))
        .https_only(true)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;
    let url = crate::build_letterboxd_url(vec![&username, "watchlist"]);
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch watchlist page: {e}"))?;
    if resp.status() == 404 {
        return Err("Watchlist not found for user".into());
    }
    if !resp.status().is_success() {
        return Err(format!(
            "HTTP error {} accessing watchlist",
            resp.status()
        ));
    }
    let html = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {e}"))?;
    let first_page = extract_movies_from_html_text(&html).len();
    if first_page < 25 { return Ok(first_page); }
    let mut total = first_page;
    let mut page = 2u32;
    while page <= 10 {
        let page_url = crate::build_letterboxd_url(vec![&username, "watchlist", "page", &page.to_string()]);
        match client.get(&page_url).send().await {
            Ok(r) if r.status().is_success() => {
                match r.text().await { Ok(p_html) => {
                    let c = extract_movies_from_html_text(&p_html).len();
                    if c == 0 { break; }
                    total += c; page += 1;
                }, Err(_) => break }
            }
            _ => break,
        }
    }
    Ok(total)
}

#[command]
pub async fn is_watchlist_cache_fresh_with_count_check_cmd(
    friend_username: String,
    max_age_hours: u64,
) -> Result<bool, String> {
    // AI Generated: GitHub Copilot - 2025-08-11
    // Make future Send by limiting rusqlite connection scope before awaits.
    if friend_username.trim().is_empty() { return Ok(false); }

    // Scope DB usage so connection & statement drop before network await.
    let (cached_count, last_updated_str_opt) = {
        let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
        let mut stmt = conn
            .prepare(
                "SELECT COUNT(*), MAX(last_updated) FROM friend_watchlists \
                 WHERE friend_username = ?1",
            )
            .map_err(|e| format!("Failed to prepare cache query: {e}"))?;
        let (count, last_updated): (i64, Option<String>) = stmt
            .query_row([&friend_username], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| format!("Failed to query cache: {e}"))?;
        (count, last_updated)
    }; // conn & stmt dropped here

    if cached_count == 0 { return Ok(false); }
    let last_updated_str = match last_updated_str_opt { Some(s) => s, None => return Ok(false) };
    let last_dt = chrono::DateTime::parse_from_rfc3339(&last_updated_str)
        .map_err(|e| format!("Failed to parse timestamp: {e}"))?
        .with_timezone(&Utc);
    if (Utc::now() - last_dt).num_hours() > max_age_hours as i64 { return Ok(false); }

    // Remote verification after DB objects dropped.
    let remote_count = get_letterboxd_watchlist_count_cmd(friend_username.clone()).await? as i64;
    Ok(remote_count == cached_count)
}

#[command]
pub async fn clear_movie_cache(movie_title: String) -> Result<String, String> {
    let app_data_dir = get_app_data_dir().map_err(|e| format!("Failed to get app data dir: {e}"))?; let db_path = app_data_dir.join("friends.db");
    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open database: {e}"))?;
    let watchlist_updated = conn.execute("UPDATE friend_watchlists SET tmdb_id = NULL WHERE movie_title = ?1", [&movie_title])
        .map_err(|e| format!("Failed to clear cached TMDB data: {e}"))?;
    Ok(format!("Cleared cache for movie: {movie_title} (updated {watchlist_updated} watchlist entries)"))
}

async fn get_watchlist_size(username: &str) -> Result<usize, String> {
    let url = crate::build_letterboxd_url(vec![username, "watchlist"]);
    let client = reqwest::Client::builder().user_agent("BoxdBuddies/1.0").https_only(true).build().map_err(|e| format!("HTTP client error: {e}"))?;
    let response = client.get(&url).send().await.map_err(|e| format!("Request failed: {e}"))?;
    if !response.status().is_success() { return Err(format!("HTTP error: {}", response.status())); }
    let html = response.text().await.map_err(|e| format!("Read error: {e}"))?;
    Ok(extract_movies_from_html_text(&html).len())
}

// removed root-level helpers; cache freshness handled by is_watchlist_cache_fresh_with_count_check_cmd

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn get_friend_sync_status(friend_username: String) -> Result<Option<FriendSyncStatus>, String> {
    let conn = init_database().map_err(|e| format!("Database error: {e}"))?;
    let mut stmt = conn.prepare("SELECT friend_username, last_watchlist_sync, watchlist_count, sync_status, last_error FROM friend_sync_status WHERE friend_username = ?1")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;
    let result = stmt.query_row([friend_username.clone()], |row| {
        Ok(FriendSyncStatus {
            friend_username: row.get(0)?,
            last_watchlist_sync: row.get(1)?,
            watchlist_count: row.get(2)?,
            sync_status: row.get(3)?,
            last_error: row.get(4)?,
        })
    });
    match result {
        Ok(status) => Ok(Some(status)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to query sync status: {e}")),
    }
}

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn scrape_letterboxd_profile(username: String) -> Result<LetterboxdUser, String> {
    scrape_letterboxd_profile_internal(&username).await
}

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn scrape_letterboxd_friends(username: String) -> Result<Vec<LetterboxdFriend>, String> {
    if username.trim().is_empty() || username.contains('/') || username.contains('\\') { return Err("Invalid username format".into()); }
    let client = reqwest::Client::builder().user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36").timeout(std::time::Duration::from_secs(30)).https_only(true).build().map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;
    let mut all = Vec::new(); let mut page = 1; let max_pages = 10; loop {
        let url = if page==1 { crate::build_letterboxd_url(vec![&username, "following"]) } else { crate::build_letterboxd_url(vec![&username, "following", "page", &page.to_string()]) };
        let resp = client.get(&url).send().await.map_err(|e| format!("Failed to fetch friends page {page}: {e}"))?; if resp.status()==404 { if page==1 { return Err("Following page not found for user".into()); } else { break; } }
        if !resp.status().is_success() { return Err(format!("HTTP error {}: Failed to access following page {page}", resp.status())); }
        let html = resp.text().await.map_err(|e| format!("Failed to read response for page {page}: {e}"))?; let doc = scraper::Html::parse_document(&html);
        let page_friends = extract_friends_from_html(&doc)?; if page_friends.is_empty() { break; }
        all.extend(page_friends); if !has_next_page_in_html(&html) || page >= max_pages { break; } page +=1; std::thread::sleep(std::time::Duration::from_millis(500));
    }
    if all.is_empty() { return Err("No friends found or following page is private".into()); }
    if let Err(e) = save_friends_to_database(all.clone()).await { eprintln!("🚨 Error saving friends to database: {e}"); return Err(format!("Failed to save friends to database: {e}")); }
    Ok(all)
}
