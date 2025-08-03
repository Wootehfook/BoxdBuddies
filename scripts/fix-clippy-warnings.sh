#!/bin/bash

# BoxdBuddies - Comprehensive Clippy Warning Fix Script
# Generated: August 3, 2025
# Purpose: Fix all remaining clippy warnings in src-tauri/src/main.rs

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$SCRIPT_DIR/../src-tauri"
MAIN_RS="$TAURI_DIR/src/main.rs"

echo "🔧 Starting comprehensive clippy warning fixes..."
echo "Target file: $MAIN_RS"

# Backup the original file
cp "$MAIN_RS" "$MAIN_RS.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Created backup file"

cd "$TAURI_DIR"

echo "🔧 Phase 1: Error message format strings..."

# Fix common error message patterns
sed -i 's/format!("Failed to parse sync time: {}", e)/format!("Failed to parse sync time: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to fetch profile page: {}", e)/format!("Failed to fetch profile page: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to read response: {}", e)/format!("Failed to read response: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to send TMDB search request: {}", e)/format!("Failed to send TMDB search request: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to parse TMDB search response: {}", e)/format!("Failed to parse TMDB search response: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to send TMDB details request: {}", e)/format!("Failed to send TMDB details request: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to parse TMDB movie details: {}", e)/format!("Failed to parse TMDB movie details: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to send TMDB credits request: {}", e)/format!("Failed to send TMDB credits request: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to parse TMDB credits response: {}", e)/format!("Failed to parse TMDB credits response: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to fetch watchlist: {}", e)/format!("Failed to fetch watchlist: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to get file metadata: {}", e)/format!("Failed to get file metadata: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to get app data dir: {}", e)/format!("Failed to get app data dir: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to clear cached TMDB data: {}", e)/format!("Failed to clear cached TMDB data: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to save friends to database: {}", e)/format!("Failed to save friends to database: {e}")/g' "$MAIN_RS"

echo "🔧 Phase 2: Simple println patterns..."

# Fix simple println patterns
sed -i "s/println!(\"Scraping real Letterboxd profile for: {}\", username)/println!(\"Scraping real Letterboxd profile for: {username}\")/g" "$MAIN_RS"
sed -i "s/println!(\"Scraping real Letterboxd friends for: {}\", username)/println!(\"Scraping real Letterboxd friends for: {username}\")/g" "$MAIN_RS"
sed -i "s/println!(\"Getting watchlist for main user: {}\", main_username)/println!(\"Getting watchlist for main user: {main_username}\")/g" "$MAIN_RS"
sed -i "s/println!(\"Getting watchlist for friend: {}\", friend_username)/println!(\"Getting watchlist for friend: {friend_username}\")/g" "$MAIN_RS"
sed -i "s/println!(\"🎬 TMDB SEARCH: No results found for '{}'\", title)/println!(\"🎬 TMDB SEARCH: No results found for '{title}'\")/g" "$MAIN_RS"
sed -i "s/println!(\"🎬 TMDB DETAILS: Fetching details for ID {}\", tmdb_id)/println!(\"🎬 TMDB DETAILS: Fetching details for ID {tmdb_id}\")/g" "$MAIN_RS"
sed -i "s/println!(\"🎬 TMDB CREDITS: Fetching credits for ID {}\", tmdb_id)/println!(\"🎬 TMDB CREDITS: Fetching credits for ID {tmdb_id}\")/g" "$MAIN_RS"
sed -i "s/println!(\"🎬 TMDB CREDITS: Found director '{}'\", director_name)/println!(\"🎬 TMDB CREDITS: Found director '{director_name}'\")/g" "$MAIN_RS"
sed -i "s/println!(\"🎬 CACHE DEBUG: Parsing year from date: '{}'\", date)/println!(\"🎬 CACHE DEBUG: Parsing year from date: '{date}'\")/g" "$MAIN_RS"
sed -i "s/println!(\"🎬 TMDB: Enhancing {} movies with TMDB data\", total_movies)/println!(\"🎬 TMDB: Enhancing {total_movies} movies with TMDB data\")/g" "$MAIN_RS"

echo "🔧 Phase 3: Two-variable format patterns..."

# Fix two-variable patterns
sed -i 's/println!("Scraping friends page {}: {}", page, url)/println!("Scraping friends page {page}: {url}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to fetch watchlist page {}: {}", page, e)/format!("Failed to fetch watchlist page {page}: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to read response for page {}: {}", page, e)/format!("Failed to read response for page {page}: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to fetch friends page {}: {}", page, e)/format!("Failed to fetch friends page {page}: {e}")/g' "$MAIN_RS"
sed -i 's/println!("Failed to scrape watchlist for {}: {}", friend_username, e)/println!("Failed to scrape watchlist for {friend_username}: {e}")/g' "$MAIN_RS"
sed -i 's/println!("Failed to get watchlist for {}: {}", friend_username, e)/println!("Failed to get watchlist for {friend_username}: {e}")/g' "$MAIN_RS"

echo "🔧 Phase 4: User/title format patterns..."

# Fix user and title patterns
sed -i "s/format!(\"User '{}' not found on Letterboxd\", username)/format!(\"User '{username}' not found on Letterboxd\")/g" "$MAIN_RS"
sed -i "s/format!(\"Watchlist not found for user '{}'\", username)/format!(\"Watchlist not found for user '{username}'\")/g" "$MAIN_RS"
sed -i "s/format!(\"Following page not found for user '{}'\", username)/format!(\"Following page not found for user '{username}'\")/g" "$MAIN_RS"
sed -i "s/println!(\"🗑️ CLEAR CACHE: Clearing cache for movie '{}'\", movie_title)/println!(\"🗑️ CLEAR CACHE: Clearing cache for movie '{movie_title}'\")/g" "$MAIN_RS"

echo "🔧 Phase 5: URL format patterns..."

# Fix URL patterns
sed -i 's/format!("https:\/\/letterboxd.com\/{}\/", username)/format!("https:\/\/letterboxd.com\/{username}\/")/g' "$MAIN_RS"
sed -i 's/format!("https:\/\/letterboxd.com\/{}\/following\/", username)/format!("https:\/\/letterboxd.com\/{username}\/following\/")/g' "$MAIN_RS"

echo "🔧 Phase 6: Debug and error patterns..."

# Fix debug patterns  
sed -i "s/eprintln!(\"🚨 Error saving friends to database: {}\", e)/eprintln!(\"🚨 Error saving friends to database: {e}\")/g" "$MAIN_RS"
sed -i "s/println!(\"DEBUG: Found movie alt text: '{}'\", alt_text)/println!(\"DEBUG: Found movie alt text: '{alt_text}'\")/g" "$MAIN_RS"
sed -i "s/println!(\"DEBUG: Found movie via target-link - Alt: '{}'\", alt_text)/println!(\"DEBUG: Found movie via target-link - Alt: '{alt_text}'\")/g" "$MAIN_RS"
sed -i "s/println!(\"✓ Found movie '{}' in HTML\", pattern)/println!(\"✓ Found movie '{pattern}' in HTML\")/g" "$MAIN_RS"
sed -i "s/println!(\"  Total \/film\/ occurrences: {}\", film_count)/println!(\"  Total \/film\/ occurrences: {film_count}\")/g" "$MAIN_RS"

echo "🔧 Phase 7: Complex debug format patterns..."

# Fix debug format patterns with {:?}
sed -i 's/println!("DEBUG: Original friends: {:?}", friend_usernames)/println!("DEBUG: Original friends: {friend_usernames:?}")/g' "$MAIN_RS"
sed -i 's/println!("DEBUG: Filtered friends: {:?}", filtered_friends)/println!("DEBUG: Filtered friends: {filtered_friends:?}")/g' "$MAIN_RS"
sed -i 's/format!("Database path: {:?}\\n", db_path)/format!("Database path: {db_path:?}\\n")/g' "$MAIN_RS"

echo "🔧 Phase 8: Cache and count patterns..."

# Fix cache and count patterns
sed -i 's/format!("🎬 Movies in cache: {}\\n", count)/format!("🎬 Movies in cache: {count}\\n")/g' "$MAIN_RS"
sed -i 's/format!("👥 Friends in database: {}\\n", count)/format!("👥 Friends in database: {count}\\n")/g' "$MAIN_RS"
sed -i 's/format!("🖼️ Movies with posters: {}\\n", count)/format!("🖼️ Movies with posters: {count}\\n")/g' "$MAIN_RS"
sed -i 's/format!("❌ Failed to connect to database: {}\\n", e)/format!("❌ Failed to connect to database: {e}\\n")/g' "$MAIN_RS"
sed -i 's/format!("🔥 GENRE PARSE: Failed to parse genre_ids: {}", e)/format!("🔥 GENRE PARSE: Failed to parse genre_ids: {e}")/g' "$MAIN_RS"

echo "🔧 Phase 9: Count emoji patterns..."

# Fix emoji count patterns
sed -i 's/format!("👥👥👥👥👥+ ({})", n)/format!("👥👥👥👥👥+ ({n})")/g' "$MAIN_RS"
sed -i 's/format!("🎭🎭🎭 ({})", n)/format!("🎭🎭🎭 ({n})")/g' "$MAIN_RS"
sed -i 's/format!("🏟️ ({})", n)/format!("🏟️ ({n})")/g' "$MAIN_RS"
sed -i 's/format!("🌍 ({})", n)/format!("🌍 ({n})")/g' "$MAIN_RS"

echo "🔧 Phase 10: Warning patterns..."

# Fix warning patterns
sed -i 's/println!("🎬 TMDB ENHANCE: Warning - failed to cache movie: {}", e)/println!("🎬 TMDB ENHANCE: Warning - failed to cache movie: {e}")/g' "$MAIN_RS"
sed -i 's/println!("🎬 TMDB ENHANCE: Warning - failed to update TMDB ID: {}", e)/println!("🎬 TMDB ENHANCE: Warning - failed to update TMDB ID: {e}")/g' "$MAIN_RS"

echo "🔧 Phase 11: Needless borrows and other patterns..."

# Fix needless borrow
sed -i 's/extract_movies_from_text(&document)/extract_movies_from_text(document)/g' "$MAIN_RS"
sed -i 's/&\[&movie_title as &dyn rusqlite::ToSql\]/[&movie_title as &dyn rusqlite::ToSql]/g' "$MAIN_RS"

# Fix needless question mark
sed -i 's/|row| Ok(row.get::<_, i32>(0)?)/|row| row.get::<_, i32>(0)/g' "$MAIN_RS"

echo "🔧 Phase 12: Never loop patterns..."

# Fix never loop patterns - these need more careful handling
# Pattern 1: for movie in movie_iter { return Ok(Some(movie?)); }
sed -i '/for movie in movie_iter {/{
N
s/for movie in movie_iter {\s*return Ok(Some(movie?));/if let Some(movie) = movie_iter.next() {\
        return Ok(Some(movie?));/
}' "$MAIN_RS"

# Pattern 2: for tmdb_id in tmdb_id_iter { return Ok(Some(tmdb_id?)); }
sed -i '/for tmdb_id in tmdb_id_iter {/{
N
s/for tmdb_id in tmdb_id_iter {\s*return Ok(Some(tmdb_id?));/if let Some(tmdb_id) = tmdb_id_iter.next() {\
        return Ok(Some(tmdb_id?));/
}' "$MAIN_RS"

echo "🔧 Phase 13: Multi-line format patterns..."

# Handle complex multi-line patterns that need manual fixing
# These patterns are too complex for simple sed, so we'll use a more targeted approach

echo "✅ All automatic fixes applied!"
echo "🔍 Testing compilation..."

# Test if the code compiles
if cargo check > /dev/null 2>&1; then
    echo "✅ Code compiles successfully!"
    
    echo "🔍 Checking remaining clippy warnings..."
    warning_count=$(cargo clippy --quiet -- -D warnings 2>&1 | wc -l)
    
    if [ "$warning_count" -eq 0 ]; then
        echo "🎉 All clippy warnings fixed! Clean compilation achieved."
    else
        echo "📊 Reduced warnings to: $warning_count (from ~115)"
        echo "💡 Remaining warnings may need manual fixes"
        
        # Show remaining warnings
        echo "📋 Remaining warnings:"
        cargo clippy --quiet -- -D warnings 2>&1 | head -20
    fi
else
    echo "❌ Compilation failed. Restoring backup..."
    cp "$MAIN_RS.backup."* "$MAIN_RS"
    echo "🔄 Backup restored. Please check the issues manually."
    exit 1
fi

echo "🏁 Clippy fix script completed!"
