@AGENTS.md

# BeLearn — Claude için proje notları

BeLearn (eski adı BMO Learn): tamamen tarayıcıda çalışan bir çalışma uygulaması. Kullanıcı YouTube bağlantısı (video/oynatma listesi) ya da PDF açar; "AI Sihirbazı" bir istem üretir, kullanıcı yapay zekânın JSON cevabını geri yapıştırır; özet, kartlar ve sorular oluşur. Sunucu, hesap ve API yok; veri localStorage (`belearn_*`) ve IndexedDB'de (PDF'ler).

## Çalışma biçimi (kullanıcının tercihi)

- **Türkçe** yaz. Kısa, net raporlar.
- Büyük işler **adım adım**: her adımın sonunda kısa rapor ver ve **dur**; sonraki adıma kullanıcı açıkça isteyince geç.
- Commit atılabilir; **push / PR yalnızca kullanıcı onayıyla**.
- Görünüm değişirken hiçbir işlev, kısayol, veri alanı ya da depolama davranışı kaybolmamalı.

## Değişmez kurallar

- **`bmo_*` localStorage anahtarları ASLA silinmez ve ASLA yazılmaz** (yalnızca bir kez `belearn_*`'a kopyalanır, `src/lib/migration.ts`).
- **[docs/DESIGN.md](docs/DESIGN.md) bağlayıcıdır.** Renkler yalnızca token'lardan (`bg-page`, `text-ink`, `text-ribbon`…); köşe yalnızca `rounded-sm` / `rounded-full`; gradient, cam efekti, mavi/turuncu, süs animasyonu yok. Yeni bir ihtiyaç kurala aykırıysa önce DESIGN güncellenir (onayla). §11'deki grep kontrolleri temiz kalmalı.
- Kullanıcı/AI içeriği asla HTML olarak render edilmez (`Markdown.tsx`, `dangerouslySetInnerHTML` yok). Güvenilmeyen girdi zod ile doğrulanır (`src/lib/zod.ts` üzerinden; `jitless` CSP için şart).
- CSP `next.config.ts`'te; yeni bir dış kaynak eklemek SECURITY.md'de gerekçelendirilir.
- ESLint'te geçici override yok; öyle kalmalı.

## Komutlar

```bash
npm run dev           # :3000 (service worker geliştirmede kaydolmaz)
npm run check         # typecheck + lint + birim testleri + build — her değişiklikte yeşil olmalı
npm test              # Vitest (tests/unit)
npx playwright test   # uçtan uca (üretim derlemesi alır, :3100); PW_CHANNEL=msedge ile Edge
npm run format        # Prettier (format:check de temiz olmalı)
```

Node.js 22.12+. `public/pdfjs/` ve `public/sw.js` derlemede üretilir (git'te yok).

## Yapı

- `src/app/page.tsx`: kök; yalnızca görünüm/pencere bayraklarına abone. Landing statik; çalışma ekranı (`components/layout/StudyScreen.tsx`), pencereler ve widget'lar `next/dynamic` ile **her biri kendi `<Suspense fallback={null}>` sınırında** yüklenir (yoksa ilk açılışta bütün ekran gizlenir).
- Store: zustand dilimleri (`src/store/slices`), kalıcılık `src/store/persistence.ts` (her alan kendi anahtarında). Bileşenlerde **seçici** kullan (`useStore((s) => s.x)` ya da `useShallow`); `useStore()` ile tüm store'a abone olma.
- Ortak `components/ui/Modal.tsx` (Escape, odak tuzağı, odak iadesi, arka plan `inert`, 150 ms solma) ve `ConfirmDialog.tsx`; yeni pencereler bunları kullanır. Kapanış solması için `hooks/usePresence.ts` (`usePresence`, `useRetained`, `useMountedOnce`).
- YouTube: `hooks/useYouTubePlayer.ts` (tek API yükleyici `lib/youtube.ts`), radyo `hooks/useRadio.ts`. PDF: pdf.js (`components/player/PdfViewer.tsx`, `key={url}` ile belge başına yeniden kurulur).
- PWA: `src/app/manifest.ts`, `scripts/sw.source.js` → `public/sw.js` (derlemede sürüm basılır), `components/pwa/PwaManager.tsx` (kayıt, kurulum istemi, "Yeni sürüm hazır · Yenile").
- Testler: `tests/unit` (Vitest, jsdom, TZ Europe/Istanbul), `tests/e2e` (Playwright; YouTube yerine `support/fake-youtube.ts`), `tests/fixtures` (sahte eski BMO verisi).

## Durum

10 adımlık refactor planı tamamlandı (2026-10-25), dal `refactor/bmo-optimizasyon` GitHub'a gönderildi (`main`'e birleştirme/PR kullanıcı onayıyla). 0.1.0 sonrası kullanıcı istekleri (marka rengi, sinema modu, görevlerin kaldırılması, AI JSON onarımı) CHANGELOG "Yayımlanmadı" bölümünde. Görevler emekli (`RETIRED_KEYS` in `lib/storageKeys.ts`): okunmaz/yazılmaz/yedeğe girmez. Ayrıntı: [PLAN.md](PLAN.md) (plan ve "Sonraki işler"), [ANALYSIS.md](ANALYSIS.md) §7 (her adımın doğrulama kaydı, bulgu kodları B*/A*/P*/K*), [CHANGELOG.md](CHANGELOG.md).

## Bu ortamda bilinen tuzaklar (Windows, Git Bash)

- Bash heredoc / `sed` / `node -e` ters eğik çizgiyi bozar: kaçış içeren düzenlemeleri **Edit/Write** ile yap ya da betiği Write ile yazıp çalıştır.
- Önceden `git rm` / `git mv` ile sahnelenen dosyalar sonraki commit'e sızar: commit öncesi `git diff --cached --name-status`.
- `next build`, çalışan `next start`'ın dosyalarını bozar (500, text/plain): derlemeden önce :3000/:3100'deki sunucuyu durdur (`netstat -ano` ile PID bul; süreçleri "dev" adına göre filtreleme, yol `c:\dev` içeriyor).
- Elle yazılan test betiklerinde başarısızlıkta string döndürmek PASS sayılabilir; açıkça `false` döndür.
- axe ve ekran görüntüleri için 150 ms solma ve giriş animasyonları bitene kadar bekle.
- Lighthouse headless Edge'de çalışmıyor (`NO_NAVSTART`); Chrome headless-shell kullan.
- Geçici worktree + `node_modules` junction ile Turbopack derlemesi çalışmıyor; ara commit'leri `tsc` + lint ile doğrula.
