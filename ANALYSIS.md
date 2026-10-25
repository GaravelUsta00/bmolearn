# BeLearn (eski adıyla BMO Learn) — Kod Analizi

> **Revizyon 2 (2026-10-24):** Marka, tasarım ve depolama kararları [§8](#8-marka-ve-tasarım-kararları-revizyon-2)'de. Tablolardaki "Adım" sütunu yeni [PLAN.md](PLAN.md)'ye göre güncellendi.

> Tarih: 2026-10-24 · Dal: `refactor/bmo-optimizasyon` · Kapsam: refactor öncesi `app/page.tsx` (1982 satır)
> Konumlar fonksiyon/bileşen adıyla verilir (parçalamadan sonra da geçerli kalsın diye); `L` numaraları orijinal `app/page.tsx` satırlarıdır. Yeni dosya yerleri için bkz. [§6 Konum eşlemesi](#6-konum-eşlemesi-adım-2-sonrası).

## 1. Mimari özet

- **Tür:** Tamamen istemci tarafında çalışan, tek sayfalı bir Next.js App Router uygulaması. Sunucu, API route ya da veritabanı yok; tüm veri `localStorage`'da (`bmo_*` anahtarları) tutuluyor.
- **Akış:** Landing'de YouTube linki (playlist dahil) veya PDF → çalışma ekranı (oynatıcı/PDF + Notlar/Özet/Kartlar/Quiz sekmeleri) → "AI Sihirbazı" bir prompt üretir; kullanıcı bu prompt'u harici bir yapay zekâya yapıştırır, dönen JSON'u geri yapıştırır → özet, flashcard ve quiz içe aktarılır.
- **Yan özellikler:** Pomodoro + görev listesi + 30 günlük ısı haritası, YouTube tabanlı "Odak Radyosu", mavi ışık filtresi, tam ekran, geçmiş kitaplığı (playlist'ler "Koleksiyon" olarak gruplanır), PWA kurulum yönergeleri, çevrimdışı bandı.
- **Yapı (refactor öncesi):** Her şey `app/page.tsx` içinde: tema CSS'i (`ThemeStyles`), tipler, sabitler, zustand store, yardımcılar, 17 bileşen ve tüm orkestrasyonu yapan ~650 satırlık `App` bileşeni (YouTube oynatıcıları, pomodoro zamanlayıcısı, kısayollar, tam ekran).
- **Render:** `page.tsx` `"use client"`. Statik olarak prerender ediliyor; ilk HTML yalnızca skeleton içeriyor.

### localStorage anahtarları

> **Adım 4c'den itibaren** uygulama `belearn_*` anahtarlarını okuyup yazar. `bmo_*` anahtarları yalnızca ilk açılışta bir kez okunup kopyalanır; **asla yazılmaz ve asla silinmez**. Tek kaynak: `src/lib/storageKeys.ts`.

| Anahtar (`belearn_` / eski `bmo_`) | İçerik                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| `theme`                            | `'dark' \| 'light'` (yalnızca kullanıcı seçince yazılır)              |
| `notes`                            | `Note[]`                                                              |
| `flashcards`                       | `Flashcard[]`                                                         |
| `quiz`                             | `QuizQuestion[]`                                                      |
| `summaries`                        | `Record<contentId, markdown>`                                         |
| `todos`                            | `Todo[]`                                                              |
| `history`                          | `HistoryItem[]` (eskiden en fazla 30, şimdi 200)                      |
| `pomodoro`                         | `Record<YYYY-MM-DD, adet>` (eski kayıtlar UTC günü)                   |
| `progress`                         | `Record<videoId, saniye>`                                             |
| `belearn_meta`                     | `{ version, createdAt? , migratedFrom?, migratedAt?, migratedKeys? }` |
| `belearn_backup_<anahtar>_<zaman>` | Okunamayan ham değerin silinmeyen kopyası                             |

Kimlikler (`Id`): yeni kayıtlarda UUID (string); eski kayıtların sayı/ondalıklı id'leri olduğu gibi korunur.

## 2. Bağımlılıklar

| Paket                              | Sürüm          | Not                                                                        |
| ---------------------------------- | -------------- | -------------------------------------------------------------------------- |
| next                               | 16.2.1 (sabit) | Turbopack. **`npm audit`: kritik açık, düzeltmesi 16.4.3'te** (bkz. K3)    |
| react / react-dom                  | 19.2.4         |                                                                            |
| zustand                            | ^5.0.12        | Middleware kullanılmıyor (persist yok)                                     |
| lucide-react                       | ^0.577.0       | İkonlar                                                                    |
| tailwindcss / @tailwindcss/postcss | ^4 (4.2.2)     | **Tailwind v4**, CSS-first; `tailwind.config` yok, `@import "tailwindcss"` |
| typescript                         | ^5 (5.9.3)     | `strict: true` zaten açık                                                  |
| eslint / eslint-config-next        | 9 / 16.2.1     | Flat config                                                                |
| prettier / eslint-config-prettier  | 3 / 10         | **Adım 1'de eklendi**                                                      |

Node 24.14, npm 11.9 ile doğrulandı.

## 3. Baseline (Adım 1 başlangıcı)

Ham çıktılar: [docs/baseline/](docs/baseline/)

| Kontrol                 | Sonuç                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit`          | ✅ 0 hata                                                                                                                                |
| `eslint .`              | ❌ 41 hata, 29 uyarı (31× `no-explicit-any`, 5× `no-unescaped-entities`, 2× `set-state-in-effect`, 2× `immutability`, 1× `prefer-const`) |
| `next build`            | ✅                                                                                                                                       |
| Daha sıkı TS bayrakları | `noUncheckedIndexedAccess` → 25 hata; `noImplicitReturns` + `noImplicitOverride` + `noFallthroughCasesInSwitch` → 1 hata                 |

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

| ID  | Önem       | Doğr.         | Konum                                                                          | Açıklama                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Önerilen çözüm                                                                                                             | Adım                   |
| --- | ---------- | ------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| S1  | Orta       | 🟡            | `renderMarkdown` (L504), `SummaryTab`, not listesi (`dangerouslySetInnerHTML`) | Yalnızca `<` `>` kaçırılıyor (`&` ve tırnaklar kaçırılmıyor). Bununla birlikte yakalanan tüm gruplar attribute'a değil element içeriğine yazılıyor ve `<` kaçırıldığı için **bugünkü haliyle istismar edilebilir bir XSS bulamadım**. Yine de çok kırılgan: bir link kuralı (`[x](url)` → `href`) eklendiği anda `javascript:` XSS'e dönüşür. Girdi (AI çıktısı) güvenilmez.                                                                                                                                   | `react-markdown` (HTML kapalı, `rehype-raw` yok) + izinli eleman listesi; `dangerouslySetInnerHTML` tamamen kalksın        | 5                      |
| S2  | Düşük      | ❌ (şimdilik) | `LandingPage.handleStart`, `handleDashboardUrlChange`                          | URL doğrulanmadan `contentConfig.url`'e yazılıyor, **ama** web dalında `fileType` tanımsız olduğu için URL hiçbir `src`/`href`'e ulaşmıyor; ekran "Desteklenmeyen Format"a düşüyor (B8). Bu nedenle `javascript:`/`data:` riski şu an tetiklenmiyor. Web dalı açılırsa (Adım 8) doğrudan kritik hale gelir.                                                                                                                                                                                                    | `new URL()` + yalnızca `https:` (ve YouTube host listesi) izni                                                             | 5                      |
| S3  | Düşük      | ✅            | Belge görüntüleyicideki `<iframe src={contentConfig.url}>` (L1861)             | `sandbox` yok. `src` her zaman kullanıcının kendi seçtiği dosyanın `blob:` URL'si (aynı origin); `accept=".pdf"` yalnızca bir ipucu, uzantı/MIME kontrolü "pdf içeriyor mu" diye bakıyor. Pratikte risk self-XSS düzeyinde. **Dikkat:** Chrome, sandbox'lı iframe içinde PDF render etmeyi engeller; bu yüzden asıl çözüm sandbox eklemek değil, iframe'i kaldırmak.                                                                                                                                           | pdf.js görüntüleyici (iframe yok) + MIME + magic byte (`%PDF-`) kontrolü                                                   | 8 (5'te MIME kontrolü) |
| S4  | **Yüksek** | ✅            | `AIModal.handleParseJSON` (L1098)                                              | Şema doğrulaması yok. Gerçek etkisi güvenlikten çok **kalıcı çökme**: `options`/`question` nesne gelirse React "Objects are not valid as a React child" fırlatır ve Quiz sekmesi açıldığında uygulama çöker; veri localStorage'a yazıldığı için her açılışta tekrarlar (Error Boundary yok). `summary` string değilse `text.replace` TypeError verir. `correct` küçük harf ("a") ya da "Cevap: A" gelirse bütün cevaplar yanlış sayılır. Adet ve uzunluk sınırı yok, bu da localStorage kotasını riske atıyor. | zod şeması (string'ler, `correct ∈ {A,B,C,D}` + normalize, adet ≤ 50, uzunluk ≤ N), hatalı öğeleri raporla; Error Boundary | 5                      |
| S5  | Orta       | ✅            | `next.config.ts` (boş)                                                         | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` yok. Gerekli kaynaklar: `www.youtube.com` (script + frame), `i.ytimg.com`/`img.youtube.com` (img).                                                                                                                                                                                                                                                                                                                   | `headers()` ile başlıklar; CSP önce `Report-Only`                                                                          | 5                      |
| S6  | Düşük      | ✅            | `NotificationManager.send` (L211)                                              | Bildirim sesi `actions.google.com`'dan çekiliyor: her bildirimde 3. tarafa istek gidiyor, çevrimdışıyken çalmıyor, CSP'ye ek kaynak gerekiyor.                                                                                                                                                                                                                                                                                                                                                                 | `public/sounds/` altına yerel dosya                                                                                        | 5                      |
| S7  | **Yüksek** | ✅            | `App` başlangıç effect'i (L1390)                                               | 8 tane `JSON.parse` try/catch ve doğrulama olmadan çağrılıyor. Tek bir bozuk anahtar effect'i fırlatır, `setIsInitializing(false)` hiç çağrılmaz ve uygulama **sonsuza dek skeleton'da kalır** (kullanıcının kendi başına kurtulma yolu yok).                                                                                                                                                                                                                                                                  | Anahtar başına güvenli okuma + zod + bozuk anahtarı yedekleyip sıfırlama                                                   | 4                      |

### 4.2 Hatalar (Bug)

| ID  | Önem       | Doğr.                     | Konum                                                                    | Açıklama                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Önerilen çözüm                                                                                                            | Adım                   |
| --- | ---------- | ------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| B1  | **Yüksek** | ✅ (Edge'de gözlendi, §7) | `initMainPlayer`, contentConfig effect'i (L1566), header logo butonu     | App → Landing geçişinde `#youtube-main-player` unmount oluyor ama `playerRef` eski player'ı tutmaya devam ediyor ve `destroy` çağrılmıyor. Yeni video seçildiğinde `loadVideoById` ölü player'a gidiyor ve oynatıcı boş kalıyor. Aynı videoya geri dönülürse effect hiç tetiklenmiyor.                                                                                                                                                                                                                                  | `useYouTubePlayer` hook'u: mount'ta create, unmount'ta destroy, ref sıfırlama                                             | 6                      |
| B2  | Düşük      | 🟡                        | YT yükleme effect'i (L1491)                                              | Production'da effect bir kez çalıştığı için script tek. Dev'de StrictMode effect'i iki kez çalıştırıyor ve YT henüz yüklenmediği için **ikinci bir script** ekleniyor. `onYouTubeIframeAPIReady` aynı fonksiyonla eziliyor (bugün zararsız). `setTimeout` polling'i temizlenmiyor; `#youtube-music-player` hep render edildiği için pratikte döngüye girmiyor.                                                                                                                                                          | Promise tabanlı tekil `loadYouTubeApi()`                                                                                  | 6                      |
| B3  | **Yüksek** | 🟡                        | `initMainPlayer.onStateChange` (L1535)                                   | Ön bulguda tarif edilen stale closure büyük ölçüde zararsız (pId değişince player yeniden kuruluyor). **Asıl hata:** PDF'e geçildiğinde gizli YouTube player durdurulmuyor, ses arkada çalmaya devam ediyor. Playlist sonraki videoya geçerse closure'daki `type === 'video'` yüzünden `setActiveContentId(video_id)` çağrılıyor; PDF açıkken aktif içerik videoya dönüyor ve **notlar/AI içeriği yanlış içeriğe kaydediliyor**. `initMusicPlayer.onReady` de ilk render'daki `musicVolume`/`globalMuted`'ı kullanıyor. | Belge moduna geçerken `pauseVideo`/`destroy`; callback'lerde `useStore.getState()` ya da ref                              | 6                      |
| B4  | Orta       | ✅                        | Pomodoro effect'i (L1425), `addPomodoroRecord`, `PomodoroHeatmap`        | Effect `timeLeft`'e bağlı olduğu için interval her saniye kurulup sökülüyor. Arka plan sekmesinde `setInterval` kısılıyor (Chrome 5 dk sonra dakikada 1), sayaç ciddi şekilde geri kalıyor. `toISOString()` UTC: Türkiye'de (UTC+3) 00:00–02:59 arası pomodorolar önceki güne yazılıyor; ısı haritası da aynı kayma ile çiziliyor.                                                                                                                                                                                      | Bitiş zaman damgası (`endsAt`) + `Date.now()` farkı; yerel tarih anahtarı. **Karar:** eski UTC kayıtlar olduğu gibi kalır | 7                      |
| B5  | Düşük      | 🟡                        | `NotificationManager`                                                    | İzin, sayfa açılışında kullanıcı jesti olmadan isteniyor ✅ (Firefox/Safari reddeder, Chrome sessiz UI gösterir). Başlık yanıp sönme interval'i aslında 10 sn sonra **temizleniyor** ❌. Ama 10 sn içinde iki bildirim gelirse ikinci çağrı `originalTitle` olarak "🔔 …" değerini yakalıyor ve başlık zil emojisiyle kalabiliyor.                                                                                                                                                                                      | İzni "Odaklan"a ilk basışta iste; tek global blink controller                                                             | 7                      |
| B6  | **Yüksek** | ✅                        | `clearHistory`; Landing "Geçmişi Temizle", HistoryModal "Tümünü Temizle" | Onay sorulmadan tüm notlar, kartlar, quiz ve özetler siliniyor (geri alınamaz veri kaybı). `videoProgress` ne burada ne de `deleteHistoryItem`'da siliniyor.                                                                                                                                                                                                                                                                                                                                                            | Onay diyaloğu (+ geri al/yedek); progress temizliği                                                                       | 9 (onay), 4 (progress) |
| B7  | Orta       | ✅                        | `replaceContentAI`                                                       | Yeni AI içeriği, mevcut kartları/quiz'i (öğrenildi işaretleri ve cevaplar dahil) ve özeti uyarısız ezip geçiyor.                                                                                                                                                                                                                                                                                                                                                                                                        | Mevcut içerik varsa "Değiştir / Ekle / İptal" sorusu                                                                      | 9                      |
| B8  | Orta       | ✅                        | `handleStart`, `handleDashboardUrlChange`                                | YouTube dışındaki her girdi "Web Kaynağı" sayılıyor ve doğrudan "Desteklenmeyen Format" ekranı açılıyor. Placeholder "veya Web adresi" diyor ama özellik çalışmıyor; ayrıca kayıt geçmişe eklenmiyor.                                                                                                                                                                                                                                                                                                                   | **Karar: KALDIR.** Giriş "YouTube bağlantısı ya da PDF"; metin Adım 3'te, mantık Adım 8'de                                | 3 (metin), 8           |
| B9  | Düşük      | ✅                        | `handleExportNotes` (L1660)                                              | Başlık `history` içinde `contentId` ile aranıyor. Playlist kaydında `contentId` son izlenen video olduğu için diğer bölümlerde "BMO_Learn", son bölümde "Koleksiyon: …" çıkıyor; dashboard'dan yüklenen PDF geçmişte olmadığı için yine "BMO_Learn". `contentConfig.title` zaten mevcut. Panoya izinsiz yazıyor; catch mesajı "panoya kopyalandı" diyor ama kopyalamanın başarılı olup olmadığına bakılmıyor.                                                                                                           | `contentConfig.title` kullan; panoyu ayrı ve isteğe bağlı bir buton yap                                                   | 9                      |
| B10 | Düşük      | ✅                        | 3 PDF yükleme noktası; AI/not/todo id üretimi                            | `URL.createObjectURL` hiç revoke edilmiyor (her yükleme dosyayı bellekte tutuyor). Id'ler: AI için `Date.now()+Math.random()` (ondalıklı), not/todo için `Date.now()` (aynı ms'de çakışma ihtimali).                                                                                                                                                                                                                                                                                                                    | Önceki URL'yi revoke et; `crypto.randomUUID()` (mevcut sayı id'ler için migrasyon)                                        | 8 (blob), 4 (id)       |
| B11 | Orta       | ✅                        | Store'daki tüm aksiyonlar                                                | `set()` içinde `localStorage.setItem` çağrılıyor (yan etki). `setTheme` `set()` içinde DOM'u da değiştiriyor. `QuotaExceededError` yakalanmıyor: aksiyon fırlatıyor, state güncellenmiyor, kullanıcıya hiçbir şey söylenmiyor.                                                                                                                                                                                                                                                                                          | zustand `persist` + özel storage (try/catch + kullanıcı uyarısı)                                                          | 4                      |
| B12 | Düşük      | ✅                        | `renderMarkdown`                                                         | `#\s` satır başına bağlı değil ("Soru # 3" başlık oluyor). Tek yıldız çarpma ifadesini italik yapıyor ("2 * 3 * 4"). `<li>` `<ul>` olmadan basılıyor. Başlıkların ardından fazladan `<br />` geliyor. Numaralı liste, kod, link desteği yok.                                                                                                                                                                                                                                                                            | `react-markdown` ile kendiliğinden çözülür                                                                                | 5                      |
| B13 | Düşük      | ✅                        | `FlashcardsTab` (`classList.toggle('flip-card')`)                        | React dışı DOM müdahalesi. `className` değiştiğinde (ör. "öğrendim") React sınıfı eziyor ve kart kendiliğinden geri dönüyor. Klavye ile çevrilemiyor.                                                                                                                                                                                                                                                                                                                                                                   | `flipped` state + `<button aria-pressed>`                                                                                 | 9                      |
| B14 | Orta       | ➕                        | `handleDashboardFileUpload`                                              | Çalışma ekranından yüklenen PDF geçmişe **eklenmiyor** (Landing'deki yükleme ekliyor). Bu yüzden notlar ve AI içeriği yetim kalıyor, bir daha açılamıyor.                                                                                                                                                                                                                                                                                                                                                               | Tek bir `openDocument()` yardımcısı                                                                                       | 8                      |
| B15 | Düşük      | ➕                        | `addToHistory`                                                           | Mevcut state nesneleri yerinde değiştiriliyor (`existing.timestamp = …`, `newHistory[idx].title = …`); immutability ihlali.                                                                                                                                                                                                                                                                                                                                                                                             | Yeni nesne üret                                                                                                           | 4                      |
| B16 | Orta       | ➕                        | `addToHistory` (`slice(0, 30)`)                                          | Geçmiş 30 kayıtla sınırlı, ama listeden düşen kayıtların notları, kartları, quiz'i, özeti ve progress'i silinmiyor. localStorage'da erişilemeyen yetim veri birikiyor.                                                                                                                                                                                                                                                                                                                                                  | Düşen kayıtların verisini de temizle ya da sınırı kaldır + "yetim veri" temizliği                                         | 4                      |
| B17 | Orta       | ➕                        | `handleCopyPrompt`, `handleExportNotes`                                  | Güvenli olmayan bağlamda (ör. telefondan `http://192.168.x.x:3000`) `navigator.clipboard` `undefined`. `handleCopyPrompt` TypeError fırlatıyor; `handleExportNotes` indirmeye bile gelmeden düşüyor. Production (HTTPS) etkilenmez, ama mobil testi engelliyor.                                                                                                                                                                                                                                                         | `navigator.clipboard?.writeText` + fallback                                                                               | 9                      |
| B18 | Düşük      | ➕                        | Playlist kenar çubuğu (`lg:max-h-auto`)                                  | `max-h-auto` Tailwind'de yok ve CSS üretilmiyor (derlenmiş CSS'te doğrulandı). Bu yüzden kenar çubuğu masaüstünde de 400 px ile sınırlı.                                                                                                                                                                                                                                                                                                                                                                                | `lg:max-h-none`                                                                                                           | 3                      |
| B19 | Düşük      | ➕                        | Header ayracı ve istatistik noktaları                                    | `w-px h-5 border-[var(--border)]` ile `w-1 h-1 … text-[…]` öğelerinin arka planı ya da border genişliği yok, bu yüzden hiç görünmüyorlar.                                                                                                                                                                                                                                                                                                                                                                               | `bg-[var(--border)]`                                                                                                      | 3                      |
| B20 | Düşük      | ➕                        | `isInitializing`                                                         | 500 ms yapay bekleme var. Skeleton sırasında `ThemeStyles` render edilmediği için `--bg`/`--card` tanımsız kalıyor ve skeleton kartları görünmüyor.                                                                                                                                                                                                                                                                                                                                                                     | Tema değişkenleri globals.css'e (Adım 3); bekleme kaldırılır                                                              | 3                      |
| B21 | Düşük      | ➕                        | Klavye kısayolu `Ctrl+Space`                                             | Windows/macOS giriş dili değiştirme kısayoluyla çakışabilir.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `Space`/`K` (input dışında)                                                                                               | 9                      |

### 4.3 Performans

| ID  | Önem  | Doğr. | Konum                                             | Açıklama                                                                                                                                                                                                                                                                                         | Önerilen çözüm                                                      | Adım |
| --- | ----- | ----- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---- |
| P1  | Orta  | ✅    | `App`, tüm bileşenler (`useStore()` selector'süz) | `App` ve alt bileşenler store'un tamamına abone. Pomodoro `timeLeft` `App` state'inde tutulduğu için zamanlayıcı çalışırken **saniyede bir tüm ağaç** (sekmeler, modallar, header) yeniden render ediliyor; hiçbir bileşen memo'lu değil. 5 sn'lik progress yazımı da her şeyi render ettiriyor. | Selector'ler + `useShallow`; zamanlayıcıyı izole bileşene taşı      | 7, 9 |
| P2  | Düşük | 🟡    | `ThemeStyles`                                     | React aynı `__html` için DOM'u yeniden yazmıyor; maliyet her render'da ~4 KB'lık string karşılaştırması. Asıl sorun init bitene kadar render edilmemesi (B20/T1).                                                                                                                                | globals.css'e taşı                                                  | 3    |
| P3  | Düşük | ✅    | Modallar, widget'lar                              | Lazy loading yok (AIModal, HistoryModal, Pomodoro, Radio ilk bundle'da). Bundle küçük olduğu için etkisi sınırlı.                                                                                                                                                                                | `next/dynamic`                                                      | 9    |
| P4  | Düşük | 🟡    | progress interval (L1443)                         | Yazımlar zaten 5 sn aralıkla (kısmen throttle'lı). Ancak her seferinde tüm `videoProgress` serileştiriliyor, sözlük sınırsız büyüyor (hiç silinmiyor) ve selector'süz tüm abonelerde render tetikleniyor.                                                                                        | Yalnızca değişince yaz, sınır/temizlik; `visibilitychange`'de flush | 4    |

### 4.4 Tema / Stil

| ID  | Önem  | Doğr.   | Konum                                                                          | Açıklama                                                                                                                                                                                                                                                                                                         | Önerilen çözüm                                                            | Adım |
| --- | ----- | ------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| T1  | Orta  | ✅      | Başlangıç effect'i, `setTheme`                                                 | Tema effect içinde okunuyor; ilk HTML'de tema bilgisi yok, açık temalı kullanıcı önce koyu ekranı görüyor (FOUC).                                                                                                                                                                                                | `<head>`'de küçük inline script + `suppressHydrationWarning`              | 3    |
| T2  | Orta  | ✅      | `dark:` varyantları (`dark:mix-blend-screen`, `dark:bg-black/30`), globals.css | Tailwind v4'te `dark:` varsayılan olarak `prefers-color-scheme` ile çalışıyor, uygulama ise `.light-theme` sınıfı kullanıyor. OS koyu + uygulama açık temadayken `dark:` stilleri yanlışlıkla uygulanıyor. globals.css'teki `--background` da ayrı bir medya sorgusuyla değişiyor.                               | `@custom-variant dark` + tek bir `data-theme` özniteliği                  | 3    |
| T3  | Düşük | ❌ / 🟡 | Tailwind sınıfları                                                             | **Yanlış alarm:** `h-125`, `md:h-150`, `min-h-35`, `sm:w-4.5`, `duration-400` Tailwind v4'te dinamik değer olarak geçerli ve derlenmiş CSS'te mevcut (doğrulandı). Gerçekten geçersiz olan tek sınıf `lg:max-h-auto` (B18). `mt-[68px]` sihirli sayısı doğru: iki yerde URL çubuğu yüksekliğine elle hizalanmış. | Grid ile hizalama; isteğe bağlı olarak `var(--x)` → `(--x)` kanonik yazım | 3    |
| T4  | Düşük | ✅      | `.app-drag-region`                                                             | `-webkit-app-region` yalnızca Electron'da ya da `window-controls-overlay` kullanan PWA'larda anlamlı; manifestte `display_override` yok. Tek yan etkisi header'da `user-select: none`.                                                                                                                           | Kaldır                                                                    | 3    |
| T5  | Düşük | ➕      | `layout.tsx` + globals.css                                                     | Layout Geist fontunu yüklüyor ama globals.css `body`'ye Arial veriyor; Geist hiç kullanılmıyor (boşuna indiriliyor).                                                                                                                                                                                             | **Karar:** Geist kaldırılır; Literata + DM Mono (docs/DESIGN.md §5)       | 3    |
| T6  | Düşük | ➕      | `layout.tsx`                                                                   | İçerik Türkçe olduğu halde `<html lang="en">`. `notranslate` meta'sı ve `document.title` effect ile ekleniyor.                                                                                                                                                                                                   | `lang="tr"`, `metadata` + `translate="no"`                                | 3    |
| T7  | Düşük | ➕      | Genel                                                                          | `#FF8C00` yüzlerce yerde sabit yazılmış; `--primary` değişkeni tanımlı olduğu halde kullanılmıyor.                                                                                                                                                                                                               | `@theme` token'ları (`bg-primary`)                                        | 3    |

### 4.5 Erişilebilirlik / Mobil

| ID  | Önem       | Doğr.                 | Konum                                                      | Açıklama                                                                                                                                                                                          | Önerilen çözüm                                                                                                      | Adım |
| --- | ---------- | --------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- |
| A1  | **Yüksek** | ✅                    | Geçmiş kartı, not, flashcard, quiz ve todo silme butonları | `opacity-0 group-hover:opacity-100`: dokunmatik ekranda görünmüyor ya da rastgele görünüyor.                                                                                                      | Dokunmatikte her zaman görünür (`@media (hover: hover)`) + menü                                                     | 9    |
| A2  | Orta       | ✅                    | Tüm modallar, ikon butonları, flashcard                    | `role="dialog"`, `aria-modal`, Escape, odak tuzağı ve odak iadesi yok. İkon butonlarında `title` var, `aria-label` yok. Flashcard tıklanabilir bir `div` (tabIndex yok). Input'ların label'ı yok. | Ortak `<Modal>` bileşeni, aria-label'lar                                                                            | 9    |
| A3  | **Yüksek** | ✅ (bilinen davranış) | PDF `<iframe>`                                             | iOS Safari iframe içindeki PDF'te genelde yalnızca ilk sayfayı gösteriyor ve kaydırmıyor; Android Chrome iframe'de PDF render etmiyor (indirmeyi öneriyor). **Tarayıcıda doğrulanmadı.**          | pdf.js                                                                                                              | 8    |
| A4  | Orta       | ✅                    | `pendingDocReload`                                         | Sayfa yenilenince tüm oturum (`view`, `contentConfig`) kayboluyor. PDF'ler tasarım gereği saklanmıyor ve geçmişten açarken dosyanın yeniden seçilmesi gerekiyor.                                  | **Karar:** IndexedDB, "Bu cihazda sakla" varsayılan açık, dosya başına ~50 MB, Safari kota hatası anlaşılır mesajla | 8    |

### 4.6 PWA

| ID  | Önem | Doğr. | Konum         | Açıklama                                                                                                                                                                                                                                                                                     | Önerilen çözüm                                                   | Adım |
| --- | ---- | ----- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| W1  | Orta | ✅    | `PWAInjector` | Manifest `blob:` URL ile ekleniyor. `start_url: "/"` blob URL'e göre çözülemediği için Chrome kurulabilirlik kriterleri sağlanmıyor. 192 ve 512 ikonları aynı 512×512 dosya. Service worker yok, dolayısıyla sayfa çevrimdışı açılmıyor (`OfflineBanner` yalnızca açık sayfada işe yarıyor). | `app/manifest.ts`, gerçek ikon boyutları, SW (Serwist veya elle) | 10   |

### 4.7 Kod kalitesi / Bakım

| ID  | Önem       | Doğr. | Konum          | Açıklama                                                                                                                                                                                                           | Önerilen çözüm                                                                                                     | Adım    |
| --- | ---------- | ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------- |
| K1  | Düşük      | ✅    | Genel          | 31 `any`, 2 eksik `useEffect` bağımlılığı, statement olarak kullanılan 3 ternary (`globalMuted ? mute() : unMute()`), 14 kullanılmayan değişken.                                                                   | Prop arayüzleri (Adım 2), YT tipleri (6), store tipleri (4)                                                        | 2, 4, 6 |
| K2  | Düşük      | ➕    | `errors.txt`   | Repoda eski, UTF-16 kodlu bir build hata çıktısı duruyor (içindeki hata son commit'te düzeltilmiş).                                                                                                                | **Karar: sil**                                                                                                     | 3 (3b)  |
| K3  | **Kritik** | ➕    | `package.json` | `npm audit`: 13 açık, aralarında **doğrudan bağımlılık `next@16.2.1` için kritik** bir açık var. Düzeltmesi 16.4.3'te (aynı major). Geri kalanlar `sharp`/`postcss` (next üzerinden) ve geliştirme bağımlılıkları. | **Karar:** Adım 3'ün ilk commit'i olarak tek başına 16.4.x'e yükselt; build + test listesi yeşil olmadan devam yok | 3 (3a)  |
| K4  | Düşük      | ➕    | `README.md`    | Varsayılan create-next-app metni duruyor.                                                                                                                                                                          | Gerçek README                                                                                                      | 10      |
| K5  | Orta       | ➕    | —              | Hiç test yok.                                                                                                                                                                                                      | Vitest (lib/store) + Playwright (duman testi)                                                                      | 10      |
| K6  | Düşük      | ➕    | `App`          | 650 satırlık tanrı bileşen (`App`) ve prop drilling (Pomodoro widget'a 12 prop gidiyor).                                                                                                                           | Parçalama (2) + hook'lar (6, 7)                                                                                    | 2       |

### 4.8 Ön bulguların doğrulama özeti

| Ön bulgu                                               | Sonuç                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| renderMarkdown + dangerouslySetInnerHTML               | 🟡 Kırılgan; bugün istismar edilebilir bir yol bulunamadı (S1)                       |
| URL doğrulanmıyor (javascript:/data:)                  | ❌ Şimdilik yanlış alarm: URL hiçbir src/href'e ulaşmıyor (S2)                       |
| PDF iframe sandbox yok                                 | ✅ Ama sandbox Chrome PDF görüntüleyicisini bozar; çözüm pdf.js (S3)                 |
| AI JSON şemasız                                        | ✅ Önemi beklenenden yüksek: kalıcı çökme (S4)                                       |
| CSP/başlıklar yok                                      | ✅ (S5)                                                                              |
| Harici bildirim sesi                                   | ✅ (S6)                                                                              |
| localStorage JSON.parse korumasız                      | ✅ Uygulama skeleton'da kilitlenir (S7)                                              |
| playerRef ölü/eski, cleanup yok                        | ✅ (B1)                                                                              |
| iframe_api çoklu, polling temizlenmiyor                | 🟡 Yalnızca dev/StrictMode'da çift script (B2)                                       |
| Stale closure (onStateChange)                          | 🟡 Asıl hata: gizli player PDF modunda aktif içeriği değiştiriyor (B3)               |
| Pomodoro: her saniye effect, sapma, UTC tarih          | ✅ (B4)                                                                              |
| İzin açılışta; blink interval temizlenmiyor            | 🟡 İzin ✅; interval aslında temizleniyor ama üst üste binince başlık bozuluyor (B5) |
| Geçmişi Temizle onaysız; videoProgress kalıyor         | ✅ (B6)                                                                              |
| replaceContentAI uyarısız                              | ✅ (B7)                                                                              |
| Web adresi dalı → Desteklenmeyen Format                | ✅ (B8)                                                                              |
| handleExportNotes başlık/pano                          | ✅ (B9)                                                                              |
| Blob revoke yok; Date.now()+random id                  | ✅ (B10)                                                                             |
| set() içinde localStorage                              | ✅ (B11)                                                                             |
| renderMarkdown regex hataları                          | ✅ (B12)                                                                             |
| Kart çevirme classList                                 | ✅ (B13)                                                                             |
| App tüm store'u çekiyor, timer tüm ağacı render ediyor | ✅ (P1)                                                                              |
| ThemeStyles her render'da `<style>` basıyor            | 🟡 DOM yeniden yazılmıyor; asıl sorun FOUC (P2)                                      |
| Lazy loading yok; progress throttle'sız                | ✅ / 🟡 5 sn aralık zaten var (P3, P4)                                               |
| Tema FOUC; dark: ile .light-theme çakışması            | ✅ (T1, T2)                                                                          |
| Geçersiz Tailwind sınıfları                            | ❌ v4'te geçerliler; gerçek hata `lg:max-h-auto` (T3, B18)                           |
| -webkit-app-region gereksiz                            | ✅ (T4)                                                                              |
| Silme butonları hover'da                               | ✅ (A1)                                                                              |
| aria/dialog/focus trap/Escape; flashcard klavye        | ✅ (A2)                                                                              |
| PDF iframe iOS; yenilemede kayboluyor                  | ✅ (A3, A4)                                                                          |
| Blob manifest, SW yok                                  | ✅ (W1)                                                                              |
| any, eksik deps, ifade-statement'lar                   | ✅ (K1)                                                                              |

## 5. Manuel test kontrol listesi

Her adımın sonunda tekrarlanacak. Adım bazında hangi maddelerin otomatik/kodla, hangilerinin tarayıcıda doğrulandığı adım raporunda belirtilir.

| #   | Alan       | Senaryo                                                              | Beklenen                                                                                                            |
| --- | ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Landing    | Sayfayı aç                                                           | Skeleton → logo, "Sadece odaklan.", URL kutusu, PDF butonu; konsolda hata yok                                       |
| 2   | Landing    | Geçmiş varken aç                                                     | "Son Çalışmalar" altında en fazla 3 kart; tıklayınca ilgili içerik açılır                                           |
| 3   | Video      | `youtube.com/watch?v=…` gir                                          | Çalışma ekranı açılır, video otomatik oynar, başlık güncellenir, geçmişe eklenir                                    |
| 4   | Video      | `youtu.be/…`, `/shorts/…`, `/live/…`                                 | Hepsi tanınır                                                                                                       |
| 5   | Video      | Videoyu izle, sayfayı yenile, aynı videoyu aç                        | Kaldığı saniyeden devam eder (`bmo_progress`)                                                                       |
| 6   | Video      | Logo ile Landing'e dön, **farklı** bir video aç                      | Video oynar (B1 burada gözlenebilir)                                                                                |
| 7   | Video      | Silinmiş/kısıtlı video ID                                            | "Bu video oynatılamıyor" ekranı                                                                                     |
| 8   | Playlist   | `…&list=…` linki                                                     | Liste butonu görünür, kenar çubuğu bölümleri gösterir, tıklanan bölüm oynar, geçmişte "Koleksiyon" olarak gruplanır |
| 9   | Playlist   | Geçmiş → Koleksiyon → "Kaldığın Yerden Devam" ve tek bölüm           | Doğru bölüm oynar                                                                                                   |
| 10  | PDF        | Landing'den PDF yükle                                                | Masaüstünde iframe'de görünür, geçmişe eklenir                                                                      |
| 11  | PDF        | Çalışma ekranındaki "PDF Yükle"                                      | Görünür (B14: geçmişe eklenmez)                                                                                     |
| 12  | PDF        | Geçmişten PDF aç                                                     | "Dokümanı Yeniden Yükle" modalı; dosyayı seçince notlar geri gelir                                                  |
| 13  | PDF        | `.docx` gibi PDF olmayan dosya                                       | "Desteklenmeyen Format"                                                                                             |
| 14  | PDF        | Video oynarken PDF'e geç                                             | (B3) videonun sesi kesilmeli; şu an kesilmiyor                                                                      |
| 15  | Not        | Video oynarken not ekle                                              | Zaman damgalı not; damgaya tıklayınca video o saniyeye atlar                                                        |
| 16  | Not        | `**kalın**`, `- liste`, `# başlık`                                   | Biçimlendirilmiş görünür                                                                                            |
| 17  | Not        | `Alt+N`                                                              | Notlar sekmesi açılır, input odaklanır                                                                              |
| 18  | Not        | İndir butonu                                                         | `.txt` iner, "Kopyalandı!" görünür                                                                                  |
| 19  | Not        | Not sil                                                              | Silinir                                                                                                             |
| 20  | AI         | "İsteği Kopyala"                                                     | Prompt panoya kopyalanır, seçili seviye ve başlık prompt içindedir                                                  |
| 21  | AI         | Geçerli JSON yapıştır                                                | Özet sekmesine geçer; kartlar ve quiz oluşur; ilerleme çubuğu güncellenir                                           |
| 22  | AI         | JSON öncesi/sonrası serbest metin, ```json bloğu                     | Yine de ayrıştırılır                                                                                                |
| 23  | AI         | Bozuk metin                                                          | "Geçersiz format" hatası, mevcut veri bozulmaz                                                                      |
| 24  | Özet       | Metin seç → "Seçili Metni Notlara Ekle"                              | `> alıntı` notu eklenir                                                                                             |
| 25  | Kartlar    | Karta tıkla, "Çalış" modu, önceki/sonraki, öğrendim, sıfırla         | Çevrilir, sayaç ve "Öğrenilen" güncellenir                                                                          |
| 26  | Quiz       | Şık seç, sıfırla, soru sil                                           | Doğru/yanlış renkleri ve sayaçlar doğru                                                                             |
| 27  | Pomodoro   | Süreyi değiştir, başlat, duraklat, sıfırla, molayı atla              | Sayaç doğru; süre bitince toast, ses, bildirim, başlık yanıp sönmesi; ısı haritasına +1                             |
| 28  | Pomodoro   | Görev ekle, işaretle                                                 | İşaretlenen görev animasyonla kaybolur                                                                              |
| 29  | Radyo      | Aç, istasyon değiştir, ses seviyesi, oynat/duraklat                  | EQ animasyonu, ses çalışır                                                                                          |
| 30  | Ses        | Global sessiz                                                        | Video ve radyo susar                                                                                                |
| 31  | Tema       | Tema butonu, yenile                                                  | Tema korunur (`bmo_theme`); açık temada kontrast doğru                                                              |
| 32  | Görünüm    | Mavi ışık kaydırıcısı                                                | Turuncu katman opaklığı değişir                                                                                     |
| 33  | Tam ekran  | Tam ekran butonu, Esc                                                | İkon durumu senkron                                                                                                 |
| 34  | Geçmiş     | Kitaplık modalı, tek kayıt sil                                       | Kayıt ve ona ait not/kart/quiz/özet silinir                                                                         |
| 35  | Geçmiş     | "Tümünü Temizle" / "Geçmişi Temizle"                                 | Hepsi silinir (B6: şu an onaysız)                                                                                   |
| 36  | Kısayol    | `Ctrl+Space` (input dışında)                                         | Video oynat/duraklat                                                                                                |
| 37  | Çevrimdışı | DevTools'ta offline                                                  | Kırmızı bant                                                                                                        |
| 38  | PWA        | İndir butonu                                                         | Kurulum istemi ya da yönerge modalı                                                                                 |
| 39  | Mobil      | 375 px genişlik                                                      | Yatay kaydırma yok, tüm butonlar erişilebilir                                                                       |
| 40  | Depolama   | localStorage'daki tüm `bmo_*` anahtarları refactor öncesi ve sonrası | Aynı anahtarlar, aynı biçim                                                                                         |

## 6. Konum eşlemesi (Adım 2 sonrası)

| Orijinal (`app/page.tsx`)                                                                                                                                                             | Yeni konum                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `ThemeStyles` (L20)                                                                                                                                                                   | `src/components/layout/ThemeStyles.tsx`      |
| `declare global Window.YT` (L135)                                                                                                                                                     | `src/types/youtube.d.ts`                     |
| Arayüzler (L142–170) + yeni `StudyTab`, `TimerMode`, `RadioStation`, `Setter`                                                                                                         | `src/types/index.ts`                         |
| `RADIO_STATIONS`, `EXAM_LEVELS`                                                                                                                                                       | `src/constants/index.ts`                     |
| `formatTime`                                                                                                                                                                          | `src/lib/format.ts`                          |
| `extractYTId`, `extractPlaylistId`                                                                                                                                                    | `src/lib/youtube.ts`                         |
| `NotificationManager`                                                                                                                                                                 | `src/lib/notifications.ts`                   |
| `renderMarkdown`                                                                                                                                                                      | `src/lib/markdown.ts`                        |
| `AppState`, `useStore` (tüm aksiyonlar: `addToHistory`, `clearHistory`, `replaceContentAI`…)                                                                                          | `src/store/useStore.ts`                      |
| `PomodoroToast`, `PomodoroHeatmap`, `PomodoroWidget`                                                                                                                                  | `src/components/pomodoro/*`                  |
| `SkeletonLoading`, `OfflineBanner`, `BlueLightFilter`                                                                                                                                 | `src/components/ui/*`                        |
| `PWAInjector`, `AppInstallModal`                                                                                                                                                      | `src/components/pwa/*`                       |
| `LandingPage` (`handleStart`, `handleFileUpload`)                                                                                                                                     | `src/components/landing/LandingPage.tsx`     |
| `SettingsPopover`, `ProgressBar`                                                                                                                                                      | `src/components/layout/*`                    |
| `HistoryModal`                                                                                                                                                                        | `src/components/history/HistoryModal.tsx`    |
| `RadioWidget`                                                                                                                                                                         | `src/components/radio/RadioWidget.tsx`       |
| `AIModal` (`handleParseJSON`, prompt şablonu)                                                                                                                                         | `src/components/ai/AIModal.tsx`              |
| `SummaryTab` / `QuizTab` / `FlashcardsTab`                                                                                                                                            | `src/components/{summary,quiz,flashcards}/*` |
| `App`: header JSX + `handleInstallClick`                                                                                                                                              | `src/components/layout/AppHeader.tsx`        |
| `App`: sağ panel (sekmeler)                                                                                                                                                           | `src/components/layout/StudyPanel.tsx`       |
| `App`: notlar sekmesi + `handleExportNotes`                                                                                                                                           | `src/components/notes/NotesTab.tsx`          |
| `App`: URL çubuğu + `handleDashboardUrlChange` / `handleDashboardFileUpload`                                                                                                          | `src/components/player/ContentToolbar.tsx`   |
| `App`: video/PDF alanı (`#youtube-main-player`, PDF iframe)                                                                                                                           | `src/components/player/ContentViewer.tsx`    |
| `App`: playlist kenar çubuğu                                                                                                                                                          | `src/components/player/PlaylistSidebar.tsx`  |
| `App`: `pendingDocReload` modalı                                                                                                                                                      | `src/components/player/DocReloadModal.tsx`   |
| `App`: meta/title + localStorage yükleme effect'leri                                                                                                                                  | `src/hooks/useAppInit.ts`                    |
| `App`: pomodoro state'i + zamanlayıcı effect'i + toast                                                                                                                                | `src/hooks/usePomodoroTimer.ts`              |
| `App`: `playerRef`, `musicPlayerRef`, `initMainPlayer`, `initMusicPlayer`, API yükleme, içerik senkronu, progress, mute, radyo kontrolleri, `jumpToTime`, `handlePlaylistVideoSelect` | `src/hooks/useYouTubePlayers.ts`             |
| `App`: `Alt+N` / `Ctrl+Space`                                                                                                                                                         | `src/hooks/useKeyboardShortcuts.ts`          |
| `App`: tam ekran                                                                                                                                                                      | `src/hooks/useFullscreen.ts`                 |
| `App`: görünümler arası korunan UI state'i + birleştirme                                                                                                                              | `src/app/page.tsx`                           |

## 7. Doğrulama kayıtları

### Adım 2: parçalama sonrası davranış eşitliği

Yöntem: Adım 1 commit'i (`1a1d8b2`, ayrı worktree) ve Adım 2 aynı anda production modunda çalıştırıldı. Aynı duman testi (Playwright-core + yerel **Microsoft Edge**, headless, 1440×900 ve 375×812, `tr-TR`, `Europe/Istanbul`) iki sürümde de koşuldu; 16 ekran görüntüsü piksel bazında karşılaştırıldı (iframe'ler maskelendi).

- **31/31 senaryo iki sürümde aynı sonucu verdi.**
- **16/16 ekran görüntüsü birebir aynı** (0 piksel fark). İlk koşudaki radyo farkı, tıklamanın widget'ın açılış animasyonuyla çakışmasından doğan bir test zamanlaması artefaktıydı; bekleme eklenince kayboldu.
- localStorage dökümü: anahtar kümesi ve yapı aynı. Tek fark `Date.now()` ile üretilen todo id'si ve oynatılan video saniyesinin kesirli kısmı.
- Konsol: uygulamadan kaynaklanan hata yok. Görülen tek hata YouTube'un `doubleclick.net` reklam isteğindeki CORS hatası (harici, rastlantısal).
- **B1 tarayıcıda doğrulandı:** Landing'e dönüp ikinci bir video açıldığında `#youtube-main-player` boş bir `DIV` olarak kalıyor ve oynatıcı oluşmuyor. Davranış iki sürümde de aynı (refactor kaynaklı değil).
- **B8 tarayıcıda doğrulandı:** `https://example.com` girildiğinde "Desteklenmeyen Format" açılıyor.

| §5 #               | Sonuç             | Not                                                                                                                          |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1, 2               | ✅ Edge           |                                                                                                                              |
| 3, 5               | ✅ Edge           | iframe `src` içinde video id ve `start=30` var                                                                               |
| 4                  | 🟡                | `watch?v=` ve `youtu.be` test edildi; `shorts`/`live` yalnızca regex okumasıyla                                              |
| 6                  | ❌ (beklenen, B1) | iki sürümde aynı                                                                                                             |
| 7, 8, 9            | ⬜                | Gerçek playlist ve hatalı video ID ile manuel test gerekiyor                                                                 |
| 10                 | ✅ Edge           | blob iframe oluşuyor, geçmişe ekleniyor (headless'ta PDF görüntüleyici render'ı görsel olarak doğrulanmadı)                  |
| 11, 12, 13         | ⬜                | Manuel                                                                                                                       |
| 14                 | ⬜                | Ses gerektiriyor (B3)                                                                                                        |
| 15–18              | ✅ Edge           | not ekleme, kalın render, `Alt+N` odağı, `.txt` indirme                                                                      |
| 19                 | ⬜                | Manuel                                                                                                                       |
| 20–22              | ✅ Edge           | pano içeriği, ```json bloğu içinden içe aktarma, kart=2 quiz=1                                                               |
| 23, 24             | ⬜                | Manuel                                                                                                                       |
| 25, 26             | ✅ Edge           | çevirme, çalışma modu, öğrendim, doğru cevap sayacı                                                                          |
| 27                 | 🟡 Edge           | Sayaç ilerliyor (25:00 → 24:58); süre bitişi, ses ve bildirim test edilmedi                                                  |
| 28                 | ✅ Edge           |                                                                                                                              |
| 29                 | ✅ Edge           | widget, istasyon değişimi, radyo iframe'i (ses doğrulanmadı)                                                                 |
| 30, 33, 36, 37, 38 | ⬜                | Manuel (ses, tam ekran, kısayol, çevrimdışı, PWA istemi)                                                                     |
| 31, 32             | ✅ Edge           | `light-theme` sınıfı + `bmo_theme`, mavi ışık katmanı                                                                        |
| 34, 35             | ✅ Edge           | tek kayıt silme; temizleme sonrası kalan anahtarlar `bmo_pomodoro`, `bmo_progress`, `bmo_theme`, `bmo_todos` (B6 doğrulandı) |
| 39                 | ✅ Edge           | 375 px'te `scrollWidth = innerWidth` (yatay taşma yok); gerçek iOS/Android cihaz test edilmedi                               |
| 40                 | ✅                | `bmo_*` anahtarlarının kaynak koddaki kullanım sayıları orijinalle birebir aynı (`grep`)                                     |

### Adım 2 sırasında bulunan ek konular

- **K7:** `useYouTubePlayers` ana oynatıcıyla radyoyu birlikte yönetiyor, çünkü ikisi aynı API yükleme effect'i tarafından başlatılıyor. Saf taşıma sırasında ayrılmadı; Adım 6'da `useYouTubePlayer` ve `useRadio` olarak ayrılacak.
- **K8:** Görünümler arası (landing ↔ app) korunan UI state'i (`newNote`, `videoUrlInput`, `activeTab`, `copyFeedback`…) davranış değişmesin diye `page.tsx`'te tutuluyor ve prop'larla aşağı iniyor. Adım 4/9'da store'un `ui` slice'ına taşınması önerilir.
- **K9:** `loadedPlaylistRef` hiç kullanılmıyordu, kaldırıldı (davranış etkisi yok).
- Bütün uygulama hâlâ tek bir client sınırının (`page.tsx`) altında. Server component'e geçirilebilecek anlamlı bir parça yok; landing'in statik kısmı Adım 3'te `layout`/server tarafına alınabilir.

### Adım 3: güvenlik yükseltmesi, marka, tasarım altyapısı

Commit'ler: `f953a0e` (3a) · `fae5947` (3b) · `7c02931` (3c) · `045d0c1` + `960afe1` (3d) · `030587a` (3e) · `281fff6` (3f) · `a7e0f13` + `a0fd956` (3g).

**3a kapısı:** `next` 16.2.1 → 16.4.3 ve `eslint-config-next` 16.4.3; `npm audit fix` (source-map-js). Sonuç: `npm audit` **0 açık**. Duman testi 31/31 geçti; 16/16 ekran görüntüsü Adım 2 ile piksel piksel aynı (yükseltme görünümü değiştirmedi).

**Adım sonu doğrulaması:** Duman testi v2 (Edge, yeni arayüze uyarlandı ve genişletildi) **45/45** geçti. Uygulamadan kaynaklanan konsol hatası yok. Yeni kontroller:

| Kontrol                                                                                             | Sonuç                                          |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| FOUC: `bmo_theme=light` ile `DOMContentLoaded` anında `data-theme=light`                            | ✅                                             |
| OS koyu + uygulama Gündüz: zemin `rgb(232,230,221)`                                                 | ✅ (T2)                                        |
| Kayıt yoksa OS tercihi uygulanıyor ve tercih kaydedilmiyor                                          | ✅                                             |
| `prefers-reduced-motion`: başlık animasyonu ~0 ms                                                   | ✅                                             |
| Landing yalnızca DESIGN §8.1 öğeleri; ilovepdf bağlantısı ve "Sadece PDF" metni yok                 | ✅                                             |
| Kitaplık rafı: 3 sırt, "Koleksiyon · 1 video"                                                       | ✅                                             |
| "Tüm geçmiş" → modal → seçim çalışma ekranını açıyor                                                | ✅                                             |
| Panel ve video aynı hizada başlıyor (grid, T3)                                                      | ✅ (163 px / 163 px)                           |
| Sekme sayaçları içerik bazlı                                                                        | ✅                                             |
| Not dosyası "BeLearn — Çalışma Notları" ile başlıyor                                                | ✅                                             |
| Üst çubukta "Odaklan" sayacı başlatıyor; panelde +1 dk → 26:00, 50/10 → 50:00; widget ile aynı süre | ✅                                             |
| Ayarlar: mavi ışık çalışıyor, Escape ile kapanıyor                                                  | ✅                                             |
| Ses düğmesi `aria-pressed`                                                                          | ✅                                             |
| 375 px: yatay taşma yok, mobil menüde tüm işlemler var, üst çubuk dokunma hedefleri ≥ 44 px         | ✅                                             |
| "Tümünü temizle" (artık modalda)                                                                    | ✅ (onay hâlâ yok; B6 → Adım 9)                |
| DESIGN §11 kalıp taraması                                                                           | ✅ (tek eşleşme: istisna olan `--filter-warm`) |
| Kaynaktaki her renk/köşe/gölge sınıfı CSS üretiyor                                                  | ✅ (geçersiz sınıfla denenerek doğrulandı)     |
| Kullanıcıya görünen "BMO"                                                                           | ✅ yok (yalnızca `bmo_*` anahtarları)          |

**Çözülen bulgular:** K2, K3, T1, T2, T3, T4, T5, T6, T7, B18, B19, B20. Bunlara ek olarak P2 (`ThemeStyles` kaldırıldı) ve A2'nin üst çubuk kısmı (`aria-label`, `aria-pressed`, `aria-expanded`, Escape).

**Bilinçli davranış değişiklikleri** (işlev kaybı yok):

1. Tema, kullanıcı seçene kadar **kaydedilmiyor**; OS tercihini izliyor. Eskiden ilk açılışta OS tercihi `bmo_theme`'e yazılıyordu. (DESIGN §4)
2. Yapay 500 ms bekleme ve iskelet ekranı kalktı; Landing doğrudan prerender ediliyor.
3. "Geçmişi Temizle" Landing'den kalktı ve yalnızca Geçmiş modalında (karar #3). Modal artık Landing'den de açılıyor ve seçim çalışma ekranına geçiyor.
4. Üst çubuktaki toplam not/kart/soru sayaçları, içerik bazlı sekme sayaçlarına dönüştü. İlerleme çubuğu panelin içine taşındı (karar #2).
5. Pomodoro widget'ı artık üst çubuktaki süre düğmesiyle değil, ayar panelindeki "Görevler ve harita →" bağlantısıyla açılıyor. Sayaç üst çubuktan doğrudan başlatılabiliyor (karar #6).
6. Playlist kenar çubuğu açılıp kapanırken genişlik animasyonu yok (DESIGN §7).
7. Tema geçişi anlık; 0.4 s'lik renk geçişi kalktı.

**Plandan sapmalar:**

- **Yer tutucu ikonlar Adım 10 yerine 3d'de üretildi.** Mevcut `favicon.ico` turuncu BMO logosuydu; ya eski logo görünmeye devam edecekti ya da PWA ikonları kırılacaktı. `manifest.ts` ve service worker yine Adım 10'da.
- **Sekme şeridi altı çizgili metne Adım 9 yerine 3f'de geçti.** Sayaçları eklemek için zaten değiştiriliyordu; 3g'nin mekanik boyaması dolu bordo sekmeler üretecekti. Panelin geri kalanı Adım 9'da.
- Modal ve widget'larda **açılış** 150 ms solma ile yapılıyor. **Kapanış** solması, modallar ortak `<Modal>` bileşenine taşınınca (Adım 9) eklenecek; şu an kapanış anında.

**Adım 3 sırasında bulunan ek konular:**

- **K10:** `README.md` karışık kodlamalıydı (UTF-8 metin + sona eklenmiş UTF-16 satır); bu yüzden `grep` içeriği göremiyordu. UTF-8 olarak yeniden yazıldı.
- **K11:** `src/app/favicon.ico` turuncu BMO logosuydu (görsel incelemeyle bulundu). Değiştirildi.
- **K12:** Taban stiller katmansız CSS'teyken Tailwind'in `@layer utilities` sınıflarını eziyordu (ör. `focus:outline-none`). `@layer base`'e alındı.
- **K13:** Turbopack, ICO içindeki PNG'lerin RGBA olmasını şart koşuyor; RGB PNG'li favicon build'i kırıyor. İkonlar RGBA olarak üretildi.
- **W1 (değişmedi):** Manifest hâlâ `blob:` URL ile ekleniyor; `start_url` ve ikon adresleri mutlak URL'ye çevrildi ama kurulabilirlik Adım 10'a kadar garanti değil.

### Adım 4: yedek, state ve depolama

Commit'ler: `cb228f6` (4a) · `0da59cf` (4b) · `61fc95a` (4c) · `9d4a086` (4d).

**Yöntem:** Edge ile depolama testi (sahte eski döküm `tests/fixtures/bmo-legacy.json` ve bozuk döküm `bmo-corrupt.json`). Her alt adımda ayrıca genel duman testi koşuldu. Gerçek bir döküm `fixtures/local/bmo-dump.json` olarak konursa test onu kullanır; bu klasör `.gitignore`'da.

| Senaryo                                                                                                                         | Sonuç     |
| ------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A1–A3 Yedeği indir → tarayıcı verisini temizle → yedeği yükle: tüm anahtarlar byte-byte aynı, raf ve sekmeler veriyi gösteriyor | ✅        |
| B1 "Boş alanlara ekle" mevcut notlara dokunmuyor, boş alanları dolduruyor                                                       | ✅        |
| C1 "Yerine koy" önce `-oncesi` yedeğini indiriyor, sonra değiştiriyor                                                           | ✅        |
| D1 Ham `bmo_*` dökümü yüklenebiliyor · D2 geçersiz dosyada anlaşılır hata, veri değişmiyor                                      | ✅        |
| E1 Yalnızca `bmo_*` varken açılış: `belearn_*` kopyası byte-byte aynı, meta yazılıyor                                           | ✅        |
| E2 Kullanım sonrası `bmo_*` anahtarları byte-byte değişmemiş; yeni veri `belearn_*`'ta                                          | ✅        |
| E3 Migrasyon bir kez çalışıyor · E4 `bmo_theme` okunuyor, seçim `belearn_theme`'e yazılıyor                                     | ✅        |
| E5 Eski geçmiş biçimi (id'siz, `pId`'li) koleksiyona dönüşüyor                                                                  | ✅        |
| E6 Migrasyon kota yüzünden yarıda kalırsa `belearn_*` geri alınıyor, `bmo_*` sağlam, uyarı gösteriliyor                         | ✅        |
| F1 Bozuk JSON + şemaya uymayan soru: uygulama açılıyor, uyarı ve `belearn_backup_*` var                                         | ✅        |
| F2 Geçerli 3 soru korunuyor, bozuk soru atlanıyor, Quiz sekmesi çökmüyor (S4'ün kalıcı çökme kısmı)                             | ✅        |
| F3 Kota dolu: not ekranda kalıyor, kullanıcı uyarılıyor                                                                         | ✅        |
| F4 Yeni kayıt id'si UUID v4; eski sayı id'ler korunuyor                                                                         | ✅        |
| G1 Geçerli eski veri hiçbir kayıt kaybetmeden ve uyarı üretmeden okunuyor                                                       | ✅        |
| G2 Geçmiş kaydı silinince yalnızca o içeriğin video ilerlemesi siliniyor (B6)                                                   | ✅        |
| Depolama testi toplam                                                                                                           | **20/20** |
| Duman testi v2 (`belearn_*` ile)                                                                                                | **45/45** |

**Çözülen bulgular:** S7, B10 (kimlikler; blob revoke Adım 8'de), B11, B15, K8; B6'nın ilerleme kısmı (onay Adım 9'da); B16 ve P4 kısmen (sınır yükseltildi, otomatik silme yok, yetim tespiti hazır; onaylı temizlik arayüzü Adım 9'da); S4'ün depolamadaki kalıcı çökme kısmı (AI içe aktarma şeması Adım 5'te).

**Plandan sapmalar ve kararlar:**

- **zustand `persist` kullanılmadı.** `persist` bütün durumu tek bir anahtara tek blob olarak yazıyor; plan ise her veri alanının kendi `belearn_*` anahtarında durmasını istiyor. Bunun yerine küçük bir abonelik katmanı (`store/persistence.ts`) kullanıldı: yükleme bittikten sonra abone oluyor ve yalnızca referansı değişen alanın anahtarını yazıyor. Sürümleme `belearn_meta` ile yapılıyor.
- **Geçmiş sınırı 30'dan 200'e çıkarıldı.** Eskiden 30'u aşan kayıtlar listeden düşünce notları erişilemez hale geliyordu. Otomatik silme kullanıcı verisini sessizce yok edeceği için yapılmadı.
- **"Tümünü temizle" video ilerlemesini de siliyor.** Görevler ve pomodoro geçmişi bilinçli olarak korunuyor (eski davranışla aynı).
- **UI slice'ı oluşturuldu** ve `page.tsx`'teki durum oraya taşındı. Bileşenler hâlâ prop alıyor; doğrudan selector ile okumaya geçiş Adım 9'da (P1).

**Adım 4 sırasında bulunan ek konular:**

- **K14:** Next, sayfaya boş bir `role="alert"` öğesi ekliyor (route announcer). Testlerde ve ileride erişilebilirlik denetiminde `role="alert"` seçicileri bu yüzden metne göre süzülmeli.
- **K15:** Ayarlar açılır menüsü, "Yedeği yükle" ile açılan pencerenin arkasında açık kalıyor (dosya seçimi dışarı tıklama sayılmıyor). İşlevi etkilemiyor; ortak `<Modal>` ile Adım 9'da düzeltilecek.

### Adım 5: güvenlik sertleştirme

Commit'ler: `efd5337` (5a: markdown, AI şeması, hata ekranı, girdi doğrulama) · `9ea2438` (5b: CSP ve başlıklar, yerel ses, SECURITY.md) · `6051cfb` (`next dev`'in yeniden yazdığı AGENTS.md).

**Yöntem:** Güvenlik testi Edge ile, önce `CSP_REPORT_ONLY=1` build'inde (ihlaller toplandı), sonra zorunlu CSP ile koşuldu. İhlaller `securitypolicyviolation` olayıyla toplandı; `alert`/diyalog ve sayfa hataları izlendi.

| Senaryo                                                                                                                     | Sonuç                                                                                |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| H1 Başlıklar: CSP, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options; `X-Powered-By` yok                        | ✅                                                                                   |
| F1–F5 CSP altında: YouTube oynatıcısı, radyo, `img.youtube.com` küçük resimleri, yerel ses (200 `audio/wav`, çalınabiliyor) | ✅                                                                                   |
| P1 Gerçek PDF blob iframe'de açılıyor · P2 HTML içerikli `sahte.pdf` açılmıyor ("Desteklenmeyen Format")                    | ✅                                                                                   |
| U1 `javascript:` adresi hiçbir `src`/`href`'e yazılmıyor                                                                    | ✅                                                                                   |
| X1 AI özetinde `<img onerror>`, `<script>`, `javascript:`/`data:` bağlantıları düz metin; betik çalışmıyor                  | ✅                                                                                   |
| X2 Yalnızca `https:` bağlantı korunuyor, `rel="noopener noreferrer nofollow"`                                               | ✅                                                                                   |
| X3 Not metnindeki HTML düz metin; `**kalın**` çalışıyor                                                                     | ✅                                                                                   |
| J1 Nesne şıklı ve doğru cevabı olmayan sorular atlanıp raporlanıyor, çökme yok                                              | ✅                                                                                   |
| J2 `correct` normalize: `b` → B, `Cevap: C` → C, şık metni `dört` → D (dizi şıklar)                                         | ✅                                                                                   |
| J3 Quiz sekmesi 3 geçerli soruyu gösteriyor · J4 150 kart → 100 + uyarı · J5 JSON yoksa anlaşılır hata                      | ✅                                                                                   |
| CSP ihlali (Report-Only)                                                                                                    | 1: `script-src ← eval` (zod 4'ün `new Function` yoklaması) → `jitless` ile giderildi |
| CSP ihlali (zorunlu, üretim) / geliştirme modu                                                                              | ✅ yok / ✅ yok                                                                      |
| Güvenlik testi toplam                                                                                                       | **20/20**                                                                            |
| Duman testi v2 · depolama testi                                                                                             | **45/45** · **20/20**                                                                |

**Çözülen bulgular:** S1, S2, S4, S5, S6, B12. S3 kısmen çözüldü: imza kontrolü var, iframe'in kaldırılması (pdf.js) Adım 8'de.

**Kararlar ve ödünleşimler:**

- **`script-src 'unsafe-inline'`.** Statik prerender edilen sayfada Next'in satır içi script'leri için gerekli; nonce, sayfanın her istekte sunucuda render edilmesini (Proxy) gerektiriyor. Asıl XSS savunması, hiçbir kullanıcı/AI içeriğinin HTML olarak render edilmemesi (SECURITY.md).
- **CSP kipi derleme anında belirleniyor** (`next.config.ts` → routes manifest). Report-Only denemesi için `CSP_REPORT_ONLY=1 npm run build`.
- **AI içe aktarma uyarıları:** Atlanan ya da kısaltılan öğe varsa pencere kapanmadan "İçe aktarıldı" özeti gösteriliyor; uyarı yoksa davranış eskisi gibi.
- **Bildirim sesi** uygulama içinde üretildi (iki notalı, 0,6 sn, WAV); lisans gerektirmiyor.

**Adım 5 sırasında bulunan ek konular:**

- **K16:** zod 4, eval desteğini `new Function` ile yokluyor; katı CSP'de ihlal raporu üretiyor. Proje genelinde `src/lib/zod.ts` (`jitless`) üzerinden içe aktarılmalı. Doğrudan `from 'zod'` kullanılmamalı.
- **K17:** `next dev` 16.4, `AGENTS.md`'deki `nextjs-agent-rules` bloğunu kendisi yeniden yazıyor. Değişiklik commit'lenmezse her `dev` çalıştırmasında yeniden oluşuyor.
- **K18:** YouTube IFrame API, iframe hazır olmadan `postMessage` denediğinde konsola "target origin … does not match" uyarısı basıyor (geliştirme modunda görüldü). İşlevsel değil; Adım 6'da oynatıcı yaşam döngüsüyle birlikte ele alınacak.

### Adım 6: YouTube ve radyo

Commit'ler: `262a099` (6a: hook'lar + video, oynatma listesi ve radyo yeni tasarımla) · `6ada6c3` (6c: kalan `any`'ler, lint kuralları yeniden hata).

**Yöntem:** Edge ile oynatıcı testi (`--autoplay-policy=no-user-gesture-required`). Oynatıcı durumu, konteynerdeki `data-yt-state` özniteliğinden okundu. Gerçek bir herkese açık oynatma listesi (32 bölüm) kullanıldı.

| Senaryo                                                                                                                                                     | Sonuç                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Y0 Landing YouTube'a hiç bağlanmıyor (API script'i yok)                                                                                                     | ✅                        |
| Y1 **[B1]** Landing ↔ çalışma ekranı 5 kez, her seferinde farklı video: hepsi doğru oynuyor                                                                 | ✅                        |
| Y2 **[B2]** DOM'da tek `iframe_api` script'i ve tek ana oynatıcı                                                                                            | ✅                        |
| Y3 Video oynuyor, altyazıda gerçek başlık                                                                                                                   | ✅                        |
| Y4–Y5 **[B3]** PDF'e geçince video duraklıyor (state 2), etkin içerik belge olarak kalıyor                                                                  | ✅                        |
| Y6 Belgeden videoya dönüşte video yeniden oynuyor                                                                                                           | ✅                        |
| Y7 [#7] Oynatılamayan video: koda göre anlaşılır mesaj                                                                                                      | ✅                        |
| Y8–Y10 [#8, #9] Oynatma listesi tanınıyor (32 bölüm); 3. bölüme geçiş "Bölüm 3 / 32" ve etkin satır; koleksiyon geçmişe yazılıyor                           | ✅                        |
| Y11–Y14 [#29] Radyo ilk açılışta kuruluyor; varsayılan istasyon çalıyor; istasyon değişimi "Çalıyor", Duraklat "Duraklatıldı"; Landing'e dönünce kapanmıyor | ✅                        |
| Y15–Y16 YouTube engellenirse "YouTube yüklenemedi" + "Yeniden dene"; yeniden denemede oynatıcı kuruluyor                                                    | ✅                        |
| Oynatıcı testi toplam                                                                                                                                       | **19/19**                 |
| Duman · güvenlik (zorunlu CSP) · depolama                                                                                                                   | **45/45 · 20/20 · 20/20** |

#30 (genel sessiz) tarayıcıda ses olarak ölçülemiyor. Kodda iki oynatıcı da `globalMuted` değişince ve kurulduğu anda (`onReady`) sessize alınıyor; eskiden yeni kurulan oynatıcı açılışta sessize alınmıyordu.

**Çözülen bulgular:** B1, B2, B3, K7, K18. Ayrıca `no-explicit-any` ve `react-hooks/immutability` yeniden hata düzeyinde; geçici olarak uyarıda kalan tek kural `react-hooks/set-state-in-effect` (Adım 9).

**Adım 6 sırasında bulunan ek konular:**

- **K19 (çözüldü):** Varsayılan "Lofi Hip Hop" yayını (`jfKfPfyJRdk`) YouTube'da gömmeye kapalı (hata 150), yani radyo hiç çalmıyordu. Eski kod radyo hatasını dinlemediği için görünmüyordu. Aynı adlı ve aynı türden gömülebilir bir yayınla (`7NOSDKb0HlU`, Chillhop Music) değiştirildi.
- **K20 (çözüldü, 2026-10-25):** "Karadeniz Akustik" (`Fru_Ss-TqgY`) de hata 150 veriyordu. Kullanıcının verdiği yayınla (`26SKAEoDpPI`, kanal: Karadeniz Akustik) değiştirildi; gömülebildiği doğrulandı.
- **K21 (çözüldü):** Oynatıcı hazır olmadan istasyon değiştirilirse hazır olduğunda eski istasyon çalıyordu.
- **K22 (çözüldü):** İstasyon değişince arayüz iyimser biçimde "Duraklat" gösterirken düğme oynatıcının gerçek (arabellek) durumuna bakıyordu; "Duraklat"a basmak bir şey yapmıyordu.
- **Davranış değişikliği:** Radyo ve YouTube API'si artık ilk ihtiyaçta yükleniyor (eskiden açılışta). Landing YouTube'a hiç istek yapmıyor.

### Adım 7: Pomodoro ve zamanlayıcı

Commit'ler: `18d0305` (K20: Karadeniz Akustik istasyonu) · `a676938` (Adım 7).

**Yöntem:** Edge + Playwright sahte saati (`page.clock`), saat dilimi `Europe/Istanbul`. İçeriğe PDF ile girildi (YouTube sahte saatten etkilenmesin diye). Render sayımı, sayfaya React DevTools kancası enjekte edilerek yapıldı. Bir bileşen, ancak fiber nesnesi bir önceki commit'te yoksa **ve** `memoizedProps`/`memoizedState` önceki halinden farklıysa "çalıştı" sayıldı; böylece React'in render etmeden yaptığı klonlar ayıklandı. Metriğin ayırt ediciliği karşı-sınamayla doğrulandı: not alanına yazmak 85 bileşenden 52'sini render ediyor.

| Senaryo                                                                                                             | Sonuç                             |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| B5 Açılışta bildirim izni istenmiyor; ilk "Odaklan" tıklamasında bir kez isteniyor                                  | ✅                                |
| **P1** Zamanlayıcı çalışırken 4 sn'de 16 commit; commit başına **85 bileşenden en fazla 1**'i (sayaç) çalışıyor     | ✅                                |
| Duraklat: süre donuyor, düğme "Devam et"                                                                            | ✅                                |
| **B4** Saat 10 dk ileri alınıp hiçbir zamanlayıcı tetiklenmediğinde (arka plan sekmesi gibi) ekranda tam 15:00      | ✅                                |
| **B4** İstanbul 00:05'te başlayıp 00:30'da biten pomodoro `2026-10-25`'e yazılıyor (UTC günü `10-24` değil)         | ✅                                |
| Faz bitişi: bildirim kutusu, mola modu, "Molayı başlat", 05:00                                                      | ✅                                |
| Başlık yanıp sönüyor ve 10 sn sonra eski haline dönüyor; üst üste iki bildirimde "🔔" ile takılı kalmıyor (B5)      | ✅                                |
| Eski UTC anahtarlı kayıtlar (2 + 4) ısı haritasında, yenilerle birlikte (toplam 8)                                  | ✅                                |
| Karar #6: 50/10 seçimi `belearn_pomodoro_settings`'e yazılıyor, yenilemeden sonra 50:00                             | ✅                                |
| Çalışırken süre alanları kilitli                                                                                    | ✅                                |
| Görev tamamlama: işaretleniyor, kısa süre sonra kalkıyor, depodan da siliniyor; hareketi azalt açıkken de çalışıyor | ✅                                |
| Pomodoro testi toplam                                                                                               | **16/16**                         |
| Duman · oynatıcı · güvenlik · depolama                                                                              | **45/45 · 19/19 · 20/20 · 20/20** |

**Çözülen bulgular:** B4, B5; P1'in zamanlayıcı kısmı (store'un tamamına abone olan `page.tsx` hâlâ her store değişiminde geniş render yapıyor; selector'lere geçiş Adım 9'da). `taskComplete` animasyonunun işlevsel bağımlılığı kalktı.

**Bilinen sınır:** Arka plan sekmesinde tarayıcı zamanlayıcıları kısabilir (Chrome'da 5 dk sonra dakikada bir). Ekrandaki süre bundan etkilenmez, ama faz bitişi (ses, bildirim) en geç kısılmış zamanlayıcının tetiklendiği ya da sekmeye dönüldüğü anda işlenir; kayıt yine fazın bittiği güne yazılır. Tam zamanında arka plan bildirimi için service worker gerekir (Adım 10'da değerlendirilecek).

**Davranış değişiklikleri:**

- Duraklatılmış zamanlayıcının düğmesi "Devam et" oldu.
- Odak ve mola süreleri artık kalıcı (karar #6).
- Tamamlanan görev 0,9 sn "tamamlandı" görünüp kalkıyor; eskiden animasyon bitince kalkıyordu, süre yaklaşık aynı.

### Adım 8: PDF ve belgeler

Commit: `ddc874f`.

**Yöntem:** Edge ile PDF testi. Test PDF'leri geçerli `xref` tablosuyla üretildi: 5 ve 20 sayfa, metinli; ayrıca 51 MB'lık bir dosya. Mobil için Playwright'ın iPhone 13 ve Pixel 7 öykünmeleri (dokunmatik, mobil görünüm alanı, UA) kullanıldı. Blob URL'leri `createObjectURL`/`revokeObjectURL` sayılarak izlendi; CSP ihlalleri `securitypolicyviolation` ile toplandı.

| Senaryo                                                                                                                                         | Sonuç                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| V1–V3 pdf.js görüntüleyici: "Sayfa 1 / 5", iframe yok, seçilebilir metin katmanı, kaydırınca "Sayfa 5 / 5"                                      | ✅                                        |
| V4 Yakınlaştırma: %120'de sayfa genişliği 849 → 1019 px; "Genişliğe sığdır"                                                                     | ✅                                        |
| V5 Metin seçimi → "Seçili metni notlara ekle" → `> Mitokondri … (s. 2)`                                                                         | ✅                                        |
| V6, **A4** PDF IndexedDB'de saklanıyor; yenileme sonrası raftan açınca dosya seçmeden açılıyor                                                  | ✅                                        |
| **B14** Çalışma ekranından yüklenen PDF geçmişe ekleniyor                                                                                       | ✅                                        |
| #13, karar #4: PDF olmayan dosyada yalnızca "Desteklenmeyen dosya" uyarısı, içerik değişmiyor; imzası tutmayan `sahte.pdf` reddediliyor         | ✅                                        |
| **B8** Web adresi (Landing ve çalışma ekranı): "Yalnızca YouTube bağlantısı ya da PDF açılabilir."                                              | ✅                                        |
| 50 MB üstü: açılıyor, saklanmıyor, anlaşılır uyarı                                                                                              | ✅                                        |
| **B10** 10 yüklemede 10 blob URL oluşturuldu, 9'u serbest bırakıldı; açık kalan 1, ekrandaki PDF                                                | ✅                                        |
| Saklama kapalıyken geçmişten açınca yeni "yeniden seç" penceresi; dosya seçince açılıyor (ve saklanmıyor)                                       | ✅                                        |
| Geçmişten silinen PDF IndexedDB'den de siliniyor (12 → 11)                                                                                      | ✅                                        |
| **A3** iPhone 13 ve Pixel 7 öykünmesi: 20 sayfalık PDF çiziliyor ve kaydırılıyor (Sayfa 13 / 20); bellekte aynı anda 5–6 sayfa; yatay taşma yok | ✅                                        |
| CSP ihlali · sayfa hatası                                                                                                                       | ✅ yok · yok                              |
| PDF testi toplam                                                                                                                                | **20/20**                                 |
| Duman · güvenlik · oynatıcı · pomodoro · depolama                                                                                               | **45/45 · 20/20 · 19/19 · 16/16 · 20/20** |

**Paket boyutu:** Landing'de pdf.js içeren hiçbir dosya inmiyor. pdf.js (sıkıştırılmamış ~1,7 MB) ve worker'ı yalnızca bir PDF açılınca yükleniyor. Landing'in kendi JS'i sıkıştırılmamış ~1,1 MB; markdown ve modal kodunun gecikmeli yüklenmesi Adım 9'da (P3).

**Çözülen bulgular:** A3, A4, B8, B10 (blob), B14, S3 (iframe tamamen kalktı).

**Kararlar ve notlar:**

- **pdf.js varlıkları** `npm install` sırasında `public/pdfjs/`'e kopyalanıyor (git'e girmiyor). Vercel kurulumda bu adımı kendisi çalıştırır.
- **CSP:** `'wasm-unsafe-eval'` (yalnızca wasm derleme, JS eval değil) ve `connect-src blob:` eklendi; iframe kalmadığı için `frame-src`'den `blob:` çıkarıldı (SECURITY.md).
- **Gerçek cihaz:** iOS Safari ve Android Chrome'da gerçek cihaz testi yapılmadı. pdf.js her tarayıcıda aynı canvas çizimini kullandığı için öykünme sonucu güvenilir bir gösterge, ama kesin değil. Özellikle Safari'nin IndexedDB kotası gerçek cihazda denenmeli.
- **Görünüm:** Belge modunda içerik kutusu 16:9 yerine uzun sayfa yüksekliğinde.
- **Kaldırılan yardımcı:** URL doğrulama (`toHttpsUrl`) web adresi dalıyla birlikte kalktı; bağlantılar yalnızca YouTube kimliği olarak ayrıştırılıyor.

**Adım 8 sırasında bulunan ek konular:**

- **K23:** pdf.js 6'da `PDFDocumentProxy.destroy()` yok; belge yükleme görevi üzerinden (`loadingTask.destroy()`) kapatılıyor.
- **K24:** Playwright 50 MB'tan büyük dosyaları tampon olarak kabul etmiyor; 50 MB testi dosya yoluyla yapıldı.

### Adım 9: Çalışma ekranı, erişilebilirlik, performans, mobil

Commit: `4470e22`.

**Yöntem:** Edge (Playwright) ile yeni Adım 9 testi: modal odak yönetimi, onaylar, kısayollar, yalnızca klavyeyle akışlar, odak modu, 375 px, axe-core 4 (13 ekran, iki tema) ve React DevTools kancasıyla render sayımı. Lighthouse 13, Chrome headless-shell 156 ile, her kip için 3 tekrar. Headless Edge'de Lighthouse 12 ve 13 izi kaydedemedi (`NO_NAVSTART`).

**Lighthouse (landing, aynı makine, 3 tekrar):**

|                                                  | Önce (`4101c54`)             | Sonra                            |
| ------------------------------------------------ | ---------------------------- | -------------------------------- |
| Mobil performans                                 | 76 · 77 · 77                 | 79 · 78 · 79                     |
| Mobil erişilebilirlik · en iyi uygulamalar · SEO | 100 · 100 · 100              | 100 · 100 · 100                  |
| Mobil LCP · TBT · Speed Index                    | 5,7 sn · 160–190 ms · 2,3 sn | 5,4–5,8 sn · 120–140 ms · 0,8 sn |
| Masaüstü performans · erişilebilirlik            | 98 · 100                     | 98 · 100                         |
| Landing JS (ham / aktarım)                       | 1103 KB / 315 KB             | 881 KB / 254 KB                  |

İlk "önce" ölçümü geçersizdi: arkada çalışan eski `next start` yeni derlemenin dosyalarını 500 ile döndürüyordu (CSS yüklenmemişti). Temiz derlemeyle yeniden ölçüldü.

| Senaryo                                                                                                                               | Sonuç                                             |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **A2** Ortak `<Modal>`: açılınca odak içeride; 25 Tab/Shift+Tab'da odak dışarı çıkmıyor; Escape kapatıyor; odak açan düğmeye dönüyor  | ✅                                                |
| §7.5 Kapanışta 150 ms solma (pencere hemen kaybolmuyor, sonra DOM'dan çıkıyor)                                                        | ✅                                                |
| **B6** "Tümünü temizle" ve kayıt silme onaylı; ilk odak "Vazgeç"; Escape yalnızca onayı kapatıyor; "Vazgeç" hiçbir şey silmiyor       | ✅                                                |
| **B16** Sahipsiz veri uyarısı ve onaylı temizlik: yalnızca hiçbir geçmiş kaydından açılamayan içeriğin verisi siliniyor               | ✅                                                |
| **B7** Mevcut içerik varken AI içe aktarma onay istiyor ("özeti, 2 kartı, 2 sorusu"); "Vazgeç" veriyi koruyor                         | ✅                                                |
| **A1** Silme düğmeleri hover olmadan görünür, 44 px                                                                                   | ✅                                                |
| Sekmeler ←/→/End; "Quiz" → "Sorular"                                                                                                  | ✅                                                |
| Özet: drop cap, 16.5 px / 1.75                                                                                                        | ✅                                                |
| Sorular: tek soru, "Soru 1 / 2"; klavyeyle cevap, "Doğru cevap / Senin cevabın", odak "Sonraki soru"da; sayaçlar korunuyor            | ✅                                                |
| **B13** Kart Enter/Space ile çevriliyor, `aria-pressed` değişiyor, DOM sınıfı yok; "Öğrendim" `aria-pressed` ile kaydediliyor         | ✅                                                |
| **B21** `K` duraklatıyor, `Space` oynatıyor; odak düğmedeyken Space videoya dokunmuyor; not yazarken `k` durdurmuyor; `Alt+N` korundu | ✅                                                |
| **B17** "Kopyala" ayrı düğme; pano engelliyse AI isteği seçilebilir metin olarak gösteriliyor                                         | ✅                                                |
| **B9** İndirilen dosya adı ve başlığı etkin içerikten                                                                                 | ✅                                                |
| **K15** Yedek penceresi açılınca Ayarlar popover'ı kapanıyor                                                                          | ✅                                                |
| Odak modu: üst çubuk `mute` tonunda, kenarlar karartılmış, tıklamalar engellenmiyor, kapatınca normale dönüyor                        | ✅                                                |
| 375 px: dört sekmede ve Geçmiş penceresinde yatay taşma yok; sekmeler sığıyor; paneldeki tüm hedefler ≥ 44 px                         | ✅                                                |
| **P1** Not yazarken tuş başına render olan bileşen: 52/85 → **3/96**; sayaç tikinde 1                                                 | ✅                                                |
| **P3** Tembel yüklenen AI, Geçmiş, yedek, radyo ve PDF ilk açılışta çalışma ekranını gizlemiyor                                       | ✅                                                |
| axe: 13 ekran (landing, dört sekme, kart çalışma modu, Geçmiş, AI, onay, odak modu, gece, 375 px): kritik 0, ciddi 0, orta 0          | ✅                                                |
| Adım 9 testi toplam                                                                                                                   | **42/42**                                         |
| Duman · güvenlik · oynatıcı · depolama · pomodoro · PDF                                                                               | **46/46 · 20/20 · 19/19 · 20/20 · 16/16 · 20/20** |

Lint 0 hata, 0 uyarı; geçici lint istisnası kalmadı (`set-state-in-effect` yeniden `error`). DESIGN §11 taramaları temiz (istisnalar: `--filter-warm`, migrasyon metni, pdf.js vendor dosyaları).

**Çözülen bulgular:** A1, A2, B6, B7, B9, B13, B16 (onaylı temizlik), B17, B21, K15, P1, P3.

**Davranış değişiklikleri:**

- "Quiz" sekmesinin adı "Sorular". Sorular tek tek gösteriliyor; sekme ilk cevaplanmamış soruda açılıyor. Cevaplar ve sayaçlar aynı.
- Video kısayolu `Ctrl+Space` yerine `K` ya da `Space`.
- Not indirme artık panoya kopyalamıyor; bunun için ayrı "Kopyala" düğmesi var.
- Geçmişi temizleme, kayıt silme ve AI içeriğinin üzerine yazma artık onay istiyor.
- PDF değişince yakınlaştırma %100'e dönüyor (görüntüleyici belge başına yeniden kuruluyor).

**Adım 9 sırasında bulunan ek konular:**

- **K25:** `next/dynamic` kendi Suspense sınırını kurmuyor. İlk açılışta indirilen bir pencere en yakın sınırı (bütün çalışma ekranını) askıya alıyor, ekran bir an `display:none` oluyor, odak kayboluyordu. Her tembel bileşen kendi `<Suspense fallback={null}>` sınırına alındı; testte gözlemciyle doğrulanıyor.
- **K26:** Boşta önceden yükleme (`requestIdleCallback`) Lighthouse ölçüm penceresine denk gelip mobil performansı düşürüyordu. Çalışma ekranı paketi artık landing'de odak, imleç ya da dokunma olunca indiriliyor.
- **K27:** axe, kitap sırtlarındaki dikey ve döndürülmüş metni görünür saymadığı için `aria-label` ile ad uyuşmazlığı bildirdi. `aria-label` kaldırıldı; erişilebilir ad içerikten geliyor ("Video Başlık").
- **Bilinen gözlem:** Mobil LCP'nin büyük kısmı (≈1,1 sn simüle "render gecikmesi") landing koreografisinden geliyor: cümle `fade-up` ile görünür oluyor (DESIGN §7.1). Bunu değiştirmek tasarım kararı gerektirir; bu adımda değiştirilmedi.

## 8. Marka ve tasarım kararları (Revizyon 2)

Karar tarihi 2026-10-24. Bağlayıcı tasarım kuralları [docs/DESIGN.md](docs/DESIGN.md)'de, uygulama sırası [PLAN.md](PLAN.md)'de.

### 8.1 "BMO" geçen yerler

Ölçüm: `grep -rn "BMO\|bmo" src README.md package.json` (depolama anahtarları ayrı sayıldı).

| Konum                                                                   | İçerik                                            | Görünür mü            | Yapılacak                                                                          | Adım   |
| ----------------------------------------------------------------------- | ------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------- | ------ |
| `src/app/layout.tsx:16`                                                 | `metadata.title: 'BMO Learn'`                     | ✅ sekme başlığı      | "BeLearn" + açıklama                                                               | 3c     |
| `src/hooks/useAppInit.ts:17`                                            | `document.title = 'BMO Learn \| Sadece odaklan.'` | ✅                    | "BeLearn · Sadece odaklan." (metadata'ya taşınır)                                  | 3c/3d  |
| `src/components/landing/LandingPage.tsx:56`                             | `alt="BMO Learn Logo"` (`/logo.png`)              | ✅ ekran okuyucu      | Görsel kaldırılır, metin logo                                                      | 3e     |
| `src/components/landing/LandingPage.tsx:64`                             | `BMO <span>Learn</span>` başlık                   | ✅                    | "BeLearn" metin logo (sol üst)                                                     | 3e     |
| `src/components/layout/AppHeader.tsx:86` (+ `:77` `/logo.png`)          | `BMO Learn` başlık                                | ✅                    | Metin logo                                                                         | 3f     |
| `src/components/notes/NotesTab.tsx:35`                                  | Varsayılan dosya adı `'BMO_Learn'`                | ✅ indirilen dosya    | `'BeLearn'` (Adım 9'da `contentConfig.title`)                                      | 3d     |
| `src/components/notes/NotesTab.tsx:37`                                  | `BMO Learn - Çalışma Notları` dosya başlığı       | ✅ indirilen dosya    | `BeLearn — Çalışma Notları`                                                        | 3d     |
| `src/components/pwa/AppInstallModal.tsx:25`                             | `BMO Learn'ü cihazınıza…`                         | ✅                    | `BeLearn'ü…`                                                                       | 3d     |
| `src/components/pwa/PWAInjector.tsx:12-13`                              | manifest `name`/`short_name`                      | ✅ yüklü uygulama adı | "BeLearn" (+ `theme_color` token'dan); Adım 10'da `manifest.ts`                    | 3d, 10 |
| `src/components/pwa/PWAInjector.tsx:19-20`                              | manifest ikonları `/logo.png`                     | ✅                    | Adım 10 yer tutucu ikonlar                                                         | 10     |
| `src/lib/notifications.ts:17`                                           | bildirim `icon: '/logo.png'`                      | ✅                    | İkon geçici olarak kaldırılır, Adım 10'da yer tutucu                               | 3d, 10 |
| `README.md`                                                             | create-next-app metni + `# bmolearn`              | ✅                    | BeLearn README (taslak 3d, tam 10)                                                 | 3d, 10 |
| `package.json:2`                                                        | `"name": "bmo-learn"`                             | ❌                    | `belearn` (karar #7)                                                               | 3b     |
| `src/store/useStore.ts` (30 satır), `src/hooks/useAppInit.ts` (9 satır) | `'bmo_*'` localStorage anahtarları                | ❌                    | **Değişmez/silinmez.** Adım 4'te `belearn_*`'e kopyalanır; `bmo_*` yalnızca okunur | 4      |
| `public/logo.png`, `public/icon.png`                                    | BMO logosu                                        | ✅                    | Kullanım kaldırılır; dosyalar Adım 10'da yer tutucularla değişir                   | 3, 10  |
| Dal adı `refactor/bmo-optimizasyon`, klasör `bmolearn`                  | —                                                 | ❌                    | Değiştirilmiyor (geçmişi bozmamak için)                                            | —      |

Bildirim metinleri ("Odaklanma Bitti!" vb.) "BMO" içermiyor; ses tonu Adım 7'de DESIGN §9'a göre gözden geçirilir.

### 8.2 Kaldırılacak görsel kalıntılar

Ölçüm: `src/` üzerinde `grep -Eo` (Adım 2 sonrası, Prettier'lı kod).

| Kalıntı                                                                                         | Adet (dosya) | Ne olacak                                                       | Adım                                    |
| ----------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- | --------------------------------------- |
| `backdrop-blur*` (cam)                                                                          | 17 (13)      | Kaldırılır; yüzey `page`                                        | 3g (+ bileşenin yeniden yazıldığı adım) |
| Blob/ışık lekesi (`blur-[..px]`, `animate-blob`, `animate-subtle-glow`, `animation-delay-2000`) | 11 (2)       | Kaldırılır                                                      | 3e                                      |
| `#FF8C00`                                                                                       | 128 (22)     | → `ribbon` token'ı                                              | 3g                                      |
| `#ea580c` / `orange-*`                                                                          | 9 (7)        | → `ribbon` / kaldır                                             | 3g                                      |
| `rgba(255,140,0,…)` turuncu gölge/parıltı                                                       | 5 (4)        | Kaldırılır (mavi ışık filtresi `--filter-warm` istisnası)       | 3g                                      |
| `rounded-3xl`                                                                                   | 18 (14)      | → 2px                                                           | 3g                                      |
| `rounded-2xl` / `rounded-xl` / `rounded-[..px]`                                                 | 31 / 25 / 12 | → 2px                                                           | 3g                                      |
| `rounded-lg/md/sm/full`                                                                         | 53 (17)      | `full` yalnızca tam yuvarlak düğme/çip; diğerleri 2px           | 3g                                      |
| Gradient                                                                                        | 1 (1)        | Kaldırılır                                                      | 3e                                      |
| Mavi (`#3b82f6`, `blue-*`, `--info`): AI sihirbazı, mola modu, toast                            | 23 (6)       | → `ink` / `ok` / metin etiketi                                  | 3g, 7                                   |
| `shadow-*`                                                                                      | 93 (21)      | Yalnızca kitap/kart yüzeylerinde tek hafif gölge                | 3g, 6–9                                 |
| `var(--…)` arbitrary renk kullanımı                                                             | 411 (25)     | → Tailwind token sınıfları (`bg-page`, `text-ink`…)             | 3g                                      |
| Lucide ikon kullanımı                                                                           | 103 (20)     | Süs ikonları kaldırılır, işlevsel olanlar sade kalır            | 3e/3f, 6–9                              |
| `dark:` varyantı (`prefers-color-scheme` tabanlı)                                               | 3 (2)        | `data-theme` tabanlı `@custom-variant`                          | 3c                                      |
| Süs animasyonları (`float`, `subtle-glow`, `blob`, `eq-*`, `bounce`, `pulse`)                   | 18 (6)       | Kaldırılır (`taskComplete` işlevsel; Adım 7'de mantığa taşınır) | 3g, 7                                   |
| `ThemeStyles` (`<style>` enjeksiyonu, `.light-theme`)                                           | 1            | globals.css + `data-theme`                                      | 3c                                      |
| `SkeletonLoading` + yapay 500 ms                                                                | 1            | Kaldırılır; inline tema script'i + koreografi                   | 3c/3e                                   |

### 8.3 Kararlar ve uygulanacağı adım

| Karar                                                                                                                           | Adım |
| ------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Next 16.4.x yükseltmesi, tek başına ilk commit, yeşil olmadan devam yok (K3)                                                    | 3a   |
| `errors.txt` silinir (K2)                                                                                                       | 3b   |
| Tasarım sistemi: token'lar, `data-theme`, inline tema script'i, Literata + DM Mono, Geist'in kaldırılması (T1, T2, T5, T6, B20) | 3c   |
| Marka: "BeLearn", metin logo, `/logo.png` kullanılmaz (§8.1)                                                                    | 3d   |
| Landing yeniden tasarımı (DESIGN §8.1); placeholder "YouTube bağlantısı ya da PDF"                                              | 3e   |
| Üst çubuk (DESIGN §8.2)                                                                                                         | 3f   |
| Cam, turuncu, blob, gradient ve büyük yuvarlaklığın tamamen kaldırılması; B18, B19, T3, T4, T7                                  | 3g   |
| "Yedeği indir / yükle" (Adım 4'ün ilk commit'i; Ayarlar'da belirgin)                                                            | 4a   |
| `belearn_*` anahtarları; `bmo_*` → `belearn_*` kopyala-doğrula migrasyonu; `bmo_*` asla silinmez/yazılmaz                       | 4c   |
| Migrasyon testi: gerçek döküm `fixtures/local/` (gitignore) ya da üretilmiş eski format verisi                                  | 4    |
| AI JSON zod, react-markdown (yeni tipografiyle), CSP, yerel ses, MIME                                                           | 5    |
| Video "şekil", playlist, radyo yeni tasarımla                                                                                   | 6    |
| Pomodoro yeni tasarımla; eski UTC kayıtlar olduğu gibi kalır                                                                    | 7    |
| PDF: pdf.js, IndexedDB ("Bu cihazda sakla" varsayılan açık, ~50 MB, Safari kota mesajı); web adresi mantığı kaldırılır (B8)     | 8    |
| Çalışma ekranı tasarımı (Notlar, Özet drop cap, Kartlar, Sorular tek soru), Modal/ConfirmDialog, a11y, mobil, performans        | 9    |
| Odak modu: **yalnızca onayla**, isteğe bağlı                                                                                    | 9    |
| PWA (BeLearn manifest, yer tutucu ikonlar; kullanıcı bilgilendirilir), testler, README/CHANGELOG/SECURITY, DESIGN son hali      | 10   |

### 8.4 Tasarım kararlarından doğan teknik notlar

- **Kontrast:** Önerilen tüm metin çiftleri AA'yı geçiyor; gece temasında `ribbon` / `page` 4.55 ile sınırda. `rule` çizgisi zemine karşı 1.50 / 1.22 olduğu için yalnızca dekoratif kullanılabilir; input alt çizgisi gibi bileşen sınırlarında `mute` kullanılmalı (WCAG 1.4.11). Ayrıntı: DESIGN §3.1.
- **`taskComplete` işlevsel:** Tamamlanan görev bugün animasyon bitince (`onAnimationEnd`) siliniyor; animasyon kaldırılınca silme akışı açık mantığa taşınmalı (Adım 7).
- **Raf ve hidrasyon:** Geçmiş istemcide yüklendiği için raf ilk HTML'de yok. Sabit yükseklik ayrılmazsa yerleşim kayar (Adım 3e).
- **Tema anahtarı geçişi:** Inline tema script'i Adım 3'te `bmo_theme`, Adım 4'ten sonra önce `belearn_theme` sonra `bmo_theme` okur.
- **Origin sınırı:** `bmo_*` → `belearn_*` migrasyonu yalnızca **aynı adreste** veri bulur. **Karar #1:** eski adres bırakılıyor ve BeLearn sıfırdan yayınlanıyor; adresler arası taşıma yapılmayacak. Migrasyon yalnızca yerel/aynı adres verisi için basit bir güvenlik ağı olarak kalır (PLAN Adım 4).
- **Pomodoro kontrolü (karar #6):** Üst çubuktaki "Odaklan" pomodoroyu doğrudan başlatır; yanındaki ayar panelinde odak/mola süreleri ve hazır ayarlar bulunur (DESIGN §8.2.1). Widget ile aynı state kullanılır. Bugün süreler her yenilemede 25/5'e dönüyor; Adım 7'de kalıcı hale gelecek.

### 8.5 Yanıtlanan kararlar (2026-10-24)

1. Eski adres bırakılıyor, sıfırdan yayın → Adım 4 sadeleştirildi.
2. Üst çubuk: playlist koşullu, "Ayarlar" menüsü (mavi ışık, PWA, yedek), sayaçlar sekmelere → 3f, 4a, 9.
3. Landing: en fazla 12 sırt + "Tüm geçmiş"; temizleme yalnızca modalda ve onaylı → 3e, 9.
4. ilovepdf bağlantısı kalkar; yalnızca "Desteklenmeyen dosya" uyarısı → 3e, 8.
5. Modal/toast/popover: 150 ms solma → 3c (token), 6–9.
6. "Odaklan" + süre ayar paneli → 3f (arayüz), 7 (kalıcılık).
7. `package.json` adı `belearn` → 3b.
