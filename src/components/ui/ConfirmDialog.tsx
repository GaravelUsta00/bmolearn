'use client';

import { useId, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Geri alınamayan işlemler için onay (A2, B6, B7). İlk odak "Vazgeç"te: Enter'a yanlışlıkla basmak bir şey silmez. */
export const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const titleId = useId();
  const descId = useId();

  return (
    <Modal open={open} onClose={onCancel} labelledBy={titleId} describedBy={descId} role="alertdialog">
      <h2 id={titleId} className="font-serif text-xl leading-snug">
        {title}
      </h2>
      <div id={descId} className="mt-3 text-sm leading-relaxed text-mute">
        {children}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          data-autofocus
          onClick={onCancel}
          className="min-h-11 rounded-sm border border-mute px-4 text-sm text-ink hover:border-ink"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-11 rounded-sm bg-ribbon px-5 text-sm text-page hover:opacity-90"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
