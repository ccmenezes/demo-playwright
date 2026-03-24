import { test, expect } from '@playwright/test';

// Seed test used by Playwright Planner to bootstrap the application state
// The planner will run this test to initialize fixtures, global setup and provide context
// for the agents. Keep it minimal and reliable.

test('seed', async ({ page }) => {
  // Navigate to the application root so planner can inspect UI and run interactions
  await page.goto('/', { waitUntil: 'commit' });

  // Basic sanity assertions that indicate the app loaded correctly
  await expect(page).toHaveTitle(/Practice Software Testing - Toolshop - v5.0/);
  // Ensure at least one product card is present (helps planner find interactive elements)
  await expect(page.locator('div.container > .card').first()).toBeVisible();
});
