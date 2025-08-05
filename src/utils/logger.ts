/*
 * BoxdBuddies - Compare Letterboxd watchlists between friends
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// AI Generated: GitHub Copilot - 2025-08-05
// Centralized logging utility for production-ready console management

const isDevelopment = process.env.NODE_ENV === "development";

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

  // For production builds, we can completely silence logs except errors
  production: {
    debug: () => {
      /* no-op */
    },
    info: () => {
      /* no-op */
    },
    warn: () => {
      /* no-op */
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`❌ ${message}`, ...args);
    },
  },
};

export default logger;
