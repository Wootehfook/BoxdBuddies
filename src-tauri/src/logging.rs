/*
 * Logging utilities for BoxdBuddies
 * AI Generated: GitHub Copilot - 2025-08-10
 */

// (Removed file logging dependencies)

// Toggle verbose console debug logging (non-sensitive) at compile time.
pub const DEBUG_LOGGING: bool = false;

#[macro_export]
macro_rules! debug_log {
    ($($arg:tt)*) => {
        if $crate::logging::DEBUG_LOGGING {
            println!($($arg)*);
        }
    };
}

// (Removed unused log_debug & app_data_dir helpers)
