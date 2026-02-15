// AI Generated: GitHub Copilot - 2025-09-18
import { vi } from "vitest";

export function mockFetch(impl: (url: string) => any) {
  const gfetch = ((globalThis as any).fetch = vi.fn());
  gfetch.mockImplementation(async (url: string) => impl(url));
  return gfetch;
}

export function okJson(payload: Record<string, unknown>) {
  return {
    ok: true,
    json: async () => payload,
  };
}

export function createTmdbFetchMock(
  responders: Array<[string, any]>,
  fallback: any = { ok: false, status: 404 }
) {
  return async (url: string) => {
    for (const [needle, response] of responders) {
      if (url.includes(needle)) {
        return response;
      }
    }
    return fallback;
  };
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

export async function runAdminSync(
  body: Record<string, unknown>,
  db: any,
  overrides: Record<string, unknown> = {}
) {
  const { onRequestPost } = await import("../admin/tmdb-sync/index.js");
  const req = createAdminSyncRequest(body);
  const env = createAdminEnv(db, overrides);
  const res = await onRequestPost({ request: req, env } as any);
  const json = await res.json();
  return { res, json, env, req };
}

export async function runBackfillMissingSync(db: any) {
  return runAdminSync(
    {
      syncType: "backfillGenres",
      mode: "missing",
      limit: 10,
    },
    db
  );
}

export async function runChangesSync(
  db: any,
  startDate: string = "2025-01-01"
) {
  return runAdminSync(
    {
      syncType: "changes",
      startDate,
    },
    db
  );
}

export async function runPagesSync(
  db: any,
  startPage: number = 1,
  maxPages: number = 1
) {
  return runAdminSync(
    {
      syncType: "pages",
      startPage,
      maxPages,
    },
    db
  );
}
