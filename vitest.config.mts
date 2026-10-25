import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Birim testleri: tests/unit. Tarayıcı API'si (localStorage, DOM) gerekenler jsdom'da çalışır.
// Tarih testleri (B4: yerel gün) UTC+3 dilimde koşar; CI'ın saat dilimine bağlı kalmasın.
process.env.TZ = 'Europe/Istanbul';
// Uçtan uca testler Playwright'ta (tests/e2e, playwright.config.ts).
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    restoreMocks: true,
  },
});
