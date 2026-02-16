<!-- AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-15 -->

# Post-Merge Instructions for Gitflow Branching Setup

## Overview

This document outlines the manual steps required after this pull request merges to complete the Gitflow branching infrastructure setup.

## Required Manual Steps

### 1. Create the `develop` Branch

After this PR is merged to `main`, create the `develop` branch:

```bash
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

### 2. Change the Default Branch to `develop`

1. Go to: https://github.com/Wootehfook/BoxdBuddies/settings
2. Click on "Branches" in the left sidebar
3. Under "Default branch", click the switch/edit icon next to `main`
4. Select `develop` from the dropdown
5. Click "Update"
6. Confirm the change

**Why?** This ensures that:

- New PRs default to targeting `develop` instead of `main`
- GitHub Copilot and AI coding agents automatically use `develop` as the base
- Contributors naturally follow the Gitflow workflow

### 3. Import the Updated Feature Branch Ruleset

The feature branch ruleset has been updated to include all Conventional Commit branch prefixes. You'll need to re-import it:

1. Go to: https://github.com/Wootehfook/BoxdBuddies/settings/rules
2. Find the existing "Development Flexibility (Feature Branches)" ruleset
3. Delete or disable the old one
4. Click "New ruleset" → "Import a ruleset"
5. Upload `github-rulesets/feature-branch-ruleset.json`
6. Review and activate

The new ruleset now covers: `feature/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`, `perf/*`, `test/*`, `copilot/*`, `changelog/*`

### 4. (Optional) Install Local Git Hooks

Individual developers can optionally install pre-push hooks to prevent accidental direct pushes to protected branches:

```bash
bash scripts/setup-git-hooks.sh
```

This installs a pre-push hook that blocks pushes to `main` or `develop` and reminds developers to use feature branches.

## What This PR Provides

### Automated Infrastructure

✅ **PR Auto-retarget Workflow** - Automatically redirects PRs from `main` to `develop`
✅ **Updated Branch Rulesets** - Expanded to cover all Conventional Commit branch types
✅ **VSCode Configuration** - Git settings, extensions, and editor config
✅ **CODEOWNERS** - GitHub Copilot AI Code Review assigned as default reviewer
✅ **Updated Documentation** - Copilot instructions, chatmode, and README with workflow guidance
✅ **Dependabot Configuration** - All dependency PRs target `develop`

### Developer Experience Enhancements

- **.vscode/settings.json** - Git autofetch, formatting, TypeScript settings
- **.vscode/extensions.json** - Recommended extensions (Copilot, Prettier, ESLint, GitLens, Git Graph)
- **.github/chatmodes/Custom.chatmode.md** - Development-focused Copilot chat mode
- **scripts/setup-git-hooks.sh** - Optional local hook installer

## Workflow Summary

After completing the manual steps above, the branching workflow will function as follows:

```
feature/*, fix/*, chore/*, etc.  ──PR──▶  develop  ──PR──▶  main
                                              │
                                    release/* / hotfix/*  ──PR──▶  main
```

- **Day-to-day development** → targets `develop`
- **Release branches** → target `main`
- **Hotfix branches** → target `main`
- **PR auto-retarget** → catches and redirects any main-targeted PRs to develop

## Verification Steps

After completing the manual steps:

1. ✅ Verify `develop` is the default branch in GitHub settings
2. ✅ Create a test feature branch and confirm it defaults to targeting `develop`
3. ✅ Verify the updated feature branch ruleset is active
4. ✅ Check that Dependabot PRs target `develop`

## Questions or Issues?

If you encounter any problems during setup, please:

1. Check the workflow documentation in `.github/copilot-instructions.md` section 9b
2. Review the README.md "Git Workflow" section
3. Open an issue with the `workflow` label

---

**Note:** This PR targets `main` because `develop` doesn't exist yet. All future PRs (except releases and hotfixes) should target `develop`.
