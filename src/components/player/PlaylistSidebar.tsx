'use client';

import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/store/useStore';

interface PlaylistSidebarProps {
  showPlaylistSidebar: boolean;
  handlePlaylistVideoSelect: (index: number) => void;
}

// Numaralı, sade satırlar; etkin bölüm bordo sol çizgi + italik (DESIGN §8.3).
export const PlaylistSidebar = ({ showPlaylistSidebar, handlePlaylistVideoSelect }: PlaylistSidebarProps) => {
  const { playlistItems, currentPlaylistIndex, history, contentConfig } = useStore(
    useShallow((s) => ({
      playlistItems: s.playlistItems,
      currentPlaylistIndex: s.currentPlaylistIndex,
      history: s.history,
      contentConfig: s.contentConfig,
    }))
  );

  if (!showPlaylistSidebar || playlistItems.length === 0) return null;

  // IFrame API yalnızca kimlik verir; izlenmiş bölümlerin başlıkları geçmişten bilinir.
  const known = new Map(
    (history.find((h) => h.id === contentConfig.pId)?.playlistItems ?? []).map((v) => [v.contentId, v.title])
  );

  return (
    <nav
      aria-label="Oynatma listesi"
      className="flex max-h-[400px] flex-col overflow-hidden rounded-sm border border-rule bg-page shadow-page lg:h-full lg:max-h-none"
    >
      <div className="flex shrink-0 items-baseline justify-between border-b border-rule px-4 py-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Oynatma listesi</h2>
        <span className="font-mono text-[11px] tabular-nums text-mute">{playlistItems.length} video</span>
      </div>
      <ol className="custom-scrollbar flex-1 overflow-y-auto py-1">
        {playlistItems.map((id, index) => {
          const active = currentPlaylistIndex === index;
          const title = known.get(id);
          return (
            <li key={`${id}-${index}`}>
              <button
                type="button"
                onClick={() => handlePlaylistVideoSelect(index)}
                aria-current={active ? 'true' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 border-l-2 py-2 pl-3 pr-4 text-left text-sm hover:bg-ink/5 ${active ? 'border-ribbon' : 'border-transparent'}`}
              >
                <span
                  className={`w-6 shrink-0 font-mono text-[11px] tabular-nums ${active ? 'text-ribbon' : 'text-mute'}`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element -- YouTube küçük resmi; optimizasyon gerekmez */}
                <img
                  src={`https://img.youtube.com/vi/${id}/default.jpg`}
                  alt=""
                  width={64}
                  height={36}
                  loading="lazy"
                  className="h-9 w-16 shrink-0 rounded-sm bg-plate object-cover"
                />
                <span className={`min-w-0 flex-1 truncate ${active ? 'font-serif italic text-ink' : 'text-ink'}`}>
                  {title ?? `Bölüm ${index + 1}`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
