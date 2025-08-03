#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Comprehensive automated clippy warning fix script for BoxdBuddies

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
RUST_FILE="$PROJECT_ROOT/src-tauri/src/main.rs"
BACKUP_FILE="$PROJECT_ROOT/src-tauri/src/main.rs.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 BoxdBuddies Clippy Warning Automation Script"
echo "=============================================="

# Create backup
echo "📁 Creating backup at: $BACKUP_FILE"
cp "$RUST_FILE" "$BACKUP_FILE"

# Change to project directory
cd "$PROJECT_ROOT/src-tauri"

echo "🎯 Applying comprehensive format string fixes..."

# Fix all format! patterns with single variable
sed -i 's/format!("\([^"]*\): {}", \([^)]*\))/format!("\1: {\2}")/g' "$RUST_FILE"

# Fix all format! patterns with multiple variables (common patterns)
sed -i 's/format!("\([^"]*\): {} - {}", \([^,]*\), \([^)]*\))/format!("\1: {\2} - {\3}")/g' "$RUST_FILE"

# Fix println! patterns with single variable
sed -i 's/println!("\([^"]*\): {}", \([^)]*\))/println!("\1: {\2}")/g' "$RUST_FILE"

# Fix println! patterns with multiple variables
sed -i 's/println!("{}:{} - {}", \([^,]*\), \([^,]*\), \([^)]*\))/println!("{\1}:{\2} - {\3}")/g' "$RUST_FILE"

# Specific patterns found in your clippy output
sed -i 's/format!("Failed to prepare insert statement: {}", e)/format!("Failed to prepare insert statement: {e}")/g' "$RUST_FILE"
sed -i 's/format!("Failed to insert friend: {}", e)/format!("Failed to insert friend: {e}")/g' "$RUST_FILE"
sed -i 's/format!("Failed to update sync info: {}", e)/format!("Failed to update sync info: {e}")/g' "$RUST_FILE"
sed -i 's/format!("Failed to commit transaction: {}", e)/format!("Failed to commit transaction: {e}")/g' "$RUST_FILE"

# Additional common patterns
sed -i 's/format!("Failed to begin transaction: {}", e)/format!("Failed to begin transaction: {e}")/g' "$RUST_FILE"
sed -i 's/format!("Failed to prepare statement: {}", e)/format!("Failed to prepare statement: {e}")/g' "$RUST_FILE"
sed -i 's/format!("Failed to execute statement: {}", e)/format!("Failed to execute statement: {e}")/g' "$RUST_FILE"
sed -i 's/format!("Error in get_tmdb_id: {}", e)/format!("Error in get_tmdb_id: {e}")/g' "$RUST_FILE"

echo "🧪 Testing compilation..."
if cargo check > /dev/null 2>&1; then
    echo "✅ Compilation successful!"
else
    echo "❌ Compilation failed, restoring backup..."
    cp "$BACKUP_FILE" "$RUST_FILE"
    echo "🔄 Backup restored. Please check for syntax issues."
    exit 1
fi

echo "🔍 Running clippy check..."
clippy_output=$(cargo clippy 2>&1)
warning_count=$(echo "$clippy_output" | grep -c "warning:" || true)

echo "📊 Clippy Results:"
echo "   Warnings found: $warning_count"

if [ "$warning_count" -eq 0 ]; then
    echo "🎉 All clippy warnings resolved!"
    echo "📁 Backup saved at: $BACKUP_FILE"
else
    echo "⚠️  $warning_count warnings remaining"
    echo "📋 Remaining warnings:"
    echo "$clippy_output" | grep -A 5 "warning:" | head -20
fi

echo "=============================================="
echo "✅ Automation complete!"
