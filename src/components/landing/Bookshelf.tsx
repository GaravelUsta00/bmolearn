'use client';

import type { HistoryItem } from '@/types';

const SPINE_COLORS = ['bg-spine-1', 'bg-spine-2', 'bg-spine-3', 'bg-spine-4', 'bg-spine-5'];

// Aynı içerik her açılışta aynı renk ve yükseklikte görünsün diye id'den türetilir.
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const spineLabel = (item: HistoryItem) => {
  if (item.type === 'playlist') return `Koleksiyon · ${item.playlistItems?.length || 0} video`;
  if (item.type === 'document') return 'PDF';
  return 'Video';
};

const spineTitle = (item: HistoryItem) => item.title.replace(/^Koleksiyon:\s*/, '');

interface BookshelfProps {
  items: HistoryItem[];
  onOpen: (item: HistoryItem) => void;
}

export const Bookshelf = ({ items, onOpen }: BookshelfProps) => (
  <div>
    <ul className="custom-scrollbar flex items-end gap-1.5 overflow-x-auto px-1 pt-3" role="list">
      {items.map((item, i) => {
        const h = hash(item.id);
        return (
          <li key={item.id} className="animate-spine shrink-0" style={{ animationDelay: `${i * 40}ms` }}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              // Erişilebilir ad içerikten gelir ("Video Başlık"): görünen metinle aynı (WCAG 2.5.3)
              title={spineTitle(item)}
              className={`flex w-12 items-stretch justify-center gap-1.5 rounded-sm px-1 py-3 text-spine-ink shadow-page transition-transform duration-200 hover:-translate-y-2 focus-visible:-translate-y-2 sm:w-14 ${SPINE_COLORS[h % SPINE_COLORS.length]}`}
              style={{ height: `${184 + (h % 5) * 12}px` }}
            >
              {/* Dikey metin: rotate-180 ile alttan üste okunur; etiket ve başlık yan yana iki sütun */}
              <span className="block min-h-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] uppercase leading-none tracking-[0.1em] [writing-mode:vertical-rl] rotate-180">
                {spineLabel(item)}
              </span>
              <span className="block min-h-0 overflow-hidden text-ellipsis whitespace-nowrap font-serif text-sm leading-none [writing-mode:vertical-rl] rotate-180">
                {spineTitle(item)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
    <div className="h-1 rounded-sm bg-mute shadow-page" aria-hidden="true" />
  </div>
);
