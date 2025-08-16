# 🎬 BoxdBuddy

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-orange)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Rust](https://img.shields.io/badge/Rust-Latest-red)](https://www.rust-lang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

> **Find movies all your friends want to watch - Available as Desktop App & Web App**

BoxdBuddy connects to Letterboxd, compares multiple watchlists, and shows you the perfect movies for your next group watch. Now available both as a native desktop application and a modern web application powered by Cloudflare.

![BoxdBuddies Demo](docs/images/demo-hero.png)
_Coming Soon: Demo screenshot showing the beautiful interface_

## 🚀 Try BoxdBuddy Now

### 🌐 Web App (New!)

**[Launch BoxdBuddy Web App →](https://boxdbuddy.pages.dev)**

- No download required
- Works on any device
- Automatic updates
- Persistent local cache

### 💻 Desktop App (v1.1.0)

Native desktop application with enhanced features and offline capabilities.

## 📥 Desktop Downloads (v1.1.0)

| Platform | Architecture | File                                        | Direct Download                                                                                                                   |
| -------- | ------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Windows  | x64          | MSI Installer (Per-user, no admin required) | [BoxdBuddy_1.1.0_x64_en-US.msi](https://github.com/Wootehfook/BoxdBuddies/releases/download/v1.1.0/BoxdBuddy_1.1.0_x64_en-US.msi) |
| Linux    | x86_64       | DEB / AppImage                              | [See release page for .deb and .AppImage downloads](https://github.com/Wootehfook/BoxdBuddies/releases/tag/v1.1.0)                |
| All      | N/A          | Checksums                                   | [CHECKSUMS.txt](https://github.com/Wootehfook/BoxdBuddies/releases/download/v1.1.0/CHECKSUMS.txt)                                 |

### 🔐 Integrity Verification

1. Download the installer and `CHECKSUMS.txt`.
2. Run:

   ```bash
   sha256sum -c CHECKSUMS.txt | grep -i boxdbuddy
   ```

3. Ensure reported hashes are `OK`.

If a file is missing from CHECKSUMS, re-download directly from the release page.

Note: The Windows installer is a per-user MSI that installs under your user profile (LocalAppData) and does not require administrative privileges.

### ✅ Recent Achievements (August 16, 2025)

- **🌐 Web App Launch**: Full Cloudflare deployment with serverless architecture
- **🔒 Enhanced Security**: No API keys required for users - secure server-side TMDB integration
- **⚡ Smart Caching**: Multi-layer caching (Edge + KV + D1 + LocalStorage) for optimal performance
- **🤖 AI Development**: Advanced MCP integration with 6 specialized servers for enhanced development workflow
- **📊 Database Migration**: Complete TMDB movie catalog stored in Cloudflare D1 database
- **🔄 Auto-Updates**: Daily scheduled TMDB delta sync for fresh movie data

## ✨ Features

### 🌐 Web App Features

- **No Downloads**: Access directly from your browser
- **No API Keys**: TMDB integration handled securely on the server
- **Smart Caching**: Persistent local storage with intelligent cache invalidation
- **Auto-Updates**: Always up-to-date with the latest features
- **Cross-Device**: Works seamlessly across desktop, tablet, and mobile

### 💻 Desktop App Features

- 🎬 **Letterboxd Integration**: Import watchlists from Letterboxd profiles with accurate URL handling
- 👥 **Friend Comparison**: Compare watchlists across multiple friends simultaneously
- 🚀 **TMDB Enhancement**: Enrich movies with high-quality posters, ratings, descriptions, and director information
- ⚡ **Smart Caching**: Lightning-fast cache system with intelligent count verification and auto-sync
- 📊 **Real-time Progress**: Live progress tracking with smooth UI updates and debug information
- 🎨 **Beautiful UI**: Letterboxd-inspired dark theme with responsive design and accessibility features
- 💾 **Data Persistence**: Save your profile and friends list locally with SQLite database
- 🔧 **Debug Panel**: Real-time application state monitoring and troubleshooting tools

## 🏆 Production Achievements

- **Performance**: Processes 300+ movies in seconds with intelligent caching
- **Accuracy**: 100% accurate Letterboxd movie links using scraped slugs
- **Reliability**: Robust error handling with timeout mechanisms and fallback strategies
- **Security**: No user API keys required, server-side TMDB integration, rate limiting
- **Scalability**: Cloudflare edge computing with global CDN distribution
- **Quality**: Professional-grade code with comprehensive testing and security measures
- **User Experience**: Smooth progress tracking, responsive design, and intuitive interface

## 🚀 Tech Stack

### Web App (Cloudflare)

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Cloudflare Workers + D1 Database + KV Storage
- **APIs**: Secure server-side TMDB integration
- **Caching**: Multi-layer edge caching + local storage
- **Deployment**: Cloudflare Pages with automated CI/CD

### Desktop App (Tauri)

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust + Tauri
- **APIs**: TMDB (The Movie Database) for movie data
- **Database**: SQLite for local data persistence
- **Build Tool**: Vite + Tauri CLI

## 📋 Prerequisites

### Web App

No prerequisites! Simply visit [boxdbuddy.pages.dev](https://boxdbuddy.pages.dev)

### Desktop Development

Before you begin, ensure you have the following installed:

#### Local Development

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

#### Docker Development

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Optional: TMDB API Integration

For enhanced movie data with posters, ratings, and descriptions:

1. Get a free API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Copy `.env.example` to `.env.local`
3. Add your API key: `VITE_TMDB_API_KEY=your_api_key_here`
4. Or enter it directly in the app interface

Optional backend lookup (experimental):

- To route initial title lookups through the Rust backend’s minimal TMDB command, set: - `VITE_TMDB_BACKEND=true` - Keep this off by default; the app will fall back to the frontend TMDB path automatically if disabled or on any backend error.

Note: AI Generated: GitHub Copilot - 2025-08-15

## 🛠️ Installation & Setup

### Option 1: Local Development

1. **Install Rust** (if not already installed):

   ```powershell
   # Download and install Rust
   Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
   .\rustup-init.exe
   ```

2. **Install Node.js dependencies**:

   ```powershell
   npm install
   ```

3. **Install Tauri CLI**:

   ```powershell
   npm install -g @tauri-apps/cli
   # OR
   cargo install tauri-cli
   ```

4. **Run the development server**:

   ```powershell
   npm run tauri dev
   ```

### Option 2: Docker Development

1. **Build and run with Docker Compose**:

   ```powershell
   docker-compose up boxdbuddies-dev
   ```

2. **Access the application**:
   - Frontend dev server: <http://localhost:1420>

## 📁 Project Structure

```text
BoxdBuddies/
├── src/                    # React frontend source
│   ├── App.tsx            # Main React component
│   ├── App.css            # Component styles
│   ├── main.tsx           # React entry point
│   └── styles.css         # Global styles
├── src-tauri/             # Tauri backend source
│   ├── src/
│   │   └── main.rs        # Rust main file
│   ├── icons/             # App icons
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── public/                # Static assets
├── .github/               # GitHub workflows and configurations
├── docker-compose.yml     # Docker services definition
├── Dockerfile             # Multi-stage Docker build
├── Dockerfile.dev         # Development Docker image
├── package.json           # Node.js dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 🎯 Available Scripts

### npm scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build the React frontend
- `npm run preview` - Preview the built frontend
- `npm run tauri dev` - Start Tauri in development mode
- `npm run tauri build` - Build the Tauri application for production

### Docker scripts

- `docker-compose up boxdbuddies-dev` - Start development environment
- `docker-compose up boxdbuddies-web` - Start web server with built frontend
- `docker-compose up boxdbuddies-build` - Build the application

## 🔧 Development

### Adding Tauri Commands

1. Add your command in `src-tauri/src/main.rs`:

   ```rust
   #[tauri::command]
   fn my_custom_command(input: String) -> String {
       format!("Hello, {}!", input)
   }
   ```

2. Register the command in the builder:

   ```rust
   fn main() {
       tauri::Builder::default()
           .invoke_handler(tauri::generate_handler![greet, my_custom_command])
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```

3. Call from React:

   ```typescript
   import { invoke } from "@tauri-apps/api/tauri";

   const result = await invoke("my_custom_command", { input: "World" });
   ```

### Configuration

- **Tauri Configuration**: Edit `src-tauri/tauri.conf.json`
- **Vite Configuration**: Edit `vite.config.ts`
- **TypeScript Configuration**: Edit `tsconfig.json`
- **Package Dependencies**: Edit `package.json` and `src-tauri/Cargo.toml`

## 🐳 Docker Usage

### Development

The development Docker setup provides a complete environment with Rust and Node.js:

```powershell
# Start development environment
docker-compose up boxdbuddies-dev

# Or build custom development image
docker build -f Dockerfile.dev -t boxdbuddies:dev .
docker run -p 1420:1420 -v ${PWD}:/app boxdbuddies:dev
```

### Production Build

```powershell
# Build production image
docker build --target production -t boxdbuddies:prod .

# Run production web server
docker run -p 3000:3000 boxdbuddies:prod
```

## 🚀 Building for Production

### Local Build

```powershell
npm run tauri build
```

The built application will be available in `src-tauri/target/release/bundle/`.

### Docker Build

```powershell
docker-compose up boxdbuddies-build
```

## 🛡️ Security

Tauri provides several security features:

- Content Security Policy (CSP)
- API allowlisting
- Isolated context between frontend and backend

Configure security settings in `src-tauri/tauri.conf.json`.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

BoxdBuddies is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**This means:**

- ✅ You can use it for personal projects
- ✅ You can modify and share it
- ✅ You must share source code of any modifications
- ❌ You **CANNOT** use it for commercial purposes
- ❌ You **CANNOT** sell it or charge for access
- ❌ You **CANNOT** include it in proprietary software

### Important Legal Notice

**Commercial Use Prohibition:** This software is provided for personal, non-commercial use only. Any commercial use, including selling the software, using it as part of a paid service, or including it in commercial products, is strictly prohibited.

**Data Source Compliance:** This software respects the terms of service of Letterboxd (data scraped from public profiles) and TMDB API (users must provide their own API key). Users are responsible for ensuring their use complies with all applicable terms of service.

See the [LICENSE](LICENSE) file for full details.

## 🆘 Troubleshooting

### Common Issues

1. **Rust not found**: Ensure Rust is installed and in your PATH
2. **Node modules issues**: Delete `node_modules` and run `npm install`
3. **Tauri build fails**: Check that all system dependencies are installed
4. **Docker build fails**: Ensure Docker Desktop is running and updated

### Getting Help

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 🎉 What's Next?

**Publishing & Distribution Phase** - BoxdBuddy is now ready for public release:

- ✅ **Core Application Complete** - All features working flawlessly
- 🔧 **Desktop App Packaging** - Create distributable executables for Windows and Linux
- 🔧 **GitHub Release Management** - Tag releases, create changelogs, distribute binaries
- 🔧 **Documentation Enhancement** - User guides, installation instructions, feature documentation
- 🔧 **Community Preparation** - Contributing guidelines, issue templates, roadmap planning
- 🔧 **Demo Content** - Screenshots, videos, and usage examples for users

**Future Enhancements** (post-release):

- Advanced filtering and sorting options
- Export functionality for comparison results
- Watchlist synchronization scheduling
- Social features and sharing capabilities
