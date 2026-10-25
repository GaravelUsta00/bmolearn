'use client';

import { type RefObject } from 'react';
import { Plus, Trash2, Bookmark, Download } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatTime } from '@/lib/format';
import { Markdown } from '@/components/ui/Markdown';
import type { Setter } from '@/types';
import { newId } from '@/lib/id';

interface NotesTabProps {
  newNote: string;
  setNewNote: Setter<string>;
  noteInputRef: RefObject<HTMLInputElement | null>;
  copyFeedback: boolean;
  setCopyFeedback: Setter<boolean>;
  jumpToTime: (time: number) => void;
  playerRef: RefObject<YT.Player | null>;
}

export const NotesTab = ({
  newNote,
  setNewNote,
  noteInputRef,
  copyFeedback,
  setCopyFeedback,
  jumpToTime,
  playerRef,
}: NotesTabProps) => {
  const { notes, history, activeContentId, contentConfig, addNote, deleteNote } = useStore();

  const handleExportNotes = () => {
    const currentNotes = notes.filter((n) => n.contentId === activeContentId);
    if (currentNotes.length === 0) return alert('İndirilecek not bulunamadı.');
    const title = history.find((h) => h.contentId === activeContentId)?.title || 'BeLearn';
    const dateStr = new Date().toLocaleDateString('tr-TR');
    let content = `BeLearn — Çalışma Notları\nİçerik Başlığı: ${title}\nTarih: ${dateStr}\n-----------------------------------\n\n`;
    currentNotes.forEach((n) => {
      content += `[${n.time > 0 ? formatTime(n.time) : '-'}] ${n.text}\n`;
    });

    navigator.clipboard.writeText(content).catch(() => {});
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, '');
      a.download = `${safeTitle} - ${dateStr}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    } catch (error) {
      alert('İndirme kısıtlandı. Notlarınız panoya kopyalandı! Doğrudan bir belgeye yapıştırabilirsiniz.');
    }
  };

  const currentNotes = notes.filter((n) => n.contentId === activeContentId);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade relative">
      {currentNotes.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
          <button
            onClick={handleExportNotes}
            className={`p-2 rounded-sm bg-page hover:bg-ribbon hover:text-page text-mute transition-all border border-rule`}
            title="Notları İndir (TXT)"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
          </button>
          {copyFeedback && (
            <span className="text-[10px] bg-ok text-page px-2 py-1 rounded-sm font-bold shadow-page">Kopyalandı!</span>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-12 space-y-3 custom-scrollbar">
        {currentNotes.length === 0 ? (
          <div className={`text-center py-10 sm:py-16 text-mute flex flex-col items-center gap-4`}>
            <div className={`p-3 sm:p-4 rounded-full bg-page`}>
              <Bookmark size={24} className="sm:w-8 sm:h-8 opacity-50" />
            </div>
            <p className="text-xs sm:text-sm">Bu içerik için henüz not yok.</p>
          </div>
        ) : (
          currentNotes.map((note) => (
            <div
              key={note.id}
              className={`group flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-sm bg-page border border-transparent hover:border-rule transition-all shadow-page`}
            >
              {note.time > 0 && (
                <button
                  onClick={() => jumpToTime(note.time)}
                  className={`mt-0.5 px-2 sm:px-2.5 py-1 h-fit rounded-sm bg-ribbon/10 text-ribbon text-[10px] sm:text-xs font-mono font-bold hover:bg-ribbon/20`}
                >
                  {formatTime(note.time)}
                </button>
              )}
              <Markdown variant="note" className="min-w-0 flex-1 break-words text-xs leading-relaxed sm:text-sm">
                {note.text}
              </Markdown>
              <button
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-ribbon hover:bg-ribbon/10 rounded-sm"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          ))
        )}
      </div>
      <div className={`p-4 sm:p-5 border-t border-rule bg-paper`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newNote.trim()) return;
            const time =
              contentConfig.type === 'video' && playerRef.current?.getCurrentTime
                ? playerRef.current.getCurrentTime()
                : 0;
            addNote({ id: newId(), contentId: activeContentId, text: newNote, time });
            setNewNote('');
          }}
          className="relative"
        >
          <input
            ref={noteInputRef}
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Not al... (**kalın** veya - liste desteği var)"
            className={`w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-sm bg-page border border-rule focus:border-ribbon outline-none text-xs sm:text-sm text-ink transition-colors shadow-page`}
          />
          <button
            type="submit"
            className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-sm bg-ribbon text-page transition-transform`}
          >
            <Plus size={16} className="sm:w-4.5 sm:h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
