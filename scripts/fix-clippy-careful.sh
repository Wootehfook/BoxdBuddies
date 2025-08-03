#!/bin/bash

# BoxdBuddies - Careful Clippy Warning Fix Script
# Generated: August 3, 2025
# Purpose: Fix clippy warnings with careful pattern matching

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$SCRIPT_DIR/../src-tauri"
MAIN_RS="$TAURI_DIR/src/main.rs"

echo "🔧 Starting careful clippy warning fixes..."
echo "Target file: $MAIN_RS"

# Backup the original file
cp "$MAIN_RS" "$MAIN_RS.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Created backup file"

cd "$TAURI_DIR"

echo "🔧 Phase 1: Safe error message format strings..."

# Only fix the simplest, safest patterns first
sed -i 's/format!("Failed to create HTTP client: {}", e)/format!("Failed to create HTTP client: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to open database: {}", e)/format!("Failed to open database: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to send TMDB search request: {}", e)/format!("Failed to send TMDB search request: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to parse TMDB search response: {}", e)/format!("Failed to parse TMDB search response: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to send TMDB details request: {}", e)/format!("Failed to send TMDB details request: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to parse TMDB movie details: {}", e)/format!("Failed to parse TMDB movie details: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to send TMDB credits request: {}", e)/format!("Failed to send TMDB credits request: {e}")/g' "$MAIN_RS"
sed -i 's/format!("Failed to parse TMDB credits response: {}", e)/format!("Failed to parse TMDB credits response: {e}")/g' "$MAIN_RS"

echo "🔧 Phase 2: URL patterns..."
sed -i 's|format!("https://api.themoviedb.org/3/movie/{}", tmdb_id)|format!("https://api.themoviedb.org/3/movie/{tmdb_id}")|g' "$MAIN_RS"
sed -i 's|format!("https://api.themoviedb.org/3/movie/{}/credits", tmdb_id)|format!("https://api.themoviedb.org/3/movie/{tmdb_id}/credits")|g' "$MAIN_RS"
sed -i 's|format!("https://image.tmdb.org/t/p/w500{}", path)|format!("https://image.tmdb.org/t/p/w500{path}")|g' "$MAIN_RS"

echo "🔧 Phase 3: Simple println patterns..."
sed -i 's/println!("URL: {}", url)/println!("URL: {url}")/g' "$MAIN_RS"

echo "🔧 Phase 4: Test compilation..."

# Test if the code compiles after each phase
if cargo check > /dev/null 2>&1; then
    echo "✅ Phase 4 passed - Code compiles successfully!"
    
    echo "🔍 Checking clippy status..."
    warning_count=$(cargo clippy --quiet -- -D warnings 2>&1 | wc -l)
    
    echo "📊 Current warning count: $warning_count"
    
    if [ "$warning_count" -eq 0 ]; then
        echo "🎉 All clippy warnings fixed! Clean compilation achieved."
    else
        echo "📋 Sample remaining warnings:"
        cargo clippy --quiet -- -D warnings 2>&1 | head -10
        echo ""
        echo "💡 Need manual fixes for remaining warnings"
    fi
else
    echo "❌ Compilation failed. Restoring backup..."
    cp "$MAIN_RS.backup."* "$MAIN_RS"
    echo "🔄 Backup restored."
    exit 1
fi

echo "🏁 Careful clippy fix script completed!"
