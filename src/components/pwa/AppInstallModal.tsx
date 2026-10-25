'use client';

import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export const AppInstallModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal open={isOpen} onClose={onClose} labelledBy="install-title" className="max-w-sm p-6">
    <div className="mb-4 flex items-start justify-between gap-4">
      <h2 id="install-title" className="font-serif text-xl">
        Ana ekrana ekle
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Kapat"
        className="-m-2 inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
    </div>
    <p className="text-sm leading-relaxed">BeLearn&apos;ü cihazına eklersen tam ekran ve daha hızlı açılır.</p>
    <dl className="mt-4 divide-y divide-rule border-y border-rule text-sm">
      <div className="py-3">
        <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Android · Chrome · Edge</dt>
        <dd className="mt-1 leading-relaxed">
          Tarayıcı menüsünden <strong className="font-medium">Ana ekrana ekle</strong>&apos;ye ya da adres çubuğundaki
          yükleme simgesine dokun.
        </dd>
      </div>
      <div className="py-3">
        <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">iPhone · iPad (Safari)</dt>
        <dd className="mt-1 leading-relaxed">
          <strong className="font-medium">Paylaş</strong> simgesine, ardından{' '}
          <strong className="font-medium">Ana Ekrana Ekle</strong>&apos;ye dokun.
        </dd>
      </div>
    </dl>
  </Modal>
);
