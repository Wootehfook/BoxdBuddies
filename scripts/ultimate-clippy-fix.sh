#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Ultimate clippy automation - uses the proven manual approach systematically

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
cd "$PROJECT_ROOT/src-tauri"

echo "🎯 Ultimate Clippy Automation - Manual Approach at Scale"
echo "====================================================="

# Create backup
backup_file="src/main.rs.backup.ultimate.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

# Get initial count
initial_warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
echo "📊 Initial warnings: $initial_warnings"

echo "🔧 Applying proven manual fixes systematically..."

# Strategy: Use simple sed with very specific patterns that we know work
# Based on the successful manual fixes

# Fix simple single-variable println patterns
sed -i 's|println!("  Total '\''/film/'\'' occurrences: {}", film_count)|println!("  Total '\''/film/'\'' occurrences: {film_count}")|g' src/main.rs
sed -i 's|println!("HTML start sample:\\n{}\\n", sample_start)|println!("HTML start sample:\\n{sample_start}\\n")|g' src/main.rs
sed -i 's|println!("HTML end sample:\\n{}\\n", sample_end)|println!("HTML end sample:\\n{sample_end}\\n")|g' src/main.rs

# Fix more simple println patterns
sed -i 's|println!("✓ Found movie '\''{}'\'' in HTML", pattern)|println!("✓ Found movie '\''{pattern}'\'' in HTML")|g' src/main.rs
sed -i 's|println!("DEBUG: Found movie alt text: '\''{}'\''", alt_text)|println!("DEBUG: Found movie alt text: '\''{alt_text}'\''")|g' src/main.rs
sed -i 's|println!("DEBUG: Found movie via target-link - Alt: '\''{}'\''", alt_text)|println!("DEBUG: Found movie via target-link - Alt: '\''{alt_text}'\''")|g' src/main.rs

# Fix eprintln patterns  
sed -i 's|eprintln!("🚨 Error saving friends to database: {e}")|eprintln!("🚨 Error saving friends to database: {e}")|g' src/main.rs

# Test compilation after each batch
echo "🧪 Testing compilation after println fixes..."
if ! cargo check > /dev/null 2>&1; then
    echo "❌ Compilation failed, restoring backup..."
    cp "$backup_file" src/main.rs
    exit 1
fi

# Fix simple format! patterns
sed -i 's|format!("Failed to query watchlist: {e}")|format!("Failed to query watchlist: {e}")|g' src/main.rs

# Test again
echo "🧪 Testing compilation after format fixes..."
if ! cargo check > /dev/null 2>&1; then
    echo "❌ Compilation failed, restoring backup..."
    cp "$backup_file" src/main.rs
    exit 1
fi

# Check final count
final_warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
echo "📊 Final warnings: $final_warnings"
echo "📈 Progress: $initial_warnings → $final_warnings warnings"

if [ "$final_warnings" -eq 0 ]; then
    echo "🎉 All clippy warnings resolved!"
else
    echo "⚠️  $final_warnings warnings remaining"
    echo "📋 Run 'cargo clippy' to see remaining issues"
fi

echo "====================================================="
echo "✅ Ultimate automation complete!"
