/*
 * BoxdBuddy - Watchlist Count Updates Endpoint Tests
 * Copyright (C) 2025 Wootehfook
 * AI Generated: GitHub Copilot (Claude Sonnet 4.6) - 2026-02-21
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the cache module
const mockSetCount = vi.fn();
vi.mock("../../letterboxd/cache/index.js", () => ({
  setCount: mockSetCount,
  getCount: vi.fn(),
  acquireLock: vi.fn(),
  releaseLock: vi.fn(),
}));

describe("Watchlist Count Updates Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new Request("https://example.com/api/watchlist-count-updates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  const createEnv = (overrides: any = {}) => ({
    ADMIN_SECRET: "test-secret",
    MOVIES_DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(),
          run: vi.fn(),
        })),
      })),
    },
    FEATURE_SERVER_WATCHLIST_CACHE: "true",
    ...overrides,
  });

  describe("Authentication", () => {
    it("should reject requests without admin secret", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest({
        username: "testuser",
        count: 42,
      });

      const env = createEnv({ ADMIN_SECRET: undefined });
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject requests with wrong admin secret", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: 42,
        },
        {
          Authorization: "Bearer wrong-secret",
        }
      );

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(401);
    });

    it("should accept requests with correct admin secret", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: 42,
        },
        {
          Authorization: "Bearer test-secret",
        }
      );

      const env = createEnv();
      mockSetCount.mockResolvedValue(undefined);

      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should accept requests with direct token format", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: 42,
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      mockSetCount.mockResolvedValue(undefined);

      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
    });
  });

  describe("Feature Flag", () => {
    it("should return 503 when feature is disabled", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: 42,
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv({ FEATURE_SERVER_WATCHLIST_CACHE: "false" });
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBe("Server-side cache is disabled");
    });
  });

  describe("Payload Validation", () => {
    it("should reject invalid JSON", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = new Request(
        "https://example.com/api/watchlist-count-updates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "test-secret",
          },
          body: "invalid json{",
        }
      );

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid JSON payload");
    });

    it("should reject payload larger than 1KB", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const largePayload = {
        username: "testuser",
        count: 42,
        etag: "x".repeat(1000), // Large etag to exceed 1KB
      };

      const request = createRequest(largePayload, {
        Authorization: "test-secret",
      });

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(413);
      const data = await response.json();
      expect(data.error).toBe("Payload too large (max 1KB)");
    });

    it("should reject missing username", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          count: 42,
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details).toContain(
        "username is required and must be a non-empty string"
      );
    });

    it("should reject invalid count", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: -5, // Invalid negative count
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain("count must be >= 0");
    });

    it("should reject non-integer count", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: 42.5, // Invalid fractional count
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain("count must be an integer");
    });

    it("should reject invalid username characters", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "test@user!", // Invalid characters
          count: 42,
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain("username contains invalid characters");
    });

    it("should reject unreasonable lastFetchedAt timestamp", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const futureTime = Date.now() + 2 * 60 * 1000; // 2 minutes in future
      const request = createRequest(
        {
          username: "testuser",
          count: 42,
          lastFetchedAt: futureTime,
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details).toContain("lastFetchedAt timestamp is unreasonable");
    });

    it("should accept valid payload", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: 42,
          etag: "test-etag",
          lastFetchedAt: Date.now() - 1000,
          source: "client",
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      mockSetCount.mockResolvedValue(undefined);

      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.username).toBe("testuser");
      expect(data.count).toBe(42);
    });
  });

  describe("Rate Limiting", () => {
    it("should track rate limits per IP/username combination", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      mockSetCount.mockResolvedValue(undefined);
      const env = createEnv();

      // Make multiple requests from same IP for same user
      const makeRequest = (ip: string, username: string = "ratelimituser1") => {
        const request = createRequest(
          {
            username,
            count: 42,
          },
          {
            Authorization: "test-secret",
            "CF-Connecting-IP": ip,
          }
        );
        return onRequestPost({ request, env });
      };

      // First few requests should succeed
      for (let i = 0; i < 6; i++) {
        const response = await makeRequest("10.0.0.1");
        expect(response.status).toBe(200);
      }

      // 7th request should be rate limited
      const response = await makeRequest("10.0.0.1");
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe("Rate limit exceeded");
    });

    it("should allow requests from different IPs", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      mockSetCount.mockResolvedValue(undefined);
      const env = createEnv();

      const makeRequest = (ip: string, username: string = "ratelimituser2") => {
        const request = createRequest(
          {
            username,
            count: 42,
          },
          {
            Authorization: "test-secret",
            "CF-Connecting-IP": ip,
          }
        );
        return onRequestPost({ request, env });
      };

      // Requests from different IPs should both succeed
      const response1 = await makeRequest("10.0.0.2");
      const response2 = await makeRequest("10.0.0.3");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe("Cache Integration", () => {
    // Hoist shared imports to a single beforeEach to eliminate repeated identical
    // import blocks that SonarQube CPD flags as duplicated new code.
    let onRequestPost: any;
    let setCacheFunctionForTesting: any;

    beforeEach(async () => {
      ({ onRequestPost, setCacheFunctionForTesting } =
        await import("../api/watchlist-count-updates/index.js"));
      setCacheFunctionForTesting(mockSetCount);
    });

    it("should call mockSetCount with correct parameters", async () => {
      const lastFetchedAtValue = Date.now() - 1000;
      const request = createRequest(
        {
          username: "cacheuser1",
          count: 42,
          etag: "test-etag",
          lastFetchedAt: lastFetchedAtValue,
          source: "client",
        },
        {
          Authorization: "test-secret",
          "CF-Connecting-IP": "10.0.1.1",
        }
      );

      const env = createEnv();
      mockSetCount.mockResolvedValue(undefined);

      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      expect(mockSetCount).toHaveBeenCalledWith(
        "cacheuser1",
        {
          count: 42,
          etag: "test-etag",
          lastFetchedAt: lastFetchedAtValue,
          source: "client",
        },
        env
      );
    });

    it("should use current timestamp if lastFetchedAt not provided", async () => {
      const request = createRequest(
        {
          username: "cacheuser2",
          count: 42,
        },
        {
          Authorization: "test-secret",
          "CF-Connecting-IP": "10.0.1.2",
        }
      );

      const env = createEnv();
      mockSetCount.mockResolvedValue(undefined);

      const now = Date.now();
      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
      expect(mockSetCount).toHaveBeenCalledWith(
        "cacheuser2",
        expect.objectContaining({
          count: 42,
          lastFetchedAt: expect.any(Number),
          source: "client",
        }),
        env
      );

      // Check that timestamp is reasonable (within 1 second of now)
      const callArgs =
        mockSetCount.mock.calls[mockSetCount.mock.calls.length - 1][1];
      expect(callArgs.lastFetchedAt).toBeGreaterThanOrEqual(now - 1000);
      expect(callArgs.lastFetchedAt).toBeLessThanOrEqual(now + 1000);
    });

    it("should handle cache errors gracefully", async () => {
      const request = createRequest(
        {
          username: "erroruser",
          count: 42,
        },
        {
          Authorization: "test-secret",
          "CF-Connecting-IP": "10.0.1.3",
        }
      );

      const env = createEnv();
      mockSetCount.mockRejectedValue(new Error("Cache error"));

      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Cache error");
    });
  });

  describe("CORS", () => {
    it("should handle OPTIONS preflight requests", async () => {
      const { onRequestOptions } =
        await import("../api/watchlist-count-updates/index.js");

      const response = await onRequestOptions();

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, OPTIONS"
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type, Authorization"
      );
    });

    it("should include CORS headers in responses", async () => {
      const { onRequestPost } =
        await import("../api/watchlist-count-updates/index.js");

      const request = createRequest(
        {
          username: "testuser",
          count: 42,
        },
        {
          Authorization: "test-secret",
        }
      );

      const env = createEnv();
      mockSetCount.mockResolvedValue(undefined);

      const response = await onRequestPost({ request, env });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, OPTIONS"
      );
    });
  });
});
