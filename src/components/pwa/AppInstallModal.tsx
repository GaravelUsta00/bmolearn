'use client';

import { X, MonitorSmartphone, Share, Smartphone } from 'lucide-react';

export const AppInstallModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <MonitorSmartphone className="text-[#FF8C00]" /> Ana Ekrana Ekle
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
          BMO Learn&apos;ü cihazınıza ekleyerek tam ekran ve daha hızlı bir deneyim yaşayabilirsiniz.
        </p>
        <div className="space-y-4">
          <div className="bg-[var(--card-muted)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <Smartphone size={14} /> Android / Chrome / Edge
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Tarayıcı menüsünden <strong>Ana Ekrana Ekle</strong> veya sağ üstteki indirme simgesine tıklayın.
            </p>
          </div>
          <div className="bg-[var(--card-muted)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <Share size={14} /> iPhone / iPad (Safari)
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Alt menüdeki <strong>Paylaş</strong> ikonuna dokunun ve <strong>Ana Ekrana Ekle</strong> seçeneğine
              tıklayın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
