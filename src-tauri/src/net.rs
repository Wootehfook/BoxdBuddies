/*
 * Networking and input safety helpers
 * AI Generated: GitHub Copilot - 2025-08-13
 */
use once_cell::sync::Lazy; // AI Generated: GitHub Copilot - 2025-08-13
use regex::Regex;
use reqwest::redirect::Policy;
use reqwest::{Client, Response, StatusCode};
use std::time::Duration;
use url::Url;

/// AI Generated: GitHub Copilot - 2025-08-13
/// Sanitize and validate a Letterboxd username.
///
/// Contract:
/// - input: raw username string from UI
/// - output: Ok(validated username) if it matches ^[A-Za-z0-9_-]{1,32}$, else Err generic message
/// - error messages must not echo the provided username (avoid PII in logs)
// AI Generated: GitHub Copilot - 2025-08-13
// Compile-once username allowlist regex
static USERNAME_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[A-Za-z0-9_-]{1,32}$").expect("valid username regex"));

pub fn sanitize_username(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    // Strict allow-list: letters, digits, underscore, hyphen; 1..=32 chars
    if USERNAME_RE.is_match(trimmed) {
        Ok(trimmed.to_string())
    } else {
        Err("Invalid username format".to_string())
    }
}

/// AI Generated: GitHub Copilot - 2025-08-13
/// Build a Letterboxd URL from path segments, ensuring:
/// - HTTPS scheme
/// - Host pinned to letterboxd.com
/// - Each segment is percent-encoded safely
pub fn build_letterboxd_url(segments: &[&str]) -> String {
    // Safe base URL
    let mut url = Url::parse("https://letterboxd.com/").expect("base URL parse");
    {
        let mut ps = url
            .path_segments_mut()
            .expect("base URL should allow path segments");
        ps.clear();
        for seg in segments {
            // Do not allow empty segments that would introduce '//' in the path
            if !seg.is_empty() {
                ps.push(seg);
            }
        }
    }
    // Ensure trailing slash is not required by callers
    url.as_str().trim_end_matches('/').to_string()
}

/// AI Generated: GitHub Copilot - 2025-08-13
/// Create a hardened reqwest Client with HTTPS-only and limited redirects.
pub fn hardened_client() -> Result<Client, reqwest::Error> {
    reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(Duration::from_secs(30))
        .https_only(true)
        .redirect(Policy::limited(5))
        .build()
}

/// AI Generated: GitHub Copilot - 2025-08-13
/// Send a GET with up to `max_retries` on transient errors (5xx/429/timeouts), with
/// exponential backoff and jitter. Caller must avoid including PII in `url` logs.
pub async fn get_with_retries(
    client: &Client,
    url: &str,
    max_retries: u32,
) -> Result<Response, reqwest::Error> {
    // AI Generated: GitHub Copilot - 2025-08-13
    // Backoff parameters
    const BASE_BACKOFF_MS: u64 = 200; // starting backoff before exponent
    const MAX_BACKOFF_SHIFT: u32 = 5; // cap exponential at 2^5
    const RETRY_JITTER_MAX_MS: u64 = 150; // add up to 150ms jitter to reduce thundering herd
    let mut attempt: u32 = 0;
    loop {
        let res = client.get(url).send().await;
        match res {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() {
                    return Ok(resp);
                }
                if status == StatusCode::TOO_MANY_REQUESTS || status.is_server_error() {
                    if attempt >= max_retries {
                        return Ok(resp); // return last response; caller handles status
                    }
                    // Respect Retry-After header if present (seconds)
                    let retry_after_secs = resp
                        .headers()
                        .get(reqwest::header::RETRY_AFTER)
                        .and_then(|v| v.to_str().ok())
                        .and_then(|s| s.parse::<u64>().ok())
                        .unwrap_or(0);
                    // compute backoff with jitter
                    let base_ms = BASE_BACKOFF_MS * (1u64 << attempt.min(MAX_BACKOFF_SHIFT));
                    let jitter = fastrand::u64(..RETRY_JITTER_MAX_MS);
                    let wait_ms = if retry_after_secs > 0 {
                        retry_after_secs * 1000
                    } else {
                        base_ms + jitter
                    };
                    tokio::time::sleep(Duration::from_millis(wait_ms)).await;
                    attempt += 1;
                    continue;
                }
                // Non-retryable status
                return Ok(resp);
            }
            Err(err) => {
                // Retry only on timeout/connect related errors
                let should_retry =
                    err.is_timeout() || err.is_connect() || err.is_request() || err.is_body();
                if should_retry && attempt < max_retries {
                    let base_ms = BASE_BACKOFF_MS * (1u64 << attempt.min(MAX_BACKOFF_SHIFT));
                    let jitter = fastrand::u64(..RETRY_JITTER_MAX_MS);
                    tokio::time::sleep(Duration::from_millis(base_ms + jitter)).await;
                    attempt += 1;
                    continue;
                }
                return Err(err);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_username_valid() {
        let ok = sanitize_username("Valid_User-123").unwrap();
        assert_eq!(ok, "Valid_User-123");
    }

    #[test]
    fn test_sanitize_username_invalid() {
        assert!(sanitize_username("").is_err());
        assert!(sanitize_username(" ").is_err());
        assert!(sanitize_username("bad/char").is_err());
        assert!(sanitize_username("a".repeat(40).as_str()).is_err());
    }

    #[test]
    fn test_build_letterboxd_url_encodes_segments() {
        let url = build_letterboxd_url(&["user name", "watchlist", "page", "1"]);
        // Space must be percent-encoded as %20 in path
        assert_eq!(url, "https://letterboxd.com/user%20name/watchlist/page/1");
    }
}
