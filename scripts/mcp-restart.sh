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
bash "/workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh"

# Wait for startup
sleep 3

# Check status
echo "🔍 Checking MCP server status..."
bash "$(dirname "$0")/mcp-status.sh"
