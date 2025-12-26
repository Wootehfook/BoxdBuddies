#!/bin/bash
# Test script for versioning workflows
# This script validates the logic used in GitHub Actions workflows.
# Usage (recommended in CI): bash scripts/test-versioning-workflows.sh
# If you want to run it directly, ensure it is executable: chmod +x scripts/test-versioning-workflows.sh

set -e

SCRIPT_DIR="/home/runner/work/BoxdBuddies/BoxdBuddies"
TEST_DIR="/tmp/versioning_test"

echo "=== Versioning Workflow Test Suite ==="
echo ""

# Create test environment
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$SCRIPT_DIR"

# Test 1: Extract unreleased changes
echo "Test 1: Extract unreleased changes from CHANGELOG.md"
awk '
/## \[Unreleased\]/ { in_unreleased=1; next }
in_unreleased && /^## \[/ { exit }
in_unreleased { print }
' CHANGELOG.md > "$TEST_DIR/unreleased.md"

if [ -s "$TEST_DIR/unreleased.md" ]; then
    echo "✅ Successfully extracted unreleased changes"
    LINES=$(wc -l < "$TEST_DIR/unreleased.md")
    echo "   Found $LINES lines of content"
else
    echo "❌ Failed to extract unreleased changes"
    exit 1
fi
echo ""

# Test 2: Simulate version bump
echo "Test 2: Simulate version bump and CHANGELOG update"
NEW_VERSION="2.2.0-test"
DATE=$(date +%Y-%m-%d)

{
  echo "# Changelog"
  echo ""
  echo "All notable changes to this project will be documented in this file."
  echo ""
  echo "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),"
  echo "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)."
  echo ""
  echo "## [Unreleased]"
  echo ""
  echo "## [$NEW_VERSION] - $DATE"
  cat "$TEST_DIR/unreleased.md"
  echo ""
  awk '/^## \[[0-9]/ { printing=1 } printing { print }' CHANGELOG.md
} > "$TEST_DIR/changelog_updated.md"

if [ -s "$TEST_DIR/changelog_updated.md" ]; then
    echo "✅ Successfully created updated CHANGELOG"
    
    # Verify structure
    if grep -q "## \[Unreleased\]" "$TEST_DIR/changelog_updated.md" && \
       grep -q "## \[$NEW_VERSION\]" "$TEST_DIR/changelog_updated.md" && \
       grep -q "## \[2.1.0\]" "$TEST_DIR/changelog_updated.md"; then
        echo "✅ CHANGELOG structure is correct"
        
        # Check for duplicates
        DUPLICATE_COUNT=$(grep -c "## \[2.1.0\]" "$TEST_DIR/changelog_updated.md")
        if [ "$DUPLICATE_COUNT" -eq 1 ]; then
            echo "✅ No duplicate version entries found"
        else
            echo "❌ Found duplicate version entries"
            exit 1
        fi
    else
        echo "❌ CHANGELOG structure is incorrect"
        exit 1
    fi
else
    echo "❌ Failed to create updated CHANGELOG"
    exit 1
fi
echo ""

# Test 3: Validate PR title parsing
echo "Test 3: Validate PR title parsing for changelog categories"
test_pr_titles=(
    "feat: add new feature|Added"
    "fix: correct bug|Fixed"
    "chore: update dependencies|Changed"
    "docs: update README|Changed"
    "feat(auth): add login|Added"
    "fix(ui): correct layout|Fixed"
)

for test_case in "${test_pr_titles[@]}"; do
    IFS='|' read -r pr_title expected_type <<< "$test_case"
    
    # Simulate the logic from changelog-update.yml
    CHANGE_TYPE="Changed"
    if [[ "$pr_title" =~ ^feat(\(.*\))?:.*$ ]]; then
        CHANGE_TYPE="Added"
    elif [[ "$pr_title" =~ ^fix(\(.*\))?:.*$ ]]; then
        CHANGE_TYPE="Fixed"
    fi
    
    if [ "$CHANGE_TYPE" = "$expected_type" ]; then
        echo "✅ '$pr_title' → $CHANGE_TYPE"
    else
        echo "❌ '$pr_title' → Expected: $expected_type, Got: $CHANGE_TYPE"
        exit 1
    fi
done
echo ""

# Test 4: Validate package.json version reading
echo "Test 4: Validate package.json version reading"
CURRENT_VERSION=$(node -p "require('./package.json').version")
if [ -n "$CURRENT_VERSION" ]; then
    echo "✅ Successfully read version: $CURRENT_VERSION"
else
    echo "❌ Failed to read version from package.json"
    exit 1
fi
echo ""

# Test 5: Validate workflow YAML syntax
echo "Test 5: Validate workflow YAML syntax"
for workflow in .github/workflows/version-bump.yml .github/workflows/changelog-update.yml; do
    if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
        echo "✅ $workflow is valid YAML"
    else
        echo "❌ $workflow has YAML syntax errors"
        exit 1
    fi
done
echo ""

# Summary
echo "==================================="
echo "✅ All tests passed!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Merge this PR to test the changelog-update workflow"
echo "2. Use the 'Version Bump and Release' workflow to create a release"
echo ""

# Clean up
rm -rf "$TEST_DIR"
