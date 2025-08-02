# BoxdBuddies

A modern desktop application for comparing Letterboxd watchlists between friends, built with Tauri (Rust) backend and React frontend. Find movies that you and your friends all want to watch!

## ✨ Features

- 🎬 **Letterboxd Integration**: Import watchlists from Letterboxd profiles
- 👥 **Friend Comparison**: Compare watchlists across multiple friends
- 🚀 **TMDB Enhancement**: Enrich movies with high-quality posters, ratings, and descriptions
- ⚡ **Smart Processing**: Handles large watchlists with progress tracking and optimization
- 🎨 **Beautiful UI**: Letterboxd-inspired dark theme with responsive design
- 💾 **Data Persistence**: Save your profile and friends list locally

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust + Tauri
- **APIs**: TMDB (The Movie Database) for movie data
- **Containerization**: Docker + Docker Compose
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Local Development

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Docker Development

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Optional: TMDB API Integration

For enhanced movie data with posters, ratings, and descriptions:

1. Get a free API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Copy `.env.example` to `.env.local`
3. Add your API key: `VITE_TMDB_API_KEY=your_api_key_here`
4. Or enter it directly in the app interface

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
   - Frontend dev server: http://localhost:1420

## 📁 Project Structure

```
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
   import { invoke } from '@tauri-apps/api/tauri';
   
   const result = await invoke('my_custom_command', { input: 'World' });
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

This project is licensed under the MIT License - see the LICENSE file for details.

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

- Add more Tauri commands for file system access
- Implement state management (Redux/Zustand)
- Add testing setup (Jest/Vitest + Rust tests)
- Set up CI/CD pipeline with GitHub Actions
- Add database integration
- Implement auto-updater
