'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import type { StudyTab } from '@/types';

import { useAppInit } from '@/hooks/useAppInit';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { useYouTubePlayers } from '@/hooks/useYouTubePlayers';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFullscreen } from '@/hooks/useFullscreen';

import { AppHeader } from '@/components/layout/AppHeader';
import { StudyPanel } from '@/components/layout/StudyPanel';
import { SkeletonLoading } from '@/components/ui/SkeletonLoading';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { BlueLightFilter } from '@/components/ui/BlueLightFilter';
import { PWAInjector } from '@/components/pwa/PWAInjector';
import { AppInstallModal } from '@/components/pwa/AppInstallModal';
import { LandingPage } from '@/components/landing/LandingPage';
import { HistoryModal } from '@/components/history/HistoryModal';
import { AIModal } from '@/components/ai/AIModal';
import { PomodoroToast } from '@/components/pomodoro/PomodoroToast';
import { PomodoroWidget } from '@/components/pomodoro/PomodoroWidget';
import { RadioWidget } from '@/components/radio/RadioWidget';
import { DocReloadModal } from '@/components/player/DocReloadModal';
import { ContentToolbar } from '@/components/player/ContentToolbar';
import { ContentViewer } from '@/components/player/ContentViewer';
import { PlaylistSidebar } from '@/components/player/PlaylistSidebar';

export default function App() {
  const { view, activeContentId, contentConfig } = useStore();

  // Görünümler arası (landing <-> app) korunması gereken UI state'i burada tutulur.
  const [activeTab, setActiveTab] = useState<StudyTab>('notes');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showPomodoroWidget, setShowPomodoroWidget] = useState<boolean>(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState<boolean>(false);
  const [showMusicWidget, setShowMusicWidget] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>('');
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const noteInputRef = useRef<HTMLInputElement>(null);

  const isInitializing = useAppInit();
  const pomodoro = usePomodoroTimer();
  const player = useYouTubePlayers(isInitializing);
  useKeyboardShortcuts({ contentConfig, playerRef: player.playerRef, noteInputRef, setActiveTab });
  const { isFocusMode, toggleFocusMode } = useFullscreen();

  if (isInitializing) return <SkeletonLoading />;

  return (
    <>
      <PWAInjector />
      <AppInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      <OfflineBanner />
      <BlueLightFilter />
      <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50">
        <div id="youtube-music-player"></div>
      </div>

      <PomodoroToast
        message={pomodoro.pomodoroToast.message}
        type={pomodoro.pomodoroToast.type}
        isVisible={pomodoro.pomodoroToast.isVisible}
        onClose={() => pomodoro.setPomodoroToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <DocReloadModal />

      {view === 'landing' && <LandingPage />}

      {view === 'app' && (
        <div
          className={`min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-400 animate-fade-in relative overflow-x-hidden`}
        >
          <HistoryModal showHistory={showHistory} setShowHistory={setShowHistory} />
          <AIModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            activeContentId={activeContentId}
            contentConfig={contentConfig}
            setActiveTab={setActiveTab}
          />

          <PomodoroWidget
            showPomodoroWidget={showPomodoroWidget}
            setShowPomodoroWidget={setShowPomodoroWidget}
            focusDuration={pomodoro.focusDuration}
            setFocusDuration={pomodoro.setFocusDuration}
            breakDuration={pomodoro.breakDuration}
            setBreakDuration={pomodoro.setBreakDuration}
            timerMode={pomodoro.timerMode}
            setTimerMode={pomodoro.setTimerMode}
            timeLeft={pomodoro.timeLeft}
            setTimeLeft={pomodoro.setTimeLeft}
            isTimerRunning={pomodoro.isTimerRunning}
            setIsTimerRunning={pomodoro.setIsTimerRunning}
          />
          <RadioWidget
            showMusicWidget={showMusicWidget}
            setShowMusicWidget={setShowMusicWidget}
            activeStation={player.activeStation}
            isMusicPlaying={player.isMusicPlaying}
            musicVolume={player.musicVolume}
            setMusicVolume={player.handleMusicVolumeChange}
            toggleRadioPlay={player.toggleRadioPlay}
            changeStation={player.changeStation}
          />

          <AppHeader
            showPlaylistSidebar={showPlaylistSidebar}
            setShowPlaylistSidebar={setShowPlaylistSidebar}
            setShowHistory={setShowHistory}
            setShowInstallModal={setShowInstallModal}
            showPomodoroWidget={showPomodoroWidget}
            setShowPomodoroWidget={setShowPomodoroWidget}
            isTimerRunning={pomodoro.isTimerRunning}
            showMusicWidget={showMusicWidget}
            setShowMusicWidget={setShowMusicWidget}
            isMusicPlaying={player.isMusicPlaying}
            isFocusMode={isFocusMode}
            toggleFocusMode={toggleFocusMode}
          />

          <main
            className={`flex-1 flex flex-col lg:flex-row p-3 sm:p-4 lg:p-6 gap-4 sm:gap-6 w-full max-w-[1700px] mx-auto relative z-0`}
          >
            <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out w-full`}>
              <ContentToolbar
                videoUrlInput={videoUrlInput}
                setVideoUrlInput={setVideoUrlInput}
                setShowPlaylistSidebar={setShowPlaylistSidebar}
              />
              <ContentViewer videoError={player.videoError} />
            </div>

            <PlaylistSidebar
              showPlaylistSidebar={showPlaylistSidebar}
              handlePlaylistVideoSelect={player.handlePlaylistVideoSelect}
            />

            <StudyPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setShowAIModal={setShowAIModal}
              showPlaylistSidebar={showPlaylistSidebar}
              newNote={newNote}
              setNewNote={setNewNote}
              noteInputRef={noteInputRef}
              copyFeedback={copyFeedback}
              setCopyFeedback={setCopyFeedback}
              jumpToTime={player.jumpToTime}
              playerRef={player.playerRef}
            />
          </main>
        </div>
      )}
    </>
  );
}
