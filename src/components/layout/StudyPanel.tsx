'use client';

import { memo, useRef, type ComponentProps, type KeyboardEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { NotesTab } from '@/components/notes/NotesTab';
import { SummaryTab } from '@/components/summary/SummaryTab';
import { FlashcardsTab } from '@/components/flashcards/FlashcardsTab';
import { QuizTab } from '@/components/quiz/QuizTab';
import type { StudyTab } from '@/types';

const TABS: { id: StudyTab; label: string }[] = [
  { id: 'notes', label: 'Notlar' },
  { id: 'summary', label: 'Özet' },
  { id: 'flashcards', label: 'Kartlar' },
  { id: 'quiz', label: 'Sorular' },
];

// Sekme sayaçları (üst çubuktaki toplam sayaçların yerine; karar #2). Her biri yalnızca kendi sayısına abone.
const useTabCount = (tab: StudyTab) =>
  useStore((s) => {
    const id = s.activeContentId;
    if (tab === 'notes') return s.notes.filter((n) => n.contentId === id).length;
    if (tab === 'summary') return s.summaries[id] ? 1 : 0;
    if (tab === 'flashcards') return s.flashcards.filter((c) => c.contentId === id).length;
    return s.quiz.filter((q) => q.contentId === id).length;
  });

const TabCount = ({ tab }: { tab: StudyTab }) => (
  <span className="font-mono text-[11px] tabular-nums text-mute">{useTabCount(tab)}</span>
);

/** Sağ panel: "açık kitap sayfası" (DESIGN §8.4). */
export const StudyPanel = memo(function StudyPanel(notesTabProps: ComponentProps<typeof NotesTab>) {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const activeContentId = useStore((s) => s.activeContentId);
  const tabRefs = useRef<Partial<Record<StudyTab, HTMLButtonElement | null>>>({});

  // WAI-ARIA sekme deseni: ok tuşları, Home/End; yalnızca etkin sekme Tab sırasında.
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === activeTab);
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % TABS.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + TABS.length) % TABS.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? TABS.length - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setActiveTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  return (
    <section
      aria-label="Çalışma paneli"
      className="flex h-140 w-full flex-col overflow-hidden rounded-sm border border-rule bg-page shadow-page md:h-150 lg:h-full"
    >
      <div className="flex items-end justify-between gap-2 border-b border-rule px-3 sm:px-4">
        <div
          role="tablist"
          aria-label="Çalışma paneli"
          className="custom-scrollbar flex flex-1 gap-4 overflow-x-auto sm:gap-5"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={activeTab === t.id}
              aria-controls="study-tabpanel"
              tabIndex={activeTab === t.id ? 0 : -1}
              onClick={() => setActiveTab(t.id)}
              onKeyDown={onTabKeyDown}
              className={`-mb-px flex min-h-11 shrink-0 items-baseline gap-1.5 border-b-2 pt-3 text-sm ${activeTab === t.id ? 'border-ribbon text-ink' : 'border-transparent text-mute hover:text-ink'}`}
            >
              {t.label}
              <TabCount tab={t.id} />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => useStore.getState().setShowAIModal(true)}
          aria-label="AI Sihirbazı"
          className="mb-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 text-sm text-ribbon underline decoration-rule underline-offset-4 hover:decoration-ribbon"
        >
          <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" />
          <span className="hidden sm:inline">AI Sihirbazı</span>
        </button>
      </div>
      <div className="border-b border-rule px-3 py-2 sm:px-4">
        <ProgressBar />
      </div>

      <div
        id="study-tabpanel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex min-h-0 flex-1 flex-col"
      >
        {activeTab === 'notes' && <NotesTab {...notesTabProps} />}
        {activeTab === 'summary' && <SummaryTab key={activeContentId} activeContentId={activeContentId} />}
        {activeTab === 'flashcards' && <FlashcardsTab key={activeContentId} activeContentId={activeContentId} />}
        {activeTab === 'quiz' && <QuizTab key={activeContentId} activeContentId={activeContentId} />}
      </div>
    </section>
  );
});
