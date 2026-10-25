# Sürüm notları

Biçim: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/). Kod adları (B4, P1 …) [ANALYSIS.md](ANALYSIS.md)'deki bulgulara karşılık gelir.

## [Yayımlanmadı]

### Değişti

- **Marka rengi:** logodaki "Be" ve landing'deki "odaklan." iki temada da `#8F2D2D` (`brand` token'ı). Gece temasında kontrast AA'nın altında; bilinçli karar.
- Landing kaynak girişinin yazısı "YouTube bağlantısı".
- **Sinema modu** (eski "Odak modu"): kenar karartması yerine yarı saydam siyah örtü; video önde, panel ve çubuklar üzerine gelince ya da odaktayken öne çıkar; `Esc` ile çıkılır.
- Üst çubuk sadeleşti: Geçmiş ve Sinema modu Ayarlar menüsüne taşındı.
- **AI Sihirbazı:** cevap tek bir ```json kod bloğunda isteniyor, net biçim kuralları ve adet sınırları var (12 kart, 10 soru, en fazla 600 kelimelik özet). Bozuk JSON `jsonrepair` ile onarılıyor (satır sonu, kaçışsız tırnak, sondaki virgül, yorum, akıllı tırnak, yarıda kesilme); sarılmış yanıtlar, Türkçe/eş anahtarlar ve "A) …" şıkları kabul ediliyor. PDF'lerde "PDF'ini de ekle" tavsiyesi.

### Kaldırıldı

- **Görevler** ve 30 günlük pomodoro haritası. Görevler artık yedeğe girmiyor; eski yedeklerdeki görevler yok sayılıyor. Pomodoro geçmişi korunuyor.

## [0.1.0] — 2026-10-25

BMO Learn'ün yeniden yapılandırılmış ilk sürümü: **BeLearn**. 10 adımlık refactor planının sonucu ([PLAN.md](PLAN.md)).

### Marka ve tasarım

- Ad **BeLearn**; metin logosu ("Be" + italik "Learn"), yer tutucu simgeler.
- Yeni tasarım sistemi ([docs/DESIGN.md](docs/DESIGN.md)): kâğıt/mürekkep renkleri ve tek vurgu rengi, Literata + DM Mono, 2 px köşe; cam efekti, gradient ve süs animasyonları kaldırıldı. Gece/Gündüz teması ilk boyamadan önce uygulanır (yanıp sönme yok).
- Sade landing: büyük başlık, tek kaynak girişi, son çalışmalar kitaplık rafı (en fazla 12).
- Çalışma ekranı: ince üst çubuk, şekil gibi video, "açık kitap sayfası" panel; notlarda zaman damgası sütunu, özette büyük ilk harf, kartlar defter kâğıdında, sorular tek tek.
- **Odak modu:** üst çubuk sönük tona geçer, ekran kenarları kararır.

### Yeni

- **PDF görüntüleyici (pdf.js):** seçilebilir metin, yakınlaştırma, sayfa göstergesi, seçili metni nota ekleme (sayfa numarasıyla). PDF'ler istenirse bu cihazda (IndexedDB, dosya başına 50 MB) saklanır; geçmişten dosya seçmeden açılır.
- **Yedeği indir / yükle:** başka tarayıcıya ya da cihaza taşıma; "boş alanlara ekle" ya da "yerine koy" (önce mevcut verinin yedeği indirilir).
- **Pomodoro:** üst çubukta "Odaklan" ve süre paneli (odak 1–120, mola 1–30 dk, hazır ayarlar); süreler kalıcı.
- **Onaylar:** geçmişi temizleme, kayıt silme ve AI içeriğinin üzerine yazma onay ister; ne silineceğini sayılarıyla söyler.
- **Sahipsiz veri temizliği:** hiçbir geçmiş kaydından açılamayan içeriğin verisi Geçmiş penceresinden onayla silinebilir.
- **PWA:** gerçek manifest ve service worker; Chrome/Edge'de "Yükle", uygulama kabuğu çevrimdışı açılır, yeni sürümde "Yenile" bildirimi.
- Notları panoya kopyalama (ayrı düğme, pano kapalıysa yedek yöntem).

### Değişen davranışlar

- "Quiz" sekmesinin adı **Sorular**; sorular tek tek gösterilir, sekme ilk cevaplanmamış soruda açılır. Cevaplar ve sayaçlar korunur.
- Video kısayolu `Ctrl+Space` yerine **`K` ya da `Space`** (yazı alanında ve bir düğme odaktayken çalışmaz). `Alt+N` aynı.
- Not indirme artık panoya kopyalamıyor ("Kopyala" ayrı).
- Web adresleri açılmaz; yalnızca YouTube bağlantısı ya da PDF (B8). PDF olmayan dosyada yalnızca "Desteklenmeyen dosya" uyarısı; ilovepdf bağlantısı kaldırıldı.
- Bildirim izni açılışta değil, ilk "Odaklan" tıklamasında istenir (B5).
- Duraklatılmış zamanlayıcının düğmesi "Devam et".
- Geçmiş sınırı 30'dan 200 kayda çıktı; listeden düşen içeriğin verisi silinmez (B16).
- PDF değişince yakınlaştırma %100'e döner.

### Düzeltilen hatalar

- Landing ile çalışma ekranı arasında gidip gelince yanlış ya da donmuş video (B1); YouTube API'sinin birden çok yüklenmesi (B2); PDF'e geçince videonun arkada çalmaya devam etmesi (B3).
- Arka plan sekmesinde ve gece yarısından sonra pomodoro sayacının ve günlük kaydının kayması (B4: süre bitiş anına göre, gün yerel saate göre).
- Üst üste gelen bildirimlerde sekme başlığının "🔔" olarak kalması (B5).
- Geçmişi temizleyince video ilerlemesinin kalması (B6).
- Not dosyasının başlığının etkin içerik yerine geçmişten alınması (B9); PDF blob adreslerinin serbest bırakılmaması (B10).
- Depolama dolduğunda sessizce veri kaybı (B11: kullanıcı uyarılır, bellekteki veri korunur).
- Kart çevirmenin DOM'a doğrudan müdahaleyle yapılması (B13); çalışma ekranından yüklenen PDF'in geçmişe eklenmemesi (B14); geçmiş kayıtlarının yerinde değiştirilmesi (B15).
- Radyo: hazır olmadan istasyon değişince yanlış istasyonun çalması; varsayılan iki yayının gömme hatası (değiştirildi, Karadeniz Akustik eklendi).
- Markdown'da "Soru # 3"ün başlık, "2 * 3"ün italik olması, numaralı liste ve bağlantının desteklenmemesi (B12, react-markdown).
- Telefondan `http://` ile açınca AI isteği kopyalamanın hata vermesi (B17).
- Oynatma listesi kenar çubuğunun masaüstünde 400 px'e sıkışması (B18); görünmeyen ayırıcılar (B19); açılıştaki 500 ms yapay bekleme ve renksiz iskelet (B20).
- Ayarlar menüsünün yedek penceresinin arkasında açık kalması (K15); bir pencere ilk açılırken çalışma ekranının bir an kaybolması.

### Erişilebilirlik ve performans

- Ortak modal: `role="dialog"`, Escape, odak tuzağı, odak iadesi, arka plan `inert` (A2). Silme düğmeleri dokunmatikte görünür (A1); dokunma hedefleri ≥ 44 px; 375 px'te yatay kaydırma yok.
- axe: 13 ekranda kritik ve ciddi ihlal yok. Lighthouse (mobil landing): erişilebilirlik ve en iyi uygulamalar 100.
- Not yazarken her tuşta yeniden çizilen bileşen 52'den 3'e indi (P1); zamanlayıcı her saniye yalnızca sayacı çizer. Landing JS'i ~1,1 MB'tan ~0,9 MB'a indi; çalışma ekranı, pencereler, markdown ve pdf.js ayrı paketlerde (P3).

### Güvenlik

- Next.js güvenlik güncellemesi; CSP ve güvenlik başlıkları ([SECURITY.md](SECURITY.md)).
- AI yanıtı, depolama verisi ve yedek dosyası şemayla doğrulanır; markdown'da ham HTML düz metin, bağlantılar yalnızca `https:`.
- PDF'ler imza denetiminden geçer ve tarayıcının görüntüleyicisinde değil pdf.js ile çizilir.

### Veri

- localStorage anahtarları `belearn_*`. Eski `bmo_*` verisi ilk açılışta bir kez kopyalanır ve doğrulanır; eski anahtarlar **silinmez ve yazılmaz**.
- Bozuk ya da elle değiştirilmiş veri uygulamayı kilitlemez; geçerli kayıtlar korunur, ham hali `belearn_backup_*` olarak saklanır.
- Kayıt kimlikleri UUID; eski sayı kimlikleri olduğu gibi korunur.

### Geliştirici

- Next.js 16, React 19, Tailwind CSS 4, zustand 5 (dilimler, seçiciler), zod 4, TypeScript katı kipte.
- Testler: Vitest (49 birim testi) ve Playwright (17 uçtan uca test; sahte YouTube API ile ağdan bağımsız).
- ESLint + Prettier; geçici lint istisnası yok. `npm audit`: bilinen açık yok.
- Node.js 22.12+.

### Bilinen sınırlar

- Arka plan sekmesinde faz bitiş bildirimi tarayıcının zamanlayıcı kısıtlaması nedeniyle gecikebilir.
- iOS Safari ve Android Chrome'da gerçek cihaz testi yapılmadı (öykünmeyle doğrulandı).
- Mobil LCP'nin çoğu landing'deki açılış animasyonundan geliyor (tasarım kararı).
- Simgeler yer tutucudur.
