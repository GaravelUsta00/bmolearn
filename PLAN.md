# BeLearn — 10 Adımlık Refactor Planı

> Revizyon 2 (2026-10-24): marka "BeLearn", tasarım sistemi ([docs/DESIGN.md](docs/DESIGN.md)), `belearn_*` depolama anahtarları ve kullanıcı kararları işlendi. Kararların gerekçesi ve bulgu eşlemesi için bkz. [ANALYSIS.md §8](ANALYSIS.md#8-marka-ve-tasarım-kararları-revizyon-2).

Dal: `refactor/bmo-optimizasyon`.

## Her adım için geçerli kurallar

1. Her adım en az bir commit'tir; büyük adımlar alt commit'lere bölünür. Bir adım bitince durulur ve onay beklenir.
2. **Kapı:** `npm run typecheck`, `npm run lint` (0 hata), `npm run build` hatasız geçer.
3. **Bitti kriterinin ortak maddesi:** [ANALYSIS.md §5](ANALYSIS.md#5-manuel-test-kontrol-listesi) test listesi tekrarlandı (otomatik duman testi + işaretli manuel maddeler) **ve veri kaybı yok**: refactor öncesi bir `bmo_*` dökümü yüklendiğinde tüm notlar, kartlar, sorular, özetler, görevler, geçmiş, pomodoro ve ilerleme görünür.
4. **İşlev korunur:** Görünüm değişirken hiçbir işlev, kısayol, veri alanı ya da depolama davranışı kaybolmaz. Mavi ışık filtresi, tam ekran, radyo, pomodoro, AI sihirbazı, playlist, geçmiş ve PWA aynen çalışır. Kısayol değişikliği yalnızca Adım 9'da yapılır.
5. **Depolama:** `bmo_*` anahtarları **asla silinmez, asla üzerine yazılmaz** (Adım 4'ten itibaren). Yeni anahtarlar `belearn_*`.
6. **Tasarım:** Adım 3'ten itibaren dokunulan her bileşen [docs/DESIGN.md](docs/DESIGN.md)'ye uyar; adım sonunda DESIGN §11 kontrol komutları çalıştırılır.
7. Görsel değişiklik içeren adımlarda önce/sonra ekran görüntüleri alınır (iki tema × 375 / 1440 px). Piksel eşitliği yalnızca görsel değişiklik içermeyen adımlarda beklenir.

---

## Adım 1 — Temel ve güvenlik ağı ✅
- Dal, baseline (`docs/baseline/`), Prettier, `typecheck`/`format`/`check` script'leri, lint'te 0 hata (3 kural belgelenmiş şekilde geçici olarak uyarıda), ANALYSIS.md, PLAN.md, test listesi.

## Adım 2 — Dosya parçalama (saf taşıma) ✅
- `src/` yapısı, 41 modül, 5 hook; `page.tsx` 166 satır. Edge'de 31/31 senaryo ve 16/16 ekran görüntüsü eski sürümle birebir aynı ([ANALYSIS §7](ANALYSIS.md#7-doğrulama-kayıtları)).

---

## Adım 3 — Güvenlik yükseltmesi, marka, tasarım altyapısı, Landing ve üst çubuk ✅

> **Tamamlandı (2026-10-24):** 3a–3g commit'lendi. `npm audit` 0 açık; duman testi v2 45/45 geçti. Ayrıntılı kayıt, sapmalar (yer tutucu ikonlar 3d'de, sekme şeridi 3f'de, kapanış solması Adım 9'da) ve bilinçli davranış değişiklikleri: [ANALYSIS.md §7, Adım 3](ANALYSIS.md#adım-3-güvenlik-yükseltmesi-marka-tasarım-altyapısı).

**Amaç:** Kritik açığı kapatmak; BeLearn markasına ve yeni tasarım sistemine geçmek; cam efekti ve turuncuyu tamamen kaldırmak; tema/FOUC ve stil bulgularını (T1–T7, B18–B20) çözmek.

**Alt commit'ler (sırayla):**
1. **3a `chore(deps)`: Next güvenlik yükseltmesi, tek başına.** `next` ve `eslint-config-next` → 16.4.x. `node_modules/next/dist/docs/` içindeki 16.2 → 16.4 değişiklikleri okunur. `npm audit` tekrar alınır. **Kapı:** build + otomatik duman testi + test listesi yeşil olmadan 3b'ye geçilmez (bu commit'te görsel değişiklik yok, ekran görüntüleri Adım 2 ile piksel eşit olmalı).
2. **3b `chore`:** `errors.txt` silinir; `package.json` adı `bmo-learn` → `belearn` (karar #7).
3. **3c `feat(design)`: Tasarım altyapısı.**
   - globals.css: DESIGN §3 token'ları, `@theme inline`, `data-theme`, `@custom-variant dark`, radius ve gölge token'ları, odak halkası, `prefers-reduced-motion`.
   - `ThemeStyles.tsx` kaldırılır; `--filter-warm` istisnası eklenir.
   - `layout.tsx`: Literata + DM Mono (`next/font/google`, `latin-ext`), Geist kaldırılır, `lang="tr"`, `metadata` (BeLearn), inline tema script'i, `suppressHydrationWarning`, `color-scheme` (T1, T2, T5, T6).
   - `useAppInit`'teki yapay 500 ms beklemesi ve tema okuma mantığı script'e taşınır; `setTheme` `data-theme` yazar (anahtar hâlâ `bmo_theme`) (B20).
   - `-webkit-app-region` kaldırılır (T4).
4. **3d `feat(brand)`: BeLearn.**
   - Kullanıcıya görünen tüm "BMO" geçişleri değişir (liste: ANALYSIS §8.1): `document.title`, metadata, PWA manifest `name`/`short_name`/`theme_color`, Ana Ekrana Ekle metni, not dosyası başlığı ve varsayılan dosya adı.
   - Metin logo; `/logo.png` kullanımları kaldırılır (bildirim ikonu Adım 10'daki yer tutucuya kadar kullanılmaz).
   - README'nin ilk bölümü BeLearn olarak güncellenir; tam README Adım 10'da.
5. **3e `feat(landing)`: Landing yeniden tasarımı** (DESIGN §8.1).
   - Placeholder "YouTube bağlantısı ya da PDF".
   - Kitaplık rafı: en fazla 12 sırt, Koleksiyon etiketi; rafın sağında "Tüm geçmiş" metin bağlantısı Geçmiş modalını açar (karar #3).
   - Raftan PDF açınca mevcut "yeniden yükle" akışı korunur.
   - Landing'deki "Geçmişi Temizle" düğmesi kalkar; "Tümünü temizle" yalnızca Geçmiş modalında (onay Adım 9'da) (karar #3).
   - "Sadece PDF desteklenir" metni ve ilovepdf.com bağlantısı kalkar (karar #4).
   - Yükleme koreografisi; `SkeletonLoading` kaldırılır.
   - Web adresi **mantığı** Adım 8'de kaldırılır. Bu adımda yalnızca metin ve placeholder değişir; arada YouTube dışı bir girdi bugünkü gibi "Desteklenmeyen Format" gösterir.
6. **3f `feat(header)`: Üst çubuk** (DESIGN §8.2).
   - Pomodoro kontrolü (DESIGN §8.2.1): kalan süre (DM Mono) + "Odaklan"/"Duraklat" + açılır ayar paneli (odak dk, mola dk, hazır ayarlar, "Görevler ve harita" bağlantısı). Mevcut `usePomodoroTimer` state'ini kullanır; widget ile aynı kaynak (karar #6).
   - Tema (Gece/Gündüz), geçmiş, radyo, ses, tam ekran.
   - Playlist düğmesi yalnızca playlist varken görünür (karar #2).
   - "Ayarlar" menüsü: mavi ışık filtresi, uygulamayı yükle (PWA); Adım 4a'dan itibaren "Yedeği indir / yükle" (karar #2). `SettingsPopover` bu menüye dönüşür.
   - İlerleme yüzdesi ve not/kart/soru sayaçları üst çubuktan kalkar, sağ paneldeki sekme sayaçlarına taşınır (karar #2; panelin tam tasarımı Adım 9).
7. **3g `style`: Geçiş boyaması.** Henüz yeniden tasarlanmamış tüm bileşenlerde mekanik token değişimi:
   - turuncu → `ribbon`
   - cam → `page`
   - `rounded-*` → 2px / tam yuvarlak
   - `blue/info` → `ink`/`ok`/metin
   - süs animasyonları kaldırılır (`taskComplete` hariç; Adım 7'ye kadar korunur)
   - B18 (`lg:max-h-none`), B19 (görünür ayraçlar), T3 (`mt-[68px]` → grid hizalaması), T7 (sabit renk yok)

   Bu bileşenlerin tam tasarımı Adım 6–9'da yapılır.

**Dosyalar:** `package.json`, `package-lock.json`, `errors.txt` (silinir), `src/app/{globals.css,layout.tsx}`, `src/hooks/useAppInit.ts`, `src/store/useStore.ts` (yalnızca `setTheme`), `src/components/**` (3g), `src/components/landing/*`, `src/components/layout/*`, `src/components/pwa/*`, `src/lib/notifications.ts`, `README.md`, `docs/DESIGN.md` (gerekirse).

**Bitti kriteri:**
- `npm audit --omit=dev`: kritik açık yok.
- DESIGN §11 komutları 0 sonuç veriyor (istisnalar hariç): turuncu, cam, blob, gradient, `rounded-xl/2xl/3xl`, bileşenlerde sabit hex yok.
- Kullanıcıya görünen hiçbir yerde "BMO" geçmiyor.
- Yenilemede tema flaşı yok (Performance kaydında ilk karede doğru tema).
- OS koyu + uygulama Gündüz kombinasyonunda karanlık stiller uygulanmıyor.
- Landing yalnızca DESIGN §8.1'deki 6 öğeyi içeriyor.
- Kontrast tablosu doğrulandı.
- `prefers-reduced-motion`'da animasyon yok.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:**
- 16.2 → 16.4 arasında kırılan bir API olabilir (AGENTS.md uyarısı) → 3a ayrı ve geri alınabilir.
- 3g'de mekanik boyama ara bir görünüm üretir; bileşenler sonraki adımlarda ikinci kez elden geçer (bilinçli çift iş).
- Inline script ile hidrasyon uyuşmazlığı.
- Rafın hidrasyondan sonra belirmesi yerleşim kaymasına yol açabilir.
- Font dosyası boyutu (Literata variable + italik).

**Zorluk:** Zor (en büyük görsel adım).

---

## Adım 4 — Yedek, state ve depolama (`belearn_*`) ✅

> **Tamamlandı (2026-10-24):** 4a–4d commit'lendi. Depolama testi 20/20, duman testi 45/45. Sapmalar: `persist` yerine alan-başına-anahtar abonelik katmanı, geçmiş sınırı 30 → 200. Ayrıntı: [ANALYSIS.md §7, Adım 4](ANALYSIS.md#adım-4-yedek-state-ve-depolama).

**Amaç:** Dayanıklı, doğrulanan, versiyonlanan kalıcı state ve kullanıcının kendi verisini yedekleyebilmesi.

> **Karar #1 (2026-10-24):** Eski adres tamamen bırakılıyor; BeLearn yeni adreste sıfırdan yayınlanacak. Bu yüzden adresler arası taşıma (eski siteye yedek düğmesi ya da taşıma sayfası) **yapılmaz**. Yedek özelliği genel amaçlı bir yedek/geri yükleme olarak kalır. `bmo_*` → `belearn_*` kopyası yalnızca aynı adreste (yerel geliştirme, `localhost`) veri bulunursa çalışan basit bir güvenlik ağıdır: kopyala → doğrula → başarısızsa kopyayı geri al. Salt okunur geri dönüş modu kapsamdan çıkarıldı.

**Alt commit'ler:**
1. **4a — İLK commit: "Yedeği indir / Yedeği yükle"** (depolamaya henüz dokunmadan).
   - **İndir:** O an localStorage'da bulunan tüm `bmo_*` (ve varsa `belearn_*`) anahtarları ham haliyle `belearn-yedek-YYYY-AA-GG.json` dosyasına yazılır (`{ app: 'BeLearn', format: 1, exportedAt, source: location.origin, data: {...} }`).
   - **Yükle:** Bu dosyayı ve ham `bmo_*` dökümünü (anahtar → string) kabul eder. Önizleme gösterir (kaç not/kart/soru…), onay ister, yalnızca boş ya da onaylanan anahtarlara yazar; mevcut veriyi kaybettirmez.
   - Ayarlar menüsünde belirgin bir "Verilerini taşı" bölümü.
2. **4b — Store slice'ları:** content, study, history, pomodoro, ui. Görünümler arası korunan UI state'i (`newNote`, `videoUrlInput`, `activeTab`…) `ui` slice'ına taşınır (K8).
3. **4c — Persist + `belearn_*` + migrasyon:**
   - zustand `persist` + özel storage adaptörü; anahtarlar `belearn_notes`, `belearn_flashcards`, … `belearn_theme`, ayrıca `belearn_meta` (`{ version, migratedFrom, migratedAt }`).
   - **İlk açılış migrasyonu:** hiçbir `belearn_*` yoksa ve `bmo_*` varsa, `bmo_*` → `belearn_*` **kopyalanır** (silinmez), okunup zod ile doğrulanır, kayıt sayıları karşılaştırılır. Başarısızsa yazılan `belearn_*` anahtarları geri alınır, uygulama boş açılır ve kullanıcıya "eski veriler aktarılamadı; yedek dosyasıyla yükleyebilirsin" uyarısı gösterilir.
   - `bmo_*` bundan sonra **hiç yazılmaz**.
4. **4d — Doğrulama ve dayanıklılık:**
   - Okumada zod; bozuk anahtar `belearn_backup_<anahtar>_<zaman>` altına alınıp sıfırlanır ve uyarı gösterilir (S7).
   - `QuotaExceededError` yakalanır ve kullanıcıya bildirilir (B11).
   - `crypto.randomUUID()`; eski sayı id'ler korunur ya da eşlenir (B10).
   - Immutable `addToHistory` (B15).
   - Yetim veri ve `videoProgress` temizliği (B6, B16, P4); onaylı akış Adım 9'da.

**Test verisi:** Gerçek bir `bmo_*` dökümü varsa `fixtures/local/bmo-dump.json` (**.gitignore'da, commit edilmez**). Yoksa eski formatta gerçekçi sahte veri üretilir: sayı id'ler, `Date.now()+Math.random()` ondalıklı id'ler, `pId`'li ve `id`'siz eski geçmiş kayıtları, playlist koleksiyonu, UTC tarihli pomodoro.

**Dosyalar:** `src/store/**`, `src/lib/storage.ts`, `src/lib/backup.ts`, `src/lib/schemas.ts`, `src/hooks/useAppInit.ts`, Ayarlar UI, `.gitignore`, `tests/fixtures/` (sahte veri).

**Bitti kriteri:**
- Yedek indir → tarayıcı verisini temizle → yedek yükle sonrası veri birebir aynı.
- Ham `bmo_*` dökümü yüklenince her şey görünüyor.
- Migrasyon sonrası `bmo_*` anahtarları byte-byte değişmemiş.
- Bozuk JSON ile uygulama açılıyor ve uyarı gösteriyor.
- Store'da `no-explicit-any` 0.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:**
- **Veri kaybı** (en yüksek risk) → kopyala-doğrula-geri al akışı ve 4a yedeği önce.
- Persist hidrasyonu ile ilk render arasındaki fark.
- Farklı adresteki (origin) veriye bu migrasyon erişemez; karar #1 gereği bu kabul edildi.

**Zorluk:** Zor.

---

## Adım 5 — Güvenlik sertleştirme ✅

> **Tamamlandı (2026-10-24):** Güvenlik testi 20/20 (zorunlu CSP), duman 45/45, depolama 20/20. CSP ödünleşimi (`'unsafe-inline'` script) ve zod `jitless` kararı: [SECURITY.md](SECURITY.md), [ANALYSIS.md §7, Adım 5](ANALYSIS.md#adım-5-güvenlik-sertleştirme).

**Amaç:** Güvenilmez girdinin güvenli işlenmesi ve tarayıcı korumaları.

**Yapılacaklar:**
- `react-markdown` (HTML kapalı, izinli elemanlar; link'ler yalnızca `https:` ve `rel="noopener noreferrer"`); `dangerouslySetInnerHTML` tamamen kalkar (S1, B12).
- Markdown çıktısı yeni tipografiyle: başlık/liste/alıntı/kod stilleri DESIGN §5 ve §8.4'e göre; özetteki drop cap için ilk paragraf işaretlenir.
- AI JSON zod şeması + normalize (`correct` büyük harf, adet ve uzunluk sınırı, hatalı öğe raporu) (S4).
- Uygulama düzeyinde Error Boundary (yeni tasarımla).
- URL doğrulama yardımcısı (S2).
- Dosya MIME + `%PDF-` imza kontrolü (S3).
- `next.config.ts` başlıkları (önce `Report-Only`, sonra zorunlu): CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` (S5).
- Yerel bildirim sesi (S6).
- `SECURITY.md` taslağı (son hali Adım 10'da).

**Dosyalar:** `src/lib/markdown.tsx`, `src/lib/url.ts`, `src/lib/schemas.ts`, `src/components/ai/AIModal.tsx`, `src/components/ErrorBoundary.tsx`, `next.config.ts`, `public/sounds/*`, `SECURITY.md`.

**Bitti kriteri:**
- XSS test girdileri (`<img onerror>`, `[x](javascript:…)`, `<script>`) düz metin olarak görünüyor.
- Şemaya uymayan JSON çökme yerine anlaşılır bir hata veriyor.
- CSP ihlali olmadan YouTube, radyo ve PDF çalışıyor (konsol temiz).
- Markdown iki temada DESIGN'a uygun.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:**
- CSP'nin YouTube iframe API'sini ya da Next ve tema inline script'lerini kırması (nonce/hash gerekebilir; tema script'i hash ile).
- Mevcut özetlerde `react-markdown` ile farklı görünen biçimlendirmeler.

**Zorluk:** Orta.

---

## Adım 6 — YouTube ve radyo (+ yeni tasarım) ✅

> **Tamamlandı (2026-10-25):** Oynatıcı testi 19/19, duman 45/45, güvenlik 20/20, depolama 20/20. "Lofi Hip Hop" istasyonu gömülebilir bir yayınla değiştirildi; "Karadeniz Akustik" için karar bekleniyor. Ayrıntı: [ANALYSIS.md §7, Adım 6](ANALYSIS.md#adım-6-youtube-ve-radyo).

**Amaç:** Oynatıcı yaşam döngüsünü düzeltmek; video, playlist ve radyo bileşenlerini yeni tasarımla yeniden yazmak.

**Yapılacaklar:**
- Promise tabanlı tekil `loadYouTubeApi()` (B2).
- `useYouTubePlayer`: create/destroy, unmount cleanup, ref sıfırlama (B1).
- Callback'lerde `getState()`/ref kullanımı; belge moduna geçerken video durdurulur (B3).
- `useRadio` ayrı hook (K7).
- YT tipleri; hata durumları (API yüklenemedi, gömme kapalı, 101/150).
- `react-hooks/immutability` → error.
- **Bileşenler yeniden yazılır:**
  - `ContentViewer`: video "şekli", `plate` zemin, italik başlık (DESIGN §8.3); YouTube'un kendi kontrolleri kalır.
  - `PlaylistSidebar`.
  - `RadioWidget`: durum metni, ekolayzer yok.

**Dosyalar:** `src/lib/youtube.ts`, `src/hooks/useYouTubePlayer.ts`, `src/hooks/useRadio.ts`, `src/components/player/{ContentViewer,PlaylistSidebar}.tsx`, `src/components/radio/*`.

**Bitti kriteri:**
- Test #3–9, #14, #29, #30 tarayıcıda geçiyor.
- Landing ↔ app 5 kez gidip gelince oynatıcı çalışıyor ve DOM'da tek `iframe_api` script'i var.
- YouTube kodunda `any` yok.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:** YouTube API zamanlaması; playlist indeks senkronu; gerçek playlist ile manuel test gerekiyor.

**Zorluk:** Zor.

---

## Adım 7 — Pomodoro ve zamanlayıcı (+ yeni tasarım)

**Amaç:** Doğru ve hafif bir zamanlayıcı; pomodoro arayüzünün yeni tasarımı.

**Yapılacaklar:**
- `endsAt` zaman damgası tabanlı sayaç (B4).
- Zamanlayıcı state'i store'a ya da izole bir bileşene taşınır; `App`'in saniyelik render'ı biter (P1). Üst çubuktaki sayaç yalnızca kendini render eder.
- Yerel tarih anahtarı; **eski UTC kayıtlar olduğu gibi kalır** (migrasyon yok).
- Odak ve mola süreleri kalıcı hale gelir (`belearn_pomodoro_settings`; bugün her yenilemede 25/5'e dönüyor). Üst çubuk paneli ve widget aynı ayarı kullanır (karar #6).
- Interval temizliği; bildirim izni ilk "Odaklan"da istenir; tek global başlık yanıp sönme kontrolcüsü (B5).
- `taskComplete` animasyonu kaldırılırken görev tamamlama ve silme akışı açık mantığa taşınır (işlev korunur).
- **Bileşenler yeniden yazılır:** `PomodoroWidget`, `PomodoroHeatmap` (`ribbon` basamakları), `PomodoroToast` (DESIGN §8.5; Odak/Mola metinle ayrılır, mavi yok).

**Dosyalar:** `src/hooks/usePomodoroTimer.ts`, `src/store/pomodoro*`, `src/components/pomodoro/*`, `src/components/layout/AppHeader.tsx` (sayaç), `src/lib/notifications.ts`, `src/lib/date.ts`.

**Bitti kriteri:**
- 10 dk arka plandan sonra sapma < 1 sn.
- Profiler'da zamanlayıcı çalışırken yalnızca sayaç bileşenleri render oluyor.
- 00:30'da (TR) biten pomodoro o güne yazılıyor (sahte saatle birim test).
- Eski kayıtlar ısı haritasında hâlâ görünüyor.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:** Görev tamamlama akışının animasyondan ayrılması; arka plan sekmesinde bildirim izinleri.

**Zorluk:** Orta.

---

## Adım 8 — PDF ve belgeler (+ yeni tasarım)

**Amaç:** Mobilde çalışan, kalıcı bir belge deneyimi; web adresi dalının kaldırılması.

**Yapılacaklar:**
- `pdfjs-dist` görüntüleyici: lazy, worker, sayfa sanallaştırma, yakınlaştırma, metin seçimi → not (A3, S3).
- **IndexedDB kalıcılığı:**
  - "Bu cihazda sakla" **varsayılan açık**, dosya başına **~50 MB** sınır.
  - `navigator.storage.estimate()` ile kota kontrolü; Safari kota hatası anlaşılır biçimde gösterilir ("Bu PDF cihazda saklanamadı; yine de açabilirsin, ama yenileyince yeniden seçmen gerekir").
  - Saklananlar Ayarlar'dan silinebilir (A4).
- `URL.revokeObjectURL` (B10).
- Tek `openDocument()` akışı; çalışma ekranından yüklenen PDF de geçmişe eklenir (B14).
- **Web adresi dalı kaldırılır** (B8): Landing ve `ContentToolbar`'daki "Web Kaynağı" mantığı gider; YouTube olmayan bir bağlantı için "Yalnızca YouTube bağlantısı ya da PDF açılabilir" mesajı.
- PDF olmayan dosya için yalnızca "Desteklenmeyen dosya: yalnızca PDF açılabilir" uyarısı; dönüştürme bağlantısı yok (karar #4).
- **Bileşenler yeniden yazılır:** PDF görünümü ve `DocReloadModal` (saklanan PDF varsa hiç gösterilmez).

**Dosyalar:** `src/components/player/{PdfViewer,DocReloadModal,ContentToolbar}.tsx`, `src/lib/idb.ts`, `src/lib/openDocument.ts`, `src/components/landing/*`.

**Bitti kriteri:**
- iOS Safari ve Android Chrome'da çok sayfalı PDF kaydırılıyor.
- Yenilemede ve geçmişten açınca PDF dosya seçmeden geliyor.
- 50 MB üstü dosyada anlaşılır mesaj çıkıyor.
- 10 yükleme sonrası blob sızıntısı yok.
- "Web Kaynağı" kodu yok.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:**
- pdf.js bundle boyutu (lazy yükleme şart).
- Worker ve CSP uyumu.
- Safari'nin IndexedDB kotası ve özel modu.

**Zorluk:** Zor.

---

## Adım 9 — Çalışma ekranı tasarımı, erişilebilirlik, performans, mobil

**Amaç:** Çalışma ekranının kalan görsel yenilemesi ve erişilebilir, akıcı, dokunmatik dostu arayüz.

**Yapılacaklar:**
- **Tasarım (DESIGN §8.4):**
  - `StudyPanel` "açık kitap sayfası", altı çizgili sekmeler ve sayaçlar.
  - Notlar: zaman damgası sütunu, satır çizgileri.
  - Özet: drop cap, 16.5px / 1.75.
  - Kartlar: defter kâğıdı, state tabanlı 3B çevirme, `aria-pressed`, klavyeyle çevirme (B13).
  - Sorular: dikdörtgen şıklar, "Doğru cevap / Senin cevabın", tek soru görünümü + "Sonraki soru"; mevcut cevaplar ve sayaçlar korunur.
  - "Quiz" etiketi "Sorular" olur.
  - `HistoryModal` ve `AIModal` yeni sistemle.
- **Ortak bileşenler:** `<Modal>` (role="dialog", aria-modal, Escape, odak tuzağı, odak iadesi) ve `<ConfirmDialog>` (A2).
- **Onaylı akışlar:** geçmişi temizle, kayıt sil, AI içeriğini değiştir (B6, B7).
- **Erişilebilirlik ve mobil:**
  - `aria-label`'lar.
  - Dokunmatikte görünür silme düğmeleri (A1).
  - 375 px yerleşim, ≥ 44 px dokunma hedefleri.
- **Küçük düzeltmeler:**
  - Not dışa aktarma `contentConfig.title` ile; pano ayrı düğme + fallback (B9, B17).
  - Kısayol değişikliği: `Ctrl+Space` → input dışında `K` ya da `Space`. `Alt+N` korunur (B21).
- **Performans:**
  - Selector'ler + `useShallow` (P1); `memo`.
  - `next/dynamic` ile modallar ve widget'lar (P3).
  - `set-state-in-effect` → error.
- **İsteğe bağlı (yalnızca onayla):** Odak modu (DESIGN §8.7).
- Lighthouse önce/sonra.

**Dosyalar:** `src/components/{layout,notes,summary,flashcards,quiz,history,ai}/*`, `src/components/ui/{Modal,ConfirmDialog}.tsx`, `src/hooks/useKeyboardShortcuts.ts`.

**Bitti kriteri:**
- Lighthouse (mobil): Erişilebilirlik ≥ 95, Best Practices ≥ 95, Performans önceki ölçümden düşük değil.
- axe'te kritik ihlal yok.
- Tüm akışlar yalnızca klavyeyle tamamlanabiliyor.
- 375 px'te yatay kaydırma yok.
- DESIGN §11 temiz.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:**
- Modal odak yönetiminin YouTube iframe'iyle çakışması.
- Tek soru görünümüne geçişin mevcut kullanıcı alışkanlığını değiştirmesi.

**Zorluk:** Zor.

---

## Adım 10 — PWA, testler, teslim

**Amaç:** Kurulabilir, test edilmiş, belgelenmiş BeLearn sürümü.

**Yapılacaklar:**
- `src/app/manifest.ts`: `name`/`short_name` "BeLearn", `theme_color`/`background_color` token'lardan.
- **Yer tutucu ikonlar:** Adım 3d'de üretildi (`public/icons/`, `src/app/favicon.ico`, `src/app/apple-icon.png`). Bu adımda yalnızca `manifest.ts`'e bağlanır; gerçek ikon gelirse dosyalar değiştirilir.
- Service worker: uygulama kabuğu önbelleği, YouTube önbelleklenmez, sürümleme + güncelleme bildirimi. `PWAInjector` kaldırılır (W1).
- Bildirim ikonu yer tutucu ikonla geri gelir.
- **Testler:**
  - Vitest: lib, schemas, store migrasyonu (`bmo_*` → `belearn_*` fixture'ı), yedek içe/dışa aktarma, tarih, markdown güvenliği.
  - Playwright: duman testleri (Adım 2'deki Edge betiğinden türetilir; landing → video, PDF, not, AI içe aktarma, tema, geçmiş silme, yedek).
- README, CHANGELOG, `SECURITY.md` son hali, `docs/DESIGN.md` son hali.
- `npm audit`.
- `eslint.config.mjs`'teki tüm geçici gevşetmelerin kaldırılması.

**Dosyalar:** `src/app/manifest.ts`, `public/icons/*`, `src/app/icon.*`, SW dosyası, `vitest.config.ts`, `playwright.config.ts`, `tests/**`, `README.md`, `CHANGELOG.md`, `SECURITY.md`, `docs/DESIGN.md`, `eslint.config.mjs`.

**Bitti kriteri:**
- Chrome'da "Yükle" çalışıyor, adı BeLearn.
- Uygulama kabuğu çevrimdışı açılıyor.
- `npm test` ve `npx playwright test` yeşil.
- `npm audit --omit=dev`'de yüksek/kritik yok.
- ESLint'te geçici override yok.
- Test listesi tekrarlandı ve veri kaybı yok.

**Riskler:** SW önbelleğinin eski sürümü tutması; yer tutucu ikonun mağaza/OS maskelemesinde kötü görünmesi.

**Zorluk:** Orta.

---

## Kararlar (2026-10-24, yanıtlandı)

| # | Konu | Karar | Adım |
|---|---|---|---|
| 1 | Eski adresten veri taşıma | Eski adres tamamen bırakılıyor; BeLearn yeni adreste sıfırdan yayınlanacak. Adresler arası taşıma yapılmayacak. Yedek özelliği genel amaçlı kalıyor; `bmo_*` kopyası yalnızca aynı adreste çalışan basit bir güvenlik ağı | 4 |
| 2 | Üst çubukta yeri belirtilmeyen işlevler | Öneri kabul: playlist düğmesi yalnızca playlist varken görünür; mavi ışık, PWA yükleme ve yedek tek bir "Ayarlar" menüsünde; ilerleme ve sayaçlar sekme sayaçlarına taşınır | 3f, 4a, 9 |
| 3 | Landing'de geçmiş | Öneri kabul: en fazla 12 sırt + "Tüm geçmiş" bağlantısı; "Tümünü temizle" yalnızca Geçmiş modalında ve onaylı | 3e, 9 |
| 4 | ilovepdf bağlantısı | Kaldırılır; PDF olmayan dosyada yalnızca "Desteklenmeyen dosya" uyarısı | 3e, 8 |
| 5 | Modal ve toast açılışı | 150 ms opaklık geçişi (solma); `prefers-reduced-motion`'da kapalı | 3c (token), 6–9 |
| 6 | Üst çubuktaki "Odaklan" | Pomodoroyu doğrudan başlatır; yanında odak ve mola süresi ayar paneli (DESIGN §8.2.1). Süreler Adım 7'de kalıcı hale gelir | 3f, 7 |
| 7 | `package.json` adı | `bmo-learn` → `belearn` | 3b |
