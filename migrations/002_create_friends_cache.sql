-- Friends Cache Table Migration
-- AI Generated: GitHub Copilot - 2025-08-16

CREATE TABLE IF NOT EXISTS friends_cache (
    username TEXT PRIMARY KEY,
    friends_data TEXT NOT NULL,
    last_updated INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- Index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_friends_cache_expires 
ON friends_cache(expires_at);

-- Index for efficient username queries
CREATE INDEX IF NOT EXISTS idx_friends_cache_username 
ON friends_cache(username);