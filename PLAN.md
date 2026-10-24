# BMO Learn — 10 Adımlık Refactor Planı

Dal: `refactor/bmo-optimizasyon`. Her adım en az bir commit'tir ve her adımın sonunda `npm run typecheck`, `npm run lint` (0 hata) ve `npm run build` hatasız geçmelidir. Her adımın sonunda [ANALYSIS.md §5](ANALYSIS.md#5-manuel-test-kontrol-listesi) test listesi tekrarlanır. Bulgu ID'leri (S1, B3…) ANALYSIS.md'ye atıftır.

**Genel kurallar:** `bmo_*` localStorage anahtarları ve veri biçimleri korunur. Biçim değişikliği gerekirse versiyonlu migrasyon ile yapılır, eski veri kaybolmaz.

---

## Adım 1 — Temel ve güvenlik ağı ✅
- **Amaç:** Refactor'a güvenli bir başlangıç noktası oluşturmak.
- **Yapılacaklar:** Dal açmak; baseline build/lint/tsc çıktılarını kaydetmek; Prettier + eslint-config-prettier eklemek; `typecheck`/`format`/`check` script'leri; TS strict durumunu ölçmek; lint'i 0 hataya indirmek (davranış nötr düzeltmeler + belgelenmiş geçici uyarılar); ANALYSIS.md, PLAN.md ve test listesini yazmak.
- **Dosyalar:** `package.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `docs/baseline/*`, `ANALYSIS.md`, `PLAN.md`, `app/page.tsx` (yalnızca 6 lint düzeltmesi).
- **Bitti kriteri:** `npm run check` yeşil; baseline dosyaları commit'li; geçici olarak uyarıya düşürülen 3 kural config'de ilgili plan adımıyla işaretli.
- **Risk:** Yok (davranış değişmez).
- **Zorluk:** Kolay.

## Adım 2 — Dosya parçalama (saf taşıma) ✅
- **Amaç:** 2000 satırlık `page.tsx`'i sorumluluk bazlı modüllere bölmek; davranış, görünüm ve depolama birebir aynı kalır.
- **Yapılacaklar:** `app/` → `src/app/`; `@/*` → `./src/*`. `types`, `constants`, `lib` (format, youtube, markdown, notifications), `store`, `components/*`, `hooks/*`. `App` içindeki mantık hook'lara (`useAppInit`, `usePomodoroTimer`, `useYouTubePlayers`, `useKeyboardShortcuts`, `useFullscreen`) gövdeleri değişmeden taşınır. `page.tsx` yalnızca bileşenleri birleştirir. `any` prop'lar yerine prop arayüzleri yazılır. Prettier ayrı bir commit olarak uygulanır.
- **Dosyalar:** `src/**`, `tsconfig.json`, ANALYSIS.md §6.
- **Bitti kriteri:** `npm run check` yeşil; `page.tsx` < 250 satır; hiçbir dosya > 400 satır değil; `bmo_*` anahtar listesi değişmemiş (`grep`); dev sunucusunda landing 200 ve konsol temiz; test listesindeki kodla doğrulanabilen maddeler işaretlendi.
- **Risk:** Hook sırası/closure'lar (özellikle `initMainPlayer`'ın yakaladığı `contentConfig`) aynı kalmalı; Tailwind sınıfları birebir kopyalanmalı. JSX elle değil, kaynak metin olarak taşınır.
- **Zorluk:** Orta.

## Adım 3 — Stil ve tema
- **Amaç:** Tek bir tema yöntemi, FOUC'un giderilmesi, temiz Tailwind kullanımı.
- **Yapılacaklar:** `ThemeStyles` → `globals.css` (`@theme` token'ları: `--color-primary` vb.); `@custom-variant dark` ile `data-theme` tek kaynak (T2); `<head>`'de inline tema script'i (T1); skeleton'ın değişkenleri görmesi ve yapay 500 ms'nin kaldırılması (B20); `lg:max-h-auto` → `lg:max-h-none` (B18); görünmez ayraçlar (B19); `mt-[68px]` yerine grid hizalaması (T3); `-webkit-app-region` kaldırma (T4); `lang="tr"`, metadata, `translate="no"` (T6); font kararı (T5); `#FF8C00` → token (T7).
- **Dosyalar:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/**` (sınıf adları), `ThemeStyles.tsx` (silinir).
- **Bitti kriteri:** Açık tema + OS koyu kombinasyonunda `dark:` stili uygulanmıyor; yenilemede tema flaşı yok (Performance kaydında ilk karede doğru tema); `#FF8C00` sayısı ≤ 5; görsel karşılaştırma (önce/sonra ekran görüntüleri, her iki tema, 375 px / 1440 px) farkı yalnızca düzeltilen hatalarda.
- **Risk:** Görsel regresyon; hydration uyarısı (`suppressHydrationWarning` gerekir).
- **Zorluk:** Orta.

## Adım 4 — State ve depolama
- **Amaç:** Dayanıklı, doğrulanan, versiyonlanan kalıcı state.
- **Yapılacaklar:** Store'u slice'lara ayırmak (content, study, history, pomodoro, ui); zustand `persist` + özel storage: **mevcut `bmo_*` anahtarlarını okuyan/yazan** adaptör, `version` + `migrate`; okuma sırasında zod doğrulaması, bozuk anahtarı `bmo_backup_*`'a alıp sıfırlama (S7); `crypto.randomUUID()` + eski sayı id'lerin migrasyonu (B10); `QuotaExceededError` yakalama + kullanıcı uyarısı (B11); immutable `addToHistory` (B15); yetim veri ve `videoProgress` temizliği (B6, B16, P4); JSON yedek dışa/içe aktarma (Ayarlar).
- **Dosyalar:** `src/store/**`, `src/lib/storage.ts`, `src/lib/schemas.ts`, `src/hooks/useAppInit.ts`, ayarlar UI.
- **Bitti kriteri:** Refactor öncesi bir localStorage dökümü yüklendiğinde tüm veri görünüyor (fixture ile birim test); bozuk JSON ile uygulama açılıyor ve uyarı gösteriyor; dışa aktar → temizle → içe aktar sonrası veri aynı; `no-explicit-any` store'da 0.
- **Risk:** **Veri kaybı.** Migrasyon geri dönüşsüz olmamalı; ilk yazımdan önce ham yedek alınmalı.
- **Zorluk:** Zor.

## Adım 5 — Güvenlik sertleştirme
- **Amaç:** Güvenilmez girdinin (AI çıktısı, URL, dosya) güvenli işlenmesi ve tarayıcı korumaları.
- **Yapılacaklar:** `react-markdown` (HTML kapalı, izinli elemanlar, link'lerde `rel="noopener noreferrer"` ve yalnızca `https:`) ile `dangerouslySetInnerHTML` kaldırma (S1, B12); URL doğrulama yardımcısı (S2); AI JSON için zod şeması + normalize (`correct` büyük harf, adet/uzunluk sınırı, hatalı öğe raporu) (S4); uygulama düzeyinde Error Boundary; dosya MIME + `%PDF-` imza kontrolü (S3); `next.config.ts` `headers()`: CSP (önce Report-Only, sonra zorunlu), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` (S5); yerel bildirim sesi (S6); `SECURITY.md`.
- **Dosyalar:** `src/lib/markdown.tsx`, `src/lib/url.ts`, `src/lib/schemas.ts`, `src/components/ai/AIModal.tsx`, `src/components/ErrorBoundary.tsx`, `next.config.ts`, `public/sounds/*`, `SECURITY.md`.
- **Bitti kriteri:** XSS test girdileri (`<img onerror>`, `[x](javascript:…)`, `<script>`) metin olarak görünüyor; şemaya uymayan JSON çökme yerine anlaşılır bir hata veriyor; CSP ihlali olmadan YouTube, radyo ve PDF çalışıyor (konsol temiz); securityheaders.com eşdeğeri başlık kontrolü.
- **Risk:** CSP'nin YouTube iframe API'sini ya da Next inline script'lerini kırması (nonce/hash gerekebilir).
- **Zorluk:** Orta.

## Adım 6 — YouTube ve radyo
- **Amaç:** Oynatıcı yaşam döngüsünün doğru yönetimi.
- **Yapılacaklar:** Promise tabanlı tekil `loadYouTubeApi()` (B2); `useYouTubePlayer(elementRef, options)` hook'u: create/destroy, unmount cleanup, ref sıfırlama (B1); callback'lerde `getState()`/ref ile stale closure'ı gidermek (B3); belge moduna geçerken videoyu durdurmak (B3); radyoyu ayrı `useRadio` hook'u ve bileşenine taşımak; YT tipleri (`@types/youtube` ya da yerel `.d.ts`); hata durumları (API yüklenemedi, gömme kapalı, 101/150 kodları); `react-hooks/immutability` → error.
- **Dosyalar:** `src/lib/youtube.ts`, `src/hooks/useYouTubePlayer.ts`, `src/hooks/useRadio.ts`, `src/components/player/*`, `src/components/radio/*`.
- **Bitti kriteri:** Test #3–9, #14, #29, #30 tarayıcıda geçiyor; Landing ↔ App 5 kez gidip gelince oynatıcı çalışıyor ve DOM'da tek `iframe_api` script'i var; YouTube kodunda `any` yok.
- **Risk:** YouTube API'sinin zamanlama tuhaflıkları; playlist index senkronu.
- **Zorluk:** Zor.

## Adım 7 — Pomodoro ve zamanlayıcı
- **Amaç:** Doğru ve hafif bir zamanlayıcı.
- **Yapılacaklar:** `endsAt` zaman damgası tabanlı sayaç (arka planda sapma yok) (B4); zamanlayıcı state'ini store'a ya da izole bir bileşene taşıyıp `App`'in saniyelik render'ını bitirmek (P1); yerel tarih anahtarı `YYYY-MM-DD` (B4; mevcut UTC kayıtlar olduğu gibi bırakılır, isteğe bağlı migrasyon); interval/timeout temizliği; bildirim iznini ilk "Odaklan" tıklamasında istemek; tek global başlık-blink kontrolcüsü (B5); isteğe bağlı olarak süre bitişini `visibilitychange` ile yakalamak.
- **Dosyalar:** `src/hooks/usePomodoroTimer.ts`, `src/store/pomodoro*`, `src/components/pomodoro/*`, `src/lib/notifications.ts`, `src/lib/date.ts`.
- **Bitti kriteri:** Sekme 10 dk arka planda kaldıktan sonra sapma < 1 sn; React DevTools Profiler'da zamanlayıcı çalışırken yalnızca zamanlayıcı bileşeni render oluyor; 00:30'da (TR) tamamlanan pomodoro o güne yazılıyor (birim test, sahte saat).
- **Risk:** Mevcut ısı haritası verisinin 3 saatlik kayması (migrasyon kararı).
- **Zorluk:** Orta.

## Adım 8 — PDF ve belgeler
- **Amaç:** Mobilde çalışan, kalıcı bir belge deneyimi.
- **Yapılacaklar:** `pdfjs-dist` tabanlı görüntüleyici (lazy, worker, sayfa sanallaştırma, yakınlaştırma, metin seçimi → not) (A3, S3); IndexedDB'de PDF saklama (kota kontrolü, boyut sınırı, "bu cihazda sakla" seçeneği) (A4); `URL.revokeObjectURL` (B10); tek `openDocument()` akışı ve dashboard yüklemesinin geçmişe eklenmesi (B14); web adresi dalı için karar uygulaması (B8).
- **Dosyalar:** `src/components/player/PdfViewer.tsx`, `src/lib/idb.ts`, `src/components/landing/*`, `src/components/player/*`.
- **Bitti kriteri:** iOS Safari ve Android Chrome'da çok sayfalı PDF kaydırılabiliyor; sayfa yenilenince ve geçmişten açınca PDF dosya seçmeden geliyor (saklama açıksa); 10 yükleme sonrası blob URL sızıntısı yok.
- **Risk:** pdf.js bundle boyutu (lazy yükleme şart); worker'ın CSP ile uyumu; IndexedDB kotası (Safari).
- **Zorluk:** Zor.

## Adım 9 — Performans, erişilebilirlik, mobil
- **Amaç:** Akıcı, erişilebilir, dokunmatik dostu bir arayüz.
- **Yapılacaklar:** Tüm `useStore()` çağrılarını selector + `useShallow`'a çevirmek (P1); `memo`/`useMemo` gereken yerler; `next/dynamic` ile modallar ve widget'lar (P3); `next/image` ya da boyutlu `<img>` + `alt`; ortak `<Modal>` (role="dialog", aria-modal, Escape, focus trap, odak iadesi) (A2); ikon butonlarına `aria-label`; dokunmatikte görünür silme butonları (A1); state tabanlı, klavyeyle çevrilebilen flashcard (B13); onaylı silme ve AI değiştirme akışları + "geri al" (B6, B7); not dışa aktarma düzeltmesi ve pano fallback'i (B9, B17); kısayol düzeltmesi (B21); `set-state-in-effect` → error. Lighthouse ölçümü önce ve sonra.
- **Dosyalar:** `src/components/**`, `src/components/ui/Modal.tsx`, `src/components/ui/ConfirmDialog.tsx`.
- **Bitti kriteri:** Lighthouse (mobil) Erişilebilirlik ≥ 95, Performans önceki ölçüme göre düşmemiş, Best Practices ≥ 95; axe'te kritik ihlal yok; tüm akışlar yalnızca klavyeyle tamamlanabiliyor; 375 px'te yatay kaydırma yok.
- **Risk:** Modal odak yönetiminin YouTube iframe'iyle çakışması.
- **Zorluk:** Orta–Zor.

## Adım 10 — PWA, test, teslim
- **Amaç:** Kurulabilir, test edilmiş, belgelenmiş bir sürüm.
- **Yapılacaklar:** `src/app/manifest.ts`; gerçek 192/512 + maskable ikonlar; service worker (Serwist ya da elle; uygulama kabuğu önbelleği, YouTube'u önbelleklememe) ve `PWAInjector`'ın kaldırılması (W1); Vitest birim testleri (lib, schemas, store migrasyonu, tarih, markdown güvenliği); Playwright duman testleri (landing → video, PDF, not, AI içe aktarma, tema, geçmiş silme); README, CHANGELOG; bağımlılık güncellemesi ve `npm audit` (K3 bu adımdan önce yapılmadıysa); geçici lint gevşetmelerinin tamamen kaldırıldığının kontrolü.
- **Dosyalar:** `src/app/manifest.ts`, `public/icons/*`, `src/app/sw.ts` (ya da `public/sw.js`), `vitest.config.ts`, `tests/**`, `playwright.config.ts`, `README.md`, `CHANGELOG.md`, `.github/workflows/ci.yml` (isteğe bağlı).
- **Bitti kriteri:** Chrome'da "Yükle" çalışıyor, Lighthouse PWA kontrolleri geçiyor, uygulama kabuğu çevrimdışı açılıyor; `npm test` ve `npx playwright test` yeşil; `npm audit --omit=dev` yüksek/kritik açık göstermiyor; ESLint config'de geçici override kalmamış.
- **Risk:** Service worker önbelleğinin eski sürümü tutması (sürümleme + güncelleme bildirimi).
- **Zorluk:** Orta.
