'use client';

import { VolumeX, FileText, ExternalLink } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ContentViewerProps {
  videoError: boolean;
}

export const ContentViewer = ({ videoError }: ContentViewerProps) => {
  const { contentConfig } = useStore();

  return (
    <div
      className={`relative w-full aspect-video bg-page shadow-page transition-all duration-500 overflow-hidden rounded-sm border border-rule`}
    >
      <div
        className={`absolute inset-0 w-full h-full z-10 ${contentConfig.type === 'video' && !videoError ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div id="youtube-main-player" className="w-full h-full"></div>
      </div>

      {contentConfig.type === 'document' && (
        <div className="absolute inset-0 w-full h-full z-20 bg-paper flex flex-col">
          {contentConfig.url ? (
            contentConfig.fileType === 'application/pdf' || String(contentConfig.fileType).includes('pdf') ? (
              <iframe src={contentConfig.url} className="w-full h-full" />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-ink gap-4 bg-page px-6">
                <FileText size={64} className="text-ribbon" />
                <h3 className="text-xl sm:text-2xl font-bold text-ink">Desteklenmeyen Format</h3>
                <p className="text-sm text-center max-w-md text-mute">
                  <strong className="text-ribbon">{contentConfig.title}</strong> isimli dosya kaydedildi, ancak
                  tarayıcıda görüntülenebilmesi için <strong className="text-ink">PDF</strong> olması gerekmektedir.
                </p>
                <a
                  href="https://www.ilovepdf.com/tr"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 px-5 py-2.5 bg-page hover:bg-rule text-ink border border-rule rounded-sm text-xs font-medium transition-all flex items-center gap-2 shadow-page"
                >
                  Ücretsiz PDF&apos;e Dönüştür <ExternalLink size={14} />
                </a>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-mute gap-4">
              <FileText size={48} className="opacity-50 text-ribbon" />
              <p className="text-sm font-bold">Sadece PDF formatı desteklenir.</p>
            </div>
          )}
        </div>
      )}

      {contentConfig.type === 'video' && videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-mute text-sm gap-3 bg-paper">
          <VolumeX size={32} className="opacity-50 text-ribbon" />
          <p>Bu video oynatılamıyor (Silinmiş veya kısıtlanmış olabilir).</p>
        </div>
      )}
    </div>
  );
};
