import { defineConfig, devices } from '@playwright/test';

// Uçtan uca testler üretim derlemesine karşı koşar (service worker yalnızca üretimde kaydolur).
// Tarayıcı: varsayılan Playwright Chromium (`npx playwright install chromium`).
// Kurulu Edge/Chrome ile: PW_CHANNEL=msedge npx playwright test
const PORT = Number(process.env.PORT ?? 3100);
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    trace: 'retain-on-failure',
    ...(channel ? { channel } : {}),
  },
  projects: [
    {
      name: 'masaüstü',
      use: { ...devices['Desktop Chrome'], ...(channel ? { channel } : {}) },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobil',
      use: { ...devices['Pixel 7'], ...(channel ? { channel } : {}) },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
