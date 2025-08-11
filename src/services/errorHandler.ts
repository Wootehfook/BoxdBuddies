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

// AI Generated: GitHub Copilot - 2025-08-03
// Enhanced error handling utilities for better error categorization and user feedback

export enum ErrorCategory {
  NETWORK = "NETWORK",
  API = "API",
  DATABASE = "DATABASE",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

export interface EnhancedError extends Error {
  category: ErrorCategory;
  userMessage: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

export class BoxdBuddiesError extends Error implements EnhancedError {
  category: ErrorCategory;
  userMessage: string;
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    category: ErrorCategory,
    userMessage: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BoxdBuddiesError";
    this.category = category;
    this.userMessage = userMessage;
    this.originalError = originalError;
    this.context = context;
  }
}

export class ErrorHandler {
  static categorizeError(error: unknown): ErrorCategory {
    if (typeof error === "object" && error !== null) {
      const errorObj = error as Record<string, unknown>;

      // Network-related errors
      if (errorObj.code === "ECONNABORTED" || errorObj.code === "ENOTFOUND") {
        return ErrorCategory.NETWORK;
      }

      // Timeout errors
      if (
        errorObj.code === "ECONNABORTED" ||
        (errorObj.message && String(errorObj.message).includes("timeout"))
      ) {
        return ErrorCategory.TIMEOUT;
      }

      // API errors (HTTP status codes)
      if (errorObj.response && typeof errorObj.response === "object") {
        const response = errorObj.response as Record<string, unknown>;
        if (response.status === 401 || response.status === 403) {
          return ErrorCategory.AUTHENTICATION;
        }
        if (
          response.status &&
          typeof response.status === "number" &&
          response.status >= 400
        ) {
          return ErrorCategory.API;
        }
      }

      // Database errors (Tauri/Rust backend)
      if (errorObj.message && String(errorObj.message).includes("database")) {
        return ErrorCategory.DATABASE;
      }
    }

    return ErrorCategory.UNKNOWN;
  }

  static createEnhancedError(
    operation: string,
    originalError: unknown,
    context?: Record<string, unknown>
  ): BoxdBuddiesError {
    const category = this.categorizeError(originalError);

    let userMessage: string;
    let technicalMessage: string;

    switch (category) {
      case ErrorCategory.NETWORK:
        userMessage =
          "Unable to connect to the internet. Please check your connection and try again.";
        technicalMessage = `Network error during ${operation}`;
        break;
      case ErrorCategory.TIMEOUT:
        userMessage =
          "The request took too long to complete. Please try again.";
        technicalMessage = `Timeout error during ${operation}`;
        break;
      case ErrorCategory.API:
        userMessage =
          "There was an issue with the movie database service. Please try again later.";
        technicalMessage = `API error during ${operation}`;
        break;
      case ErrorCategory.DATABASE:
        userMessage =
          "There was an issue accessing stored data. Please restart the application.";
        technicalMessage = `Database error during ${operation}`;
        break;
      case ErrorCategory.AUTHENTICATION:
        userMessage =
          "Invalid API key. Please check your TMDB API key and try again.";
        technicalMessage = `Authentication error during ${operation}`;
        break;
      case ErrorCategory.VALIDATION:
        userMessage =
          "Invalid input provided. Please check your data and try again.";
        technicalMessage = `Validation error during ${operation}`;
        break;
      default:
        userMessage = "An unexpected error occurred. Please try again.";
        technicalMessage = `Unknown error during ${operation}`;
    }

    return new BoxdBuddiesError(
      technicalMessage,
      category,
      userMessage,
      originalError,
      context
    );
  }

  static logError(error: BoxdBuddiesError): void {
    console.error(`[${error.category}] ${error.message}`, {
      userMessage: error.userMessage,
      originalError: error.originalError,
      context: error.context,
    });
  }

  static handleError(
    operation: string,
    originalError: unknown,
    context?: Record<string, unknown>
  ): BoxdBuddiesError {
    const enhancedError = this.createEnhancedError(
      operation,
      originalError,
      context
    );
    this.logError(enhancedError);
    return enhancedError;
  }
}
