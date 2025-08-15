// AI Generated: GitHub Copilot - 2025-08-15
// Vitest-based test for the VITE_TMDB_BACKEND path using import.meta.env natively.
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios.get
vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Helper to import the service fresh with a specific flag
async function loadServiceWithFlag(flag: boolean) {
  // @ts-expect-error vitest allows writing to import.meta.env in test env
  import.meta.env.VITE_TMDB_BACKEND = flag ? "true" : "false";
  // Ensure dev mode for log gating
  // @ts-expect-error ensure DEV truthy in test
  import.meta.env.DEV = true;
  const mod = await import("./tmdbService");
  return mod.tmdbService;
}

describe("tmdbService (vitest) minimal backend path", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses backend minimal lookup when flag enabled and returns single result", async () => {
    const svc = await loadServiceWithFlag(true);
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tmdb_id: 603,
      title: "The Matrix",
      year: 1999,
      director: "Lana Wachowski",
      poster_path: "/abc.jpg",
    });

    svc.setApiKey("key");
    const res = await svc.searchMovies("The Matrix", 1);

    const axios = (await import("axios")).default as {
      get: ReturnType<typeof vi.fn>;
    };
    expect(axios.get).not.toHaveBeenCalled();
    expect(res.totalPages).toBe(1);
    expect(res.movies[0]).toMatchObject({
      id: 603,
      title: "The Matrix",
      year: 1999,
    });
  });

  it("falls back to axios when backend minimal lookup fails", async () => {
    const svc = await loadServiceWithFlag(true);
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("boom")
    );

    const axios = (await import("axios")).default as {
      get: ReturnType<typeof vi.fn>;
    };
    axios.get.mockResolvedValue({
      data: {
        page: 1,
        total_pages: 1,
        results: [
          {
            id: 1,
            title: "Some Movie",
            release_date: "2000-01-01",
            overview: "",
            poster_path: null,
            backdrop_path: null,
            vote_average: 0,
            vote_count: 0,
            genre_ids: [],
          },
        ],
      },
    });

    svc.setApiKey("key");
    const res = await svc.searchMovies("Anything", 1);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(res.movies).toHaveLength(1);
    expect(res.movies[0].title).toBe("Some Movie");
  });
});
