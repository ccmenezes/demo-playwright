import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../shared/base.po';

export class Homepage extends BasePage {
  readonly paginationList: Locator;
  //Product container
  readonly productsContainer: Locator;
  readonly imageProductCardAttribute: Locator;
  //Pagination tabs
  readonly tabOne: Locator;
  readonly tabTwo: Locator;
  readonly tabThree: Locator;
  readonly tabFour: Locator;
  readonly tabFive: Locator;
  readonly tabSix: Locator;
  readonly tabSeven: Locator;
  readonly firstProduct: Locator;
  readonly outOfStockProduct: Locator;
  readonly productContainerName: Locator;
  readonly productContainerPrice: Locator;

  constructor(page: Page) {
    super(page);
    this.tabOne = page.getByLabel('Page-1');
    this.tabTwo = page.getByLabel('Page-2');
    this.tabThree = page.getByLabel('Page-3');
    this.tabFour = page.getByLabel('Page-4');
    this.tabFive = page.getByLabel('Page-5');
    this.paginationList = page.locator('.pagination > li');
    this.productsContainer = page.locator('div.container > .card');
    this.imageProductCardAttribute = page.locator('.card-img-wrapper > img');
    this.productContainerName = page.locator('[data-test*="product"][data-test="product-name"]');
    this.productContainerPrice = page.locator('[data-test*="product"][data-test="product-price"]');
  }

  async clickOnTab(pageNumber: number) {
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
