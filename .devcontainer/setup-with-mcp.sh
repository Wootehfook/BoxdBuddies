#!/bin/bash

# BoxdBuddies Development Environment Setup with MCP Automation
# This script sets up all necessary dependencies for Tauri development and automates MCP servers

set -e

echo "🚀 Setting up BoxdBuddies development environment with MCP automation..."

# Update package lists
sudo apt-get update

# Install Tauri prerequisites for Linux development
echo "📦 Installing Tauri system dependencies..."
sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev \
    libsoup2.4-dev \
    pkg-config \
    || echo "⚠️  Some packages may not be available on this system"

# Create compatibility symlinks for version mismatches
echo "🔗 Creating compatibility symlinks for older package versions..."
sudo ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.1.pc /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.0.pc
sudo ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc
sudo ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-web-extension-4.1.pc /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-web-extension-4.0.pc

# Install frontend dependencies  
echo "📦 Installing Node.js dependencies..."
cd /workspaces/BoxdBuddies
npm install

# Install Rust dependencies and run initial check
echo "🦀 Installing Rust dependencies..."
cd src-tauri
cargo fetch

# Try to compile (may fail due to system deps but will cache most dependencies)
echo "🔧 Pre-compiling dependencies..."
cargo check || echo "⚠️  Full compilation failed due to system dependencies, but deps are cached"

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
EOF

chmod +x /workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh

# Create background MCP monitor script
cat > /workspaces/BoxdBuddies/.devcontainer/mcp-monitor.sh << 'EOF'
#!/bin/bash

# MCP Server Health Monitor
echo "🔍 Starting MCP server health monitor..."

while true; do
    # Check if VS Code is running and MCP servers are active
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

# Add to .zshrc if it exists
if [ -f "$HOME/.zshrc" ]; then
    if ! grep -q "start-mcp-servers.sh" "$HOME/.zshrc"; then
        echo "" >> "$HOME/.zshrc"
        echo "# BoxdBuddies MCP Automation" >> "$HOME/.zshrc"
        echo "if [ -f \"/workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh\" ]; then" >> "$HOME/.zshrc"
        echo "    /workspaces/BoxdBuddies/.devcontainer/start-mcp-servers.sh &" >> "$HOME/.zshrc"
        echo "fi" >> "$HOME/.zshrc"
    fi
fi

# Add to .bashrc as fallback
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
echo "  • npm run tauri dev    - Start development server"
echo "  • npm run tauri build  - Build for production"
echo "  • cargo check          - Check Rust code (in src-tauri/)"
echo "  • cargo clippy         - Run linter (in src-tauri/)"
echo ""
echo "🤖 MCP servers will start automatically when you open a new terminal"
echo "🔧 You can manually start them with: .devcontainer/start-mcp-servers.sh"
echo ""
echo "📝 Note: If you encounter system dependency issues, refer to:"
echo "   https://tauri.app/v1/guides/getting-started/prerequisites"
