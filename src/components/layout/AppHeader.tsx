'use client';

import { useState, type ReactNode } from 'react';
import {
  History,
  ListVideo,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Music,
  Radio,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useDismiss } from '@/hooks/useDismiss';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PomodoroControl } from '@/components/pomodoro/PomodoroControl';
import { SettingsContent } from '@/components/layout/SettingsMenu';
import type { PomodoroState } from '@/hooks/usePomodoroTimer';
import type { Setter } from '@/types';

interface IconButtonProps {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  expanded?: boolean;
  children: ReactNode;
}

const IconButton = ({ label, onClick, pressed, expanded, children }: IconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    aria-pressed={pressed}
    aria-expanded={expanded}
    className={`inline-flex h-11 w-11 items-center justify-center rounded-sm hover:text-ink ${pressed ? 'text-ribbon' : 'text-mute'}`}
  >
    {children}
  </button>
);

interface MenuRowProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  pressed?: boolean;
}

const MenuRow = ({ icon, label, onClick, pressed }: MenuRowProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={pressed}
    className={`flex min-h-11 w-full items-center gap-3 text-left text-sm hover:text-ink ${pressed ? 'text-ribbon' : 'text-ink'}`}
  >
    <span className="text-mute">{icon}</span>
    {label}
  </button>
);

interface AppHeaderProps {
  pomodoro: PomodoroState;
  setShowPomodoroWidget: Setter<boolean>;
  showPlaylistSidebar: boolean;
  setShowPlaylistSidebar: Setter<boolean>;
  setShowHistory: Setter<boolean>;
  setShowInstallModal: Setter<boolean>;
  showMusicWidget: boolean;
  setShowMusicWidget: Setter<boolean>;
  isMusicPlaying: boolean;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

export const AppHeader = ({
  pomodoro,
  setShowPomodoroWidget,
  showPlaylistSidebar,
  setShowPlaylistSidebar,
  setShowHistory,
  setShowInstallModal,
  showMusicWidget,
  setShowMusicWidget,
  isMusicPlaying,
  isFocusMode,
  toggleFocusMode,
}: AppHeaderProps) => {
  const { theme, setTheme, globalMuted, installPrompt, playlistItems, toggleGlobalMute } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const settingsRef = useDismiss<HTMLDivElement>(settingsOpen, () => setSettingsOpen(false));
  const menuRef = useDismiss<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => useStore.setState({ installPrompt: null }));
    } else {
      setShowInstallModal(true);
    }
  };

  const hasPlaylist = playlistItems.length > 0;
  const radioLabel = isMusicPlaying ? 'Odak radyosu (çalıyor)' : 'Odak radyosu';
  const nextThemeLabel = theme === 'dark' ? 'Gündüz' : 'Gece';
  const closeMenuAnd = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-page">
      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-3 px-3 py-1.5 sm:px-6">
        <button
          type="button"
          onClick={() => useStore.getState().setView('landing')}
          className="min-h-11 px-1 hover:opacity-80"
          aria-label="BeLearn ana sayfa"
        >
          <Logo className="text-xl" />
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <PomodoroControl pomodoro={pomodoro} onOpenWidget={() => setShowPomodoroWidget(true)} />

          {/* Masaüstü: ikon düğmeleri */}
          <div className="ml-2 hidden items-center gap-0.5 border-l border-rule pl-2 sm:flex">
            {hasPlaylist && (
              <IconButton
                label="Oynatma listesi"
                pressed={showPlaylistSidebar}
                onClick={() => setShowPlaylistSidebar(!showPlaylistSidebar)}
              >
                <ListVideo size={18} strokeWidth={1.5} />
              </IconButton>
            )}
            <ThemeToggle />
            <IconButton label="Geçmiş" onClick={() => setShowHistory(true)}>
              <History size={18} strokeWidth={1.5} />
            </IconButton>
            <IconButton
              label={radioLabel}
              pressed={showMusicWidget}
              onClick={() => setShowMusicWidget(!showMusicWidget)}
            >
              {isMusicPlaying ? <Radio size={18} strokeWidth={1.5} /> : <Music size={18} strokeWidth={1.5} />}
            </IconButton>
            <IconButton label="Tüm sesleri kapat" pressed={globalMuted} onClick={toggleGlobalMute}>
              {globalMuted ? <VolumeX size={18} strokeWidth={1.5} /> : <Volume2 size={18} strokeWidth={1.5} />}
            </IconButton>
            <IconButton label="Tam ekran" pressed={isFocusMode} onClick={toggleFocusMode}>
              {isFocusMode ? <Minimize size={18} strokeWidth={1.5} /> : <Maximize size={18} strokeWidth={1.5} />}
            </IconButton>
            <div ref={settingsRef} className="relative">
              <IconButton label="Ayarlar" expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>
                <SlidersHorizontal size={18} strokeWidth={1.5} />
              </IconButton>
              {settingsOpen && (
                <div
                  role="dialog"
                  aria-label="Ayarlar"
                  className="absolute right-0 top-full z-50 mt-2 w-72 animate-fade rounded-sm border border-rule bg-page p-4 shadow-page"
                >
                  <SettingsContent onInstall={handleInstallClick} />
                </div>
              )}
            </div>
          </div>

          {/* Mobil: tek "Menü" düğmesi */}
          <div ref={menuRef} className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              className="inline-flex min-h-11 items-center gap-1.5 px-2 font-mono text-xs uppercase tracking-[0.12em] text-mute hover:text-ink"
            >
              {menuOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
              Menü
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] animate-fade rounded-sm border border-rule bg-page p-4 shadow-page">
                <div className="divide-y divide-rule">
                  {hasPlaylist && (
                    <MenuRow
                      icon={<ListVideo size={16} strokeWidth={1.5} />}
                      label="Oynatma listesi"
                      pressed={showPlaylistSidebar}
                      onClick={closeMenuAnd(() => setShowPlaylistSidebar(!showPlaylistSidebar))}
                    />
                  )}
                  <MenuRow
                    icon={theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
                    label={`${nextThemeLabel} teması`}
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  />
                  <MenuRow
                    icon={<History size={16} strokeWidth={1.5} />}
                    label="Geçmiş"
                    onClick={closeMenuAnd(() => setShowHistory(true))}
                  />
                  <MenuRow
                    icon={
                      isMusicPlaying ? <Radio size={16} strokeWidth={1.5} /> : <Music size={16} strokeWidth={1.5} />
                    }
                    label={radioLabel}
                    pressed={showMusicWidget}
                    onClick={closeMenuAnd(() => setShowMusicWidget(!showMusicWidget))}
                  />
                  <MenuRow
                    icon={
                      globalMuted ? <VolumeX size={16} strokeWidth={1.5} /> : <Volume2 size={16} strokeWidth={1.5} />
                    }
                    label={globalMuted ? 'Sesleri aç' : 'Tüm sesleri kapat'}
                    pressed={globalMuted}
                    onClick={toggleGlobalMute}
                  />
                  <MenuRow
                    icon={
                      isFocusMode ? <Minimize size={16} strokeWidth={1.5} /> : <Maximize size={16} strokeWidth={1.5} />
                    }
                    label="Tam ekran"
                    pressed={isFocusMode}
                    onClick={closeMenuAnd(toggleFocusMode)}
                  />
                </div>
                <div className="mt-3 border-t border-rule pt-3">
                  <SettingsContent onInstall={closeMenuAnd(handleInstallClick)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
