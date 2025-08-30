/*
 * BoxdBuddy - Type Definitions
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

// AI Generated: GitHub Copilot - 2025-08-29T10:00:00Z
// Performance Optimization: Component Splitting - Extracted types for better organization

export type PageType = "setup" | "friend-selection" | "results";

export interface EnhancementProgress {
  completed: number;
  total: number;
  status: string;
}

export interface Friend {
  username: string;
  displayName?: string;
  watchlistCount?: number;
  profileImageUrl?: string;
}

export interface Movie {
  id: number;
  title: string;
  year: number;
  poster_path?: string;
  overview?: string;
  vote_average?: number;
  director?: string;
  runtime?: number;
  genres?: string[]; // Array of genre names
  letterboxdSlug?: string;
  friendCount: number;
  friendList: string[];
}

// Performance Optimization: Consolidated State Management
export interface AppState {
  page: PageType;
  username: string;
  friends: Friend[];
  selectedFriends: Friend[];
  movies: Movie[];
  isLoading: boolean;
  isLoadingFriends: boolean;
  friendsLoadingProgress: number;
  isComparing: boolean;
  isLoadingWatchlistCounts: boolean;
  error: string | null;
  enhancementProgress: EnhancementProgress;
  currentQuoteIndex: number;
}

export type AppAction =
  | { type: "SET_PAGE"; payload: PageType }
  | { type: "SET_USERNAME"; payload: string }
  | { type: "SET_FRIENDS"; payload: Friend[] }
  | { type: "SET_SELECTED_FRIENDS"; payload: Friend[] }
  | { type: "TOGGLE_FRIEND"; payload: Friend }
  | { type: "SET_MOVIES"; payload: Movie[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LOADING_FRIENDS"; payload: boolean }
  | { type: "SET_FRIENDS_LOADING_PROGRESS"; payload: number }
  | { type: "SET_COMPARING"; payload: boolean }
  | { type: "SET_LOADING_WATCHLIST_COUNTS"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_ENHANCEMENT_PROGRESS"; payload: EnhancementProgress }
  | { type: "SET_CURRENT_QUOTE_INDEX"; payload: number }
  | { type: "RESET_STATE" };

// Component Props Interfaces
export interface SetupPageProps {
  username: string;
  setUsername: (value: string) => void;
  onSetup: () => void;
  isLoading: boolean;
  isLoadingFriends: boolean;
  friendsLoadingProgress: number;
  error: string | null;
}

export interface FriendSelectionPageProps {
  friends: Friend[];
  selectedFriends: Friend[];
  onToggleFriend: (friend: Friend) => void;
  onCompareWatchlists: () => void;
  onBackToSetup: () => void;
  isComparing: boolean;
  isLoadingWatchlistCounts: boolean;
  enhancementProgress: EnhancementProgress;
  currentQuoteIndex: number;
  error: string | null;
}

export interface ResultsPageProps {
  movies: Movie[];
  selectedFriends: Friend[];
  onBack: () => void;
  onNewComparison: () => void;
}

export interface FriendAvatarProps {
  friend: Friend;
}
