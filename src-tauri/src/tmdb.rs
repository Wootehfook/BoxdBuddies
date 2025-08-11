/*
 * TMDB integration module
 * AI Generated: GitHub Copilot - 2025-08-10 (extracted from main.rs)
 */

use chrono::Utc;
use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};

use crate::{
    db::get_database_path,
    models::{create_friend_visual, Movie, WatchlistMovie},
};

// AI Generated: GitHub Copilot - 2025-08-11
// Lightweight year parsing helpers (previously in main)
fn safe_parse_year_from_date(date: &str) -> Option<i32> {
    if date.len() >= 4 { date[0..4].parse::<i32>().ok().filter(|y| (1800..=2100).contains(y)) } else { None }
}

fn safe_parse_year_from_date_u32(date: &str) -> Option<u32> {
    safe_parse_year_from_date(date).and_then(|y| if y >= 0 { Some(y as u32) } else { None })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbSearchResult {
    pub id: i32,
    pub title: String,
    pub original_title: String,
    pub overview: String,
    pub release_date: Option<String>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub vote_average: Option<f64>,
    pub vote_count: i32,
    pub popularity: f64,
    pub genre_ids: Vec<i32>,
    pub original_language: String,
    pub adult: bool,
    pub video: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbSearchResponse {
    pub page: i32,
    pub results: Vec<TmdbSearchResult>,
    pub total_pages: i32,
    pub total_results: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbGenre {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbCredits {
    pub id: i32,
    pub cast: Vec<TmdbCastMember>,
    pub crew: Vec<TmdbCrewMember>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbCastMember {
    pub id: i32,
    pub name: String,
    pub character: String,
    pub order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbCrewMember {
    pub id: i32,
    pub name: String,
    pub job: String,
    pub department: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbMovieDetails {
    pub id: i32,
    pub title: String,
    pub original_title: String,
    pub overview: String,
    pub release_date: Option<String>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub vote_average: Option<f64>,
    pub vote_count: i32,
    pub popularity: f64,
    pub runtime: Option<i32>,
    pub budget: Option<i64>,
    pub revenue: Option<i64>,
    pub genres: Vec<TmdbGenre>,
    pub original_language: String,
    pub status: String,
    pub tagline: Option<String>,
    pub director: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TmdbMovieCache {
    pub tmdb_id: i32,
    pub title: String,
    pub original_title: Option<String>,
    pub release_date: Option<String>,
    pub year: Option<i32>,
    pub overview: Option<String>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub vote_average: Option<f64>,
    pub vote_count: Option<i32>,
    pub popularity: Option<f64>,
    pub genre_ids: Option<String>,
    pub runtime: Option<i32>,
    pub budget: Option<i64>,
    pub revenue: Option<i64>,
    pub original_language: Option<String>,
    pub director: Option<String>,
    pub last_updated: String,
    pub created_at: String,
}

// -- Public API --
pub async fn enhance_movies_with_tmdb(
    watchlist_movies: Vec<(WatchlistMovie, u32, Vec<String>)>,
    api_key: &str,
) -> Result<Vec<Movie>, String> {
    let mut enhanced = Vec::new();
    let total = watchlist_movies.len();
    println!("🎬 TMDB: Enhancing {total} movies with TMDB data");
    for (i, (movie, friend_count, friend_list)) in watchlist_movies.into_iter().enumerate() {
        println!(
            "🎬 TMDB: Processing movie {}/{}: '{}'",
            i + 1,
            total,
            movie.title
        );
        if i > 0 && i % 39 == 0 {
            // crude rate limit
            println!("🎬 TMDB: Rate limiting - waiting 1 second");
            tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        }
        match enhance_movie_with_tmdb_standalone(api_key, &movie, friend_count, friend_list.clone())
            .await
        {
            Ok(m) => enhanced.push(m),
            Err(e) => {
                println!(
                    "🎬 TMDB: Failed to enhance '{}': {}, using fallback",
                    movie.title, e
                );
                enhanced.push(create_fallback_movie(&movie, friend_count, friend_list));
            }
        }
    }
    println!("🎬 TMDB: Successfully enhanced {} movies", enhanced.len());
    Ok(enhanced)
}

// -- Internal helpers --
async fn enhance_movie_with_tmdb_standalone(
    api_key: &str,
    movie: &WatchlistMovie,
    friend_count: u32,
    friend_list: Vec<String>,
) -> Result<Movie, String> {
    // Persistent cache lookup
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
        println!(
            "🔥 DIRECTOR DEBUG: Movie '{}' - cached director: {:?}",
            movie.title, cached.director
        );
        if cached.director.is_some() {
            return Ok(create_enhanced_movie_from_cache(
                movie,
                &cached,
                friend_count,
                friend_list,
            ));
        } else {
            println!(
                "🔥 DIRECTOR REFRESH: Director missing for '{}', refreshing...",
                movie.title
            );
        }
    }

    // Secondary: friend_watchlists TMDB ID
    let cached_tmdb_id = {
        let db_path = get_database_path()?;
        let conn =
            Connection::open(&db_path).map_err(|e| format!("Failed to open database: {e}"))?;
        get_movie_tmdb_id_sync(&conn, &movie.title, movie.year.map(|y| y as i32))
            .map_err(|e| format!("Database error: {e}"))?
    };
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

    println!(
        "🎬 TMDB SEARCH DEBUG: Movie '{}' has year: {:?}",
        movie.title, movie.year
    );
    match search_tmdb_movie(api_key, &movie.title, movie.year.map(|y| y as i32)).await? {
        Some(search_result) => match get_tmdb_movie_details(api_key, search_result.id).await {
            Ok(mut details) => {
                let director = match get_tmdb_movie_credits(api_key, search_result.id).await {
                    Ok(d) => d,
                    Err(e) => {
                        println!(
                            "🎬 TMDB ENHANCE: Credits failed for '{}': {}",
                            movie.title, e
                        );
                        None
                    }
                };
                details.director = director.clone();
                {
                    let db_path = get_database_path()?;
                    let conn = Connection::open(&db_path)
                        .map_err(|e| format!("Failed to open database: {e}"))?;
                    if let Err(e) = cache_tmdb_movie_sync(&conn, &details) {
                        println!("🎬 TMDB: Cache warn: {e}");
                    }
                    if let Err(e) = update_movie_tmdb_id_sync(
                        &conn,
                        &movie.title,
                        movie.year.map(|y| y as i32),
                        search_result.id,
                    ) {
                        println!("🎬 TMDB: Update TMDB ID warn: {e}");
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
                    "🎬 TMDB ENHANCE: Details failed for '{}': {}",
                    movie.title, e
                );
                Ok(create_fallback_movie(movie, friend_count, friend_list))
            }
        },
        None => {
            println!("🎬 TMDB ENHANCE: No TMDB match for '{}'", movie.title);
            Ok(create_fallback_movie(movie, friend_count, friend_list))
        }
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

async fn search_tmdb_movie(
    api_key: &str,
    title: &str,
    year: Option<i32>,
) -> Result<Option<TmdbSearchResult>, String> {
    let client = reqwest::Client::builder()
        .user_agent("BoxdBuddies/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;
    let mut query_params = vec![
        ("api_key", api_key),
        ("query", title),
        ("include_adult", "false"),
    ];
    let year_buf;
    if let Some(y) = year {
        year_buf = y.to_string();
        query_params.push(("year", &year_buf));
    }
    let response = client
        .get("https://api.themoviedb.org/3/search/movie")
        .query(&query_params)
        .send()
        .await
        .map_err(|e| format!("TMDB search request failed: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("TMDB API error: {}", response.status()));
    }
    let search_response: TmdbSearchResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse TMDB search: {e}"))?;
    if search_response.results.is_empty() {
        return Ok(None);
    }
    let mut best_match = &search_response.results[0];
    if let Some(target_year) = year {
        for result in &search_response.results {
            if let Some(ref rd) = result.release_date {
                if let Some(ry) = safe_parse_year_from_date(rd) {
                    if ry == target_year {
                        best_match = result;
                        break;
                    }
                }
            }
        }
    } else {
        let mut candidates: Vec<&TmdbSearchResult> = search_response.results.iter().collect();
        candidates.retain(|r| {
            let tl = r.title.to_lowercase();
            !tl.contains("making of")
                && !tl.contains("behind the scenes")
                && !tl.contains("exploring the set")
                && !tl.contains("documentary")
                && r.title.to_lowercase() == title.to_lowercase()
        });
        if candidates.is_empty() {
            candidates = search_response.results.iter().collect();
            candidates.retain(|r| {
                let tl = r.title.to_lowercase();
                !tl.contains("making of")
                    && !tl.contains("behind the scenes")
                    && !tl.contains("exploring the set")
            });
        }
        if !candidates.is_empty() {
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
    Ok(Some(best_match.clone()))
}

async fn get_tmdb_movie_details(api_key: &str, tmdb_id: i32) -> Result<TmdbMovieDetails, String> {
    let client = reqwest::Client::builder()
        .user_agent("BoxdBuddies/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;
    let url = format!("https://api.themoviedb.org/3/movie/{tmdb_id}");
    let response = client
        .get(&url)
        .query(&[("api_key", api_key)])
        .send()
        .await
        .map_err(|e| format!("TMDB details request failed: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("TMDB API error: {}", response.status()));
    }
    let details: TmdbMovieDetails = response
        .json()
        .await
        .map_err(|e| format!("Parse TMDB details: {e}"))?;
    Ok(details)
}

async fn get_tmdb_movie_credits(api_key: &str, tmdb_id: i32) -> Result<Option<String>, String> {
    let client = reqwest::Client::builder()
        .user_agent("BoxdBuddies/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .https_only(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;
    let url = format!("https://api.themoviedb.org/3/movie/{tmdb_id}/credits");
    let response = client
        .get(&url)
        .query(&[("api_key", api_key)])
        .send()
        .await
        .map_err(|e| format!("TMDB credits request failed: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("TMDB credits status: {}", response.status()));
    }
    let credits: TmdbCredits = response
        .json()
        .await
        .map_err(|e| format!("Parse TMDB credits: {e}"))?;
    Ok(credits
        .crew
        .iter()
        .find(|m| m.job == "Director")
        .map(|m| m.name.clone()))
}

fn cache_tmdb_movie_sync(conn: &Connection, tmdb_movie: &TmdbMovieDetails) -> SqliteResult<()> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let year = tmdb_movie
        .release_date
        .as_ref()
        .filter(|d| !d.is_empty() && d.len() >= 4)
        .and_then(|d| safe_parse_year_from_date(d));
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
    Ok(())
}

fn get_cached_tmdb_movie_by_title_sync(
    conn: &Connection,
    title: &str,
    year: Option<i32>,
) -> SqliteResult<Option<TmdbMovieCache>> {
    if let Some(y) = year {
        let mut stmt = conn.prepare("SELECT tmdb_id, title, original_title, release_date, year, overview, poster_path, backdrop_path, vote_average, vote_count, popularity, genre_ids, runtime, budget, revenue, original_language, director, last_updated, created_at FROM tmdb_movies WHERE (title = ?1 OR original_title = ?1) AND year = ?2 LIMIT 1")?;
        let mut rows = stmt.query_map([title, &y.to_string()], row_to_cache)?;
        if let Some(movie) = rows.next() {
            return Ok(Some(movie?));
        }
    } else {
        let mut stmt = conn.prepare("SELECT tmdb_id, title, original_title, release_date, year, overview, poster_path, backdrop_path, vote_average, vote_count, popularity, genre_ids, runtime, budget, revenue, original_language, director, last_updated, created_at FROM tmdb_movies WHERE (title = ?1 OR original_title = ?1) LIMIT 1")?;
        let mut rows = stmt.query_map([title], row_to_cache)?;
        if let Some(movie) = rows.next() {
            return Ok(Some(movie?));
        }
    }
    Ok(None)
}

fn get_cached_tmdb_movie_sync(
    conn: &Connection,
    tmdb_id: i32,
) -> SqliteResult<Option<TmdbMovieCache>> {
    let mut stmt = conn.prepare("SELECT tmdb_id, title, original_title, release_date, year, overview, poster_path, backdrop_path, vote_average, vote_count, popularity, genre_ids, runtime, budget, revenue, original_language, director, last_updated, created_at FROM tmdb_movies WHERE tmdb_id = ?1")?;
    let mut iter = stmt.query_map([tmdb_id], row_to_cache)?;
    iter.next().transpose()
}

fn get_movie_tmdb_id_sync(
    conn: &Connection,
    title: &str,
    year: Option<i32>,
) -> SqliteResult<Option<i32>> {
    let mut stmt = conn.prepare("SELECT tmdb_id FROM friend_watchlists WHERE movie_title = ?1 AND movie_year = ?2 AND tmdb_id IS NOT NULL LIMIT 1")?;
    let mut id_iter = stmt.query_map(
        [title, &year.map(|y| y.to_string()).unwrap_or_default()],
        |row| row.get::<_, i32>(0),
    )?;
    id_iter.next().transpose()
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

fn row_to_cache(row: &rusqlite::Row<'_>) -> rusqlite::Result<TmdbMovieCache> {
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
    let genre = if let Some(genre_ids_str) = &cached.genre_ids {
        match serde_json::from_str::<Vec<i32>>(genre_ids_str) {
            Ok(ids) => {
                let names: Vec<String> = ids
                    .iter()
                    .filter_map(|id| tmdb_genre_id_to_name(*id))
                    .collect();
                if names.is_empty() {
                    None
                } else {
                    Some(names.join(", "))
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
        director: cached.director.clone(),
        average_rating: cached.vote_average,
        letterboxd_slug: movie.letterboxd_slug.clone(),
    }
}

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
        .and_then(|d| safe_parse_year_from_date_u32(d))
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
        director: director.clone(),
        average_rating: details.vote_average,
        letterboxd_slug: movie.letterboxd_slug.clone(),
    }
}

fn tmdb_genre_id_to_name(id: i32) -> Option<String> {
    match id {
        28 => Some("Action".into()),
        12 => Some("Adventure".into()),
        16 => Some("Animation".into()),
        35 => Some("Comedy".into()),
        80 => Some("Crime".into()),
        99 => Some("Documentary".into()),
        18 => Some("Drama".into()),
        10751 => Some("Family".into()),
        14 => Some("Fantasy".into()),
        36 => Some("History".into()),
        27 => Some("Horror".into()),
        10402 => Some("Music".into()),
        9648 => Some("Mystery".into()),
        10749 => Some("Romance".into()),
        878 => Some("Science Fiction".into()),
        10770 => Some("TV Movie".into()),
        53 => Some("Thriller".into()),
        10752 => Some("War".into()),
        37 => Some("Western".into()),
        _ => None,
    }
}
