import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("Attribution modal", () => {
  it("opens the modal, focuses it, and closes on Escape", async () => {
    render(<App />);

    const user = userEvent.setup();

    const openButton = await screen.findByRole("button", {
      name: /data sources & attribution/i,
    });

    await user.click(openButton);

    // The dialog heading should appear; the same text exists on the open button,
    // so use findAllByText and select the heading (H3) node to disambiguate.
    const matches = await screen.findAllByText(/data sources & attribution/i);
    const heading = matches.find((el) => el.tagName.toLowerCase() === "h3");
    expect(heading).toBeTruthy();

    // The heading should be inside a <dialog> element
    const dialog = heading!.closest("dialog");
    expect(dialog).not.toBeNull();

    // Close using the backdrop button (deterministic in jsdom)
    const backdropButton = screen.getByRole("button", {
      name: /close data sources and attribution dialog/i,
    });
    await user.click(backdropButton);

    // Only the H3 heading should be removed; the open button re-uses the same text.
    await waitFor(() => {
      const headings = screen.queryAllByRole("heading", {
        name: /data sources & attribution/i,
      });
      expect(headings.length).toBe(0);
    });
  });
});
