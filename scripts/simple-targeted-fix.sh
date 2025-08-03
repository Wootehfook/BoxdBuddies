#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Simple and effective targeted clippy fixes

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
cd "$PROJECT_ROOT/src-tauri"

echo "🎯 Simple Targeted Clippy Fix - Proven Patterns"
echo "=============================================="

# Create backup
backup_file="src/main.rs.backup.simple.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

echo "🔧 Fixing patterns we know work..."

# Fix the simple println patterns we've proven work
sed -i 's|println!("Ensuring friend '\''{}'\'' exists in friends table\.\.\.", friend_username)|println!("Ensuring friend '\''{friend_username}'\'' exists in friends table...")|g' src/main.rs
sed -i 's|println!("✓ Found movie '\''{}'\'' in HTML", pattern)|println!("✓ Found movie '\''{pattern}'\'' in HTML")|g' src/main.rs
sed -i 's|println!("DEBUG: Found movie alt text: '\''{}'\''", alt_text)|println!("DEBUG: Found movie alt text: '\''{alt_text}'\''")|g' src/main.rs
sed -i 's|println!("DEBUG: Found movie via target-link - Alt: '\''{}'\''", alt_text)|println!("DEBUG: Found movie via target-link - Alt: '\''{alt_text}'\''")|g' src/main.rs
sed -i 's|println!("🎬 TMDB SEARCH: No results found for '\''{}'\''", title)|println!("🎬 TMDB SEARCH: No results found for '\''{title}'\''")|g' src/main.rs
sed -i 's|println!("🎬 TMDB CREDITS: Found director '\''{}'\''", director_name)|println!("🎬 TMDB CREDITS: Found director '\''{director_name}'\''")|g' src/main.rs
sed -i 's|println!("🎬 CACHE DEBUG: Parsing year from date: '\''{}'\''", date)|println!("🎬 CACHE DEBUG: Parsing year from date: '\''{date}'\''")|g' src/main.rs
sed -i 's|println!("🔥 GENRE PARSE: Failed to parse genre_ids: {}", e)|println!("🔥 GENRE PARSE: Failed to parse genre_ids: {e}")|g' src/main.rs
sed -i 's|println!("🎬 TMDB ENHANCE: Warning - failed to cache movie: {}", e)|println!("🎬 TMDB ENHANCE: Warning - failed to cache movie: {e}")|g' src/main.rs
sed -i 's|println!("🎬 TMDB ENHANCE: Warning - failed to update TMDB ID: {}", e)|println!("🎬 TMDB ENHANCE: Warning - failed to update TMDB ID: {e}")|g' src/main.rs
sed -i 's|println!("🗑️ CLEAR CACHE: Clearing cache for movie '\''{}'\''", movie_title)|println!("🗑️ CLEAR CACHE: Clearing cache for movie '\''{movie_title}'\''")|g' src/main.rs

echo "🧪 Testing compilation after simple fixes..."
if cargo check > /dev/null 2>&1; then
    echo "✅ Simple fixes successful!"
    
    # Count remaining warnings
    warning_count=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
    echo "📊 Warnings after simple fixes: $warning_count"
    
    if [ "$warning_count" -lt 40 ]; then
        echo "🎯 Good progress! Continue with manual fixes for complex patterns."
    fi
    
else
    echo "❌ Simple fixes failed, restoring backup..."
    cp "$backup_file" src/main.rs
    echo "🔄 Backup restored"
    exit 1
fi

echo "=============================================="
echo "✅ Simple targeted fixes complete!"
echo "📁 Backup saved: $backup_file"
echo "🔜 Next: Apply similar pattern to remaining warnings"
