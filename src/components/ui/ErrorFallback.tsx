'use client';

import { useEffect } from 'react';
import { downloadBackup } from '@/lib/backup';

interface ErrorFallbackProps {
  error: unknown;
  retry: () => void;
}

// Uygulama düzeyinde hata ekranı (app/error.tsx ve app/global-error.tsx ortak).
export const ErrorFallback = ({ error, retry }: ErrorFallbackProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error instanceof Error ? error.message : String(error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16 text-ink">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">BeLearn</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight">Bir şeyler ters gitti.</h1>
      <p className="mt-4 text-lg leading-relaxed text-mute">
        Notların ve ilerlemen bu cihazda duruyor; bu hata onları silmez. Tekrar dene, olmazsa sayfayı yenile. İstersen
        önce verinin bir yedeğini indir.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={retry} className="min-h-11 rounded-sm bg-ink px-5 text-page hover:opacity-90">
          Tekrar dene
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-sm border border-mute px-5 hover:border-ink"
        >
          Sayfayı yenile
        </button>
        <button
          type="button"
          onClick={() => downloadBackup()}
          className="min-h-11 px-2 text-ink underline decoration-rule underline-offset-4 hover:decoration-mute"
        >
          Yedeği indir
        </button>
      </div>
      <details className="mt-10 text-sm text-mute">
        <summary className="cursor-pointer">Teknik ayrıntı</summary>
        <pre className="custom-scrollbar mt-2 overflow-x-auto whitespace-pre-wrap rounded-sm bg-page-2 p-3 font-mono text-xs">
          {message}
        </pre>
      </details>
    </main>
  );
};
