-- AI Generated: GitHub Copilot - 2026-02-20
-- Enhanced tracking for incremental sync job reliability

CREATE TABLE IF NOT EXISTS incremental_sync_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_successful_id INTEGER,
    last_attempted_id INTEGER,
    consecutive_errors INTEGER DEFAULT 0,
    last_error_code TEXT,
    last_error_message TEXT,
    last_error_timestamp TIMESTAMP,
    last_completed_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default row if not exists
INSERT OR IGNORE INTO incremental_sync_status (id) VALUES (1);
