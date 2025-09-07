/*
 * BoxdBuddies - Background Watchlist Fetcher Service
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { WebCacheService } from "./cacheService";
import { logger, incrementMetric } from "../utils/logger";
import { API_ENDPOINTS } from "../utils";
import {
  REFRESH_WINDOW_MS,
  BATCH_WINDOW_MS,
  MAX_BATCH_SIZE,
} from "../config/watchlistCache";
import { FEATURE_WATCHLIST_FETCHER } from "../config/featureFlags";

// Add global declarations for web environment
declare const fetch: typeof globalThis.fetch;
declare const navigator: typeof globalThis.navigator;

interface WatchlistFetcherConfig {
  refreshWindowMs?: number;
  batchWindowMs?: number;
  maxBatchSize?: number;
  featureEnabled?: boolean;
}

interface BackoffState {
  username: string;
  retryAt: number;
  backoffMs: number;
}

// Default configuration
const DEFAULT_CONFIG: Required<WatchlistFetcherConfig> = {
  refreshWindowMs: REFRESH_WINDOW_MS,
  batchWindowMs: BATCH_WINDOW_MS,
  maxBatchSize: MAX_BATCH_SIZE,
  featureEnabled: FEATURE_WATCHLIST_FETCHER,
};

class WatchlistFetcher {
  private config: Required<WatchlistFetcherConfig> = DEFAULT_CONFIG;
  private isRunning = false;
  private pendingQueue: Set<string> = new Set();
  private activeLocks: Set<string> = new Set();
  private backoffState: Map<string, BackoffState> = new Map();
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private offlineQueue: string[] = [];

  configure(config: WatchlistFetcherConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (!this.config.featureEnabled) {
      logger.debug("Watchlist fetcher disabled via configuration");
      return;
    }

    this.isRunning = true;
    logger.info("Watchlist fetcher started");

    // Listen for online events to process offline queue
    if (
      typeof window !== "undefined" &&
      typeof (window as any).addEventListener === "function"
    ) {
      (window as any).addEventListener("online", this.handleOnline);
    }
  }

  stop(): void {
    this.isRunning = false;
    this.pendingQueue.clear();
    this.activeLocks.clear();
    this.backoffState.clear();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (
      typeof window !== "undefined" &&
      typeof (window as any).removeEventListener === "function"
    ) {
      (window as any).removeEventListener("online", this.handleOnline);
    }

    logger.info("Watchlist fetcher stopped");
  }

  scheduleChecks(usernames: string[]): void {
    if (!this.isRunning) {
      logger.debug("Watchlist fetcher not running, ignoring schedule request");
      return;
    }

    const now = Date.now();
    let cacheMissCount = 0;
    let cacheHitCount = 0;

    for (const username of usernames) {
      if (!username?.trim()) continue;

      const cleanUsername = username.trim().toLowerCase();

      // Check if username is in backoff
      const backoff = this.backoffState.get(cleanUsername);
      if (backoff && now < backoff.retryAt) {
        logger.debug(
          `Username ${cleanUsername} in backoff until ${new Date(backoff.retryAt)}`
        );
        continue;
      }

      // Check cache freshness
      const entry = WebCacheService.getWatchlistCountEntry(cleanUsername);
      if (
        entry &&
        entry.lastFetchedAt &&
        now - entry.lastFetchedAt < this.config.refreshWindowMs
      ) {
        logger.debug(`Cache hit for ${cleanUsername}, skipping schedule`);
        this.emitTelemetry("cacheHitSkip", { username: cleanUsername });
        cacheHitCount++;
        continue;
      }

      // Schedule for fetching
      if (
        !this.pendingQueue.has(cleanUsername) &&
        !this.activeLocks.has(cleanUsername)
      ) {
        this.pendingQueue.add(cleanUsername);
        cacheMissCount++;
        incrementMetric("cache.miss.scheduled");
        this.emitTelemetry("cacheMissScheduled", { username: cleanUsername });
      }
    }

    if (cacheMissCount > 0) {
      logger.info(
        `Scheduled ${cacheMissCount} usernames for watchlist count fetch (${cacheHitCount} cache hits)`
      );
      this.scheduleBatch();
    }
  }

  async runImmediateCheck(usernames: string[]): Promise<void> {
    if (!this.isRunning) {
      logger.warn("Watchlist fetcher not running, cannot run immediate check");
      return;
    }

    const cleanUsernames = usernames
      .filter((u) => u?.trim())
      .map((u) => u.trim().toLowerCase())
      .filter((u) => !this.activeLocks.has(u));

    if (cleanUsernames.length === 0) {
      logger.debug("No valid usernames for immediate check");
      return;
    }

    await this.processBatch(cleanUsernames);
  }

  getPendingQueueLength(): number {
    return this.pendingQueue.size;
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      return; // Batch already scheduled
    }

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      this.processPendingBatch();
    }, this.config.batchWindowMs);
  }

  private async processPendingBatch(): Promise<void> {
    if (this.pendingQueue.size === 0) {
      return;
    }

    const batch = Array.from(this.pendingQueue).slice(
      0,
      this.config.maxBatchSize
    );
    this.pendingQueue.clear();

    await this.processBatch(batch);
  }

  private async processBatch(usernames: string[]): Promise<void> {
    if (usernames.length === 0) return;

    // Lock usernames to prevent concurrent requests
    for (const username of usernames) {
      this.activeLocks.add(username);
    }

    try {
      // Check if we're offline
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        logger.debug("Offline detected, queuing usernames for later");
        this.offlineQueue.push(...usernames);
        return;
      }

      incrementMetric("fetch.started");
      this.emitTelemetry("fetchStarted", { batchSize: usernames.length });

      const result = await this.performNetworkRequest(usernames);
      await this.handleResponse(result, usernames);
    } catch (error) {
      this.handleNetworkError(error, usernames);
    } finally {
      // Release locks
      for (const username of usernames) {
        this.activeLocks.delete(username);
      }
    }
  }

  private async performNetworkRequest(
    usernames: string[]
  ): Promise<globalThis.Response> {
    const conditionalHeaders: Record<string, string> = {};

    // Build conditional headers for usernames with etags
    for (const username of usernames) {
      const entry = WebCacheService.getWatchlistCountEntry(username);
      if (entry?.etag) {
        conditionalHeaders[username] = entry.etag;
      }
    }

    const body = {
      usernames,
      forceRefresh: false,
      ...(Object.keys(conditionalHeaders).length > 0 && { conditionalHeaders }),
    };

    incrementMetric("letterboxd.requests");
    return fetch(API_ENDPOINTS.LETTERBOXD_WATCHLIST_COUNT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  private async handleResponse(
    response: globalThis.Response,
    usernames: string[]
  ): Promise<void> {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const now = Date.now();
    let updatedCount = 0;
    let notModifiedCount = 0;

    for (const username of usernames) {
      const currentEntry = WebCacheService.getWatchlistCountEntry(username);
      const newCount = data.results?.[username];
      const responseEtag = response.headers.get("etag");

      if (response.status === 304 || newCount === undefined) {
        // 304 Not Modified or no data for this user - update timestamp only
        if (currentEntry) {
          WebCacheService.setWatchlistCountEntry(username, {
            ...currentEntry,
            lastFetchedAt: now,
          });
          notModifiedCount++;
        }
      } else if (typeof newCount === "number") {
        // Check if count actually changed
        const countChanged = !currentEntry || currentEntry.count !== newCount;

        if (countChanged) {
          // Count changed - update everything
          WebCacheService.setWatchlistCountEntry(username, {
            count: newCount,
            etag: responseEtag || currentEntry?.etag,
            lastFetchedAt: now,
            version: "1.0.0",
          });
          updatedCount++;
        } else {
          // Count same - update timestamp and etag only
          WebCacheService.setWatchlistCountEntry(username, {
            ...currentEntry,
            etag: responseEtag || currentEntry.etag,
            lastFetchedAt: now,
          });
          notModifiedCount++;
        }
      }

      // Clear any backoff state on successful response
      this.backoffState.delete(username);
    }

    if (updatedCount > 0) {
      incrementMetric("fetch.success.updated", updatedCount);
      this.emitTelemetry("fetchSuccessUpdated", { nUpdated: updatedCount });
    }
    if (notModifiedCount > 0) {
      incrementMetric("fetch.success.not_modified", notModifiedCount);
      this.emitTelemetry("fetchSuccessNotModified", {
        nNotModified: notModifiedCount,
      });
    }

    logger.debug(
      `Batch processed: ${updatedCount} updated, ${notModifiedCount} not modified`
    );
  }

  private handleNetworkError(error: unknown, usernames: string[]): void {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Network request failed for batch: ${errorMsg}`);

    incrementMetric("fetch.failure", usernames.length);
    this.emitTelemetry("fetchFailure", { nFailed: usernames.length });

    // Check if this is a network connectivity error
    const isOfflineError =
      error instanceof TypeError &&
      (errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("Network request failed"));

    for (const username of usernames) {
      if (isOfflineError) {
        // Queue for retry when online
        if (!this.offlineQueue.includes(username)) {
          this.offlineQueue.push(username);
        }
      } else {
        // Apply exponential backoff
        this.applyBackoff(username);
      }
    }
  }

  private applyBackoff(username: string): void {
    const currentBackoff = this.backoffState.get(username);
    const baseDelay = 30 * 1000; // 30 seconds
    const maxDelay = 60 * 60 * 1000; // 1 hour

    const newBackoffMs = currentBackoff
      ? Math.min(currentBackoff.backoffMs * 2, maxDelay)
      : baseDelay;

    const retryAt = Date.now() + newBackoffMs;

    this.backoffState.set(username, {
      username,
      retryAt,
      backoffMs: newBackoffMs,
    });

    this.emitTelemetry("backoffScheduled", {
      username,
      backoffMs: newBackoffMs,
    });
    logger.debug(`Applied backoff to ${username}: ${newBackoffMs}ms`);
  }

  private handleOnline = (): void => {
    if (this.offlineQueue.length > 0) {
      logger.info(
        `Back online, processing ${this.offlineQueue.length} queued usernames`
      );
      const queuedUsernames = [...this.offlineQueue];
      this.offlineQueue = [];
      this.scheduleChecks(queuedUsernames);
    }
  };

  private emitTelemetry(event: string, data: Record<string, unknown>): void {
    logger.debug(`Watchlist fetcher telemetry: ${event}`, data);
  }
}

// Singleton instance
const fetcherInstance = new WatchlistFetcher();

// Public API
export function startWatchlistFetcher(config?: WatchlistFetcherConfig): void {
  fetcherInstance.configure(config || {});
  fetcherInstance.start();
}

export function stopWatchlistFetcher(): void {
  fetcherInstance.stop();
}

export function scheduleChecks(usernames: string[]): void {
  fetcherInstance.scheduleChecks(usernames);
}

export function runImmediateCheck(usernames: string[]): Promise<void> {
  return fetcherInstance.runImmediateCheck(usernames);
}

export function getPendingQueueLength(): number {
  return fetcherInstance.getPendingQueueLength();
}
