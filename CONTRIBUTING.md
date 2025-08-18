# Contributing to BoxdBuddy

Thank you for your interest in contributing to BoxdBuddy! This document provides guidelines for contributing to our web-based Letterboxd watchlist comparison application.

## 📋 Code of Conduct

This project is committed to providing a welcoming and inclusive environment for all contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Git
- VS Code (recommended) with TypeScript extensions

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/BoxdBuddies.git
   cd BoxdBuddies
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development environment:
   ```bash
   npm run dev
   ```
5. Access the application at `http://localhost:5173`

### Environment Configuration

Create a `.env.local` file for local development:

```env
TMDB_API_KEY=your_tmdb_api_key_here
```

## 🔧 Development Guidelines

### Code Style

- **TypeScript/React**: Use ESLint and Prettier configurations
- **Cloudflare Functions**: Follow TypeScript best practices
- **Maximum line length**: 100 characters
- **AI Attribution**: All AI-generated code must include comments with timestamp and model identity

### Architecture Overview

- **Frontend**: React + TypeScript + Vite
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV + D1
- **External APIs**: TMDB for movie metadata

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test locally: `npm run dev`
4. Format code: `npm run format`
5. Check types: `npm run type-check`
6. Commit with clear messages
7. Push to your fork and create a Pull Request

### Commit Message Format

Use conventional commits:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: code formatting`
- `refactor: code restructuring`
- `test: add tests`
- `chore: maintenance tasks`

## 🏗️ Architecture Guidelines

### Backend (Rust)

- Use strong typing, avoid `unwrap()` in production
- Include comprehensive error handling
- Add `///` doc comments for public functions
- Follow security best practices

### Frontend (TypeScript/React)

- Use TypeScript strict mode, no `any` types
- Include JSDoc comments for complex functions
- Follow React best practices
- Ensure accessibility compliance

### Database

- Use snake_case for SQL identifiers
- Include proper migration scripts
- Use transactions for data consistency

## 🧪 Testing

- Write unit tests for new functionality
- Test both success and error scenarios
- Include integration tests for API interactions
- Test accessibility features

## 📝 Documentation

- Update README.md for user-facing changes
- Add JSDoc/Rust doc comments for code changes
- Update architecture documentation when needed

## 🐛 Bug Reports

Include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, versions)
- Debug logs if applicable

## 💡 Feature Requests

Include:

- Clear description of the proposed feature
- Use case and motivation
- Proposed implementation approach
- Consideration of existing architecture

## 📄 License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license.

**Important**: This project prohibits commercial use. Ensure your contributions align with this restriction.

## 🔒 Security

- Report security vulnerabilities privately
- Do not commit API keys or sensitive data
- Follow secure coding practices
- Validate all external inputs

## 📞 Questions?

Feel free to open an issue for questions about:

- Development setup
- Architecture decisions
- Contribution guidelines
- Feature discussions

Thank you for contributing to BoxdBuddies! 🎬

---

_Last updated: August 4, 2025 - PR #4 closed, focusing on PR #3 completion_

```

```
