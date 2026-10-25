// pdf.js'in çalışma zamanında yüklediği dosyaları public/pdfjs/ altına kopyalar:
// worker, Adobe CMap'leri, standart fontlar, wasm çözücüleri ve ICC profilleri.
// `npm install` (postinstall) ve `npm run dev/build` (pre*) sırasında çalışır; klasör git'e girmez.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve('pdfjs-dist/package.json'));
const out = join(root, 'public', 'pdfjs');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(pkgDir, 'build', 'pdf.worker.min.mjs'), join(out, 'pdf.worker.min.mjs'));
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  const from = join(pkgDir, dir);
  if (existsSync(from)) cpSync(from, join(out, dir), { recursive: true });
}
console.log(`pdf.js varlıkları kopyalandı → ${out}`);
