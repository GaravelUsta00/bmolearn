'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

import { useAppInit } from '@/hooks/useAppInit';
import { usePomodoroEngine } from '@/hooks/usePomodoroEngine';
import { useReleaseStaleDocumentUrls } from '@/hooks/useReleaseStaleDocumentUrls';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useRadio } from '@/hooks/useRadio';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFullscreen } from '@/hooks/useFullscreen';

import { AppHeader } from '@/components/layout/AppHeader';
import { StudyPanel } from '@/components/layout/StudyPanel';
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
import { BackupDialog } from '@/components/backup/BackupDialog';
import { StorageNotices } from '@/components/ui/StorageNotices';
import { ContentToolbar } from '@/components/player/ContentToolbar';
import { ContentViewer } from '@/components/player/ContentViewer';
import { PlaylistSidebar } from '@/components/player/PlaylistSidebar';

export default function App() {
  // Görünümler arası (landing <-> app) korunan arayüz durumu store'un ui slice'ında (ANALYSIS K8).
  const {
    view,
    activeContentId,
    contentConfig,
    playlistItems,
    activeTab,
    setActiveTab,
    showHistory,
    setShowHistory,
    showInstallModal,
    setShowInstallModal,
    showAIModal,
    setShowAIModal,
    showPomodoroWidget,
    setShowPomodoroWidget,
    showPlaylistSidebar,
    setShowPlaylistSidebar,
    showMusicWidget,
    setShowMusicWidget,
    copyFeedback,
    setCopyFeedback,
    newNote,
    setNewNote,
    videoUrlInput,
    setVideoUrlInput,
  } = useStore();
  const noteInputRef = useRef<HTMLInputElement>(null);
  const sidebarVisible = showPlaylistSidebar && playlistItems.length > 0;

  useAppInit();
  usePomodoroEngine();
  useReleaseStaleDocumentUrls();
  const {
    hostRef: playerHostRef,
    playerRef,
    videoError,
    apiError,
    retry: retryPlayer,
    jumpToTime,
    selectPlaylistIndex,
  } = useYouTubePlayer();
  const {
    hostRef: radioHostRef,
    station,
    isPlaying: isRadioPlaying,
    volume: radioVolume,
    error: radioError,
    ensure: ensureRadio,
    toggle: toggleRadio,
    changeStation,
    setVolume: setRadioVolume,
  } = useRadio();
  // Radyo oynatıcısı ilk kez widget açılınca kurulur.
  useEffect(() => {
    if (showMusicWidget) ensureRadio();
  }, [showMusicWidget, ensureRadio]);
  useKeyboardShortcuts({ contentConfig, playerRef: playerRef, noteInputRef, setActiveTab });
  const { isFocusMode, toggleFocusMode } = useFullscreen();

  return (
    <>
      <PWAInjector />
      <AppInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      <OfflineBanner />
      <BlueLightFilter />
      <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50">
        <div ref={radioHostRef}></div>
      </div>

      <PomodoroToast />

      <DocReloadModal />
      <BackupDialog />
      <StorageNotices />
      <HistoryModal showHistory={showHistory} setShowHistory={setShowHistory} />

      {view === 'landing' && <LandingPage onShowHistory={() => setShowHistory(true)} />}

      {view === 'app' && (
        <div className="min-h-screen flex flex-col bg-paper text-ink relative overflow-x-hidden">
          <AIModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            activeContentId={activeContentId}
            contentConfig={contentConfig}
            setActiveTab={setActiveTab}
          />

          <PomodoroWidget showPomodoroWidget={showPomodoroWidget} setShowPomodoroWidget={setShowPomodoroWidget} />
          <RadioWidget
            showMusicWidget={showMusicWidget}
            setShowMusicWidget={setShowMusicWidget}
            activeStation={station}
            isMusicPlaying={isRadioPlaying}
            musicVolume={radioVolume}
            setMusicVolume={setRadioVolume}
            toggleRadioPlay={toggleRadio}
            changeStation={changeStation}
            error={radioError}
          />

          <AppHeader
            setShowPomodoroWidget={setShowPomodoroWidget}
            showPlaylistSidebar={showPlaylistSidebar}
            setShowPlaylistSidebar={setShowPlaylistSidebar}
            setShowHistory={setShowHistory}
            setShowInstallModal={setShowInstallModal}
            showMusicWidget={showMusicWidget}
            setShowMusicWidget={setShowMusicWidget}
            isMusicPlaying={isRadioPlaying}
            isFocusMode={isFocusMode}
            toggleFocusMode={toggleFocusMode}
          />

          {/* Grid: araç çubuğu 1. satırda; video, oynatma listesi ve panel 2. satırda aynı hizadan başlar (T3) */}
          <main
            className={`flex-1 flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6 w-full max-w-[1700px] mx-auto relative z-0 lg:grid lg:grid-rows-[auto_1fr] ${sidebarVisible ? 'lg:grid-cols-[minmax(0,1fr)_22%_28%]' : 'lg:grid-cols-[minmax(0,1fr)_35%]'}`}
          >
            <div className="lg:col-start-1 lg:row-start-1">
              <ContentToolbar
                videoUrlInput={videoUrlInput}
                setVideoUrlInput={setVideoUrlInput}
                setShowPlaylistSidebar={setShowPlaylistSidebar}
              />
            </div>
            <div className="lg:col-start-1 lg:row-start-2">
              <ContentViewer
                hostRef={playerHostRef}
                videoError={videoError}
                apiError={apiError}
                onRetry={retryPlayer}
              />
            </div>

            {sidebarVisible && (
              <div className="lg:row-start-2">
                <PlaylistSidebar
                  showPlaylistSidebar={showPlaylistSidebar}
                  handlePlaylistVideoSelect={selectPlaylistIndex}
                />
              </div>
            )}

            <div className="lg:row-start-2">
              <StudyPanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setShowAIModal={setShowAIModal}
                newNote={newNote}
                setNewNote={setNewNote}
                noteInputRef={noteInputRef}
                copyFeedback={copyFeedback}
                setCopyFeedback={setCopyFeedback}
                jumpToTime={jumpToTime}
                playerRef={playerRef}
              />
            </div>
          </main>
        </div>
      )}
    </>
  );
}
