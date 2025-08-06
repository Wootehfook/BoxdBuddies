#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Advanced clippy automation with iterative fixing and validation

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
RUST_FILE="$PROJECT_ROOT/src-tauri/src/main.rs"

echo "🤖 Advanced Clippy Automation for BoxdBuddies"
echo "============================================="

cd "$PROJECT_ROOT/src-tauri"

# Function to run clippy and get warning count
get_warning_count() {
    cargo clippy 2>&1 | grep -c "warning:" || echo "0"
}

# Function to extract and fix specific patterns from clippy output
fix_clippy_patterns() {
    echo "🔍 Extracting patterns from clippy output..."
    
    # Get clippy output and extract format string warnings
    clippy_output=$(cargo clippy 2>&1)
    
    # Extract format strings that need fixing
    echo "$clippy_output" | grep -A 1 -B 1 "format!" | grep "format!" | while read -r line; do
        if [[ $line =~ format!\(\"([^\"]*)\{[^}]*\}\",[[:space:]]*([^)]*)\) ]]; then
            echo "Found pattern to fix: $line"
        fi
    done
    
    # Apply systematic fixes using Rust's suggested changes
    echo "🛠️  Applying systematic format string fixes..."
    
    # Use Rust's own clippy --fix capability
    echo "📋 Running cargo clippy --fix..."
    cargo clippy --fix --allow-dirty --allow-staged 2>&1 || true
}

# Function to validate fixes don't break compilation
validate_compilation() {
    echo "🧪 Validating compilation..."
    if cargo check > /dev/null 2>&1; then
        echo "✅ Compilation successful"
        return 0
    else
        echo "❌ Compilation failed"
        return 1
    fi
}

# Main automation loop
echo "🎯 Starting iterative clippy fix process..."

initial_warnings=$(get_warning_count)
echo "📊 Initial warnings: $initial_warnings"

# Create timestamped backup
backup_file="$RUST_FILE.auto_backup.$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup: $backup_file"
cp "$RUST_FILE" "$backup_file"

# Try cargo clippy --fix first (Rust's built-in solution)
echo "🔧 Attempting automatic clippy fixes..."
cargo clippy --fix --allow-dirty --allow-staged 2>/dev/null || true

# Validate compilation after auto-fix
if ! validate_compilation; then
    echo "🔄 Auto-fix caused compilation errors, restoring backup..."
    cp "$backup_file" "$RUST_FILE"
fi

# Check remaining warnings
final_warnings=$(get_warning_count)
echo "📊 Final warnings: $final_warnings"

if [ "$final_warnings" -eq 0 ]; then
    echo "🎉 SUCCESS: All clippy warnings resolved!"
    echo "📁 Backup available at: $backup_file"
    
    # Run final validation
    echo "🔍 Final validation..."
    cargo clippy -- -D warnings > /dev/null 2>&1 && echo "✅ Strict clippy check passed!" || echo "⚠️  Some warnings may remain"
else
    echo "⚠️  $final_warnings warnings remaining after automation"
    echo "📋 Remaining warnings require manual intervention:"
    cargo clippy 2>&1 | grep -A 5 "warning:" | head -20
fi

echo "============================================="
echo "✅ Advanced automation complete!"
echo "📈 Progress: $initial_warnings → $final_warnings warnings"
