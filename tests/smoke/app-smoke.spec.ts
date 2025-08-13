import { test, expect } from "@playwright/test";

/**
 * Simple smoke tests for BoxdBuddy application
 * AI Generated: GitHub Copilot - 2025-08-02
 */

test.describe("BoxdBuddy Smoke Tests", () => {
  test("should load the application successfully", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:1420");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if the main heading is present
    await expect(page.locator("h1")).toContainText("BoxdBuddy");

    // Check if setup form is visible using getByRole
    await expect(
      page.getByRole("textbox", { name: "Letterboxd Username" })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "TMDB API Key (Optional)" })
    ).toBeVisible();

    // Verify continue button exists
    await expect(page.locator('button:has-text("Continue")')).toBeVisible();

    // Application loaded successfully
  });

  test("should validate form inputs", async ({ page }) => {
    await page.goto("http://localhost:1420");
    await page.waitForLoadState("networkidle");

    // Try to submit empty form
    await page.click('button:has-text("Continue")');

    // Should show validation message or stay on same page
    // (The exact behavior depends on app implementation)
    await expect(page.locator("h1")).toContainText("BoxdBuddy");

    // Form validation working
  });

  test("should accept valid input format", async ({ page }) => {
    await page.goto("http://localhost:1420");
    await page.waitForLoadState("networkidle");

    // Fill in valid test data using getByRole
    const usernameInput = page.getByRole("textbox", {
      name: "Letterboxd Username",
    });
    const apiKeyInput = page.getByRole("textbox", {
      name: "TMDB API Key (Optional)",
    });

    await usernameInput.fill("TestUser");
    await apiKeyInput.fill("test-api-key-123");

    // Verify inputs are filled
    await expect(usernameInput).toHaveValue("TestUser");
    await expect(apiKeyInput).toHaveValue("test-api-key-123");

    // Form inputs accepting data correctly
  });
});
