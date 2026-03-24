import { Page, Locator } from '@playwright/test';

/**
 * Simple self-healing locator helper.
 * Tries a list of selectors in order and returns the first visible (or present) locator.
 * Provides convenience methods to interact with the resolved locator.
 */
export class SelfHealingLocator {
  private page: Page;
  private selectors: string[];
  private name?: string;

  constructor(page: Page, selectors: string[] | string, name?: string) {
    this.page = page;
    this.selectors = Array.isArray(selectors) ? selectors : [selectors];
    this.name = name;
  }

  private async find(): Promise<Locator> {
    for (const sel of this.selectors) {
      const loc = this.page.locator(sel);
      try {
        const count = await loc.count();
        if (count > 0) {
          // prefer a visible instance
          for (let i = 0; i < count; i++) {
            const nth = loc.nth(i);
            if (await nth.isVisible().catch(() => false)) return nth;
          }
          // otherwise return the first one present
          return loc.first();
        }
      } catch {
        // ignore and try next selector
      }
    }
    // fallback: return locator for first selector (may be empty)
    return this.page.locator(this.selectors[0]);
  }

  async locator(): Promise<Locator> {
    return this.find();
  }

  async click(options?: Parameters<Locator['click']>[0]) {
    const l = await this.find();
    return l.click(options);
  }

  async fill(value: string, options?: Parameters<Locator['fill']>[1]) {
    const l = await this.find();
    return l.fill(value, options);
  }

  async getAttribute(name: string) {
    const l = await this.find();
    return l.getAttribute(name);
  }

  /** Convenience to expose nth */
  async nth(index: number) {
    const l = await this.find();
    return l.nth(index);
  }
}
