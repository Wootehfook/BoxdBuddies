#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Targeted automation for remaining 53 clippy warnings

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
cd "$PROJECT_ROOT/src-tauri"

echo "🎯 Targeted Clippy Fix - Phase 2: Remaining 53 Warnings"
echo "======================================================"

# Create backup
backup_file="src/main.rs.backup.targeted.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

# Get initial count
initial_warnings=$(get_errors 2>/dev/null | grep -c "warning:" || echo "53")
echo "📊 Initial warnings: $initial_warnings"

echo "🔧 Phase 1: Simple single-variable println! patterns..."

# Simple println patterns (one variable)
python3 -c "
import re
import sys

with open('src/main.rs', 'r') as f:
    content = f.read()

# Fix simple println patterns with single variables
patterns = [
    (r'println!\(\s*\"([^\"]*)\{\}([^\"]*)\",\s*([^)]+)\s*\)', r'println!(\"\1{\3}\2\")'),
    (r'println!\(\s*\"([^\"]*)\{\}([^\"]*)\",\s*([^,)]+)\s*\)', r'println!(\"\1{\3}\2\")'),
    # Fix format! patterns with single variables
    (r'format!\(\s*\"([^\"]*)\{\}([^\"]*)\",\s*([^)]+)\s*\)', r'format!(\"\1{\3}\2\")'),
]

for pattern, replacement in patterns:
    content = re.sub(pattern, replacement, content)

with open('src/main.rs', 'w') as f:
    f.write(content)
"

echo "🧪 Testing compilation after Phase 1..."
if ! cargo check > /dev/null 2>&1; then
    echo "❌ Phase 1 failed, restoring backup..."
    cp "$backup_file" src/main.rs
    exit 1
fi

echo "🔧 Phase 2: Multi-variable patterns..."

# Fix specific multi-variable patterns we know about
sed -i 's/format!(\s*"Failed to process movie at row {}: {}",\s*row_count, e\s*)/format!("Failed to process movie at row {row_count}: {e}")/g' src/main.rs
sed -i 's/format!(\s*"https:\/\/letterboxd\.com\/{}\/(watchlist|following)\/page\/{}\/*",\s*username, page\s*)/format!("https:\/\/letterboxd.com\/{username}\/\1\/page\/{page}\/")/g' src/main.rs

echo "🧪 Testing compilation after Phase 2..."
if ! cargo check > /dev/null 2>&1; then
    echo "❌ Phase 2 failed, restoring backup..."
    cp "$backup_file" src/main.rs
    exit 1
fi

echo "🔧 Phase 3: Logic fixes..."

# Fix never_loop warnings by replacing loops with direct returns
python3 -c "
import re

with open('src/main.rs', 'r') as f:
    content = f.read()

# Fix never_loop patterns
content = re.sub(
    r'for ([^{]+) in ([^{]+) \{\s*return Ok\(Some\(([^)]+)\?\)\);\s*\}',
    r'\2.next().map(|item| item.map(Some)).transpose()',
    content
)

# Fix needless_question_mark
content = re.sub(
    r'\|row\| Ok\(row\.get::<_, i32>\(0\)\?\)',
    r'|row| row.get::<_, i32>(0)',
    content
)

with open('src/main.rs', 'w') as f:
    f.write(content)
"

echo "🧪 Testing compilation after Phase 3..."
if ! cargo check > /dev/null 2>&1; then
    echo "❌ Phase 3 failed, restoring backup..."
    cp "$backup_file" src/main.rs
    exit 1
fi

# Get final count
final_warnings=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
echo "📊 Final warnings: $final_warnings"
echo "📈 Progress: $initial_warnings → $final_warnings warnings"

if [ "$final_warnings" -eq 0 ]; then
    echo "🎉 All clippy warnings resolved!"
    echo "📁 Backup saved: $backup_file"
else
    echo "⚠️  $final_warnings warnings remaining"
    echo "📋 Run 'cargo clippy' to see remaining issues"
fi

echo "======================================================"
echo "✅ Targeted automation complete!"
