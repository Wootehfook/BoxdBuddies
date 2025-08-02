# BoxdBuddies Development Setup

## 🎯 Quick Start Instructions

### Prerequisites Installation

Since Rust and Node.js are not currently installed, you'll need to install them first:

1. **Install Node.js**:
   ```powershell
   # Download and install Node.js from https://nodejs.org/
   # Or use Chocolatey:
   choco install nodejs
   
   # Or use winget:
   winget install OpenJS.NodeJS
   ```

2. **Install Rust**:
   ```powershell
   # Download and install Rust
   Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
   .\rustup-init.exe
   
   # Restart your terminal or reload PATH
   ```

3. **Verify installations**:
   ```powershell
   node --version
   npm --version
   rustc --version
   cargo --version
   ```

### Project Setup

1. **Install dependencies**:
   ```powershell
   npm install
   ```

2. **Install Tauri CLI**:
   ```powershell
   npm install -g @tauri-apps/cli
   ```

3. **Run the development server**:
   ```powershell
   npm run tauri dev
   ```

### VS Code Tasks Available

- **Ctrl+Shift+P** → "Tasks: Run Task" → Select:
  - `tauri dev` - Start Tauri development (default build task)
  - `tauri build` - Build for production
  - `frontend dev` - Start only frontend dev server
  - `frontend build` - Build only frontend
  - `docker dev` - Start with Docker
  - `install dependencies` - Install npm packages

### Debugging

- **F5** to start debugging with "Launch Tauri Development"
- Use VS Code's integrated terminal for command-line operations
- Rust analyzer provides IntelliSense for Rust code
- TypeScript provides IntelliSense for React code

### Docker Alternative

If you prefer Docker development:

```powershell
# Build and run development environment
docker-compose up boxdbuddies-dev

# Access at http://localhost:1420
```

## 🔧 What's Been Set Up

✅ Complete Tauri project structure
✅ React 18 + TypeScript frontend
✅ Rust backend with Tauri
✅ Docker multi-stage builds
✅ VS Code workspace configuration
✅ Essential extensions installed
✅ Build and debug tasks configured
✅ Prettier code formatting
✅ Git configuration

## 🚀 Next Steps

1. Install Node.js and Rust (see above)
2. Run `npm install`
3. Start development with `npm run tauri dev` or **Ctrl+Shift+P** → "Tasks: Run Build Task"
4. Begin customizing your application!

## 📁 Key Files to Customize

- `src/App.tsx` - Main React component
- `src-tauri/src/main.rs` - Rust backend logic
- `src-tauri/tauri.conf.json` - App configuration
- `package.json` - Dependencies and scripts
- `README.md` - Project documentation

Your BoxdBuddies project is ready for development! 🎉
