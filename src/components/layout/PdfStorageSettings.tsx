'use client';

import { useEffect, useId, useState } from 'react';
import { useStore } from '@/store/useStore';
import { documentsSummary, MAX_STORED_PDF_BYTES } from '@/lib/idb';
import { forgetAllDocuments } from '@/lib/openDocument';

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`;

// "Bu cihazda sakla" (varsayılan açık) ve saklanan PDF'lerin yönetimi (A4).
export const PdfStorageSettings = () => {
  const storePdfs = useStore((s) => s.documentSettings.storePdfs);
  const setStorePdfs = useStore((s) => s.setStorePdfs);
  const [summary, setSummary] = useState<{ count: number; bytes: number } | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const toggleId = useId();

  useEffect(() => {
    let alive = true;
    documentsSummary().then((s) => {
      if (alive) setSummary(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const clearAll = async () => {
    await forgetAllDocuments();
    setSummary(await documentsSummary());
    setConfirming(false);
  };

  return (
    <div className="border-t border-rule pt-3">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">PDF&apos;ler</h3>
      <label htmlFor={toggleId} className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input
          id={toggleId}
          type="checkbox"
          checked={storePdfs}
          onChange={(e) => setStorePdfs(e.target.checked)}
          className="h-4 w-4 accent-ribbon"
        />
        PDF&apos;leri bu cihazda sakla
      </label>
      <p className="text-xs leading-relaxed text-mute">
        Saklanan PDF yenilemede ve geçmişten açarken yeniden seçilmeden açılır. Dosya başına en fazla{' '}
        {mb(MAX_STORED_PDF_BYTES)}.
      </p>
      {summary === null && <p className="mt-2 text-xs text-ribbon">Bu tarayıcıda dosya saklanamıyor.</p>}
      {summary && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] tabular-nums text-mute">
            {summary.count} dosya · {mb(summary.bytes)}
          </span>
          {summary.count > 0 &&
            (confirming ? (
              <span className="flex gap-3 text-sm">
                <button type="button" onClick={clearAll} className="min-h-11 text-ribbon underline underline-offset-4">
                  Evet, hepsini sil
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-11 text-mute hover:text-ink"
                >
                  Vazgeç
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="min-h-11 text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-mute"
              >
                Saklananları sil
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
