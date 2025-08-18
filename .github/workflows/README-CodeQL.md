# CodeQL Analysis Configuration

## Current Setup

The repository is configured to use **GitHub's default CodeQL setup** which is enabled in the repository settings.

## Why Custom Workflow is Disabled

The custom `codeql.yml` workflow has been renamed to `codeql.yml.disabled` because:

1. **Conflict with Default Setup**: GitHub's default CodeQL setup conflicts with custom workflows
2. **SARIF Processing Error**: Custom configurations cannot be processed when default setup is enabled
3. **Error Message**: "CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled"

## How CodeQL Analysis Works Now

- **Automatic Analysis**: GitHub's default setup automatically analyzes JavaScript/TypeScript code
- **No Manual Configuration**: No need to maintain custom workflow files
- **Standard Coverage**: Provides security scanning for the web application
- **Simplified Maintenance**: One less workflow to maintain and debug

## Re-enabling Custom Workflow (If Needed)

To re-enable custom CodeQL workflow:

1. Disable default CodeQL setup in repository settings
2. Rename `codeql.yml.disabled` back to `codeql.yml`
3. Update the workflow for web-only project requirements

## Current Analysis Coverage

With default setup enabled, CodeQL will automatically analyze:

- JavaScript/TypeScript files in `src/`
- Cloudflare Functions in `functions/`
- Security vulnerabilities and code quality issues
- Common coding patterns and best practices

---

_Last Updated: August 17, 2025_
_Status: Using GitHub Default CodeQL Setup_
