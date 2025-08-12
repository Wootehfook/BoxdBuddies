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
// Mock backend service for web version demonstration

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
  tmdb_api_key?: string; // Optional for web version
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

// Mock API functions
export const mockBackendAPI = {
  // Save user preferences
  saveUserPreferences: async (request: {
    username: string;
    tmdbApiKey?: string; // Optional for web version
    alwaysOnTop?: boolean;
  }): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    // eslint-disable-next-line no-undef
    localStorage.setItem("boxdbuddies_user_prefs", JSON.stringify(request));
  },

  // Load user preferences
  loadUserPreferences: async (): Promise<UserPreferences | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // eslint-disable-next-line no-undef
    const stored = localStorage.getItem("boxdbuddies_user_prefs");
    return stored ? JSON.parse(stored) : null;
  },

  // Scrape Letterboxd friends (mock)
  scrapeLetterboxdFriends: async (_username: string): Promise<Friend[]> => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate scraping delay
    return sampleFriends;
  },

  // Get friends with watchlist counts
  getFriendsWithWatchlistCounts: async (): Promise<Friend[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return sampleFriends;
  },

  // Compare watchlists
  compareWatchlists: async (request: {
    mainUsername: string;
    friendUsernames: string[];
    tmdbApiKey?: string | null;
    limitTo500?: boolean;
  }): Promise<{ commonMovies: Movie[] }> => {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate comparison delay

    // Filter movies based on selected friends
    const filteredMovies = sampleCommonMovies.filter((movie) =>
      movie.friendList?.some((friend) =>
        request.friendUsernames.includes(friend)
      )
    );

    return { commonMovies: filteredMovies };
  },

  // Set window focus (no-op for web)
  setWindowFocus: async (): Promise<void> => {
    // No-op for web version
  },

  // Set always on top (no-op for web)
  setAlwaysOnTop: async (_alwaysOnTop: boolean): Promise<void> => {
    // No-op for web version
  },
};
