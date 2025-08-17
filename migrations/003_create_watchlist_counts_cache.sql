-- Add watchlist counts cache table
-- AI Generated: GitHub Copilot - 2025-08-16

CREATE TABLE IF NOT EXISTS watchlist_counts_cache (
    username TEXT PRIMARY KEY,
    watchlist_count INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER NOT NULL
);

-- Add index for faster lookups by last_updated
CREATE INDEX IF NOT EXISTS idx_watchlist_counts_updated ON watchlist_counts_cache(last_updated);