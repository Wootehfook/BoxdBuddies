/*
 * BoxdBuddy - Utility Functions and Constants
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

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Performance Optimization: Component Splitting - Extracted utilities for better organization

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// API Configuration Constants
export const API_ENDPOINTS = {
  LETTERBOXD_FRIENDS: "/letterboxd/friends",
  LETTERBOXD_WATCHLIST_COUNT: "/letterboxd/watchlist-count",
  LETTERBOXD_COMPARE: "/api/watchlist-comparison", // Changed to avoid adblocker issues
  LETTERBOXD_AVATAR_PROXY: "/letterboxd/avatar-proxy",
} as const;

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Generate consistent colors for user display throughout the app
export function getUserColors(username: string) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#1DD1A1",
    "#FD79A8",
    "#6C5CE7",
    "#74B9FF",
    "#A29BFE",
    "#1E90FF",
    "#FF7675",
    "#74C0FC",
    "#82CA9D",
    "#F8B500",
  ];

  // Create a simple hash from the username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color consistently
  const colorIndex = Math.abs(hash) % colors.length;
  const baseColor = colors[colorIndex];

  return {
    // For avatar backgrounds
    avatarColor: baseColor,
    // For username bubbles/badges
    color: "#ffffff",
    borderColor: baseColor,
    backgroundColor: baseColor + "33", // Add 20% opacity
  };
}

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Famous movie quotes for progress display
export const FAMOUS_MOVIE_QUOTES = [
  { quote: "May the Force be with you.", movie: "Star Wars" },
  { quote: "I'll be back.", movie: "The Terminator" },
  { quote: "Here's looking at you, kid.", movie: "Casablanca" },
  { quote: "You can't handle the truth!", movie: "A Few Good Men" },
  { quote: "Houston, we have a problem.", movie: "Apollo 13" },
  {
    quote: "Frankly, my dear, I don't give a damn.",
    movie: "Gone with the Wind",
  },
  { quote: "I see dead people.", movie: "The Sixth Sense" },
  { quote: "You're gonna need a bigger boat.", movie: "Jaws" },
  { quote: "Nobody puts Baby in a corner.", movie: "Dirty Dancing" },
  { quote: "Life is like a box of chocolates.", movie: "Forrest Gump" },
  { quote: "I feel the need... the need for speed!", movie: "Top Gun" },
  { quote: "Show me the money!", movie: "Jerry Maguire" },
  { quote: "After all this time? Always.", movie: "Harry Potter" },
  { quote: "Why so serious?", movie: "The Dark Knight" },
  { quote: "I am inevitable.", movie: "Avengers: Endgame" },
];

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Secure URL validation for Letterboxd images to prevent domain spoofing
export function isValidLetterboxdUrl(url: string): boolean {
  try {
    const parsedUrl = new window.URL(url);
    // Ensure the hostname ends with .ltrbxd.com (not just contains it)
    return (
      parsedUrl.hostname.endsWith(".ltrbxd.com") ||
      parsedUrl.hostname === "ltrbxd.com"
    );
  } catch {
    return false;
  }
}
