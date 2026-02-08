// AI Generated: GitHub Copilot - 2025-12-26
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("TMDB Sync - Current Year Mode", () => {
  let mockDB: any;
  let mockEnv: any;
  let mockPrepare: any;
  let mockBind: any;
  let mockRun: any;
  let mockFirst: any;

  beforeEach(() => {
    mockRun = vi.fn().mockResolvedValue({ success: true });
    mockFirst = vi.fn().mockResolvedValue(null);
    mockBind = vi.fn(() => ({ run: mockRun, first: mockFirst }));
    mockPrepare = vi.fn(() => ({ bind: mockBind }));

    mockDB = {
      prepare: mockPrepare,
    };

    mockEnv = {
      MOVIES_DB: mockDB,
      TMDB_API_KEY: "test-api-key",
      ADMIN_SECRET: "admin-sync-token",
      TMDB_GENRE_SENTINEL: "Unknown",
    };

    // Reset global fetch mock
    globalThis.fetch = vi.fn();
  });

  it("should require releaseYearStart parameter", async () => {
    const request = new Request("http://localhost/admin/tmdb-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-sync-token",
      },
      body: JSON.stringify({
        syncType: "current_year",
        releaseYearEnd: "2025-12-31",
        maxPages: 10,
      }),
    });

    // Dynamically import to get fresh module state
    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");
    const response = await onRequestPost({ request, env: mockEnv });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toContain("releaseYearStart");
  });

  it("should require releaseYearEnd parameter", async () => {
    const request = new Request("http://localhost/admin/tmdb-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-sync-token",
      },
      body: JSON.stringify({
        syncType: "current_year",
        releaseYearStart: "2025-01-01",
        maxPages: 10,
      }),
    });

    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");
    const response = await onRequestPost({ request, env: mockEnv });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toContain("releaseYearEnd");
  });

  it("should accept valid current_year sync request with date range", async () => {
    // Mock TMDB API responses
    const genresResponse = {
      genres: [
        { id: 28, name: "Action" },
        { id: 35, name: "Comedy" },
      ],
    };

    const discoverResponse = {
      page: 1,
      results: [
        {
          id: 12345,
          title: "Test Movie 2025",
          original_title: "Test Movie 2025",
          release_date: "2025-06-15",
          overview: "A test movie from 2025",
          poster_path: "/poster.jpg",
          backdrop_path: "/backdrop.jpg",
          vote_average: 7.5,
          vote_count: 100,
          popularity: 50.5,
          adult: false,
          genre_ids: [28, 35],
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    const movieDetailsResponse = {
      id: 12345,
      title: "Test Movie 2025",
      original_title: "Test Movie 2025",
      release_date: "2025-06-15",
      overview: "A test movie from 2025",
      poster_path: "/poster.jpg",
      backdrop_path: "/backdrop.jpg",
      vote_average: 7.5,
      vote_count: 100,
      popularity: 50.5,
      adult: false,
      genres: [
        { id: 28, name: "Action" },
        { id: 35, name: "Comedy" },
      ],
      runtime: 120,
      status: "Released",
      tagline: "Test tagline",
      credits: {
        crew: [{ job: "Director", name: "Test Director" }],
      },
    };

    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/genre/movie/list")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(genresResponse),
        });
      } else if (url.includes("/discover/movie")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(discoverResponse),
        });
      } else if (url.includes("/movie/12345")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(movieDetailsResponse),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const request = new Request("http://localhost/admin/tmdb-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-sync-token",
      },
      body: JSON.stringify({
        syncType: "current_year",
        releaseYearStart: "2025-01-01",
        releaseYearEnd: "2025-12-31",
        maxPages: 1,
      }),
    });

    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");
    const response = await onRequestPost({ request, env: mockEnv });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.syncType).toBe("current_year");
    expect(json.releaseYearStart).toBe("2025-01-01");
    expect(json.releaseYearEnd).toBe("2025-12-31");
    expect(json.synced).toBeGreaterThan(0);

    // Verify the discover endpoint was called with date filters
    const fetchCalls = (globalThis.fetch as any).mock.calls;
    const discoverCall = fetchCalls.find((call: any) =>
      call[0].includes("/discover/movie")
    );
    expect(discoverCall).toBeDefined();
    expect(discoverCall[0]).toContain("primary_release_date.gte=2025-01-01");
    expect(discoverCall[0]).toContain("primary_release_date.lte=2025-12-31");
  });

  it("should use TMDB_GENRE_SENTINEL for movies without genres", async () => {
    const genresResponse = { genres: [] };
    const discoverResponse = {
      page: 1,
      results: [
        {
          id: 99999,
          title: "No Genre Movie",
          original_title: "No Genre Movie",
          release_date: "2025-03-20",
          overview: "A movie without genres",
          poster_path: null,
          backdrop_path: null,
          vote_average: 5,
          vote_count: 10,
          popularity: 5,
          adult: false,
          genre_ids: [],
        },
      ],
      total_pages: 1,
      total_results: 1,
    };

    const movieDetailsResponse = {
      id: 99999,
      title: "No Genre Movie",
      original_title: "No Genre Movie",
      release_date: "2025-03-20",
      overview: "A movie without genres",
      poster_path: null,
      backdrop_path: null,
      vote_average: 5,
      vote_count: 10,
      popularity: 5,
      adult: false,
      genres: [],
      runtime: 90,
      status: "Released",
      tagline: "",
      credits: { crew: [] },
    };

    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/genre/movie/list")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(genresResponse),
        });
      } else if (url.includes("/discover/movie")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(discoverResponse),
        });
      } else if (url.includes("/movie/99999")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(movieDetailsResponse),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const request = new Request("http://localhost/admin/tmdb-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-sync-token",
      },
      body: JSON.stringify({
        syncType: "current_year",
        releaseYearStart: "2025-01-01",
        releaseYearEnd: "2025-12-31",
        maxPages: 1,
      }),
    });

    const { onRequestPost } = await import("../admin/tmdb-sync/index.js");
    await onRequestPost({ request, env: mockEnv });

    // Check that the movie was inserted with the sentinel genre
    const insertCalls = mockPrepare.mock.calls.filter((call: any) =>
      call[0].includes("INSERT OR REPLACE INTO tmdb_movies")
    );
    expect(insertCalls.length).toBeGreaterThan(0);

    const bindCalls = mockBind.mock.calls;
    const genreBindCall = bindCalls.find((call: any) => {
      const genresArg = call[12]; // genres is the 13th parameter (0-indexed)
      return genresArg && genresArg.includes("Unknown");
    });
    expect(genreBindCall).toBeDefined();
  });
});
