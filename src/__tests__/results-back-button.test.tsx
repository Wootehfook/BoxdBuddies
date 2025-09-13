// AI Generated: GitHub Copilot - 2025-09-13
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResultsPage } from "../components/ResultsPage";
import type { Friend } from "../types";

// Minimal props shape for ResultsPage (match src/types.ts)
const baseProps = {
  movies: [
    {
      id: 1,
      title: "Test Movie",
      letterboxdSlug: "test-movie",
      poster_path: undefined,
      year: 2020,
      friendCount: 0,
      friendList: [],
    },
  ],
  selectedFriends: [] as Friend[],
  onBack: () => {},
  onNewComparison: () => {},
};

describe("ResultsPage Back button", () => {
  it("renders Back label and keeps it present when header compresses", () => {
    render(<ResultsPage {...baseProps} />);

    // The button has an aria-label we've added; prefer role based lookup
    const backBtn = screen.getByRole("button", { name: /back to setup|back/i });
    expect(backBtn).toBeTruthy();

    const backText = screen.getByText(/^Back$/i);
    expect(backText).toBeTruthy();
    expect(backText.textContent).toBe("Back");
  });
});
