'use client';

import { ListVideo } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface PlaylistSidebarProps {
  showPlaylistSidebar: boolean;
  handlePlaylistVideoSelect: (index: number) => void;
}

export const PlaylistSidebar = ({ showPlaylistSidebar, handlePlaylistVideoSelect }: PlaylistSidebarProps) => {
  const { playlistItems, currentPlaylistIndex } = useStore();

  if (!showPlaylistSidebar || playlistItems.length === 0) return null;

  return (
    <div className="flex flex-col overflow-hidden bg-page rounded-sm border border-rule shadow-page lg:h-full">
      <div className="w-full h-full max-h-[400px] lg:max-h-none flex flex-col">
        <div className="p-3 border-b border-rule bg-page flex justify-between items-center shrink-0">
          <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-ink">
            <ListVideo size={16} className="text-ribbon" /> Oynatma Listesi
          </span>
          <span className="text-xs text-mute font-mono">{playlistItems.length} Video</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {playlistItems.map((id, index) => (
            <button
              key={`${id}-${index}`}
              onClick={() => handlePlaylistVideoSelect(index)}
              className={`w-full text-left p-2 rounded-sm flex gap-3 transition-all items-center border ${currentPlaylistIndex === index ? 'bg-ribbon/10 border-ribbon/50' : 'hover:bg-ink/5 border-transparent'}`}
            >
              <span
                className={`text-[10px] font-bold w-4 text-center ${currentPlaylistIndex === index ? 'text-ribbon' : 'text-mute'}`}
              >
                {index + 1}
              </span>
              <img
                src={`https://img.youtube.com/vi/${id}/default.jpg`}
                className="w-16 h-10 sm:w-20 sm:h-12 object-cover rounded-sm shadow-page"
                loading="lazy"
              />
              <div className="flex-1 overflow-hidden">
                <p
                  className={`text-[10px] sm:text-xs font-semibold truncate ${currentPlaylistIndex === index ? 'text-ribbon' : 'text-ink'}`}
                >
                  Bölüm #{index + 1}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
