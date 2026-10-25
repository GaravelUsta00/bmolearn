'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

export const OfflineBanner = () => {
  const isOffline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false
  );

  if (!isOffline) return null;
  return (
    <div
      role="status"
      className="fixed top-0 left-0 w-full bg-ribbon text-page text-xs font-bold py-1.5 flex items-center justify-center gap-2 z-50 animate-fade shadow-page"
    >
      <WifiOff size={14} aria-hidden="true" /> İnternet bağlantınız koptu. Lütfen bağlantınızı kontrol edin.
    </div>
  );
};
