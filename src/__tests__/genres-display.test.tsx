// AI Generated: GitHub Copilot - 2025-09-20
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsPage } from "../components/ResultsPage";
import type { Movie, Friend } from "../types";

describe("ResultsPage genres display", () => {
  it("shows up to three genre badges for each movie", () => {
    const movies: Movie[] = [
      {
        id: 1,
        title: "Some Movie",
        year: 2020,
        genres: ["Action", "Comedy", "Sci-Fi", "Horror"],
        friendCount: 1,
        friendList: ["alice"],
        letterboxdSlug: "some-movie",
      },
    ];

    render(
      <ResultsPage
        movies={movies}
        selectedFriends={[] as Friend[]}
        onBack={() => {}}
        onNewComparison={() => {}}
      />
    );

    const badges = screen.getAllByText(/Action|Comedy|Sci-Fi/);
    expect(badges.length).toBeGreaterThanOrEqual(3);
    // Ensure the 4th genre is not shown
    expect(screen.queryByText("Horror")).toBeNull();
  });
});
