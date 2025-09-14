import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ResultsPage } from "../components/ResultsPage";
import type { Movie, Friend } from "../types";

const movies: Movie[] = [
  {
    id: 1,
    title: "Alpha",
    year: 2001,
    genres: ["Drama"],
    friendCount: 2,
    friendList: ["alice"],
  },
  {
    id: 2,
    title: "Beta",
    year: 1999,
    genres: ["Horror"],
    friendCount: 1,
    friendList: ["bob"],
  },
  {
    id: 3,
    title: "Gamma",
    year: 2010,
    genres: ["Drama", "Mystery"],
    friendCount: 3,
    friendList: ["carol"],
  },
];

const noop = () => {};
const selectedFriends: Friend[] = [];

describe("ResultsPage filters UI", () => {
  it("search by title updates results", async () => {
    const { container } = render(
      <ResultsPage
        movies={movies}
        selectedFriends={selectedFriends}
        onBack={noop}
        onNewComparison={noop}
      />
    );
    const user = userEvent.setup();
    // initial count should show 3
    expect(container.querySelector(".movie-count")?.textContent).toBe("3");

    await user.type(screen.getByLabelText(/Search title/i), "am");
    // Only Gamma contains 'am' (case-insensitive)
    expect(container.querySelector(".movie-count")?.textContent).toBe("1");
    expect(
      container.querySelector(".movie-count-annotation")?.textContent
    ).toContain("of 3");
  });

  it("genre filter reduces results and clear works", async () => {
    const { container } = render(
      <ResultsPage
        movies={movies}
        selectedFriends={selectedFriends}
        onBack={noop}
        onNewComparison={noop}
      />
    );
    const user = userEvent.setup();
    // select Drama
    const dramaBtn = screen.getByRole("button", { name: /Drama/i });
    await user.click(dramaBtn);
    expect(container.querySelector(".movie-count")?.textContent).toBe("2");

    // Clear
    await user.click(
      screen.getByRole("button", { name: /clear all filters/i })
    );
    expect(container.querySelector(".movie-count")?.textContent).toBe("3");
  });

  it("year range filters and sorting update order", async () => {
    const { container } = render(
      <ResultsPage
        movies={movies}
        selectedFriends={selectedFriends}
        onBack={noop}
        onNewComparison={noop}
      />
    );
    const user = userEvent.setup();
    // set year min to 2000
    const min = container.querySelector("#filter-year-min");
    expect(min).not.toBeNull();
    await user.clear(min!);
    await user.type(min!, "2000");
    expect(container.querySelector(".movie-count")?.textContent).toBe("2");

    // sort by friends asc
    const sortBy = container.querySelector("#sort-by");
    expect(sortBy).not.toBeNull();
    await user.selectOptions(sortBy!, ["friends"]);
    const sortDir = container.querySelector("#sort-dir");
    expect(sortDir).not.toBeNull();
    await user.selectOptions(sortDir!, ["asc"]);
    // After filter: Alpha (2 friends), Gamma (3 friends) => asc should show Alpha first
    const cards = screen.getAllByRole("link");
    expect(cards[0]).toHaveAttribute("href", expect.stringContaining("/film/"));
  });
});
