#!/usr/bin/env bash
# AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-15
#
# Boxdbud.io - Git Hooks Setup Script
# Copyright (C) 2024-2026 Woo T. Fook
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.
#
# Author: Woo T. Fook
# Application built by AI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.husky"

echo "Setting up Git hooks for Boxdbud.io..."

# Ensure .husky directory exists
if [ ! -d "$HOOKS_DIR" ]; then
  echo "Error: .husky directory not found. Run 'npm install' first."
  exit 1
fi

# Create pre-push hook
PRE_PUSH_HOOK="$HOOKS_DIR/pre-push"

# Backup existing hook if it exists and is different
if [ -f "$PRE_PUSH_HOOK" ]; then
  echo "⚠️  Pre-push hook already exists. Creating backup..."
  cp "$PRE_PUSH_HOOK" "$PRE_PUSH_HOOK.backup.$(date +%Y%m%d_%H%M%S)"
  echo "✅ Backup created: $PRE_PUSH_HOOK.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > "$PRE_PUSH_HOOK" << 'EOF'
#!/bin/sh
# AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-15
# Pre-push hook to prevent accidental direct pushes to main or develop

# Get the current branch name
current_branch=$(git symbolic-ref --short HEAD)

# Check if pushing to protected branches
if [ "$current_branch" = "main" ] || [ "$current_branch" = "develop" ]; then
  echo "❌ ERROR: Direct push to '$current_branch' is not allowed!"
  echo ""
  echo "This repository uses a Gitflow-style branching workflow."
  echo ""
  echo "To contribute, please:"
  echo "  1. Create a feature branch from develop:"
  echo "     git checkout develop"
  echo "     git pull origin develop"
  echo "     git checkout -b feature/your-feature-name"
  echo ""
  echo "  2. Make your changes and commit them"
  echo ""
  echo "  3. Push your feature branch:"
  echo "     git push -u origin feature/your-feature-name"
  echo ""
  echo "  4. Create a pull request targeting 'develop'"
  echo ""
  echo "To bypass this check (emergencies only), use: git push --no-verify"
  exit 1
fi

# Allow push for all other branches
exit 0
EOF

# Make the hook executable
chmod +x "$PRE_PUSH_HOOK"

echo "✅ Git hooks installed successfully!"
echo ""
echo "Pre-push hook will now prevent direct pushes to 'main' and 'develop'."
echo "Use 'git push --no-verify' to bypass in emergencies."
