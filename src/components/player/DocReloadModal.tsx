'use client';

import { AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export const DocReloadModal = () => {
  const { pendingDocReload, setContentConfig, setPendingDocReload } = useStore();

  return (
    <>
      {pendingDocReload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plate/70">
          <div className="bg-page border border-rule rounded-sm w-full max-w-sm p-6 shadow-page relative text-center">
            <div className="w-16 h-16 bg-ribbon/10 text-ribbon rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">Dokümanı Yeniden Yükle</h3>
            <p className="text-sm text-ink mb-6 leading-relaxed">
              Güvenlik ve performans nedeniyle dosya içerikleri tarayıcıda saklanmaz. Geçmişteki notlarınıza ve AI
              özetinize ulaşmak için lütfen <strong className="text-ink">&quot;{pendingDocReload.title}&quot;</strong>{' '}
              adlı dosyanızı tekrar seçin.
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
                className="flex items-center justify-center w-full py-3.5 bg-ribbon hover:bg-ribbon/90 text-page font-bold text-sm rounded-sm cursor-pointer transition-colors shadow-page"
              >
                Dosyayı Seç ve Devam Et
              </label>
            </div>
            <button
              onClick={() => setPendingDocReload(null)}
              className="mt-4 text-sm font-semibold text-mute hover:text-ink transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </>
  );
};
