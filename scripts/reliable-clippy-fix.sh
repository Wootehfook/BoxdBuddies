#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Simple and reliable clippy fix using cargo clippy --fix

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
cd "$PROJECT_ROOT/src-tauri"

echo "🤖 Reliable Clippy Fix - Using Rust's Built-in Tools"
echo "=================================================="

# Create backup
backup_file="src/main.rs.backup.reliable.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

# Count initial warnings
echo "📊 Counting initial warnings..."
initial_warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
echo "   Initial warnings: $initial_warnings"

# Use Rust's built-in clippy --fix (most reliable method)
echo "🔧 Running cargo clippy --fix (automatic fixes)..."
cargo clippy --fix --allow-dirty --allow-staged 2>/dev/null || true

# Apply additional manual fixes for the most common patterns that clippy --fix might miss
echo "🛠️  Applying manual fixes for remaining patterns..."

# Fix the most common format string patterns safely
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

# Fix needless borrow
sed -i 's/extract_movies_from_text(&document)/extract_movies_from_text(document)/g' src/main.rs

echo "🧪 Testing compilation..."
if cargo check > /dev/null 2>&1; then
    echo "✅ Compilation successful!"
    
    # Count final warnings
    final_warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
    echo "📊 Final warnings: $final_warnings"
    
    if [ "$final_warnings" -eq 0 ]; then
        echo "🎉 All clippy warnings resolved!"
        echo "📁 Backup saved: $backup_file"
    else
        echo "⚠️  $final_warnings warnings remaining"
        echo "📋 Remaining warnings (first 10):"
        cargo clippy 2>&1 | grep -A 2 "warning:" | head -20
    fi
    
    echo "📈 Progress: $initial_warnings → $final_warnings warnings"
    
else
    echo "❌ Compilation failed, restoring backup..."
    cp "$backup_file" src/main.rs
    echo "🔄 Backup restored"
    exit 1
fi

echo "=================================================="
echo "✅ Reliable fix complete!"
