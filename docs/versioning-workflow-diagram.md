# Versioning Workflows - Visual Overview

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BoxdBuddies Repository                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐           ┌──────────────────┐
    │   PR Merged to   │           │   Maintainer     │
    │   main/develop   │           │   Triggers       │
    └──────────────────┘           │   Release        │
              │                     └──────────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐
    │ changelog-update.yml     │    │ version-bump.yml         │
    │ (Automatic)              │    │ (Manual Dispatch)        │
    └─────────────────────────┘    └─────────────────────────┘
              │                               │
              │                               │
              ▼                               ▼
    1. Parse PR title           1. Extract unreleased changes
    2. Determine type           2. Bump package.json version
       (feat/fix/chore)         3. Move changes to new section
    3. Add to Unreleased        4. Create git tag
    4. Commit & push            5. Push changes & tag
    5. Comment on PR            6. Create GitHub Release
              │                               │
              │                               │
              ▼                               ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐
    │  CHANGELOG.md Updated    │    │  Release Published       │
    │  (Unreleased section)    │    │  + Version Tagged        │
    └─────────────────────────┘    └─────────────────────────┘
```

## File Relationships

```
BoxdBuddies/
├── CHANGELOG.md ◄───────────────┐
│                                 │
├── package.json ◄───────┐       │
│   └── version: "2.1.0" │       │
│                         │       │
├── .github/workflows/    │       │
│   ├── changelog-update.yml ────┤
│   │   (updates on PR merge)    │
│   │                             │
│   └── version-bump.yml ─────────┤
│       (releases)          │     │
│                           │     │
├── docs/                   │     │
│   └── versioning-and-releases.md
│       (documentation)     │
│                           │
└── scripts/                │
    └── test-versioning-workflows.sh
        (validation tests)
```

## Conventional Commit Flow

```
┌──────────────────┐
│   PR Title       │
│                  │
│  Format:         │
│  type: message   │
└──────────────────┘
        │
        ├── "feat:" ────────► Added section
        │
        ├── "fix:" ─────────► Fixed section
        │
        └── "chore:" ───────► Changed section
            "docs:"
            "refactor:"
            etc.
```

## Version Bump Flow

```
Current: 2.1.0
     │
     ├── patch ───► 2.1.1 (bug fixes)
     │
     ├── minor ───► 2.2.0 (new features)
     │
     └── major ───► 3.0.0 (breaking changes)
```

## Example: Complete Release Cycle

```
Day 1-30: Development
  │
  ├── PR #123: "feat: add user auth" ──► Merged
  │   └── changelog-update.yml adds to Unreleased
  │
  ├── PR #124: "fix: login bug" ────────► Merged
  │   └── changelog-update.yml adds to Unreleased
  │
  └── PR #125: "chore: update deps" ────► Merged
      └── changelog-update.yml adds to Unreleased

Day 31: Release Day
  │
  └── Maintainer runs version-bump.yml
      │
      ├── Selects "minor" (2.1.0 → 2.2.0)
      │
      ├── Moves all Unreleased to [2.2.0] section
      │
      ├── Creates tag v2.2.0
      │
      └── Creates GitHub Release
          │
          └── Release notes contain all changes:
              - add user auth (#123)
              - login bug (#124)
              - update deps (#125)
```

## Key Benefits

1. **Automated Tracking**: Every PR automatically updates the changelog
2. **Consistent Format**: Follows Keep a Changelog and Semantic Versioning
3. **Easy Releases**: One-click release process via GitHub Actions
4. **Full History**: Complete audit trail of all changes
5. **Attribution**: Every change credited to PR and author
6. **Zero Manual Work**: No need to manually edit CHANGELOG or create releases

## Quick Reference

| Task          | Command/Action                        |
| ------------- | ------------------------------------- |
| Check version | `npm run version:current`             |
| Create PR     | Use conventional commit in title      |
| Release patch | Actions → Version Bump → patch        |
| Release minor | Actions → Version Bump → minor        |
| Release major | Actions → Version Bump → major        |
| View history  | Check CHANGELOG.md or GitHub Releases |
