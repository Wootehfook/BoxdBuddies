<!-- AI Generated: GitHub Copilot - 2025-09-13 -->

# Attribution Page Update — AI Execution Guide

This document is a step-by-step playbook for an AI agent to safely update the attribution UI and related content for Boxdbud.io while honoring our licensing model and data source requirements.

## 1) Licensing and Policy Context (must read)

- Project license: AGPL-3.0 with additional terms (non-commercial). See `LICENSE`.
- Data sources and contracts:
  - Letterboxd: scraping public pages. Must be respectful, throttle, and comply with their ToS.
  - TMDB: use via API; show proper attribution statement. We return `poster_path` relative URLs server-side.
- UI attribution requirements:
  - Must include: Letterboxd source mention, TMDB mention, and TMDB non-endorsement disclaimer.
  - Must be a modal (`<dialog>`) with `aria-labelledby`, `aria-modal`, and keyboard/backdrop dismissal.

## 2) Where to change UI

- Attribution modal lives in `src/App.tsx` under the `<footer className="attribution">` section.
- Tests: `src/__tests__/attribution-modal.test.tsx` covers open/close and a11y basics.

## 3) What to add (links & calls-to-action)

Add the following external links inside the modal body:

- Repository: `https://github.com/Wootehfook/BoxdBuddies`
- Report a bug: `https://github.com/Wootehfook/BoxdBuddies/issues/new?labels=bug`
- Request a feature: `https://github.com/Wootehfook/BoxdBuddies/issues/new?labels=enhancement`

All external links must include `target="_blank"` and `rel="noopener noreferrer"` and an `aria-label` describing action.

## 4) Implementation checklist

1. Update `src/App.tsx` modal body: add a “Contribute & Support” section with the three links above.
2. Keep headings semantic (H3 for modal title); subsections can use H4.
3. Ensure backdrop button and close button still dismiss modal.
4. Keep the dialog ref and focus management intact.
5. Do not remove existing attributions or disclaimers.

## 5) Repo tidiness checklist (must enforce)

- Delete committed secrets and generated artifacts:
  - Remove any accidental `.env` files (ensure `.gitignore` ignores them). Never commit secrets.
  - Remove `stylelint-report.json` if present.
  - Ensure `scripts/logs/` keeps `.gitignore` and excludes `*.log` files from git.
- Confirm `dist/` is ignored in `.gitignore`; do not commit build outputs.

## 6) Tests and quality gates

Run the following and ensure all pass:

```pwsh
npm run type-check
npm run lint
npm test
```

If you changed only UI text/links in the modal, unit tests should remain green. If you alter modal structure, update `src/__tests__/attribution-modal.test.tsx` accordingly while preserving a11y.

## 7) Accessibility notes

- Modal must have `aria-labelledby="attribution-title"` and focus management when opened.
- Close via backdrop button and explicit "Close" button.
- Link text should be descriptive; supplement with `aria-label` where necessary.

## 8) Success criteria

- Modal shows Letterboxd, TMDB, disclaimer, and new GitHub links.
- No secrets or generated artifacts committed.
- All quality gates green (type-check, lint, tests).

## 9) PR guidance

- Branch name pattern: `chore/attribution-cleanup-and-links` (or similar).
- PR title: "Chore: attribution cleanup + GitHub links".
- Include screenshot of modal and a short test output snippet.
