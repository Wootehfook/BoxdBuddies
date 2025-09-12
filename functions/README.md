# Functions / server notes

This folder contains Cloudflare Pages Functions used by BoxdBuddy for scraping, TMDB enrichment, and server-side APIs.

Server data contract: poster_path

- `poster_path` returned by server endpoints is a TMDB _relative path_ (for example: `/kqjL17yufvn9OVLyXYpvtyrFfak.jpg`) or `null` if absent.
- Clients (frontends) should prefix the TMDB image base and desired size when building image URLs, for example:
  - small/lists: `https://image.tmdb.org/t/p/w300${poster_path}`
  - detail/large: `https://image.tmdb.org/t/p/w500${poster_path}`

Rationale: returning a relative path keeps payloads smaller and lets clients choose an appropriate image size.

If you change this contract, update `functions/_lib/common.js` and document the updated shape here.
