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
  WATCHLIST_CACHE_ENABLED: false, // Disabled for initial release - Phase 1

  // Granular feature controls for phased rollout
  CLIENT_CACHE_READS: false, // Keep reads disabled for Phase 1
  CLIENT_CACHE_WRITES: false, // Keep writes disabled for this release
  BACKGROUND_FETCHER: false, // Keep fetcher disabled for Phase 1
  SERVER_CACHE_FALLBACK: false, // Keep server cache disabled for Phase 1
  CACHE_UPDATE_NOTIFICATIONS: false, // Keep notifications disabled for this release

  // Development and testing toggles
  ENABLE_CACHE_TELEMETRY: true, // Always collect metrics
  FORCE_CACHE_MISS: false, // Testing: simulate cache misses
  DISABLE_STORAGE_LIMITS: false, // Testing: ignore storage quotas
} as const;

// Legacy exports for backward compatibility
export const FEATURE_WATCHLIST_CACHE = FEATURE_FLAGS.WATCHLIST_CACHE_ENABLED;
export const FEATURE_WATCHLIST_FETCHER = FEATURE_FLAGS.BACKGROUND_FETCHER;

// Prefer centralized logger for runtime messages
import logger from "../utils/logger";

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
  type MutableFlags = { -readonly [K in keyof typeof FEATURE_FLAGS]: boolean };
  const flags = FEATURE_FLAGS as unknown as MutableFlags;

  flags.WATCHLIST_CACHE_ENABLED = false;
  flags.CLIENT_CACHE_READS = false;
  flags.CLIENT_CACHE_WRITES = false;
  flags.BACKGROUND_FETCHER = false;
  flags.SERVER_CACHE_FALLBACK = false;
  flags.CACHE_UPDATE_NOTIFICATIONS = false;

  // Prefer centralized logger to keep console usage in one place (utils/logger.ts)
  // AI Generated: GitHub Copilot - 2025-09-06
  logger.error(
    "🚨 Emergency cache rollback activated - all cache features disabled"
  );
}

/**
 * Get current feature flag status for debugging
 */
export function getFeatureFlagStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};

  for (const [key] of Object.entries(FEATURE_FLAGS)) {
    status[key] = isFeatureEnabled(key as keyof typeof FEATURE_FLAGS);
  }

  return status;
}
