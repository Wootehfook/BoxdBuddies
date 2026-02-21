#!/bin/bash
# AI Generated: GitHub Copilot (Claude Haiku 4.5) - 2026-02-21
# Post-create script for BoxdBuddies DevContainer
# Automates development environment setup
# Note: This script is best-effort; errors won't fail the DevContainer setup

# Allow the script to continue even if some commands fail (no fail-fast)
set +e

echo "=========================================="
echo "🚀 BoxdBuddies Development Environment Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install npm dependencies (if needed)
echo "${BLUE}📦 Checking npm dependencies...${NC}"
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  if [ -f "package-lock.json" ]; then
    echo "${BLUE}Installing npm dependencies with npm ci (lockfile detected)...${NC}"
    npm ci --prefer-offline --no-audit 2>&1 || {
      echo "${YELLOW}⚠️  npm ci encountered permission or filesystem issues.${NC}"
      echo "${YELLOW}   This is common with cross-platform mounts.${NC}"
      echo "${YELLOW}   You can retry inside the container with: npm ci --prefer-offline${NC}"
    }
  else
    echo "${BLUE}No package-lock.json found; installing dependencies with npm install...${NC}"
    npm install --prefer-offline --no-audit 2>&1 || {
      echo "${YELLOW}⚠️  npm install encountered permission or filesystem issues.${NC}"
      echo "${YELLOW}   This is common with cross-platform mounts.${NC}"
      echo "${YELLOW}   You can retry inside the container with: npm install --prefer-offline${NC}"
    }
  fi
  echo "${GREEN}✓ Dependency check complete${NC}"
else
  echo "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 2: Set up git hooks (husky)
echo "${BLUE}🪝 Setting up git hooks...${NC}"
if npm run prepare 2>/dev/null; then
  echo "${GREEN}✓ Git hooks configured${NC}"
else
  echo "${YELLOW}ℹ️  Git hooks setup skipped (optional)${NC}"
fi
echo ""

# Step 3: Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo "${BLUE}🔐 Creating .env.local template...${NC}"
  cat > .env.local << 'EOF'
# Local development environment variables
# Note: These are NOT committed to git

# Cloudflare secrets (needed for local development with wrangler)
# TMDB_API_KEY=your_tmdb_api_key_here
# ADMIN_SECRET=your_admin_secret_here

# Local development URLs
VITE_API_URL=http://localhost:8787

# Optional: Override for local testing
# DEBUG=*
EOF
  echo "${YELLOW}⚠️  Created .env.local template${NC}"
  echo "${YELLOW}   Please add your secrets (TMDB_API_KEY, ADMIN_SECRET)${NC}"
else
  echo "${YELLOW}ℹ️  .env.local already exists${NC}"
fi
echo ""

# Step 4: Run type checking
echo "${BLUE}🔍 Running TypeScript type checking...${NC}"
if npm run type-check; then
  echo "${GREEN}✓ Type checking passed${NC}"
else
  echo "${YELLOW}⚠️  Type checking found issues (see above)${NC}"
fi
echo ""

# Step 5: Run linting
echo "${BLUE}🎨 Running ESLint...${NC}"
if npm run lint; then
  echo "${GREEN}✓ Linting passed${NC}"
else
  echo "${YELLOW}⚠️  Some lint warnings found (see above)${NC}"
fi
echo ""

# Step 6: Display next steps
echo "${GREEN}=========================================="
echo "✅ Dev Environment Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "${BLUE}📖 Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Frontend Development:${NC}"
echo "   npm run dev"
echo "   → Available at http://localhost:5173"
echo ""
echo "2. ${YELLOW}Run Tests:${NC}"
echo "   npm run test:watch        (watch mode)"
echo "   npm run test             (run once)"
echo ""
echo "3. ${YELLOW}Code Quality:${NC}"
echo "   npm run lint             (check)"
echo "   npm run lint:fix         (fix issues)"
echo "   npm run format:check     (check formatting)"
echo "   npm run format           (auto-format)"
echo ""
echo "4. ${YELLOW}Backend Development (Cloudflare):${NC}"
echo "   npm run build            (build for deployment)"
echo "   npm run cloudflare:dev   (local preview with functions)"
echo "   → Available at http://localhost:8787"
echo ""
echo "5. ${YELLOW}Database Setup (if needed):${NC}"
echo "   Add your Cloudflare secrets first:"
echo "   wrangler secret put TMDB_API_KEY"
echo "   wrangler secret put ADMIN_SECRET"
echo ""
echo "6. ${YELLOW}SonarLint Setup (Optional):${NC}"
echo "   - Install SonarLint extension (already installed)"
echo "   - Connect to SonarCloud for team rulesets (optional)"
echo "   - Use local mode for real-time code quality feedback"
echo ""
echo "📚 For more info, see:"
echo "   ~/README.md              - Main documentation"
echo "   ~/functions/README.md    - Backend API contracts"
echo "   ~/docs/                  - Additional guides"
echo ""
echo "${BLUE}Happy coding! 🎬${NC}"
echo ""

# Always exit successfully - the container is usable even if some steps had warnings
exit 0
