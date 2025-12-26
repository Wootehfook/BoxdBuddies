# Versioning and Release Process

This document describes the automated versioning and changelog management system for BoxdBuddies.

## Overview

The project uses:
- **[Semantic Versioning](https://semver.org/)** for version numbers (MAJOR.MINOR.PATCH)
- **[Keep a Changelog](https://keepachangelog.com/)** format for CHANGELOG.md
- **[Conventional Commits](https://www.conventionalcommits.org/)** for automatic changelog updates

## Automated Workflows

### 1. Automatic Changelog Updates (changelog-update.yml)

**Trigger:** When a PR is merged to `main` or `develop`

**What it does:**
- Extracts the PR title and determines the change type based on conventional commits:
  - `feat:` → Added section
  - `fix:` → Fixed section
  - `chore:`, `docs:`, `refactor:`, etc. → Changed section
- Adds an entry to the `[Unreleased]` section of CHANGELOG.md
- Commits and pushes the updated CHANGELOG.md
- Comments on the PR to confirm the update

**Example:**
- PR title: `feat: add user authentication`
- Result: Entry added to "Added" section: `- add user authentication (#123) by @username`

### 2. Version Bump and Release (version-bump.yml)

**Trigger:** Manual workflow dispatch via GitHub Actions UI

**What it does:**
1. Bumps the version in package.json (patch, minor, or major)
2. Moves all `[Unreleased]` changes to a new version section in CHANGELOG.md
3. Creates a git tag (e.g., `v2.2.0`)
4. Pushes changes and tag to the repository
5. Creates a GitHub Release with the changelog content

**How to use:**
1. Ensure all unreleased changes are documented in CHANGELOG.md
2. Go to GitHub Actions → "Version Bump and Release"
3. Click "Run workflow"
4. Select the version bump type:
   - **patch** (2.1.0 → 2.1.1): Bug fixes and small updates
   - **minor** (2.1.0 → 2.2.0): New features (backward compatible)
   - **major** (2.1.0 → 3.0.0): Breaking changes
5. Optionally add release notes
6. Click "Run workflow"

## Workflow for Contributors

### Making Changes

1. Create a feature branch
2. Make your changes
3. When creating a PR, use conventional commit format in the title:
   ```
   feat: add new movie filter
   fix: correct poster loading issue
   chore: update dependencies
   ```

### When Your PR is Merged

The changelog will be automatically updated with your changes.

### Preparing a Release (Maintainers Only)

1. Review the `[Unreleased]` section in CHANGELOG.md
2. Ensure all significant changes are documented
3. Run the "Version Bump and Release" workflow
4. Verify the GitHub Release was created successfully

## Manual Operations

### Check Current Version
```bash
npm run version:current
```

### View Version-Related Scripts
```bash
npm run version:patch  # Instructions for patch release
npm run version:minor  # Instructions for minor release
npm run version:major  # Instructions for major release
```

## CHANGELOG.md Structure

```markdown
# Changelog

## [Unreleased]

### Added
- New features that have been merged but not released

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

## [2.1.0] - 2025-09-13

### Added
- Feature X
- Feature Y

[Unreleased]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/Wootehfook/BoxdBuddies/compare/v2.0.0...v2.1.0
```

## Conventional Commit Types

| Type | Description | Changelog Section |
|------|-------------|-------------------|
| `feat` | New feature | Added |
| `fix` | Bug fix | Fixed |
| `chore` | Maintenance task | Changed |
| `docs` | Documentation | Changed |
| `refactor` | Code refactoring | Changed |
| `perf` | Performance improvement | Changed |
| `test` | Test updates | Changed |
| `build` | Build system changes | Changed |
| `ci` | CI/CD changes | Changed |

## Troubleshooting

### The changelog wasn't updated after my PR merged

- Check that your PR was merged to `main` or `develop`
- Check the Actions tab for the "Update Changelog on PR Merge" workflow
- If it failed, you can manually add the entry to CHANGELOG.md

### The version bump workflow failed

- Check the Actions tab for detailed error logs
- Common issues:
  - No unreleased changes in CHANGELOG.md
  - Git conflicts
  - Permission issues

### I need to make changes to a release

If a release was created with errors:
1. Delete the GitHub Release (not the tag yet)
2. Delete the git tag locally and remotely:
   ```bash
   git tag -d v2.2.0
   git push origin :refs/tags/v2.2.0
   ```
3. Revert the version bump commit
4. Make corrections to CHANGELOG.md
5. Run the version bump workflow again

## AI Attribution

This versioning system was designed to work seamlessly with AI-generated contributions while maintaining full traceability and proper attribution.

---

**Questions?** Open an issue or check the [GitHub Actions documentation](https://docs.github.com/en/actions).
