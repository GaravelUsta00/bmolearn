'use client';

import { Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useMountedOnce } from '@/hooks/usePresence';
import type { useRadio } from '@/hooks/useRadio';
import { AppHeader } from '@/components/layout/AppHeader';
import { StudyPanel } from '@/components/layout/StudyPanel';
import { ContentToolbar } from '@/components/player/ContentToolbar';
import { ContentViewer } from '@/components/player/ContentViewer';
import { PlaylistSidebar } from '@/components/player/PlaylistSidebar';

// İlk açılışta indirilir (P3). Her biri kendi <Suspense> sınırında: indirilirken çalışma ekranı gizlenmesin.
const AIModal = dynamic(() => import('@/components/ai/AIModal').then((m) => m.AIModal));
const RadioWidget = dynamic(() => import('@/components/radio/RadioWidget').then((m) => m.RadioWidget));

interface StudyScreenProps {
  radio: Omit<ReturnType<typeof useRadio>, 'hostRef' | 'ensure'>;
}

/** Çalışma ekranı: üst çubuk, kaynak, video/PDF, oynatma listesi ve panel. Landing paketinden ayrı yüklenir. */
export default function StudyScreen({ radio }: StudyScreenProps) {
  const activeContentId = useStore((s) => s.activeContentId);
  const contentConfig = useStore((s) => s.contentConfig);
  const hasPlaylist = useStore((s) => s.playlistItems.length > 0);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const showAIModal = useStore((s) => s.showAIModal);
  const setShowAIModal = useStore((s) => s.setShowAIModal);
  const showPlaylistSidebar = useStore((s) => s.showPlaylistSidebar);
  const setShowPlaylistSidebar = useStore((s) => s.setShowPlaylistSidebar);
  const showMusicWidget = useStore((s) => s.showMusicWidget);
  const setShowMusicWidget = useStore((s) => s.setShowMusicWidget);
  const setShowHistory = useStore((s) => s.setShowHistory);
  const setShowInstallModal = useStore((s) => s.setShowInstallModal);
  const videoUrlInput = useStore((s) => s.videoUrlInput);
  const setVideoUrlInput = useStore((s) => s.setVideoUrlInput);
  const focusMode = useStore((s) => s.focusMode);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const sidebarVisible = showPlaylistSidebar && hasPlaylist;

  const {
    hostRef: playerHostRef,
    playerRef,
    videoError,
    apiError,
    retry: retryPlayer,
    jumpToTime,
    selectPlaylistIndex,
  } = useYouTubePlayer();
  useKeyboardShortcuts({ playerRef, noteInputRef });
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const aiMounted = useMountedOnce(showAIModal);
  const radioMounted = useMountedOnce(showMusicWidget);

  return (
    <div
      data-focus-mode={focusMode}
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-paper text-ink"
    >
      {aiMounted && (
        <Suspense fallback={null}>
          <AIModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            activeContentId={activeContentId}
            contentConfig={contentConfig}
            setActiveTab={setActiveTab}
          />
        </Suspense>
      )}

      {radioMounted && (
        <Suspense fallback={null}>
          <RadioWidget
            showMusicWidget={showMusicWidget}
            setShowMusicWidget={setShowMusicWidget}
            activeStation={radio.station}
            isMusicPlaying={radio.isPlaying}
            musicVolume={radio.volume}
            setMusicVolume={radio.setVolume}
            toggleRadioPlay={radio.toggle}
            changeStation={radio.changeStation}
            error={radio.error}
          />
        </Suspense>
      )}

      <AppHeader
        showPlaylistSidebar={showPlaylistSidebar}
        setShowPlaylistSidebar={setShowPlaylistSidebar}
        setShowHistory={setShowHistory}
        setShowInstallModal={setShowInstallModal}
        showMusicWidget={showMusicWidget}
        setShowMusicWidget={setShowMusicWidget}
        isMusicPlaying={radio.isPlaying}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      {/* Grid: araç çubuğu 1. satırda; video, oynatma listesi ve panel 2. satırda aynı hizadan başlar (T3) */}
      <main
        className={`relative z-0 mx-auto flex w-full max-w-[1700px] flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-4 lg:grid lg:grid-rows-[auto_1fr] lg:p-6 ${sidebarVisible ? 'lg:grid-cols-[minmax(0,1fr)_22%_28%]' : 'lg:grid-cols-[minmax(0,1fr)_35%]'}`}
      >
        <h1 className="sr-only">
          {contentConfig.title ? `${contentConfig.title} — BeLearn` : 'BeLearn çalışma ekranı'}
        </h1>
        {/* Sinema modu örtüsü main'in katmanında: video (.cinema-screen) üstüne çıkabilsin */}
        {focusMode && <div className="cinema-backdrop animate-fade" aria-hidden="true" />}
        <div className="cinema-lift lg:col-start-1 lg:row-start-1">
          <ContentToolbar
            videoUrlInput={videoUrlInput}
            setVideoUrlInput={setVideoUrlInput}
            setShowPlaylistSidebar={setShowPlaylistSidebar}
          />
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <ContentViewer hostRef={playerHostRef} videoError={videoError} apiError={apiError} onRetry={retryPlayer} />
        </div>

        {sidebarVisible && (
          <div className="cinema-lift lg:row-start-2">
            <PlaylistSidebar
              showPlaylistSidebar={showPlaylistSidebar}
              handlePlaylistVideoSelect={selectPlaylistIndex}
            />
          </div>
        )}

        <div className="cinema-lift lg:row-start-2">
          <StudyPanel noteInputRef={noteInputRef} jumpToTime={jumpToTime} playerRef={playerRef} />
        </div>
      </main>
    </div>
  );
}
