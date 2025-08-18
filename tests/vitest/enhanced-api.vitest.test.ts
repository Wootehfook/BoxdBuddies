// AI Generated: GitHub Copilot - 2025-01-18
// Vitest tests for enhanced API endpoints

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment for testing
const mockEnv = {
  TMDB_API_KEY: 'test-api-key',
  MOVIES_DB: {
    prepare: vi.fn(),
  },
  MOVIES_KV: {
    get: vi.fn(),
    put: vi.fn(),
  }
};

// Mock fetch for TMDB API calls
global.fetch = vi.fn();

// Mock cache API
global.caches = {
  default: {
    match: vi.fn(),
    put: vi.fn(),
  }
};

describe("Enhanced API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockClear();
  });

  describe("Enhanced Health Check", () => {
    it("should return comprehensive health status", async () => {
      // Mock successful database query
      const mockDbResult = { success: true, results: [{ test: 1 }] };
      const mockPreparedStatement = {
        all: vi.fn().mockResolvedValue(mockDbResult),
      };
      mockEnv.MOVIES_DB.prepare.mockReturnValue(mockPreparedStatement);

      // Mock successful KV operations
      mockEnv.MOVIES_KV.put.mockResolvedValue(undefined);
      mockEnv.MOVIES_KV.get.mockResolvedValue('test_value');

      // Mock successful TMDB API call
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      // Import and test the health endpoint
      const { onRequest } = await import("../../functions/api/health.ts");
      const mockRequest = new Request('https://test.com/api/health');
      const context = { request: mockRequest, env: mockEnv };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.services.database.status).toBe('healthy');
      expect(data.services.kv_storage.status).toBe('healthy');
      expect(data.services.tmdb_api.status).toBe('healthy');
    });

    it("should handle service failures gracefully", async () => {
      // Mock database failure
      const mockPreparedStatement = {
        all: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      mockEnv.MOVIES_DB.prepare.mockReturnValue(mockPreparedStatement);

      // Mock KV failure
      mockEnv.MOVIES_KV.put.mockRejectedValue(new Error('KV error'));

      // Mock TMDB API failure
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 503,
      });

      const { onRequest } = await import("../../functions/api/health.ts");
      const mockRequest = new Request('https://test.com/api/health');
      const context = { request: mockRequest, env: mockEnv };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('error');
      expect(data.services.database.status).toBe('error');
      expect(data.services.kv_storage.status).toBe('error');
      expect(data.services.tmdb_api.status).toBe('degraded');
    });
  });

  describe("Popular Movies Endpoint", () => {
    it("should return popular movies from database when available", async () => {
      const mockMovies = [
        { 
          id: 1, 
          title: 'Test Movie', 
          year: 2023, 
          poster_path: '/test.jpg',
          popularity: 100.5,
          overview: 'Test overview',
          vote_average: 7.5
        }
      ];

      const mockDbResult = { success: true, results: mockMovies };
      const mockPreparedStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue(mockDbResult),
      };
      mockEnv.MOVIES_DB.prepare.mockReturnValue(mockPreparedStatement);

      // Mock cache miss
      global.caches.default.match.mockResolvedValue(null);
      mockEnv.MOVIES_KV.get.mockResolvedValue(null);

      const { onRequestGet } = await import("../../functions/api/popular.js");
      const mockRequest = new Request('https://test.com/api/popular?page=1');
      const context = { request: mockRequest, env: mockEnv };

      const response = await onRequestGet(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.movies).toHaveLength(1);
      expect(data.movies[0].title).toBe('Test Movie');
      expect(data.movies[0].poster_url).toBeTruthy();
    });
  });

  describe("Batch Enhancement Endpoint", () => {
    it("should enhance multiple movies with rate limiting", async () => {
      const inputMovies = [
        { title: 'Movie 1', year: 2023 },
        { title: 'Movie 2', year: 2022 },
      ];

      // Mock database responses
      const mockPreparedStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null), // No local results
      };
      mockEnv.MOVIES_DB.prepare.mockReturnValue(mockPreparedStatement);

      // Mock TMDB API responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [
            { 
              id: 1, 
              title: 'Movie 1', 
              release_date: '2023-01-01',
              poster_path: '/test1.jpg',
              overview: 'Test overview 1',
              vote_average: 7.5
            }
          ]
        })
      });

      const { onRequestPost } = await import("../../functions/api/enhance/index.js");
      const mockRequest = new Request('https://test.com/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ movies: inputMovies }),
        headers: { 'Content-Type': 'application/json' }
      });
      const context = { request: mockRequest, env: mockEnv };

      const response = await onRequestPost(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.enhanced).toBeGreaterThan(0);
      expect(data.movies).toBeDefined();
    });

    it("should reject requests with too many movies", async () => {
      const tooManyMovies = Array(51).fill({ title: 'Test Movie', year: 2023 });

      const { onRequestPost } = await import("../../functions/api/enhance/index.js");
      const mockRequest = new Request('https://test.com/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ movies: tooManyMovies }),
        headers: { 'Content-Type': 'application/json' }
      });
      const context = { request: mockRequest, env: mockEnv };

      const response = await onRequestPost(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe("Movie Details Endpoint", () => {
    it("should return movie details with credits", async () => {
      const movieId = 550;

      // Mock TMDB API response with credits
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 550,
          title: 'Fight Club',
          release_date: '1999-10-15',
          poster_path: '/fight-club.jpg',
          overview: 'A great movie',
          vote_average: 8.8,
          runtime: 139,
          genres: [{ id: 18, name: 'Drama' }],
          credits: {
            cast: [
              { id: 1, name: 'Brad Pitt', character: 'Tyler Durden', order: 0 }
            ],
            crew: [
              { id: 2, name: 'David Fincher', job: 'Director' }
            ]
          }
        })
      });

      // Mock cache miss
      global.caches.default.match.mockResolvedValue(null);
      mockEnv.MOVIES_KV.get.mockResolvedValue(null);

      const { onRequestGet } = await import("../../functions/api/movie/[id].js");
      const mockRequest = new Request('https://test.com/api/movie/550');
      const context = { 
        request: mockRequest, 
        env: mockEnv,
        params: { id: '550' }
      };

      const response = await onRequestGet(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Fight Club');
      expect(data.director).toBe('David Fincher');
      expect(data.credits.cast).toHaveLength(1);
      expect(data.credits.crew).toHaveLength(1);
    });

    it("should return 404 for non-existent movie", async () => {
      // Mock TMDB API 404 response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      // Mock cache miss
      global.caches.default.match.mockResolvedValue(null);
      mockEnv.MOVIES_KV.get.mockResolvedValue(null);

      const { onRequestGet } = await import("../../functions/api/movie/[id].js");
      const mockRequest = new Request('https://test.com/api/movie/999999');
      const context = { 
        request: mockRequest, 
        env: mockEnv,
        params: { id: '999999' }
      };

      const response = await onRequestGet(context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('MOVIE_NOT_FOUND');
    });
  });
});