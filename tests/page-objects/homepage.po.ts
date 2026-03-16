import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../shared/base.po';
import { SelfHealingLocator } from '../shared/selfHealingLocator';

export class Homepage extends BasePage {
  readonly paginationList: Locator;
  //Product container (legacy locator kept for compatibility with existing tests)
  readonly productsContainer: Locator;
  readonly imageProductCardAttribute: Locator;
  // Self-healing variants
  readonly productsContainerSH: SelfHealingLocator;
  readonly imageProductCardSH: SelfHealingLocator;
  //Pagination tabs (legacy)
  readonly tabOne: Locator;
  readonly tabTwo: Locator;
  readonly tabThree: Locator;
  readonly tabFour: Locator;
  readonly tabFive: Locator;
  readonly tabSix: Locator;
  readonly tabSeven: Locator;
  // Self-healing tab variants
  readonly tabOneSH: SelfHealingLocator;
  readonly tabTwoSH: SelfHealingLocator;
  readonly tabThreeSH: SelfHealingLocator;
  readonly tabFourSH: SelfHealingLocator;
  readonly tabFiveSH: SelfHealingLocator;

  readonly firstProduct: Locator;
  readonly outOfStockProduct: Locator;
  readonly productContainerName: Locator;
  readonly productContainerPrice: Locator;
  // Self-healing name/price
  readonly productContainerNameSH: SelfHealingLocator;
  readonly productContainerPriceSH: SelfHealingLocator;

  constructor(page: Page) {
    super(page);
    this.tabOne = page.getByLabel('Page-1');
    this.tabTwo = page.getByLabel('Page-2');
    this.tabThree = page.getByLabel('Page-3');
    this.tabFour = page.getByLabel('Page-4');
    this.tabFive = page.getByLabel('Page-5');
    this.paginationList = page.locator('.pagination > li');

    // Legacy locators remain to avoid forcing changes across the testsuite
    this.productsContainer = page.locator('div.container > .card');
    this.imageProductCardAttribute = page.locator('.card-img-wrapper > img');
    this.productContainerName = page.locator('[data-test*="product"][data-test="product-name"]');
    this.productContainerPrice = page.locator('[data-test*="product"][data-test="product-price"]');

    // Self-healing selectors: list of alternative selectors ordered from most specific to fallback
    this.productsContainerSH = new SelfHealingLocator(
      page,
      ['div.container > .card', '.product-card', '.card.product', '[data-test*="product"][data-test="product-card"]'],
      'productsContainer',
    );

    this.imageProductCardSH = new SelfHealingLocator(
      page,
      ['.card-img-wrapper > img', '.product-card img', '.card .product-image img', 'img[data-test="product-image"]'],
      'productImage',
    );

    // Tabs: prefer aria-label based CSS selectors as alternatives to getByLabel
    this.tabOneSH = new SelfHealingLocator(page, [
      '[aria-label="Page-1"]',
      '[data-page="1"]',
      '.pagination li:nth-child(1) a',
    ]);
    this.tabTwoSH = new SelfHealingLocator(page, [
      '[aria-label="Page-2"]',
      '[data-page="2"]',
      '.pagination li:nth-child(2) a',
    ]);
    this.tabThreeSH = new SelfHealingLocator(page, [
      '[aria-label="Page-3"]',
      '[data-page="3"]',
      '.pagination li:nth-child(3) a',
    ]);
    this.tabFourSH = new SelfHealingLocator(page, [
      '[aria-label="Page-4"]',
      '[data-page="4"]',
      '.pagination li:nth-child(4) a',
    ]);
    this.tabFiveSH = new SelfHealingLocator(page, [
      '[aria-label="Page-5"]',
      '[data-page="5"]',
      '.pagination li:nth-child(5) a',
    ]);

    // name/price self-healing
    this.productContainerNameSH = new SelfHealingLocator(
      page,
      [
        '[data-test*="product"][data-test="product-name"]',
        '[data-test="product-name"]',
        '.product-name',
        '.card .product-title',
      ],
      'productName',
    );

    this.productContainerPriceSH = new SelfHealingLocator(
      page,
      [
        '[data-test*="product"][data-test="product-price"]',
        '[data-test="product-price"]',
        '.product-price',
        '.card .price',
      ],
      'productPrice',
    );
  }

  // Helper methods that expose Locators resolved via self-healing. Tests can opt-in to use these
  async getProductCard(index = 0) {
    return this.productsContainerSH.nth(index);
  }

  async getProductImage(index = 0) {
    return (await this.getProductCard(index)).locator('img');
  }

  async getProductName(index = 0) {
    return this.productContainerNameSH.nth(index);
  }

  async getProductPrice(index = 0) {
    return this.productContainerPriceSH.nth(index);
  }

  async clickOnTab(pageNumber: number) {
    // try self-healing tabs first, fallback to legacy locators
    try {
      switch (pageNumber) {
        case 1:
          await this.tabOneSH.click();
          return;
        case 2:
          await this.tabTwoSH.click();
          return;
        case 3:
          await this.tabThreeSH.click();
          return;
        case 4:
          await this.tabFourSH.click();
          return;
        case 5:
          await this.tabFiveSH.click();
          return;
        default:
          throw Error('Sorry, input the wrong option, please inform 1 to 5.');
      }
    } catch {
      // Fallback to legacy locators if self-healing click fails
      switch (pageNumber) {
        case 1:
          await this.tabOne.click();
          break;
        case 2:
          await this.tabTwo.click();
          break;
        case 3:
          await this.tabThree.click();
          break;
        case 4:
          await this.tabFour.click();
          break;
        case 5:
          await this.tabFive.click();
          break;
        default:
          throw Error('Sorry, input the wrong option, please inform 1 to 5.');
      }
    }
  }
}
