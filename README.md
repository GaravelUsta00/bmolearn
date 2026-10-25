# BeLearn

**Sadece odaklan.** Bir YouTube videosu, oynatma listesi ya da PDF aç. Notların, özetin, kartların ve soruların yanında beklesin.

BeLearn tamamen tarayıcıda çalışır. Hesap ve sunucu yoktur; notların ve ilerlemen yalnızca kullandığın cihazda (localStorage, PDF'ler için IndexedDB) saklanır. Uygulama dışarıya yalnızca YouTube'a (oynatıcı ve küçük resimler) bağlanır.

## Özellikler

- YouTube videosu ve oynatma listesi; kaldığın saniyeden devam
- PDF görüntüleme (pdf.js): seçilebilir metin, yakınlaştırma, seçili metni nota ekleme; PDF'ler istenirse bu cihazda saklanır
- Zaman damgalı notlar (`Alt+N`); panoya kopyalama ya da `.txt` olarak indirme
- **AI Sihirbazı:** içeriğe uygun bir istem (prompt) üretir. İstemi kendi kullandığın yapay zekâya yapıştırırsın, dönen cevabı tek seferde geri yapıştırırsın; özet, bilgi kartları ve çoktan seçmeli sorular oluşur. Bozuk JSON (satır sonu, tırnak, virgül hataları, yarıda kesilme) otomatik onarılır
- Pomodoro zamanlayıcısı (ayarlanabilir süreler)
- Odak radyosu, mavi ışık filtresi, tam ekran, sinema modu, Gece/Gündüz teması
- Yedeği indir / yükle (başka tarayıcıya ya da cihaza taşımak için)
- Ana ekrana eklenebilir (PWA); uygulama kabuğu çevrimdışı da açılır

### Klavye

| Kısayol              | İşlev                                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| `Alt+N`              | Not alanına geç                                                           |
| `K` ya da `Space`    | Videoyu oynat / duraklat (yazı alanında ve bir düğme odaktayken çalışmaz) |
| `←` `→` `Home` `End` | Panel sekmeleri arasında gezin                                            |
| `Enter` / `Space`    | Kartı çevir                                                               |
| `Esc`                | Pencereyi ya da menüyü kapat; sinema modundan çık                         |

## Geliştirme

Gereksinimler: Node.js 22.12+ (24 ile test edildi), npm.

```bash
npm install              # pdf.js dosyalarını public/pdfjs/'e de kopyalar
npm run dev              # http://localhost:3000 (service worker geliştirmede kaydolmaz)
npm run check            # typecheck + lint + birim testleri + build
npm test                 # Vitest birim testleri
npm run test:e2e         # Playwright (üretim derlemesi alıp :3100'de sunar)
npm run format           # Prettier
```

Uçtan uca testler için bir kez tarayıcı kurun: `npx playwright install chromium`. Kurulu Edge ya da Chrome ile: `PW_CHANNEL=msedge npm run test:e2e`. Ayrıntı: [tests/e2e/README.md](tests/e2e/README.md).

Yığın: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, zustand 5, zod 4, react-markdown, pdf.js.

### Klasörler

```
src/app/           sayfa, düzen, manifest, global stiller (tasarım token'ları)
src/components/    arayüz (layout, notes, summary, flashcards, quiz, history, ai, player, pomodoro, ui …)
src/hooks/         oynatıcı, radyo, kısayollar, pomodoro motoru …
src/store/         zustand dilimleri ve localStorage kalıcılığı
src/lib/           ayrıştırma, şemalar, migrasyon, yedek, pdf, IndexedDB
scripts/           pdf.js kopyalama, service worker derleme (sw.source.js → public/sw.js)
tests/unit/        Vitest
tests/e2e/         Playwright
tests/fixtures/    sahte (gerçek olmayan) eski BMO verisi
```

## Yayınlama

Netlify'da yayınlanır (`netlify.toml`: Node 22, `npm run build`; Next.js çalışma zamanı otomatik algılanır). Vercel ya da `npm run build && npm start` ile de çalışır. Güvenlik başlıkları (CSP vb.) `next.config.ts` içinde tanımlıdır ve bu yollarla uygulanır; yayından sonra `curl -I` ile doğrulanmalı. Saf statik bir barındırıcıya taşınırsa aynı başlıkların sunucuda verilmesi gerekir ([SECURITY.md](SECURITY.md)).

- `public/pdfjs/` ve `public/sw.js` derlemede üretilir, depoda yoktur.
- Her derleme yeni bir service worker sürümü üretir. Açık sekmeler "BeLearn'ün yeni sürümü hazır · Yenile" bildirimini görür; yeni sürüm kullanıcı onayıyla devreye girer.
- Kullanıcı verisi tarayıcıdadır. Adres (alan adı) değişirse eski adresteki veri yeni adreste görünmez; kullanıcı Ayarlar → "Yedeği indir / yükle" ile taşıyabilir.
- Uygulama simgesi "BL" monogramıdır (`public/icons/`, `src/app/favicon.ico`, `src/app/apple-icon.png`).

## Veri

localStorage anahtarları `belearn_*` önekiyle tutulur. Eski sürümün (BMO Learn) `bmo_*` anahtarları ilk açılışta bir kez `belearn_*`'a kopyalanır; eski anahtarlar **silinmez ve yazılmaz**. Bozuk ya da elle değiştirilmiş veri uygulamayı kilitlemez: geçerli kayıtlar korunur, ham hali `belearn_backup_*` olarak saklanır. Ayrıntı: [ANALYSIS.md](ANALYSIS.md) §1, §7.

## Belgeler

- [docs/DESIGN.md](docs/DESIGN.md): tasarım sistemi (bağlayıcı)
- [SECURITY.md](SECURITY.md): güvenilmeyen girdiler, CSP, service worker, gizlilik
- [CHANGELOG.md](CHANGELOG.md): sürüm notları
- [PLAN.md](PLAN.md): 10 adımlık refactor planı
- [ANALYSIS.md](ANALYSIS.md): kod analizi, bulgular ve her adımın doğrulama kaydı

Developed by EHC.
