'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    if (!navigator.onLine) setIsOffline(true);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;
  return (
    <div className="fixed top-0 left-0 w-full bg-ribbon text-page text-xs font-bold py-1.5 flex items-center justify-center gap-2 z-50 animate-fade shadow-page">
      <WifiOff size={14} /> İnternet bağlantınız koptu. Lütfen bağlantınızı kontrol edin.
    </div>
  );
};
