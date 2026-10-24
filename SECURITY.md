# Güvenlik

> Taslak (Adım 5). Son hali refactor planının 10. adımında yazılacak.

BeLearn tamamen tarayıcıda çalışır: hesap, sunucu tarafı veri ya da API yoktur. Notlar, kartlar, sorular, özetler ve ilerleme kullanıcının cihazında (`localStorage`) durur. Uygulama dışarıya yalnızca YouTube'a (oynatıcı ve küçük resimler) bağlanır.

## Güvenilmeyen girdiler ve önlemler

| Girdi | Risk | Önlem | Kod |
|---|---|---|---|
| AI yanıtı (yapıştırılan JSON) | XSS, uygulamayı çökerten biçim, depolama kotasını dolduran boyut | zod tabanlı ayrıştırma; yalnızca metin/sayı kabul edilir; `correct` normalize edilir (`b`, `Cevap: B`, şık metni); dizi şıklar A–D'ye eşlenir; adet (100 kart, 100 soru) ve uzunluk sınırı; geçersiz öğeler atlanır ve raporlanır | `src/lib/aiImport.ts` |
| Özet ve not metni (markdown) | XSS (`<img onerror>`, `<script>`, `javascript:` bağlantı) | `react-markdown`: ham HTML **düz metin** olarak gösterilir (`rehype-raw` yok); izinli eleman listesi; görsel yok; bağlantılar yalnızca `https:` ve `rel="noopener noreferrer nofollow"`. Uygulamada kullanıcı/AI içeriği için `dangerouslySetInnerHTML` yok | `src/components/ui/Markdown.tsx` |
| Bağlantı girişi | `javascript:` / `data:` adresi | YouTube kimlikleri yalnızca `[A-Za-z0-9_-]`; diğer adresler yalnızca geçerli `https:` ise saklanır ve hiçbir `src`/`href`'e yazılmaz | `src/lib/youtube.ts`, `src/lib/safeInput.ts` |
| Yüklenen dosya | PDF diye yeniden adlandırılmış HTML vb. | Uzantı/MIME + ilk 1 KB'ta `%PDF-` imzası; tutmazsa görüntülenmez | `src/lib/safeInput.ts` |
| localStorage içeriği | Bozuk ya da elle değiştirilmiş veri | zod ile okuma; geçersiz kayıtlar atlanır, ham hali `belearn_backup_*` olarak saklanır; uygulama kilitlenmez | `src/lib/schemas.ts`, `src/store/persistence.ts` |
| Yedek dosyası | Bozuk/yabancı JSON | Biçim kontrolü, önizleme ve onay; yazma hatasında geri alma | `src/lib/backup.ts` |

## HTTP güvenlik başlıkları

`next.config.ts` içinde tanımlıdır (Vercel ya da `next start` ile geçerlidir; statik dışa aktarmada sunucu/CDN üzerinden ayrıca verilmelidir).

| Başlık | Değer / amaç |
|---|---|
| `Content-Security-Policy` | Aşağıda |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (+ CSP `frame-ancestors 'none'`): sayfa başka sitelerde çerçevelenemez |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (YouTube gömmeleri origin bilgisine ihtiyaç duyar) |
| `Permissions-Policy` | kamera, mikrofon, konum, ödeme, USB, browsing-topics kapalı |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Strict-Transport-Security` | `max-age=31536000` (yalnızca HTTPS'te; alt alan adlarını kapsamaz) |
| `X-Powered-By` | Gönderilmez |

### Content-Security-Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com;
font-src 'self';
connect-src 'self';
media-src 'self';
frame-src https://www.youtube.com https://www.youtube-nocookie.com blob:;
worker-src 'self' blob:;
manifest-src 'self' blob:;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

Geliştirme modunda ek olarak `'unsafe-eval'` (React Refresh) ve `ws:`/`wss:` (HMR) eklenir.

**Bilinen ödünleşim: `script-src 'unsafe-inline'`.** Next.js, statik prerender edilen sayfaya satır içi script'ler ekler. Nonce kullanmak her istekte sunucu tarafı render (Proxy) gerektirir. Uygulama tamamen statik olduğu için bu yol seçilmedi. XSS'e karşı asıl savunma, hiçbir kullanıcı/AI içeriğinin HTML olarak render edilmemesidir (yukarıdaki tablo). İleride gerekirse seçenekler:
- Proxy + nonce + `'strict-dynamic'` (sayfa dinamik render olur),
- Next'in deneysel SRI/hash desteği.

**Doğrulama:** Önce `CSP_REPORT_ONLY=1 npm run build` ile Report-Only kipinde tüm akışlar (video, radyo, küçük resimler, PDF, ses, AI içe aktarma) çalıştırılıp ihlaller toplandı. Tek ihlal zod 4'ün `new Function` yoklamasıydı; `jitless` ile giderildi (`src/lib/zod.ts`). Ardından politika zorunlu kipe alındı.

## Gizlilik

- Bildirim sesi yerel bir dosyadır (`public/sounds/bildirim.wav`, uygulama içinde üretildi); üçüncü tarafa istek yapılmaz.
- Fontlar `next/font` ile kendi sunucumuzdan verilir.
- YouTube oynatıcısı kendi çerezlerini ve isteklerini kullanır (youtube.com gizlilik politikası). `www.youtube-nocookie.com`'a geçiş ileride değerlendirilebilir.

## Güvenlik açığı bildirimi

Bir açık bulursan lütfen herkese açık bir issue açmadan önce depo sahibine özel olarak bildir.
