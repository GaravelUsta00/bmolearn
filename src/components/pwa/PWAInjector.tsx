'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { THEME_COLORS } from '@/constants/theme';

export const PWAInjector = () => {
  const setInstallPrompt = useStore((state) => state.setInstallPrompt);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.getElementById('pwa-manifest')) {
        const manifest = {
          name: 'BeLearn',
          short_name: 'BeLearn',
          start_url: `${window.location.origin}/`,
          display: 'standalone',
          background_color: THEME_COLORS.light.paper,
          theme_color: THEME_COLORS.light.paper,
          icons: [
            { src: `${window.location.origin}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${window.location.origin}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
            {
              src: `${window.location.origin}/icons/icon-maskable-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        };
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const link = document.createElement('link');
        link.id = 'pwa-manifest';
        link.rel = 'manifest';
        link.href = URL.createObjectURL(blob);
        document.head.appendChild(link);
      }
      const handler = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [setInstallPrompt]);
  return null;
};
