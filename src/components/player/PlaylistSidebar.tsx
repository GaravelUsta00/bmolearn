'use client';

import { ListVideo } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface PlaylistSidebarProps {
  showPlaylistSidebar: boolean;
  handlePlaylistVideoSelect: (index: number) => void;
}

export const PlaylistSidebar = ({ showPlaylistSidebar, handlePlaylistVideoSelect }: PlaylistSidebarProps) => {
  const { playlistItems, currentPlaylistIndex } = useStore();

  return (
    <div
      className={`transition-all duration-500 ease-in-out flex flex-col overflow-hidden origin-left ${showPlaylistSidebar && playlistItems.length > 0 ? 'w-full lg:w-[22%] opacity-100 scale-100 bg-[var(--card)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-lg mt-[68px]' : 'w-0 opacity-0 scale-95 border-none m-0'}`}
    >
      <div className="w-full lg:min-w-[280px] h-full max-h-[400px] lg:max-h-auto flex flex-col">
        <div className="p-3 border-b border-[var(--border)] bg-[var(--card-solid)] flex justify-between items-center shrink-0">
          <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-[var(--text)]">
            <ListVideo size={16} className="text-[#FF8C00]" /> Oynatma Listesi
          </span>
          <span className="text-xs text-[var(--text-muted)] font-mono">{playlistItems.length} Video</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {playlistItems.map((id, index) => (
            <button
              key={`${id}-${index}`}
              onClick={() => handlePlaylistVideoSelect(index)}
              className={`w-full text-left p-2 rounded-xl flex gap-3 transition-all items-center border ${currentPlaylistIndex === index ? 'bg-[var(--primary-muted)] border-[#FF8C00]/50 shadow-sm' : 'hover:bg-[var(--hover-bg)] border-transparent'}`}
            >
              <span
                className={`text-[10px] font-bold w-4 text-center ${currentPlaylistIndex === index ? 'text-[#FF8C00]' : 'text-[var(--text-muted)]'}`}
              >
                {index + 1}
              </span>
              <img
                src={`https://img.youtube.com/vi/${id}/default.jpg`}
                className="w-16 h-10 sm:w-20 sm:h-12 object-cover rounded-md shadow-sm"
                loading="lazy"
              />
              <div className="flex-1 overflow-hidden">
                <p
                  className={`text-[10px] sm:text-xs font-semibold truncate ${currentPlaylistIndex === index ? 'text-[#FF8C00]' : 'text-[var(--text)]'}`}
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
