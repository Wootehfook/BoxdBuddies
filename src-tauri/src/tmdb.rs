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
#![allow(dead_code)]
/*
 * TMDB client module (foundation for PR B)
 * AI Generated: GitHub Copilot - 2025-08-14
 *
 * Scope (non-invasive):
 * - Define response models we already persist in DB (ids, title, year, overview, poster_path, etc.)
 * - Provide URL builders for common endpoints (search, credits, details)
 * - Provide small, pure helpers to parse minimal fields from JSON strings
 * - Do NOT perform network I/O or change runtime behavior yet
 */

use serde::{Deserialize, Serialize};
use url::Url;

// AI Generated: GitHub Copilot - 2025-08-15
// Base URL constants to avoid hardcoded strings throughout
pub const TMDB_BASE: &str = "https://api.themoviedb.org";
pub const TMDB_SEARCH_PATH: &str = "/3/search/movie";
pub const TMDB_MOVIE_PATH: &str = "/3/movie";

// Minimal TMDB movie representation aligned with existing DB schema
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TmdbMovie {
    #[serde(rename = "id")]
    pub tmdb_id: i64,
    pub title: String,
    #[serde(default)]
    pub original_title: Option<String>,
    #[serde(default)]
    pub release_date: Option<String>,
    #[serde(default)]
    pub year: Option<i32>,
    #[serde(default)]
    pub overview: Option<String>,
    #[serde(default)]
    pub poster_path: Option<String>,
    #[serde(default)]
    pub backdrop_path: Option<String>,
    #[serde(default)]
    pub vote_average: Option<f32>,
    #[serde(default)]
    pub vote_count: Option<i32>,
    #[serde(default)]
    pub popularity: Option<f32>,
    #[serde(default)]
    pub genre_ids: Option<Vec<i32>>,
    #[serde(default)]
    pub runtime: Option<i32>,
    #[serde(default)]
    pub budget: Option<i64>,
    #[serde(default)]
    pub revenue: Option<i64>,
    #[serde(default)]
    pub original_language: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TmdbSearchResponse {
    pub page: i32,
    pub total_results: i32,
    pub total_pages: i32,
    pub results: Vec<TmdbMovie>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TmdbCrewMember {
    pub id: i64,
    pub name: String,
    pub job: Option<String>,
    pub department: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TmdbCreditsResponse {
    #[serde(default)]
    pub crew: Vec<TmdbCrewMember>,
}

// URL helpers (pure) — caller provides sanitized inputs and API key
pub fn build_tmdb_search_url(
    api_key: &str,
    title: &str,
    year: Option<i32>,
) -> Result<String, url::ParseError> {
    let base = Url::parse(TMDB_BASE)?;
    let mut url = base.join(TMDB_SEARCH_PATH)?;
    {
        let mut qp = url.query_pairs_mut();
        qp.append_pair("api_key", api_key);
        qp.append_pair("query", title);
        if let Some(y) = year {
            qp.append_pair("year", &y.to_string());
        }
    }
    Ok(url.to_string())
}

#[allow(dead_code)]
pub fn build_tmdb_details_url(api_key: &str, tmdb_id: i64) -> Result<String, url::ParseError> {
    let base = Url::parse(TMDB_BASE)?;
    let path = format!("{TMDB_MOVIE_PATH}/{tmdb_id}");
    let mut url = base.join(&path)?;
    {
        let mut qp = url.query_pairs_mut();
        qp.append_pair("api_key", api_key);
    }
    Ok(url.to_string())
}

pub fn build_tmdb_credits_url(api_key: &str, tmdb_id: i64) -> Result<String, url::ParseError> {
    let base = Url::parse(TMDB_BASE)?;
    let path = format!("{TMDB_MOVIE_PATH}/{tmdb_id}/credits");
    let mut url = base.join(&path)?;
    {
        let mut qp = url.query_pairs_mut();
        qp.append_pair("api_key", api_key);
    }
    Ok(url.to_string())
}

// Pure JSON parse helpers — intentionally narrow surface area
pub fn parse_tmdb_search_response(json_str: &str) -> Result<TmdbSearchResponse, String> {
    serde_json::from_str::<TmdbSearchResponse>(json_str)
        .map_err(|e| format!("Failed to parse TMDB search response: {e}"))
}

pub fn parse_tmdb_credits_response(json_str: &str) -> Result<TmdbCreditsResponse, String> {
    serde_json::from_str::<TmdbCreditsResponse>(json_str)
        .map_err(|e| format!("Failed to parse TMDB credits response: {e}"))
}

// Extract first Director name if present (case-insensitive match on job == "Director")
pub fn get_director_from_credits(credits: &TmdbCreditsResponse) -> Option<String> {
    credits
        .crew
        .iter()
        .find(|m| {
            m.job
                .as_deref()
                .map(|j| j.eq_ignore_ascii_case("Director"))
                .unwrap_or(false)
        })
        .map(|m| m.name.clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_tmdb_search_url_basic() {
        let url_s = build_tmdb_search_url("ABC", "The Matrix", Some(1999)).unwrap();
        let parsed = Url::parse(&url_s).unwrap();
        assert_eq!(parsed.path(), "/3/search/movie");
        let params: std::collections::HashMap<_, _> = parsed.query_pairs().into_owned().collect();
        assert_eq!(params.get("api_key").map(|s| s.as_str()), Some("ABC"));
        assert_eq!(params.get("query").map(|s| s.as_str()), Some("The Matrix"));
        assert_eq!(params.get("year").map(|s| s.as_str()), Some("1999"));
    }

    #[test]
    fn test_build_tmdb_details_url_basic() {
        let url_s = build_tmdb_details_url("KEY", 42).unwrap();
        let parsed = Url::parse(&url_s).unwrap();
        assert_eq!(parsed.path(), "/3/movie/42");
        let params: std::collections::HashMap<_, _> = parsed.query_pairs().into_owned().collect();
        assert_eq!(params.get("api_key").map(|s| s.as_str()), Some("KEY"));
    }

    #[test]
    fn test_build_tmdb_credits_url_basic() {
        let url_s = build_tmdb_credits_url("KEY", 42).unwrap();
        let parsed = Url::parse(&url_s).unwrap();
        assert_eq!(parsed.path(), "/3/movie/42/credits");
        let params: std::collections::HashMap<_, _> = parsed.query_pairs().into_owned().collect();
        assert_eq!(params.get("api_key").map(|s| s.as_str()), Some("KEY"));
    }

    #[test]
    fn test_parse_tmdb_search_response_minimal() {
        let js = r#"{
            "page": 1,
            "total_results": 1,
            "total_pages": 1,
            "results": [
                {
                    "id": 603,
                    "title": "The Matrix",
                    "release_date": "1999-03-30"
                }
            ]
        }"#;
        let parsed = parse_tmdb_search_response(js).unwrap();
        assert_eq!(parsed.results.len(), 1);
        assert_eq!(parsed.results[0].tmdb_id, 603);
        assert_eq!(parsed.results[0].title, "The Matrix");
        assert_eq!(parsed.page, 1);
    }

    #[test]
    fn test_get_director_from_credits_case_insensitive() {
        let js = r#"{
            "crew": [
                { "id": 1, "name": "Someone", "job": "Producer" },
                { "id": 2, "name": "Lana Wachowski", "job": "director" },
                { "id": 3, "name": "Lilly Wachowski", "job": "Writer" }
            ]
        }"#;
        let credits = parse_tmdb_credits_response(js).unwrap();
        let dir = get_director_from_credits(&credits).unwrap();
        assert_eq!(dir, "Lana Wachowski");
    }
}
