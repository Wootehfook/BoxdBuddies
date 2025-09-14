# Boxdbud.io — Release 2.0.0

Release date: 2025-09-13

Highlights

- Major version bump to 2.0.0: UI refresh and accessibility improvements.
- Attribution modal: added GitHub links for reporting bugs and requesting features.
- Cleaned repository of generated artifacts and accidental secrets committed to repo.
- Internal: performance and test improvements; consistent TMDB poster handling.

Upgrade notes

- No breaking API changes in this release for users of the frontend-only package. If you run Cloudflare Functions or the D1-backed services, ensure your `env` secrets (TMDB key, ADMIN_SECRET) are stored in deployment secrets and not committed to repo.

Links

- Source: [https://github.com/Wootehfook/BoxdBuddies](https://github.com/Wootehfook/BoxdBuddies)
- Issues: [https://github.com/Wootehfook/BoxdBuddies/issues](https://github.com/Wootehfook/BoxdBuddies/issues)

Changelog

- See `CHANGELOG.md` for historical entries (if present). If not present, add historical notes here.
