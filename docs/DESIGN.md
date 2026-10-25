# BeLearn — Tasarım Sistemi

> **Bağlayıcıdır.** Adım 3'ten itibaren yazılan ya da değiştirilen her bileşen bu dokümana uyar. Bir kurala aykırı bir ihtiyaç doğarsa önce bu doküman güncellenir (onaylı), sonra kod yazılır.
> Karar tarihi: 2026-10-24 · Uygulama: Adım 3 (altyapı, Landing, üst çubuk), Adım 6–9 (bileşenler), Adım 10 (PWA bildirimleri) · **Durum: refactor sonu (0.1.0) itibarıyla tüm bileşenler bu dokümana uygun.**

## 1. Yön

Kitap/masa hissi: sakin, odaklı, sade. Kâğıt zemin, mürekkep metin, tek vurgu rengi olarak koyu bordo bir "kitap ayracı" (ribbon). Arayüz geri çekilir; içerik (video, PDF, notlar) öne çıkar.

## 2. Yasaklar

Aşağıdakiler hiçbir bileşende kullanılmaz. Her adımın sonunda §11'deki kontrol komutlarıyla doğrulanır.

| Yasak                                       | Örnek                                                                |
| ------------------------------------------- | -------------------------------------------------------------------- |
| Lacivert/koyu mavi tonlar, mavi-siyah zemin | `#1C2130`, `#26405F`, `#09090b` + mavi gölgeler, `blue-*`, `#3b82f6` |
| Cam efekti                                  | `backdrop-blur-*`, yarı saydam kart zeminleri (`rgba(…, .85)`)       |
| Bulanık ışık lekeleri ("blob")              | `blur-[80px]`, `animate-blob`, `animate-subtle-glow`                 |
| Turuncu ve turuncu gölgeler                 | `#FF8C00`, `#ea580c`, `orange-*`, `rgba(255,140,0,…)`                |
| Her yerde büyük yuvarlaklık                 | `rounded-3xl`, `rounded-2xl`, `rounded-xl`, `rounded-[20px]` …       |
| Gradient                                    | `bg-gradient-*`, `bg-linear-*`, `linear-gradient(`                   |
| Dekoratif ikon yığını                       | Başlık yanında süs ikonu, her etikette ikon                          |
| Bileşen içinde sabit hex/rgba               | Tüm renkler token'dan gelir (§3)                                     |
| Liste dışı süs animasyonları                | `float`, `bounce`, `pulse`, ekolayzer, parıltı (§7)                  |

**Bilinçli istisnalar** (yasak kapsamında sayılmaz):

- **Mavi ışık filtresi** katmanı işlevsel bir amber tondur (`rgba(255,140,0,.25)` + `multiply`). Marka rengi değildir, korunur ve `--filter-warm` token'ına taşınır.
- **YouTube iframe'i** ve **PDF sayfası** kendi renkleriyle görünür (video `plate` zemin üzerinde, PDF sayfası beyaz).
- **Mavi**, yalnızca gerçekten gerekirse ve küçük miktarda bilgi mesajında kullanılabilir. Varsayılan olarak hiç kullanılmaz.

## 3. Renk token'ları

`src/app/globals.css` içinde tanımlanır. Tema `<html data-theme="light|dark">` özniteliğiyle seçilir. Tailwind'e `@theme inline` ile bağlanır (`bg-page`, `text-ink`, `border-rule`…). Bileşenlerde `[var(--x)]` ya da hex **kullanılmaz**.

**Zorlama:** Tailwind'in varsayılan renk paleti, köşe ve gölge ölçekleri `@theme { --color-*: initial; --radius-*: initial; --shadow-*: initial; }` ile kapalıdır. `text-white`, `bg-blue-500`, `rounded-xl` gibi bir sınıf yazılırsa CSS üretilmez.

**Tek sabit kopya:** `<meta name="theme-color">` ve PWA manifest'i CSS değişkeni okuyamadığı için `src/constants/theme.ts` (`THEME_COLORS`) token değerlerinin kopyasını tutar; globals.css ile senkron tutulmalıdır.

| Token    | Gündüz               | Gece             | Kullanım                                                                                   |
| -------- | -------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `paper`  | `#E8E6DD`            | `#141210`        | Sayfa zemini (masa)                                                                        |
| `page`   | `#F4F2EB`            | `#1D1A17`        | Kitap sayfası: panel, kart, modal, widget                                                  |
| `page-2` | `#ECE9DF`            | `#181613`        | İkincil yüzey: sekme şeridi, input zemini, satır vurgusu                                   |
| `ink`    | `#26231F`            | `#ECE6DA`        | Ana metin, birincil düğme dolgusu                                                          |
| `mute`   | `#66615A`            | `#9A958B`        | İkincil metin, etiketler, **etkileşimli çizgiler** (input alt çizgisi, odak dışı kenarlık) |
| `rule`   | `#CBC8BB`            | `#2E2A25`        | **Yalnızca dekoratif** ayırıcı çizgiler (satır arası, panel kenarı)                        |
| `ribbon` | `#8F2D2D`            | `#D2604A`        | Tek vurgu: aktif sekme çizgisi, zaman damgası, italik vurgu, odak halkası, birincil eylem  |
| `brand`  | `#8F2D2D`            | `#8F2D2D`        | Marka bordosu, iki temada aynı: yalnızca logodaki "Be" ve Landing başlığındaki "odaklan."  |
| `ok`     | `#33604A`            | `#7FB596`        | Başarı: doğru cevap, "öğrendim", kayıt edildi                                              |
| `plate`  | `#1A1816`            | `#0E0C0B`        | Video "şekil" zemini; sinema modu örtüsü (%85)                                             |
| `shadow` | `rgba(38,35,31,.26)` | `rgba(0,0,0,.6)` | Yalnızca kitap/kart yüzeyleri (§6)                                                         |

**Hata durumu** ayrı bir kırmızı kullanmaz: `ribbon` + metin + ikon. (Örn. "Senin cevabın — yanlış".)

**Kitaplık sırtları** (geçmiş kartları, sırayla dönüşümlü):

| Sırt                   | Gündüz    | Gece      | Sırt yazısı                       |
| ---------------------- | --------- | --------- | --------------------------------- |
| `spine-1` orman yeşili | `#3E5F4C` | `#3F6652` | gündüz `#F4F2EB` · gece `#ECE6DA` |
| `spine-2` bordo        | `#8F2D2D` | `#8E3A38` | 〃                                |
| `spine-3` hardal       | `#7C5A18` | `#7D5F22` | 〃                                |
| `spine-4` kömür        | `#3B3834` | `#4A4640` | 〃                                |
| `spine-5` şarap moru   | `#5B3A4E` | `#6A4559` | 〃                                |

Sırt rengi içerik id'sinden deterministik seçilir (aynı kitap her açılışta aynı renk).

### 3.1 Ölçülmüş kontrast (WCAG 2.1)

| Çift                          | Gündüz      | Gece            | Sonuç                                                                                          |
| ----------------------------- | ----------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `ink` / `page`                | 13.96       | 13.94           | AA ✅                                                                                          |
| `mute` / `page` · `paper`     | 5.48 · 4.91 | 5.81 · 6.27     | AA ✅                                                                                          |
| `ribbon` / `page` · `paper`   | 7.26 · 6.51 | **4.55** · 4.91 | AA ✅ (gece sınırda: `ribbon` metni gecede ≥ 14px ve normal/kalın ağırlıkta, ince ağırlık yok) |
| `brand` / `page` · `paper`    | 7.26 · 6.51 | **2.13 · 2.30** | Gece ❌ bilinçli (kullanıcı kararı 2026-10-25; yalnızca logo ve başlık; axe testinde muaf)     |
| `ok` / `page`                 | 6.44        | 7.38            | AA ✅                                                                                          |
| `page` metni / `ribbon` dolgu | 7.26        | 4.55            | AA ✅                                                                                          |
| Sırt yazısı / sırt            | 5.63–10.41  | 4.78–7.54       | AA ✅                                                                                          |
| `rule` / `page`               | 1.50        | 1.22            | ❌ 3:1 değil → `rule` yalnızca dekoratif; bileşen sınırı gereken yerde `mute`                  |
| Gece sırtları / `page` zemini | —           | 1.85–2.91       | Sırtlar yazı ve şekilleriyle ayırt ediliyor; rafın tahta çizgisi `mute`                        |

Yeni bir renk çifti eklendiğinde bu tabloya ölçümüyle birlikte eklenir.

## 4. Tema

- **Öncelik:** kullanıcı seçimi (depolanan anahtar) → yoksa işletim sistemi tercihi (`prefers-color-scheme`).
- **FOUC yok:** `<head>` içinde, ilk boyamadan önce çalışan küçük bir inline script `data-theme` ve `color-scheme` değerlerini ayarlar. `<html suppressHydrationWarning>` kullanılır.
- **Anahtar:** Adım 3'te `bmo_theme` okunur ve yazılır. Adım 4'ten itibaren `belearn_theme` okunur, o yoksa `bmo_theme` okunur. Inline script de bu sırayla okur.
- **Tek yöntem:** `.light-theme` sınıfı ve `prefers-color-scheme` tabanlı `dark:` kaldırılır; `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`.
- **Düğme metni:** "Gece" / "Gündüz" (yalnızca ikon değil; ikon isteğe bağlı ve sade).
- Tema geçişi anlık; renk geçiş animasyonu yok.

## 5. Tipografi

| Aile                                                    | Kullanım                                               | Yükleme                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Literata** (variable, `opsz` ekseni, normal + italik) | Gövde, başlıklar, logo                                 | `next/font/google`, `subsets: ['latin', 'latin-ext']` (Türkçe ğ, ş, ı, İ), `axes: ['opsz']`, `display: 'swap'` |
| **DM Mono** (400, 500)                                  | Sayaç, zaman damgası, küçük etiketler, sekme sayaçları | `next/font/google`, `latin` + `latin-ext`                                                                      |

Geist kaldırılır. `font-optical-sizing: auto`.

**Ölçek** (rem tabanlı, 1rem = 16px):

| Rol       | Boyut / satır                                               | Not                                                |
| --------- | ----------------------------------------------------------- | -------------------------------------------------- |
| `display` | `clamp(3rem, 9vw, 8rem)` / 0.95                             | Landing başlığı, sola hizalı, `text-wrap: balance` |
| `h1`      | 2rem / 1.15                                                 | `text-wrap: balance`                               |
| `h2`      | 1.5rem / 1.2                                                | 〃                                                 |
| `h3`      | 1.1875rem / 1.3                                             | 〃                                                 |
| `body`    | 1rem / 1.6                                                  | Arayüz metni                                       |
| `reading` | 1.03125rem (16.5px) / 1.75                                  | Özet ve uzun metin                                 |
| `small`   | 0.875rem / 1.5                                              |                                                    |
| `label`   | DM Mono 0.6875–0.75rem, BÜYÜK HARF, `letter-spacing: .12em` | Etiketler, sekme sayaçları                         |
| `timer`   | DM Mono, `font-variant-numeric: tabular-nums`               | Pomodoro, zaman damgaları                          |

- **Logo:** metin olarak "Be" düz, `brand` rengi + "_Learn_" italik, `ink` rengi (Literata, `<Logo />`). `/logo.png` kullanılmaz. Erişilebilir ad "BeLearn".
- **Uygulama simgesi** (favicon, apple-icon, PWA 192/512/maskable): kâğıt zemin üzerinde Literata "B" (`ink`) + italik "L" (`ribbon`). Adım 3d'de yer tutucu olarak üretildi; 2026-10-25'te kullanıcı kalıcı simge olarak onayladı.
- Türkçe büyük harf dönüşümü için `lang="tr"` zorunlu (`i` → `İ` doğru dönüşsün).

## 6. Şekil, çizgi, gölge, boşluk

- **Köşe yuvarlaklığı yalnızca iki değer:** `--radius: 2px` (her şey) ve `--radius-pill: 9999px` (yalnızca tam yuvarlak düğmeler ve çipler). Tailwind'de `rounded-sm` → 2px, `rounded-full`; diğer tüm `rounded-*` yasak.
- **Çizgi:** 1px. Dekoratif ayırıcılar `rule`, etkileşimli sınırlar `mute`, aktif/odak `ribbon`.
- **Gölge:** yalnızca kitap/kart yüzeylerinde (sağ panel "sayfa", flashcard, modal, widget, kitap sırtı). Tek bir hafif gölge: `shadow-page` = `0 1px 2px var(--shadow)`. Kitap sırtları `<button>` olsa da kitap yüzeyi sayılır ve gölgelidir. Panel için ek olarak hafif iç gölge (`inset 0 0 0 1px var(--rule)` + sayfa kenarı hissi). Düğmelerde gölge yok.
- **Boşluk:** 4px tabanlı ölçek; bölümler arası cömert (≥ 48px masaüstü). Hiyerarşi boyut ve boşlukla kurulur, renk ve kutuyla değil.
- **Odak halkası:** `outline: 2px solid var(--ribbon); outline-offset: 2px` (`:focus-visible`). Hiçbir yerde `outline: none` tek başına kullanılmaz.
- **Dokunma hedefi:** ≥ 44×44 px (mobil); görsel ikon küçük olsa da tıklama alanı büyük.

## 7. Hareket

İzin verilenler (başka süs animasyonu **eklenmez**):

1. **Sayfa yükleniyor koreografisi** (yalnızca Landing ilk açılışta): başlık satırları maske altından yükselir (`translateY(100%) → 0`, ~600 ms, `cubic-bezier(.2,.7,.2,1)`), ardından cümle, giriş ve raf `fade-up` (opacity + 8px, kademeli 80 ms).
2. **Kitaplık sırtları:** sırayla yükselerek gelir (kademeli 40 ms); üzerine gelince/odaklanınca 6–8px yukarı kalkar.
3. **Kart çevirme:** 3B `rotateY(180deg)`, ~450 ms, **state tabanlı** (`flipped`), DOM'a doğrudan müdahale yok.
4. **Sekme geçişleri:** aktif alt çizginin kayması + içerik ≤ 150 ms opaklık.
5. **Modal, widget, popover ve toast açılış/kapanışı:** yalnızca **150 ms opaklık geçişi** (solma), `ease-out`. Ölçek, kayma ya da zıplama yok. Arka plan örtüsü de aynı geçişle gelir. (Karar #5)

- Süreler token'dır: `--dur-fade: 150ms`, `--dur-flip: 450ms`, `--dur-rise: 600ms`.
- `prefers-reduced-motion: reduce` durumunda hepsi kapalı (anında son durum).
- Kaldırılacak mevcut animasyonlar: `float`, `subtleGlow`, `blob`, `eq-*` (radyo ekolayzeri → durum metni "Çalıyor"), `animate-bounce`, `animate-pulse` (zamanlayıcı/radyo ikonları), `scaleIn` ve `fadeIn` (→ madde 5'teki 150 ms solma), `fadeInUp` (koreografi dışı), `taskComplete` (görev özelliğiyle birlikte kaldırıldı).

## 8. Bileşen kuralları

### 8.1 Landing (çok sade; yalnızca bunlar)

1. Sol üst: "BeLearn" logosu. Sağ üst: tema düğmesi (Gece/Gündüz).
2. Çok büyük, sola hizalı başlık: "Sadece _odaklan._" ("odaklan." italik + `brand`, iki temada aynı bordo). Ortalanmış jenerik hero yok.
3. Tek cümle: "Bir YouTube videosu, oynatma listesi ya da PDF aç. Notların, özetin, kartların ve soruların yanında beklesin."
4. Tek kaynak girişi: alt çizgili input (placeholder: "YouTube bağlantısı") + "Aç" düğmesi; altında metin bağlantısı "ya da PDF yükle".
5. Geçmiş varsa "Son çalışmalar": kitaplık rafı (dikey sırtlar, başlık dikey yazılı, üstüne gelince kalkar, altta ince tahta çizgisi). **En fazla 12 sırt**; rafın sağında küçük bir "Tüm geçmiş" metin bağlantısı Geçmiş modalını açar. Playlist sırtında "Koleksiyon · N video" (DM Mono etiket). PDF sırtında "PDF" etiketi. Landing'de "Geçmişi temizle" düğmesi yok; "Tümünü temizle" yalnızca Geçmiş modalında ve onaylı. (Karar #3)
6. Altta tek satır: "Notların ve ilerlemen yalnızca bu cihazda saklanır."

Özellik tanıtımı, kitap animasyonu, ek bölüm ve çoklu sütun **yok**. "Sadece PDF desteklenir" metni ve dış dönüştürme bağlantısı da yok; PDF olmayan bir dosya seçilirse yalnızca "Desteklenmeyen dosya: yalnızca PDF açılabilir" uyarısı gösterilir (Karar #4). Geçmiş, localStorage'dan istemcide yüklendiği için raf hidrasyondan sonra §7.2 animasyonuyla belirir (yerleşim kaymasını önlemek için rafa sabit yükseklik ayrılır).

### 8.2 Üst çubuk (çalışma ekranı)

İnce, tek satır, `page` zemin, altta `rule` çizgi.

- **Sol:** "BeLearn" (Landing'e döner).
- **Sağ (soldan sağa):** pomodoro kontrolü (§8.2.1) · [playlist, yalnızca playlist varken] · tema (Gece/Gündüz) · radyo · ses · tam ekran · Ayarlar. İkonlar sade (lucide, 1.5 çizgi kalınlığı); çerçeveli çip yok, gerekirse ince çizgili. Her ikon düğmesinin `aria-label`'ı var.
- **Ayarlar menüsü:** en üstte "Geçmiş" ve "Sinema modu" (§8.7) satırları (üst çubuk sade kalsın diye buraya taşındı, 2026-10-25); ardından mavi ışık filtresi, "Yedeği indir / Yedeği yükle", PDF depolama, uygulamayı yükle (PWA). (Karar #2)
- İlerleme yüzdesi ve not/kart/soru sayaçları üst çubukta **yok**; sağ paneldeki sekme sayaçlarında gösterilir. (Karar #2)
- Mobilde (< 640 px) yalnızca logo, pomodoro kontrolü ve bir "Menü" düğmesi görünür; diğer düğmeler menüde listelenir (dokunma hedefi ≥ 44 px).

#### 8.2.1 Pomodoro kontrolü (Karar #6)

Tek bir bölünmüş kontrol:

```
 24:58   [ Odaklan ]  ▾
 mono    ink çizgili   ayar paneli
```

- **Kalan süre:** DM Mono, `tabular-nums`. Çalışırken `ink`, duraklatılmışken `mute`. Mod metinle belirtilir: "ODAK" / "MOLA" etiketi (renk değil).
- **Ana düğme:** "Odaklan" pomodoroyu **doğrudan başlatır**. Çalışırken metni "Duraklat", molada "Molayı başlat" olur.
- **▾ Ayar paneli** (popover, 150 ms solma):
  - "Odak" süresi: dakika, 1–120, `−`/`+` adımlayıcı + sayı girişi.
  - "Mola" süresi: dakika, 1–30, aynı şekilde.
  - Hazır ayarlar (çip, tam yuvarlak): `25 / 5`, `50 / 10`, `90 / 15`.
  - "Sıfırla" ve (molada) "Molayı atla".
- Pomodoro'nun tek arayüzü bu paneldir. "Görevler ve 30 günlük harita" widget'ı ve görev özelliği 2026-10-25'te tamamen kaldırıldı (sadelik, kullanıcı kararı). `todos` anahtarı emeklidir (`RETIRED_KEYS`): okunmaz, yazılmaz, yedeğe girmez, eski yedeklerde yok sayılır; cihazdaki eski değerlere dokunulmaz. Pomodoro geçmişi korunur.
- Süre alanları zamanlayıcı **çalışırken kilitlidir** (bugünkü davranış). Değişiklik, durmuş sayaca anında yansır.
- Süreler kalıcıdır (`belearn_pomodoro_settings`).
- Erişilebilirlik: süre değişimi `aria-live="polite"` ile duyurulmaz (her saniye gürültü olur). Yalnızca mod değişimi ve bitiş duyurulur. Adımlayıcılar `aria-label="Odak süresini 1 dakika azalt"` gibi açık etiketler taşır.

### 8.3 Video ve playlist

- Video bir "şekil" gibi: `plate` zemin, 2px köşe, altında italik açıklama (video başlığı, `mute`).
- YouTube'un kendi kontrolleri kalır; **özel oynatıcı kontrolü yapılmaz**.
- Playlist listesi: numaralı, sade satırlar; etkin bölüm `ribbon` sol çizgi + italik.

### 8.4 Sağ panel ("açık kitap sayfası")

- `page` zemin, 1px `rule` kenarlık, hafif iç gölge, 2px köşe.
- Sekmeler: **Notlar / Özet / Kartlar / Sorular**. Altı çizgili metin; aktif olanın çizgisi `ribbon`. Dolu düğme yok. Yanında DM Mono sayaç.
- "AI Sihirbazı" metin düğmesi (mavi değil; `ink` çizgili ya da `ribbon` metin).
- **Notlar:** sol sütunda zaman damgası (DM Mono, `ribbon`, tıklanabilir), sağda metin, satırlar arası `rule` çizgi. Yeni not input'u alt çizgili (`mute`, odakta `ribbon`).
- **Özet:** ilk paragrafta büyük italik başlangıç harfi (drop cap, 3 satır), `reading` ölçeği (16.5px / 1.75). Markdown başlık/liste/alıntı stilleri bu dokümana göre.
- **Kartlar:** çizgili defter kâğıdı görünümü (`rule` yatay çizgiler, kenar boşluğunda ince `ribbon` dikey çizgi), 3B çevirme, "Öğrendim" düğmesi `aria-pressed`, klavyeyle (Enter/Space) çevrilebilir. Kartın kendisi bir düğmedir (`aria-pressed` = çevrili); görünmeyen yüz `aria-hidden`. Yatay çizgiler renk geçişi (§2) kullanılmadan, 1 px'lik bir çizginin `box-shadow` ile 1.75rem aralıkla çoğaltılmasıyla çizilir (`.notebook`).
- **Sorular:** dikdörtgen çerçeveli şıklar (2px köşe); cevaptan sonra şıkların yanında metin etiketi: "Doğru cevap" (`ok`) / "Senin cevabın" (yanlışsa `ribbon`). Tek soru görünümü + "Sonraki soru"; ilerleme "3 / 10" (DM Mono). Sekme ilk cevaplanmamış soruda açılır; cevap verince odak "Sonraki soru"ya geçer ve sonuç `role="status"` ile duyurulur.
- **Sekmeler:** WAI-ARIA sekme deseni (←/→, Home/End; yalnızca etkin sekme Tab sırasında). Boş sekmede kısa metin ve gerekiyorsa "AI Sihirbazı'nı aç" bağlantısı; süs ikonu yok.
- **Onaylar:** geri alınamayan işlemler (`ConfirmDialog`, `role="alertdialog"`) ne silineceğini sayılarıyla söyler; ilk odak "Vazgeç"te, onay düğmesi `ribbon` dolgu.

### 8.5 Widget'lar ve modallar

Radyo, Geçmiş, AI Sihirbazı, PDF yeniden yükle, onay diyalogları:

- `page` zemin, 1px `rule` kenarlık, 2px köşe, §6 gölge; **cam efekti yok**, arka plan örtüsü düz ve yarı saydam `plate` (bulanıklık yok; `ink` gece temasında açık renk olduğu için örtüde kullanılmaz). Açılış/kapanış yalnızca 150 ms solma (§7.5).
- Başlık Literata, etiketler DM Mono.
- Radyo: çalma durumu metinle ("Çalıyor" / "Duraklatıldı"); ekolayzer animasyonu yok.

### 8.6 Mobil (375 px)

- Video üstte, panel altta tam genişlikte; sekmeler yatay ve kaydırılabilir.
- Dokunma hedefleri ≥ 44 px.
- Silme düğmeleri hover gerektirmeden görünür (`@media (hover: hover)` olan cihazlarda hover ile belirginleşebilir).
- Yatay kaydırma yok.

### 8.7 Sinema modu (Adım 9'da "Odak modu" olarak eklendi; 2026-10-25'te sinema moduna çevrildi)

Film sitelerindeki sinema modu gibi: video önde, geri kalan her şey yarı saydam siyahın altında.

- Ayarlar menüsündeki "Sinema modu" satırı (`aria-pressed`) ve mobil menü açıp kapatır; **Escape** kapatır (yazı alanında ve modal açıkken değil). Kalıcı değildir (sayfa yenilenince kapalı).
- **Örtü:** sabit, tıklamayı engellemeyen (`pointer-events: none`) düz bir katman, `plate` %85 (`color-mix`; renk geçişi ve bulanıklık yok). Video kutusu (`.cinema-screen`) örtünün üstündedir.
- Üst çubuk kendi örtüsünü taşır (`.cinema-header::after`). Üst çubuk, araç çubuğu, oynatma listesi ve sağ panel (`.cinema-lift`) **üzerine gelince ya da içlerinde odak varken** örtünün üstüne çıkar; Alt+N ile not yazmak sinema modunda da çalışır.
- Kart çevirme, sekmeler ve kısayollar sinema modunda aynen çalışır.

### 8.8 Sistem bildirimleri (Adım 10)

- **Yeni sürüm:** sağ altta `page` yüzeyli küçük kutu, 150 ms solma: "BeLearn'ün yeni sürümü hazır." + `ink` dolgu "Yenile" düğmesi + kapat. Kendiliğinden yenilemez; `role="status"`.
- **Depolama uyarıları:** sol altta, sol kenarda 2 px `ribbon` çizgi; `role="alert"`.
- **Çevrimdışı:** üstte tam genişlik `ribbon` şerit, `role="status"`; bağlantı gelince kalkar.
- Bildirimler üst üste binmez: yeni sürüm sağ altta, depolama sol altta, pomodoro üst ortada.
- Sistem (işletim sistemi) bildirimi uygulama simgesiyle (`/icons/icon-192.png`) gösterilir.

## 9. Metin ve ses tonu

- Ad: **BeLearn** (tek kelime, B ve L büyük). "BMO", "BMO Learn" ve "bmo" kullanıcıya görünen hiçbir yerde geçmez.
- Sakin, kısa, ikinci tekil şahıs ("Notların bu cihazda saklanır").
- Durum her zaman metinle de belirtilir (yalnızca renk ya da ikon yetmez).

## 10. Erişilebilirlik

- WCAG 2.1 AA: metin ≥ 4.5:1, büyük metin ve bileşen sınırı ≥ 3:1 (§3.1).
- `lang="tr"`; `translate="no"` marka ve içerik alanlarında.
- Modallar `role="dialog"`, `aria-modal`, Escape, odak tuzağı, odak iadesi (ortak `<Modal>`). Modal açıkken sayfanın geri kalanı `inert`: ekran okuyucu ve fare arkaya ulaşmaz. İç içe pencerede (ör. Geçmiş üstünde onay) Escape yalnızca en üsttekini kapatır.
- Klavye kısayolları: `Alt+N` not alanı; `K` ya da `Space` videoyu oynat/duraklat (yazı alanında, bir düğme odaktayken ve modal açıkken çalışmaz).
- Dokunma hedefleri ≥ 44 px; silme düğmeleri hover gerektirmez.
- İkon düğmelerinde `aria-label`; durum bildirimleri `aria-live="polite"`.

## 11. Kontrol listesi (her değişiklikte)

Otomatik: `npm test` (markdown güvenliği dahil), `npm run test:e2e` (axe iki temada, modal odak yönetimi, 375 px / Pixel 7'de taşma ve ≥ 44 px hedefler). Elle: aşağıdaki taramalar.

```bash
# Yasaklı kalıplar (Adım 3 sonundan itibaren 0 olmalı; istisna dosyaları hariç)
grep -rEn "backdrop-blur|blur-\[|animate-(blob|float|subtle-glow|bounce|pulse)|gradient" src
grep -rEin "ff8c00|ea580c|orange-[0-9]|255, ?140, ?0" src      # istisna: --filter-warm tanımı
grep -rEn "rounded-(xl|2xl|3xl|lg|md|\[)" src
grep -rEn "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx     # bileşenlerde sabit renk (constants/theme.ts hariç)
grep -rEin "\bbmo\b|bmo learn|BMO" src public README.md          # istisna: bmo_* depolama anahtarları ve migrasyon kodu
```

Ek olarak: iki temada 375 px ve 1440 px ekran görüntüsü, kontrast tablosunun güncelliği, `prefers-reduced-motion` ile animasyonsuz görünüm.
