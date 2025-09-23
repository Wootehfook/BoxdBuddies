// AI Generated: GitHub Copilot - 2025-09-22
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsPage } from "../components/ResultsPage";
import type { Movie, Friend } from "../types";

describe("ResultsPage genre badges - keyboard interaction", () => {
  it("toggles filter when pressing Enter/Space on a badge", async () => {
    const user = userEvent.setup();
    const movies: Movie[] = [
      {
        id: 1,
        title: "Action Movie",
        year: 2020,
        genres: ["Action"],
        friendCount: 1,
        friendList: ["alice"],
        letterboxdSlug: "action-movie",
      },
      {
        id: 2,
        title: "RomCom",
        year: 2021,
        genres: ["Romance", "Comedy"],
        friendCount: 1,
        friendList: ["bob"],
        letterboxdSlug: "romcom",
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

    // Both movies visible initially
    expect(screen.getByText(/Action Movie/)).toBeTruthy();
    expect(screen.getByText(/RomCom/)).toBeTruthy();

    const actionBadge = screen.getByRole("button", { name: /Action/i });

    // Focus and press Enter to select
    actionBadge.focus();
    await user.keyboard("{Enter}");

    // Now only the Action movie should remain
    expect(screen.getByText(/Action Movie/)).toBeTruthy();
    expect(screen.queryByText(/RomCom/)).toBeNull();

    // Badge should reflect selected state via class
    expect(screen.getByRole("button", { name: /Action/i })).toHaveClass(
      "selected"
    );

    // Press Space to unselect
    const actionBadge2 = screen.getByRole("button", { name: /Action/i });
    actionBadge2.focus();
    await user.keyboard(" ");

    // Both movies visible again
    expect(screen.getByText(/Action Movie/)).toBeTruthy();
    expect(screen.getByText(/RomCom/)).toBeTruthy();
  });
});
