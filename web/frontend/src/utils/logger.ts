/*
 * BoxdBuddies - Movie Watchlist Comparison Tool
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Web-compatible logger (replaces Tauri logging)
const isDevelopment = import.meta.env.DEV;

class Logger {
  debug(...args: unknown[]) {
    if (isDevelopment) {
      console.log("[DEBUG]", ...args);
    }
  }

  info(...args: unknown[]) {
    console.info("[INFO]", ...args);
  }

  warn(...args: unknown[]) {
    console.warn("[WARN]", ...args);
  }

  error(...args: unknown[]) {
    console.error("[ERROR]", ...args);
  }
}

export const logger = new Logger();
export default logger;