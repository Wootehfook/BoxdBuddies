# BoxdBuddies - Watchlist Cache Feature Rollout Plan

## Overview

### Current Rollout Toggle Set

Manual QA flags enabled (client):

- WATCHLIST_CACHE_ENABLED=true
- CLIENT_CACHE_READS=true
- BACKGROUND_FETCHER=true
- SERVER_CACHE_FALLBACK=true
- CLIENT_CACHE_WRITES=false
- CACHE_UPDATE_NOTIFICATIONS=false

Server env prerequisites (Cloudflare):

- FEATURE_SERVER_WATCHLIST_CACHE=true
- ADMIN_SECRET set
- UPSTASH_REDIS_REST_URL set
- UPSTASH_REDIS_REST_TOKEN set

Manual QA gate and production promotion steps:

- Manual QA team validates functionality in preview environment.
- On QA approval, promote to production by enabling server-side flags.

## Overview

This document outlines the rollout strategy for the watchlist cache performance optimization feature, including feature flags, gradual deployment, monitoring, and rollback procedures.

## Feature Toggle System

### Client-Side Toggles

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  // Master cache toggle - disables all cache features
  WATCHLIST_CACHE_ENABLED: true,

  // Individual feature controls
  CLIENT_CACHE_READS: true, // Allow reading from IndexedDB/localStorage
  CLIENT_CACHE_WRITES: true, // Allow writing to client cache
  BACKGROUND_FETCHER: true, // Enable background conditional fetching
  SERVER_CACHE_FALLBACK: true, // Use server cache when client unavailable
  CACHE_UPDATE_NOTIFICATIONS: true, // Send update notifications to server
};

// src/config/watchlistCache.ts
export const WATCHLIST_CACHE_CONFIG = {
  ENABLED: true, // Local override toggle
  REFRESH_WINDOW_HOURS: 12, // Cache freshness window
  BACKGROUND_FETCH_BATCH_SIZE: 10, // Batch size for conditional requests
  BACKGROUND_FETCH_DELAY_MS: 2000, // Debounce delay

  // Storage limits
  MAX_ENTRIES: 1000,
  MAX_STORAGE_MB: 5,
  GC_THRESHOLD_PERCENT: 80,
  STALE_AGE_DAYS: 30,
  MIN_KEEP_ENTRIES: 100,
};
```

### Server-Side Toggles

```bash
# Environment variables for Cloudflare Functions
FEATURE_CLIENT_WATCHLIST_CACHE=true      # Accept cache payloads from clients
FEATURE_SERVER_WATCHLIST_CACHE=true      # Use server-side cache fallback
FEATURE_CACHE_UPDATE_NOTIFICATIONS=true  # Accept cache update notifications
FEATURE_CONDITIONAL_REQUESTS=true        # Support If-None-Match headers

# Rate limiting and safety
WATCHLIST_CACHE_MAX_ENTRIES_PER_REQUEST=50   # Limit payload size
CACHE_UPDATE_RATE_LIMIT_PER_MINUTE=100       # Notification endpoint rate limit
```

## Rollout Phases

### Phase 1: Infrastructure Deployment (Week 1)

**Goal**: Deploy backend infrastructure without activating features

**Actions**:

1. Deploy server-side cache modules with features disabled
2. Deploy cache update notification endpoint (disabled)
3. Update client code with feature flags set to `false`
4. Verify all existing functionality works unchanged

**Success Criteria**:

- Zero regression in existing Select Friends functionality
- All tests pass
- No increase in Letterboxd request rate
- No user-visible changes

**Rollback**: Standard deployment rollback

### Phase 2: Server Cache Activation (Week 2)

**Goal**: Enable server-side caching as safety net

**Actions**:

1. Enable `FEATURE_SERVER_WATCHLIST_CACHE=true`
2. Monitor Redis/D1 cache utilization
3. Verify cache hit rates on server side
4. Test cache expiration and refresh logic

**Success Criteria**:

- Server cache hit rate >50% for repeat requests
- No increase in API response times
- Proper cache eviction working
- Error rate remains <0.1%

**Rollback**: Set `FEATURE_SERVER_WATCHLIST_CACHE=false`

### Phase 3: Client Cache Reads (Week 3)

**Goal**: Enable client-side cache reading for instant page loads

**Actions**:

1. Enable `CLIENT_CACHE_READS=true` for 10% of users
2. Monitor client-side telemetry for cache hit rates
3. Verify storage quota management
4. Check for IndexedDB/localStorage errors

**Success Criteria**:

- Client cache hit rate >60% for returning users
- Page load time improvement measurable
- <1% of users experiencing storage errors
- No JavaScript errors in console

**Rollback**: Set `CLIENT_CACHE_READS=false`

### Phase 4: Background Fetcher (Week 4)

**Goal**: Enable background conditional fetching

**Actions**:

1. Enable `BACKGROUND_FETCHER=true` for Phase 3 users
2. Monitor conditional request rates to Letterboxd
3. Verify If-None-Match header efficiency
4. Check offline queue functionality

**Success Criteria**:

- 80%+ reduction in Letterboxd requests for cached users
- Conditional requests return 304 Not Modified >90% of time
- Background fetch error rate <5%
- No UI blocking or performance degradation

**Rollback**: Set `BACKGROUND_FETCHER=false`

### Phase 5: Client Cache Writes (Week 5)

**Goal**: Enable full client-side caching

**Actions**:

1. Enable `CLIENT_CACHE_WRITES=true` for all Phase 4 users
2. Monitor storage growth and GC operations
3. Verify cache update accuracy
4. Test storage limit enforcement

**Success Criteria**:

- Cache storage stays under 5MB per user
- GC operations complete successfully
- Cache accuracy >99% (counts match reality)
- No storage quota exceeded errors

**Rollback**: Set `CLIENT_CACHE_WRITES=false`, clear existing caches

### Phase 6: Full Deployment (Week 6)

**Goal**: Enable all features for all users

**Actions**:

1. Enable all cache features for 100% of users
2. Enable cache update notifications
3. Monitor overall system performance
4. Collect final metrics

**Success Criteria**:

- Overall Letterboxd request reduction >80%
- Page load time improvement >50%
- Cache hit rate >85% for active users
- System stability maintained

**Rollback**: Disable all features, revert to Phase 1 state

## Monitoring & Metrics

### Key Performance Indicators

```typescript
// Client-side metrics to track
interface CacheMetrics {
  // Performance
  cacheHitRate: number; // Target: >85%
  pageLoadTime: number; // Target: <2s cached, <10s uncached
  backgroundFetchSuccess: number; // Target: >95%

  // Storage health
  storageUsageMB: number; // Target: <4MB average
  gcOperationsPerDay: number; // Target: <5 per user
  storageErrors: number; // Target: <1%

  // Request reduction
  letterboxdRequestReduction: number; // Target: >80%
  conditionalRequestHits: number; // Target: >90%
}
```

### Monitoring Dashboards

1. **Real-time Health Dashboard**
   - Cache hit/miss rates by user segment
   - Storage usage distribution
   - Error rates and types
   - Background fetch performance

2. **Performance Impact Dashboard**
   - Page load time comparisons
   - Letterboxd request rate trends
   - Server response time impacts
   - User experience metrics

3. **Storage Management Dashboard**
   - Storage quota utilization
   - GC operation frequency
   - Storage error patterns
   - Cache accuracy metrics

## Rollback Procedures

### Emergency Rollback (< 5 minutes)

**Trigger**: Critical errors, >5% error rate increase, or user-reported issues

```bash
# Immediate disable via environment variables
wrangler env put FEATURE_CLIENT_WATCHLIST_CACHE false
wrangler env put FEATURE_SERVER_WATCHLIST_CACHE false
wrangler env put FEATURE_CACHE_UPDATE_NOTIFICATIONS false
wrangler publish functions
```

### Quick Rollback (< 30 minutes)

**Trigger**: Performance degradation, unexpected behavior

1. Disable client-side features:
   ```typescript
   FEATURE_FLAGS.WATCHLIST_CACHE_ENABLED = false;
   ```
2. Deploy client changes
3. Monitor for 15 minutes to confirm stability
4. Clear user caches if needed via support script

### Full Rollback (< 2 hours)

**Trigger**: Fundamental architectural issues

1. Revert all code changes to pre-cache state
2. Remove cache-related environment variables
3. Clear all server-side caches
4. Deploy clean version
5. Run full test suite to verify rollback

### User Cache Clearing

```typescript
// Emergency cache clear script for support
async function emergencyCacheClear() {
  await WebCacheService.clearCache();
  console.log("User cache cleared successfully");
}
```

## Risk Mitigation

### Technical Risks

1. **Storage Quota Exceeded**
   - **Prevention**: Configurable limits, proactive GC
   - **Detection**: Storage error telemetry
   - **Response**: Automatic cache clearing, reduce limits

2. **Cache Corruption**
   - **Prevention**: Version-aware schema, validation
   - **Detection**: Data integrity checks
   - **Response**: Automatic cache rebuild

3. **Background Fetch Failures**
   - **Prevention**: Offline queuing, retry logic
   - **Detection**: Error rate monitoring
   - **Response**: Disable background fetcher temporarily

### Business Risks

1. **Letterboxd Rate Limiting**
   - **Prevention**: Conditional requests, respectful timing
   - **Detection**: 429 response monitoring
   - **Response**: Increase cache windows, reduce fetch frequency

2. **User Experience Degradation**
   - **Prevention**: Phased rollout, extensive testing
   - **Detection**: Performance monitoring, user feedback
   - **Response**: Quick rollback to last stable state

## Success Criteria

### Technical Success

- [ ] 80%+ reduction in Letterboxd API requests
- [ ] 50%+ improvement in Select Friends page load time
- [ ] <1% increase in JavaScript error rate
- [ ] Cache hit rate >85% for active users
- [ ] Storage usage <5MB per user

### Business Success

- [ ] No user complaints about performance
- [ ] Improved user engagement metrics
- [ ] Reduced server costs from fewer API calls
- [ ] Positive feedback on page responsiveness

## Communication Plan

### Internal Communications

- **Daily**: Engineering team standup updates during rollout
- **Weekly**: Stakeholder reports with metrics and progress
- **Critical**: Immediate notifications for any rollback actions

### User Communications

- **Pre-rollout**: Feature announcement in app notifications
- **During rollout**: Progressive enhancement messaging
- **Post-rollout**: Performance improvement celebration

## Timeline Summary

| Week | Phase            | Focus                    | Users | Risk Level |
| ---- | ---------------- | ------------------------ | ----- | ---------- |
| 1    | Infrastructure   | Deploy disabled features | 0%    | Low        |
| 2    | Server Cache     | Enable server fallback   | 0%    | Low        |
| 3    | Client Reads     | Fast page loads          | 10%   | Medium     |
| 4    | Background Fetch | Request reduction        | 10%   | Medium     |
| 5    | Client Writes    | Full caching             | 10%   | High       |
| 6    | Full Deployment  | Complete rollout         | 100%  | Medium     |

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-02  
**Next Review**: Weekly during rollout  
**Owner**: Engineering Team
