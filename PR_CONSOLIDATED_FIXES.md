# PR: Consolidated Workflow Fixes

## Summary

This PR consolidates critical fixes from multiple open pull requests into a single, unified update. It addresses issues in the automated versioning and changelog workflows to ensure proper operation.

## What's Fixed

### 1. Changelog Workflow Regex Pattern Fix

**From**: `copilot/fix-changelog-update-issue`

- **Issue**: Unescaped angle brackets in regex pattern caused validation failures
- **Fix**: Properly escape `<` and `>` characters in the dangerous character detection regex
- **Impact**: Prevents false positives in PR title validation and ensures changelog updates work correctly
- **Files**: `.github/workflows/changelog-update.yml`

### 2. Version Bump Workflow PR-Based Process

**From**: `copilot/fix-version-bump-issues`

- **Issue**: Version bump workflow was pushing directly to main, bypassing required reviews and checks
- **Fix**: Updated workflow to create a PR instead, with automatic GitHub Release creation on merge
- **Impact**: Ensures all changes follow proper review process and branch protection rules
- **Changes**:
  - Version bump now creates a PR to main instead of direct push
  - New workflow automatically creates GitHub Release when version bump PR is merged
  - Added clarifying comments to AWK pattern in create-release workflow
  - Updated documentation to reflect new PR-based workflow
- **Files**:
  - `.github/workflows/create-release.yml` (new)
  - `.github/workflows/version-bump.yml` (modified)
  - `docs/versioning-and-releases.md` (updated)
  - `docs/versioning-workflow-diagram.md` (updated)

## Validation

### Local Checks ✅

- TypeScript: `npm run type-check` - PASS
- Linting: `npm run lint` - PASS
- Build: `npm run build` - SUCCESS

### CI Status

- Awaiting CI pipeline completion on this PR

## Files Changed

- `.github/workflows/changelog-update.yml` - Regex pattern fix
- `.github/workflows/create-release.yml` - New workflow for automatic releases
- `.github/workflows/version-bump.yml` - Updated to use PR-based process
- `docs/versioning-and-releases.md` - Documentation updates
- `docs/versioning-workflow-diagram.md` - Workflow diagram updates

## Why Consolidate?

These fixes are closely related (both affect the versioning/changelog automation) and should be deployed together for consistency. Consolidating into one PR:

- Reduces review overhead
- Ensures fixes are applied atomically
- Prevents partial deployment issues
- Makes it easier to track the complete fix history

## Related PRs

This PR supersedes:

- PR from `copilot/fix-changelog-update-issue` branch
- PR from `copilot/fix-version-bump-issues` branch

## How to Test

1. **Changelog Update**:
   - Merge a PR with conventional commit formatted title
   - Verify CHANGELOG.md is updated correctly without regex errors

2. **Version Bump**:
   - Trigger "Version Bump and Release" workflow
   - Verify it creates a PR (not direct push)
   - Merge the version bump PR
   - Verify GitHub Release is automatically created

## Notes for Reviewers

- Focus on the regex escaping in `.github/workflows/changelog-update.yml` (line 39)
- Review the PR creation logic in `.github/workflows/version-bump.yml`
- Verify the new `.github/workflows/create-release.yml` workflow triggers correctly
- Check that documentation accurately reflects the new workflow

## Deployment Checklist

- [ ] CI passes
- [ ] Code review approved
- [ ] Documentation reviewed
- [ ] No merge conflicts with main
- [ ] Ready to merge

---

**Branch**: `fix/consolidated-pr-fixes`  
**Target**: `main`  
**Type**: Bug Fix  
**Priority**: High (affects CI/CD automation)

---

_Created via GitHub Copilot - Consolidated PR Fixes - 2026-02-07_
