#!/bin/bash

# BoxdBuddies Development Environment Setup
# This script sets up all necessary dependencies for Tauri development

set -e

echo "🚀 Setting up BoxdBuddies development environment..."

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

echo "✅ Development environment setup complete!"
echo ""
echo "🔧 You can now run:"
echo "  • npm run tauri dev    - Start development server"
echo "  • npm run tauri build  - Build for production"
echo "  • cargo check          - Check Rust code (in src-tauri/)"
echo "  • cargo clippy         - Run linter (in src-tauri/)"
echo ""
echo "📝 Note: If you encounter system dependency issues, refer to:"
echo "   https://tauri.app/v1/guides/getting-started/prerequisites"
