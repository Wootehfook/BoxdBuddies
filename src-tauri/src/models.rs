/*
 * Core shared data models for BoxdBuddy
 * AI Generated: GitHub Copilot - 2025-08-14
 */

use serde::{Deserialize, Serialize};

/// Public profile summary for a Letterboxd user
/// AI Generated: GitHub Copilot - 2025-08-14
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LetterboxdUser {
    pub username: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    #[serde(rename = "followersCount")]
    pub followers_count: Option<u32>,
    #[serde(rename = "followingCount")]
    pub following_count: Option<u32>,
    #[serde(rename = "filmsCount")]
    pub films_count: Option<u32>,
}

/// Friend row used in the UI and DB persistence
/// AI Generated: GitHub Copilot - 2025-08-14
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LetterboxdFriend {
    pub username: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    #[serde(rename = "isSelected")]
    pub is_selected: bool,
    #[serde(rename = "lastSynced")]
    pub last_synced: Option<String>,
}

/// Minimal movie from a watchlist, enriched later with TMDB
/// AI Generated: GitHub Copilot - 2025-08-14
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WatchlistMovie {
    pub title: String,
    pub year: Option<i32>,
    #[serde(rename = "letterboxdSlug")]
    pub letterboxd_slug: Option<String>,
    #[serde(rename = "posterUrl")]
    pub poster_url: Option<String>,
}
