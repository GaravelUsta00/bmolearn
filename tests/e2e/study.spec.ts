import fs from 'node:fs';
import { test, expect, VIDEO } from './support/fixtures';

const AI_JSON = JSON.stringify({
  summary: '# AI Özeti\nMitokondri hücrenin enerji santralidir ve ATP üretir.',
  cards: [
    { question: 'Mitokondri nedir?', answer: 'Enerji santrali' },
    { question: 'ATP açılımı?', answer: 'Adenozin trifosfat' },
  ],
  quiz: [
    { question: 'Hangisi organeldir?', options: { A: 'Mitokondri', B: 'Glikoz', C: 'Su', D: 'Tuz' }, correct: 'A' },
    {
      question: 'ATP nerede üretilir?',
      options: { A: 'Çekirdek', B: 'Mitokondri', C: 'Zar', D: 'Koful' },
      correct: 'B',
    },
  ],
});

test.describe('çalışma ekranı', () => {
  test.beforeEach(async ({ app }) => {
    await app.open();
    await app.openLink(`https://www.youtube.com/watch?v=${VIDEO}`);
    await expect(app.playerState()).toHaveAttribute('data-yt-state', '1');
  });

  test('video açılır, başlık geçmişe yazılır', async ({ app, page }) => {
    await expect(page.locator('figcaption')).toContainText(`Sahte video ${VIDEO}`);
    await expect
      .poll(() => app.storage<{ contentId: string }[]>('belearn_history'))
      .toEqual([expect.objectContaining({ contentId: VIDEO, type: 'video' })]);
  });

  test('not: zaman damgalı ekleme, Alt+N, kopyalama ve indirme', async ({ app, page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByLabel('Yeni not').fill('**Önemli** nokta');
    await page.keyboard.press('Enter');
    await expect(page.locator('strong', { hasText: 'Önemli' })).toBeVisible();
    const notes = await app.storage<{ text: string; time: number }[]>('belearn_notes');
    expect(notes).toEqual([expect.objectContaining({ text: '**Önemli** nokta' })]);
    expect(notes![0].time).toBeGreaterThan(0);

    await page.locator('header').click({ position: { x: 600, y: 10 } });
    await page.keyboard.press('Alt+n');
    await expect(page.getByLabel('Yeni not')).toBeFocused();

    await page.getByRole('button', { name: 'Kopyala', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Kopyalandı' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('**Önemli** nokta');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'İndir', exact: true }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(new RegExp(`^Sahte video ${VIDEO} - .*\\.txt$`));
    const body = fs.readFileSync(await download.path(), 'utf8');
    expect(body).toMatch(/^BeLearn — Çalışma Notları\nİçerik Başlığı: Sahte video/);
  });

  test('AI Sihirbazı: istek kopyalanır, JSON içe aktarılır, ikinci aktarım onay ister', async ({
    app,
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'AI Sihirbazı', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'AI Sihirbazı' });
    await dialog.getByRole('button', { name: 'TYT-AYT' }).click();
    await dialog.getByRole('button', { name: 'İsteği kopyala' }).click();
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    expect(prompt).toContain('Seviye: TYT-AYT');
    expect(prompt).toContain(VIDEO);

    await dialog
      .getByRole('textbox', { name: /cevabını yapıştır/ })
      .fill('Tabii, işte:\n```json\n' + AI_JSON + '\n```');
    await dialog.getByRole('button', { name: 'İçerikleri aktar' }).click();
    await expect(page.getByRole('heading', { name: 'AI Özeti' })).toBeVisible();
    await expect(app.tab(/Kartlar/)).toContainText('2');
    await expect(app.tab(/Sorular/)).toContainText('2');

    // B7: üzerine yazma onaylı; "Vazgeç" veriyi korur
    await page.getByRole('button', { name: 'AI Sihirbazı', exact: true }).click();
    await dialog.getByRole('textbox', { name: /cevabını yapıştır/ }).fill(JSON.stringify({ summary: '# Başka' }));
    await dialog.getByRole('button', { name: 'İçerikleri aktar' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('özeti, 2 kartı, 2 sorusu');
    await expect(confirm.getByRole('button', { name: 'Vazgeç' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Vazgeç' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'AI Özeti' })).toBeVisible();
  });

  test('kartlar ve sorular: çevirme, öğrendim, tek soru görünümü', async ({ app, page }) => {
    await page.evaluate(
      ([json, id]) => {
        const d = JSON.parse(json);
        localStorage.setItem(
          'belearn_flashcards',
          JSON.stringify(d.cards.map((c: object, i: number) => ({ id: `c${i}`, contentId: id, learned: false, ...c })))
        );
        localStorage.setItem(
          'belearn_quiz',
          JSON.stringify(d.quiz.map((q: object, i: number) => ({ id: `q${i}`, contentId: id, ...q })))
        );
      },
      [AI_JSON, VIDEO]
    );
    await page.reload();
    await app.openLink(`https://youtu.be/${VIDEO}`);

    await app.tab(/Kartlar/).click();
    const card = page.locator('button.flip-scene').first();
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Çalış', exact: true }).click();
    await page.getByRole('button', { name: 'Öğrendim' }).click();
    await expect(page.getByRole('button', { name: 'Öğrendim' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Geri dön/ }).click();
    await expect(page.getByText('Öğrenilen 1 / 2')).toBeVisible();

    await app.tab(/Sorular/).click();
    await expect(page.getByText('Soru 1 / 2')).toBeVisible();
    await page.getByRole('button', { name: /Glikoz/ }).click();
    await expect(page.getByRole('button', { name: /Mitokondri/ })).toContainText('Doğru cevap');
    await expect(page.getByRole('button', { name: /Glikoz/ })).toContainText('Senin cevabın');
    await expect(page.getByRole('button', { name: 'Sonraki soru' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Soru 2 / 2')).toBeVisible();
    await expect(page.getByText('Yanlış 1')).toBeVisible();
    expect((await app.storage<{ userAnswer?: string }[]>('belearn_quiz'))![0].userAnswer).toBe('B');
  });

  test('kısayol: K ve Space videoyu duraklatır/oynatır; yazı alanında çalışmaz', async ({ app, page }) => {
    await page.locator('figcaption').click();
    await page.keyboard.press('k');
    await expect(app.playerState()).toHaveAttribute('data-yt-state', '2');
    await page.keyboard.press('Space');
    await expect(app.playerState()).toHaveAttribute('data-yt-state', '1');
    await page.getByLabel('Yeni not').fill('');
    await page.getByLabel('Yeni not').press('k');
    await expect(app.playerState()).toHaveAttribute('data-yt-state', '1');
  });

  test('odak modu ve tema', async ({ app, page }) => {
    await page.getByRole('button', { name: 'Odak modu' }).click();
    await expect(page.locator('[data-focus-mode="true"]')).toBeVisible();
    await expect(page.locator('.focus-vignette')).toHaveCount(1);
    await page.getByRole('button', { name: 'Odak modu' }).click();
    await expect(page.locator('.focus-vignette')).toHaveCount(0);

    const before = await page.evaluate(() => document.documentElement.dataset.theme);
    await page
      .locator('header')
      .getByRole('button', { name: /temasına geç/ })
      .click();
    const after = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(after).not.toBe(before);
    expect(await page.evaluate(() => localStorage.getItem('belearn_theme'))).toBe(after);
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
    void app;
  });
});
