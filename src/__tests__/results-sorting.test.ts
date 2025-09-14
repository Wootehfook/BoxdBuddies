import { describe, it, expect } from "vitest";
import { sortMovies } from "../utils/filterSort";
import type { Movie } from "../types";

const movies: Movie[] = [
  {
    id: 1,
    title: "B Movie",
    year: 2001,
    vote_average: 7.1,
    friendCount: 2,
    friendList: [],
  },
  {
    id: 2,
    title: "A Movie",
    year: 1999,
    vote_average: 8.5,
    friendCount: 5,
    friendList: [],
  },
  {
    id: 3,
    title: "C Movie",
    year: 0,
    vote_average: undefined,
    friendCount: 0,
    friendList: [],
  },
];

describe("sortMovies", () => {
  it("sorts by title asc", () => {
    const r = sortMovies(movies, "title", "asc");
    expect(r.map((m) => m.id)).toEqual([2, 1, 3]);
  });

  it("sorts by year desc and pushes unknowns to end", () => {
    const r = sortMovies(movies, "year", "desc");
    expect(r.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("sorts by rating desc with undefined treated as 0", () => {
    const r = sortMovies(movies, "rating", "desc");
    expect(r.map((m) => m.id)).toEqual([2, 1, 3]);
  });
});
