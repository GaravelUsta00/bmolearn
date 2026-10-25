import { test, expect, VIDEO } from './support/fixtures';

// Pixel 7 öykünmesi (dokunmatik, mobil UA). DESIGN §8.6: yatay taşma yok, hedefler ≥ 44 px.
test('mobil: yatay taşma yok, menü tüm işlemleri içerir, panel hedefleri ≥ 44 px', async ({ app, page }) => {
  await app.open({
    belearn_notes: [{ id: 1, contentId: VIDEO, text: 'not', time: 12 }],
    belearn_quiz: [
      { id: 3, contentId: VIDEO, question: 'S?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correct: 'A' },
    ],
  });
  await app.openLink(`https://youtu.be/${VIDEO}`);
  for (const tab of [/Notlar/, /Özet/, /Kartlar/, /Sorular/]) {
    await app.tab(tab).tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const small = await page
      .locator('section[aria-label="Çalışma paneli"]')
      .locator('button:visible, input:visible')
      .evaluateAll((els) =>
        els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.outerHTML.slice(0, 60))
      );
    expect(small, String(tab)).toEqual([]);
  }
  const tablist = await page.getByRole('tablist').evaluate((t) => t.scrollWidth <= t.clientWidth);
  expect(tablist).toBe(true);

  await page.getByRole('button', { name: /Menü/ }).tap();
  const header = page.locator('header');
  for (const item of [
    'Geçmiş',
    'Odak radyosu',
    'Tam ekran',
    'Sinema modu',
    'Mavi ışık',
    'Uygulamayı yükle',
    'Yedeği indir',
  ])
    await expect(header).toContainText(item);
});
