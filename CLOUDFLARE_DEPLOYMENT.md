# BoxdBuddy Cloudflare Deployment Guide

AI Generated: GitHub Copilot - 2025-08-16

## Prerequisites

1. Cloudflare account with Workers and Pages access
2. TMDB API key (free at https://www.themoviedb.org/settings/api)
3. Node.js and npm installed locally
4. Wrangler CLI installed: `npm install -g wrangler`

## Setup Steps

### 1. Create Cloudflare D1 Database

```bash
# Create the database
wrangler d1 create boxdbuddy-movies

# Note the database ID from the output and update wrangler.toml
# Replace "your-database-id" with the actual ID
```

### 2. Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create "MOVIES_KV"

# Note the namespace ID and update wrangler.toml
# Replace "your-kv-id" with the actual ID
```

### 3. Set Up Database Schema

```bash
# Run the migration
npm run cloudflare:db:migrate

# Verify tables were created
wrangler d1 execute MOVIES_DB --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 4. Configure Secrets

```bash
# Set TMDB API key (keep this private)
wrangler secret put TMDB_API_KEY

# Set admin secret for TMDB sync endpoint (generate a strong random string)
wrangler secret put ADMIN_SECRET
```

### 5. Initial TMDB Data Population

```bash
# Deploy first to make admin endpoint available
npm run cloudflare:deploy

# Then call the admin sync endpoint (replace YOUR_ADMIN_SECRET)
curl -X POST https://boxdbuddy.pages.dev/api/admin/tmdb-sync \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_popular"}'
```

## Environment Variables

### Production (set via Cloudflare dashboard or wrangler)

- `TMDB_API_KEY`: Your TMDB API key (secret)
- `ADMIN_SECRET`: Admin endpoint authentication (secret)

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run cloudflare:dev

# In another terminal, test the API
curl http://localhost:8788/api/letterboxd?username=testuser&action=friends
```

### Testing

```bash
# Run all tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Deployment

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in Cloudflare dashboard

### Manual Deployment

```bash
# Build and deploy
npm run cloudflare:deploy
```

## API Endpoints

### Public Endpoints

- `GET /api/search?q=movie+name&page=1` - Search movies in TMDB database
- `GET /api/letterboxd?username=USER&action=watchlist` - Get user's watchlist
- `GET /api/letterboxd?username=USER&action=friends` - Get user's friends
- `POST /api/compare` - Compare watchlists (body: `{"usernames": ["user1", "user2"]}`)

### Admin Endpoints (Require Authorization)

- `POST /api/admin/tmdb-sync` - Sync TMDB data
  - Actions: `sync_popular`, `sync_movie`, `sync_delta`

## Scheduled Jobs

The application includes a daily cron job at 3 AM UTC for TMDB delta updates:

- Automatically syncs changed movies from TMDB
- Limits to 100 movies per run to avoid timeouts
- Updates sync metadata for tracking

## Caching Strategy

### Multi-Layer Caching

1. **Edge Cache**: Cloudflare edge caching (5 minutes for search, 1 hour for static data)
2. **KV Storage**: Durable cache for API responses (24 hours)
3. **D1 Database**: Local cache for Letterboxd data (24 hours for watchlists, 7 days for friends)
4. **LocalStorage**: Client-side cache with version management

### Cache Invalidation

- Watchlists: Invalidated when count changes
- Friends: Manual refresh or 7-day expiry
- Movie data: Daily updates via cron job
- Search results: 5-minute edge cache

## Monitoring

### Health Checks

```bash
# Check database
wrangler d1 execute MOVIES_DB --command="SELECT COUNT(*) FROM tmdb_movies;"

# Check last sync
wrangler d1 execute MOVIES_DB --command="SELECT * FROM sync_metadata;"

# View logs
wrangler tail
```

### Performance

- Edge response times: < 100ms
- Database queries: < 50ms
- Full watchlist comparison: < 5 seconds
- TMDB sync: ~10 minutes for 1000 movies

## Security Features

- No TMDB API key exposed to clients
- Admin endpoints protected with bearer tokens
- Rate limiting on external API calls
- Input sanitization for all user data
- No PII stored in logs

## Troubleshooting

### Common Issues

1. **Database not found**: Check `wrangler.toml` database ID
2. **TMDB sync fails**: Verify API key is set correctly
3. **Letterboxd scraping fails**: Check rate limiting and user-agent
4. **Cache issues**: Clear KV namespace or LocalStorage

### Debug Commands

```bash
# Check wrangler configuration
wrangler whoami

# Test database connection
wrangler d1 execute MOVIES_DB --command="SELECT 1;"

# View environment variables
wrangler secret list
```

## Performance Optimization

- Use KV for frequently accessed data
- Implement smart cache invalidation
- Optimize database queries with indexes
- Use edge caching for static responses
- Batch TMDB API calls to avoid rate limits

## Backup and Recovery

- D1 database is automatically backed up by Cloudflare
- KV data is replicated across edge locations
- Export important data regularly via API
- Keep migration scripts in version control
