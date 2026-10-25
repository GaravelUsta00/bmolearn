'use client';

import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';
import { newId } from '@/lib/id';

// pdf.js yalnızca bir PDF açılınca yüklenir (ilk paketi büyütmez).
const PdfViewer = dynamic(() => import('@/components/player/PdfViewer').then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-mute">PDF hazırlanıyor…</p>,
});

interface ContentViewerProps {
  hostRef: (el: HTMLDivElement | null) => void;
  videoError: string | null;
  apiError: string | null;
  onRetry: () => void;
}

const PLACEHOLDER_TITLE = 'YouTube Video';

// Video bir "şekil" gibi: koyu sıcak zemin, altında italik açıklama (DESIGN §8.3).
// YouTube'un kendi kontrolleri kullanılır; özel oynatıcı kontrolü yok.
export const ContentViewer = ({ hostRef, videoError, apiError, onRetry }: ContentViewerProps) => {
  const {
    contentConfig,
    playlistItems,
    currentPlaylistIndex,
    activeContentId,
    addNote,
    setActiveTab,
    setPendingDocReload,
  } = useStore();
  const isVideo = contentConfig.type === 'video';
  const isPdf = contentConfig.type === 'document' && !!contentConfig.url && contentConfig.fileType === 'pdf';

  const quote = (text: string, page: number) => {
    addNote({ id: newId(), contentId: activeContentId, text: `> ${text} (s. ${page})`, time: 0 });
    setActiveTab('notes');
  };
  const blocked = isVideo && (videoError || apiError);

  const caption = isVideo
    ? contentConfig.title && contentConfig.title !== PLACEHOLDER_TITLE
      ? contentConfig.title
      : 'Video yükleniyor…'
    : contentConfig.title;
  const position =
    isVideo && playlistItems.length > 0 ? `Bölüm ${currentPlaylistIndex + 1} / ${playlistItems.length}` : null;

  return (
    <figure className="m-0">
      <div
        className={`relative w-full overflow-hidden rounded-sm bg-plate shadow-page ${isVideo ? 'aspect-video' : 'h-[75vh] min-h-[420px] lg:h-[calc(100vh-14rem)]'}`}
      >
        <div
          ref={hostRef}
          className={`absolute inset-0 z-10 h-full w-full ${isVideo && !blocked ? '' : 'pointer-events-none opacity-0'}`}
        />

        {contentConfig.type === 'document' && (
          <div className="absolute inset-0 z-20 flex h-full w-full flex-col bg-page">
            {isPdf ? (
              <PdfViewer url={contentConfig.url as string} title={contentConfig.title} onQuote={quote} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">PDF bu cihazda yok</p>
                <p className="max-w-md font-serif text-xl leading-snug">
                  Devam etmek için <em>{contentConfig.title}</em> dosyasını yeniden seç.
                </p>
                <button
                  type="button"
                  onClick={() => setPendingDocReload({ id: contentConfig.id, title: contentConfig.title })}
                  className="min-h-11 rounded-sm border border-mute px-5 text-sm hover:border-ink"
                >
                  Dosyayı seç
                </button>
              </div>
            )}
          </div>
        )}

        {blocked && (
          <div
            role="alert"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-plate px-6 text-center text-spine-ink"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] opacity-70">
              {apiError ? 'YouTube yüklenemedi' : 'Video oynatılamıyor'}
            </p>
            <p className="max-w-md font-serif text-lg leading-snug">
              {apiError
                ? 'Bağlantını kontrol et; reklam/izleme engelleyici YouTube’u engelliyor olabilir.'
                : videoError}
            </p>
            {apiError && (
              <button
                type="button"
                onClick={onRetry}
                className="min-h-11 rounded-sm border border-spine-ink/60 px-5 text-sm hover:border-spine-ink"
              >
                Yeniden dene
              </button>
            )}
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 px-1">
        <span className="min-w-0 truncate font-serif italic text-mute">{caption}</span>
        {position && <span className="shrink-0 font-mono text-[11px] tabular-nums text-mute">{position}</span>}
      </figcaption>
    </figure>
  );
};
