'use client';

import { type ComponentProps } from 'react';
import { Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { NotesTab } from '@/components/notes/NotesTab';
import { SummaryTab } from '@/components/summary/SummaryTab';
import { FlashcardsTab } from '@/components/flashcards/FlashcardsTab';
import { QuizTab } from '@/components/quiz/QuizTab';
import type { StudyTab, Setter } from '@/types';

interface StudyPanelProps extends ComponentProps<typeof NotesTab> {
  activeTab: StudyTab;
  setActiveTab: Setter<StudyTab>;
  setShowAIModal: Setter<boolean>;
  showPlaylistSidebar: boolean;
}

export const StudyPanel = ({
  activeTab,
  setActiveTab,
  setShowAIModal,
  showPlaylistSidebar,
  ...notesTabProps
}: StudyPanelProps) => {
  const { activeContentId, playlistItems, notes, summaries, flashcards, quiz } = useStore();

  // Sekme sayaçları (üst çubuktaki toplam sayaçların yerine; karar #2)
  const counts: Record<StudyTab, string> = {
    notes: String(notes.filter((n) => n.contentId === activeContentId).length),
    summary: summaries[activeContentId] ? '1' : '0',
    flashcards: String(flashcards.filter((c) => c.contentId === activeContentId).length),
    quiz: String(quiz.filter((q) => q.contentId === activeContentId).length),
  };
  const tabs: { id: StudyTab; label: string }[] = [
    { id: 'notes', label: 'Notlar' },
    { id: 'summary', label: 'Özet' },
    { id: 'flashcards', label: 'Kartlar' },
    { id: 'quiz', label: 'Quiz' },
  ];

  return (
    <div className="flex w-full flex-col h-125 md:h-150 lg:h-full bg-page rounded-sm border border-rule shadow-page overflow-hidden">
      <div className="flex items-end justify-between gap-2 border-b border-rule px-3">
        <div role="tablist" aria-label="Çalışma paneli" className="custom-scrollbar flex flex-1 gap-4 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`-mb-px flex min-h-11 shrink-0 items-baseline gap-1.5 border-b-2 text-sm ${activeTab === t.id ? 'border-ribbon text-ink' : 'border-transparent text-mute hover:text-ink'}`}
            >
              {t.label}
              <span className="font-mono text-[11px] tabular-nums text-mute">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAIModal(true)}
          className="mb-1.5 inline-flex min-h-9 shrink-0 items-center gap-1.5 text-sm text-ribbon underline decoration-rule underline-offset-4 hover:decoration-ribbon"
        >
          <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">AI Sihirbazı</span>
        </button>
      </div>
      <div className="border-b border-rule px-3 py-2">
        <ProgressBar />
      </div>

      {activeTab === 'summary' && <SummaryTab activeContentId={activeContentId} />}

      {activeTab === 'notes' && <NotesTab {...notesTabProps} />}

      {activeTab === 'flashcards' && <FlashcardsTab activeContentId={activeContentId} />}
      {activeTab === 'quiz' && <QuizTab activeContentId={activeContentId} />}
    </div>
  );
};
