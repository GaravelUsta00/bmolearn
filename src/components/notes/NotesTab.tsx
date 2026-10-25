'use client';

import { useMemo, useState, type RefObject } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatTime } from '@/lib/format';
import { copyText } from '@/lib/clipboard';
import { Markdown } from '@/components/ui/Markdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { newId } from '@/lib/id';
import type { Note } from '@/types';

interface NotesTabProps {
  noteInputRef: RefObject<HTMLInputElement | null>;
  jumpToTime: (time: number) => void;
  playerRef: RefObject<YT.Player | null>;
}

const notesAsText = (notes: Note[], title: string) => {
  const dateStr = new Date().toLocaleDateString('tr-TR');
  let content = `BeLearn — Çalışma Notları\nİçerik Başlığı: ${title}\nTarih: ${dateStr}\n-----------------------------------\n\n`;
  notes.forEach((n) => {
    content += `[${n.time > 0 ? formatTime(n.time) : '-'}] ${n.text}\n`;
  });
  return { content, dateStr };
};

const toolButton =
  'min-h-11 text-sm text-mute underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-mute';

/** Yeni not girişi: yalnızca bu bileşen her tuşta render olur, not listesi olmaz (P1). */
const NoteComposer = ({ noteInputRef, playerRef }: Omit<NotesTabProps, 'jumpToTime'>) => {
  const activeContentId = useStore((s) => s.activeContentId);
  const contentType = useStore((s) => s.contentConfig.type);
  const newNote = useStore((s) => s.newNote);
  const setNewNote = useStore((s) => s.setNewNote);
  const addNote = useStore((s) => s.addNote);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        const time =
          contentType === 'video' && playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        addNote({ id: newId(), contentId: activeContentId, text: newNote, time });
        setNewNote('');
      }}
      className="flex items-center gap-2 border-t border-rule px-4 py-2 sm:px-5"
    >
      <label htmlFor="new-note" className="sr-only">
        Yeni not
      </label>
      <input
        id="new-note"
        ref={noteInputRef}
        type="text"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Not al… (**kalın** ya da - liste)"
        className="min-h-11 min-w-0 flex-1 border-b border-mute bg-transparent text-sm text-ink placeholder:text-mute focus:border-ribbon"
      />
      <button
        type="submit"
        aria-label="Notu ekle"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-ink text-page hover:opacity-90"
      >
        <Plus size={18} strokeWidth={1.5} />
      </button>
    </form>
  );
};

/** Notlar (DESIGN §8.4): solda zaman damgası sütunu, satırlar arası çizgi, alt çizgili giriş. */
export const NotesTab = ({ noteInputRef, jumpToTime, playerRef }: NotesTabProps) => {
  const allNotes = useStore((s) => s.notes);
  const activeContentId = useStore((s) => s.activeContentId);
  const contentTitle = useStore((s) => s.contentConfig.title);
  const copyFeedback = useStore((s) => s.copyFeedback);
  const setCopyFeedback = useStore((s) => s.setCopyFeedback);
  const deleteNote = useStore((s) => s.deleteNote);
  const [exportError, setExportError] = useState('');
  const currentNotes = useMemo(
    () => allNotes.filter((n) => n.contentId === activeContentId),
    [allNotes, activeContentId]
  );

  // B9: başlık geçmişten değil etkin içerikten gelir.
  const title = contentTitle || 'BeLearn';

  const handleDownload = () => {
    setExportError('');
    const { content, dateStr } = notesAsText(currentNotes, title);
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[\\/:*?"<>|]/g, '')} - ${dateStr}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError('İndirme engellendi. "Kopyala" ile notları panoya alabilirsin.');
    }
  };

  // B17: pano ayrı bir düğmede; Clipboard API yoksa yedek yöntem denenir.
  const handleCopy = async () => {
    setExportError('');
    if (await copyText(notesAsText(currentNotes, title).content)) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    } else {
      setExportError('Panoya kopyalanamadı. "İndir" ile metin dosyası olarak alabilirsin.');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 animate-fade flex-col">
      {currentNotes.length > 0 && (
        <div className="flex items-center justify-end gap-4 border-b border-rule px-4 sm:px-5">
          <p role="status" className="mr-auto text-sm text-ok">
            {copyFeedback ? 'Kopyalandı' : ''}
          </p>
          <button type="button" onClick={handleCopy} className={toolButton}>
            Kopyala
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={toolButton}
            title="Notları metin dosyası olarak indir"
          >
            İndir
          </button>
        </div>
      )}
      {exportError && (
        <p role="alert" className="border-b border-rule px-4 py-2 text-sm text-ribbon sm:px-5">
          {exportError}
        </p>
      )}

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {currentNotes.length === 0 ? (
          <EmptyState title="Bu içerik için henüz not yok.">
            Aşağıya yazıp Enter&apos;a bas. Videoda o anki saniye nota eklenir; Alt+N ile not alanına geçebilirsin.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-rule">
            {currentNotes.map((note) => (
              <li key={note.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-2 pl-2 sm:pl-3">
                {note.time > 0 ? (
                  <button
                    type="button"
                    onClick={() => jumpToTime(note.time)}
                    aria-label={`Videoda ${formatTime(note.time)} anına git`}
                    className="min-h-11 px-2 text-left font-mono text-xs tabular-nums text-ribbon underline decoration-transparent underline-offset-4 hover:decoration-ribbon"
                  >
                    {formatTime(note.time)}
                  </button>
                ) : (
                  <span className="min-h-11 px-2 py-3 font-mono text-xs text-mute" aria-hidden="true">
                    —
                  </span>
                )}
                <Markdown variant="note" className="min-w-0 break-words py-2.5 text-sm leading-relaxed text-ink">
                  {note.text}
                </Markdown>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  aria-label="Notu sil"
                  title="Notu sil"
                  className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ribbon"
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NoteComposer noteInputRef={noteInputRef} playerRef={playerRef} />
    </div>
  );
};
