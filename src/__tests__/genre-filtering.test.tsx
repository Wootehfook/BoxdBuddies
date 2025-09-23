// AI Generated: GitHub Copilot - 2025-09-20
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsPage } from "../components/ResultsPage";
import type { Movie, Friend } from "../types";

describe("ResultsPage genre filtering", () => {
  it("filters movies when genre badge clicked and clears when Clear pressed", async () => {
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

    // Initially both movie titles present (allow for year suffix)
    expect(screen.getByText(/Action Movie/)).toBeTruthy();
    expect(screen.getByText(/RomCom/)).toBeTruthy();

    // Click the Action badge (accessible name includes the word 'genre')
    const actionBadge = screen.getByRole("button", { name: /Action/i });
    await user.click(actionBadge);

    // Should only show Action Movie
    expect(screen.getByText(/Action Movie/)).toBeTruthy();
    expect(screen.queryByText(/RomCom/)).toBeNull();

    // Click Clear
    const clearBtn = screen.getByRole("button", { name: /Clear/i });
    await user.click(clearBtn);

    // Both movies should be present again
    expect(screen.getByText(/Action Movie/)).toBeTruthy();
    expect(screen.getByText(/RomCom/)).toBeTruthy();
  });
});
