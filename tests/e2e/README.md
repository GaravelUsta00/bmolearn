# Uçtan uca testler (Playwright)

```bash
npx playwright install chromium     # bir kez
npm run test:e2e                     # üretim derlemesi alır, :3100'de sunar, testleri koşar
PW_CHANNEL=msedge npm run test:e2e   # kurulu Edge ile (chrome da olur)
npx playwright test study.spec.ts    # tek dosya
```

Testler üretim derlemesine karşı koşar; service worker yalnızca üretimde kaydolduğu için PWA testi bunu gerektirir. Yerelde `:3100`'de çalışan bir sunucu varsa yeniden kullanılır (CI'da her seferinde derlenir).

| Dosya            | Kapsam                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `study.spec.ts`  | video, not (Alt+N, kopyala, indir), AI Sihirbazı ve üzerine yazma onayı, kartlar, sorular, K/Space kısayolu, odak modu, tema |
| `data.spec.ts`   | `bmo_*` → `belearn_*` migrasyonu, geçmiş silme ve temizleme onayları, yedek indir/yükle, PDF ve sahte PDF                    |
| `a11y.spec.ts`   | axe (iki tema, dört sekme, Geçmiş), modal odak tuzağı ve iadesi, yalnızca klavyeyle soru cevaplama                           |
| `pwa.spec.ts`    | manifest, service worker, çevrimdışı açılış ve not alma                                                                      |
| `mobile.spec.ts` | Pixel 7: yatay taşma, ≥ 44 px hedefler, mobil menü                                                                           |

## Sahte YouTube

Testler YouTube'a bağlanmaz. `support/fake-youtube.ts`, `https://www.youtube.com/iframe_api` isteğine uygulamanın kullandığı oynatıcı yöntemlerini taklit eden bir betik döndürür; küçük resimler 1×1 görselle değiştirilir. Bu sayede testler ağdan bağımsız ve tekrarlanabilir.

## Gerçek YouTube

Sahte API, YouTube'un kendi davranışını (gömme yasağı, reklam, oynatma listesi verisi, yayın akışları) doğrulamaz. Bir sürümden önce elle denenmeli:

- Bir video ve bir oynatma listesi açılıyor, bölüm geçişi çalışıyor, kaldığı saniyeden devam ediyor.
- Gömülmesi yasak bir video anlaşılır hata veriyor ("Video oynatılamıyor").
- Radyo istasyonları çalıyor; istasyon değişince "Çalıyor" yazıyor.
- YouTube engellendiğinde (reklam engelleyici) "YouTube yüklenemedi · Yeniden dene" görünüyor.
