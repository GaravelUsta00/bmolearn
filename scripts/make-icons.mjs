// "BL" uygulama simgesini üretir (DESIGN §5): kâğıt zemin, Literata "B" (brand) + italik "L" (ink).
// Uygulamanın kendi fontuyla DOM'da sabit optik boyutta çizilir; harflerin mürekkep kutusu pikselden
// ölçülür, B–L aralığı ve ortalama buna göre yapılır. Çıktı: public/icons/*, src/app/{apple-icon.png,favicon.ico}.
// Kullanım: önce `npm run dev` (:3000), sonra `node scripts/make-icons.mjs`. Elle çalıştırılır; derlemeye bağlı değil.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL = process.env.ICON_URL ?? 'http://localhost:3000/';

const PAPER = '#E8E6DD';
const B_COLOR = '#8F2D2D';
const L_COLOR = '#26231F';
// capRatio: B'nin yüksekliği / kenar. gap: B ile L arası boşluk / B yüksekliği.
const SPECS = [
  { out: 'public/icons/icon-512.png', size: 512, capRatio: 200 / 512 },
  { out: 'public/icons/icon-192.png', size: 192, capRatio: 200 / 512 },
  // Maskelenebilir simge: harfler güvenli bölgede (merkezdeki %80'lik daire) kalsın diye küçük
  { out: 'public/icons/icon-maskable-512.png', size: 512, capRatio: 153 / 512 },
  { out: 'src/app/apple-icon.png', size: 180, capRatio: 70 / 180 },
  { ico: 16, size: 16, capRatio: 0.62 },
  { ico: 32, size: 32, capRatio: 0.56 },
  { ico: 48, size: 48, capRatio: 0.52 },
];
const GAP_RATIO = 0.09;
const OPSZ = 24;
const SCALE = 4; // büyük çizilip tarayıcıda küçültülür
const REF = 1000; // ölçü yazı boyutu

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 2400 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const fontCss = (px) =>
  `line-height:1;font-size:${px}px;font-family:var(--font-literata);font-weight:400;font-variation-settings:'opsz' ${OPSZ}`;

/** Sahneyi kâğıt zeminli bir katmana çizer (sayfanın üstünde). */
const draw = (size, html) =>
  page.evaluate(
    ({ size, html, paper }) => {
      document.getElementById('icon-stage')?.remove();
      const stage = document.createElement('div');
      stage.id = 'icon-stage';
      stage.style.cssText = `position:fixed;left:0;top:0;width:${size}px;height:${size}px;z-index:2147483647;background:${paper};overflow:hidden`;
      stage.innerHTML = html;
      document.body.appendChild(stage);
    },
    { size, html, paper: PAPER }
  );

/** Ekran görüntüsünü tarayıcıda canvas'a alır: ya mürekkep kutusunu ölçer ya da küçültür. */
const viaCanvas = (png, mode, size) =>
  page.evaluate(
    async ({ b64, mode, size }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      if (mode === 'resize') {
        c.width = c.height = size;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, size, size);
        return c.toDataURL('image/png').split(',')[1];
      }
      c.width = img.width;
      c.height = img.height;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -1,
        y1 = -1;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++) {
          if (d[(y * c.width + x) * 4] >= 128) continue;
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
      return { left: x0, right: x1 + 1, top: y0, bottom: y1 + 1 };
    },
    { b64: png.toString('base64'), mode, size }
  );

/** Harfin mürekkep kutusu, span başlangıcına (200, 200) göre, REF px yazıda. */
const inkBox = async (ch, italic) => {
  await draw(
    2400,
    `<span style="position:absolute;left:200px;top:200px;${fontCss(REF)};font-style:${italic ? 'italic' : 'normal'};color:#000">${ch}</span>`
  );
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 2400, height: 2400 } });
  const box = await viaCanvas(shot, 'measure');
  return { left: box.left - 200, right: box.right - 200, top: box.top - 200, bottom: box.bottom - 200 };
};

const b = await inkBox('B', false);
const l = await inkBox('L', true);
const capRef = b.bottom - b.top;
const ico = [];

for (const spec of SPECS) {
  const big = spec.size * SCALE;
  const k = (spec.capRatio * big) / capRef;
  const gap = GAP_RATIO * capRef * k;
  const wB = (b.right - b.left) * k;
  const inkLeft = (big - (wB + gap + (l.right - l.left) * k)) / 2;
  const top = (big - capRef * k) / 2 - b.top * k;
  const font = fontCss(REF * k);
  await draw(
    big,
    `<span style="position:absolute;left:${inkLeft - b.left * k}px;top:${top}px;${font};color:${B_COLOR}">B</span>` +
      `<span style="position:absolute;left:${inkLeft + wB + gap - l.left * k}px;top:${top}px;${font};font-style:italic;color:${L_COLOR}">L</span>`
  );
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: big, height: big } });
  const png = Buffer.from(await viaCanvas(shot, 'resize', spec.size), 'base64');
  if (spec.ico) ico.push({ size: spec.ico, png });
  else writeFileSync(join(root, spec.out), png);
}
await browser.close();

// favicon.ico: PNG girdili ICO (16/32/48)
const header = Buffer.alloc(6 + 16 * ico.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(ico.length, 4);
let offset = header.length;
ico.forEach(({ size, png }, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(png.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
writeFileSync(join(root, 'src/app/favicon.ico'), Buffer.concat([header, ...ico.map((i) => i.png)]));
console.log('Simgeler üretildi: public/icons/*, src/app/apple-icon.png, src/app/favicon.ico');
