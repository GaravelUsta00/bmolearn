import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, VIDEO } from './support/fixtures';

const DATA = {
  belearn_history: [
    { id: VIDEO, contentId: VIDEO, title: 'Hücre Biyolojisi', timestamp: 1761300000000, type: 'video' },
  ],
  belearn_notes: [{ id: 1, contentId: VIDEO, text: 'not', time: 12 }],
  belearn_flashcards: [{ id: 2, contentId: VIDEO, question: 'Soru?', answer: 'Cevap', learned: false }],
  belearn_quiz: [
    { id: 3, contentId: VIDEO, question: 'S?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correct: 'A' },
  ],
  belearn_summaries: { [VIDEO]: '# Özet\nİlk paragraf.' },
};

// Giriş animasyonları ve 150 ms solma bitsin: axe ara opaklıkta ölçmesin.
const scan = async (page: Page) => {
  await page.waitForTimeout(700);
  const { violations } = await new AxeBuilder({ page }).exclude('iframe').analyze();
  return violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `${v.id}: ${v.nodes[0]?.target}`);
};

for (const theme of ['light', 'dark']) {
  test(`axe: kritik/ciddi ihlal yok (${theme === 'light' ? 'gündüz' : 'gece'})`, async ({ app, page }) => {
    await app.open({ ...DATA, belearn_theme: theme });
    expect(await scan(page)).toEqual([]);
    await app.openLink(`https://youtu.be/${VIDEO}`);
    for (const tab of [/Notlar/, /Özet/, /Kartlar/, /Sorular/]) {
      await app.tab(tab).click();
      expect(await scan(page), String(tab)).toEqual([]);
    }
    await page.getByRole('button', { name: 'Geçmiş', exact: true }).click();
    expect(await scan(page)).toEqual([]);
  });
}

test('modal: odak içeride, Tab tuzağı, Escape, odak açan düğmeye döner', async ({ app, page }) => {
  await app.open(DATA);
  const opener = page.getByRole('button', { name: 'Tüm geçmiş' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Geçmiş' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i % 4 === 3 ? 'Shift+Tab' : 'Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('sekmeler ok tuşlarıyla; yalnızca klavyeyle soru cevaplanır', async ({ app, page }) => {
  await app.open(DATA);
  await app.openLink(`https://youtu.be/${VIDEO}`);
  await app.tab(/Notlar/).focus();
  await page.keyboard.press('End');
  await expect(app.tab(/Sorular/)).toBeFocused();
  await expect(app.tab(/Sorular/)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // Sıfırla → Soruyu sil → A şıkkı
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: /Doğru|Yanlış/ })).toBeVisible();
});
