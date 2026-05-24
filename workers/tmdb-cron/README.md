<!-- AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-22 -->

# BoxdBuddy TMDB Cron Sync Worker

Cloudflare Worker that performs automated TMDB database synchronization on a
four-times-daily schedule.

## Overview

This worker replaced the manual PowerShell scripts with a fully automated,
server-side solution that requires no local credentials or tooling.

## Architecture

The worker runs two complementary sync strategies:

1. **Delta Sync** - Re-syncs movies that have been modified on TMDB since
   the last sync, capturing metadata updates.

2. **Incremental ID Sync** - Walks forward from the highest synced movie ID
   to discover newly added movies.

## Schedule

The worker runs four times daily at **00:00 UTC**, **06:00 UTC**, **12:00 UTC**,
and **18:00 UTC** via Cloudflare cron triggers.

## Endpoints

### GET /status

Returns current sync statistics without authentication.

**Response:**

```json
{
  "total_movies": 1234567,
  "highest_movie_id_synced": 987654,
  "last_delta_sync": "2026-02-20"
}
```

### POST /run

Manually triggers both sync passes. Requires authentication.

**Headers:**

- `Authorization: Bearer <ADMIN_SECRET>`

**Response:**

```json
{
  "delta": {
    "success": true,
    "synced": 42,
    "errors": 0,
    "skipped": 1,
    "message": "Delta sync: 42 synced, 1 skipped, 0 errors in 5432ms"
  },
  "incremental": {
    "success": true,
    "synced": 80,
    "errors": 0,
    "skipped": 5,
    "message": "Incremental sync: 80 synced, 5 skipped, 0 errors in 12345ms"
  }
}
```

## Configuration

The worker requires these environment variables (set via Wrangler secrets):

- `TMDB_API_KEY` - Your TMDB API key
- `ADMIN_SECRET` - Secret token required for manual `/run` trigger authentication (scheduled cron runs do not require it)
- `DEBUG` - Enable debug logging (optional)

The worker shares the same D1 database binding (`MOVIES_DB`) as the main
Pages application.

## Deployment

### Install Dependencies

```bash
cd workers/tmdb-cron
npm install
```

### Set Secrets

```bash
wrangler secret put TMDB_API_KEY
wrangler secret put ADMIN_SECRET
```

### Deploy

```bash
npm run deploy
```

Or from the root:

```bash
cd workers/tmdb-cron && wrangler deploy
```

## Local Development

```bash
npm run dev
```

Then trigger manually:

```bash
curl -X POST http://localhost:8787/run \
  -H "Authorization: Bearer your-secret"
```

## Monitoring

View live logs:

```bash
npm run tail
```

Or:

```bash
wrangler tail boxdbuddy-tmdb-cron
```

## Design Rationale

- **Rate Limiting**: 35 requests per 10 seconds (TMDB allows 40, we leave
  buffer)
- **Time Budget**: 25 seconds per sync pass (Cloudflare Worker limit is 30s)
- **Cloudflare Request Limits**: No explicit Cloudflare subrequest-budget
  tracking is currently implemented; the worker instead relies on TMDB rate
  limiting and conservative execution/time budgeting to avoid overruns
- **Error Handling**: 404 errors (missing movies) skip gracefully; 429 errors
  (rate limits) retry after a fixed 2-second delay; other errors logged with
  context
- **Incremental Sync Tracking**: Uses `sync_metadata` watermarks (for example,
  `highest_movie_id_synced`) to continue from the latest known movie ID
- **Adult Content**: Automatically skipped to keep catalog family-friendly
- **Persistence**: Sync watermarks are stored in `sync_metadata`

## License

AGPL-3.0-or-later
