#!/bin/bash

# AI Generated: GitHub Copilot - 2025-08-03
# Two-Phase Clippy Fix: Phase 1 fixes ALL clippy warnings, Phase 2 fixes compilation

echo "🎯 TWO-PHASE CLIPPY AUTOMATION"
echo "==============================================="
echo "Phase 1: Fix ALL clippy warnings (ignore compilation)"
echo "Phase 2: Fix compilation while maintaining clippy compliance"
echo ""

cd "$(dirname "$0")/.."

# Create safety backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cp src/main.rs src/main.rs.two_phase_backup.$TIMESTAMP
echo "✅ Safety backup created: src/main.rs.two_phase_backup.$TIMESTAMP"

echo ""
echo "🔍 PHASE 1: Aggressive clippy fixing (ignore compilation errors)"
echo "==============================================="

# Count initial warnings
INITIAL_WARNINGS=$(cargo clippy --quiet 2>&1 | grep -c "warning:" || echo "0")
echo "📊 Initial clippy warnings: $INITIAL_WARNINGS"

# Phase 1: Fix ALL format string patterns
echo "📝 Step 1: Fixing format! patterns..."

# Fix format! with single variable
sed -i 's/format!("\([^"]*\){}", \([^)]*\))/format!("\1{\2}")/g' src/main.rs
sed -i 's/format!("\([^"]*\){:?}", \([^)]*\))/format!("\1{\2:?}")/g' src/main.rs

# Fix println! with single variable
sed -i 's/println!("\([^"]*\){}", \([^)]*\))/println!("\1{\2}")/g' src/main.rs
sed -i 's/println!("\([^"]*\){:?}", \([^)]*\))/println!("\1{\2:?}")/g' src/main.rs

# Fix eprintln! patterns
sed -i 's/eprintln!("\([^"]*\){}", \([^)]*\))/eprintln!("\1{\2}")/g' src/main.rs

echo "📝 Step 2: Fixing multi-line format patterns..."

# Fix multi-line println! patterns
sed -i ':a;N;$!ba;s/println!(\n[[:space:]]*"\([^"]*\){}\([^"]*\)",\n[[:space:]]*\([^)]*\)\n[[:space:]]*);/println!("\1{\3}\2");/g' src/main.rs

# Fix multi-line format! patterns  
sed -i ':a;N;$!ba;s/format!(\n[[:space:]]*"\([^"]*\){}\([^"]*\)",\n[[:space:]]*\([^)]*\)\n[[:space:]]*)/format!("\1{\3}\2")/g' src/main.rs

echo "📝 Step 3: Fixing multi-variable patterns..."

# Fix two-variable patterns
sed -i 's/format!("\([^"]*\){}\([^"]*\){}\([^"]*\)", \([^,]*\), \([^)]*\))/format!("\1{\4}\2{\5}\3")/g' src/main.rs
sed -i 's/println!("\([^"]*\){}\([^"]*\){}\([^"]*\)", \([^,]*\), \([^)]*\))/println!("\1{\4}\2{\5}\3")/g' src/main.rs

# Fix three-variable patterns
sed -i 's/format!("\([^"]*\){}\([^"]*\){}\([^"]*\){}\([^"]*\)", \([^,]*\), \([^,]*\), \([^)]*\))/format!("\1{\5}\2{\6}\3{\7}\4")/g' src/main.rs
sed -i 's/println!("\([^"]*\){}\([^"]*\){}\([^"]*\){}\([^"]*\)", \([^,]*\), \([^,]*\), \([^)]*\))/println!("\1{\5}\2{\6}\3{\7}\4")/g' src/main.rs

echo "📝 Step 4: Fixing logic patterns (never_loop, needless_question_mark)..."

# Fix never_loop patterns - replace with direct return
sed -i '/for .* in .*_iter {/{
    N
    s/for \([^{]*\) in \([^{]*\) {\n[[:space:]]*return Ok(Some(\([^)]*\)));/return \2.next().transpose().map(|opt| opt.map(Some)).unwrap_or(Ok(None));/
}' src/main.rs

# Fix needless_question_mark patterns
sed -i 's/|row| Ok(row\.get::<_, \([^>]*\)>(0)?)/|row| row.get::<_, \1>(0)/g' src/main.rs

echo "📝 Step 5: Fixing needless_borrows pattern..."

# Fix needless_borrows_for_generic_args
sed -i 's/&\[\([^]]*\) as &dyn rusqlite::ToSql\]/\[\1\]/g' src/main.rs

echo ""
echo "📊 PHASE 1 RESULTS:"
PHASE1_WARNINGS=$(cargo clippy --quiet 2>&1 | grep -c "warning:" || echo "0")
echo "Clippy warnings after Phase 1: $PHASE1_WARNINGS"
echo "Warnings fixed in Phase 1: $((INITIAL_WARNINGS - PHASE1_WARNINGS))"

# Check if Phase 1 broke compilation
if cargo check --quiet > /dev/null 2>&1; then
    echo "✅ Compilation still works after Phase 1"
    COMPILATION_BROKEN=false
else
    echo "⚠️ Compilation broken after Phase 1 (expected - will fix in Phase 2)"
    COMPILATION_BROKEN=true
fi

echo ""
echo "🔧 PHASE 2: Fix compilation while maintaining clippy compliance"
echo "==============================================="

if [ "$COMPILATION_BROKEN" = true ]; then
    echo "🔧 Fixing compilation issues..."
    
    # If we broke never_loop fixes, restore simpler pattern
    if ! cargo check --quiet > /dev/null 2>&1; then
        echo "  🔄 Adjusting never_loop fixes..."
        # Restore iterator patterns that may have broken compilation
        sed -i 's/return \([^.]*\)\.next()\.transpose()\.map(|opt| opt\.map(Some))\.unwrap_or(Ok(None));/if let Some(result) = \1.next() { return Ok(Some(result?)); } return Ok(None);/g' src/main.rs
    fi
    
    # Test compilation again
    if cargo check --quiet > /dev/null 2>&1; then
        echo "✅ Compilation fixed!"
    else
        echo "❌ Still have compilation issues. Manual review needed."
        echo "First few compilation errors:"
        cargo check 2>&1 | head -10
    fi
else
    echo "✅ No compilation fixes needed"
fi

echo ""
echo "🎯 FINAL RESULTS:"
echo "==============================================="
FINAL_WARNINGS=$(cargo clippy --quiet 2>&1 | grep -c "warning:" || echo "0")
FINAL_COMPILATION=$(cargo check --quiet > /dev/null 2>&1 && echo "✅ Pass" || echo "❌ Fail")

echo "Initial clippy warnings: $INITIAL_WARNINGS"
echo "Final clippy warnings: $FINAL_WARNINGS"
echo "Warnings fixed: $((INITIAL_WARNINGS - FINAL_WARNINGS))"
echo "Compilation status: $FINAL_COMPILATION"

if [ "$FINAL_WARNINGS" = "0" ] && [ "$FINAL_COMPILATION" = "✅ Pass" ]; then
    echo "🎉 SUCCESS: All clippy warnings fixed and compilation working!"
    echo "🏆 Phase 4 Code Quality: COMPLETE"
else
    echo "📈 Progress made, remaining issues:"
    if [ "$FINAL_WARNINGS" != "0" ]; then
        echo "  - $FINAL_WARNINGS clippy warnings remain"
    fi
    if [ "$FINAL_COMPILATION" != "✅ Pass" ]; then
        echo "  - Compilation issues remain"
    fi
fi

echo ""
echo "📁 Backups available:"
echo "  - src/main.rs.two_phase_backup.$TIMESTAMP (before any changes)"
echo ""
echo "🎯 TWO-PHASE CLIPPY AUTOMATION: COMPLETED"
