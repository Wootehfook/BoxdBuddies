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

// AI Generated: GitHub Copilot - 2025-08-10
// Secure backend service for web version demonstration

export interface Movie {
  id: number;
  title: string;
  year: number;
  posterPath?: string;
  overview?: string;
  rating?: number;
  genre?: string;
  director?: string;
  averageRating?: number;
  friendCount: number;
  friendList?: string[];
  letterboxdSlug?: string;
}

export interface Friend {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  watchlistCount?: number;
}

export interface UserPreferences {
  username: string;
  // Security fix: Never store API keys directly
  // tmdb_api_key: string; // REMOVED: Security vulnerability
  always_on_top?: boolean;
}

// Sample data for demonstration
const sampleFriends: Friend[] = [
  {
    username: "cinemafan2023",
    displayName: "Cinema Fan",
    watchlistCount: 247,
  },
  {
    username: "moviebuff",
    displayName: "Movie Buff",
    watchlistCount: 189,
  },
  {
    username: "filmcritic",
    displayName: "Film Critic",
    watchlistCount: 156,
  },
  {
    username: "reelreviews",
    displayName: "Reel Reviews",
    watchlistCount: 203,
  },
];

const sampleCommonMovies: Movie[] = [
  {
    id: 1,
    title: "The Shawshank Redemption",
    year: 1994,
    posterPath:
      "https://image.tmdb.org/t/p/w300/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    overview:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    genre: "Drama",
    director: "Frank Darabont",
    averageRating: 9.3,
    friendCount: 4,
    friendList: ["cinemafan2023", "moviebuff", "filmcritic", "reelreviews"],
    letterboxdSlug: "the-shawshank-redemption",
  },
  {
    id: 2,
    title: "The Godfather",
    year: 1972,
    posterPath:
      "https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    overview:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    genre: "Crime, Drama",
    director: "Francis Ford Coppola",
    averageRating: 9.2,
    friendCount: 3,
    friendList: ["cinemafan2023", "moviebuff", "filmcritic"],
    letterboxdSlug: "the-godfather",
  },
  {
    id: 3,
    title: "Pulp Fiction",
    year: 1994,
    posterPath:
      "https://image.tmdb.org/t/p/w300/dM2w364MScsjFf8pfMbaWUcWrR.jpg",
    overview:
      "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    genre: "Crime, Drama",
    director: "Quentin Tarantino",
    averageRating: 8.9,
    friendCount: 3,
    friendList: ["moviebuff", "filmcritic", "reelreviews"],
    letterboxdSlug: "pulp-fiction",
  },
  {
    id: 4,
    title: "The Dark Knight",
    year: 2008,
    posterPath:
      "https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    overview:
      "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations.",
    genre: "Action, Crime, Drama",
    director: "Christopher Nolan",
    averageRating: 9.0,
    friendCount: 4,
    friendList: ["cinemafan2023", "moviebuff", "filmcritic", "reelreviews"],
    letterboxdSlug: "the-dark-knight",
  },
  {
    id: 5,
    title: "Goodfellas",
    year: 1990,
    posterPath:
      "https://image.tmdb.org/t/p/w300/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    overview:
      "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners.",
    genre: "Biography, Crime, Drama",
    director: "Martin Scorsese",
    averageRating: 8.7,
    friendCount: 2,
    friendList: ["cinemafan2023", "filmcritic"],
    letterboxdSlug: "goodfellas",
  },
  {
    id: 6,
    title: "Forrest Gump",
    year: 1994,
    posterPath:
      "https://image.tmdb.org/t/p/w300/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    overview:
      "The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate and other historical events unfold through the perspective of an Alabama man.",
    genre: "Drama, Romance",
    director: "Robert Zemeckis",
    averageRating: 8.8,
    friendCount: 3,
    friendList: ["moviebuff", "filmcritic", "reelreviews"],
    letterboxdSlug: "forrest-gump",
  },
];

// Secure API functions
export const secureBackendAPI = {
  // Save user preferences - SECURITY FIX: Never store API keys
  saveUserPreferences: async (request: {
    username: string;
    alwaysOnTop?: boolean;
    // API keys should be handled through secure environment variables
    // or encrypted storage, never stored as plain text
  }): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    // Only store non-sensitive preferences
    const safePrefs = {
      username: request.username,
      alwaysOnTop: request.alwaysOnTop || false,
      // Note: API keys should be managed through environment variables
      // or secure token-based authentication, not localStorage
    };

    // Check if we're in a browser environment
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        "boxdbuddies_user_prefs",
        JSON.stringify(safePrefs)
      );
    }
  },

  // Load user preferences - SECURITY FIX: No sensitive data exposure
  loadUserPreferences: async (): Promise<UserPreferences | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Check if we're in a browser environment
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem("boxdbuddies_user_prefs");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  // Get available friends for comparison
  getAvailableFriends: async (): Promise<Friend[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return [...sampleFriends];
  },

  // Compare watchlists between selected friends
  compareWatchlists: async (friendUsernames: string[]): Promise<Movie[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Filter movies based on selected friends
    return sampleCommonMovies.filter((movie) =>
      movie.friendList?.some((friend) => friendUsernames.includes(friend))
    );
  },

  // Get movie details by ID
  getMovieDetails: async (movieId: number): Promise<Movie | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return sampleCommonMovies.find((movie) => movie.id === movieId) || null;
  },

  // Health check endpoint
  healthCheck: async (): Promise<{ status: string; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      status: "healthy",
      message: "Secure mock backend API is operational",
    };
  },
};

// Export default for backwards compatibility
export default secureBackendAPI;
