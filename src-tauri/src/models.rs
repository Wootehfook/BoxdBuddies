/*
 * Domain models & simple utilities
 * AI Generated: GitHub Copilot - 2025-08-11
 */
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WatchlistMovie {
    pub title: String,
    pub year: Option<u32>,
    pub letterboxd_slug: Option<String>,
    pub poster_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CachedWatchlistMovie {
    pub id: i32,
    pub friend_username: String,
    pub movie_title: String,
    pub movie_year: Option<i32>,
    pub letterboxd_slug: Option<String>,
    pub tmdb_id: Option<i32>,
    pub date_added: String,
    pub last_updated: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Movie {
    pub id: u32,
    pub title: String,
    pub year: u32,
    pub poster_path: Option<String>,
    pub overview: Option<String>,
    pub rating: Option<f64>,
    pub friend_count: u32,
    pub friend_visual: String,
    pub friend_list: Vec<String>,
    pub genre: Option<String>,
    pub director: Option<String>,
    pub average_rating: Option<f64>,
    pub letterboxd_slug: Option<String>,
}

// AI Generated: GitHub Copilot - 2025-08-11
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct UserPreferences {
    pub username: Option<String>,
    pub tmdb_api_key: Option<String>,
    pub window_x: Option<i32>,
    pub window_y: Option<i32>,
    pub window_width: Option<u32>,
    pub window_height: Option<u32>,
    pub always_on_top: Option<bool>,
}

// AI Generated: GitHub Copilot - 2025-08-11
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompareResult {
    pub common_movies: Vec<Movie>,
}

// AI Generated: GitHub Copilot - 2025-08-11
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LetterboxdUser {
    pub username: String,
    #[serde(rename = "displayName")] pub display_name: Option<String>,
    #[serde(rename = "avatarUrl")] pub avatar_url: Option<String>,
    #[serde(rename = "followersCount")] pub followers_count: Option<u32>,
    #[serde(rename = "followingCount")] pub following_count: Option<u32>,
    #[serde(rename = "filmsCount")] pub films_count: Option<u32>,
}

pub fn create_friend_visual(count: u32) -> String {
    match count {
        0 => "".to_string(),
        1 => "👤".to_string(),
        2 => "👥".to_string(),
        3 => "👥👤".to_string(),
        4 => "👥👥".to_string(),
        5 => "👥👥👤".to_string(),
        6 => "👥👥👥".to_string(),
        7 => "👥👥👥👤".to_string(),
        8 => "👥👥👥👥".to_string(),
        9 => "👥👥👥👥👤".to_string(),
        10 => "👥👥👥👥👥".to_string(),
        n if n <= 15 => format!("👥👥👥👥👥+ ({n})"),
        n if n <= 25 => format!("🎭🎭🎭 ({n})"),
        n if n <= 50 => format!("🏟️ ({n})"),
        n => format!("🌍 ({n})"),
    }
}

pub fn enhance_movies_basic(
    watchlist_movies: Vec<(WatchlistMovie, u32, Vec<String>)>,
) -> Vec<Movie> {
    watchlist_movies
        .into_iter()
        .enumerate()
        .map(|(i, (movie, friend_count, friend_list))| {
            let friend_visual = create_friend_visual(friend_count);
            Movie {
                id: i as u32,
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
                friend_visual,
                friend_list,
                genre: None,
                director: None,
                average_rating: None,
                letterboxd_slug: movie.letterboxd_slug.clone(),
            }
        })
        .collect()
}
