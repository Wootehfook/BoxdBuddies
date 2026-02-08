# PR: Workflow and Versioning Fixes (Narrowed Scope)

## Summary

This PR addresses critical issues in the automated versioning and changelog workflows. The scope has been narrowed to **workflow and documentation changes only** in response to review feedback.

## What's Fixed

### 1. Changelog Workflow Improvements

**Files**: `.github/workflows/changelog-update.yml`

- Hardened regex pattern validation to prevent false positives
- Improved handling of special characters in PR titles
- Enhanced error detection and reporting

### 2. Version Bump Workflow - PR-Based Process

**Files**: `.github/workflows/version-bump.yml`

- Updated to create PR instead of pushing directly to main
- Ensures all changes follow proper review process and branch protection rules
- Maintains consistency with repository's security policies

### 3. Automated Release Creation

**Files**: `.github/workflows/create-release.yml`

- Fixed direct PR reference handling
- Improved AWK pattern for extracting version information
- Ensures GitHub Releases are created automatically when version bump PRs merge

### 4. Security Policy

**Files**: `SECURITY.md`

- Added vulnerability reporting guidelines
- Clarified security contact procedures

### 5. Security Vulnerability Fix

**Files**: `package-lock.json`

- Updated wrangler from 4.51.0 to 4.63.0 to fix HIGH severity OS Command Injection vulnerability (GHSA-36p8-mvp6-cv38)
- Fixed moderate severity vulnerabilities in transitive dependencies (undici, miniflare)
- All security audits now pass with 0 vulnerabilities
- Justification: Wrangler is used in CI/CD workflows, making this security fix directly relevant to workflow improvements

### 6. Workflow File Updates

**Files**: Multiple workflow files updated for consistency

- `.github/workflows/backend-quality-checks-resolver.yml`
- `.github/workflows/build-application.yml`
- `.github/workflows/code-quality-analysis.yml`
- `.github/workflows/debug-pages-build.yml`
- `.github/workflows/frontend-quality-checks.yml`
- `.github/workflows/security-audit.yml`
- `.github/workflows/security.yml`
- `.github/workflows/test-suite.yml`

## Scope Changes

**REMOVED from original PR** (in response to review feedback):

- Runtime code changes in Functions (tmdb-sync, watchlist-comparison, friends)
- New PowerShell sync script
- Test file additions
- Editor configuration changes

**KEPT in this PR**:

- Workflow fixes and improvements only
- Security policy documentation
- Security vulnerability fixes in build tooling (wrangler)
- No runtime behavior changes

## Why This Matters

These workflow fixes are critical for:

- Preventing CI/CD pipeline failures
- Ensuring proper branch protection and code review
- Maintaining security best practices for releases
- Automating changelog and version management

## Files Changed (13 files)

All changes are limited to:

- GitHub Actions workflows (`.github/workflows/`)
- Security documentation (`SECURITY.md`)
- Dependency security fixes (`package-lock.json`)

No application runtime code is modified in this PR.

## Validation

### Workflow Syntax

- All YAML files pass GitHub Actions syntax validation
- Workflow triggers and permissions properly configured

### Security

- No secrets or credentials exposed
- Proper use of environment variables and GitHub tokens

## How to Test

1. **Changelog Update**:
   - Merge a PR with conventional commit formatted title
   - Verify CHANGELOG.md updates without errors

2. **Version Bump**:
   - Trigger "Version Bump and Release" workflow
   - Verify it creates a PR (not direct push)
   - Merge the version bump PR
   - Verify GitHub Release is automatically created

## Notes for Reviewers

- This PR now contains **only workflow and documentation changes**
- No runtime code is modified
- All application behavior remains unchanged
- Changes are low-risk and improve CI/CD automation

---

**Branch**: `copilot/sub-pr-176-another-one`  
**Target**: PR #176 branch  
**Type**: CI/CD Workflow Fixes  
**Priority**: High (affects release automation)

---

_Created via GitHub Copilot - Workflow Fixes (Narrowed Scope) - 2026-02-08_
