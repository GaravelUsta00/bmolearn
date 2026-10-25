'use client';

import { X } from 'lucide-react';
import { applyBackup, currentlyFilledKeys, downloadBackup, type ApplyMode } from '@/lib/backup';
import { useBackupDialog } from '@/components/backup/backupDialogStore';
import { DATA_KEYS, DATA_KEY_LABELS } from '@/lib/storageKeys';
import { Modal } from '@/components/ui/Modal';

export const BackupDialog = () => {
  const { isOpen, backup, error, close } = useBackupDialog();

  const filled = backup ? currentlyFilledKeys() : [];
  const apply = (mode: ApplyMode) => {
    if (!backup) return;
    if (mode === 'replace') downloadBackup(undefined, '-oncesi');
    const result = applyBackup(backup, mode);
    if (!result.ok) {
      useBackupDialog.getState().fail(result.error);
      return;
    }
    // Store'u yeni veriyle baştan kurmanın en güvenli yolu: sayfayı yenile.
    window.location.reload();
  };

  return (
    <Modal open={isOpen} onClose={close} labelledBy="backup-dialog-title">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id="backup-dialog-title" className="font-serif text-xl">
          {error ? 'Yedek yüklenemedi' : 'Yedeği yükle'}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Kapat"
          className="-m-2 inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {error && (
        <>
          <p className="text-sm leading-relaxed">{error}</p>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={close} className="min-h-11 rounded-sm bg-ink px-5 text-sm text-page">
              Tamam
            </button>
          </div>
        </>
      )}

      {backup && (
        <>
          {backup.exportedAt && (
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
              {new Date(backup.exportedAt).toLocaleString('tr-TR')} tarihli yedek
            </p>
          )}
          <dl className="divide-y divide-rule border-y border-rule text-sm">
            {DATA_KEYS.filter((k) => backup.summary[k] !== undefined).map((k) => (
              <div key={k} className="flex items-baseline justify-between py-2">
                <dt>{DATA_KEY_LABELS[k]}</dt>
                <dd className="font-mono text-xs tabular-nums text-mute">
                  {k === 'theme' ? backup.values.theme : backup.summary[k]}
                </dd>
              </div>
            ))}
          </dl>
          {backup.skipped.length > 0 && (
            <p className="mt-3 text-xs text-mute">Okunamayan ya da tanınmayan {backup.skipped.length} alan atlandı.</p>
          )}

          {filled.length > 0 ? (
            <p className="mt-4 text-sm leading-relaxed">
              Bu cihazda zaten veri var ({filled.map((k) => DATA_KEY_LABELS[k]).join(', ')}).{' '}
              <strong className="font-medium">Boş alanlara ekle</strong> mevcut veriye dokunmaz.{' '}
              <strong className="font-medium">Yerine koy</strong> önce şu anki verinin yedeğini indirir, sonra
              yedektekiyle değiştirir.
            </p>
          ) : (
            <p className="mt-4 text-sm leading-relaxed">Bu cihazda henüz veri yok; yedek olduğu gibi yüklenecek.</p>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={close} className="min-h-11 px-3 text-sm text-mute hover:text-ink">
              Vazgeç
            </button>
            {filled.length > 0 && (
              <button
                type="button"
                onClick={() => apply('replace')}
                className="min-h-11 rounded-sm border border-mute px-4 text-sm hover:border-ink"
              >
                Yerine koy
              </button>
            )}
            <button
              type="button"
              onClick={() => apply('fill')}
              className="min-h-11 rounded-sm bg-ink px-5 text-sm text-page hover:opacity-90"
            >
              {filled.length > 0 ? 'Boş alanlara ekle' : 'Yükle'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
