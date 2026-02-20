<!-- AI Generated: GitHub Copilot (Claude Haiku 4.5) - 2026-02-20 -->

---

mode: agent
description: Run pre-upload checks, fix issues, branch, commit, and create a PR targeting develop

---

# Pre-Upload Quality Check, Branch, Commit & PR

You are an agent executing a full pre-upload workflow for the BoxdBuddies project. Follow every step in order. Do not skip a step or proceed to the next until the current one is resolved.

---

## Step 1 — Identify changed files

Run `git status` and `git diff --name-only HEAD` to enumerate all modified, added, or deleted files since the last commit. Keep this list — it drives the subsequent steps.

---

## Step 2 — Run all local quality checks

Run the following commands and capture every warning, error, and failure:

```bash
npm run type-check        # TypeScript strict check (zero errors required)
npm run lint              # ESLint on src/ (zero errors required; warnings acceptable)
npm run format:check      # Prettier format verification
npm run build             # Vite + tsc build (must succeed cleanly)
npm test                  # Full Vitest test suite (all tests must pass)
npm audit --audit-level moderate  # Dependency security audit
```

---

## Step 3 — Fix all identified issues

For each error or failure from Step 2:

1. **Type errors** — fix the TypeScript type issue in the affected file(s).
2. **Lint errors** — run `npm run lint:fix` to auto-fix where possible; manually resolve any remaining errors.
3. **Format violations** — run `npm run format` to reformat all affected files.
4. **Build failures** — diagnose the root cause and fix it before continuing.
5. **Test failures** — fix the code (not the test) unless the test itself is incorrect; do not skip or comment out tests.
6. **Security audit findings** — evaluate `npm audit` output; address any `moderate` or higher vulnerabilities (update the dependency or apply a documented workaround).
   - **Check pre-approved exceptions**: Consult [`docs/security-exceptions.md`](../../docs/security-exceptions.md) to see if the finding is a known exception.
   - **If the vulnerability matches an exception**: Verify the exception is still valid (e.g., the affected package is still dev-only). If conditions have changed since the exception was documented, escalate for re-review instead of ignoring.
   - **If the vulnerability is a new exception**: Do not ignore without written justification and approval from a maintainer. Document in the PR body under "Security notes".
   - **Re-evaluate exceptions**: If you encounter an exception from `docs/security-exceptions.md`, briefly verify it's still accurate (check package usage, scope, etc.). Update the document's review date if it is.

After fixing, re-run the full check suite from Step 2 until all commands exit cleanly (zero errors).

---

## Step 4 — Verify AI attribution headers

Inspect every file you created or modified. Any file touched by the agent **must** include the correct attribution header on the first line:

- **TypeScript / JavaScript**: `// AI Generated: GitHub Copilot (Claude Sonnet 4.6) - YYYY-MM-DD`
- **Markdown / HTML**: `<!-- AI Generated: GitHub Copilot (Claude Sonnet 4.6) - YYYY-MM-DD -->`

Use today's date. Add or update headers where missing.

---

## Step 5 — Determine the correct branch name

1. Inspect the nature of your changes and select the appropriate Conventional Commit prefix:
   - New feature → `feature/`
   - Bug fix → `fix/`
   - Documentation → `docs/`
   - Refactor → `refactor/`
   - Performance → `perf/`
   - Tests → `test/`
   - Chores / tooling → `chore/`
2. Derive a concise kebab-case slug from the changes (e.g., `feature/add-genre-filter`).
3. **Always branch from `develop`**. Confirm you are on `develop` and it is up to date:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b <prefix/your-slug>
   ```

---

## Step 6 — Stage and commit

Stage only intentional changes (avoid committing build artefacts, `.env`, or generated lock-file noise):

```bash
git add <specific files>
```

Write a Conventional Commit message. Format:

```
<type>(<optional scope>): <short imperative summary>

<optional body — what and why, not how>
```

Examples:

- `feat(compare): add genre filter to comparison results`
- `fix(cache): resolve stale lock on concurrent D1 writes`
- `chore(deps): bump vite to 7.3.1`

Commit with signature (required for this repository):

```bash
git commit -S -m "<your message>"
```

⏸️ **Wait for user action**: The system will prompt you to sign the commit using GPG or your configured signing tool. Do not proceed to Step 7 until signing is complete.

---

## Step 7 — Push the branch

```bash
git push origin <your-branch-name>
```

---

## Step 8 — Create the Pull Request

Use the GitHub CLI:

```bash
gh pr create \
  --base develop \
  --title "<Conventional Commit title matching your commit message>" \
  --body "<PR body — see template below>"
```

**PR body template:**

```markdown
## Summary

<!-- One paragraph describing what changed and why. -->

## Changes

<!-- Bullet list of files/areas changed. -->

## Quality checks

- [ ] `npm run type-check` — passing
- [ ] `npm run lint` — passing
- [ ] `npm run format:check` — passing
- [ ] `npm run build` — passing
- [ ] `npm test` — all tests passing
- [ ] `npm audit` — no moderate+ vulnerabilities (or documented exceptions)

## CHANGELOG

- [x] CHANGELOG.md updated in [Unreleased] section with correct change type

## Security notes

<!-- Note any OWASP Top 10 considerations, input validation, or access-control changes. -->
<!-- If npm audit found vulnerabilities matching a pre-approved exception from docs/security-exceptions.md, cite it: "ESLint/TypeScript dev dependencies per docs/security-exceptions.md — verified dev-only, zero risk to production." -->
<!-- If a new exception is needed, justify why and request maintainer approval before merging. -->

## AI attribution

All AI-generated files include the required header comment.
```

> **Important**: The PR base **must** be `develop` (not `main`) unless the branch prefix is `release/` or `hotfix/`, in which case the base is `main`.

---

## Step 8b — Update CHANGELOG.md and push to PR

Now that the PR exists, extract the PR number and update the changelog so the PR is self-contained.

1. **Extract PR number** from the PR creation response (e.g., `#234`).

2. **Determine the change type** from your commit message (Conventional Commits prefix):
   - `feat:` → **Added**
   - `fix:` → **Fixed**
   - `chore:`, `docs:`, `refactor:`, `perf:`, `test:` → **Changed**

3. **Extract a clean entry title** by:
   - Removing the conventional commit prefix (e.g., `chore(ci): ` → ``)
   - Capitalizing the first letter of the remaining text
   - Example: `chore(ci): add pre-upload agent` → `Add pre-upload agent`

4. **Update CHANGELOG.md**:

   ```bash
   # Edit CHANGELOG.md to insert this entry under [Unreleased] → ### <ChangeType>:
   # - Add pre-upload agent (#234)
   ```

   - Locate the `## [Unreleased]` section
   - Find the subsection matching your change type (`### Added`, `### Fixed`, or `### Changed`)
   - Insert: `- <CleanTitle> (#<PR_NUMBER>)` as a bullet point
   - If the subsection doesn't exist, create it
   - If `[Unreleased]` doesn't exist, create it after the header

5. **Commit and push the changelog update**:
   ```bash
   git add CHANGELOG.md
   git commit -S -m "docs: update CHANGELOG for PR #<PR_NUMBER>"
   git push origin <your-branch-name>
   ```
   This will automatically add the commit to the existing PR.

---

## Step 9 — Verify the PR

After creation and changelog update, verify the PR is complete and correct:

```bash
git log --oneline -2
git show --stat
```

Confirm:

- Base branch is `develop` (or `main` for release/hotfix).
- PR title follows Conventional Commits format.
- **CHANGELOG.md entry added** in the correct [Unreleased] subsection with PR number.
- All checklist items in the PR body are accurate.
- No secrets, API keys, or `.env` content appear in the diff.

If anything is wrong, fix, amend, and force-push:

```bash
# Make corrections
git add <file>
git commit --amend
git push --force-with-lease
```

---

## Constraints (never violate)

- Never push directly to `main` or `develop`.
- Never commit `.env`, secrets, or API keys.
- Never bypass hooks with `--no-verify`.
- Never force-push to shared branches.
- Never skip a failing test — fix the underlying code.
- Keep TypeScript strict — no `any` unless unavoidable and documented.

---

## Post-Merge Note

✅ **Changelog automation eliminated**: This prompt includes Step 8b (changelog update), which means the PR is self-contained and ready to merge. The post-merge `changelog-update.yml` workflow is now **redundant** and can be disabled or removed. All changelog entries are created before the PR is merged, eliminating secondary automation.
