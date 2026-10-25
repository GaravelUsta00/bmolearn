// scripts/sw.source.js → public/sw.js, sürüm basılarak. Her derleme yeni bir sürüm üretir; tarayıcı
// değişen sw.js'i görünce güncellemeyi indirir ve uygulama "Yeni sürüm hazır" der.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

let rev = '';
try {
  rev = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // git yoksa (ör. arşivden kurulum) yalnızca zaman damgası
}
const version = [pkg.version, rev, Date.now().toString(36)].filter(Boolean).join('-');

const source = readFileSync(new URL('scripts/sw.source.js', root), 'utf8');
if (!source.includes('__BUILD_VERSION__')) throw new Error('sw.source.js içinde __BUILD_VERSION__ yok');
writeFileSync(new URL('public/sw.js', root), source.replace('__BUILD_VERSION__', version));
console.log(`service worker: public/sw.js (sürüm ${version})`);
