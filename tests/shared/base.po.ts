import { type Page, expect } from '@playwright/test';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { SelfHealingLocator } from './selfHealingLocator';

type HealerSuggestion = {
  url: string;
  selectors: string[];
  error: string;
  ts: string;
};

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'commit' });
    await expect(this.page).toHaveTitle(/Practice Software Testing - Toolshop - v5.0/);
  }

  /**
   * Try clicking using a self-healing locator built from the provided selectors.
   * If the click fails, record a suggestion artifact that the healer agent can consume.
   */
  async selfHealClick(selectors: string[] | string, options?: Parameters<Page['click']>[1]) {
    const sh = new SelfHealingLocator(this.page, selectors);
    try {
      await sh.click(options);
    } catch (err) {
      // record suggestion for healer agent
      try {
        const outDir = resolve(process.cwd(), '.playwright');
        const outFile = resolve(outDir, 'healer-suggestions.json');
        const entry: HealerSuggestion = {
          url: this.page.url(),
          selectors: Array.isArray(selectors) ? selectors : [selectors],
          error: String((err as Error)?.message ?? String(err)),
          ts: new Date().toISOString(),
        };

        let list: HealerSuggestion[] = [];
        if (existsSync(outFile)) {
          try {
            const raw = readFileSync(outFile, 'utf8');
            list = JSON.parse(raw || '[]') as HealerSuggestion[];
          } catch {
            list = [];
          }
        }
        list.push(entry);
        // ensure directory exists by writing file (will create .playwright if needed)
        writeFileSync(outFile, JSON.stringify(list, null, 2), { encoding: 'utf8' });
      } catch {
        // best-effort only
      }
      throw err;
    }
  }
}
