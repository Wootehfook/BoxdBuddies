/**
 * Feature Flags Configuration
 * Centralized feature toggles for safe rollout and testing
 *
 * Rollout Strategy:
 * Phase 1: All flags disabled (infrastructure deployment)
 * Phase 2: SERVER_CACHE_FALLBACK enabled
 * Phase 3: CLIENT_CACHE_READS enabled for 10% users
 * Phase 4: BACKGROUND_FETCHER enabled for Phase 3 users
 * Phase 5: CLIENT_CACHE_WRITES enabled for all Phase 4 users
 * Phase 6: All features enabled for 100% users
 */

export const FEATURE_FLAGS = {
  // Master toggle - disables all cache functionality
  WATCHLIST_CACHE_ENABLED: true, // Enabled for release branch manual QA

  // Granular feature controls for phased rollout
  CLIENT_CACHE_READS: true, // Enable reading from IndexedDB/localStorage
  CLIENT_CACHE_WRITES: false, // Keep writes disabled for this release
  BACKGROUND_FETCHER: true, // Enable background conditional fetching
  SERVER_CACHE_FALLBACK: true, // Use server Redis/D1 cache (prefer Redis via envs)
  CACHE_UPDATE_NOTIFICATIONS: false, // Keep notifications disabled for this release

  // Development and testing toggles
  ENABLE_CACHE_TELEMETRY: true, // Always collect metrics
  FORCE_CACHE_MISS: false, // Testing: simulate cache misses
  DISABLE_STORAGE_LIMITS: false, // Testing: ignore storage quotas
} as const;

// Legacy exports for backward compatibility
export const FEATURE_WATCHLIST_CACHE = FEATURE_FLAGS.WATCHLIST_CACHE_ENABLED;
export const FEATURE_WATCHLIST_FETCHER = FEATURE_FLAGS.BACKGROUND_FETCHER;

/**
 * Runtime feature check with hierarchical dependencies
 * @param feature - Feature to check
 * @returns true if feature is enabled and dependencies met
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  // Master toggle overrides all other features
  if (!FEATURE_FLAGS.WATCHLIST_CACHE_ENABLED) {
    return false;
  }

  const enabled = FEATURE_FLAGS[feature];

  // Check feature dependencies
  switch (feature) {
    case "CLIENT_CACHE_WRITES":
      return enabled && FEATURE_FLAGS.CLIENT_CACHE_READS;

    case "BACKGROUND_FETCHER":
      return enabled && FEATURE_FLAGS.CLIENT_CACHE_READS;

    case "CACHE_UPDATE_NOTIFICATIONS":
      return (
        enabled &&
        FEATURE_FLAGS.CLIENT_CACHE_WRITES &&
        FEATURE_FLAGS.BACKGROUND_FETCHER
      );

    default:
      return enabled;
  }
}

/**
 * Emergency rollback - disable all cache features
 * Call this function to immediately disable caching in production
 */
export function emergencyDisableCache(): void {
  // Cast to mutable to allow runtime modification
  const flags = FEATURE_FLAGS as any;

  flags.WATCHLIST_CACHE_ENABLED = false;
  flags.CLIENT_CACHE_READS = false;
  flags.CLIENT_CACHE_WRITES = false;
  flags.BACKGROUND_FETCHER = false;
  flags.SERVER_CACHE_FALLBACK = false;
  flags.CACHE_UPDATE_NOTIFICATIONS = false;

  console.warn(
    "🚨 Emergency cache rollback activated - all cache features disabled"
  );
}

/**
 * Get current feature flag status for debugging
 */
export function getFeatureFlagStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};

  for (const [key, _value] of Object.entries(FEATURE_FLAGS)) {
    status[key] = isFeatureEnabled(key as keyof typeof FEATURE_FLAGS);
  }

  return status;
}
