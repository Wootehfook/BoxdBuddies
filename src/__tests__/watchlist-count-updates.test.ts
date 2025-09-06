import { describe, it, expect, vi, beforeEach } from "vitest";
import { setCount } from "../../functions/letterboxd/cache/index.js";

// Mock the cache module
vi.mock("../../functions/letterboxd/cache/index.js", () => ({
  setCount: vi.fn(),
}));

describe("watchlist-count-updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call setCount with correct parameters", async () => {
    const mockSetCount = vi.mocked(setCount);

    // Mock the request object
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        username: "testuser",
        count: 42,
        etag: "test-etag",
        lastFetchedAt: Date.now() - 1000, // 1 second ago
        source: "client",
      }),
      headers: {
        get: vi.fn((name: string) => {
          if (name === "Authorization") return "Bearer test-admin-secret";
          if (name === "CF-Connecting-IP") return "127.0.0.1";
          return null;
        }),
      },
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          username: "testuser",
          count: 42,
          etag: "test-etag",
          lastFetchedAt: Date.now() - 1000,
          source: "client",
        })
      ),
    };

    // Mock the env object
    const mockEnv = {
      MOVIES_DB: {},
      UPSTASH_REDIS_REST_URL: "test-url",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      FEATURE_SERVER_WATCHLIST_CACHE: "true",
      ADMIN_SECRET: "test-admin-secret",
    };

    // Import the handler function and wrap it with a local, minimal type
    const { onRequestPost: handler } = await import(
      "../../functions/api/watchlist-count-updates/index.js"
    );

    // Use a locally-typed wrapper so we don't need to reference global Request/Env types
    const handlerFn = handler as unknown as (ctx: {
      request: unknown;
      env: unknown;
    }) => Promise<unknown>;

    // Call the handler
    const response = (await handlerFn({
      request: mockRequest as unknown,
      env: mockEnv as unknown,
    })) as { status: number; json: () => Promise<unknown> };

    // Verify the response
    const responseBody = (await response.json()) as {
      success?: boolean;
      username?: string;
      count?: number;
    };
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      success: true,
      username: "testuser",
      count: 42,
    });

    // Verify setCount was called with correct parameters
    expect(mockSetCount).toHaveBeenCalledTimes(1);
    expect(mockSetCount).toHaveBeenCalledWith(
      "testuser",
      {
        count: 42,
        etag: "test-etag",
        lastFetchedAt: expect.any(Number),
        source: "client",
      },
      mockEnv
    );
  });

  it("should handle invalid request data", async () => {
    const mockSetCount = vi.mocked(setCount);

    // Mock invalid request
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        username: "", // Invalid empty username
        count: -1, // Invalid negative count
      }),
      headers: {
        get: vi.fn((name: string) => {
          if (name === "Authorization") return "Bearer test-admin-secret";
          if (name === "CF-Connecting-IP") return "127.0.0.1";
          return null;
        }),
      },
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          username: "", // Invalid empty username
          count: -1, // Invalid negative count
        })
      ),
    };

    const mockEnv = {
      MOVIES_DB: {},
      UPSTASH_REDIS_REST_URL: "test-url",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      FEATURE_SERVER_WATCHLIST_CACHE: "true",
      ADMIN_SECRET: "test-admin-secret",
    };

    const { onRequestPost: handler } = await import(
      "../../functions/api/watchlist-count-updates/index.js"
    );

    const handlerFn = handler as unknown as (ctx: {
      request: unknown;
      env: unknown;
    }) => Promise<unknown>;

    const response = (await handlerFn({
      request: mockRequest as unknown,
      env: mockEnv as unknown,
    })) as { status: number; json: () => Promise<unknown> };

    expect(response.status).toBe(400);
    const responseBody = (await response.json()) as { error?: string };
    expect(responseBody.error).toContain("Validation failed");

    // setCount should not be called for invalid data
    expect(mockSetCount).not.toHaveBeenCalled();
  });

  it("should handle missing required fields", async () => {
    const mockSetCount = vi.mocked(setCount);

    // Mock request with missing fields
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        // Missing username and count
        etag: "test-etag",
      }),
      headers: {
        get: vi.fn((name: string) => {
          if (name === "Authorization") return "Bearer test-admin-secret";
          if (name === "CF-Connecting-IP") return "127.0.0.1";
          return null;
        }),
      },
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          // Missing username and count
          etag: "test-etag",
        })
      ),
    };

    const mockEnv = {
      MOVIES_DB: {},
      UPSTASH_REDIS_REST_URL: "test-url",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      FEATURE_SERVER_WATCHLIST_CACHE: "true",
      ADMIN_SECRET: "test-admin-secret",
    };

    const { onRequestPost: handler } = await import(
      "../../functions/api/watchlist-count-updates/index.js"
    );

    const handlerFn = handler as unknown as (ctx: {
      request: unknown;
      env: unknown;
    }) => Promise<unknown>;

    const response = (await handlerFn({
      request: mockRequest as unknown,
      env: mockEnv as unknown,
    })) as { status: number; json: () => Promise<unknown> };

    expect(response.status).toBe(400);
    const responseBody = (await response.json()) as { error?: string };
    expect(responseBody.error).toContain("Validation failed");

    // setCount should not be called for missing fields
    expect(mockSetCount).not.toHaveBeenCalled();
  });
});
