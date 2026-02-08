# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated versioning and changelog management workflows (#162)
  - Version bump workflow with manual release creation
  - Automatic changelog updates on PR merge
  - Comprehensive validation and security measures
  - Integration with CI test suite

### Changed
- update CHANGELOG for PR #181 (#182) by @github-actions[bot]
- Opened PR for changelog updates (#181)
- Updated all site references from dev (boxdbud.pages.dev) to production (boxdbud.io) (#163)
  - README.md launch link and user guide
  - package.json homepage field
  - index.html Open Graph meta tags
  - API base URLs in backend services

#### Updated dependencies
- Upgraded multiple dev dependencies to latest versions
  - actions/checkout from 4 to 6
  - actions/setup-node from 5 to 6
  - actions/upload-artifact from 4 to 6
  - github/codeql-action from 3 to 4
  - @typescript-eslint/eslint-plugin from 8.43.0 to 8.46.2
  - @typescript-eslint/parser from 8.45.0 to 8.50.1
  - eslint-plugin-react-hooks from 5.2.0 to 7.0.1
  - lint-staged from 16.1.6 to 16.2.7
  - vite from 7.1.3 to 7.2.4 (security fix)
  - react to 19.2.0 and @types/react to 19.2.2
  - react-dom and @types/react-dom aligned to 19.2.2

## [2.1.0] - 2025-09-13

### Added
- Genre badges display on movie cards for easy identification
- Enhanced movie information display

### Changed
- Improved UI/UX for better user experience
- Updated TMDB data integration

### Fixed
- Various bug fixes and performance improvements

## [2.0.0] - 2025-09-13

### Added
- Web-first experience with Cloudflare Pages + Functions
- D1 (SQLite) caching system for improved performance
- Attribution modal with GitHub links
- Responsive dark theme design

### Changed
- Platform migration from Desktop application to Web application
- Complete UI refresh and accessibility improvements
- Consistent TMDB poster handling

### Fixed
- Cleaned repository of generated artifacts
- Removed accidental secrets from repository

[Unreleased]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Wootehfook/BoxdBuddies/releases/tag/v2.0.0
