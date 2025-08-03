#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Step-by-step clippy fix - Phase 1: Simple println! patterns

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
cd "$PROJECT_ROOT/src-tauri"

echo "🎯 Step-by-Step Clippy Fix - Phase 1: Simple println! patterns"
echo "==========================================================="

# Create backup
backup_file="src/main.rs.backup.phase1.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp src/main.rs "$backup_file"

echo "🔧 Fixing simple println! patterns with single variables..."

# Fix single-variable println patterns
perl -i -pe 's/println!\(\s*"([^"]*)\{\}([^"]*)",\s*([^)]+)\s*\)/println!("$1{$3}$2")/g' src/main.rs

# Fix single-variable eprintln patterns  
perl -i -pe 's/eprintln!\(\s*"([^"]*)\{\}([^"]*)",\s*([^)]+)\s*\)/eprintln!("$1{$3}$2")/g' src/main.rs

echo "🧪 Testing compilation..."
if cargo check > /dev/null 2>&1; then
    echo "✅ Phase 1 compilation successful!"
    
    # Count remaining warnings
    warning_count=$(cargo clippy 2>&1 | grep -c "warning:" || echo "0")
    echo "📊 Warnings after Phase 1: $warning_count"
    
else
    echo "❌ Phase 1 compilation failed, restoring backup..."
    cp "$backup_file" src/main.rs
    echo "🔄 Backup restored"
    exit 1
fi

echo "==========================================================="
echo "✅ Phase 1 complete! Run Phase 2 next."
