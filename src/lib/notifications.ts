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
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(() => {});

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (window.self === window.top) new Notification(title, { body, icon: '/logo.png' });
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
