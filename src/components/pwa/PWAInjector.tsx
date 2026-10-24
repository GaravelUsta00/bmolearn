'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export const PWAInjector = () => {
  const setInstallPrompt = useStore(state => state.setInstallPrompt);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.getElementById('pwa-manifest')) {
        const manifest = { name: "BMO Learn", short_name: "BMO Learn", start_url: "/", display: "standalone", background_color: "#09090b", theme_color: "#FF8C00", icons: [{ src: "/logo.png", sizes: "192x192", type: "image/png" }, { src: "/logo.png", sizes: "512x512", type: "image/png" }] };
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const link = document.createElement('link'); link.id = 'pwa-manifest'; link.rel = 'manifest'; link.href = URL.createObjectURL(blob);
        document.head.appendChild(link);
      }
      const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [setInstallPrompt]); 
  return null;
}
