#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Simple and reliable clippy automation using Rust's built-in --fix

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
cd "$PROJECT_ROOT/src-tauri"

echo "🤖 Simple Clippy Automation for BoxdBuddies"
echo "==========================================="

# Create backup
backup_file="src/main.rs.backup.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

# Count initial warnings
echo "📊 Counting initial warnings..."
initial_warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
echo "   Initial warnings: $initial_warnings"

# Use Rust's built-in clippy --fix (the most reliable method)
echo "🔧 Running cargo clippy --fix..."
cargo clippy --fix --allow-dirty --allow-staged 2>/dev/null || true

# Test compilation
echo "🧪 Testing compilation..."
if cargo check > /dev/null 2>&1; then
    echo "✅ Compilation successful"
else
    echo "❌ Compilation failed, restoring backup..."
    cp "$backup_file" src/main.rs
    echo "🔄 Backup restored"
    exit 1
fi

# Count final warnings
echo "📊 Counting final warnings..."
final_warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
echo "   Final warnings: $final_warnings"

# Results
if [ "$final_warnings" -eq 0 ]; then
    echo "🎉 SUCCESS: All clippy warnings resolved!"
    echo "📁 Backup: $backup_file"
else
    echo "⚠️  $final_warnings warnings remaining"
    echo "📋 Remaining warnings:"
    cargo clippy 2>&1 | grep -A 3 "warning:" | head -15
fi

echo "==========================================="
echo "✅ Automation complete!"
echo "📈 Progress: $initial_warnings → $final_warnings warnings"
