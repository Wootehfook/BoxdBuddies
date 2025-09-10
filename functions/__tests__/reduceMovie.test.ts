// AI Generated: GitHub Copilot - 2025-09-09
import { describe, it, expect } from "vitest";

import { reduceMovie } from "../_lib/common.js";

describe("reduceMovie", () => {
  it("returns poster_path as relative path when provided by TMDB", () => {
    const tmdb = {
      id: 1,
      title: "Test",
      release_date: "2020-01-01",
      poster_path: "/abc123.jpg",
      overview: "x",
      vote_average: 7.5,
      runtime: 100,
    } as any;

    const reduced = reduceMovie(tmdb as any);
    expect(reduced.poster_path).toBe("/abc123.jpg");
  });

  it("returns null for missing poster_path", () => {
    const tmdb = {
      id: 2,
      title: "NoPoster",
      release_date: "2021-01-01",
      poster_path: null,
      overview: "x",
      vote_average: 6.5,
      runtime: 90,
    } as any;

    const reduced = reduceMovie(tmdb as any);
    expect(reduced.poster_path).toBeNull();
  });
});
