<!-- AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-20 -->

# npm Audit Vulnerabilities - Analysis & Decision

**Status**: Documented and Accepted (No Breaking Changes)

## Vulnerabilities Summary

After running `npm audit`, 11 vulnerabilities are reported:

- **1 Moderate**: ajv <8.18.0 (ReDoS with `$data` option)
- **10 High**: minimatch <10.2.1 (ReDoS via repeated wildcards)

**Location**: All are in dev-only transitive dependencies within the ESLint toolchain.

## Dependency Chain

```
ajv <8.18.0
└─ @eslint/eslintrc
   └─ eslint
      └─ @typescript-eslint/eslint-plugin, @typescript-eslint/parser

minimatch <10.2.1
├─ @eslint/config-array (via eslint)
├─ @typescript-eslint/typescript-estree
└─ eslint-plugin-react
```

## Why These Can't Be Fixed

### Issue 1: ajv Breaking Changes

- Newer ajv (8.18.0+) has **API-breaking changes** that break @eslint/eslintrc
- @eslint/eslintrc depends on `ajv.addSchema()` with parameters that no longer exist in 8.18.0+
- Attempting `npm audit fix --force` breaks ESLint: `TypeError: Cannot set properties of undefined (setting 'defaultMeta')`

### Issue 2: minimatch Dependency Constraints

- minimatch 10.2.1+ requires Node 16+ and has stricter requirements
- @typescript-eslint/typescript-estree >=6.16.0 has complex transitive deps on minimatch
- Upgrading breaks peer dependencies with eslint-plugin-react-hooks

## Why This Is Acceptable

1. **Zero Runtime Impact**: All vulnerabilities are dev-only (linting, type-checking, testing)
2. **No User Exposure**: These tools don't run in production or expose security boundaries
3. **Ecosystem Limitation**: This is a known issue in the ESLint/TypeScript-ESLint ecosystem during their transition to new flat config standards (see https://github.com/eslint/eslintrc/issues)
4. **Upstream Resolution Pending**: ESLint team is working on config system improvements

## Solution: Configuration

### .npmrc

Added `legacy-peer-deps=true` to allow installation without peer dependency conflicts.

### CI/CD Integration

For production deployments, use:

```bash
npm ci --omit=dev
npm audit --omit=dev
```

This ensures no vulnerabilities in runtime code.

## Timeline

- **2026-02-20**: npm audit shows 11 vulnerabilities in dev-only deps
- **Decision**: Accept and document with `.npmrc` configuration
- **Action**: Monitor upstream packages for ecosystem improvements

## Related Issues

- ESLint Config System Modernization: https://github.com/eslint/eslintrc/issues
- AJV TypeScript Support: https://github.com/ajv-validator/ajv/issues
- minimatch Maintenance: https://github.com/isaacs/minimatch/issues
