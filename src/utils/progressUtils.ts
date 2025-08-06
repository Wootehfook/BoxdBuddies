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

// AI Generated: GitHub Copilot - 2025-08-06
// Utility functions for progress calculations

/**
 * Calculate progress percentage from completed and total values
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @returns Progress percentage rounded to nearest integer
 */
export const calculateProgressPercent = (
  completed: number,
  total: number
): number => {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};
