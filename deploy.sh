#!/bin/bash

# BoxdBuddies Cloudflare Pages Deployment Script
# AI Generated: GitHub Copilot - 2025-01-07

set -e

echo "🚀 BoxdBuddies Cloudflare Pages Deployment"
echo "=========================================="

# Navigate to project root
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Please run this script from the project root."
    exit 1
fi

echo "📁 Current directory: $(pwd)"

# Build frontend
echo "🔨 Building frontend..."
cd web/frontend
npm install
npm run build
cd ../..

echo "✅ Frontend build complete"

# Deploy worker (optional)
if [ "$1" = "--deploy-worker" ]; then
    echo "🌥️ Deploying worker..."
    cd web/worker
    npm install
    wrangler deploy
    cd ../..
    echo "✅ Worker deployed"
fi

# Create D1 database (manual step)
echo "💾 D1 Database Setup:"
echo "To set up the D1 database, run these commands manually:"
echo ""
echo "  wrangler d1 create boxdbuddies-db"
echo "  wrangler d1 execute boxdbuddies-db --file=web/worker/schema.sql"
echo ""
echo "Then update wrangler.toml with the database ID."

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps for Cloudflare Pages dashboard:"
echo "  1. Framework preset: None"
echo "  2. Build command: cd web/frontend && npm install && npm run build"
echo "  3. Build output directory: web/frontend/dist"
echo "  4. Environment variables:"
echo "     NODE_ENV=production"
echo "     VITE_API_URL=https://boxdbuddy.pages.dev"
echo "     VITE_USE_WORKER_API=true"
echo ""
echo "🌐 Live at: https://boxdbuddy.pages.dev"