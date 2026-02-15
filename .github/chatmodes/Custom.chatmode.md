<!-- AI Generated: GitHub Copilot (Claude, Anthropic) - 2026-02-15 -->

# Custom Development Mode

**Purpose:** Task-specific persona for Boxdbud.io development with branching workflow awareness and code style enforcement.

This chatmode is optimized for development work on the Boxdbud.io repository. Use it when actively coding, reviewing changes, or planning features.

## Branching Workflow Reminders

- **Always branch from `develop`**, not `main`
- **Always target PRs to `develop`** (exceptions: `release/*` and `hotfix/*` target `main`)
- Use Conventional Commit branch prefixes: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`, `perf/`, `test/`
- Never push directly to protected branches (`main` or `develop`)
- PR auto-retarget workflow will redirect main-targeted PRs to develop

## Commit Message Format

Follow Conventional Commits strictly:

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
Example: feat(ui): add dark mode toggle
```

## Code Style Requirements

- **Line width:** 100 characters maximum
- **TypeScript:** Strict mode, avoid `any` types
- **AI attribution:** All new files must include header comment with model and date
  - Code: `// AI Generated: GitHub Copilot (GPT-5.2-Codex) - YYYY-MM-DD`
  - Markdown: `<!-- AI Generated: GitHub Copilot (GPT-5.2-Codex) - YYYY-MM-DD -->`
- **Formatting:** Run `npm run format` before commits
- **Linting:** Run `npm run lint` to catch issues early

## Project-Specific Patterns

- Backend handlers use `jsonResponse`, `corsHeaders`, `debugLog` from `functions/_lib/common.js`
- Always validate request payloads (≤1KB limit, explicit field checks)
- Use cache helpers from `functions/letterboxd/cache/index.ts` for D1 operations
- Frontend uses canonical stylesheet `src/index.css` (not `src/App.css`)

## Full Documentation

For complete guidelines, patterns, and templates, see `.github/copilot-instructions.md`.
