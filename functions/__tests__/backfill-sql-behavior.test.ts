// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect } from "vitest";

function isMissingGenreValue(genresValue: any) {
  if (genresValue === null || genresValue === undefined) return true;
  if (typeof genresValue === "string") {
    const trimmed = genresValue.trim();
    if (trimmed === "" || trimmed === "[]" || trimmed === "null") return true;
    // Check if contains any ASCII letter
    if (!/[A-Za-z]/.test(trimmed)) return true;
    return false;
  }
  return false;
}

describe("backfill missing predicate behaviour", () => {
  it("detects null/empty/[]/null as missing", () => {
    expect(isMissingGenreValue(null)).toBe(true);
    expect(isMissingGenreValue("")).toBe(true);
    expect(isMissingGenreValue("[]")).toBe(true);
    expect(isMissingGenreValue("null")).toBe(true);
  });

  it("detects numeric/garbage as missing", () => {
    expect(isMissingGenreValue("123")).toBe(true);
    expect(isMissingGenreValue('["123"]')).toBe(true);
    expect(isMissingGenreValue("[] 123")).toBe(true);
  });

  it("accepts normal genre arrays", () => {
    expect(isMissingGenreValue('["Action"]')).toBe(false);
    expect(isMissingGenreValue("Action")).toBe(false);
  });
});
