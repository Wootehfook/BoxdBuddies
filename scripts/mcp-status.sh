#!/bin/bash

# AI Generated: GitHub Copilot - 2025-08-08

# MCP Server Status Check Script
echo "🔍 Checking MCP server status..."

# If VS Code CLI is not available at all, treat as informational-only and exit 0
if ! command -v code &> /dev/null; then
    echo -e "  ⚠️  VS Code CLI (code) not found — skipping MCP extension checks (non-fatal)"
    echo -e "  💡 Tip: Install VS Code or ensure 'code' is on PATH to enable MCP checks"
    exit 0
fi

# Primary MCP servers (required for AI development)
PRIMARY_MCPS=("memory" "github" "sequentialthinking")

# Secondary MCP servers (optional)
SECONDARY_MCPS=("codacy" "playwright" "markitdown")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a VS Code extension is installed
check_vscode_extension() {
    local extension_pattern=$1
    local display_name=$2
    
    if code --list-extensions | grep -q "$extension_pattern" 2>/dev/null; then
        echo -e "  ✅ ${GREEN}${display_name}${NC} - VS Code extension installed"
        return 0
    else
        echo -e "  ❌ ${RED}${display_name}${NC} - VS Code extension not found"
        return 1
    fi
}

# Function to check if a process is running
check_process() {
    local process_name=$1
    local display_name=$2
    
    if pgrep -f "$process_name" > /dev/null; then
        echo -e "  ✅ ${GREEN}${display_name}${NC} - Process running"
        return 0
    else
        echo -e "  ❌ ${RED}${display_name}${NC} - Process not running"
        return 1
    fi
}

# Check VS Code MCP configuration
echo "🔧 VS Code MCP Configuration:"
if [ -f "/workspaces/BoxdBuddies/.vscode/settings.json" ]; then
    if grep -q "mcp" "/workspaces/BoxdBuddies/.vscode/settings.json" 2>/dev/null; then
        echo -e "  ✅ ${GREEN}MCP settings configured${NC}"
    else
        echo -e "  ❌ ${RED}MCP settings not found${NC}"
    fi
else
    echo -e "  ❌ ${RED}VS Code settings file not found${NC}"
fi

echo ""
echo "🔥 Primary MCP Servers:"
primary_running=0
for server in "${PRIMARY_MCPS[@]}"; do
    if check_vscode_extension "mcp.*$server" "@$server"; then
        ((primary_running++))
    fi
done

echo ""
echo "⚡ Secondary MCP Servers:"
secondary_running=0
for server in "${SECONDARY_MCPS[@]}"; do
    if check_vscode_extension "mcp.*$server" "@$server"; then
        ((secondary_running++))
    fi
done

echo ""
echo "🤖 Development Environment Processes:"
check_process "code" "VS Code"
check_process "node.*vite" "Vite Development Server"
check_process "tauri" "Tauri Development"

echo ""
echo "📊 MCP Status Summary:"
echo -e "  Primary MCP Servers: ${primary_running}/${#PRIMARY_MCPS[@]} active"
echo -e "  Secondary MCP Servers: ${secondary_running}/${#SECONDARY_MCPS[@]} active"

if [ $primary_running -eq ${#PRIMARY_MCPS[@]} ]; then
    echo -e "  🎉 ${GREEN}All primary MCP servers are ready!${NC}"
    exit 0
fi

# In CI contexts, treat missing MCP servers as a non-fatal warning so PR checks don't fail.
if [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${CI:-}" ]; then
    if [ $primary_running -gt 0 ]; then
        echo -e "  ⚠️  ${YELLOW}Some primary MCP servers are missing (CI mode: non-fatal)${NC}"
    else
        echo -e "  🚨 ${RED}No primary MCP servers detected (CI mode: non-fatal)${NC}"
        echo -e "  💡 Run locally: ${YELLOW}npm run mcp:start${NC}"
    fi
    exit 0
fi

# Local (non-CI) behavior remains strict to encourage developer setup.
if [ $primary_running -gt 0 ]; then
    echo -e "  ⚠️  ${YELLOW}Some primary MCP servers are missing${NC}"
    exit 1
else
    echo -e "  🚨 ${RED}No primary MCP servers detected${NC}"
    echo -e "  💡 Run: ${YELLOW}npm run mcp:start${NC}"
    exit 2
fi
