'use client';

import { type ComponentProps } from 'react';
import { List, BookOpen, Sparkles, Target, AlignLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
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

export const StudyPanel = ({ activeTab, setActiveTab, setShowAIModal, showPlaylistSidebar, ...notesTabProps }: StudyPanelProps) => {
  const { activeContentId, playlistItems } = useStore();

  return (
            <div className={`flex flex-col mt-[68px] h-125 md:h-150 lg:h-auto bg-[var(--card)] backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${showPlaylistSidebar && playlistItems.length > 0 ? 'w-full lg:w-[28%]' : 'w-full lg:w-[35%]'}`}>
              
              <div className={`flex border-b border-[var(--border)] p-2 items-center justify-between`}>
                <div className="flex overflow-x-auto custom-scrollbar flex-1 gap-1">
                  <button onClick={() => setActiveTab('notes')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'notes' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><List size={14} /> <span className="hidden sm:inline">Notlar</span></button>
                  <button onClick={() => setActiveTab('summary')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'summary' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><AlignLeft size={14} /> <span className="hidden sm:inline">Özet</span></button>
                  <button onClick={() => setActiveTab('flashcards')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'flashcards' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><BookOpen size={14} /> <span className="hidden sm:inline">Kartlar</span></button>
                  <button onClick={() => setActiveTab('quiz')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'quiz' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><Target size={14} /> <span className="hidden sm:inline">Quiz</span></button>
                </div>
                
                <button onClick={() => setShowAIModal(true)} className="ml-2 shrink-0 px-3 py-2 rounded-xl bg-[var(--info-muted)] text-[var(--info)] border border-[var(--info-muted)] hover:bg-[var(--info)] hover:text-white text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
                  <Sparkles size={14} /> <span className="hidden xl:inline">AI Sihirbazı</span>
                </button>
              </div>

              {activeTab === 'summary' && <SummaryTab activeContentId={activeContentId} />}

              {activeTab === 'notes' && <NotesTab {...notesTabProps} />}

              {activeTab === 'flashcards' && <FlashcardsTab activeContentId={activeContentId} />}
              {activeTab === 'quiz' && <QuizTab activeContentId={activeContentId} />}

            </div>
  );
};
