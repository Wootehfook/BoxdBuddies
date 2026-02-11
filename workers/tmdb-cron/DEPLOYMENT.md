# Deployment Guide for BoxdBuddy TMDB Cron Worker

<!-- AI Generated: GitHub Copilot - 2026-02-11 -->

This guide walks through deploying the TMDB sync worker to Cloudflare.

## Prerequisites

- Cloudflare account with Workers enabled
- `wrangler` CLI installed (included in repo devDependencies)
- TMDB API key
- Admin secret token (for manual triggers)

## Step 1: Install Dependencies

From the worker directory:

```bash
cd workers/tmdb-cron
npm install
```

## Step 2: Configure Secrets

The worker needs two secrets configured in Cloudflare:

```bash
# Set TMDB API key
wrangler secret put TMDB_API_KEY

# Set admin secret for manual trigger authentication
wrangler secret put ADMIN_SECRET
```

When prompted, paste the secret values.

## Step 3: Verify Configuration

Check the `wrangler.toml` file to ensure the D1 database binding is correct:

```toml
[[d1_databases]]
binding = "MOVIES_DB"
database_name = "boxdbuddy-movies"
database_id = "466c5909-8a9a-418c-927b-2d36c118e270"
```

This should match the D1 database used by the main Pages application.

## Step 4: Deploy the Worker

```bash
npm run deploy
```

Or using wrangler directly:

```bash
wrangler deploy
```

Expected output:

```
Total Upload: ~32 KiB / gzip: ~8 KiB
Your Worker has access to the following bindings:
Binding                               Resource
env.MOVIES_DB (boxdbuddy-movies)      D1 Database

Deployed boxdbuddy-tmdb-cron triggers (production)
  https://boxdbuddy-tmdb-cron.<account>.workers.dev
  Schedule: 0 4 * * * (daily at 04:00 UTC)
```

## Step 5: Verify Deployment

### Check Status Endpoint

```bash
curl https://boxdbuddy-tmdb-cron.<account>.workers.dev/status
```

Expected response:

```json
{
  "total_movies": 1234567,
  "highest_movie_id_synced": 987654,
  "last_delta_sync": "2026-02-11"
}
```

### Trigger Manual Sync (Optional)

To test the sync immediately:

```bash
curl -X POST https://boxdbuddy-tmdb-cron.<account>.workers.dev/run \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

## Step 6: Monitor Logs

Watch real-time logs:

```bash
npm run tail
```

Or:

```bash
wrangler tail boxdbuddy-tmdb-cron
```

You should see log entries like:

```
🔄 Starting delta sync for changes since 2026-02-10...
📋 Found 42 changed movies
✅ Delta sync: 42 synced, 1 skipped, 0 errors in 5432ms
🔄 Starting incremental sync from movie ID 987654...
✅ Incremental sync: 80 synced, 5 skipped, 0 errors in 12345ms
```

## Scheduled Execution

The worker will automatically run daily at 04:00 UTC. You can verify the
schedule in the Cloudflare dashboard under Workers > boxdbuddy-tmdb-cron >
Triggers.

## Troubleshooting

### "TMDB API error: 401 Unauthorized"

The `TMDB_API_KEY` secret is not set or is invalid. Re-run:

```bash
wrangler secret put TMDB_API_KEY
```

### "Unauthorized" on POST /run

The `Authorization` header is missing or incorrect. Ensure you're using:

```
Authorization: Bearer YOUR_ADMIN_SECRET
```

### Worker exceeds time limit

If the worker consistently times out, reduce the `maxMovies` parameter in
the incremental sync (currently 80) by editing `src/index.ts` line 420.

### No movies being synced

Check that the D1 database has the required tables (`tmdb_movies`,
`sync_metadata`). Run the migrations if needed:

```bash
cd ../.. # back to repo root
npm run cloudflare:db:migrate
```

## Rollback

To rollback to a previous version:

```bash
wrangler rollback --message "Rolling back to previous version"
```

## Updating the Worker

After making code changes:

1. Test locally: `npm run dev`
2. Type check: `npm run type-check`
3. Deploy: `npm run deploy`

## Monitoring in Production

Key metrics to watch in Cloudflare dashboard:

- **Invocations**: Should be ~1 per day (scheduled runs)
- **Errors**: Should be 0 under normal operation
- **Duration**: Should be under 25 seconds per invocation
- **CPU Time**: Should be well under 30 seconds

## Maintenance

The worker is designed to run autonomously. No maintenance required unless:

- TMDB API changes
- Database schema changes
- Need to adjust sync parameters (rate limits, time budgets)

For questions or issues, see the main repository README.
