'use client';

import { useRef } from 'react';
import { useStore } from '@/store/useStore';
import { reloadDocumentFile } from '@/lib/openDocument';
import { Modal } from '@/components/ui/Modal';
import { useRetained } from '@/hooks/usePresence';

// Geçmişten açılan PDF bu cihazda saklı değilse gösterilir (saklıysa doğrudan açılır, A4).
export const DocReloadModal = () => {
  const pending = useStore((s) => s.pendingDocReload);
  const setPendingDocReload = useStore((s) => s.setPendingDocReload);
  const storePdfs = useStore((s) => s.documentSettings.storePdfs);
  const inputError = useStore((s) => s.inputError);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = useRetained(pending);

  return (
    <Modal open={!!pending} onClose={() => setPendingDocReload(null)} labelledBy="doc-reload-title">
      {shown && (
        <>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">PDF bu cihazda yok</p>
          <h2 id="doc-reload-title" className="mt-2 font-serif text-xl leading-snug">
            <em>{shown.title}</em> dosyasını yeniden seç
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Notların, özetin, kartların ve soruların duruyor; yalnızca PDF&apos;in kendisi bu cihazda saklanmamış.
            {storePdfs
              ? ' Dosyayı seçtiğinde bir dahaki sefere sormamak için saklanacak.'
              : ' "PDF’leri bu cihazda sakla" ayarı kapalı olduğu için dosya saklanmayacak.'}
          </p>
          {inputError && (
            <p role="alert" className="mt-3 text-sm text-ribbon">
              {inputError}
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            aria-label="PDF dosyası seç"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) await reloadDocumentFile(file, shown);
            }}
          />
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingDocReload(null)}
              className="min-h-11 px-3 text-sm text-mute hover:text-ink"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="min-h-11 rounded-sm bg-ink px-5 text-sm text-page hover:opacity-90"
            >
              Dosyayı seç
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
