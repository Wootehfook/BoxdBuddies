#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Aggressive automated clippy fix - direct pattern matching

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
cd "$PROJECT_ROOT/src-tauri"

echo "🎯 Aggressive Automated Clippy Fix - Phase 2"
echo "==========================================="

# Create backup
backup_file="src/main.rs.backup.aggressive.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

# Function to count warnings and test compilation
check_status() {
    if ! cargo check > /dev/null 2>&1; then
        echo "❌ Compilation failed, restoring backup..."
        cp "$backup_file" src/main.rs
        exit 1
    fi
    local warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
    echo "📊 Current warnings: $warnings"
    return $warnings
}

echo "🔧 Batch 1: Single variable println patterns..."
sed -i 's|println!("Ensuring friend '\''{}'\'' exists in friends table\.\.\.", friend_username)|println!("Ensuring friend '\''{friend_username}'\'' exists in friends table...")|g' src/main.rs
sed -i 's|println!("🔥 COUNT CHECK: Getting current watchlist count for {} from Letterboxd", username)|println!("🔥 COUNT CHECK: Getting current watchlist count for {username} from Letterboxd")|g' src/main.rs
sed -i 's|println!("🔥 COUNT CHECK: Found {} actual watchlist movies on page 1", film_count)|println!("🔥 COUNT CHECK: Found {film_count} actual watchlist movies on page 1")|g' src/main.rs
sed -i 's|println!("🔥 COUNT CHECK: Single page watchlist with {} movies", film_count)|println!("🔥 COUNT CHECK: Single page watchlist with {film_count} movies")|g' src/main.rs
check_status
warnings1=$?

echo "🔧 Batch 2: Cache check patterns..."
sed -i 's|println!("🔥 CACHE CHECK: Cache too old ({} hours), not fresh", age_hours)|println!("🔥 CACHE CHECK: Cache too old ({age_hours} hours), not fresh")|g' src/main.rs
sed -i 's|println!("🔥 CACHE CHECK: Current Letterboxd count: {}", current_count)|println!("🔥 CACHE CHECK: Current Letterboxd count: {current_count}")|g' src/main.rs
sed -i 's|println!("🔥 CACHE CHECK: No sync status found for user {}", friend_username)|println!("🔥 CACHE CHECK: No sync status found for user {friend_username}")|g' src/main.rs
check_status
warnings2=$?

echo "🔧 Batch 3: Debug patterns..."
sed -i 's|println!("DEBUG: Filtered out main user '\''{}'\'' from friends list", main_username)|println!("DEBUG: Filtered out main user '\''{main_username}'\'' from friends list")|g' src/main.rs
sed -i 's|println!("🔍 DEBUG: First 5 movies from main user ({}):", main_username)|println!("🔍 DEBUG: First 5 movies from main user ({main_username}):")|g' src/main.rs
sed -i 's|println!("✓ Found movie '\''{}'\'' in HTML", pattern)|println!("✓ Found movie '\''{pattern}'\'' in HTML")|g' src/main.rs
sed -i 's|println!("DEBUG: Found movie alt text: '\''{}'\''", alt_text)|println!("DEBUG: Found movie alt text: '\''{alt_text}'\''")|g' src/main.rs
sed -i 's|println!("DEBUG: Found movie via target-link - Alt: '\''{}'\''", alt_text)|println!("DEBUG: Found movie via target-link - Alt: '\''{alt_text}'\''")|g' src/main.rs
check_status
warnings3=$?

echo "🔧 Batch 4: TMDB patterns..."
sed -i 's|println!("🎬 TMDB SEARCH: No results found for '\''{}'\''", title)|println!("🎬 TMDB SEARCH: No results found for '\''{title}'\''")|g' src/main.rs
sed -i 's|println!("🎬 TMDB CREDITS: Found director '\''{}'\''", director_name)|println!("🎬 TMDB CREDITS: Found director '\''{director_name}'\''")|g' src/main.rs
sed -i 's|println!("🎬 CACHE DEBUG: Parsing year from date: '\''{}'\''", date)|println!("🎬 CACHE DEBUG: Parsing year from date: '\''{date}'\''")|g' src/main.rs
sed -i 's|println!("🔥 GENRE PARSE: Failed to parse genre_ids: {}", e)|println!("🔥 GENRE PARSE: Failed to parse genre_ids: {e}")|g' src/main.rs
sed -i 's|println!("🎬 TMDB ENHANCE: Warning - failed to cache movie: {}", e)|println!("🎬 TMDB ENHANCE: Warning - failed to cache movie: {e}")|g' src/main.rs
sed -i 's|println!("🎬 TMDB ENHANCE: Warning - failed to update TMDB ID: {}", e)|println!("🎬 TMDB ENHANCE: Warning - failed to update TMDB ID: {e}")|g' src/main.rs
sed -i 's|println!("🗑️ CLEAR CACHE: Clearing cache for movie '\''{}'\''", movie_title)|println!("🗑️ CLEAR CACHE: Clearing cache for movie '\''{movie_title}'\''")|g' src/main.rs
check_status
warnings4=$?

echo "🔧 Batch 5: Format! patterns..."
sed -i 's|format!("👥👥👥👥👥+ ({})", n)|format!("👥👥👥👥👥+ ({n})")|g' src/main.rs
sed -i 's|format!("🎭🎭🎭 ({})", n)|format!("🎭🎭🎭 ({n})")|g' src/main.rs
sed -i 's|format!("🏟️ ({})", n)|format!("🏟️ ({n})")|g' src/main.rs
sed -i 's|format!("🌍 ({})", n)|format!("🌍 ({n})")|g' src/main.rs
sed -i 's|format!("Database path: {:?}\\n", db_path)|format!("Database path: {db_path:?}\\n")|g' src/main.rs
check_status
warnings5=$?

echo "==========================================="
echo "🏁 Aggressive automation complete!"
echo "📊 Progress through batches: 53 → $warnings1 → $warnings2 → $warnings3 → $warnings4 → $warnings5"
echo "📁 Backup saved: $backup_file"

if [ "$warnings5" -eq 0 ]; then
    echo "🎉 SUCCESS: All clippy warnings resolved!"
else
    echo "⚠️  $warnings5 warnings remaining - continuing with next phase..."
fi
