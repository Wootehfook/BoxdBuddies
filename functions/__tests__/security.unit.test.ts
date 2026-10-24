// AI Generated: Claude Opus 5.5 - 2026-10-24
// Unit tests for functions/_lib/security.ts and functions/_middleware.ts
import { describe, it, expect } from "vitest";
import {
  InputError,
  extractBearerToken,
  isAdminRequest,
  isAllowedOrigin,
  isValidUsername,
  parseUsername,
  parseUsernameList,
  secretEquals,
} from "../_lib/security";
import { onRequest as middleware } from "../_middleware";

describe("parseUsername / isValidUsername", () => {
  it.each(["alice", "Bob_99", "a-b", "x", "a".repeat(50), "  padded  "])(
    "accepts %j",
    (name) => {
      expect(isValidUsername(name)).toBe(true);
      expect(parseUsername(name)).toBe(name.trim());
    }
  );

  it.each([
    "",
    " ",
    "a".repeat(51),
    "../etc",
    "user/watchlist",
    "user?x=1",
    "user#frag",
    "user name",
    "@evil.com",
    "user\\x",
    "ünïcode",
    "user%2f",
  ])("rejects %j", (name) => {
    expect(isValidUsername(name)).toBe(false);
    expect(() => parseUsername(name)).toThrow(InputError);
  });

  it.each([null, undefined, 1, {}, [], true])("rejects non-string %j", (v) => {
    expect(isValidUsername(v)).toBe(false);
    expect(() => parseUsername(v)).toThrow(InputError);
  });

  it("preserves case (downstream display relies on it)", () => {
    expect(parseUsername("WooT")).toBe("WooT");
  });
});

describe("parseUsernameList", () => {
  it("accepts { username, friends }", () => {
    expect(parseUsernameList({ username: "a", friends: ["b", "c"] })).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("accepts legacy { usernames }", () => {
    expect(parseUsernameList({ usernames: ["a", "b"] })).toEqual(["a", "b"]);
  });

  it("dedupes case-insensitively, keeping first spelling", () => {
    expect(parseUsernameList({ usernames: ["Alice", "alice", "bob"] })).toEqual(
      ["Alice", "bob"]
    );
  });

  it("rejects fewer than 2 distinct users", () => {
    expect(() => parseUsernameList({ usernames: ["a", "A"] })).toThrow(
      /At least 2/
    );
  });

  it("rejects more than 10 users instead of silently truncating", () => {
    const usernames = Array.from({ length: 11 }, (_, i) => `u${i}`);
    expect(() => parseUsernameList({ usernames })).toThrow(/At most 10/);
  });

  it("rejects any invalid entry rather than dropping it", () => {
    expect(() =>
      parseUsernameList({ usernames: ["alice", "bad/name"] })
    ).toThrow(InputError);
    expect(() => parseUsernameList({ usernames: [1, 2] })).toThrow(InputError);
  });

  it.each([null, "str", 5, {}, { friends: ["a"] }, { usernames: "a,b" }])(
    "rejects malformed body %j",
    (body) => {
      expect(() => parseUsernameList(body)).toThrow(InputError);
    }
  );
});

describe("secretEquals / admin auth", () => {
  it("matches identical secrets only", async () => {
    expect(await secretEquals("s3cret", "s3cret")).toBe(true);
    expect(await secretEquals("s3cret", "s3cres")).toBe(false);
    expect(await secretEquals("s3cret", "s3cret-longer")).toBe(false);
  });

  it("never matches empty/missing values", async () => {
    expect(await secretEquals("", "")).toBe(false);
    expect(await secretEquals(null, "x")).toBe(false);
    expect(await secretEquals("x", undefined)).toBe(false);
  });

  it("extracts Bearer and raw tokens", () => {
    expect(extractBearerToken("Bearer abc")).toBe("abc");
    expect(extractBearerToken("bearer   abc ")).toBe("abc");
    expect(extractBearerToken("abc")).toBe("abc");
    expect(extractBearerToken("")).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
  });

  it("isAdminRequest requires a configured secret", async () => {
    const req = new Request("https://x/", {
      headers: { Authorization: "Bearer topsecret" },
    });
    expect(await isAdminRequest(req, "topsecret")).toBe(true);
    expect(await isAdminRequest(req, "other")).toBe(false);
    expect(await isAdminRequest(req, undefined)).toBe(false);
    expect(await isAdminRequest(new Request("https://x/"), "topsecret")).toBe(
      false
    );
  });
});

describe("isAllowedOrigin", () => {
  it.each([
    "https://boxdbud.io",
    "https://www.boxdbud.io",
    "http://localhost:5173",
    "http://127.0.0.1:8788",
    "https://boxdbud.pages.dev",
    "https://abc123.boxdbud.pages.dev",
  ])("allows %s", (o) => expect(isAllowedOrigin(o)).toBe(true));

  it.each([
    null,
    "",
    "null",
    "https://evil.example",
    "https://boxdbud.io.evil.example",
    "https://evilboxdbud.io",
    "http://boxdbud.io",
    "https://x.otherproject.pages.dev",
    "https://boxdbud.pages.dev.evil.example",
    "http://localhost.evil.example",
  ])("blocks %j", (o) => expect(isAllowedOrigin(o)).toBe(false));
});

describe("root middleware", () => {
  const call = async (
    init: RequestInit & { origin?: string },
    handler: () => Promise<Response>
  ) => {
    const headers = new Headers(init.headers);
    if (init.origin) headers.set("Origin", init.origin);
    const request = new Request("https://boxdbud.io/api/x", {
      ...init,
      headers,
    });
    return middleware({ request, next: handler });
  };

  const wildcardHandler = async () =>
    new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  it("replaces handler wildcard CORS with the allowed origin", async () => {
    const res = await call({ origin: "https://boxdbud.io" }, wildcardHandler);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://boxdbud.io"
    );
    expect(res.headers.get("Vary")).toMatch(/Origin/);
  });

  it("strips CORS entirely for disallowed origins", async () => {
    const res = await call({ origin: "https://evil.example" }, wildcardHandler);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(res.status).toBe(200); // same-origin/curl callers still work
  });

  it("answers preflight itself without invoking the handler", async () => {
    let called = false;
    const res = await call(
      { method: "OPTIONS", origin: "https://boxdbud.io" },
      async () => {
        called = true;
        return new Response("nope");
      }
    );
    expect(called).toBe(false);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://boxdbud.io"
    );
  });

  it("preflight from a foreign origin gets no CORS grant", async () => {
    const res = await call(
      { method: "OPTIONS", origin: "https://evil.example" },
      wildcardHandler
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("adds security headers without clobbering Content-Type", async () => {
    const res = await call({}, wildcardHandler);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Content-Security-Policy")).toMatch(
      /frame-ancestors 'none'/
    );
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("turns uncaught exceptions into a generic 500", async () => {
    const res = await call({}, async () => {
      throw new Error("db password is hunter2");
    });
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("hunter2");
    expect(JSON.parse(text).error).toBe("Internal server error");
  });

  it("works on immutable (fetch-style) responses", async () => {
    const immutable = Response.redirect("https://boxdbud.io/", 302);
    const res = await call(
      { origin: "https://boxdbud.io" },
      async () => immutable
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });
});
