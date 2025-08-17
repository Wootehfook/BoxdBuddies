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
 * Scraping helpers extracted from main.rs
 * AI Generated: GitHub Copilot - 2025-08-11
 */
use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use std::collections::HashSet;

use crate::models::{LetterboxdFriend, LetterboxdUser, WatchlistMovie};

// AI Generated: GitHub Copilot - 2025-08-11
pub fn has_next_page_in_html(html_content: &str) -> bool {
    let indicators = [
        "page/",
        "next",
        "paginate-next",
        "rel=\"next\"",
        "&gt;",
        "→",
    ];
    let mut count = 0;
    for ind in &indicators {
        if html_content.contains(ind) {
            count += 1;
        }
    }
    count >= 2
}

// AI Generated: GitHub Copilot - 2025-08-11
pub async fn scrape_user_watchlist_with_limit(
    username: &str,
    limit_to_500: bool,
) -> Result<Vec<WatchlistMovie>, String> {
    // Security: strict username validation
    let username = crate::net::sanitize_username(username)?;
    let client = crate::net::hardened_client()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;
    let mut all = Vec::new();
    let mut page = 1;
    loop {
        let url = if page == 1 {
            crate::net::build_letterboxd_url(&[&username, "watchlist"])
        } else {
            crate::net::build_letterboxd_url(&[&username, "watchlist", "page", &page.to_string()])
        };
        // AI Generated: GitHub Copilot - 2025-08-13
        // Security: Avoid including usernames (PII) in error strings.
        // Only report page index and the error itself.
        let resp = crate::net::get_with_retries(&client, &url, 3)
            .await
            .map_err(|e| format!("Failed to fetch watchlist page {page}: {e}"))?;
        if !resp.status().is_success() {
            return Err(format!("HTTP error on page {page}: {}", resp.status()));
        }
        let html = resp
            .text()
            .await
            .map_err(|e| format!("Failed to read page {page}: {e}"))?;
        let mut page_movies = extract_movies_from_html_text(&html);
        println!(
            "🔍 SCRAPE: Page {page} yielded {} movies (accumulated {})",
            page_movies.len(),
            all.len()
        );
        all.append(&mut page_movies);
        if limit_to_500 && all.len() >= 500 {
            println!("🔍 SCRAPE: Reached 500 movie limit");
            break;
        }
        if !has_next_page_in_html(&html) {
            break;
        }
        page += 1;
        if page > 50 {
            println!("⚠️ SCRAPE: Safety cap reached");
            break;
        }
    }
    // AI Generated: GitHub Copilot - 2025-08-11
    // Security: avoid logging cleartext usernames (PII) in output
    println!(
        "🔍 SCRAPE: Completed scraping user with {} movies",
        all.len()
    );
    Ok(all)
}

// (Removed unused scrape_user_watchlist wrapper)

// AI Generated: GitHub Copilot - 2025-08-11
pub fn extract_username_from_href(href: &str) -> Option<String> {
    let cleaned = href.trim_start_matches("https://letterboxd.com");
    let parts: Vec<&str> = cleaned.split('/').filter(|s| !s.is_empty()).collect();
    if let Some(username) = parts.first() {
        let u = username.to_string();
        if !matches!(
            u.as_str(),
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
        ) && u
            .chars()
            .all(|c| c.is_alphanumeric() || c == '_' || c == '-')
        {
            return Some(u);
        }
    }
    None
}

fn clean_display_name(name: &str) -> String {
    let mut c = name.to_string();
    for suf in [" Pro", " Patron", " HQ"] {
        if c.ends_with(suf) {
            c = c.trim_end_matches(suf).to_string();
        }
    }
    c
}

pub fn extract_display_name_from_element(
    el: &scraper::ElementRef,
    username: &str,
) -> Option<String> {
    let selectors = ["a", ".name", "td:first-child", "h3", "strong"];
    for sel in selectors {
        if let Ok(s) = Selector::parse(sel) {
            for e in el.select(&s) {
                let t = e.text().collect::<String>().trim().to_string();
                if !t.is_empty()
                    && t != username
                    && !t.contains("followers")
                    && !t.contains("following")
                {
                    return Some(clean_display_name(&t));
                }
            }
        }
    }
    None
}

pub fn extract_avatar_from_element(el: &scraper::ElementRef) -> Option<String> {
    let sels = [
        "img.avatar",
        "img[src*='avatar']",
        ".avatar img",
        "img[alt*='avatar']",
        ".profile-avatar img",
        "img[src*='profile']",
        "img[src*='letterboxd']",
        "img",
    ];
    for s in sels {
        if let Ok(sel) = Selector::parse(s) {
            if let Some(img) = el.select(&sel).next() {
                if let Some(src) = img.value().attr("src") {
                    if src.contains("placeholder") || src.contains("default") || src.is_empty() {
                        continue;
                    }
                    return Some(if src.starts_with("http") {
                        src.to_string()
                    } else if src.starts_with('/') {
                        format!("https://letterboxd.com{src}")
                    } else if src.starts_with("//") {
                        format!("https:{src}")
                    } else {
                        src.to_string()
                    });
                }
            }
        }
    }
    None
}

pub fn extract_friend_from_element(element: &scraper::ElementRef) -> Option<LetterboxdFriend> {
    let username = extract_username_from_element(element)?;
    let display_name = extract_display_name_from_element(element, &username);
    let avatar_url = extract_avatar_from_element(element);
    Some(LetterboxdFriend {
        username,
        display_name,
        avatar_url,
        is_selected: false,
        last_synced: None,
    })
}

pub fn extract_username_from_element(element: &scraper::ElementRef) -> Option<String> {
    if let Ok(sel) = Selector::parse("a[href*='/']") {
        for link in element.select(&sel) {
            if let Some(href) = link.value().attr("href") {
                if let Some(u) = extract_username_from_href(href) {
                    return Some(u);
                }
            }
        }
    }
    None
}

pub fn extract_friends_from_html(document: &Html) -> Result<Vec<LetterboxdFriend>, String> {
    let mut friends = Vec::new();
    static FRIEND_ROW_SELECTORS: Lazy<Vec<Selector>> = Lazy::new(|| {
        ["tbody tr", ".person-summary", ".profile-person"]
            .iter()
            .filter_map(|s| Selector::parse(s).ok())
            .collect()
    });
    for sel in FRIEND_ROW_SELECTORS.iter() {
        for el in document.select(sel) {
            if let Some(f) = extract_friend_from_element(&el) {
                friends.push(f);
            }
        }
        if !friends.is_empty() {
            break;
        }
    }
    Ok(friends)
}

// AI Generated: GitHub Copilot - 2025-08-11
pub async fn scrape_letterboxd_profile_internal(username: &str) -> Result<LetterboxdUser, String> {
    // Security: strict username validation
    let sanitized_username = crate::net::sanitize_username(username)?;
    let url = crate::net::build_letterboxd_url(&[&sanitized_username]);
    let client = crate::net::hardened_client()
        .map_err(|e| format!("Failed to create secure HTTP client: {e}"))?;
    let resp = crate::net::get_with_retries(&client, &url, 3)
        .await
        .map_err(|e| format!("Failed to fetch profile page: {e}"))?;
    if resp.status() == 404 {
        return Err("User not found on Letterboxd".into());
    }
    if !resp.status().is_success() {
        return Err(format!(
            "HTTP error {}: Failed to access profile",
            resp.status()
        ));
    }
    let html = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {e}"))?;
    let doc = Html::parse_document(&html);
    let display_name = extract_display_name(&doc, &sanitized_username);
    // AI Generated: GitHub Copilot - 2025-08-15
    let followers_count = extract_followers_count(&doc);
    let following_count = extract_following_count(&doc);
    let films_count = extract_films_count(&doc);
    Ok(LetterboxdUser {
        username: sanitized_username.to_string(),
        display_name,
        avatar_url: None,
        followers_count,
        following_count,
        films_count,
    })
}

pub fn extract_display_name(document: &Html, username: &str) -> Option<String> {
    let sels = ["h1.headline-1", ".profile-header h1", "h1", ".displayname"];
    for s in sels {
        if let Ok(sel) = Selector::parse(s) {
            if let Some(el) = document.select(&sel).next() {
                let t = el.text().collect::<String>().trim().to_string();
                if !t.is_empty() && t != username {
                    return Some(clean_display_name(&t));
                }
            }
        }
    }
    None
}

pub fn extract_followers_count(document: &Html) -> Option<u32> {
    extract_count_from_links(document, "followers")
}
pub fn extract_following_count(document: &Html) -> Option<u32> {
    extract_count_from_links(document, "following")
}
pub fn extract_films_count(document: &Html) -> Option<u32> {
    let sels = [
        "a[href*='/films/'] .value",
        ".profile-stats a[href*='/films/']",
        ".statistic .value",
    ];
    for s in sels {
        if let Ok(sel) = Selector::parse(s) {
            for e in document.select(&sel) {
                let text = e.text().collect::<String>();
                if let Some(c) = parse_count(&text) {
                    return Some(c);
                }
            }
        }
    }
    None
}
fn extract_count_from_links(document: &Html, link_type: &str) -> Option<u32> {
    let selector_str = format!("a[href*='/{link_type}/'] .value");
    if let Ok(sel) = Selector::parse(&selector_str) {
        if let Some(e) = document.select(&sel).next() {
            let text = e.text().collect::<String>();
            return parse_count(&text);
        }
    }
    None
}
fn parse_count(text: &str) -> Option<u32> {
    let cleaned = text.trim().replace(',', "");
    cleaned.parse::<u32>().ok()
}

// Find common movies across watchlists (ANY friend has it)
pub fn find_common_movies(
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
    for (i, (_friend_name, friend_watchlist)) in friend_watchlists_with_names.iter().enumerate() {
        println!(
            // Security: do not log friend usernames/display names (PII)
            "DEBUG: Friend #{} has {} movies",
            i + 1,
            friend_watchlist.len()
        );
    }

    let mut common_movies = Vec::new();

    // Pre-build lowercase title sets for each friend for O(1) membership checks
    let friend_sets: Vec<(&String, HashSet<String>)> = friend_watchlists_with_names
        .iter()
        .map(|(name, list)| {
            let set: HashSet<String> = list.iter().map(|m| m.title.to_lowercase()).collect();
            (name, set)
        })
        .collect();

    for (idx, movie) in main_watchlist.iter().enumerate() {
        if idx < 3 {
            println!(
                "DEBUG: Checking main movie #{}: '{}' ({})",
                idx + 1,
                movie.title,
                movie.year.unwrap_or(0)
            );
        }
        let mut friend_count = 0u32;
        let mut friends_with_movie: Vec<String> = Vec::new();
        let title_lc = movie.title.to_lowercase();
        for (friend_idx, (friend_name, set)) in friend_sets.iter().enumerate() {
            let found = set.contains(&title_lc);
            if found {
                friend_count += 1;
                // Preserve names in returned data for UI, but avoid printing them in logs.
                friends_with_movie.push((*friend_name).clone());
                if idx < 3 {
                    println!(
                        "DEBUG: '{}' found in friend #{}'s list",
                        movie.title,
                        friend_idx + 1
                    );
                }
            } else if idx < 3 {
                println!(
                    "DEBUG: '{}' NOT found in friend #{}'s list",
                    movie.title,
                    friend_idx + 1
                );
            }
        }
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

// Extract title and year from alt text like "Movie Title (2020)"
pub fn extract_title_and_year_from_alt(alt_text: &str) -> (String, Option<i32>) {
    let cleaned = alt_text.trim();
    let title = cleaned.to_string();
    let year = if let Some(year_start) = cleaned.rfind('(') {
        if let Some(year_end_rel) = cleaned[year_start..].find(')') {
            let year_str = &cleaned[year_start + 1..year_start + year_end_rel];
            year_str
                .parse::<i32>()
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

// (Removed unused parse_title_and_year helper)

// Extract poster-based movies
pub fn extract_movies_from_html_text(html_content: &str) -> Vec<WatchlistMovie> {
    let mut movies = Vec::new();
    println!("DEBUG: Starting movie extraction from HTML");
    let document = Html::parse_document(html_content);
    let poster_selector = Selector::parse(".film-poster[data-film-slug]").unwrap();
    for element in document.select(&poster_selector) {
        if let Some(slug) = element.value().attr("data-film-slug") {
            let img_selector = Selector::parse("img").unwrap();
            if let Some(img) = element.select(&img_selector).next() {
                if let Some(alt_text) = img.value().attr("alt") {
                    let (title, year) = extract_title_and_year_from_alt(alt_text);
                    if !title.is_empty() {
                        let poster_url = img.value().attr("src").map(|src| {
                            if src.starts_with("//") {
                                format!("https:{src}")
                            } else if src.starts_with('/') {
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
    if movies.is_empty() {
        let link_selector = Selector::parse("[data-target-link*='/film/']").unwrap();
        for element in document.select(&link_selector) {
            if let Some(target_link) = element.value().attr("data-target-link") {
                let slug = target_link
                    .trim_start_matches("/film/")
                    .trim_end_matches('/');
                let img_selector = Selector::parse("img").unwrap();
                if let Some(img) = element.select(&img_selector).next() {
                    if let Some(alt_text) = img.value().attr("alt") {
                        let (title, year) = extract_title_and_year_from_alt(alt_text);
                        if !title.is_empty() {
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
    movies.sort_by(|a, b| a.title.cmp(&b.title));
    movies.dedup_by(|a, b| a.title == b.title && a.year == b.year);
    println!("DEBUG: Final extracted {} unique movies", movies.len());
    movies
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::WatchlistMovie;

    #[test]
    fn test_find_common_movies_basic() {
        let main = vec![WatchlistMovie {
            title: "Inception".into(),
            year: Some(2010),
            letterboxd_slug: None,
            poster_url: None,
        }];
        let f1 = vec![WatchlistMovie {
            title: "Inception".into(),
            year: Some(2010),
            letterboxd_slug: None,
            poster_url: None,
        }];
        let f2 = vec![WatchlistMovie {
            title: "The Matrix".into(),
            year: Some(1999),
            letterboxd_slug: None,
            poster_url: None,
        }];
        let result = find_common_movies(&main, &[("Alice".into(), f1), ("Bob".into(), f2)]);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].0.title, "Inception");
        assert_eq!(result[0].1, 1);
        assert_eq!(result[0].2, vec!["Alice".to_string()]);
    }
}
