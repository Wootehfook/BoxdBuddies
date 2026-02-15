import { describe, it, expect, vi, beforeEach } from "vitest";
import { setCount } from "../../functions/letterboxd/cache/index.js";

// Mock the cache module
vi.mock("../../functions/letterboxd/cache/index.js", () => ({
  setCount: vi.fn(),
}));

// Helper to create mock request
const createMockRequest = (data: Record<string, unknown>) => ({
  json: vi.fn().mockResolvedValue(data),
  headers: {
    get: vi.fn((name: string) => {
      if (name === "Authorization") return "Bearer test-admin-secret";
      if (name === "CF-Connecting-IP") return "127.0.0.1";
      return null;
    }),
  },
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
});

// Helper to create mock env
const createMockEnv = () => ({
  MOVIES_DB: {},
  UPSTASH_REDIS_REST_URL: "test-url",
  UPSTASH_REDIS_REST_TOKEN: "test-token",
  FEATURE_SERVER_WATCHLIST_CACHE: "true",
  ADMIN_SECRET: "test-admin-secret",
});

describe("watchlist-count-updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call setCount with correct parameters", async () => {
    const mockSetCount = vi.mocked(setCount);
    const mockEnv = createMockEnv();
    const mockRequest = createMockRequest({
      username: "testuser",
      count: 42,
      etag: "test-etag",
      lastFetchedAt: Date.now() - 1000,
      source: "client",
    });

    const { onRequestPost: handler } =
      await import("../../functions/api/watchlist-count-updates/index.js");

    const handlerFn = handler as unknown as (ctx: {
      request: unknown;
      env: unknown;
    }) => Promise<unknown>;

    const response = (await handlerFn({
      request: mockRequest as unknown,
      env: mockEnv as unknown,
    })) as { status: number; json: () => Promise<unknown> };

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
    const mockEnv = createMockEnv();
    const mockRequest = createMockRequest({
      username: "",
      count: -1,
    });

    const { onRequestPost: handler } =
      await import("../../functions/api/watchlist-count-updates/index.js");

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

    expect(mockSetCount).not.toHaveBeenCalled();
  });

  it("should handle missing required fields", async () => {
    const mockSetCount = vi.mocked(setCount);
    const mockEnv = createMockEnv();
    const mockRequest = createMockRequest({
      etag: "test-etag",
    });

    const { onRequestPost: handler } =
      await import("../../functions/api/watchlist-count-updates/index.js");

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

    expect(mockSetCount).not.toHaveBeenCalled();
  });
});
