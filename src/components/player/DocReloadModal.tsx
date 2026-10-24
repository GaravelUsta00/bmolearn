'use client';

import { AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export const DocReloadModal = () => {
  const { pendingDocReload, setContentConfig, setPendingDocReload } = useStore();

  return (
    <>
      {pendingDocReload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-[var(--primary-muted)] text-[#FF8C00] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Dokümanı Yeniden Yükle</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Güvenlik ve performans nedeniyle dosya içerikleri tarayıcıda saklanmaz. Geçmişteki notlarınıza ve AI
              özetinize ulaşmak için lütfen{' '}
              <strong className="text-[var(--text)]">&quot;{pendingDocReload.title}&quot;</strong> adlı dosyanızı tekrar
              seçin.
            </p>
            <div className="relative w-full">
              <input
                type="file"
                id="doc-reload-upload"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const objUrl = URL.createObjectURL(file);
                  setContentConfig({
                    id: pendingDocReload.id,
                    type: 'document',
                    title: pendingDocReload.title,
                    url: objUrl,
                    fileType: file.type || file.name.split('.').pop(),
                  });
                  setPendingDocReload(null);
                }}
                className="hidden"
              />
              <label
                htmlFor="doc-reload-upload"
                className="flex items-center justify-center w-full py-3.5 bg-[#FF8C00] hover:bg-[#ea580c] text-white font-bold text-sm rounded-xl cursor-pointer transition-colors shadow-lg shadow-[#FF8C00]/20 active:scale-95"
              >
                Dosyayı Seç ve Devam Et
              </label>
            </div>
            <button
              onClick={() => setPendingDocReload(null)}
              className="mt-4 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </>
  );
};
