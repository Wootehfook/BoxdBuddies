## Status update — 2025-08-12

- AI Generated: GitHub Copilot - 2025-08-12
- Lint/type-check/tests: PASS (`npm run health:check`), with MCP status made non-fatal when VS Code CLI is missing.
- Rust: `cargo check` PASS, `cargo clippy` PASS (removed an unused import post plugin wiring).
- Runtime: `tauri dev` launches successfully on Tauri v2; local smoke looks good.
- Next: validate packaging on CI (WiX), and do a short UI pass for any v2 behavior deltas.

<!-- AI Generated: GitHub Copilot - 2025-08-12 -->

# Tauri v2 Migration Plan (Umbrella PR)

This document tracks the end-to-end migration from Tauri v1.x to v2.x. The work
will be implemented on a dedicated feature branch and merged via a single
umbrella PR after green quality gates.

Status: Planned → In Progress → Done

Scope

- Upgrade Rust deps: `tauri` to v2, `tauri-build` to v2
- Upgrade Node deps: `@tauri-apps/api` to v2, `@tauri-apps/cli` to v2
- Update config: `tauri.conf.json` schema and settings for v2
- Adjust Rust and TS code for breaking changes (APIs, commands, windowing)
- Keep existing features and UX identical; no behavior changes
- Preserve Cloudflare-only deploy policy for any web artifacts

Non-goals

- No UI redesign
- No new features unrelated to the migration

Backout plan

- If blocking issues arise, revert the branch or pin to last known-good v1
  BoxdBuddies will migrate from Tauri v1.x to v2.x via a single, well-tested PR.
  This document tracks the scope, steps, and validation gates. No PII will be
  logged during this work; logs will use counts/indices only.

## Scope

- Rust crates: `tauri` v1.x → v2.x, `tauri-build` v1.x → v2.x
- Frontend: `@tauri-apps/api` v1.x → v2.x, `@tauri-apps/cli` v1.x → v2.x
- Config: `tauri.conf.json` updates for v2 format and capabilities
- Code: Adjust any API/feature name changes and IPC command wiring
- CI: Keep quality gates green (clippy -D warnings, ESLint/TypeScript, CodeQL)
- Packaging: Validate Windows MSI (per-user), macOS DMG, Linux DEB/AppImage/RPM

## Strategy

1. Create branch: `feature/migrate-tauri-v2` (umbrella upgrade)
2. Update Cargo.toml to Tauri v2 + `tauri-build` v2 (pinned, no caret)
3. Update frontend deps to `@tauri-apps/api@2` and `@tauri-apps/cli@2`
4. Update `tauri.conf.json` to v2 schema and capabilities
5. Compile and iterate API changes in Rust + TS until clean build
6. Run full CI: clippy as errors, ESLint/TS, security scans, license check
7. Build installers/packages on all OS runners; run MSI smoke tests in CI
8. Submit PR; require green checks before merge

## Validation Gates

- Rust
  - `cargo check` (PASS)
  - `cargo clippy --all-targets --all-features -D warnings` (PASS)
- Frontend
  - `npm ci` (PASS)
  - `npm run type-check && npm run lint && npm run build` (PASS)
- Security & Compliance
  - CodeQL (JS/TS/Rust): PASS
  - `npm audit`, dependency review: PASS (no new highs)
  - License compliance: PASS
- Packaging
  - Windows: MSI per-user smoke test (silent install/uninstall): PASS
  - macOS: DMG build: PASS (notarization TBD)
  - Linux: DEB/AppImage/RPM build: PASS

## Deployment Policy

- Cloudflare-only for web. No GitHub Pages actions.
- Keep existing Cloudflare Wrangler workflows untouched in this migration.

## Notes

- AI attribution will be added to generated code blocks as comments.
- Line length: TS/React ≤ 100 chars, Rust ≤ 80 chars.
- Do not log usernames/emails/tokens. Use counts/indices.
