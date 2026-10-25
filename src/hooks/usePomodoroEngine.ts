import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { NotificationManager } from '@/lib/notifications';

const TOAST_MS = 5000;

/**
 * Faz bitişini yakalar. Kalan süre her zaman `endsAt - şimdi` ile hesaplandığı için ekrandaki süre
 * arka planda da kaymaz (B4). Arka plan sekmesinde tarayıcı zamanlayıcıları kısabilir; bu durumda
 * bitiş, sekme yeniden görünür olduğunda ya da kısılmış zamanlayıcı tetiklendiğinde işlenir ve kayıt
 * yine fazın bittiği güne yazılır.
 */
export const usePomodoroEngine = () => {
  const status = useStore((s) => s.timerStatus);
  const endsAt = useStore((s) => s.timerEndsAt);
  const toastVisible = useStore((s) => s.pomodoroToast.visible);

  useEffect(() => {
    if (status !== 'running' || endsAt === null) return;
    const check = () => {
      const finished = useStore.getState().completeTimerPhase();
      if (finished === 'focus') {
        NotificationManager.send('Odaklanma Bitti!', 'Harika çalıştın. Şimdi kısa bir mola zamanı.');
        useStore.getState().showPomodoroToast('Pomodoro bitti, dinlenme zamanı.', 'break');
      } else if (finished === 'break') {
        NotificationManager.send('Mola Bitti!', 'Enerjini topladıysan yeniden odaklanma zamanı.');
        useStore.getState().showPomodoroToast('Mola bitti, odaklanma zamanı.', 'focus');
      }
    };
    const timer = window.setTimeout(check, Math.max(0, endsAt - Date.now()) + 50);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, [status, endsAt]);

  useEffect(() => {
    if (!toastVisible) return;
    const t = window.setTimeout(() => useStore.getState().hidePomodoroToast(), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toastVisible]);
};
