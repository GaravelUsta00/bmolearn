import type { Metadata, Viewport } from 'next';
import { Literata, DM_Mono } from 'next/font/google';
import { THEME_COLORS, THEME_INIT_SCRIPT } from '@/constants/theme';
import './globals.css';

const literata = Literata({
  variable: '--font-literata',
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BeLearn · Sadece odaklan.',
  description:
    'Bir YouTube videosu, oynatma listesi ya da PDF aç. Notların, özetin, kartların ve soruların yanında beklesin.',
  applicationName: 'BeLearn',
  authors: [{ name: 'EHC' }],
  other: { google: 'notranslate' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLORS.light.paper },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLORS.dark.paper },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${literata.variable} ${dmMono.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
