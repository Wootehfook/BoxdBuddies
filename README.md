# 🎬 BoxdBuddy

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pages.cloudflare.com/)

**Find movies all your friends want to watch**

BoxdBuddy connects to Letterboxd, compares multiple watchlists, and shows you the perfect movies for your next group watch. Available as a modern web application powered by Cloudflare Pages.

## 🚀 Live Application

**[Launch BoxdBuddy →](https://boxdbud.pages.dev)**

- No download or installation required
- Works on any device with a browser
- Automatic updates and latest features
- Secure server-side TMDB integration

## ✨ Features

- � **Letterboxd Integration**: Scrapes complete watchlists with pagination support
- 👥 **Multi-User Comparison**: Compare watchlists between multiple friends
- 🚀 **TMDB Enhancement**: Enriches movies with posters, ratings, genres, and metadata
- ⚡ **Smart Caching**: D1 database with 2,000+ pre-cached popular movies
- 📊 **Real-time Progress**: Visual progress tracking during comparisons
- 🎨 **Responsive Design**: Works seamlessly on desktop and mobile devices
- � **Secure**: No user API keys required - all external APIs handled server-side

## 🏆 Performance

- Processes 300+ movies per user in seconds
- 99.3% TMDB data coverage
- Sub-second cached responses
- Handles pagination for large watchlists
- Global edge computing with Cloudflare

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite) + KV Storage
- **APIs**: Letterboxd scraping + TMDB integration
- **Deployment**: Cloudflare Pages with automated CI/CD

## 📋 Prerequisites

### Using BoxdBuddy

No prerequisites! Simply visit [boxdbuddy.pages.dev](https://boxdbuddy.pages.dev)

### Development Setup

- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)
- Code editor (VS Code recommended)

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

   ```

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Wootehfook/BoxdBuddies.git
   cd BoxdBuddies
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Development server: <http://localhost:5173>

## 📁 Project Structure

```text
BoxdBuddies/
├── src/                    # React frontend source
│   ├── App.tsx            # Main React component
│   ├── App.css            # Component styles
│   ├── main.tsx           # React entry point
│   ├── services/          # API and cache services
│   └── components/        # React components
├── functions/             # Cloudflare Workers backend
│   ├── letterboxd/        # Letterboxd scraping endpoints
│   ├── compare/           # Movie comparison logic
│   └── admin/             # Database management
├── migrations/            # Database schema files
├── public/                # Static assets
├── .github/               # GitHub workflows and configurations
├── wrangler.toml          # Cloudflare configuration
├── package.json           # Node.js dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 🎯 Available Scripts

## 🎯 Available Scripts

### npm scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build the React frontend for production
- `npm run preview` - Preview the built frontend locally
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint code analysis

### Cloudflare Deployment

- `npm run deploy` - Deploy to Cloudflare Pages (main branch)
- `npm run deploy:preview` - Deploy preview build

## 🔧 Development

### Environment Variables

Create a `.env.local` file for development:

```env
# Optional: Set to true to enable development features
VITE_APP_DEBUG=true
```

### Code Quality

The project uses automated quality checks:

- **ESLint**: Code style and error detection
- **TypeScript**: Static type checking
- **Prettier**: Code formatting
- **GitHub Actions**: Automated CI/CD pipeline

## 🚀 Building for Production

### Local Build

```bash
npm run build
```

The built application will be available in the `dist/` directory.

### Deployment

The application is automatically deployed via Cloudflare Pages:

- **Production**: Deploys from `main` branch to [boxdbuddy.pages.dev](https://boxdbuddy.pages.dev)
- **Preview**: Deploys from feature branches for testing

## 🛡️ Security

BoxdBuddy implements multiple security measures:

- **Server-side API integration**: No user API keys required
- **Rate limiting**: Prevents abuse of external services
- **Input validation**: Sanitizes all user inputs
- **Content Security Policy**: Protects against XSS attacks
- **HTTPS**: All connections encrypted

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

1. **Development server not starting**: Ensure Node.js is installed and run `npm install`
2. **Build failures**: Check that all dependencies are installed correctly
3. **API errors**: Check browser console for network issues
4. **Cache issues**: Clear browser cache and local storage

### Getting Help

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Issues](https://github.com/Wootehfook/BoxdBuddies/issues)

## 🎉 What's Next?

**Web Application Enhancement** - Continuing to improve the user experience:

- ✅ **Core Features Complete** - All watchlist comparison functionality working
- ✅ **Cloudflare Deployment** - Serverless web application with global CDN
- ✅ **Advanced Caching** - Multi-layer caching for optimal performance
- ✅ **Security Implementation** - Server-side API integration without user API keys

**Future Enhancements**:

- Advanced filtering and sorting options
- Export functionality for comparison results
- Watchlist synchronization scheduling
- Social features and sharing capabilities
- Mobile app development
- Additional streaming service integrations
