# BMO Learn — Kod Analizi

> Tarih: 2026-10-24 · Dal: `refactor/bmo-optimizasyon` · Kapsam: refactor öncesi `app/page.tsx` (1982 satır)
> Konumlar fonksiyon/bileşen adıyla verilir (parçalamadan sonra da geçerli kalsın diye); `L` numaraları orijinal `app/page.tsx` satırlarıdır. Yeni dosya yerleri için bkz. [§6 Konum eşlemesi](#6-konum-eşlemesi-adım-2-sonrası).

## 1. Mimari özet

- **Tür:** Tamamen istemci tarafında çalışan, tek sayfalı bir Next.js App Router uygulaması. Sunucu, API route ya da veritabanı yok; tüm veri `localStorage`'da (`bmo_*` anahtarları) tutuluyor.
- **Akış:** Landing'de YouTube linki (playlist dahil) veya PDF → çalışma ekranı (oynatıcı/PDF + Notlar/Özet/Kartlar/Quiz sekmeleri) → "AI Sihirbazı" bir prompt üretir; kullanıcı bu prompt'u harici bir yapay zekâya yapıştırır, dönen JSON'u geri yapıştırır → özet, flashcard ve quiz içe aktarılır.
- **Yan özellikler:** Pomodoro + görev listesi + 30 günlük ısı haritası, YouTube tabanlı "Odak Radyosu", mavi ışık filtresi, tam ekran, geçmiş kitaplığı (playlist'ler "Koleksiyon" olarak gruplanır), PWA kurulum yönergeleri, çevrimdışı bandı.
- **Yapı (refactor öncesi):** Her şey `app/page.tsx` içinde: tema CSS'i (`ThemeStyles`), tipler, sabitler, zustand store, yardımcılar, 17 bileşen ve tüm orkestrasyonu yapan ~650 satırlık `App` bileşeni (YouTube oynatıcıları, pomodoro zamanlayıcısı, kısayollar, tam ekran).
- **Render:** `page.tsx` `"use client"`. Statik olarak prerender ediliyor; ilk HTML yalnızca skeleton içeriyor.

### localStorage anahtarları (değiştirilmeyecek)

| Anahtar | İçerik |
|---|---|
| `bmo_theme` | `'dark' \| 'light'` |
| `bmo_notes` | `Note[]` |
| `bmo_flashcards` | `Flashcard[]` |
| `bmo_quiz` | `QuizQuestion[]` |
| `bmo_summaries` | `Record<contentId, markdown>` |
| `bmo_todos` | `Todo[]` |
| `bmo_history` | `HistoryItem[]` (en fazla 30) |
| `bmo_pomodoro` | `Record<YYYY-MM-DD, adet>` |
| `bmo_progress` | `Record<videoId, saniye>` |

## 2. Bağımlılıklar

| Paket | Sürüm | Not |
|---|---|---|
| next | 16.2.1 (sabit) | Turbopack. **`npm audit`: kritik açık, düzeltmesi 16.4.3'te** (bkz. K3) |
| react / react-dom | 19.2.4 | |
| zustand | ^5.0.12 | Middleware kullanılmıyor (persist yok) |
| lucide-react | ^0.577.0 | İkonlar |
| tailwindcss / @tailwindcss/postcss | ^4 (4.2.2) | **Tailwind v4**, CSS-first; `tailwind.config` yok, `@import "tailwindcss"` |
| typescript | ^5 (5.9.3) | `strict: true` zaten açık |
| eslint / eslint-config-next | 9 / 16.2.1 | Flat config |
| prettier / eslint-config-prettier | 3 / 10 | **Adım 1'de eklendi** |

Node 24.14, npm 11.9 ile doğrulandı.

## 3. Baseline (Adım 1 başlangıcı)

Ham çıktılar: [docs/baseline/](docs/baseline/)

| Kontrol | Sonuç |
|---|---|
| `tsc --noEmit` | ✅ 0 hata |
| `eslint .` | ❌ 41 hata, 29 uyarı (31× `no-explicit-any`, 5× `no-unescaped-entities`, 2× `set-state-in-effect`, 2× `immutability`, 1× `prefer-const`) |
| `next build` | ✅ |
| Daha sıkı TS bayrakları | `noUncheckedIndexedAccess` → 25 hata; `noImplicitReturns` + `noImplicitOverride` + `noFallthroughCasesInSwitch` → 1 hata |

**Adım 1'de lint'i sıfır hataya indirmek için:**
- Davranışı değiştirmeyen 6 hata düzeltildi: `prefer-const` ve 5 tane `'`/`"` → `&apos;`/`&quot;` (aynı karakter render ediliyor).
- Davranış değiştirmeden düzeltilemeyen 3 kural **geçici olarak uyarıya** düşürüldü (`eslint.config.mjs` içinde, plan adımıyla birlikte işaretli):
  - `no-explicit-any` → Adım 4/6
  - `react-hooks/set-state-in-effect` → Adım 9
  - `react-hooks/immutability` → Adım 6

## 4. Bulgular

**Önem:** Kritik / Yüksek / Orta / Düşük · **Doğrulama:** ✅ doğru · 🟡 kısmen · ❌ yanlış alarm · ➕ ek bulgu (ön listede yoktu)
"Kodla doğrulandı" = kod okunarak ve/veya derlenmiş çıktı incelenerek doğrulandı. Tarayıcı gerektiren gözlemler §5'teki manuel test listesine bırakıldı.

### 4.1 Güvenlik

| ID | Önem | Doğr. | Konum | Açıklama | Önerilen çözüm | Adım |
|---|---|---|---|---|---|---|
| S1 | Orta | 🟡 | `renderMarkdown` (L504), `SummaryTab`, not listesi (`dangerouslySetInnerHTML`) | Yalnızca `<` `>` kaçırılıyor (`&` ve tırnaklar kaçırılmıyor). Bununla birlikte yakalanan tüm gruplar attribute'a değil element içeriğine yazılıyor ve `<` kaçırıldığı için **bugünkü haliyle istismar edilebilir bir XSS bulamadım**. Yine de çok kırılgan: bir link kuralı (`[x](url)` → `href`) eklendiği anda `javascript:` XSS'e dönüşür. Girdi (AI çıktısı) güvenilmez. | `react-markdown` (HTML kapalı, `rehype-raw` yok) + izinli eleman listesi; `dangerouslySetInnerHTML` tamamen kalksın | 5 |
| S2 | Düşük | ❌ (şimdilik) | `LandingPage.handleStart`, `handleDashboardUrlChange` | URL doğrulanmadan `contentConfig.url`'e yazılıyor, **ama** web dalında `fileType` tanımsız olduğu için URL hiçbir `src`/`href`'e ulaşmıyor; ekran "Desteklenmeyen Format"a düşüyor (B8). Bu nedenle `javascript:`/`data:` riski şu an tetiklenmiyor. Web dalı açılırsa (Adım 8) doğrudan kritik hale gelir. | `new URL()` + yalnızca `https:` (ve YouTube host listesi) izni | 5 |
| S3 | Düşük | ✅ | Belge görüntüleyicideki `<iframe src={contentConfig.url}>` (L1861) | `sandbox` yok. `src` her zaman kullanıcının kendi seçtiği dosyanın `blob:` URL'si (aynı origin); `accept=".pdf"` yalnızca bir ipucu, uzantı/MIME kontrolü "pdf içeriyor mu" diye bakıyor. Pratikte risk self-XSS düzeyinde. **Dikkat:** Chrome, sandbox'lı iframe içinde PDF render etmeyi engeller; bu yüzden asıl çözüm sandbox eklemek değil, iframe'i kaldırmak. | pdf.js görüntüleyici (iframe yok) + MIME + magic byte (`%PDF-`) kontrolü | 8 (5'te MIME kontrolü) |
| S4 | **Yüksek** | ✅ | `AIModal.handleParseJSON` (L1098) | Şema doğrulaması yok. Gerçek etkisi güvenlikten çok **kalıcı çökme**: `options`/`question` nesne gelirse React "Objects are not valid as a React child" fırlatır ve Quiz sekmesi açıldığında uygulama çöker; veri localStorage'a yazıldığı için her açılışta tekrarlar (Error Boundary yok). `summary` string değilse `text.replace` TypeError verir. `correct` küçük harf ("a") ya da "Cevap: A" gelirse bütün cevaplar yanlış sayılır. Adet ve uzunluk sınırı yok, bu da localStorage kotasını riske atıyor. | zod şeması (string'ler, `correct ∈ {A,B,C,D}` + normalize, adet ≤ 50, uzunluk ≤ N), hatalı öğeleri raporla; Error Boundary | 5 |
| S5 | Orta | ✅ | `next.config.ts` (boş) | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` yok. Gerekli kaynaklar: `www.youtube.com` (script + frame), `i.ytimg.com`/`img.youtube.com` (img). | `headers()` ile başlıklar; CSP önce `Report-Only` | 5 |
| S6 | Düşük | ✅ | `NotificationManager.send` (L211) | Bildirim sesi `actions.google.com`'dan çekiliyor: her bildirimde 3. tarafa istek gidiyor, çevrimdışıyken çalmıyor, CSP'ye ek kaynak gerekiyor. | `public/sounds/` altına yerel dosya | 5 |
| S7 | **Yüksek** | ✅ | `App` başlangıç effect'i (L1390) | 8 tane `JSON.parse` try/catch ve doğrulama olmadan çağrılıyor. Tek bir bozuk anahtar effect'i fırlatır, `setIsInitializing(false)` hiç çağrılmaz ve uygulama **sonsuza dek skeleton'da kalır** (kullanıcının kendi başına kurtulma yolu yok). | Anahtar başına güvenli okuma + zod + bozuk anahtarı yedekleyip sıfırlama | 4 |

### 4.2 Hatalar (Bug)

| ID | Önem | Doğr. | Konum | Açıklama | Önerilen çözüm | Adım |
|---|---|---|---|---|---|---|
| B1 | **Yüksek** | ✅ (kodla) | `initMainPlayer`, contentConfig effect'i (L1566), header logo butonu | App → Landing geçişinde `#youtube-main-player` unmount oluyor ama `playerRef` eski player'ı tutmaya devam ediyor ve `destroy` çağrılmıyor. Yeni video seçildiğinde `loadVideoById` ölü player'a gidiyor ve oynatıcı boş kalıyor. Aynı videoya geri dönülürse effect hiç tetiklenmiyor. | `useYouTubePlayer` hook'u: mount'ta create, unmount'ta destroy, ref sıfırlama | 6 |
| B2 | Düşük | 🟡 | YT yükleme effect'i (L1491) | Production'da effect bir kez çalıştığı için script tek. Dev'de StrictMode effect'i iki kez çalıştırıyor ve YT henüz yüklenmediği için **ikinci bir script** ekleniyor. `onYouTubeIframeAPIReady` aynı fonksiyonla eziliyor (bugün zararsız). `setTimeout` polling'i temizlenmiyor; `#youtube-music-player` hep render edildiği için pratikte döngüye girmiyor. | Promise tabanlı tekil `loadYouTubeApi()` | 6 |
| B3 | **Yüksek** | 🟡 | `initMainPlayer.onStateChange` (L1535) | Ön bulguda tarif edilen stale closure büyük ölçüde zararsız (pId değişince player yeniden kuruluyor). **Asıl hata:** PDF'e geçildiğinde gizli YouTube player durdurulmuyor, ses arkada çalmaya devam ediyor. Playlist sonraki videoya geçerse closure'daki `type === 'video'` yüzünden `setActiveContentId(video_id)` çağrılıyor; PDF açıkken aktif içerik videoya dönüyor ve **notlar/AI içeriği yanlış içeriğe kaydediliyor**. `initMusicPlayer.onReady` de ilk render'daki `musicVolume`/`globalMuted`'ı kullanıyor. | Belge moduna geçerken `pauseVideo`/`destroy`; callback'lerde `useStore.getState()` ya da ref | 6 |
| B4 | Orta | ✅ | Pomodoro effect'i (L1425), `addPomodoroRecord`, `PomodoroHeatmap` | Effect `timeLeft`'e bağlı olduğu için interval her saniye kurulup sökülüyor. Arka plan sekmesinde `setInterval` kısılıyor (Chrome 5 dk sonra dakikada 1), sayaç ciddi şekilde geri kalıyor. `toISOString()` UTC: Türkiye'de (UTC+3) 00:00–02:59 arası pomodorolar önceki güne yazılıyor; ısı haritası da aynı kayma ile çiziliyor. | Bitiş zaman damgası (`endsAt`) + `Date.now()` farkı; yerel tarih anahtarı | 7 |
| B5 | Düşük | 🟡 | `NotificationManager` | İzin, sayfa açılışında kullanıcı jesti olmadan isteniyor ✅ (Firefox/Safari reddeder, Chrome sessiz UI gösterir). Başlık yanıp sönme interval'i aslında 10 sn sonra **temizleniyor** ❌. Ama 10 sn içinde iki bildirim gelirse ikinci çağrı `originalTitle` olarak "🔔 …" değerini yakalıyor ve başlık zil emojisiyle kalabiliyor. | İzni "Odaklan"a ilk basışta iste; tek global blink controller | 7 |
| B6 | **Yüksek** | ✅ | `clearHistory`; Landing "Geçmişi Temizle", HistoryModal "Tümünü Temizle" | Onay sorulmadan tüm notlar, kartlar, quiz ve özetler siliniyor (geri alınamaz veri kaybı). `videoProgress` ne burada ne de `deleteHistoryItem`'da siliniyor. | Onay diyaloğu (+ geri al/yedek); progress temizliği | 9 (onay), 4 (progress) |
| B7 | Orta | ✅ | `replaceContentAI` | Yeni AI içeriği, mevcut kartları/quiz'i (öğrenildi işaretleri ve cevaplar dahil) ve özeti uyarısız ezip geçiyor. | Mevcut içerik varsa "Değiştir / Ekle / İptal" sorusu | 9 |
| B8 | Orta | ✅ | `handleStart`, `handleDashboardUrlChange` | YouTube dışındaki her girdi "Web Kaynağı" sayılıyor ve doğrudan "Desteklenmeyen Format" ekranı açılıyor. Placeholder "veya Web adresi" diyor ama özellik çalışmıyor; ayrıca kayıt geçmişe eklenmiyor. | **Karar gerekli** (bkz. PLAN Adım 8): kaldır ya da gerçek destek ekle | 8 |
| B9 | Düşük | ✅ | `handleExportNotes` (L1660) | Başlık `history` içinde `contentId` ile aranıyor. Playlist kaydında `contentId` son izlenen video olduğu için diğer bölümlerde "BMO_Learn", son bölümde "Koleksiyon: …" çıkıyor; dashboard'dan yüklenen PDF geçmişte olmadığı için yine "BMO_Learn". `contentConfig.title` zaten mevcut. Panoya izinsiz yazıyor; catch mesajı "panoya kopyalandı" diyor ama kopyalamanın başarılı olup olmadığına bakılmıyor. | `contentConfig.title` kullan; panoyu ayrı ve isteğe bağlı bir buton yap | 9 |
| B10 | Düşük | ✅ | 3 PDF yükleme noktası; AI/not/todo id üretimi | `URL.createObjectURL` hiç revoke edilmiyor (her yükleme dosyayı bellekte tutuyor). Id'ler: AI için `Date.now()+Math.random()` (ondalıklı), not/todo için `Date.now()` (aynı ms'de çakışma ihtimali). | Önceki URL'yi revoke et; `crypto.randomUUID()` (mevcut sayı id'ler için migrasyon) | 8 (blob), 4 (id) |
| B11 | Orta | ✅ | Store'daki tüm aksiyonlar | `set()` içinde `localStorage.setItem` çağrılıyor (yan etki). `setTheme` `set()` içinde DOM'u da değiştiriyor. `QuotaExceededError` yakalanmıyor: aksiyon fırlatıyor, state güncellenmiyor, kullanıcıya hiçbir şey söylenmiyor. | zustand `persist` + özel storage (try/catch + kullanıcı uyarısı) | 4 |
| B12 | Düşük | ✅ | `renderMarkdown` | `#\s` satır başına bağlı değil ("Soru # 3" başlık oluyor). Tek yıldız çarpma ifadesini italik yapıyor ("2 * 3 * 4"). `<li>` `<ul>` olmadan basılıyor. Başlıkların ardından fazladan `<br />` geliyor. Numaralı liste, kod, link desteği yok. | `react-markdown` ile kendiliğinden çözülür | 5 |
| B13 | Düşük | ✅ | `FlashcardsTab` (`classList.toggle('flip-card')`) | React dışı DOM müdahalesi. `className` değiştiğinde (ör. "öğrendim") React sınıfı eziyor ve kart kendiliğinden geri dönüyor. Klavye ile çevrilemiyor. | `flipped` state + `<button aria-pressed>` | 9 |
| B14 | Orta | ➕ | `handleDashboardFileUpload` | Çalışma ekranından yüklenen PDF geçmişe **eklenmiyor** (Landing'deki yükleme ekliyor). Bu yüzden notlar ve AI içeriği yetim kalıyor, bir daha açılamıyor. | Tek bir `openDocument()` yardımcısı | 8 |
| B15 | Düşük | ➕ | `addToHistory` | Mevcut state nesneleri yerinde değiştiriliyor (`existing.timestamp = …`, `newHistory[idx].title = …`); immutability ihlali. | Yeni nesne üret | 4 |
| B16 | Orta | ➕ | `addToHistory` (`slice(0, 30)`) | Geçmiş 30 kayıtla sınırlı, ama listeden düşen kayıtların notları, kartları, quiz'i, özeti ve progress'i silinmiyor. localStorage'da erişilemeyen yetim veri birikiyor. | Düşen kayıtların verisini de temizle ya da sınırı kaldır + "yetim veri" temizliği | 4 |
| B17 | Orta | ➕ | `handleCopyPrompt`, `handleExportNotes` | Güvenli olmayan bağlamda (ör. telefondan `http://192.168.x.x:3000`) `navigator.clipboard` `undefined`. `handleCopyPrompt` TypeError fırlatıyor; `handleExportNotes` indirmeye bile gelmeden düşüyor. Production (HTTPS) etkilenmez, ama mobil testi engelliyor. | `navigator.clipboard?.writeText` + fallback | 9 |
| B18 | Düşük | ➕ | Playlist kenar çubuğu (`lg:max-h-auto`) | `max-h-auto` Tailwind'de yok ve CSS üretilmiyor (derlenmiş CSS'te doğrulandı). Bu yüzden kenar çubuğu masaüstünde de 400 px ile sınırlı. | `lg:max-h-none` | 3 |
| B19 | Düşük | ➕ | Header ayracı ve istatistik noktaları | `w-px h-5 border-[var(--border)]` ile `w-1 h-1 … text-[…]` öğelerinin arka planı ya da border genişliği yok, bu yüzden hiç görünmüyorlar. | `bg-[var(--border)]` | 3 |
| B20 | Düşük | ➕ | `isInitializing` | 500 ms yapay bekleme var. Skeleton sırasında `ThemeStyles` render edilmediği için `--bg`/`--card` tanımsız kalıyor ve skeleton kartları görünmüyor. | Tema değişkenleri globals.css'e (Adım 3); bekleme kaldırılır | 3 |
| B21 | Düşük | ➕ | Klavye kısayolu `Ctrl+Space` | Windows/macOS giriş dili değiştirme kısayoluyla çakışabilir. | `Space`/`K` (input dışında) | 9 |

### 4.3 Performans

| ID | Önem | Doğr. | Konum | Açıklama | Önerilen çözüm | Adım |
|---|---|---|---|---|---|---|
| P1 | Orta | ✅ | `App`, tüm bileşenler (`useStore()` selector'süz) | `App` ve alt bileşenler store'un tamamına abone. Pomodoro `timeLeft` `App` state'inde tutulduğu için zamanlayıcı çalışırken **saniyede bir tüm ağaç** (sekmeler, modallar, header) yeniden render ediliyor; hiçbir bileşen memo'lu değil. 5 sn'lik progress yazımı da her şeyi render ettiriyor. | Selector'ler + `useShallow`; zamanlayıcıyı izole bileşene taşı | 7, 9 |
| P2 | Düşük | 🟡 | `ThemeStyles` | React aynı `__html` için DOM'u yeniden yazmıyor; maliyet her render'da ~4 KB'lık string karşılaştırması. Asıl sorun init bitene kadar render edilmemesi (B20/T1). | globals.css'e taşı | 3 |
| P3 | Düşük | ✅ | Modallar, widget'lar | Lazy loading yok (AIModal, HistoryModal, Pomodoro, Radio ilk bundle'da). Bundle küçük olduğu için etkisi sınırlı. | `next/dynamic` | 9 |
| P4 | Düşük | 🟡 | progress interval (L1443) | Yazımlar zaten 5 sn aralıkla (kısmen throttle'lı). Ancak her seferinde tüm `videoProgress` serileştiriliyor, sözlük sınırsız büyüyor (hiç silinmiyor) ve selector'süz tüm abonelerde render tetikleniyor. | Yalnızca değişince yaz, sınır/temizlik; `visibilitychange`'de flush | 4 |

### 4.4 Tema / Stil

| ID | Önem | Doğr. | Konum | Açıklama | Önerilen çözüm | Adım |
|---|---|---|---|---|---|---|
| T1 | Orta | ✅ | Başlangıç effect'i, `setTheme` | Tema effect içinde okunuyor; ilk HTML'de tema bilgisi yok, açık temalı kullanıcı önce koyu ekranı görüyor (FOUC). | `<head>`'de küçük inline script + `suppressHydrationWarning` | 3 |
| T2 | Orta | ✅ | `dark:` varyantları (`dark:mix-blend-screen`, `dark:bg-black/30`), globals.css | Tailwind v4'te `dark:` varsayılan olarak `prefers-color-scheme` ile çalışıyor, uygulama ise `.light-theme` sınıfı kullanıyor. OS koyu + uygulama açık temadayken `dark:` stilleri yanlışlıkla uygulanıyor. globals.css'teki `--background` da ayrı bir medya sorgusuyla değişiyor. | `@custom-variant dark` + tek bir `data-theme` özniteliği | 3 |
| T3 | Düşük | ❌ / 🟡 | Tailwind sınıfları | **Yanlış alarm:** `h-125`, `md:h-150`, `min-h-35`, `sm:w-4.5`, `duration-400` Tailwind v4'te dinamik değer olarak geçerli ve derlenmiş CSS'te mevcut (doğrulandı). Gerçekten geçersiz olan tek sınıf `lg:max-h-auto` (B18). `mt-[68px]` sihirli sayısı doğru: iki yerde URL çubuğu yüksekliğine elle hizalanmış. | Grid ile hizalama; isteğe bağlı olarak `var(--x)` → `(--x)` kanonik yazım | 3 |
| T4 | Düşük | ✅ | `.app-drag-region` | `-webkit-app-region` yalnızca Electron'da ya da `window-controls-overlay` kullanan PWA'larda anlamlı; manifestte `display_override` yok. Tek yan etkisi header'da `user-select: none`. | Kaldır | 3 |
| T5 | Düşük | ➕ | `layout.tsx` + globals.css | Layout Geist fontunu yüklüyor ama globals.css `body`'ye Arial veriyor; Geist hiç kullanılmıyor (boşuna indiriliyor). | Karar: Geist'i uygula ya da yüklemeyi kaldır | 3 |
| T6 | Düşük | ➕ | `layout.tsx` | İçerik Türkçe olduğu halde `<html lang="en">`. `notranslate` meta'sı ve `document.title` effect ile ekleniyor. | `lang="tr"`, `metadata` + `translate="no"` | 3 |
| T7 | Düşük | ➕ | Genel | `#FF8C00` yüzlerce yerde sabit yazılmış; `--primary` değişkeni tanımlı olduğu halde kullanılmıyor. | `@theme` token'ları (`bg-primary`) | 3 |

### 4.5 Erişilebilirlik / Mobil

| ID | Önem | Doğr. | Konum | Açıklama | Önerilen çözüm | Adım |
|---|---|---|---|---|---|---|
| A1 | **Yüksek** | ✅ | Geçmiş kartı, not, flashcard, quiz ve todo silme butonları | `opacity-0 group-hover:opacity-100`: dokunmatik ekranda görünmüyor ya da rastgele görünüyor. | Dokunmatikte her zaman görünür (`@media (hover: hover)`) + menü | 9 |
| A2 | Orta | ✅ | Tüm modallar, ikon butonları, flashcard | `role="dialog"`, `aria-modal`, Escape, odak tuzağı ve odak iadesi yok. İkon butonlarında `title` var, `aria-label` yok. Flashcard tıklanabilir bir `div` (tabIndex yok). Input'ların label'ı yok. | Ortak `<Modal>` bileşeni, aria-label'lar | 9 |
| A3 | **Yüksek** | ✅ (bilinen davranış) | PDF `<iframe>` | iOS Safari iframe içindeki PDF'te genelde yalnızca ilk sayfayı gösteriyor ve kaydırmıyor; Android Chrome iframe'de PDF render etmiyor (indirmeyi öneriyor). **Tarayıcıda doğrulanmadı.** | pdf.js | 8 |
| A4 | Orta | ✅ | `pendingDocReload` | Sayfa yenilenince tüm oturum (`view`, `contentConfig`) kayboluyor. PDF'ler tasarım gereği saklanmıyor ve geçmişten açarken dosyanın yeniden seçilmesi gerekiyor. | IndexedDB'de dosya saklama (isteğe bağlı, kotalı) | 8 |

### 4.6 PWA

| ID | Önem | Doğr. | Konum | Açıklama | Önerilen çözüm | Adım |
|---|---|---|---|---|---|---|
| W1 | Orta | ✅ | `PWAInjector` | Manifest `blob:` URL ile ekleniyor. `start_url: "/"` blob URL'e göre çözülemediği için Chrome kurulabilirlik kriterleri sağlanmıyor. 192 ve 512 ikonları aynı 512×512 dosya. Service worker yok, dolayısıyla sayfa çevrimdışı açılmıyor (`OfflineBanner` yalnızca açık sayfada işe yarıyor). | `app/manifest.ts`, gerçek ikon boyutları, SW (Serwist veya elle) | 10 |

### 4.7 Kod kalitesi / Bakım

| ID | Önem | Doğr. | Konum | Açıklama | Önerilen çözüm | Adım |
|---|---|---|---|---|---|---|
| K1 | Düşük | ✅ | Genel | 31 `any`, 2 eksik `useEffect` bağımlılığı, statement olarak kullanılan 3 ternary (`globalMuted ? mute() : unMute()`), 14 kullanılmayan değişken. | Prop arayüzleri (Adım 2), YT tipleri (6), store tipleri (4) | 2, 4, 6 |
| K2 | Düşük | ➕ | `errors.txt` | Repoda eski, UTF-16 kodlu bir build hata çıktısı duruyor (içindeki hata son commit'te düzeltilmiş). | Silinmesi önerilir (**karar**) | — |
| K3 | **Kritik** | ➕ | `package.json` | `npm audit`: 13 açık, aralarında **doğrudan bağımlılık `next@16.2.1` için kritik** bir açık var. Düzeltmesi 16.4.3'te (aynı major). Geri kalanlar `sharp`/`postcss` (next üzerinden) ve geliştirme bağımlılıkları. | Next'i 16.4.x'e yükselt + `npm audit fix` (**karar**, ayrı commit) | 1→10 (karara göre öne alınabilir) |
| K4 | Düşük | ➕ | `README.md` | Varsayılan create-next-app metni duruyor. | Gerçek README | 10 |
| K5 | Orta | ➕ | — | Hiç test yok. | Vitest (lib/store) + Playwright (duman testi) | 10 |
| K6 | Düşük | ➕ | `App` | 650 satırlık tanrı bileşen (`App`) ve prop drilling (Pomodoro widget'a 12 prop gidiyor). | Parçalama (2) + hook'lar (6, 7) | 2 |

### 4.8 Ön bulguların doğrulama özeti

| Ön bulgu | Sonuç |
|---|---|
| renderMarkdown + dangerouslySetInnerHTML | 🟡 Kırılgan; bugün istismar edilebilir bir yol bulunamadı (S1) |
| URL doğrulanmıyor (javascript:/data:) | ❌ Şimdilik yanlış alarm: URL hiçbir src/href'e ulaşmıyor (S2) |
| PDF iframe sandbox yok | ✅ Ama sandbox Chrome PDF görüntüleyicisini bozar; çözüm pdf.js (S3) |
| AI JSON şemasız | ✅ Önemi beklenenden yüksek: kalıcı çökme (S4) |
| CSP/başlıklar yok | ✅ (S5) |
| Harici bildirim sesi | ✅ (S6) |
| localStorage JSON.parse korumasız | ✅ Uygulama skeleton'da kilitlenir (S7) |
| playerRef ölü/eski, cleanup yok | ✅ (B1) |
| iframe_api çoklu, polling temizlenmiyor | 🟡 Yalnızca dev/StrictMode'da çift script (B2) |
| Stale closure (onStateChange) | 🟡 Asıl hata: gizli player PDF modunda aktif içeriği değiştiriyor (B3) |
| Pomodoro: her saniye effect, sapma, UTC tarih | ✅ (B4) |
| İzin açılışta; blink interval temizlenmiyor | 🟡 İzin ✅; interval aslında temizleniyor ama üst üste binince başlık bozuluyor (B5) |
| Geçmişi Temizle onaysız; videoProgress kalıyor | ✅ (B6) |
| replaceContentAI uyarısız | ✅ (B7) |
| Web adresi dalı → Desteklenmeyen Format | ✅ (B8) |
| handleExportNotes başlık/pano | ✅ (B9) |
| Blob revoke yok; Date.now()+random id | ✅ (B10) |
| set() içinde localStorage | ✅ (B11) |
| renderMarkdown regex hataları | ✅ (B12) |
| Kart çevirme classList | ✅ (B13) |
| App tüm store'u çekiyor, timer tüm ağacı render ediyor | ✅ (P1) |
| ThemeStyles her render'da `<style>` basıyor | 🟡 DOM yeniden yazılmıyor; asıl sorun FOUC (P2) |
| Lazy loading yok; progress throttle'sız | ✅ / 🟡 5 sn aralık zaten var (P3, P4) |
| Tema FOUC; dark: ile .light-theme çakışması | ✅ (T1, T2) |
| Geçersiz Tailwind sınıfları | ❌ v4'te geçerliler; gerçek hata `lg:max-h-auto` (T3, B18) |
| -webkit-app-region gereksiz | ✅ (T4) |
| Silme butonları hover'da | ✅ (A1) |
| aria/dialog/focus trap/Escape; flashcard klavye | ✅ (A2) |
| PDF iframe iOS; yenilemede kayboluyor | ✅ (A3, A4) |
| Blob manifest, SW yok | ✅ (W1) |
| any, eksik deps, ifade-statement'lar | ✅ (K1) |

## 5. Manuel test kontrol listesi

Her adımın sonunda tekrarlanacak. Adım bazında hangi maddelerin otomatik/kodla, hangilerinin tarayıcıda doğrulandığı adım raporunda belirtilir.

| # | Alan | Senaryo | Beklenen |
|---|---|---|---|
| 1 | Landing | Sayfayı aç | Skeleton → logo, "Sadece odaklan.", URL kutusu, PDF butonu; konsolda hata yok |
| 2 | Landing | Geçmiş varken aç | "Son Çalışmalar" altında en fazla 3 kart; tıklayınca ilgili içerik açılır |
| 3 | Video | `youtube.com/watch?v=…` gir | Çalışma ekranı açılır, video otomatik oynar, başlık güncellenir, geçmişe eklenir |
| 4 | Video | `youtu.be/…`, `/shorts/…`, `/live/…` | Hepsi tanınır |
| 5 | Video | Videoyu izle, sayfayı yenile, aynı videoyu aç | Kaldığı saniyeden devam eder (`bmo_progress`) |
| 6 | Video | Logo ile Landing'e dön, **farklı** bir video aç | Video oynar (B1 burada gözlenebilir) |
| 7 | Video | Silinmiş/kısıtlı video ID | "Bu video oynatılamıyor" ekranı |
| 8 | Playlist | `…&list=…` linki | Liste butonu görünür, kenar çubuğu bölümleri gösterir, tıklanan bölüm oynar, geçmişte "Koleksiyon" olarak gruplanır |
| 9 | Playlist | Geçmiş → Koleksiyon → "Kaldığın Yerden Devam" ve tek bölüm | Doğru bölüm oynar |
| 10 | PDF | Landing'den PDF yükle | Masaüstünde iframe'de görünür, geçmişe eklenir |
| 11 | PDF | Çalışma ekranındaki "PDF Yükle" | Görünür (B14: geçmişe eklenmez) |
| 12 | PDF | Geçmişten PDF aç | "Dokümanı Yeniden Yükle" modalı; dosyayı seçince notlar geri gelir |
| 13 | PDF | `.docx` gibi PDF olmayan dosya | "Desteklenmeyen Format" |
| 14 | PDF | Video oynarken PDF'e geç | (B3) videonun sesi kesilmeli; şu an kesilmiyor |
| 15 | Not | Video oynarken not ekle | Zaman damgalı not; damgaya tıklayınca video o saniyeye atlar |
| 16 | Not | `**kalın**`, `- liste`, `# başlık` | Biçimlendirilmiş görünür |
| 17 | Not | `Alt+N` | Notlar sekmesi açılır, input odaklanır |
| 18 | Not | İndir butonu | `.txt` iner, "Kopyalandı!" görünür |
| 19 | Not | Not sil | Silinir |
| 20 | AI | "İsteği Kopyala" | Prompt panoya kopyalanır, seçili seviye ve başlık prompt içindedir |
| 21 | AI | Geçerli JSON yapıştır | Özet sekmesine geçer; kartlar ve quiz oluşur; ilerleme çubuğu güncellenir |
| 22 | AI | JSON öncesi/sonrası serbest metin, ```json bloğu | Yine de ayrıştırılır |
| 23 | AI | Bozuk metin | "Geçersiz format" hatası, mevcut veri bozulmaz |
| 24 | Özet | Metin seç → "Seçili Metni Notlara Ekle" | `> alıntı` notu eklenir |
| 25 | Kartlar | Karta tıkla, "Çalış" modu, önceki/sonraki, öğrendim, sıfırla | Çevrilir, sayaç ve "Öğrenilen" güncellenir |
| 26 | Quiz | Şık seç, sıfırla, soru sil | Doğru/yanlış renkleri ve sayaçlar doğru |
| 27 | Pomodoro | Süreyi değiştir, başlat, duraklat, sıfırla, molayı atla | Sayaç doğru; süre bitince toast, ses, bildirim, başlık yanıp sönmesi; ısı haritasına +1 |
| 28 | Pomodoro | Görev ekle, işaretle | İşaretlenen görev animasyonla kaybolur |
| 29 | Radyo | Aç, istasyon değiştir, ses seviyesi, oynat/duraklat | EQ animasyonu, ses çalışır |
| 30 | Ses | Global sessiz | Video ve radyo susar |
| 31 | Tema | Tema butonu, yenile | Tema korunur (`bmo_theme`); açık temada kontrast doğru |
| 32 | Görünüm | Mavi ışık kaydırıcısı | Turuncu katman opaklığı değişir |
| 33 | Tam ekran | Tam ekran butonu, Esc | İkon durumu senkron |
| 34 | Geçmiş | Kitaplık modalı, tek kayıt sil | Kayıt ve ona ait not/kart/quiz/özet silinir |
| 35 | Geçmiş | "Tümünü Temizle" / "Geçmişi Temizle" | Hepsi silinir (B6: şu an onaysız) |
| 36 | Kısayol | `Ctrl+Space` (input dışında) | Video oynat/duraklat |
| 37 | Çevrimdışı | DevTools'ta offline | Kırmızı bant |
| 38 | PWA | İndir butonu | Kurulum istemi ya da yönerge modalı |
| 39 | Mobil | 375 px genişlik | Yatay kaydırma yok, tüm butonlar erişilebilir |
| 40 | Depolama | localStorage'daki tüm `bmo_*` anahtarları refactor öncesi ve sonrası | Aynı anahtarlar, aynı biçim |

## 6. Konum eşlemesi (Adım 2 sonrası)

_Adım 2 tamamlandığında doldurulacak._
