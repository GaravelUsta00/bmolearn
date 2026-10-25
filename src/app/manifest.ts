import type { MetadataRoute } from 'next';
import { THEME_COLORS } from '@/constants/theme';

// Next bunu /manifest.webmanifest olarak sunar ve <head>'e bağlar (W1: eskiden blob: URL'iydi).
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'BeLearn',
    short_name: 'BeLearn',
    description:
      'Bir YouTube videosu, oynatma listesi ya da PDF aç. Notların, özetin, kartların ve soruların yanında beklesin.',
    lang: 'tr',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: THEME_COLORS.light.paper,
    theme_color: THEME_COLORS.light.paper,
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
