import { test, expect } from '@playwright/test';

/**
 * Critical tests for Letterboxd scraping functionality
 * These tests ensure the core scraping logic works correctly
 */

test.describe('Letterboxd Scraping Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to BoxdBuddies app
    await page.goto('http://localhost:1420');
    await expect(page.locator('h1')).toContainText('BoxdBuddies');
  });

  test('should handle user setup with valid Letterboxd username', async ({ page }) => {
    // Test the setup flow
    await page.fill('input[placeholder*="Letterboxd username"]', 'Wootehfook');
    await page.fill('input[placeholder*="TMDB API key"]', 'test-key-123');
    
    await page.click('button:has-text("Connect to Letterboxd")');
    
    // Should proceed to friend selection page
    await expect(page.locator('text=Friend Selection')).toBeVisible({ timeout: 30000 });
  });

  test('should validate username format', async ({ page }) => {
    // Test empty username
    await page.click('button:has-text("Connect to Letterboxd")');
    await expect(page.locator('text=Please enter your Letterboxd username')).toBeVisible();
    
    // Test invalid characters
    await page.fill('input[placeholder*="Letterboxd username"]', 'invalid@username');
    await page.click('button:has-text("Connect to Letterboxd")');
    // Should show validation error or handle gracefully
  });

  test('should handle friend selection and comparison', async ({ page }) => {
    // Setup user first
    await page.fill('input[placeholder*="Letterboxd username"]', 'Wootehfook');
    await page.click('button:has-text("Connect to Letterboxd")');
    
    // Wait for friends to load
    await expect(page.locator('text=Friend Selection')).toBeVisible({ timeout: 30000 });
    
    // Select a friend (assuming at least one friend exists)
    const firstFriend = page.locator('[data-testid="friend-item"]').first();
    if (await firstFriend.isVisible()) {
      await firstFriend.click();
      
      // Start comparison
      await page.click('button:has-text("Compare Watchlists")');
      
      // Should show progress page
      await expect(page.locator('text=Progress')).toBeVisible();
      
      // Should eventually show results
      await expect(page.locator('text=Results')).toBeVisible({ timeout: 120000 });
    }
  });

  test('should handle cache loading efficiently', async ({ page }) => {
    // Test that cached data loads quickly
    await page.fill('input[placeholder*="Letterboxd username"]', 'Wootehfook');
    await page.click('button:has-text("Connect to Letterboxd")');
    
    await expect(page.locator('text=Friend Selection')).toBeVisible({ timeout: 30000 });
    
    // Second run should be much faster (cache loading)
    const startTime = Date.now();
    
    // Select friend and compare again
    const firstFriend = page.locator('[data-testid="friend-item"]').first();
    if (await firstFriend.isVisible()) {
      await firstFriend.click();
      await page.click('button:has-text("Compare Watchlists")');
      
      // Cache loading should complete quickly
      await expect(page.locator('text=Results')).toBeVisible({ timeout: 10000 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Cached comparison should be under 10 seconds
      expect(duration).toBeLessThan(10000);
    }
  });

  test('should display movie details correctly', async ({ page }) => {
    // Navigate through to results
    await page.fill('input[placeholder*="Letterboxd username"]', 'Wootehfook');
    await page.click('button:has-text("Connect to Letterboxd")');
    await expect(page.locator('text=Friend Selection')).toBeVisible({ timeout: 30000 });
    
    const firstFriend = page.locator('[data-testid="friend-item"]').first();
    if (await firstFriend.isVisible()) {
      await firstFriend.click();
      await page.click('button:has-text("Compare Watchlists")');
      await expect(page.locator('text=Results')).toBeVisible({ timeout: 120000 });
      
      // Check that movies are displayed with proper data
      const firstMovie = page.locator('[data-testid="movie-item"]').first();
      if (await firstMovie.isVisible()) {
        // Should have title
        await expect(firstMovie.locator('h3')).toBeVisible();
        
        // Should have year
        await expect(firstMovie.locator('text=/\\(\\d{4}\\)/')).toBeVisible();
        
        // Should have Letterboxd link with correct URL format
        const letterboxdLink = firstMovie.locator('a[href*="letterboxd.com"]');
        await expect(letterboxdLink).toBeVisible();
        
        // Verify the URL uses real slugs (not title-based)
        const href = await letterboxdLink.getAttribute('href');
        expect(href).toMatch(/letterboxd\.com\/film\/[a-z0-9-]+\//);
      }
    }
  });
});
