/* BeLearn service worker. Kaynak: scripts/sw.source.js → `npm run build` / `npm run dev` öncesinde
 * scripts/build-sw.mjs tarafından sürüm basılarak public/sw.js'e yazılır (public/sw.js git'e girmez).
 *
 * Strateji (SECURITY.md, "Service worker"):
 * - Sayfa gezintisi: önce ağ, ağ yoksa önbellekteki uygulama kabuğu ("/").
 * - /_next/static/*: dosya adları içerik özetli → önce önbellek.
 * - Diğer aynı kaynaklı dosyalar (ikonlar, ses, pdf.js, manifest): önbellekteyse hemen ver, arkada tazele.
 * - Başka kaynaklar (YouTube oynatıcısı, küçük resimler) ve blob:/data: istekleri HİÇ yakalanmaz, önbelleğe alınmaz.
 * - Kullanıcı verisi (localStorage, IndexedDB) service worker'dan geçmez.
 * - Yeni sürüm kendiliğinden devreye girmez: sayfa "Yenile" dediğinde (SKIP_WAITING) etkinleşir.
 */
const VERSION = '__BUILD_VERSION__';
const SHELL_CACHE = `belearn-shell-${VERSION}`;
const ASSET_CACHE = `belearn-assets-${VERSION}`;
const SHELL_URL = '/';
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/sounds/bildirim.wav'];

// Kabuk HTML'indeki script/stil/font adreslerini de önbelleğe al: ilk ziyaretten sonra çevrimdışı açılsın.
const assetsInHtml = (html) =>
  [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })));
      const res = await shell.match(SHELL_URL);
      if (res) {
        const assets = await caches.open(ASSET_CACHE);
        await Promise.all(assetsInHtml(await res.clone().text()).map((u) => assets.add(u).catch(() => {})));
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
      for (const key of await caches.keys()) if (key.startsWith('belearn-') && !keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  // Sayfa, SW'den önce yüklediği dosyaları bildirir (ör. ilk ziyarette indirilen çalışma ekranı paketi).
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(ASSET_CACHE).then((cache) =>
        Promise.all(
          data.urls
            .filter((u) => typeof u === 'string' && new URL(u, self.location.origin).origin === self.location.origin)
            .filter((u) => new URL(u, self.location.origin).pathname.startsWith('/_next/static/'))
            .map((u) =>
              cache
                .match(u)
                .then((hit) => hit || cache.add(u))
                .catch(() => {})
            )
        )
      )
    );
  }
});

const cacheFirst = async (request) => {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
};

const staleWhileRevalidate = async (request, event) => {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  return (await refresh) || Response.error();
};

const networkFirstPage = async (request) => {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const res = await fetch(request);
    // Tek sayfalık uygulama: tüm gezintiler aynı kabuğu kullanır, en tazesi saklanır.
    if (res.ok && new URL(request.url).pathname === SHELL_URL) cache.put(SHELL_URL, res.clone());
    return res;
  } catch {
    return (await cache.match(SHELL_URL)) || Response.error();
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // YouTube vb. dokunulmaz
  if (request.headers.has('range')) return; // kısmi istekler (ses) tarayıcıya bırakılır
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
  } else if (!url.search) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});

// Pomodoro bildirimi tıklanınca açık BeLearn sekmesine dön (yoksa aç).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const client = all.find((c) => new URL(c.url).origin === self.location.origin);
      if (client) return client.focus();
      return self.clients.openWindow('/');
    })()
  );
});
