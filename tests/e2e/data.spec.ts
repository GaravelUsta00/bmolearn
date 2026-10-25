import fs from 'node:fs';
import legacy from '../fixtures/bmo-legacy.json';
import { test, expect, VIDEO } from './support/fixtures';
import { makePdf } from './support/pdf';

const T0 = 1761300000000;
const HISTORY = [
  { id: VIDEO, contentId: VIDEO, title: 'Hücre Biyolojisi', timestamp: T0, type: 'video' },
  { id: 'doc_1', contentId: 'doc_1', title: 'ders-notu.pdf', timestamp: T0 - 1000, type: 'document' },
];

test('eski BMO verisi belearn_* anahtarlarına kopyalanır; bmo_* olduğu gibi kalır', async ({ app, page }) => {
  await page.goto('/');
  await page.evaluate((d) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v as string);
  }, legacy);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Son çalışmalar' })).toBeVisible();
  const bmo = await app.rawStorage('bmo_');
  const belearn = await app.rawStorage('belearn_');
  expect(bmo).toEqual(legacy);
  // Görevler kaldırıldı (2026-10-25): bmo_todos yerinde kalır ama kopyalanmaz.
  for (const [k, v] of Object.entries(legacy)) {
    expect(belearn[k.replace('bmo_', 'belearn_')]).toBe(k === 'bmo_todos' ? undefined : v);
  }
  expect(JSON.parse(belearn.belearn_meta)).toMatchObject({ migratedFrom: 'bmo' });
});

test('geçmiş: kayıt silme ve tümünü temizleme onaylı; vazgeçince hiçbir şey silinmez', async ({ app, page }) => {
  await app.open({
    belearn_history: HISTORY,
    belearn_notes: [{ id: 1, contentId: VIDEO, text: 'not', time: 3 }],
    belearn_pomodoro: { '2026-10-24': 3 },
  });
  await page.getByRole('button', { name: 'Tüm geçmiş' }).click();
  const dialog = page.getByRole('dialog', { name: 'Geçmiş' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Sil: ders-notu.pdf' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Vazgeç' }).click();
  expect(await app.storage('belearn_history')).toHaveLength(2);
  await dialog.getByRole('button', { name: 'Sil: ders-notu.pdf' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Sil', exact: true }).click();
  await expect.poll(() => app.storage('belearn_history')).toHaveLength(1);

  await dialog.getByRole('button', { name: 'Tümünü temizle' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Pomodoro geçmişin korunur');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Tümünü sil' }).click();
  await expect.poll(() => app.storage('belearn_history')).toBeNull();
  expect(await app.storage('belearn_notes')).toBeNull();
  expect(await app.storage('belearn_pomodoro')).toEqual({ '2026-10-24': 3 });
});

test('yedek: indir, boş cihaza yükle, veri geri gelir', async ({ app, page }) => {
  await app.open({
    belearn_history: HISTORY,
    belearn_notes: [{ id: 1, contentId: VIDEO, text: 'yedekteki not', time: 0 }],
  });
  await app.openLink(`https://youtu.be/${VIDEO}`);
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Yedeği indir' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^belearn-yedek-\d{4}-\d{2}-\d{2}\.json$/);
  const file = fs.readFileSync(await download.path(), 'utf8');
  expect(JSON.parse(file)).toMatchObject({
    app: 'BeLearn',
    data: { belearn_notes: expect.stringContaining('yedekteki not') },
  });

  await page.evaluate(() => localStorage.clear());
  await app.open();
  await app.openLink(`https://youtu.be/${VIDEO}`);
  await page.getByRole('button', { name: 'Ayarlar', exact: true }).click();
  await page
    .getByLabel('Yedek dosyası seç')
    .setInputFiles({ name: 'y.json', mimeType: 'application/json', buffer: Buffer.from(file) });
  const dialog = page.getByRole('dialog', { name: 'Yedeği yükle' });
  await expect(dialog).toContainText('Notlar');
  await expect(page.getByRole('dialog', { name: 'Ayarlar' })).toHaveCount(0); // K15
  await Promise.all([
    page.waitForEvent('load'),
    dialog.getByRole('button', { name: /Yükle|Boş alanlara ekle/ }).click(),
  ]);
  await expect
    .poll(() => app.storage<{ text: string }[]>('belearn_notes'))
    .toEqual([expect.objectContaining({ text: 'yedekteki not' })]);
});

test('PDF: pdf.js ile çizilir, geçmişe eklenir; PDF olmayan dosya reddedilir', async ({ app, page }) => {
  await app.open();
  await page
    .locator('main input[type=file]')
    .setInputFiles({ name: 'biyoloji.pdf', mimeType: 'application/pdf', buffer: makePdf(3) });
  await expect(page.locator('[data-page="1"] canvas')).toBeVisible();
  await expect(page.getByText(/Sayfa 1 \/ 3/)).toBeVisible();
  await expect
    .poll(() => app.storage<{ title: string }[]>('belearn_history'))
    .toEqual([expect.objectContaining({ title: 'biyoloji.pdf', type: 'document' })]);

  await page.locator('main input[type=file][accept*="pdf"]').setInputFiles({
    name: 'sahte.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('<html><script>alert(1)</script></html>'),
  });
  await expect(page.locator('main [role=alert]', { hasText: 'Desteklenmeyen dosya' })).toBeVisible();
  await expect(page.locator('figcaption')).toContainText('biyoloji.pdf');
});
