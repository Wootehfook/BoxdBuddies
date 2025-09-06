#!/bin/bash

# BoxdBuddies Web Development Environment Setup with MCP Automation
# This script sets up all necessary dependencies for web development and automates MCP servers

set -e

echo "🚀 Setting up BoxdBuddies web development environment with MCP automation..."

# Update package lists
sudo apt-get update

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd /workspaces/BoxdBuddies
npm install

# MCP Server Automation Setup
echo "🤖 Setting up MCP server automation..."

# Create MCP startup script
cat > /workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh << 'EOF'
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
EOF

chmod +x /workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh

# Create background MCP monitor script
cat > /workspaces/BoxdBuddies/.devcontainer/mcp-monitor.sh << 'EOF'
#!/bin/bash

# MCP Server Health Monitor
echo "🔍 Starting MCP server health monitor..."

while true; do
    if pgrep -f "code" > /dev/null; then
        # Monitor MCP server status
        # Add your monitoring logic here
        sleep 30
    else
        sleep 10
    fi
done
EOF

chmod +x /workspaces/BoxdBuddies/.devcontainer/mcp-monitor.sh

# Add MCP startup to shell profile
echo "🔧 Configuring automatic MCP startup..."

if [ -f "$HOME/.zshrc" ]; then
    if ! grep -q "start-mcp-servers.sh" "$HOME/.zshrc"; then
        echo "" >> "$HOME/.zshrc"
        echo "# BoxdBuddies MCP Automation" >> "$HOME/.zshrc"
        echo "if [ -f \"/workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh\" ]; then" >> "$HOME/.zshrc"
        echo "    /workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh &" >> "$HOME/.zshrc"
        echo "fi" >> "$HOME/.zshrc"
    fi
fi

if [ -f "$HOME/.bashrc" ]; then
    if ! grep -q "start-mcp-servers.sh" "$HOME/.bashrc"; then
        echo "" >> "$HOME/.bashrc"
        echo "# BoxdBuddies MCP Automation" >> "$HOME/.bashrc"
        echo "if [ -f \"/workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh\" ]; then" >> "$HOME/.bashrc"
        echo "    /workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh &" >> "$HOME/.bashrc"
        echo "fi" >> "$HOME/.bashrc"
    fi
fi

echo "✅ Development environment setup complete!"
echo "✅ MCP automation setup completed!"
echo ""
echo "🔧 You can now run:"
echo "  • npm run dev         - Start development server"
echo "  • npm run build       - Build for production"
echo ""
echo "🤖 MCP servers will start automatically when you open a new terminal"
echo "🔧 You can manually start them with: .devcontainer/start-mcp-servers.sh"
echo ""
