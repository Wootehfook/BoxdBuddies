<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# BoxdBuddies - AI Agent Instructions & Project Context

> This document provides universal context and requirements for AI coding assistants contributing to this project.
> **Format:** Standard AI context file for professional software development with BoxdBuddies-specific implementation details.

---

## 🎯 Project Overview

**BoxdBuddies** is a professionally developed Tauri-based desktop application (Rust backend + React TypeScript frontend) that compares Letterboxd watchlists between friends to find movies everyone wants to watch. The app scrapes Letterboxd profiles, enhances movie data via TMDB API, and provides an elegant comparison interface.

**Design Philosophy:** Emphasizes security, code quality, accessibility, and responsible AI attribution.
**Contributors:** Human and AI collaboration.
**Licensing:** AGPL-3.0 (ensure compliance).

---

## 📋 General Development Standards

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
  // AI Generated: GitHub Copilot - 2025-08-02
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

### ✅ COMPLETED PHASES - PRODUCTION READY

- [x] **Project Scaffolding**: Complete Tauri + React + TypeScript setup
- [x] **Core Infrastructure**: Docker containerization, Vite build system, task configurations
- [x] **Database Architecture**: SQLite with 5-table schema (friends, friend_watchlists, friend_sync_status, users, watched_movies)
- [x] **Letterboxd Integration**: Full watchlist scraping with robust HTML parsing and real Letterboxd slug capture
- [x] **TMDB Enhancement**: Movie data enrichment with posters, ratings, descriptions, and director information
- [x] **Caching System**: Intelligent database caching with batch processing (25-movie batches) and count verification
- [x] **Progress Tracking**: Real-time UI progress updates with debug panel and progress simulation
- [x] **Error Handling**: Comprehensive timeout mechanisms (2-minute frontend timeouts)
- [x] **URL Accuracy**: Fixed Letterboxd movie URLs to use actual scraped slugs (Hamilton 2020 vs 1998 issue resolved)
- [x] **UI Polish**: Centered movie count text, optimized button labels, responsive 890x1075px window sizing
- [x] **Cache Performance**: Lightning-fast cache loading with persistent TMDB data and director information
- [x] **Production Testing**: Successfully processing 313+ movies with 27 common movies found across multiple friends

### ✅ ALL CRITICAL ISSUES RESOLVED - PRODUCTION READY

**Previous Issue**: Application hanging on progress page when loading from cache
**Root Cause**: Database data type mismatch - `movie_year` stored as TEXT but code expected INTEGER  
**Solution**: Modified cache reading to handle TEXT-stored years with parsing fallback
**Status**: ✅ **FULLY RESOLVED** - Cache loading working perfectly

**Previous Issue**: Hamilton (2020) linking to wrong movie (1998 version)
**Root Cause**: URL generation using title-based slugs instead of actual Letterboxd slugs
**Solution**: Enhanced Movie struct with letterboxdSlug field and updated URL generation to use real scraped slugs
**Status**: ✅ **FULLY RESOLVED** - 100% accurate movie links

### 🎯 CURRENT PROJECT STATUS - PRODUCTION READY APPLICATION

**Achievement**: Fully functional desktop application with all core features working flawlessly
**Performance Metrics**:

- Cache loading: 313 movies processed in <1 second
- Fresh scraping: 30+ seconds for initial data
- TMDB enhancement: 27 movies enhanced with full metadata
- Real-time progress tracking with smooth UI updates
  **Quality Assurance**: Multiple successful test runs with 3+ friends, all comparison scenarios working
  **UI/UX**: Letterboxd-inspired dark theme with responsive design and accessibility features
  **Ready for**: Desktop app distribution, GitHub releases, and public availability

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

1. **Desktop App Packaging**: Create distributable executables for Windows, macOS, Linux
2. **GitHub Release Management**: Tag releases, create changelogs, distribute binaries
3. **Documentation Enhancement**: User guides, installation instructions, feature documentation
4. **Testing & QA**: Cross-platform testing, edge case validation, performance optimization
5. **Community Preparation**: Contributing guidelines, issue templates, roadmap planning

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

- ✅ **Fully functional desktop app** - All features working flawlessly
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

- **Windows CMD**: Tauri builds only (`npm run tauri dev/build`)
- **WSL**: All development tasks (git, file operations, debugging, MCP usage)
- **VS Code**: 6 MCPs configured and operational
- **Cross-Platform**: Validated on Windows and Linux

### **Knowledge Management Protocol**

- Update `@memory` after resolving issues
- Document architectural decisions in knowledge graph
- Track debugging sessions and solutions
- Maintain project status and milestones

---

## 🎯 CURRENT STATUS - August 31, 2025

### ✅ **PRODUCTION READY APPLICATION - PHASE 6 COMPLETED**

- **Repository Optimization**: Clean enterprise branch structure (main ⭐⭐⭐⭐⭐, develop ⭐⭐⭐⭐)
- **MCP Integration**: Comprehensive utilization strategy implemented and documented
- **Branch Protection**: Enterprise-grade workflow with 6 CI/CD quality gates
- **Quality Infrastructure**: Self-healing CI/CD, automated security scanning, dependency management
- **Cross-Platform**: Windows MSI, macOS DMG, Linux packages (DEB/AppImage/RPM) ready
- **Documentation**: Complete user guides, release notes, installation instructions
- **Security**: Public release ready with comprehensive audit and compliance
- **Clean State**: All temporary branches removed, stale artifacts pruned
- **🚀 ROO CODE INTEGRATION**: Full AI-powered development environment configured

### 🤖 **ROO CODE AI DEVELOPMENT ENVIRONMENT - ACTIVE**

**Roo Code Configuration:**

1. **Model Mappings**: Claude Sonnet 4 primary, intelligent fallbacks configured
2. **Workspace Settings**: Optimized VSCode configuration for AI development
3. **Task Automation**: AI-powered workflows integrated into development process
4. **Extension Stack**: Curated extensions for maximum productivity
5. **Vibe Coder Mode**: Adaptive AI assistance for creative development

**AI Model Strategy:**

- **Primary**: Claude Sonnet 4 for complex architecture and implementation
- **Secondary**: Claude 3.5 Sonnet for general development and documentation
- **Specialized**: GPT-4o for rapid prototyping, Gemini 2.5 Pro for performance analysis
- **Fallback**: Intelligent model selection based on task complexity and context

### 🚀 **MCP-FIRST + ROO CODE DEVELOPMENT WORKFLOW - ACTIVE**

**MANDATORY AI-Enhanced Development Patterns:**

1. **Session Start**: Query @memory for project context + Roo mode selection
2. **Complex Tasks**: Use @sequentialthinking + Roo Architect mode for system design
3. **Code Quality**: Run @codacy analysis + Roo Code mode for implementation
4. **Repository Operations**: Use @github + Roo Orchestrator for complex workflows
5. **Testing**: @playwright + Roo Debug mode for comprehensive testing
6. **Documentation**: @markitdown + Roo Ask mode for intelligent documentation

**Enhanced Git Workflow with AI:**

- **Development**: feature/_ → develop → release/_ → main (AI-assisted at each stage)
- **Emergency**: hotfix/\* → main + develop (Roo Debug mode for rapid fixes)
- **Protection Levels**: main/release/hotfix (⭐⭐⭐⭐⭐), develop (⭐⭐⭐⭐), feature/\* (⭐⭐⭐)
- **Quality Gates**: 6 CI/CD jobs + AI code review, GPG signing, review requirements

### 🎯 **NEXT PHASE: AI-NATIVE DEVELOPMENT WORKFLOW**

1. **Vibe Coder Experience**: Seamless AI-human collaboration in development
2. **Intelligent Context Switching**: Automatic model selection based on task type
3. **Predictive Development**: AI-suggested improvements and optimizations
4. **Continuous Learning**: Model preferences adapt to developer patterns
5. **Knowledge Synthesis**: @memory + Roo modes for comprehensive project understanding

## 🤖 **ROO CODE SPECIFIC INSTRUCTIONS**

### **Mode Selection Strategy**

#### 🏗️ Architect Mode (Claude Sonnet 4)

- **Use For**: System design, architecture decisions, complex planning
- **Strengths**: Deep reasoning, architectural patterns, scalability planning
- **Context**: BoxdBuddies infrastructure, Cloudflare deployment architecture

#### 💻 Code Mode (Claude Sonnet 4)

- **Use For**: Implementation, refactoring, complex TypeScript/React logic
- **Strengths**: Type safety, modern patterns, performance optimization
- **Context**: Frontend components, backend functions, API integrations

#### ❓ Ask Mode (Claude Sonnet 4)

- **Use For**: Code explanation, analysis, learning, documentation
- **Strengths**: Clear explanations, educational content, comprehensive analysis
- **Context**: Understanding existing codebase, exploring new technologies

#### 🪲 Debug Mode (Claude 3.5 Sonnet)

- **Use For**: Troubleshooting, error analysis, performance issues
- **Strengths**: Systematic debugging, error pattern recognition, quick fixes
- **Context**: Bug fixes, performance optimization, testing issues

#### 🪃 Orchestrator Mode (Claude Sonnet 4)

- **Use For**: Multi-step projects, workflow coordination, release management
- **Strengths**: Project coordination, dependency management, process optimization
- **Context**: Feature releases, migration projects, infrastructure changes

### **File-Type Specific AI Assistance**

```typescript
// TypeScript/React files (.tsx, .ts) - Claude Sonnet 4
// Focus on type safety, modern React patterns, performance
interface ComponentProps {
  // AI will suggest comprehensive typing
}

const Component: React.FC<ComponentProps> = ({ prop }) => {
  // AI optimizes for accessibility, performance, maintainability
};
```

```rust
// Rust files (.rs) - Claude Sonnet 4
// Focus on memory safety, performance, idiomatic patterns
pub async fn function_name() -> Result<ReturnType, CustomError> {
    // AI emphasizes error handling, performance, safety
}
```

```sql
-- SQL files (.sql) - Claude 3.5 Sonnet
-- Focus on performance, data integrity, query optimization
SELECT columns FROM tables
WHERE conditions -- AI optimizes for performance and clarity
```

### **Vibe Coder Enhancements**

- **Contextual Suggestions**: AI adapts to your coding style and project patterns
- **Rapid Prototyping**: Quick iterations with intelligent model switching
- **Seamless Integration**: Natural workflow with minimal interruption
- **Learning Adaptation**: AI preferences evolve with your development patterns
- **Creative Exploration**: AI encourages experimentation and innovation

### **Quick Commands for Roo Code**

- `Ctrl+Shift+P` → "Roo:" → Access all AI modes quickly
- `Ctrl+I` → Inline AI suggestions with context awareness
- `Ctrl+Shift+I` → AI chat panel with model selection
- `F1` → Task palette with AI-enhanced workflows

---

_Last Updated: August 7, 2025 - Repository optimization and MCP-first workflow active_  
_Enterprise branch structure implemented with comprehensive quality gates and protection hierarchy_
