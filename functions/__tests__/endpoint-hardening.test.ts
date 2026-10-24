// AI Generated: Claude Opus 5.5 - 2026-10-24
// Regression tests for the 2026-10 security hardening of public endpoints.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import * as cacheModule from "../letterboxd/cache/index";
import * as friendsModule from "../letterboxd/friends/index";
import * as countModule from "../letterboxd/watchlist-count/index";
import * as avatarModule from "../letterboxd/avatar-proxy/index";
import * as searchModule from "../search/index";
import * as userRouteModule from "../letterboxd/[username]";
import * as legacyCompare from "../compare/index";
import * as letterboxdCompare from "../letterboxd/compare/index";

const post = (
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
) =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

/** D1 mock that records every SQL statement and returns empty results. */
function makeDb() {
  const sql: string[] = [];
  const stmt = {
    bind: () => stmt,
    first: async () => null,
    all: async () => ({ results: [] }),
    run: async () => ({ meta: { changes: 0 } }),
  };
  return {
    sql,
    db: {
      prepare: (q: string) => {
        sql.push(q);
        return stmt;
      },
    },
  };
}

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(
      new Response("<html></html>", { status: 200 })
    ) as unknown as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("/letterboxd/cache", () => {
  it("POST rejects invalid usernames before touching DB or network", async () => {
    const { db, sql } = makeDb();
    const res = await cacheModule.onRequestPost({
      request: post("https://boxdbud.io/letterboxd/cache", {
        username: "x/../../film",
      }),
      env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
    });
    expect(res.status).toBe(400);
    expect(sql).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("GET rejects invalid usernames", async () => {
    const { db, sql } = makeDb();
    const res = await cacheModule.onRequestGet({
      request: new Request(
        "https://boxdbud.io/letterboxd/cache?username=" +
          encodeURIComponent("a?b=c")
      ),
      env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
    });
    expect(res.status).toBe(400);
    expect(sql).toHaveLength(0);
  });

  it("ignores public forceRefresh: a cache hit is served without scraping", async () => {
    const now = Date.now();
    const cachedRow = {
      friends_data: JSON.stringify([{ username: "bob" }]),
      last_updated: now,
      expires_at: now + 60_000,
    };
    const stmt = {
      bind: () => stmt,
      first: async () => cachedRow,
      all: async () => ({ results: [cachedRow] }),
      run: async () => ({ meta: { changes: 0 } }),
    };
    const res = await cacheModule.onRequestPost({
      request: post("https://boxdbud.io/letterboxd/cache", {
        username: "alice",
        forceRefresh: true,
      }),
      env: {
        MOVIES_DB: { prepare: () => stmt },
        TMDB_API_KEY: "k",
        ADMIN_SECRET: "admin",
      } as any,
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.cached).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("/letterboxd/friends", () => {
  it("validates the username BEFORE any cache read", async () => {
    const { db, sql } = makeDb();
    const res = await friendsModule.onRequestPost({
      request: post("https://boxdbud.io/letterboxd/friends", {
        username: "bad name",
      }),
      env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
    });
    expect(res.status).toBe(400);
    expect(sql).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("handles a non-JSON body with 400, not a leaked parser error", async () => {
    const { db } = makeDb();
    const res = await friendsModule.onRequestPost({
      request: post("https://boxdbud.io/letterboxd/friends", "{not json"),
      env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
    });
    expect(res.status).toBe(400);
  });
});

describe("/letterboxd/watchlist-count", () => {
  it("does not reflect attacker-controlled input as JSON keys", async () => {
    const { db } = makeDb();
    const evil = "<script>alert(1)</script>";
    const res = await countModule.onRequestPost({
      request: post("https://boxdbud.io/letterboxd/watchlist-count", {
        usernames: [evil],
      }),
      env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
    });
    const text = await res.text();
    expect(text).not.toContain("<script>");
    expect(JSON.parse(text).errors.invalid_0).toBe("Invalid username format");
  });

  it("caps work at 100 names per request", async () => {
    const { db } = makeDb();
    const usernames = Array.from({ length: 105 }, (_, i) => `user${i}`);
    // Make every lookup fail fast so the test does not depend on scraping.
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 404 })) as any;
    // The endpoint politely waits ~1s between Letterboxd requests; use fake
    // timers so 100 lookups don't take 100 real seconds.
    vi.useFakeTimers();
    try {
      const pending = countModule.onRequestPost({
        request: post("https://boxdbud.io/letterboxd/watchlist-count", {
          usernames,
        }),
        env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
      });
      await vi.runAllTimersAsync();
      const data = await (await pending).json();
      for (let i = 100; i < 105; i++) {
        expect(data.errors[`user${i}`]).toBe(
          "Too many usernames in one request"
        );
      }
      // Only the first 100 names may reach Letterboxd.
      const scraped = new Set(
        (globalThis.fetch as any).mock.calls.map(
          (c: any[]) => String(c[0]).split("/")[3]
        )
      );
      for (let i = 100; i < 105; i++)
        expect(scraped.has(`user${i}`)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("/letterboxd/[username]", () => {
  it("rejects invalid usernames before cache or scrape", async () => {
    const { db, sql } = makeDb();
    const res = await userRouteModule.onRequestGet({
      request: new Request("https://boxdbud.io/letterboxd/x"),
      env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
      params: { username: "a..b?c" },
    });
    expect(res.status).toBe(400);
    expect(sql).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("legacy comparison endpoints", () => {
  it.each([
    ["/compare", legacyCompare],
    ["/letterboxd/compare", letterboxdCompare],
  ])(
    "%s rejects invalid and non-string usernames with 400",
    async (path, mod) => {
      const { db } = makeDb();
      for (const body of [
        { usernames: ["alice", "../x"] },
        { usernames: [1, 2] },
        { username: "alice", friends: [{}] },
      ]) {
        const res = await (mod as any).onRequestPost({
          request: post(`https://boxdbud.io${path}`, body),
          env: { MOVIES_DB: db, TMDB_API_KEY: "k" },
        });
        expect(res.status).toBe(400);
      }
      expect(globalThis.fetch).not.toHaveBeenCalled();
    }
  );
});

describe("/letterboxd/avatar-proxy", () => {
  const proxy = (target: string) =>
    avatarModule.onRequest({
      request: new Request(
        "https://boxdbud.io/letterboxd/avatar-proxy?url=" +
          encodeURIComponent(target)
      ),
      env: { MOVIES_DB: {} },
    });
  const AVATAR = "https://a.ltrbxd.com/resized/avatar/upload/x/y/z.jpg";

  it("rejects non-Letterboxd hosts", async () => {
    const res = await proxy("https://evil.example/a.jpg");
    expect(res.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("refuses content whose final (post-redirect) URL left the allowlist", async () => {
    const redirected = new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    });
    Object.defineProperty(redirected, "url", {
      value: "https://evil.example/a.jpg",
    });
    globalThis.fetch = vi.fn().mockResolvedValue(redirected) as any;
    const res = await proxy(AVATAR);
    expect(res.headers.get("Content-Type")).toBe("image/gif"); // fallback pixel
  });

  it("relays when the final URL stays on an allowed host", async () => {
    const ok = new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/png" },
    });
    Object.defineProperty(ok, "url", {
      value: "https://s.ltrbxd.com/static/img/avatar80.png",
    });
    globalThis.fetch = vi.fn().mockResolvedValue(ok) as any;
    const res = await proxy(AVATAR);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });

  it("refuses to relay non-image upstream content", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("<script>x</script>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })
    ) as any;
    const res = await proxy(AVATAR);
    expect(res.headers.get("Content-Type")).toBe("image/gif"); // fallback pixel
    expect(await res.text()).not.toContain("<script>");
  });

  it("refuses SVG (scriptable) images", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("<svg/>", {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      })
    ) as any;
    const res = await proxy(AVATAR);
    expect(res.headers.get("Content-Type")).toBe("image/gif");
  });

  it("relays genuine images with nosniff and no wildcard CORS", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })
    ) as any;
    const res = await proxy(AVATAR);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("rejects oversized images", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(3 * 1024 * 1024), {
        status: 200,
        headers: { "content-type": "image/png" },
      })
    ) as any;
    const res = await proxy(AVATAR);
    expect(res.headers.get("Content-Type")).toBe("image/gif");
  });
});

describe("/search", () => {
  const search = (qs: string) => {
    const { db, sql } = makeDb();
    return {
      sql,
      res: searchModule.onRequestGet({
        request: new Request(`https://boxdbud.io/search?${qs}`),
        env: { MOVIES_DB: db, TMDB_API_KEY: "k" } as any,
      }),
    };
  };

  it.each([
    "q=a",
    `q=${"x".repeat(101)}`,
    "q=matrix&page=0",
    "q=matrix&page=-3",
    "q=matrix&page=abc",
    "q=matrix&page=1.5",
    "q=matrix&page=51",
  ])("rejects %s without querying D1", async (qs) => {
    const { res, sql } = search(qs);
    expect((await res).status).toBe(400);
    expect(sql).toHaveLength(0);
  });

  it("accepts a normal query", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [], total_pages: 1 }), {
        status: 200,
      })
    ) as any;
    const { res } = search("q=matrix&page=2");
    expect((await res).status).toBe(200);
  });
});
