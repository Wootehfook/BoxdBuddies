/*
 * BoxdBuddies - AGPL-3.0 License
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */
/*
 * Minimal TMDB client integration using existing URL builders and parsers.
 * AI Generated: GitHub Copilot - 2025-08-15
 */

use serde::{Deserialize, Serialize};
use url::Url; // AI Generated: GitHub Copilot - 2025-08-16

use crate::net::{get_with_retries, hardened_client};
use crate::tmdb::{
    build_tmdb_credits_url, build_tmdb_search_url, get_director_from_credits,
    parse_tmdb_credits_response, parse_tmdb_search_response, TmdbMovie,
};

/// Normalize year from TMDB fields
fn coerce_year(tm: &TmdbMovie) -> Option<i32> {
    if let Some(y) = tm.year {
        return Some(y);
    }
    tm.release_date
        .as_deref()
        .and_then(|d| d.get(0..4))
        .and_then(|y| y.parse::<i32>().ok())
}

/// Find best match from search results, preferring exact year when provided.
fn pick_best_match(results: &[TmdbMovie], year: Option<i32>) -> Option<TmdbMovie> {
    if results.is_empty() {
        return None;
    }
    if let Some(y) = year {
        if let Some(exact) = results.iter().find(|m| coerce_year(m) == Some(y)) {
            return Some(exact.clone());
        }
    }
    Some(results[0].clone())
}

/// Perform a TMDB search and return the best matching movie (if any).
pub async fn tmdb_search_first(
    api_key: &str,
    title: &str,
    year: Option<i32>,
) -> Result<Option<TmdbMovie>, String> {
    // AI Generated: GitHub Copilot - 2025-08-15
    let url =
        build_tmdb_search_url(api_key, title, year).map_err(|e| format!("URL build error: {e}"))?;
    let client = hardened_client().map_err(|e| format!("HTTP client error: {e}"))?;
    let resp = get_with_retries(&client, &url, 3)
        .await
        .map_err(|e| format!("Network error: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("TMDB search HTTP error: {}", resp.status()));
    }
    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read TMDB response: {e}"))?;
    let parsed = parse_tmdb_search_response(&body)?;
    Ok(pick_best_match(&parsed.results, year))
}

/// Fetch the director from credits for a movie id.
pub async fn tmdb_fetch_director(api_key: &str, tmdb_id: i64) -> Result<Option<String>, String> {
    let url =
        build_tmdb_credits_url(api_key, tmdb_id).map_err(|e| format!("URL build error: {e}"))?;
    let client = hardened_client().map_err(|e| format!("HTTP client error: {e}"))?;
    let resp = get_with_retries(&client, &url, 3)
        .await
        .map_err(|e| format!("Network error: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("TMDB credits HTTP error: {}", resp.status()));
    }
    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read TMDB credits: {e}"))?;
    let credits = parse_tmdb_credits_response(&body)?;
    Ok(get_director_from_credits(&credits))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimalTmdbInfo {
    pub tmdb_id: Option<i64>,
    pub title: Option<String>,
    pub year: Option<i32>,
    pub director: Option<String>,
    pub poster_path: Option<String>,
}

/// Tauri command: minimal TMDB lookup; returns basic fields for a title/year.
/// Security: caller must supply API key; input strings are not logged.
#[tauri::command]
pub async fn tmdb_lookup_minimal(
    api_key: String,
    title: String,
    year: Option<i32>,
) -> Result<MinimalTmdbInfo, String> {
    // AI Generated: GitHub Copilot - 2025-08-16
    // Prefer centralized Cloudflare API if configured (no client API key required)
    if let Some(cf_base) = cf_api_base() {
        if let Ok(info) = cf_search_minimal(&cf_base, &title, year).await {
            return Ok(info);
        }
        // If CF path fails, continue to legacy TMDB path below without logging PII
    }

    // Legacy path: require TMDB API key from caller to perform direct TMDB lookup
    if api_key.trim().is_empty() {
        return Err("TMDB API key is required".into());
    }
    let found = tmdb_search_first(&api_key, &title, year).await?;
    if let Some(movie) = found {
        // Compute borrow-dependent fields before moving owned fields
        let year_norm = coerce_year(&movie);
        // Move out owned fields to avoid unnecessary clones
        let TmdbMovie {
            tmdb_id: tmdb_id_val,
            title: title_val,
            poster_path: poster_val,
            ..
        } = movie;
        let director = tmdb_fetch_director(&api_key, tmdb_id_val).await?;
        Ok(MinimalTmdbInfo {
            tmdb_id: Some(tmdb_id_val),
            title: Some(title_val),
            year: year_norm,
            director,
            poster_path: poster_val,
        })
    } else {
        Ok(MinimalTmdbInfo {
            tmdb_id: None,
            title: None,
            year: None,
            director: None,
            poster_path: None,
        })
    }
}

// AI Generated: GitHub Copilot - 2025-08-16
// Cloudflare Worker integration for minimal search; avoids exposing TMDB key to client
fn cf_api_base() -> Option<String> {
    match std::env::var("CF_API_BASE") {
        Ok(val) => {
            let trimmed = val.trim();
            if trimmed.is_empty() {
                None
            } else if let Ok(url) = Url::parse(trimmed) {
                // Enforce HTTPS
                if url.scheme() == "https" {
                    Some(trimmed.to_string())
                } else {
                    None
                }
            } else {
                None
            }
        }
        Err(_) => None,
    }
}

#[derive(Debug, Deserialize, Clone)]
struct CfMovieItem {
    id: i64,
    title: String,
    #[serde(default)]
    year: Option<i32>,
    #[serde(default)]
    poster_path: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CfSearchResponse {
    #[serde(default)]
    movies: Vec<CfMovieItem>,
}

async fn cf_search_minimal(
    cf_base: &str,
    title: &str,
    year: Option<i32>,
) -> Result<MinimalTmdbInfo, String> {
    let base = Url::parse(cf_base).map_err(|_| "Invalid CF base URL".to_string())?;
    let mut url = base
        .join("/search")
        .map_err(|_| "Failed to build CF URL".to_string())?;
    {
        let mut qp = url.query_pairs_mut();
        qp.append_pair("q", title);
        qp.append_pair("page", "1");
    }
    let client = hardened_client().map_err(|e| format!("HTTP client error: {e}"))?;
    let resp = get_with_retries(&client, url.as_str(), 2)
        .await
        .map_err(|e| format!("Network error: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("CF search HTTP error: {}", resp.status()));
    }
    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read CF response: {e}"))?;
    let parsed: CfSearchResponse =
        serde_json::from_str(&body).map_err(|e| format!("Failed to parse CF response: {e}"))?;
    if parsed.movies.is_empty() {
        return Ok(MinimalTmdbInfo {
            tmdb_id: None,
            title: None,
            year: None,
            director: None,
            poster_path: None,
        });
    }
    // Pick best match — exact year preferred when available
    let pick = if let Some(y) = year {
        parsed
            .movies
            .iter()
            .find(|m| m.year == Some(y))
            .cloned()
            .unwrap_or_else(|| parsed.movies[0].clone())
    } else {
        parsed.movies[0].clone()
    };
    Ok(MinimalTmdbInfo {
        tmdb_id: Some(pick.id),
        title: Some(pick.title),
        year: pick.year,
        director: None, // Director not provided by CF /search; can be added via another endpoint later
        poster_path: pick.poster_path,
    })
}
