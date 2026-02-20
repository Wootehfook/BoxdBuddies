<!-- AI Generated: GitHub Copilot (Claude Haiku 4.5) - 2026-02-20 -->

# Security Exceptions

This document lists pre-approved security exceptions for BoxdBuddies. These are vulnerabilities or audit findings that have been reviewed and determined to pose no risk to production or user security.

**Related documentation**: See [`npm-audit-decision.md`](./npm-audit-decision.md) for detailed technical analysis of ESLint/TypeScript vulnerabilities including specific dependency chains, breaking change explanations, and `.npmrc` configuration guidance. This file provides quick-reference exception status for agent workflows.

## Dev-Dependency Build-Chain Exceptions

### ESLint & TypeScript-ESLint (`node_modules`)

**Status**: Pre-approved exception  
**Last reviewed**: 2026-02-20 (verified: ajv + minimatch vulnerabilities still dev-only)  
**Reason**: This project uses ESLint and TypeScript-ESLint for local development code quality. These dependencies are **dev-only** and are never bundled or deployed to production. Vulnerabilities in their build chains cannot be resolved without breaking local development tooling compatibility.

**Scope**:

- ESLint (`^9.39.1`)
- TypeScript-ESLint plugin (`^8.51.0`)
- TypeScript-ESLint parser (`^8.50.1`)

**Impact**: Zero risk to production. Developers should keep these packages reasonably up to date, but build failures due to version incompatibility are acceptable when addressing the underlying dependency conflict would break the development environment.

**What to do when `npm audit` reports these**:

1. Verify the vulnerability is in ESLint, TypeScript-ESLint, or their transitive dependencies
2. Check if the issue is marked as `dev-only` in the audit output
3. Document in the PR body under "Security notes": "ESLint/TypeScript dev dependencies: pre-approved exception (dev-only, zero risk to production)"
4. Do not block on these vulnerabilities

**Review cycle**: Annually or when ESLint/TypeScript major versions change

---

## How to Add New Exceptions

If a new security exception is needed:

1. Document it in this file with:
   - Package name(s)
   - Reason for exception
   - Scope (dev-only, specific versions, etc.)
   - Impact assessment
   - Action guidance for developers
   - Next review date

2. Create a PR with the exception documented
3. Have the change reviewed and approved
4. Reference the PR in future audit findings

---

## Review History

| Date       | Package(s)        | Action                                |
| ---------- | ----------------- | ------------------------------------- |
| 2026-02-20 | ESLint/TypeScript | Documented pre-approved dev exception |
