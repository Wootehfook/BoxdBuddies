// AI Generated: GitHub Copilot - 2025-09-22
import { describe, it, expect } from "vitest";

import { parseGenresToNames } from "../_lib/common.js";

describe("parseGenresToNames", () => {
  it("returns undefined for null/undefined and empty array", () => {
    expect(parseGenresToNames(null as unknown as undefined)).toBeUndefined();
    expect(
      parseGenresToNames(undefined as unknown as undefined)
    ).toBeUndefined();
    expect(parseGenresToNames([])).toBeUndefined();
  });

  it("parses a JSON string array of names", () => {
    const input = JSON.stringify(["Action", "Comedy"]);
    expect(parseGenresToNames(input)).toEqual(["Action", "Comedy"]);
  });

  it("returns array when given array of strings directly", () => {
    expect(parseGenresToNames(["Drama", "Romance"])).toEqual([
      "Drama",
      "Romance",
    ]);
  });

  it("maps array of objects with name -> names array", () => {
    const input = [
      { id: 28, name: "Action" },
      { id: 35, name: "Comedy" },
    ];
    expect(parseGenresToNames(input as unknown as string)).toEqual([
      "Action",
      "Comedy",
    ]);
  });

  it("filters out falsy objects or missing names", () => {
    const input = [
      { id: 18, name: "Drama" },
      null,
      { id: 99 },
      { id: 16, name: "Animation" },
    ];
    expect(parseGenresToNames(input as unknown as string)).toEqual([
      "Drama",
      "Animation",
    ]);
  });

  it("returns undefined for invalid JSON string input", () => {
    expect(parseGenresToNames("not-json")).toBeUndefined();
  });
});
