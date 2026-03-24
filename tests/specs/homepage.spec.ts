import { test, expect } from '@playwright/test';
import { Homepage } from '../page-objects/homepage.po';

test.describe('Homepage', () => {
  let homepage: Homepage;

  test.beforeEach(async ({ page }) => {
    homepage = new Homepage(page);
    await homepage.goto();
  });

  test('Verify that the product information is displayed', async () => {
    // Use self-healing helpers from the page object for more resilient selectors
    const nameLocator = await homepage.getProductName(0);
    await expect(nameLocator).toHaveText(/Combination Pliers/i);

    const priceLocator = await homepage.getProductPrice(0);
    await expect(priceLocator).toHaveText(/\$14.15/);

    const imgLocator = await homepage.getProductImage(0);
    await expect(imgLocator).toHaveAttribute('src', /.+/);
  });

  test('Should sucessfully navigate between tabs', async ({ page }) => {
    homepage = new Homepage(page);
    const tabIndex = 5;
    const classAtiveTab = 'page-item active';

    for (let index = 1; index <= tabIndex; index++) {
      await homepage.clickOnTab(tabIndex);
      await expect(homepage.paginationList.nth(tabIndex)).toHaveClass(classAtiveTab);
    }
  });
});
