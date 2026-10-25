# BeLearn

**Sadece odaklan.** Bir YouTube videosu, oynatma listesi ya da PDF aç. Notların, özetin, kartların ve soruların yanında beklesin.

BeLearn tamamen tarayıcıda çalışır. Hesap ve sunucu yoktur; notların ve ilerlemen yalnızca kullandığın cihazda (localStorage) saklanır.

## Özellikler

- YouTube videosu ve oynatma listesi, kaldığın saniyeden devam
- PDF görüntüleme
- Zaman damgalı notlar (`Alt+N`), panoya kopyalama ya da `.txt` olarak indirme
- Klavye: `K` ya da `Space` videoyu oynatır/duraklatır; sekmeler ok tuşlarıyla, kartlar Enter/Space ile çevrilir
- **AI Sihirbazı:** içeriğe uygun bir istem (prompt) üretir. İstemi kendi kullandığın yapay zekâya yapıştırırsın, dönen JSON'u geri yapıştırırsın; özet, bilgi kartları ve çoktan seçmeli sorular oluşur
- Pomodoro zamanlayıcısı, günlük görevler ve 30 günlük çalışma haritası
- Odak radyosu, mavi ışık filtresi, tam ekran, odak modu, Gece/Gündüz teması
- Ana ekrana eklenebilir (PWA)

## Geliştirme

Gereksinimler: Node.js 20+ (24 ile test edildi), npm.

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # typecheck + lint + build
npm run format       # Prettier
```

Yığın: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, zustand.

## Belgeler

- [docs/DESIGN.md](docs/DESIGN.md): tasarım sistemi (bağlayıcı)
- [PLAN.md](PLAN.md): refactor planı
- [ANALYSIS.md](ANALYSIS.md): kod analizi ve bulgular

> Bu README bir taslaktır; tam sürümü refactor planının 10. adımında yazılacak.

Developed by EHC.
