#!/bin/bash

# MCP Server Stop Script
echo "🛑 Stopping MCP servers..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop MCP monitor if running
if pgrep -f "mcp-monitor.sh" > /dev/null; then
    echo "  Stopping MCP monitor..."
    pkill -f "mcp-monitor.sh"
fi

# Stop any MCP-related VS Code processes
if pgrep -f "mcp.*server" > /dev/null; then
    echo "  Stopping MCP server processes..."
    pkill -f "mcp.*server"
fi

# Stop any background MCP processes
if pgrep -f "start-mcp-servers.sh" > /dev/null; then
    echo "  Stopping MCP startup processes..."
    pkill -f "start-mcp-servers.sh"
fi

# Clean up any temporary MCP files
if [ -d "/tmp/mcp-*" ]; then
    echo "  Cleaning up MCP temporary files..."
    rm -rf /tmp/mcp-* 2>/dev/null || true
fi

echo -e "✅ ${GREEN}MCP servers stopped${NC}"
echo ""
echo -e "💡 To restart MCP servers, run: ${YELLOW}npm run mcp:start${NC}"
