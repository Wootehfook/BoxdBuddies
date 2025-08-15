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
    // If key appears empty, short-circuit with a friendly error.
    if api_key.trim().is_empty() {
        return Err("TMDB API key is required".into());
    }
    let found = tmdb_search_first(&api_key, &title, year).await?;
    if let Some(movie) = found {
        // Compute borrow-dependent fields before moving owned fields
        let year_norm = coerce_year(&movie);
        let tmdb_id_val = movie.tmdb_id;
        let director = tmdb_fetch_director(&api_key, tmdb_id_val).await?;
        // Clone the strings to avoid move-after-borrow issues; these are tiny fields
        let title_val = movie.title.clone();
        let poster_val = movie.poster_path.clone();
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
