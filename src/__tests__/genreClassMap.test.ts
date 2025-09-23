// AI Generated: GitHub Copilot - 2025-09-20
import { describe, it, expect } from "vitest";
import getGenreClassSlug from "../utils/genreClassMap";

describe("getGenreClassSlug", () => {
  it("maps canonical genres to slugs", () => {
    expect(getGenreClassSlug("Action")).toBe("action");
    expect(getGenreClassSlug("Science Fiction")).toBe("scifi");
    expect(getGenreClassSlug("Sci-Fi")).toBe("scifi");
    expect(getGenreClassSlug("Romcom")).toBe("romance");
  });

  it("slugifies unknown genres", () => {
    // neo-noir is mapped to 'crime' in the canonical aliases
    expect(getGenreClassSlug("Neo-Noir")).toBe("crime");
    expect(getGenreClassSlug("  weird / genre!  ")).toBe("weird-genre");
  });
});
