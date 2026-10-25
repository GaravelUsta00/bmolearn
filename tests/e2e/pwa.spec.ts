import { test, expect, VIDEO } from './support/fixtures';

test('manifest: BeLearn, kurulabilir ikonlar', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');
  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({ name: 'BeLearn', short_name: 'BeLearn', start_url: '/', display: 'standalone' });
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toContain('maskable');
});

test('service worker: uygulama kabuğu ve çalışma ekranı çevrimdışı açılır, not kaydedilir', async ({
  app,
  page,
  context,
}) => {
  await app.open();
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
  // Çalışma ekranını bir kez aç: tembel yüklenen paketler de önbelleğe girsin
  await app.openLink(`https://youtu.be/${VIDEO}`);
  await app.tab(/Kartlar/).click();
  await page.getByRole('button', { name: 'BeLearn ana sayfa' }).click();
  await page.waitForTimeout(1000);

  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) urls.push(r.url);
    return urls;
  });
  expect(cached.filter((u) => !u.startsWith(new URL(page.url()).origin))).toEqual([]); // YouTube önbelleklenmez

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Sadece/ })).toBeVisible();
  await app.openLink(`https://youtu.be/${VIDEO}`);
  await page.getByLabel('Yeni not').fill('çevrimdışı not');
  await page.keyboard.press('Enter');
  await expect(page.getByText('çevrimdışı not')).toBeVisible();
  await context.setOffline(false);
  expect(await app.storage('belearn_notes')).toEqual([expect.objectContaining({ text: 'çevrimdışı not' })]);
});
