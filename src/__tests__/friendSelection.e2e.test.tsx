import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FriendSelectionPage } from "../components/FriendSelectionPage";

// Minimal localStorage mock for test environment
class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe("FriendSelectionPage (integration) - renders cached watchlist counts", () => {
  beforeEach(() => {
    // Provide test localStorage
    // @ts-expect-error - assign minimal localStorage for test env
    globalThis.localStorage = new LocalStorageMock();
  });

  it("shows cached watchlistCount from WebCacheService data shape", async () => {
    // Seed cache using the same shape used by WebCacheService
    const seeded = {
      watchlistCounts: {
        alice: {
          count: 7,
          lastFetchedAt: Date.now(),
          version: "1.0.0",
        },
      },
    };
    globalThis.localStorage.setItem("boxdbuddy_cache", JSON.stringify(seeded));

    const friends = [
      {
        username: "alice",
        displayName: "Alice",
        watchlistCount: 7,
      },
    ];

    render(
      <FriendSelectionPage
        friends={friends}
        selectedFriends={[]}
        onToggleFriend={() => {}}
        onCompareWatchlists={() => {}}
        onBackToSetup={() => {}}
        isComparing={false}
        isLoadingWatchlistCounts={false}
        enhancementProgress={{ completed: 0, total: 100, status: "" }}
        currentQuoteIndex={0}
        error={null}
      />
    );

    // Expect the cached count to be shown
    expect(await screen.findByText(/Watchlist: 7 Film/i)).toBeTruthy();
  });
});
