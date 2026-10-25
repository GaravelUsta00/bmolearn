'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { InstallPromptEvent } from '@/store/types';

// Sayfanın service worker'dan önce yüklediği paketler: SW bunları da önbelleğe alır (ilk ziyaretten sonra çevrimdışı).
const loadedStaticAssets = () =>
  performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((u) => u.startsWith(`${location.origin}/_next/static/`));

/**
 * PWA (W1): service worker kaydı, kurulum istemi ve güncelleme bildirimi.
 * Yeni sürüm kendiliğinden devreye girmez; kullanıcı "Yenile" deyince etkinleşir ve sayfa yenilenir.
 * Geliştirme modunda (HMR ile çakışmasın diye) kayıt yapılmaz.
 */
export const PwaManager = () => {
  const setInstallPrompt = useStore((s) => s.setInstallPrompt);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloading = useRef(false);
  const reloadRequested = useRef(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [setInstallPrompt]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator) || !window.isSecureContext) return;
    const sw = navigator.serviceWorker;
    let registration: ServiceWorkerRegistration | null = null;

    const watch = (reg: ServiceWorkerRegistration) => {
      // Zaten bekleyen bir sürüm varsa (önceki ziyarette indirilmiş) hemen sor.
      if (reg.waiting && sw.controller) setWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const next = reg.installing;
        next?.addEventListener('statechange', () => {
          // İlk kurulumda (controller yok) sorulacak bir şey yok; yalnızca güncellemede.
          if (next.state === 'installed' && sw.controller) setWaiting(next);
        });
      });
    };
    // Yalnızca kullanıcı "Yenile" dediyse: ilk kurulumda da (clients.claim) controller değişir ve
    // o an sayfayı yenilemek yazılmakta olan bir notu kaybettirebilir.
    const onControllerChange = () => {
      if (!reloadRequested.current || reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void registration?.update().catch(() => {});
    };

    sw.register('/sw.js', { scope: '/' })
      .then((reg) => {
        registration = reg;
        watch(reg);
        return sw.ready;
      })
      .then((reg) => reg.active?.postMessage({ type: 'CACHE_URLS', urls: loadedStaticAssets() }))
      .catch(() => {
        // Kayıt başarısızsa uygulama çevrimiçi olarak aynen çalışır.
      });
    sw.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      sw.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-[70] flex max-w-[calc(100vw-2rem)] animate-fade items-center gap-4 rounded-sm border border-rule bg-page py-2 pl-4 pr-1 text-ink shadow-page"
    >
      <span className="text-sm">BeLearn&apos;ün yeni sürümü hazır.</span>
      <button
        type="button"
        onClick={() => {
          reloadRequested.current = true;
          waiting.postMessage({ type: 'SKIP_WAITING' });
        }}
        className="min-h-11 rounded-sm bg-ink px-4 text-sm text-page hover:opacity-90"
      >
        Yenile
      </button>
      <button
        type="button"
        onClick={() => setWaiting(null)}
        aria-label="Sonra"
        title="Sonra (bir sonraki açılışta)"
        className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
};
