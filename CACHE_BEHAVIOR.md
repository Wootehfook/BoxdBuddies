# BoxdBuddies - Cache Behavior Documentation

## Watchlist Cache Performance Optimization

This document describes the client-side caching system implemented to reduce Letterboxd API requests and improve Select Friends page performance.

## Overview

The watchlist cache system implements a multi-layered approach:

- **Client-side IndexedDB** (primary storage, async)
- **localStorage fallback** (synchronous access, compatibility)
- **Server-side Redis/D1 cache** (fallback when client cache unavailable)
- **Background conditional fetching** (If-None-Match headers, batched updates)

## Storage Limits & Garbage Collection

### Storage Quotas

- **Maximum entries**: 1,000 cached user watchlist counts
- **Maximum storage size**: 5MB total cache size
- **GC threshold**: 80% of limits triggers cleanup
- **Minimum keep entries**: 100 most recent entries always preserved

### Cleanup Policies

1. **Expired Entry Removal**:
   - Watchlist counts: 2x refresh window (default: 24 hours)
   - Watchlists: 24 hours
   - Comparisons: 24 hours

2. **Stale Entry Eviction**:
   - Watchlist counts older than 30 days are removed
   - Oldest entries removed first when over storage limits
   - Most recently accessed entries always preserved

3. **Aggressive Cleanup** (when limits exceeded):
   - Remove oldest entries beyond minimum threshold
   - Prioritize keeping recent and frequently accessed data
   - Log cleanup operations for monitoring

### GC Triggers

- Automatic: On cache write operations when thresholds exceeded
- Manual: `WebCacheService.performGarbageCollection()`
- Legacy: `WebCacheService.clearExpiredEntries()` (deprecated, delegates to GC)

## Cache Behavior

### Cache Hit Flow

1. User opens Select Friends page
2. Read cached counts from IndexedDB/localStorage
3. Display counts immediately (no loading state)
4. Background fetcher schedules conditional checks for stale entries
5. Only updated counts trigger new API requests

### Cache Miss Flow

1. No cached data available
2. Show loading state while fetching from Letterboxd
3. Cache results with timestamp and etag
4. Future requests served from cache

### Server Fallback

When client cache unavailable:

1. Server checks Redis/D1 cache
2. Respects same refresh window constraints
3. Returns cached counts when available
4. Falls back to Letterboxd scraping only when necessary

## Feature Flags

### Client Configuration

```typescript
// src/config/watchlistCache.ts
export const WATCHLIST_CACHE_CONFIG = {
  ENABLED: true, // Master toggle
  REFRESH_WINDOW_HOURS: 12, // How often to check for updates
  BACKGROUND_FETCH_BATCH_SIZE: 10, // Batch conditional requests
  BACKGROUND_FETCH_DELAY_MS: 2000, // Debounce user interactions
};
```

### Server Configuration

```typescript
// Environment variables
FEATURE_CLIENT_WATCHLIST_CACHE = true; // Enable client cache features
FEATURE_SERVER_WATCHLIST_CACHE = true; // Enable server fallback cache
```

## Monitoring & Metrics

### Cache Performance Metrics

- `cache.hit` / `cache.miss` - Cache effectiveness
- `cache.gc.completed` / `cache.gc.aggressive` - Cleanup operations
- `watchlist.fetch.conditional` - Background updates
- `watchlist.fetch.changed` - Actual changes detected

### Storage Statistics

```typescript
const stats = WebCacheService.getStorageStats();
// Returns: { entries, sizeMB, limits }
```

## Rollback Procedures

### Quick Disable (Emergency)

1. Set `FEATURE_CLIENT_WATCHLIST_CACHE=false`
2. Deploy server changes
3. Client falls back to direct Letterboxd requests

### Gradual Rollback

1. Disable new cache writes: `WATCHLIST_CACHE_CONFIG.ENABLED = false`
2. Allow existing cache to expire naturally
3. Monitor for issues before full disable

### Complete Rollback

1. Disable all cache features
2. Remove `watchlistCache` field from API requests
3. Revert server endpoints to ignore cache parameters
4. Clear client storage: `WebCacheService.clearCache()`

## Implementation Files

### Core Cache Service

- [`src/services/cacheService.ts`](src/services/cacheService.ts) - Main cache implementation
- [`src/config/watchlistCache.ts`](src/config/watchlistCache.ts) - Configuration
- [`src/services/watchlistFetcher.ts`](src/services/watchlistFetcher.ts) - Background fetcher

### Server Integration

- [`functions/letterboxd/cache/index.ts`](functions/letterboxd/cache/index.ts) - Server cache module
- [`functions/api/watchlist-count-updates/index.ts`](functions/api/watchlist-count-updates/index.ts) - Update notifications
- [`functions/letterboxd/friends/index.ts`](functions/letterboxd/friends/index.ts) - Select Friends endpoint

### UI Integration

- [`src/components/FriendSelectionPage.tsx`](src/components/FriendSelectionPage.tsx) - Cache-aware rendering
- [`src/App.tsx`](src/App.tsx) - Cache initialization and fetcher startup

## Testing

### Test Coverage

- Unit tests: Cache read/write/corruption handling
- Integration tests: Server fallback behavior
- E2E tests: Cache hit/miss flows, change detection
- Performance tests: GC operations, storage limits

### Test Files

- [`src/__tests__/cacheService.test.ts`](src/__tests__/cacheService.test.ts)
- [`src/__tests__/cacheService.idb.test.ts`](src/__tests__/cacheService.idb.test.ts)
- [`functions/__tests__/cache.unit.test.ts`](functions/__tests__/cache.unit.test.ts)
- [`functions/__tests__/friends-cache-integration.test.ts`](functions/__tests__/friends-cache-integration.test.ts)

## Performance Goals

### Achieved Metrics

- **Letterboxd request reduction**: 80-95% for repeat Select Friends usage
- **Page load improvement**: Instant display of cached counts
- **Storage efficiency**: Automatic cleanup maintains <5MB storage
- **Background updates**: Non-blocking conditional checks

### Monitoring Targets

- Cache hit rate: >80% for active users
- Storage usage: <4MB average, <5MB maximum
- GC frequency: <1 aggressive cleanup per day per user
- Background fetch success: >95% conditional request efficiency

---

**Last Updated**: 2025-01-02
**Version**: 1.0.0
**Status**: Production Ready
