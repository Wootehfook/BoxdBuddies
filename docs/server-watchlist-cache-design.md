# Server-Side Watchlist Cache Design

## 1. Goals

- Provide a server-side fallback cache for watchlist counts.
- Respect client `refreshWindow` semantics (default 12h).
- Enforce one-check-per-username-per-refreshWindow server-side.
- Offer a safe write path for client notifications (`/api/watchlist-count-updates`).
- Rate-limit and validate incoming updates.
- Include a clear rollback and migration strategy.

## 2. Storage Options and Recommendation

| Option        | TTL Support      | Consistency | Locking                 | Cost     | CF Integration |
| ------------- | ---------------- | ----------- | ----------------------- | -------- | -------------- |
| Upstash Redis | Native           | Strong      | Atomic                  | Moderate | Yes            |
| Cloudflare D1 | Manual (columns) | Strong      | Manual via transactions | Low      | Yes            |
| Cloudflare KV | Native           | Eventual    | Via Durable Object      | Low      | Yes            |

**Recommendation:** Use Upstash Redis for native TTL and atomic locks. Fallback to CF KV with Durable Objects if Redis is unavailable.

## 3. Data Schema

- **Key Patterns**
  - `watchlist:count:{username}`
  - `watchlist:lock:{username}`
- **Stored Fields**
  - `count` (number)
  - `etag` (string)
  - `lastFetchedAt` (ISO timestamp)
  - `source` (`client` \| `server` \| `scrape`)
  - `lastValidatedAt` (ISO timestamp)
- **TTL Policies**
  - Default TTL = `refreshWindow` (12h) + jitter (±10%).
  - Stale-while-revalidate window = 1h.
  - Lock TTL = 1 minute.

## 4. APIs and Flows

### 4.1 Lookup Flow

1. Read optional `watchlistCache` from client payload.
2. If client value is present and fresh, use it for display-only.
3. Else if server cache exists and `lastFetchedAt` within `refreshWindow`, return server value display-only.
4. Else attempt to acquire lock:
   - If lock succeeds, trigger scrape, update cache, release lock, then return fresh value.
   - If lock fails, return stale server value with background scrape scheduled.

### 4.2 Scrape Enforcement

- Before scraping, check `lastFetchedAt` + `refreshWindow`.
- Use per-key lock to prevent duplicate scrapes.

### 4.3 Update Flow (`/api/watchlist-count-updates`)

- **Auth:** API key or signed token header.
- **Payload:** `{ username, count, etag, timestamp }`
- **Validation:** schema, size <1KB, sanitize `username`.
- **Rate Limit:** e.g. 1 update per user per 10 minutes.
- **Action:** Upsert server cache with `source = client`, update timestamps.

## 5. Concurrency & Rate-Limiting

- **Per-username Locking** via Redis atomic `SETNX` or Durable Object mutex.
- **Global Quotas:** max scrapes per minute (e.g. 100).
- **Per-IP/Client Limits** enforced at edge (Cloudflare rate-limits).

## 6. TTLs & Refresh Policy

- Default cache TTL = 12h ±10% jitter.
- Stale-while-revalidate: serve stale up to 1h while refreshing.

## 7. Security & Validation

- Validate JSON schema strictly.
- Enforce payload size and field constraints.
- Authenticate requests with secrets/tokens.
- Sanitize inputs to prevent injection attacks.

## 8. Telemetry & Metrics

- Track `cache_hit`, `cache_miss`, `scrape_performed`.
- Count update requests and validation failures.
- Log rate-limit events.

## 9. Testing Plan

- **Unit Tests:** cache CRUD, TTL expiry, lock semantics.
- **Integration Tests:** simulate flows: client-supplied, server-cache, scrape fallback.
- **API Tests:** enforce rate-limits and auth on update endpoint.

## 10. Migration & Rollback

- **Feature Flag:** `serverCacheEnabled`.
- **Phased Rollout:** 10% → 50% → 100%.
- **Monitoring:** cache hit ratio, error rates.
- **Rollback:** disable flag and remove scheduled scrapes.

## 11. Implementation Tasks & Effort Estimate

- **DevOps (T3):** provision Redis or enable CF KV & Durable Objects; manage secrets.
- **Code (T3):**
  - Create `functions/letterboxd/cache/index.ts`.
  - Integrate into friends & compare endpoints.
  - Implement `/api/watchlist-count-updates` in `functions/api/watchlist-count-updates/index.ts`.
- **Testing (T3):** add unit and integration tests.

## 12. Sample Code Signatures & Pseudocode

```typescript
async function getCache(username: string): Promise<CacheEntry | null> { … }
async function setCache(username: string, data: CacheEntry): Promise<void> { … }
async function acquireLock(username: string): Promise<boolean> { … }
async function releaseLock(username: string): Promise<void> { … }
```

**Endpoint Pseudocode:**

```typescript
const clientVal = req.body.watchlistCache;
if (clientVal && fresh) return clientVal;
const serverVal = await cache.get(user);
if (serverVal && withinWindow) return serverVal;
if (await cache.acquireLock(user)) {
  const freshVal = await scrape(user);
  await cache.set(user, freshVal);
  await cache.releaseLock(user);
  return freshVal;
} else {
  scheduleBackgroundScrape(user);
  return serverVal || { count: 0 };
}
```

## 13. Acceptance Criteria

- Fresh values returned when client omitted and server cache is valid.
- No scrapes more than once per `refreshWindow` per user.
- Update endpoint authenticates, validates, and persists correctly.
- All tests for cache behavior and rate-limits pass.

## 14. Risk Analysis

- **Stale Data:** mitigate with stale-while-revalidate.
- **Lock Deadlocks:** enforce lock TTL.
- **Rate-limit Overruns:** monitor and throttle.
- **Rollout Errors:** feature-flag rollback plan.

---

_Document generated for guiding Code and DevOps teams._
