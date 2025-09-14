import { describe, it, expect } from "vitest";
import {
  filterMovies,
  getUniqueGenres,
  getYearBounds,
} from "../utils/filterSort";
import type { Movie } from "../types";

const movies: Movie[] = [
  {
    id: 1,
    title: "The Ring",
    year: 2002,
    genres: ["Horror"],
    friendCount: 2,
    friendList: [],
  },
  {
    id: 2,
    title: "Ringu",
    year: 1998,
    genres: ["Horror", "Mystery"],
    friendCount: 1,
    friendList: [],
  },
  {
    id: 3,
    title: "A Drama",
    year: 2010,
    genres: ["Drama"],
    friendCount: 3,
    friendList: [],
  },
  {
    id: 4,
    title: "Unknown Year",
    year: 0,
    genres: ["Drama"],
    friendCount: 0,
    friendList: [],
  },
];

describe("filterMovies", () => {
  it("finds by title substring case-insensitive", () => {
    const res = filterMovies(movies, {
      titleQuery: "ring",
      selectedGenres: [],
      yearMin: null,
      yearMax: null,
      sortBy: "title",
      sortDir: "asc",
    });
    expect(res.map((m) => m.id)).toEqual([1, 2]);
  });

  it("filters by genre (OR semantics)", () => {
    const res = filterMovies(movies, {
      titleQuery: "",
      selectedGenres: ["Drama"],
      yearMin: null,
      yearMax: null,
      sortBy: "title",
      sortDir: "asc",
    });
    expect(res.map((m) => m.id).sort((a, b) => a - b)).toEqual([3, 4]);
  });

  it("filters by year range inclusive", () => {
    const res = filterMovies(movies, {
      titleQuery: "",
      selectedGenres: [],
      yearMin: 2000,
      yearMax: 2005,
      sortBy: "title",
      sortDir: "asc",
    });
    expect(res.map((m) => m.id)).toEqual([1]);
  });
});

describe("helpers", () => {
  it("returns unique genres", () => {
    const g = getUniqueGenres(movies);
    expect(g).toEqual(
      ["Drama", "Horror", "Mystery"].sort((a, b) => a.localeCompare(b))
    );
  });

  it("computes year bounds ignoring unknowns", () => {
    const b = getYearBounds(movies);
    expect(b.min).toBe(1998);
    expect(b.max).toBe(2010);
  });
});
