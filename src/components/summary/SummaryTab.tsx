'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Markdown } from '@/components/ui/Markdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { newId } from '@/lib/id';

interface SummaryTabProps {
  activeContentId: string;
}

/** Özet (DESIGN §8.4): okuma ölçeği 16.5px / 1.75, ilk paragrafta italik başlangıç harfi. */
export const SummaryTab = ({ activeContentId }: SummaryTabProps) => {
  const summary = useStore((s) => s.summaries[activeContentId]);
  const addNote = useStore((s) => s.addNote);
  const [selectedText, setSelectedText] = useState('');

  // Fareyle ya da klavyeyle (Shift+ok) yapılan seçimi yakala.
  const readSelection = () => {
    setTimeout(() => setSelectedText(window.getSelection()?.toString().trim() ?? ''), 50);
  };

  const handleAddToNotes = () => {
    addNote({ id: newId(), contentId: activeContentId, text: `> ${selectedText}`, time: 0 });
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  if (!summary)
    return (
      <EmptyState title="Bu içerik için henüz özet yok." withAI>
        AI Sihirbazı bir istek hazırlar; yapay zekânın cevabını yapıştırınca özet, kartlar ve sorular oluşur.
      </EmptyState>
    );

  return (
    <div
      onPointerUp={readSelection}
      onKeyUp={(e) => {
        if (e.shiftKey || e.key === 'Shift') readSelection();
      }}
      className="custom-scrollbar relative flex-1 animate-fade overflow-y-auto px-5 py-6 sm:px-8"
    >
      {selectedText && (
        <div className="sticky top-0 z-20 mb-4 flex animate-fade justify-center">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleAddToNotes();
            }}
            onClick={(e) => {
              // Klavyeyle (Enter/Space) basıldığında; fareyle basışta pointerdown zaten ekledi.
              if (e.detail === 0) handleAddToNotes();
            }}
            className="min-h-11 rounded-sm bg-ink px-4 text-sm text-page shadow-page hover:opacity-90"
          >
            Seçili metni notlara ekle
          </button>
        </div>
      )}
      <Markdown className="md-summary mx-auto max-w-prose text-ink">{summary}</Markdown>
    </div>
  );
};
