import { test as base, expect, type Page } from '@playwright/test';
import { FAKE_YOUTUBE_API } from './fake-youtube';

// 1×1 şeffaf PNG: YouTube küçük resimleri yerine
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

/** Her test YouTube yerine sahte API ile çalışır; dış ağa istek çıkmaz.
 * (Fixture geri çağrısı Playwright belgelerindeki `use` yerine `provide`: React hook kuralıyla karışmasın.) */
export const test = base.extend<{ app: App }>({
  page: async ({ page }, provide) => {
    await page.route('https://www.youtube.com/iframe_api', (r) =>
      r.fulfill({ contentType: 'text/javascript', body: FAKE_YOUTUBE_API })
    );
    await page.route(/^https:\/\/(img|i)\.(youtube|ytimg)\.com\//, (r) =>
      r.fulfill({ contentType: 'image/png', body: PIXEL })
    );
    await provide(page);
  },
  app: async ({ page }, provide) => provide(new App(page)),
});
export { expect };

export class App {
  constructor(readonly page: Page) {}

  /** Boş cihazla aç; isteğe bağlı localStorage verisiyle (değerler string ya da JSON'a çevrilir). */
  async open(data: Record<string, unknown> = {}) {
    await this.page.goto('/');
    await this.page.waitForFunction(() => localStorage.getItem('belearn_meta'));
    if (Object.keys(data).length) {
      await this.page.evaluate((d) => {
        for (const [k, v] of Object.entries(d)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }, data);
      await this.page.reload();
    }
    await expect(this.page.getByRole('heading', { level: 1, name: /Sadece/ })).toBeVisible();
  }

  async openLink(url: string) {
    await this.page.getByPlaceholder('YouTube bağlantısı').fill(url);
    await this.page.keyboard.press('Enter');
    await expect(this.page.getByRole('tablist', { name: 'Çalışma paneli' })).toBeVisible();
  }

  tab(name: RegExp) {
    return this.page.getByRole('tab', { name });
  }

  playerState() {
    return this.page.locator('[data-yt-state]');
  }

  storage<T = unknown>(key: string): Promise<T | null> {
    return this.page.evaluate((k) => {
      const v = localStorage.getItem(k);
      return v === null ? null : JSON.parse(v);
    }, key);
  }

  rawStorage(prefix: string): Promise<Record<string, string>> {
    return this.page.evaluate(
      (p) => Object.fromEntries(Object.entries({ ...localStorage }).filter(([k]) => k.startsWith(p))),
      prefix
    );
  }
}

export const VIDEO = 'dQw4w9WgXcQ';
