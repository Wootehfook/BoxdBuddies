#!/bin/bash
# AI Generated: GitHub Copilot - 2025-08-03
# Comprehensive Clippy Automation Suite for BoxdBuddies
# Provides multiple automation strategies for different scenarios

set -e

PROJECT_ROOT="/mnt/c/Projects/BoxdBuddies"
RUST_FILE="$PROJECT_ROOT/src-tauri/src/main.rs"

echo "🤖 BoxdBuddies Clippy Automation Suite"
echo "======================================"

cd "$PROJECT_ROOT/src-tauri"

# Function to count warnings
count_warnings() {
    cargo clippy 2>&1 | grep -c "warning:" || echo "0"
}

# Function to create backup
create_backup() {
    local backup_file="src/main.rs.backup.$(date +%Y%m%d_%H%M%S)"
    cp src/main.rs "$backup_file"
    echo "📁 Backup created: $backup_file"
}

# Strategy 1: Use Rust's built-in clippy --fix
strategy_builtin_fix() {
    echo "🔧 Strategy 1: Using cargo clippy --fix"
    cargo clippy --fix --allow-dirty --allow-staged 2>/dev/null || true
}

# Strategy 2: Manual sed-based fixes for specific patterns
strategy_manual_patterns() {
    echo "🔧 Strategy 2: Manual pattern fixes"
    
    # Common format string patterns
    sed -i 's/format!("Failed to prepare insert statement: {}", e)/format!("Failed to prepare insert statement: {e}")/g' src/main.rs
    sed -i 's/format!("Failed to insert friend: {}", e)/format!("Failed to insert friend: {e}")/g' src/main.rs
    sed -i 's/format!("Failed to update sync info: {}", e)/format!("Failed to update sync info: {e}")/g' src/main.rs
    sed -i 's/format!("Failed to commit transaction: {}", e)/format!("Failed to commit transaction: {e}")/g' src/main.rs
    sed -i 's/format!("Failed to begin transaction: {}", e)/format!("Failed to begin transaction: {e}")/g' src/main.rs
    sed -i 's/format!("Failed to prepare statement: {}", e)/format!("Failed to prepare statement: {e}")/g' src/main.rs
    sed -i 's/format!("Failed to execute statement: {}", e)/format!("Failed to execute statement: {e}")/g' src/main.rs
    sed -i 's/format!("Error in get_tmdb_id: {}", e)/format!("Error in get_tmdb_id: {e}")/g' src/main.rs
}

# Strategy 3: Comprehensive regex-based fixes
strategy_comprehensive_regex() {
    echo "🔧 Strategy 3: Comprehensive regex fixes"
    
    # Fix all single-variable format strings
    sed -i 's/format!("\([^"]*\): {}", \([^)]*\))/format!("\1: {\2}")/g' src/main.rs
    
    # Fix println patterns
    sed -i 's/println!("\([^"]*\): {}", \([^)]*\))/println!("\1: {\2}")/g' src/main.rs
}

# Validation function
validate_changes() {
    echo "🧪 Validating changes..."
    if cargo check > /dev/null 2>&1; then
        echo "✅ Compilation successful"
        return 0
    else
        echo "❌ Compilation failed"
        return 1
    fi
}

# Main automation process
echo "📊 Initial warning count: $(count_warnings)"

# Create backup before any changes
create_backup

# Try strategies in order
strategies=("strategy_builtin_fix" "strategy_manual_patterns" "strategy_comprehensive_regex")

for strategy in "${strategies[@]}"; do
    echo ""
    echo "🎯 Trying $strategy..."
    
    # Save current state
    cp src/main.rs "src/main.rs.temp"
    
    # Apply strategy
    $strategy
    
    # Validate
    if validate_changes; then
        current_warnings=$(count_warnings)
        echo "✅ $strategy successful - Warnings: $current_warnings"
        
        if [ "$current_warnings" -eq 0 ]; then
            echo "🎉 All warnings resolved with $strategy!"
            break
        fi
    else
        echo "❌ $strategy caused compilation errors, reverting..."
        cp "src/main.rs.temp" src/main.rs
    fi
done

# Final results
final_warnings=$(count_warnings)
echo ""
echo "======================================"
echo "🏁 Final Results:"
echo "   Warnings remaining: $final_warnings"

if [ "$final_warnings" -eq 0 ]; then
    echo "🎉 SUCCESS: All clippy warnings resolved!"
    
    # Run strict validation
    if cargo clippy -- -D warnings > /dev/null 2>&1; then
        echo "✅ Strict clippy validation passed!"
    else
        echo "⚠️  Some edge case warnings may remain"
    fi
else
    echo "📋 Remaining warnings:"
    cargo clippy 2>&1 | grep -A 3 "warning:" | head -10
fi

# Cleanup
rm -f src/main.rs.temp

echo "======================================"
echo "✅ Automation suite complete!"
