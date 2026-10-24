'use client';

import {
  Moon,
  Sun,
  Maximize,
  Minimize,
  BookOpen,
  Volume2,
  VolumeX,
  Bookmark,
  Music,
  Timer,
  Radio,
  History,
  Download,
  Target,
  ListVideo,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Logo } from '@/components/ui/Logo';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { SettingsPopover } from '@/components/layout/SettingsPopover';
import type { Setter } from '@/types';

interface AppHeaderProps {
  showPlaylistSidebar: boolean;
  setShowPlaylistSidebar: Setter<boolean>;
  setShowHistory: Setter<boolean>;
  setShowInstallModal: Setter<boolean>;
  showPomodoroWidget: boolean;
  setShowPomodoroWidget: Setter<boolean>;
  isTimerRunning: boolean;
  showMusicWidget: boolean;
  setShowMusicWidget: Setter<boolean>;
  isMusicPlaying: boolean;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

export const AppHeader = ({
  showPlaylistSidebar,
  setShowPlaylistSidebar,
  setShowHistory,
  setShowInstallModal,
  showPomodoroWidget,
  setShowPomodoroWidget,
  isTimerRunning,
  showMusicWidget,
  setShowMusicWidget,
  isMusicPlaying,
  isFocusMode,
  toggleFocusMode,
}: AppHeaderProps) => {
  const { theme, setTheme, globalMuted, notes, flashcards, quiz, installPrompt, playlistItems, toggleGlobalMute } =
    useStore();

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => useStore.setState({ installPrompt: null }));
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <header
      className={`flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-40 backdrop-blur-xl gap-3`}
    >
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={() => useStore.getState().setView('landing')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
        >
          <Logo className="text-xl sm:text-2xl" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="hidden md:block mr-2 border-r border-[var(--border)] pr-4">
          <ProgressBar />
        </div>

        <div
          className={`hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-[var(--card-solid)] border border-[var(--border)] text-xs font-medium mr-2 transition-all`}
        >
          <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Notlar">
            <Bookmark size={14} /> {notes.length}
          </span>
          <span className={`w-1 h-1 rounded-full text-[var(--text-muted)]`}></span>
          <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Kartlar">
            <BookOpen size={14} /> {flashcards.length}
          </span>
          <span className={`w-1 h-1 rounded-full text-[var(--text-muted)]`}></span>
          <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Quiz Soruları">
            <Target size={14} /> {quiz.length}
          </span>
        </div>

        {playlistItems.length > 0 && (
          <button
            onClick={() => setShowPlaylistSidebar(!showPlaylistSidebar)}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${showPlaylistSidebar ? 'bg-[var(--primary-muted)] text-[#FF8C00] border border-[#FF8C00]/30' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00]'}`}
            title="Oynatma Listesi"
          >
            <ListVideo size={18} />
          </button>
        )}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-2 sm:p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors`}
          title="Temayı Değiştir"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={handleInstallClick}
          className={`p-2 sm:p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors`}
          title="Ana Ekrana Ekle"
        >
          <Download size={18} />
        </button>

        <button
          onClick={() => setShowHistory(true)}
          className={`p-2 sm:p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors`}
          title="Geçmiş"
        >
          <History size={18} />
        </button>
        <SettingsPopover />
        <div className={`hidden sm:block w-px h-5 border-[var(--border)] mx-1`}></div>

        <button
          onClick={() => setShowPomodoroWidget(!showPomodoroWidget)}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${showPomodoroWidget || isTimerRunning ? 'bg-[var(--primary-muted)] text-[#FF8C00]' : `hover:bg-[var(--hover-bg)] text-[var(--text-muted)]`}`}
          title="Odak ve Görevler"
        >
          <Timer size={18} className={isTimerRunning ? 'animate-pulse' : ''} />
        </button>

        <button
          onClick={() => setShowMusicWidget(!showMusicWidget)}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${showMusicWidget ? 'bg-[var(--primary-muted)] text-[#FF8C00]' : `hover:bg-[var(--hover-bg)] text-[var(--text-muted)]`}`}
          title="Odak Radyosu"
        >
          {isMusicPlaying ? <Radio className="animate-pulse" size={18} /> : <Music size={18} />}
        </button>
        <button
          onClick={toggleGlobalMute}
          className={`p-2.5 rounded-xl hover:bg-[var(--hover-bg)] ${globalMuted ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}
          title="Tüm Sesleri Sustur (Mute)"
        >
          {globalMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <button
          onClick={toggleFocusMode}
          className={`p-2.5 rounded-xl hover:bg-[var(--hover-bg)] ${isFocusMode ? 'text-[#FF8C00]' : 'text-[var(--text-muted)]'}`}
          title="Tam Ekran (F11)"
        >
          {isFocusMode ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </header>
  );
};
