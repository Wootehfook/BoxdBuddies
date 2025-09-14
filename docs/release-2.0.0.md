# Boxdbud.io — Release 2.0.0

Release date: 2025-09-13

Highlights

- Major version bump to 2.0.0: this release represents a platform transition from the original v1.0
  Desktop application to a v2.0 Web-first experience (Boxdbud.io web app).
- UI refresh and accessibility improvements across the frontend.
- Attribution modal: added GitHub links for reporting bugs and requesting features.
- Cleaned repository of generated artifacts and accidental secrets committed to repo.
- Internal: performance and test improvements; consistent TMDB poster handling.

Upgrade notes

- Platform migration: v1.0 was a Desktop application. This release (v2.0) is a web application oriented
  around Cloudflare Pages + Functions and a D1 (SQLite) cache. If you are upgrading from the desktop
  version, note the following:
  - User data: there is no automatic migration of local desktop data — export any local config or data
    before switching to web hosting.
  - Secrets: server secrets (TMDB API key, ADMIN_SECRET) must be set in your hosting environment; do
    not store them in the repository.
  - Hosting: to run the server components you will need Wrangler and a Cloudflare Pages project with a
    D1 instance; see `wrangler.toml` and `migrations/` for DB setup.

- No breaking browser API changes for frontend-only users.

Links

- Source: [https://github.com/Wootehfook/BoxdBuddies](https://github.com/Wootehfook/BoxdBuddies)
- Issues: [https://github.com/Wootehfook/BoxdBuddies/issues](https://github.com/Wootehfook/BoxdBuddies/issues)

Changelog

- See `CHANGELOG.md` for historical entries (if present). If not present, add historical notes here.
