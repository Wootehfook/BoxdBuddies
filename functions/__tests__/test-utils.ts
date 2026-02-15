// AI Generated: GitHub Copilot - 2025-09-18
import { vi } from "vitest";

export function mockFetch(impl: (url: string) => any) {
  const gfetch = ((globalThis as any).fetch = vi.fn());
  gfetch.mockImplementation(async (url: string) => impl(url));
  return gfetch;
}

export function createMockDb(prepares: { [key: string]: any }) {
  const prepareMock = vi.fn((sql: string) => {
    const up = (sql || "").toUpperCase();
    for (const k of Object.keys(prepares)) {
      if (up.includes(k.toUpperCase())) {
        return prepares[k];
      }
    }
    // default fallback: return an object with bind that returns objects with expected run/all/first
    return {
      bind: vi.fn(() => ({
        run: vi.fn().mockResolvedValue({}),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn().mockResolvedValue(null),
      })),
    };
  });
  return { prepare: prepareMock };
}

export function bindIncludesSentinel(fnMock: any) {
  if (
    !fnMock ||
    !fnMock.mock ||
    !fnMock.mock.calls ||
    fnMock.mock.calls.length === 0
  )
    return false;
  const args = fnMock.mock.calls[0];
  return args.some((a: any) => a === JSON.stringify(["Unknown"]));
}

export function createAdminSyncRequest(
  body: Record<string, unknown>,
  token = "test-secret"
) {
  return new Request("http://localhost/admin/tmdb-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export function createAdminEnv(
  db: any,
  overrides: Record<string, unknown> = {}
) {
  return {
    TMDB_API_KEY: "k",
    MOVIES_DB: db,
    ADMIN_SECRET: "test-secret",
    ...overrides,
  } as any;
}
