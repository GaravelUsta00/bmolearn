'use client';

import { X, MonitorSmartphone, Share, Smartphone } from 'lucide-react';

export const AppInstallModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-plate/60 p-4 animate-fade" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-page border border-rule rounded-sm shadow-page overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <MonitorSmartphone className="text-ribbon" /> Ana Ekrana Ekle
          </h3>
          <button onClick={onClose} className="text-mute hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-ink mb-6 leading-relaxed">
          BeLearn&apos;ü cihazınıza ekleyerek tam ekran ve daha hızlı bir deneyim yaşayabilirsiniz.
        </p>
        <div className="space-y-4">
          <div className="bg-page-2 p-4 rounded-sm border border-rule shadow-page">
            <h4 className="text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
              <Smartphone size={14} /> Android / Chrome / Edge
            </h4>
            <p className="text-xs text-mute">
              Tarayıcı menüsünden <strong>Ana Ekrana Ekle</strong> veya sağ üstteki indirme simgesine tıklayın.
            </p>
          </div>
          <div className="bg-page-2 p-4 rounded-sm border border-rule shadow-page">
            <h4 className="text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
              <Share size={14} /> iPhone / iPad (Safari)
            </h4>
            <p className="text-xs text-mute">
              Alt menüdeki <strong>Paylaş</strong> ikonuna dokunun ve <strong>Ana Ekrana Ekle</strong> seçeneğine
              tıklayın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
