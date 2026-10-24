export const NotificationManager = {
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

      let isOriginal = false;
      const originalTitle = document.title;
      const blinkInterval = setInterval(() => {
        document.title = isOriginal ? originalTitle : `🔔 ${title}`;
        isOriginal = !isOriginal;
      }, 1000);

      setTimeout(() => {
        clearInterval(blinkInterval);
        document.title = originalTitle;
      }, 10000);
    } catch (e) {
      console.warn('Bildirim gönderilemedi:', e);
    }
  },
};
