// Sekme başlığının yanıp sönmesi tek bir kontrolcüden yönetilir (B5): üst üste gelen bildirimler
// özgün başlığı "🔔 …" olarak yakalayıp kalıcı bırakmaz.
let blinkTimer: number | null = null;
let blinkStop: number | null = null;
let originalTitle: string | null = null;

const stopBlink = () => {
  if (blinkTimer !== null) window.clearInterval(blinkTimer);
  if (blinkStop !== null) window.clearTimeout(blinkStop);
  blinkTimer = blinkStop = null;
  if (originalTitle !== null) document.title = originalTitle;
  originalTitle = null;
};

const startBlink = (title: string) => {
  stopBlink();
  originalTitle = document.title;
  let showAlert = true;
  blinkTimer = window.setInterval(() => {
    document.title = showAlert ? `🔔 ${title}` : (originalTitle ?? document.title);
    showAlert = !showAlert;
  }, 1000);
  blinkStop = window.setTimeout(stopBlink, 10000);
};

export const NotificationManager = {
  /** Kullanıcı eylemi içinde çağrılmalı (ör. "Odaklan" tıklaması); aksi halde tarayıcılar reddeder. */
  requestPermission: async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        if (window.self === window.top) await Notification.requestPermission();
      }
    } catch (e) {
      console.warn('Bildirim izni alınamadı:', e);
    }
  },
  send: (title: string, body: string) => {
    try {
      const audio = new Audio('/sounds/bildirim.wav');
      audio.play().catch(() => {});

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (window.self === window.top) new Notification(title, { body, icon: '/icons/icon-192.png' });
      }

      startBlink(title);
    } catch (e) {
      console.warn('Bildirim gönderilemedi:', e);
    }
  },
};
