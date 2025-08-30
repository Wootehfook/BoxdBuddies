/*
 * BoxdBuddy - FriendAvatar Component
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

import { useState } from "react";
// AI Generated: GitHub Copilot - 2025-08-29T10:30:00Z
// Performance Optimization: Component Splitting - FriendAvatar component extracted

import { getUserColors, isValidLetterboxdUrl, API_ENDPOINTS } from "../utils";
import type { FriendAvatarProps } from "../types";

export function FriendAvatar({ friend }: FriendAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = friend.displayName
    ? friend.displayName.charAt(0).toUpperCase()
    : friend.username.charAt(0).toUpperCase();

  // AI Generated: GitHub Copilot - 2025-08-29T10:30:00Z
  // Secure URL validation for Letterboxd images to prevent domain spoofing
  const imageUrl =
    friend.profileImageUrl && isValidLetterboxdUrl(friend.profileImageUrl)
      ? `${API_ENDPOINTS.LETTERBOXD_AVATAR_PROXY}?url=${encodeURIComponent(friend.profileImageUrl)}`
      : friend.profileImageUrl;

  const handleImageError = () => {
    console.error(
      `Failed to load image for ${friend.username}:`,
      friend.profileImageUrl,
      "Proxied URL:",
      imageUrl
    );
    setImageError(true);
  };

  return (
    <div className="friend-avatar">
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={friend.displayName || friend.username}
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <div
          className="avatar-initials"
          style={{
            backgroundColor: getUserColors(friend.username).avatarColor,
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
