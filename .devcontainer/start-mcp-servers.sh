#!/bin/bash

# MCP Server Startup Script for BoxdBuddies
echo "🤖 Starting MCP servers for AI-assisted development..."

# Primary MCP servers (required)
PRIMARY_MCPS=("@memory" "@github" "@sequentialthinking")

# Secondary MCP servers (optional)
SECONDARY_MCPS=("@codacy" "@playwright" "@markitdown")

# Function to start an MCP server with error handling
start_mcp_server() {
    local server_name=$1
    echo "  Starting ${server_name}..."
    
    # Add your MCP server startup command here
    # This is a placeholder - replace with actual MCP startup commands
    if command -v code &> /dev/null; then
        # VS Code MCP extension integration
        code --install-extension "mcp-${server_name}" 2>/dev/null || true
    fi
    
    # Add startup delay to prevent conflicts
    sleep 1
}

# Start primary MCP servers
echo "🔥 Starting primary MCP servers..."
for server in "${PRIMARY_MCPS[@]}"; do
    start_mcp_server "$server"
done

# Start secondary MCP servers
echo "⚡ Starting secondary MCP servers..."
for server in "${SECONDARY_MCPS[@]}"; do
    start_mcp_server "$server"
done

echo "✅ MCP server startup completed!"
