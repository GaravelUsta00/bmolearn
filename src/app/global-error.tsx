'use client';

import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { THEME_INIT_SCRIPT } from '@/constants/theme';
import './globals.css';

// Kök layout'ta oluşan hatalar için; kendi <html>/<body>'sini ve temasını kurar.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <title>BeLearn · Hata</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-paper">
        <ErrorFallback error={error} retry={retry} />
      </body>
    </html>
  );
}
