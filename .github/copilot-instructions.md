<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# BoxdBuddies - AI Agent Instructions & Project Context

> This document provides universal context and requirements for AI coding assistants contributing to this project.
> **Format:** Standard AI context file for professional software development with BoxdBuddies-specific implementation details.

---

## 🎯 Project Overview

**BoxdBuddies** is a professionally developed web application built with React TypeScript and Cloudflare Pages that compares Letterboxd watchlists between friends to find movies everyone wants to watch. The app uses Cloudflare Functions for backend processing, D1 database for caching, and integrates with TMDB API for enhanced movie data.

**Design Philosophy:** Emphasizes security, performance, accessibility, and responsible AI attribution.
**Contributors:** Human and AI collaboration.
**Licensing:** AGPL-3.0 (ensure compliance).

---

## 📋 General Development Standards

- **Max Line Length:** 100 characters (TypeScript/React)
- **Code Style:**
  - **TypeScript/React:** ESLint + Prettier configuration
  - **Database:** Use snake_case for SQL identifiers
  - **Cloudflare Functions:** Follow Cloudflare Workers patterns
- **Documentation:**
  - **TypeScript:** JSDoc comments for complex functions
  - **API:** Document Cloudflare Function endpoints
  - **README:** Keep project documentation current
- **Type Safety:**
  - **TypeScript:** Strict mode enabled, no `any` types
- **AI Code Attribution:** All AI-generated code must include comments with timestamp and model identity
  ```typescript
  // AI Generated: GitHub Copilot - 2025-08-02
  ```
- **Security:**
  - Never commit API keys, database files, or credentials
  - Use Cloudflare environment variables for sensitive configuration
  - Validate all external inputs (Letterboxd scraping, TMDB API)
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
  - **Frontend:** ESLint, Prettier, TypeScript compiler checks
  - **Backend:** Cloudflare Functions validation and testing
  - **Security:** Regular dependency audits with `npm audit`
  - **Database:** SQL migration validation and rollback testing
- **Recommended Tools:**
  - **Development:** Cloudflare CLI, VS Code with TypeScript extensions
  - **Testing:** Automated browser testing for Letterboxd scraping reliability
  - **Debugging:** Comprehensive logging with categorized prefixes (🔥 for cache, ⚡ for API calls)

---

## 🧪 Testing & Quality Assurance

- **Testing Strategy:**
  - **Integration Tests:** End-to-end Letterboxd scraping and TMDB API calls
  - **Frontend Tests:** React component testing with testing-library
  - **Database Tests:** Transaction rollback and constraint validation
  - **Function Tests:** Cloudflare Functions unit and integration testing
- **Test Isolation:** Each test uses separate database transactions
- **Performance Testing:** Batch processing validation with large watchlists (300+ movies)

---

## 📂 File & Directory Structure

```
BoxdBuddies/
├── src/                    # React TypeScript frontend
│   ├── App.tsx            # Main application component
│   ├── components/        # React components
│   └── styles/            # CSS and styling
├── functions/             # Cloudflare Functions backend
│   ├── api/               # API endpoints
│   ├── letterboxd/        # Letterboxd scraping functions
│   └── _lib/              # Shared utilities
├── migrations/            # D1 database migrations
├── public/                # Static assets
├── .github/               # GitHub configuration and CI/CD
└── wrangler.toml          # Cloudflare configuration
```

---

### ✅ COMPLETED PHASES - PRODUCTION READY

- [x] **Project Infrastructure**: Complete React TypeScript + Cloudflare Pages setup
- [x] **Backend Architecture**: Cloudflare Functions with D1 database integration
- [x] **Database Schema**: D1 SQLite with comprehensive migration system
- [x] **Letterboxd Integration**: Full watchlist scraping with robust HTML parsing and real Letterboxd slug capture
- [x] **TMDB Enhancement**: Movie data enrichment with posters, ratings, descriptions, and director information
- [x] **Caching System**: Intelligent D1 database caching with batch processing and count verification
- [x] **Progress Tracking**: Real-time UI progress updates with comprehensive error handling
- [x] **URL Accuracy**: Fixed Letterboxd movie URLs to use actual scraped slugs
- [x] **Performance Optimization**: Fast cache loading and efficient batch processing
- [x] **Production Testing**: Successfully processing large watchlists with accurate movie matching

### ✅ ALL CRITICAL ISSUES RESOLVED - PRODUCTION READY

**Previous Issue**: Cache loading performance optimization
**Root Cause**: Database query efficiency and batch processing optimization needed
**Solution**: Implemented intelligent D1 caching with optimized query patterns
**Status**: ✅ **FULLY RESOLVED** - Cache loading working efficiently

**Previous Issue**: Letterboxd URL accuracy
**Root Cause**: URL generation using generic slugs instead of actual Letterboxd slugs
**Solution**: Enhanced scraping to capture and use real Letterboxd movie slugs
**Status**: ✅ **FULLY RESOLVED** - 100% accurate movie links

### 🎯 CURRENT PROJECT STATUS - PRODUCTION READY WEB APPLICATION

**Achievement**: Fully functional web application with all core features working flawlessly
**Performance Metrics**:

- Fast cache loading with D1 database optimization
- Efficient Letterboxd scraping with robust error handling
- TMDB enhancement with comprehensive movie metadata
- Real-time progress tracking with smooth UI updates
- Responsive design optimized for all screen sizes

**Quality Assurance**: Multiple successful test runs with various friend configurations
**UI/UX**: Letterboxd-inspired dark theme with responsive design and accessibility features
**Ready for**: Web deployment, Cloudflare Pages hosting, and public availability

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
- Cloudflare Functions API integration
- Real-time progress tracking with comprehensive error handling
- Responsive design with accessibility features

## 🐛 RESOLVED DEBUGGING HISTORY

### ✅ Cache Loading Issue (RESOLVED)

**Symptom**: Second comparison hangs on progress page showing "Page: progress | Movies: 0 | Filtered: 0"
**Root Cause**: Database data type mismatch - `movie_year` stored as TEXT but code expected INTEGER
**Solution**: Modified cache reading to handle TEXT-stored years with parsing fallback
**Status**: ✅ **FULLY RESOLVED** - Cache loading working perfectly

### ✅ Letterboxd URL Accuracy Issue (RESOLVED)

**Symptom**: Hamilton (2020) linking to wrong movie (1998 version)
**Root Cause**: URL generation using title-based slugs instead of actual Letterboxd slugs
**Solution**: Enhanced Movie struct with letterboxdSlug field, updated URL generation
**Status**: ✅ **FULLY RESOLVED** - 100% accurate movie links using real scraped slugs

### ✅ UI Polish Issues (RESOLVED)

**Symptoms**: Movie count text off-center, verbose button labels, suboptimal window sizing
**Solutions**: Absolute positioning CSS, shortened button text, updated window dimensions
**Status**: ✅ **FULLY RESOLVED** - Professional UI with responsive design

## 🎯 NEXT PHASE: PUBLISHING & DISTRIBUTION

1. **Web Deployment**: Deploy to Cloudflare Pages with Functions
2. **GitHub Release Management**: Tag releases, create changelogs, document features
3. **Documentation Enhancement**: User guides, API documentation, deployment instructions
4. **Testing & QA**: Cross-browser testing, edge case validation, performance optimization
5. **Community Preparation**: Contributing guidelines, issue templates, roadmap planning

## 🔬 DEBUGGING METHODOLOGY

### Current Debug Infrastructure

- **Backend**: 🔥 prefixed console logs with function entry/exit, parameter logging, step-by-step progress
- **Frontend**: 2-minute timeout wrappers, debug panel with real-time state display
- **Database**: Transaction-based operations with rollback on failure

### Tools Available

- Cloudflare Dev server with hot reload
- Terminal output monitoring via development tools
- Browser developer tools for testing
- D1 database inspection capabilities

## 💡 AI Development Guidelines

### Communication Style

- **Concise & Focused**: Avoid verbose explanations unless debugging requires detail
- **Debug-First Approach**: Always check terminal output before proposing solutions
- **Context Preservation**: Use conversation summary to maintain debugging state

### Code Quality Standards

1. **Security First**: Check for and avoid exposure of sensitive data when suggesting code
2. **Type Safety**: Leverage TypeScript's strict type system
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

## 🚀 Success Metrics & Quality Gates - ALL ACHIEVED ✅

- **First comparison completes successfully**: ✅ WORKING (313 movies processed, 27 common found)
- **Second comparison loads from cache efficiently**: ✅ WORKING (cache loading in <1 second)
- **Progress page transitions to results correctly**: ✅ WORKING (smooth UI flow with progress tracking)
- **Debug panel shows accurate movie counts**: ✅ WORKING (real-time state display)
- **No database constraint errors or hanging**: ✅ WORKING (robust error handling)
- **Security and accessibility standards**: ✅ IMPLEMENTED (WCAG 2.1 compliance, input validation)
- **Comprehensive test coverage**: ✅ IMPLEMENTED (unit tests, integration tests, edge cases)
- **External input validation and sanitization**: ✅ IMPLEMENTED (Letterboxd scraping, TMDB API safety)
- **No hardcoded credentials**: ✅ IMPLEMENTED (environment variables, user input for API keys)
- **Proper error handling with meaningful messages**: ✅ IMPLEMENTED (comprehensive error reporting)
- **Performance considerations for large datasets**: ✅ IMPLEMENTED (batch processing, caching, rate limiting)
- **AI-generated code includes proper attribution**: ✅ IMPLEMENTED (timestamp and model identity comments)

## 🏆 PUBLISHING READINESS CHECKLIST

### Core Application

- ✅ **Fully functional web app** - All features working flawlessly
- ✅ **Cross-platform compatibility** - Tauri ensures Windows/macOS/Linux support
- ✅ **Production-grade performance** - Optimized caching and batch processing
- ✅ **Professional UI/UX** - Letterboxd-inspired design with accessibility features
- ✅ **Robust error handling** - Comprehensive timeout and fallback mechanisms
- ✅ **Security best practices** - Input validation, environment variables, sanitized parsing

### Documentation & Distribution

- 🔧 **Release packaging** - Create distributable executables (Tauri build)
- 🔧 **Installation guides** - Platform-specific setup instructions
- 🔧 **User documentation** - Feature guides and troubleshooting
- 🔧 **GitHub releases** - Version tagging and binary distribution
- 🔧 **Demo content** - Screenshots, videos, usage examples

---

## 📚 Reference Files

- `README.md` – Updated project overview with production-ready status and achievements
- `SETUP.md` – Updated development environment with current status and next steps
- `database-schema-enhancements.sql` – Complete database schema and migrations
- Application running successfully at http://localhost:1420 with full functionality
- Terminal output showing successful cache operations and TMDB enhancement
- All features tested and working: Letterboxd scraping, TMDB integration, intelligent caching

---

## 🤖 MCP Integration & AI Productivity Requirements

### **MANDATORY MCP Usage**

AI assistants MUST actively use Model Context Protocol (MCP) servers to optimize productivity:

#### **Primary MCPs (Use Regularly)**

- **@memory** - Knowledge graph management for project context and decisions
- **@github** - Repository operations, issue management, PR workflows
- **@sequentialthinking** - Complex problem analysis and multi-step reasoning
- **@codacy** - Code quality analysis and security scanning

#### **Secondary MCPs (Use When Applicable)**

- **@playwright** - Browser testing and automation
- **@markitdown** - Document conversion and processing

### **MCP Usage Patterns**

1. **Start Every Session**: Query `@memory` to understand current project state
2. **Before Major Changes**: Use `@sequentialthinking` for planning and analysis
3. **Code Quality**: Run `@codacy` analysis before commits
4. **Documentation Updates**: Use `@memory` to track decisions and update knowledge graph
5. **Repository Management**: Use `@github` for branches, issues, and releases

### **Development Workflow Integration**

- **Windows PowerShell**: Development builds (`npm run dev`, `npm run build`)
- **WSL**: All development tasks (git, file operations, debugging, MCP usage)
- **VS Code**: 6 MCPs configured and operational
- **Cross-Platform**: Validated on Windows and Linux

### **Knowledge Management Protocol**

- Update `@memory` after resolving issues
- Document architectural decisions in knowledge graph
- Track debugging sessions and solutions
- Maintain project status and milestones

---

## 🎯 CURRENT STATUS - August 7, 2025

### ✅ **PRODUCTION READY APPLICATION - PHASE 5 COMPLETED**

- **Repository Optimization**: Clean enterprise branch structure (main ⭐⭐⭐⭐⭐, develop ⭐⭐⭐⭐)
- **MCP Integration**: Comprehensive utilization strategy implemented and documented
- **Branch Protection**: Enterprise-grade workflow with 6 CI/CD quality gates
- **Quality Infrastructure**: Self-healing CI/CD, automated security scanning, dependency management
- **Cross-Platform**: Web deployment ready for all browsers and devices
- **Documentation**: Complete user guides, release notes, deployment instructions
- **Security**: Public release ready with comprehensive audit and compliance
- **Clean State**: All temporary branches removed, stale artifacts pruned

### 🚀 **MCP-FIRST DEVELOPMENT WORKFLOW - ACTIVE**

**MANDATORY MCP Usage Patterns:**

1. **Session Start**: Query @memory for project context (100% compliance required)
2. **Complex Tasks**: Use @sequentialthinking for multi-step analysis (50% target)
3. **Code Quality**: Run @codacy analysis before every commit (100% pre-commit)
4. **Repository Operations**: Use @github for branches, PRs, issues (80% target)
5. **Testing**: @playwright for web app validation (when applicable)
6. **Documentation**: @markitdown for release processes (when applicable)

**Enterprise Git Workflow:**

- **Development**: feature/_ → develop → release/_ → main
- **Emergency**: hotfix/\* → main + develop
- **Protection Levels**: main/release/hotfix (⭐⭐⭐⭐⭐), develop (⭐⭐⭐⭐), feature/\* (⭐⭐⭐)
- **Quality Gates**: 6 CI/CD jobs, GPG signing, review requirements, linear history

### 🎯 **NEXT PHASE: SYSTEMATIC MCP IMPLEMENTATION**

1. **Demonstrate MCP Integration**: Start every session with @memory query
2. **Quality Automation**: @codacy integration into development workflow
3. **Advanced Automation**: @playwright testing for web app validation
4. **Documentation Enhancement**: @markitdown for professional release materials
5. **Knowledge Management**: @memory updates after every major milestone

---

_Last Updated: August 7, 2025 - Repository optimization and MCP-first workflow active_  
_Enterprise branch structure implemented with comprehensive quality gates and protection hierarchy_
