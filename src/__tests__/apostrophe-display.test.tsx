// AI Generated: GitHub Copilot - 2025-09-13
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsPage } from "../components/ResultsPage";
import type { Movie, Friend } from "../types";

describe("ResultsPage apostrophe display", () => {
  it("renders titles with apostrophes without stray ampersands", () => {
    const movies: Movie[] = [
      {
        id: 1,
        title: "The World&#039;s End",
        year: 2013,
        // poster_path omitted
        friendCount: 1,
        friendList: ["alice"],
        letterboxdSlug: "the-worlds-end",
      },
      {
        id: 2,
        title: "The World&amp;#039;s End",
        year: 2013,
        // poster_path omitted
        friendCount: 1,
        friendList: ["bob"],
        letterboxdSlug: "the-worlds-end",
      },
      {
        id: 3,
        title: "The World&'s End",
        year: 2013,
        // poster_path omitted
        friendCount: 1,
        friendList: ["carol"],
        letterboxdSlug: "the-worlds-end",
      },
      {
        id: 4,
        title: "The World’s End", // curly apostrophe
        year: 2013,
        // poster_path omitted
        friendCount: 1,
        friendList: ["dave"],
        letterboxdSlug: "the-worlds-end",
      },
    ];

    const { container } = render(
      <ResultsPage
        movies={movies}
        selectedFriends={[] as Friend[]}
        onBack={() => {}}
        onNewComparison={() => {}}
      />
    );

    // Should show normalized title text without stray ampersands
    const headings = screen.getAllByRole("heading", { level: 3 });
    const texts = headings.map((h) => h.textContent || "");
    for (const t of texts) {
      expect(t.includes("World&'s")).toBe(false);
    }
    // And should contain at least one properly normalized instance
    const combined = (container.textContent || "").replace(/\s+/g, " ");
    expect(combined).toContain("The World's End");
  });
});
