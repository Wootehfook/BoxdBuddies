/*
 * BoxdBuddies - Movie Watchlist Comparison Tool
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

// AI Generated: GitHub Copilot - 2025-01-07
// Centralized logging utility for web version

const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🔧 ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    // Always log errors, even in production
    console.error(`❌ ${message}`, ...args);
  },

  logCacheHit: (username: string) => {
    logger.debug(`Cache hit for ${username}`);
  },

  logCacheMiss: (username: string) => {
    logger.debug(`Cache miss for ${username}`);
  },
};

// Metrics storage
const metrics = new Map<string, number>();

export function incrementMetric(name: string, value: number = 1): void {
  const current = metrics.get(name) || 0;
  metrics.set(name, current + value);
}

export function getMetric(name: string): number {
  return metrics.get(name) || 0;
}

export function resetMetric(name?: string): void {
  if (name) {
    metrics.delete(name);
  } else {
    metrics.clear();
  }
}

export default logger;
