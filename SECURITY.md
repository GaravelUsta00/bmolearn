# Güvenlik

BeLearn tamamen tarayıcıda çalışır: hesap, sunucu tarafı veri ya da API yoktur. Notlar, kartlar, sorular, özetler ve ilerleme kullanıcının cihazında (`localStorage`), istenirse PDF'ler IndexedDB'de durur. Uygulama dışarıya yalnızca YouTube'a (oynatıcı ve küçük resimler) bağlanır.

## Güvenilmeyen girdiler ve önlemler

| Girdi                         | Risk                                                             | Önlem                                                                                                                                                                                                                                                       | Kod                                                           |
| ----------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| AI yanıtı (yapıştırılan JSON) | XSS, uygulamayı çökerten biçim, depolama kotasını dolduran boyut | zod tabanlı ayrıştırma; yalnızca metin/sayı kabul edilir; `correct` normalize edilir (`b`, `Cevap: B`, şık metni); dizi şıklar A–D'ye eşlenir; adet (100 kart, 100 soru) ve uzunluk sınırı; geçersiz öğeler atlanır ve raporlanır                           | `src/lib/aiImport.ts`                                         |
| Özet ve not metni (markdown)  | XSS (`<img onerror>`, `<script>`, `javascript:` bağlantı)        | `react-markdown`: ham HTML **düz metin** olarak gösterilir (`rehype-raw` yok); izinli eleman listesi; görsel yok; bağlantılar yalnızca `https:` ve `rel="noopener noreferrer nofollow"`. Uygulamada kullanıcı/AI içeriği için `dangerouslySetInnerHTML` yok | `src/components/ui/Markdown.tsx`                              |
| Bağlantı girişi               | `javascript:` / `data:` adresi                                   | Yalnızca YouTube video/oynatma listesi kimliği kabul edilir (`[A-Za-z0-9_-]`); başka her adres reddedilir ve hiçbir `src`/`href`'e yazılmaz (B8, Adım 8)                                                                                                    | `src/lib/youtube.ts`, `src/lib/safeInput.ts`                  |
| Yüklenen dosya                | PDF diye yeniden adlandırılmış HTML vb.                          | Uzantı/MIME + ilk 1 KB'ta `%PDF-` imzası; tutmazsa açılmaz. PDF'ler tarayıcının görüntüleyicisinde (iframe) değil, pdf.js ile canvas'a çizilir; belge içindeki betikler ve formlar çalıştırılmaz (`enableXfa: false`)                                       | `src/lib/safeInput.ts`, `src/components/player/PdfViewer.tsx` |
| Cihazda saklanan PDF'ler      | Paylaşılan bilgisayarda başkalarının erişimi                     | IndexedDB'de yalnızca bu tarayıcı profilinde durur; Ayarlar'dan kapatılabilir ve toplu silinebilir; geçmişten silinen PDF cihazdan da silinir                                                                                                               | `src/lib/idb.ts`                                              |
| localStorage içeriği          | Bozuk ya da elle değiştirilmiş veri                              | zod ile okuma; geçersiz kayıtlar atlanır, ham hali `belearn_backup_*` olarak saklanır; uygulama kilitlenmez                                                                                                                                                 | `src/lib/schemas.ts`, `src/store/persistence.ts`              |
| Yedek dosyası                 | Bozuk/yabancı JSON                                               | Biçim kontrolü, önizleme ve onay; yazma hatasında geri alma                                                                                                                                                                                                 | `src/lib/backup.ts`                                           |

## HTTP güvenlik başlıkları

`next.config.ts` içinde tanımlıdır (Vercel ya da `next start` ile geçerlidir; statik dışa aktarmada sunucu/CDN üzerinden ayrıca verilmelidir).

| Başlık                       | Değer / amaç                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `Content-Security-Policy`    | Aşağıda                                                                              |
| `X-Content-Type-Options`     | `nosniff`                                                                            |
| `X-Frame-Options`            | `DENY` (+ CSP `frame-ancestors 'none'`): sayfa başka sitelerde çerçevelenemez        |
| `Referrer-Policy`            | `strict-origin-when-cross-origin` (YouTube gömmeleri origin bilgisine ihtiyaç duyar) |
| `Permissions-Policy`         | kamera, mikrofon, konum, ödeme, USB, browsing-topics kapalı                          |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups`                                                           |
| `Strict-Transport-Security`  | `max-age=31536000` (yalnızca HTTPS'te; alt alan adlarını kapsamaz)                   |
| `X-Powered-By`               | Gönderilmez                                                                          |

### Content-Security-Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.youtube.com https://s.ytimg.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com;
font-src 'self';
connect-src 'self' blob:;
media-src 'self';
frame-src https://www.youtube.com https://www.youtube-nocookie.com;
worker-src 'self' blob:;
manifest-src 'self';
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

Geliştirme modunda ek olarak `'unsafe-eval'` (React Refresh) ve `ws:`/`wss:` (HMR) eklenir.

**`'wasm-unsafe-eval'`:** yalnızca WebAssembly modüllerinin derlenmesine izin verir; JavaScript `eval`/`new Function` hâlâ yasaktır. pdf.js görüntü çözücüleri (JPEG 2000 vb.) için gerekir. `connect-src blob:`: pdf.js açılan PDF'i blob URL'sinden `fetch` ile okur. pdf.js worker'ı ve wasm dosyaları aynı kaynaktan (`/pdfjs/`) verilir.

**Bilinen ödünleşim: `script-src 'unsafe-inline'`.** Next.js, statik prerender edilen sayfaya satır içi script'ler ekler. Nonce kullanmak her istekte sunucu tarafı render (Proxy) gerektirir. Uygulama tamamen statik olduğu için bu yol seçilmedi. XSS'e karşı asıl savunma, hiçbir kullanıcı/AI içeriğinin HTML olarak render edilmemesidir (yukarıdaki tablo). İleride gerekirse seçenekler:

- Proxy + nonce + `'strict-dynamic'` (sayfa dinamik render olur),
- Next'in deneysel SRI/hash desteği.

**Doğrulama:** Önce `CSP_REPORT_ONLY=1 npm run build` ile Report-Only kipinde tüm akışlar (video, radyo, küçük resimler, PDF, ses, AI içe aktarma) çalıştırılıp ihlaller toplandı. Tek ihlal zod 4'ün `new Function` yoklamasıydı; `jitless` ile giderildi (`src/lib/zod.ts`). Ardından politika zorunlu kipe alındı.

## Service worker (Adım 10)

Kaynak `scripts/sw.source.js`; derlemede sürüm basılarak `public/sw.js`'e yazılır. Yalnızca üretim derlemesinde ve güvenli bağlamda (HTTPS, localhost) kaydolur.

| Konu                | Davranış                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neyi önbelleğe alır | Yalnızca **aynı kaynaktan** gelen dosyalar: uygulama kabuğu (`/`), `/_next/static/*` (içerik özetli adlar), simgeler, bildirim sesi, manifest, pdf.js dosyaları                                 |
| Neye dokunmaz       | YouTube oynatıcısı ve küçük resimler (başka kaynak), `blob:`/`data:`, sorgu dizgili dosya istekleri (ör. `?_rsc=`), POST, kısmi (range) istekler, `/sw.js`                                      |
| Kullanıcı verisi    | localStorage ve IndexedDB service worker'dan geçmez; önbellekte not, kart, PDF ya da yedek bulunmaz                                                                                             |
| Güncelleme          | Yeni sürüm indirilir ama **kendiliğinden devreye girmez**; sayfa "Yeni sürüm hazır · Yenile" der. Yenilenince eski sürümün önbellekleri silinir. `/sw.js` `Cache-Control: no-cache` ile sunulur |
| Kapsam              | `/` (aynı kaynak). CSP `worker-src 'self' blob:` (blob: pdf.js için)                                                                                                                            |
| Bildirim            | Pomodoro bildirimi `registration.showNotification` ile; tıklanınca açık BeLearn sekmesine döner. Push yok, sunucu yok                                                                           |

**Bilinen sınır:** Arka plan sekmesinde tarayıcı zamanlayıcıları kısabilir; faz bitiş bildirimi gecikebilir. Service worker, push sunucusu olmadan bildirimi zamanlayamaz (Notification Triggers standartlaşmadı); bu yüzden bu sınır kaldırılmadı.

## Bağımlılıklar

`npm audit` (2026-10-25): üretim bağımlılıklarında ve tüm bağımlılıklarda bilinen açık yok. Sürümler `package-lock.json` ile sabit; `next`, `react`, `pdfjs-dist`, `zod`, `react-markdown` ve `jsonrepair` tam sürümle belirtilir.

`jsonrepair` (3.15.0, ISC, bağımlılıksız; 2026-10-25'te eklendi): AI yanıtındaki bozuk JSON'u ayrıştırmadan önce onarır. Yalnızca metin dönüştürür (`eval`/`Function` yok, CSP'yi etkilemez); çıktısı yine `JSON.parse` ve zod şemasından geçer.

## Testler

Güvenlik davranışları otomatik testlerle korunur: markdown'da HTML/`javascript:` bağlantı/görsel (`tests/unit/markdown.test.tsx`), AI yanıtı şeması ve sınırlar (`aiImport.test.ts`), bozuk depolama verisi ve migrasyon geri alma (`storage.test.ts`), yedek geri alma ve `bmo_*`'a yazmama (`backup.test.ts`), PDF imzası (`lib.test.ts`), sahte PDF'in reddi (`tests/e2e/data.spec.ts`).

## Gizlilik

- Bildirim sesi yerel bir dosyadır (`public/sounds/bildirim.wav`, uygulama içinde üretildi); üçüncü tarafa istek yapılmaz.
- Fontlar `next/font` ile kendi sunucumuzdan verilir.
- YouTube oynatıcısı kendi çerezlerini ve isteklerini kullanır (youtube.com gizlilik politikası). `www.youtube-nocookie.com`'a geçiş ileride değerlendirilebilir.

## Güvenlik açığı bildirimi

Bir açık bulursan lütfen herkese açık bir issue açmadan önce depo sahibine özel olarak bildir.
