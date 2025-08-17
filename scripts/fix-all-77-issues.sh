#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Comprehensive clippy fix targeting all 77 identified issues

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
RUST_FILE="$PROJECT_ROOT/src-tauri/src/main.rs"

echo "🔧 Comprehensive Clippy Fix - Targeting All 77 Issues"
echo "=================================================="

cd "$PROJECT_ROOT/src-tauri"

# Create backup
backup_file="src/main.rs.backup.comprehensive.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

echo "🎯 Applying systematic fixes for all format string patterns..."

# Fix all format! patterns with single error variable
sed -i 's/format!("Failed to query watchlist: {}", e)/format!("Failed to query watchlist: {e}")/g' src/main.rs
sed -i 's/format!("Failed to start friend transaction: {}", e)/format!("Failed to start friend transaction: {e}")/g' src/main.rs
sed -i 's/format!("Failed to ensure friend exists: {}", e)/format!("Failed to ensure friend exists: {e}")/g' src/main.rs
sed -i 's/format!("Failed to commit friend transaction: {}", e)/format!("Failed to commit friend transaction: {e}")/g' src/main.rs
sed -i 's/format!("Failed to remove old movies: {}", e)/format!("Failed to remove old movies: {e}")/g' src/main.rs
sed -i 's/format!("Failed to start sync transaction: {}", e)/format!("Failed to start sync transaction: {e}")/g' src/main.rs
sed -i 's/format!("Failed to update sync status: {}", e)/format!("Failed to update sync status: {e}")/g' src/main.rs
sed -i 's/format!("Failed to commit sync transaction: {}", e)/format!("Failed to commit sync transaction: {e}")/g' src/main.rs
sed -i 's/format!("Failed to query sync status: {}", e)/format!("Failed to query sync status: {e}")/g' src/main.rs
sed -i 's/format!("Failed to fetch watchlist page: {}", e)/format!("Failed to fetch watchlist page: {e}")/g' src/main.rs

# Fix format strings with single username/variable
sed -i 's/format!("Watchlist not found for user '\''{}'\''", username)/format!("Watchlist not found for user '\''{username}'\''")/g' src/main.rs
sed -i 's/format!("User '\''{}'\'' not found on Letterboxd", username)/format!("User '\''{username}'\'' not found on Letterboxd")/g' src/main.rs
sed -i 's/format!("Following page not found for user '\''{}'\''", username)/format!("Following page not found for user '\''{username}'\''")/g' src/main.rs

# Fix multi-variable format strings
sed -i 's|format!(\s*"Failed to process movie at row {}: {}",\s*row_count,\s*e\s*)|format!("Failed to process movie at row {row_count}: {e}")|g' src/main.rs

# Fix format strings with placeholders
sed -i 's|format!(\s*"DELETE FROM friend_watchlists WHERE friend_username = ? AND letterboxd_slug NOT IN ({})",\s*placeholders\s*)|format!("DELETE FROM friend_watchlists WHERE friend_username = ? AND letterboxd_slug NOT IN ({placeholders})")|g' src/main.rs

# Fix URL format strings
sed -i 's|format!(\s*"https://letterboxd.com/{}/watchlist/page/{}/",\s*username,\s*page\s*)|format!("https://letterboxd.com/{username}/watchlist/page/{page}/")|g' src/main.rs
sed -i 's|format!(\s*"https://letterboxd.com/{}/following/page/{}/",\s*username,\s*page\s*)|format!("https://letterboxd.com/{username}/following/page/{page}/")|g' src/main.rs

# Fix selector format strings
sed -i 's|format!("a\[href\*='\''/{}/'\''.*\.value", link_type)|format!("a[href*='\''/{link_type}/'\''] .value")|g' src/main.rs

# Fix println! statements with single variable
sed -i 's/println!(\s*"Ensuring friend '\''{}'\'' exists in friends table\.\.\.",\s*friend_username\s*)/println!("Ensuring friend '\''{friend_username}'\'' exists in friends table...")/g' src/main.rs

# Fix complex println! statements
sed -i 's/println!(\s*"🔥 COUNT CHECK: Getting current watchlist count for {} from Letterboxd",\s*username\s*)/println!("🔥 COUNT CHECK: Getting current watchlist count for {username} from Letterboxd")/g' src/main.rs
sed -i 's/println!(\s*"🔥 COUNT CHECK: Found {} actual watchlist movies on page 1",\s*film_count\s*)/println!("🔥 COUNT CHECK: Found {film_count} actual watchlist movies on page 1")/g' src/main.rs
sed -i 's/println!(\s*"🔥 COUNT CHECK: Single page watchlist with {} movies",\s*film_count\s*)/println!("🔥 COUNT CHECK: Single page watchlist with {film_count} movies")/g' src/main.rs

# Fix cache check println statements
sed -i 's/println!(\s*"🔥 CACHE CHECK: Cache too old ({} hours), not fresh",\s*age_hours\s*)/println!("🔥 CACHE CHECK: Cache too old ({age_hours} hours), not fresh")/g' src/main.rs
sed -i 's/println!("🔥 CACHE CHECK: Cache is recent ({} hours), trusting without count verification", age_hours)/println!("🔥 CACHE CHECK: Cache is recent ({age_hours} hours), trusting without count verification")/g' src/main.rs
sed -i 's/println!(\s*"🔥 CACHE CHECK: Current Letterboxd count: {}",\s*current_count\s*)/println!("🔥 CACHE CHECK: Current Letterboxd count: {current_count}")/g' src/main.rs
sed -i 's/println!("🔥 CACHE CHECK: Failed to get current count, assuming cache is fresh: {}", e)/println!("🔥 CACHE CHECK: Failed to get current count, assuming cache is fresh: {e}")/g' src/main.rs

# Fix more complex cache check statements
sed -i 's/println!(\s*"🔥 CACHE CHECK: No sync status found for user {}",\s*friend_username\s*)/println!("🔥 CACHE CHECK: No sync status found for user {friend_username}")/g' src/main.rs
sed -i 's/println!(\s*"🔥 CACHE CHECK: Checking cache freshness for {} (max age: {} hours)",\s*friend_username,\s*max_age_hours\s*)/println!("🔥 CACHE CHECK: Checking cache freshness for {friend_username} (max age: {max_age_hours} hours)")/g' src/main.rs
sed -i 's/println!(\s*"🔥 CACHE CHECK: Cache age: {} hours, is_fresh: {}",\s*age_hours,\s*is_fresh\s*)/println!("🔥 CACHE CHECK: Cache age: {age_hours} hours, is_fresh: {is_fresh}")/g' src/main.rs

# Fix error handling println statements
sed -i 's/println!(\s*"Scraping failed for {}, trying cached data: {}",\s*friend_username,\s*e\s*)/println!("Scraping failed for {friend_username}, trying cached data: {e}")/g' src/main.rs
sed -i 's/eprintln!("🚨 Error saving friends to database: {}", e)/eprintln!("🚨 Error saving friends to database: {e}")/g' src/main.rs

# Fix debug println statements
sed -i 's/println!(\s*"Comparing watchlists for {} with friends: {:?}",\s*main_username,\s*friend_usernames\s*)/println!("Comparing watchlists for {main_username} with friends: {friend_usernames:?}")/g' src/main.rs
sed -i 's/println!(\s*"DEBUG: Filtered out main user '\''{}'\'' from friends list",\s*main_username\s*)/println!("DEBUG: Filtered out main user '\''{main_username}'\'' from friends list")/g' src/main.rs
sed -i 's/println!("DEBUG: Original friends: {:?}", friend_usernames)/println!("DEBUG: Original friends: {friend_usernames:?}")/g' src/main.rs
sed -i 's/println!("DEBUG: Filtered friends: {:?}", filtered_friends)/println!("DEBUG: Filtered friends: {filtered_friends:?}")/g' src/main.rs
sed -i 's/println!(\s*"🔍 DEBUG: First 5 movies from main user ({}):",\s*main_username\s*)/println!("🔍 DEBUG: First 5 movies from main user ({main_username}):")/g' src/main.rs

# Fix remaining debug statements
sed -i 's/println!("  Total '\''/film/'\'' occurrences: {}", film_count)/println!("  Total '\''/film/'\'' occurrences: {film_count}")/g' src/main.rs
sed -i 's/println!("HTML start sample:\\n{}\\n", sample_start)/println!("HTML start sample:\\n{sample_start}\\n")/g' src/main.rs
sed -i 's/println!("HTML end sample:\\n{}\\n", sample_end)/println!("HTML end sample:\\n{sample_end}\\n")/g' src/main.rs
sed -i 's/println!("✓ Found movie '\''{}'\'' in HTML", pattern)/println!("✓ Found movie '\''{pattern}'\'' in HTML")/g' src/main.rs
sed -i 's/println!("DEBUG: Found movie alt text: '\''{}'\''", alt_text)/println!("DEBUG: Found movie alt text: '\''{alt_text}'\''")/g' src/main.rs
sed -i 's/println!(\s*"DEBUG: Extracted movie - Title: '\''{}'\''.*Year: {:?}",\s*title,\s*year\s*)/println!("DEBUG: Extracted movie - Title: '\''{title}'\''.*Year: {year:?}")/g' src/main.rs
sed -i 's/println!("DEBUG: Found movie via target-link - Alt: '\''{}'\''", alt_text)/println!("DEBUG: Found movie via target-link - Alt: '\''{alt_text}'\''")/g' src/main.rs
sed -i 's/println!(\s*"DEBUG: Extracted movie via target-link - Title: '\''{}'\''.*Year: {:?}",\s*title,\s*year\s*)/println!("DEBUG: Extracted movie via target-link - Title: '\''{title}'\''.*Year: {year:?}")/g' src/main.rs
sed -i 's/println!(\s*"🎬 TMDB SEARCH: Searching for '\''{}'\'' (year: {:?})",\s*title,\s*year\s*)/println!("🎬 TMDB SEARCH: Searching for '\''{title}'\'' (year: {year:?})")/g' src/main.rs

# Fix needless borrow issue
sed -i 's/extract_movies_from_text(&document)/extract_movies_from_text(document)/g' src/main.rs

echo "🧪 Testing compilation..."
if cargo check > /dev/null 2>&1; then
    echo "✅ Compilation successful!"
    
    # Count remaining warnings
    warning_count=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
    echo "📊 Remaining warnings: $warning_count"
    
    if [ "$warning_count" -eq 0 ]; then
        echo "🎉 All 77 clippy warnings resolved!"
    else
        echo "📋 Remaining warnings require manual review"
        cargo clippy 2>&1 | grep -A 3 "warning:" | head -20
    fi
    
else
    echo "❌ Compilation failed, restoring backup..."
    cp "$backup_file" src/main.rs
    echo "🔄 Backup restored"
    exit 1
fi

echo "=================================================="
echo "✅ Comprehensive fix complete!"
