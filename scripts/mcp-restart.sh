#!/bin/bash

# MCP Server Restart Script
echo "🔄 Restarting MCP servers..."

# Stop all MCP-related processes
echo "🛑 Stopping existing MCP processes..."
bash "$(dirname "$0")/mcp-stop.sh"

# Wait a moment for cleanup
sleep 2

# Start MCP servers
echo "🚀 Starting MCP servers..."
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_ROOT/.devcontainer/start-mcp-servers.sh" ]; then
    bash "$PROJECT_ROOT/.devcontainer/start-mcp-servers.sh"
else
    echo "⚠️  MCP start script not found at $PROJECT_ROOT/.devcontainer/start-mcp-servers.sh"
    echo "    Please consult the project documentation for instructions on starting MCP servers."
fi

# Wait for startup
sleep 3

# Check status
echo "🔍 Checking MCP server status..."
bash "$(dirname "$0")/mcp-status.sh"
