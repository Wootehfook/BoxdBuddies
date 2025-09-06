#!/usr/bin/env node

/* eslint-env node */
 

/**
 * Emergency Cache Rollback Script
 *
 * This script provides immediate rollback capabilities for the watchlist cache feature.
 * Use this when urgent rollback is needed due to production issues.
 *
 * Usage:
 *   node scripts/emergency-rollback.js [--dry-run] [--reason="explanation"]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  featureFlagsPath: 'src/config/featureFlags.ts',
  watchlistConfigPath: 'src/config/watchlistCache.ts',
  envPath: '.env',
  backupDir: '.rollback-backups',
};

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const reasonMatch = args.find(arg => arg.startsWith('--reason='));
const reason = reasonMatch ? reasonMatch.split('=')[1].replace(/['"]/g, '') : 'Emergency rollback';

console.log('🚨 BoxdBuddies Emergency Cache Rollback');
console.log('=====================================');
console.log(`Reason: ${reason}`);
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE ROLLBACK'}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('');

/**
 * Create backup of current configuration
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(CONFIG.backupDir, `rollback-${timestamp}`);
  
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  console.log(`📦 Creating backup at: ${backupPath}`);
  
  if (!isDryRun) {
    fs.mkdirSync(backupPath, { recursive: true });
    
    // Backup feature flags
    if (fs.existsSync(CONFIG.featureFlagsPath)) {
      fs.copyFileSync(
        CONFIG.featureFlagsPath,
        path.join(backupPath, 'featureFlags.ts')
      );
    }
    
    // Backup watchlist config
    if (fs.existsSync(CONFIG.watchlistConfigPath)) {
      fs.copyFileSync(
        CONFIG.watchlistConfigPath,
        path.join(backupPath, 'watchlistCache.ts')
      );
    }
    
    // Backup environment file
    if (fs.existsSync(CONFIG.envPath)) {
      fs.copyFileSync(
        CONFIG.envPath,
        path.join(backupPath, '.env')
      );
    }
    
    // Create rollback metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      reason,
      originalFeatureFlags: readFeatureFlags(),
      originalConfig: readWatchlistConfig(),
    };
    
    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }
  
  console.log('✅ Backup created successfully');
}

/**
 * Read current feature flags
 */
function readFeatureFlags() {
  try {
    const content = fs.readFileSync(CONFIG.featureFlagsPath, 'utf8');
    return content;
  } catch (error) {
    console.warn(`⚠️  Could not read feature flags: ${error.message}`);
    return null;
  }
}

/**
 * Read current watchlist config
 */
function readWatchlistConfig() {
  try {
    const content = fs.readFileSync(CONFIG.watchlistConfigPath, 'utf8');
    return content;
  } catch (error) {
    console.warn(`⚠️  Could not read watchlist config: ${error.message}`);
    return null;
  }
}

/**
 * Disable all cache features in feature flags
 */
function disableFeatureFlags() {
  console.log('🔧 Disabling cache feature flags...');
  
  const rollbackContent = `/**
 * Feature Flags Configuration
 * 🚨 EMERGENCY ROLLBACK ACTIVE 🚨
 * 
 * All cache features have been disabled due to: ${reason}
 * Rollback time: ${new Date().toISOString()}
 * 
 * To restore features, see backup in ${CONFIG.backupDir}
 */

export const FEATURE_FLAGS = {
  // 🚨 ALL CACHE FEATURES DISABLED FOR ROLLBACK
  WATCHLIST_CACHE_ENABLED: false,
  CLIENT_CACHE_READS: false,
  CLIENT_CACHE_WRITES: false,
  BACKGROUND_FETCHER: false,
  SERVER_CACHE_FALLBACK: false,
  CACHE_UPDATE_NOTIFICATIONS: false,
  
  // Keep telemetry for monitoring rollback impact
  ENABLE_CACHE_TELEMETRY: true,
  FORCE_CACHE_MISS: false,
  DISABLE_STORAGE_LIMITS: false,
} as const;

// Legacy exports - also disabled
export const FEATURE_WATCHLIST_CACHE = false;
export const FEATURE_WATCHLIST_FETCHER = false;

export function isFeatureEnabled(): boolean {
  return false; // All features disabled in rollback
}

export function emergencyDisableCache(): void {
  console.warn('Cache already disabled in emergency rollback mode');
}

export function getFeatureFlagStatus(): Record<string, boolean> {
  return {
    WATCHLIST_CACHE_ENABLED: false,
    CLIENT_CACHE_READS: false,
    CLIENT_CACHE_WRITES: false,
    BACKGROUND_FETCHER: false,
    SERVER_CACHE_FALLBACK: false,
    CACHE_UPDATE_NOTIFICATIONS: false,
    ENABLE_CACHE_TELEMETRY: true,
    FORCE_CACHE_MISS: false,
    DISABLE_STORAGE_LIMITS: false,
  };
}
`;

  if (!isDryRun) {
    fs.writeFileSync(CONFIG.featureFlagsPath, rollbackContent);
  }
  
  console.log('✅ Feature flags disabled');
}

/**
 * Disable cache configuration
 */
function disableCacheConfig() {
  console.log('🔧 Disabling cache configuration...');
  
  const rollbackContent = `/**
 * Watchlist Cache Configuration
 * 🚨 EMERGENCY ROLLBACK ACTIVE 🚨
 * 
 * Cache disabled due to: ${reason}
 * Rollback time: ${new Date().toISOString()}
 */

export const WATCHLIST_CACHE_CONFIG = {
  ENABLED: false, // 🚨 DISABLED FOR ROLLBACK
  REFRESH_WINDOW_HOURS: 12,
  BACKGROUND_FETCH_BATCH_SIZE: 10,
  BACKGROUND_FETCH_DELAY_MS: 2000,
  
  // Storage limits (not used when disabled)
  MAX_ENTRIES: 1000,
  MAX_STORAGE_MB: 5,
  GC_THRESHOLD_PERCENT: 80,
  STALE_AGE_DAYS: 30,
  MIN_KEEP_ENTRIES: 100,
  
  // Keep telemetry for monitoring
  TELEMETRY_ENABLED: true,
};
`;

  if (!isDryRun) {
    fs.writeFileSync(CONFIG.watchlistConfigPath, rollbackContent);
  }
  
  console.log('✅ Cache configuration disabled');
}

/**
 * Add rollback environment variables
 */
function updateEnvironment() {
  console.log('🔧 Setting rollback environment variables...');
  
  const rollbackVars = [
    '# 🚨 EMERGENCY CACHE ROLLBACK ACTIVE',
    `# Reason: ${reason}`,
    `# Time: ${new Date().toISOString()}`,
    'FEATURE_CLIENT_WATCHLIST_CACHE=false',
    'FEATURE_SERVER_WATCHLIST_CACHE=false',
    'FEATURE_CACHE_UPDATE_NOTIFICATIONS=false',
    'FEATURE_CONDITIONAL_REQUESTS=false',
    '',
  ].join('\n');
  
  if (!isDryRun) {
    if (fs.existsSync(CONFIG.envPath)) {
      const currentContent = fs.readFileSync(CONFIG.envPath, 'utf8');
      const updatedContent = rollbackVars + '\n' + currentContent;
      fs.writeFileSync(CONFIG.envPath, updatedContent);
    } else {
      fs.writeFileSync(CONFIG.envPath, rollbackVars);
    }
  }
  
  console.log('✅ Environment variables updated');
}

/**
 * Generate post-rollback instructions
 */
function generateInstructions() {
  console.log('');
  console.log('📋 POST-ROLLBACK INSTRUCTIONS');
  console.log('============================');
  console.log('');
  console.log('1. Deploy the updated code immediately:');
  console.log('   npm run build && npm run deploy');
  console.log('');
  console.log('2. Monitor application for 15 minutes:');
  console.log('   - Check error rates return to normal');
  console.log('   - Verify Select Friends page works');
  console.log('   - Confirm no cache-related errors');
  console.log('');
  console.log('3. Clear user caches if needed:');
  console.log('   - Users may need to refresh browser');
  console.log('   - Consider cache clear announcement');
  console.log('');
  console.log('4. Investigate root cause:');
  console.log('   - Review logs and error reports');
  console.log('   - Check monitoring dashboards');
  console.log('   - Document incident findings');
  console.log('');
  console.log('5. To restore features:');
  console.log(`   - Review backup in: ${CONFIG.backupDir}`);
  console.log('   - Follow gradual re-rollout plan');
  console.log('   - Test thoroughly before enabling');
  console.log('');
  console.log('🔍 Rollback completed - monitor closely!');
}

/**
 * Main rollback execution
 */
function executeRollback() {
  try {
    createBackup();
    disableFeatureFlags();
    disableCacheConfig();
    updateEnvironment();
    generateInstructions();
    
    if (isDryRun) {
      console.log('');
      console.log('💡 This was a dry run - no files were actually modified');
      console.log('   Remove --dry-run flag to execute the rollback');
    } else {
      console.log('');
      console.log('✅ Emergency rollback completed successfully!');
      console.log('🚀 Deploy these changes immediately to production');
    }
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    console.error('');
    console.error('Manual rollback required:');
    console.error('1. Set FEATURE_WATCHLIST_CACHE_ENABLED = false');
    console.error('2. Set all feature flags to false');
    console.error('3. Deploy immediately');
    process.exit(1);
  }
}

// Execute the rollback
executeRollback();