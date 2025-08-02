<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# BoxdBuddies - AI Agent Instructions & Project Context

> This document provides universal context and requirements for AI coding assistants contributing to this project.
> **Format:** Standard AI context file for professional software development with BoxdBuddies-specific implementation details.

---

## 🎯 Project Overview
**BoxdBuddies** is a professionally developed Tauri-based desktop application (Rust backend + React TypeScript frontend) that compares Letterboxd watchlists between friends to find movies everyone wants to watch. The app scrapes Letterboxd profiles, enhances movie data via TMDB API, and provides an elegant comparison interface.

**Design Philosophy:** Emphasizes security, code quality, accessibility, and responsible AI attribution.
**Contributors:** Human and AI collaboration.
**Licensing:** MIT License (ensure compliance).

---

## � General Development Standards

- **Max Line Length:** 100 characters (TypeScript/React) | 80 characters (Rust)
- **Code Style:** 
  - **Rust:** Follow `rustfmt` and `clippy` recommendations
  - **TypeScript/React:** ESLint + Prettier configuration
  - **Database:** Use snake_case for SQL identifiers
- **Documentation:** 
  - **Rust:** Standard `///` doc comments with examples
  - **TypeScript:** JSDoc comments for complex functions
  - **README:** Keep project documentation current
- **Type Safety:** 
  - **Rust:** Leverage strong type system, avoid `unwrap()` in production
  - **TypeScript:** Strict mode enabled, no `any` types
- **AI Code Attribution:** All AI-generated code must include comments with timestamp and model identity
  ```rust
  // AI Generated: GitHub Copilot - 2025-08-01
  ```
- **Security:**  
  - Never commit API keys, database files, or credentials
  - Validate all external inputs (Letterboxd scraping, TMDB API)
  - Use environment variables for sensitive configuration
  - Sanitize all HTML parsing operations
- **Accessibility & Compliance:**  
  - React components follow WCAG 2.1 guidelines
  - Keyboard navigation support
  - Screen reader compatibility
  - Responsive design for different screen sizes

---

---

## 🔧 Automation & Tooling

- **Automated Quality Checks:**  
  - **Rust:** `cargo clippy`, `cargo fmt`, `cargo test` in CI/CD
  - **Frontend:** ESLint, Prettier, TypeScript compiler checks
  - **Security:** Regular dependency audits with `cargo audit` and `npm audit`
  - **Database:** SQL migration validation and rollback testing
- **Recommended Tools:**  
  - **Development:** Tauri CLI, VS Code with Rust Analyzer and TypeScript extensions
  - **Testing:** Automated browser testing for Letterboxd scraping reliability
  - **Debugging:** Comprehensive logging with categorized prefixes (🔥 for cache, ⚡ for API calls)

---

## 🧪 Testing & Quality Assurance

- **Testing Strategy:**  
  - **Unit Tests:** Rust backend functions with `#[cfg(test)]` modules
  - **Integration Tests:** End-to-end Letterboxd scraping and TMDB API calls
  - **Frontend Tests:** React component testing with testing-library
  - **Database Tests:** Transaction rollback and constraint validation
- **Test Isolation:** Each test uses separate database transactions
- **Performance Testing:** Batch processing validation with large watchlists (300+ movies)

---

## 📂 File & Directory Structure

```
BoxdBuddies/
├── src/                    # React TypeScript frontend
│   ├── App.tsx            # Main application with debug panel
│   ├── services/          # API and caching services
│   └── components/        # React components
├── src-tauri/             # Rust backend
│   ├── src/main.rs        # Core backend logic (1800+ lines)
│   ├── Cargo.toml         # Rust dependencies
│   └── target/            # Compiled artifacts
├── public/                # Static assets
├── .github/               # GitHub configuration and CI/CD
└── database/              # SQLite schema and migrations
```

---

### ✅ COMPLETED PHASES
- [x] **Project Scaffolding**: Complete Tauri + React + TypeScript setup
- [x] **Core Infrastructure**: Docker containerization, Vite build system, task configurations
- [x] **Database Architecture**: SQLite with 5-table schema (friends, friend_watchlists, friend_sync_status, users, watched_movies)
- [x] **Letterboxd Integration**: Full watchlist scraping with robust HTML parsing
- [x] **TMDB Enhancement**: Movie data enrichment with posters, ratings, descriptions
- [x] **Caching System**: Efficient database caching with batch processing (25-movie batches)
- [x] **Progress Tracking**: Real-time UI progress updates with debug panel
- [x] **Error Handling**: Comprehensive timeout mechanisms (2-minute frontend timeouts)

### ✅ CRITICAL ISSUE RESOLVED - COMPLETE SUCCESS
**Problem**: Application hanging on progress page when loading from cache after successful initial scraping
**Root Cause**: Database data type mismatch - `movie_year` stored as TEXT but code expected INTEGER  
**Solution Implemented**: Modified cache reading to handle TEXT-stored years with parsing fallback
**Status**: ✅ **FULLY RESOLVED** - Cache loading working perfectly with all 313 movies processed successfully

### 🎯 CURRENT PROJECT STATUS - ENHANCED CACHE SYSTEM
**Achievement**: Core functionality complete with intelligent cache synchronization
**Cache Features**: 
- Time-based cache freshness (24-hour default)
- Count-based verification (compares cached vs current Letterboxd counts)
- Automatic re-sync when watchlist sizes differ
**Performance**: Cache loading processes 313 movies in under 1 second vs 30+ seconds for scraping
**Reliability**: Multiple successful test runs with different friend combinations
**Next Phase**: Advanced features and UI improvements

## 🏗️ Architecture Deep Dive

### Database Schema
```sql
friends: (username PK)
friend_watchlists: (id, friend_username FK, movie_title, movie_year, letterboxd_slug, tmdb_id, date_added, last_updated)
friend_sync_status: (friend_username, last_watchlist_sync, watchlist_count, sync_status, last_error)
users: (username PK, letterboxd_profile, tmdb_api_key, last_login)
watched_movies: (id, username, movie_title, rating, date_watched)
```

### Key Backend Functions
- `scrape_user_watchlist()`: Robust Letterboxd scraping with retry logic
- `save_watchlist_to_cache()`: Batch processing with friend table insertion
- `get_watchlist_cached_or_scrape()`: Smart cache/scrape decision logic
- `is_watchlist_cache_fresh()`: Cache age validation (default 24 hours)
- `compare_watchlists()`: Core comparison algorithm with TMDB enhancement

### Frontend Architecture
- React 18 + TypeScript with Vite
- Tauri API integration via `@tauri-apps/api`
- Real-time progress tracking with `backendCallWithTimeout()` wrapper
- Debug panel showing: Page state, movie counts, filtered results

## 🐛 ACTIVE DEBUGGING SESSION

### Last Known Issue
**Symptom**: Second comparison hangs on progress page showing "Page: progress | Movies: 0 | Filtered: 0"
**Investigation**: Added comprehensive debugging to cache loading pipeline

### Debug Message Flow Expected
```
🔥 WATCHLIST FETCH: get_watchlist_cached_or_scrape called
🔥 CACHE CHECK: Checking cache freshness
🔥 SYNC STATUS: Getting sync status
🔥 CACHE LOAD: get_cached_watchlist called
🔥 CACHE LOAD: Found X cached movies
```

### Current Debugging State
- App compiled with extensive debug logging
- Terminal ready to show cache loading flow
- Browser Simple Browser opened at http://localhost:1420
- **NEXT STEP**: User needs to test second comparison to see debug output

## 🎯 IMMEDIATE NEXT STEPS

1. **Monitor Terminal Output**: When user runs second comparison with "Wootehfook", debug messages will reveal exact hang location
2. **Identify Cache Issue**: Determine if hang occurs in:
   - Cache freshness check (`is_watchlist_cache_fresh`)
   - Database query (`get_cached_watchlist`) 
   - Sync status retrieval (`get_friend_sync_status`)
3. **Fix Cache Loading**: Based on debug output, implement specific fix for hanging function
4. **Verify Full Flow**: Ensure both fresh scraping and cache loading work reliably

## 🔬 DEBUGGING METHODOLOGY

### Current Debug Infrastructure
- **Backend**: 🔥 prefixed console logs with function entry/exit, parameter logging, step-by-step progress
- **Frontend**: 2-minute timeout wrappers, debug panel with real-time state display
- **Database**: Transaction-based operations with rollback on failure

### Tools Available
- Tauri dev server with hot reload
- Terminal output monitoring via `get_terminal_output`
- Simple Browser integration for testing
- SQLite database inspection capabilities

## 💡 AI AGENT GUIDELINES

### Communication Style
- **Concise & Focused**: Avoid verbose explanations unless debugging requires detail
- **Debug-First Approach**: Always check terminal output before proposing solutions
- **Context Preservation**: Use conversation summary to maintain debugging state

## 💡 AI Development Guidelines

### Communication Style
- **Concise & Focused**: Avoid verbose explanations unless debugging requires detail
- **Debug-First Approach**: Always check terminal output before proposing solutions
- **Context Preservation**: Use conversation summary to maintain debugging state

### Code Quality Standards
1. **Security First**: Check for and avoid exposure of sensitive data when suggesting code
2. **Type Safety**: Leverage Rust's type system and TypeScript strict mode
3. **Error Handling**: Comprehensive error messages with context for debugging
4. **Performance**: Batch processing for large datasets, efficient database operations
5. **Attribution**: All AI-generated code must include timestamp and model identity comments

### Development Patterns
- **Database Safety**: Always use transactions with proper rollback
- **Frontend Resilience**: Implement timeout wrappers for long-running backend calls
- **Batch Processing**: Handle large datasets (300+ movies) in smaller chunks
- **Comprehensive Logging**: Use categorized debug prefixes (🔥 for cache operations)

### Project-Specific Context
- **Test Username**: "Wootehfook" (313 movies in watchlist)
- **Cache Duration**: 24 hours default for watchlist data
- **Batch Size**: 25 movies per database transaction
- **Timeout Settings**: 2-minute frontend timeout for backend calls

### Debugging Protocol
1. **Monitor Terminal Output**: Always examine latest output using `get_terminal_output`
2. **Follow Debug Messages**: Look for 🔥 prefixed logs in cache operations
3. **Verify Application State**: Use debug panel information for real-time status
4. **Test Systematically**: Compare first run (scraping) vs second run (caching) behavior

---

## 🚀 Success Metrics & Quality Gates
- First comparison completes successfully (✅ WORKING)
- Second comparison loads from cache without hanging (🚧 IN PROGRESS)
- Progress page transitions to results page showing movie matches
- Debug panel shows accurate movie counts throughout process
- No database constraint errors or hanging operations
- All code follows established security and accessibility standards
- Comprehensive test coverage for new features and bug fixes

---

## 📚 Reference Files
- `README.md` – Project overview and setup instructions
- `SETUP.md` – Development environment configuration
- `database-schema-enhancements.sql` – Database schema and migrations
- Terminal output – Real-time debugging information via multiple PowerShell sessions
- Browser at http://localhost:1420 – User interface testing endpoint

---

*Last Updated: August 1, 2025 - Cache loading investigation in progress*  
*This file follows universal AI coding assistant standards with BoxdBuddies-specific context*
