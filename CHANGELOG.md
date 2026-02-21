<!-- AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-21 -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.2] - 2026-02-21

### Changed

- Add pre-upload quality check agent workflow (#235)
- Cleanup and consolidate GitHub workflows (#231)
- Resolve npm audit vulnerabilities with ecosystem workaround (#229)
- Bump actions/github-script from 7 to 8 (#217)
- Bump jsdom from 27.4.0 to 28.1.0 (#220)
- Bump vite from 7.3.0 to 7.3.1 (#195)
- Replace manual TMDB sync script with Cloudflare Worker cron job (#208)

### Fixed

- Fix SonarQube CPD duplication gate failure in watchlist-count-updates tests (#235)
- Fix branch protection rulesets using incorrect status check contexts (#223)
- Harden admin auth and cleanup cron sync (#210)

### Added

- Implement Gitflow branching infrastructure (#214)

## [2.1.1] - 2026-02-10

### Added

- Automated versioning and changelog management workflows (#162)
  - Version bump workflow with manual release creation
  - Automatic changelog updates on PR merge
  - Comprehensive validation and security measures
  - Integration with CI test suite

### Fixed

- Ensure version bump PR checks run (#190)
- Fix security audit failure by updating Vite to 7.1.12 (#138)
- Escape angle brackets in changelog workflow regex pattern (#170)
- Fix version bump workflow branch protection violations by creating PRs (#171)
- Consolidate changelog/version bump workflow fixes and security updates (#176)
- Fix navigator.onLine test isolation in watchlistFetcher (#180)

### Changed

- Add workflow-only required checks (#203)
- Harden changelog workflow_run PR context (#201)
- Update workflow signing and cleanup (#187)
- Prevent changelog PR loop and update changelog (#184)
- Opened PR for changelog updates (#181)
- Updated all site references from dev (boxdbud.pages.dev) to production (boxdbud.io) (#163)
  - README.md launch link and user guide
  - package.json homepage field
  - index.html Open Graph meta tags
  - API base URLs in backend services
- Update v2.1.0 release documentation (#122)
- Update CHANGELOG unreleased section with PRs merged since 9/13/2025 (#164)
- Open PRs for automated changelog updates (#181)
- Update CHANGELOG for PR #181 (#182)

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
- Bump lint-staged from 16.1.6 to 16.2.3 (#125)
- Bump @vitejs/plugin-react from 5.0.3 to 5.0.4 (#127)
- Bump react and @types/react (#128)
- Bump @typescript-eslint/eslint-plugin from 8.43.0 to 8.45.0 (#130)
- Bump github/codeql-action from 3 to 4 (#133)
- Bump actions/setup-node from 5 to 6 (#134)
- Bump actions/upload-artifact from 4 to 5 (#140)
- Bump lint-staged from 16.2.3 to 16.2.6 (#141)
- Bump @typescript-eslint/eslint-plugin from 8.45.0 to 8.46.2 (#142)
- Bump eslint-plugin-react-hooks from 5.2.0 to 7.0.1 (#143)
- Bump @typescript-eslint/parser from 8.45.0 to 8.46.2 (#144)
- Bump @testing-library/jest-dom from 6.8.0 to 6.9.1 (#146)
- Bump typescript from 5.9.2 to 5.9.3 (#147)
- Bump @types/node from 24.5.2 to 24.10.0 (#148)
- Bump @eslint/js from 9.36.0 to 9.39.0 (#149)
- Bump js-yaml from 4.1.0 to 4.1.1 (#150)
- Bump @vitejs/plugin-react from 5.0.4 to 5.1.1 (#151)
- Bump vite from 7.1.12 to 7.2.2 (#152)
- Bump eslint from 9.36.0 to 9.39.1 (#153)
- Bump jsdom from 27.0.0 to 27.2.0 (#154)
- Bump actions/checkout from 4 to 6 (#155)
- Bump lint-staged from 16.2.6 to 16.2.7 (#156)
- Bump wrangler from 4.38.0 to 4.51.0 (#157)
- Bump prettier from 3.6.2 to 3.7.3 (#159)
- Bump @typescript-eslint/parser from 8.46.2 to 8.48.0 (#160)
- Bump actions/upload-artifact from 5 to 6 (#161)
- Bump @eslint/js from 9.39.1 to 9.39.2 (#165)
- Bump vitest from 3.2.4 to 4.0.16 (#166)
- Bump vite from 7.2.4 to 7.3.0 (#167)
- Bump jsdom from 27.2.0 to 27.4.0 (#168)
- Bump @typescript-eslint/eslint-plugin from 8.46.2 to 8.50.1 (#169)

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

[Unreleased]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.1.2...HEAD
[2.1.2]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Wootehfook/BoxdBuddies/releases/tag/v2.0.0
