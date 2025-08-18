# Changelog

All notable changes to BoxdBuddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features

- User accounts with saved friend lists
- Advanced filtering by genre, year, and rating
- Export functionality for comparison results
- Enhanced mobile responsive design
- Public API for third-party integrations

## [2.0.0] - 2025-08-17

### 🎉 Web Platform Launch

BoxdBuddy v2.0.0 represents a complete platform migration from desktop to web, bringing Letterboxd watchlist comparison to any device with internet access.

### ✨ Major Changes

#### Platform Migration

- **Web Application**: Complete migration from Tauri desktop to Cloudflare Pages web platform
- **Universal Access**: Available at [https://boxdbud.pages.dev](https://boxdbud.pages.dev) on any device
- **Zero Installation**: Instant access via web browser, no downloads required
- **Mobile Optimization**: Responsive design that works seamlessly on smartphones and tablets

#### Enhanced Performance

- **Global CDN**: Cloudflare edge computing for worldwide performance
- **Smart Caching**: Multi-layer caching (Edge + KV + D1) for lightning-fast responses
- **Pre-cached Data**: 2,000+ popular movies cached for instant enhancement
- **99.3% Coverage**: TMDB metadata available for vast majority of movies

#### New Features

- **Enhanced API**: Robust Cloudflare Functions backend with CORS and rate limiting
- **Improved Progress**: Real-time progress tracking during comparisons
- **Better Error Handling**: Comprehensive error messages and retry mechanisms
- **Security**: Server-side API integration, no user credentials required

### 🏗️ Architecture

#### Frontend

- React 18 with TypeScript for type safety
- Vite for fast development and optimized builds
- Responsive design with mobile-first approach
- Real-time progress updates with visual feedback

#### Backend

- Cloudflare Pages Functions for serverless computing
- Cloudflare D1 database for structured data storage
- Cloudflare KV for high-performance caching
- TMDB API integration for movie metadata

### 🐛 Bug Fixes

- Fixed movie link accuracy using actual Letterboxd slugs
- Resolved caching issues with proper data type handling
- Improved error handling for network timeouts
- Enhanced progress tracking reliability

### 💔 Breaking Changes

- Desktop application discontinued in favor of web platform
- Local SQLite database replaced with cloud D1 database
- Tauri APIs replaced with web-standard fetch APIs

## [1.0.0] - 2025-08-03

### 🎉 Initial Desktop Release (Deprecated)

> **Note**: This version is no longer supported. Please use the web application at https://boxdbud.pages.dev

BoxdBuddies v1.0.0 was the initial desktop application release.

### ✨ Features (Historical)

- Desktop application built with Tauri (Rust + React)
- Local SQLite database for caching
- Cross-platform support (Windows, macOS, Linux)
- Local data storage and processing

- React 18 + TypeScript + Vite
- Responsive design with CSS Grid/Flexbox
- Real-time state management and progress tracking
- Accessibility features and keyboard navigation

#### Backend

- Rust + Tauri for secure desktop application
- SQLite database with optimized queries and batch processing
- Letterboxd scraping with HTML parsing and rate limiting
- TMDB API integration with persistent caching

#### Development & Quality

- Docker containerization for consistent development environments
- GitHub Actions CI/CD with cross-platform builds
- ESLint, Prettier, rustfmt, and clippy for code quality
- Comprehensive error handling and logging
- Security-first approach with input validation

### 🚀 Performance Metrics

- **Cache Loading**: 313 movies processed in <1 second
- **Fresh Scraping**: 30+ seconds for initial data with progress tracking
- **TMDB Enhancement**: Batch processing with rate limiting
- **Memory Usage**: Optimized for large watchlists (300+ movies)
- **Cross-Platform**: Verified compatibility across Windows and Linux

### 🛡️ Security & Privacy

- **No Data Collection**: All data stored locally in SQLite database
- **API Key Security**: Users provide their own TMDB API keys
- **Input Validation**: Comprehensive sanitization of external data
- **Rate Limiting**: Respectful API usage with proper delays
- **Secure Defaults**: Conservative timeout and retry mechanisms

### 📚 Documentation

- **README.md**: Comprehensive setup and usage instructions
- **SETUP.md**: Detailed development environment guide
- **CONTRIBUTING.md**: Professional contributor guidelines with code standards
- **SECURITY.md**: Security policy and vulnerability reporting
- **PUBLIC_RELEASE_CHECKLIST.md**: Complete public release workflow

### 🔧 Development Experience

- **MCP Integration**: 6 Model Context Protocol servers for AI-enhanced development
- **Hybrid Workflow**: Windows CMD for builds, WSL for development tasks
- **VS Code Integration**: Complete workspace configuration with tasks and debugging
- **Docker Support**: Multi-stage builds for development and production
- **Quality Gates**: Pre-commit hooks with automated formatting and linting

### 🎯 Known Limitations

- **Letterboxd Dependencies**: Subject to Letterboxd's public profile structure
- **TMDB Rate Limits**: Enhanced movie data limited by TMDB API quotas
- **Platform Support**: Currently tested on Windows and Linux (macOS coming soon)

### 📄 License

BoxdBuddies is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) with commercial use prohibition. This ensures the software remains free and open source while preventing commercial exploitation.

---

## Development History

### Pre-Release Development Milestones

#### August 3, 2025 - Production Readiness Achieved

- ✅ All core features implemented and tested
- ✅ Cross-platform compatibility verified
- ✅ Real friend integration working (Test_User issue resolved)
- ✅ Cache optimization completed (280+ movies in <1 second)
- ✅ MCP development workflow established
- ✅ Security audit passed
- ✅ Documentation completed

#### July 2025 - Core Development Phase

- ✅ Tauri + React + TypeScript foundation
- ✅ Letterboxd scraping implementation
- ✅ TMDB API integration
- ✅ SQLite database with caching
- ✅ UI/UX design and implementation
- ✅ Error handling and progress tracking

#### Project Inception - June 2025

- ✅ Initial concept and architecture planning
- ✅ Technology stack selection
- ✅ Development environment setup
- ✅ Core feature specification

---

**Note**: This changelog will be updated with each release. For the latest development updates, see the [README.md](README.md) and [GitHub releases](https://github.com/Wootehfook/BoxdBuddies/releases).
