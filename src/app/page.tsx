'use client';

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';

import { useAppInit } from '@/hooks/useAppInit';
import { usePomodoroEngine } from '@/hooks/usePomodoroEngine';
import { useReleaseStaleDocumentUrls } from '@/hooks/useReleaseStaleDocumentUrls';
import { useRadio } from '@/hooks/useRadio';
import { useMountedOnce } from '@/hooks/usePresence';

import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { BlueLightFilter } from '@/components/ui/BlueLightFilter';
import { PWAInjector } from '@/components/pwa/PWAInjector';
import { LandingPage } from '@/components/landing/LandingPage';
import { PomodoroToast } from '@/components/pomodoro/PomodoroToast';
import { StorageNotices } from '@/components/ui/StorageNotices';
import { useBackupDialog } from '@/components/backup/backupDialogStore';
import { loadStudyScreen } from '@/components/layout/preloadStudyScreen';

// Landing ilk boyamada yalnızca kendi kodunu indirir; çalışma ekranı ve pencereler ayrı paketlerde (P3).
// Pencereler kendi <Suspense> sınırında: ilk indirmede sayfanın geri kalanı gizlenmez.
const StudyScreen = dynamic(loadStudyScreen, {
  loading: () => <div className="min-h-screen bg-paper" aria-busy="true" />,
});
const HistoryModal = dynamic(() => import('@/components/history/HistoryModal').then((m) => m.HistoryModal));
const AppInstallModal = dynamic(() => import('@/components/pwa/AppInstallModal').then((m) => m.AppInstallModal));
const DocReloadModal = dynamic(() => import('@/components/player/DocReloadModal').then((m) => m.DocReloadModal));
const BackupDialog = dynamic(() => import('@/components/backup/BackupDialog').then((m) => m.BackupDialog));

export default function App() {
  // Yalnızca görünüm ve pencere bayraklarına abone: not yazmak ya da sayaç bu bileşeni render etmez (P1).
  const view = useStore((s) => s.view);
  const showHistory = useStore((s) => s.showHistory);
  const setShowHistory = useStore((s) => s.setShowHistory);
  const showInstallModal = useStore((s) => s.showInstallModal);
  const setShowInstallModal = useStore((s) => s.setShowInstallModal);
  const showMusicWidget = useStore((s) => s.showMusicWidget);
  const hasDocReload = useStore((s) => s.pendingDocReload !== null);
  const backupOpen = useBackupDialog((s) => s.isOpen);

  useAppInit();
  usePomodoroEngine();
  useReleaseStaleDocumentUrls();
  const { hostRef: radioHostRef, ensure: ensureRadio, ...radio } = useRadio();
  // Radyo oynatıcısı ilk kez widget açılınca kurulur; Landing'e dönünce de çalmaya devam eder.
  useEffect(() => {
    if (showMusicWidget) ensureRadio();
  }, [showMusicWidget, ensureRadio]);

  const historyMounted = useMountedOnce(showHistory);
  const installMounted = useMountedOnce(showInstallModal);
  const docReloadMounted = useMountedOnce(hasDocReload);
  const backupMounted = useMountedOnce(backupOpen);

  return (
    <>
      <PWAInjector />
      {installMounted && (
        <Suspense fallback={null}>
          <AppInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
        </Suspense>
      )}
      <OfflineBanner />
      <BlueLightFilter />
      <div className="pointer-events-none absolute -z-50 h-0 w-0 overflow-hidden opacity-0">
        <div ref={radioHostRef}></div>
      </div>

      <PomodoroToast />

      {docReloadMounted && (
        <Suspense fallback={null}>
          <DocReloadModal />
        </Suspense>
      )}
      {backupMounted && (
        <Suspense fallback={null}>
          <BackupDialog />
        </Suspense>
      )}
      <StorageNotices />
      {historyMounted && (
        <Suspense fallback={null}>
          <HistoryModal showHistory={showHistory} setShowHistory={setShowHistory} />
        </Suspense>
      )}

      {view === 'landing' && <LandingPage onShowHistory={() => setShowHistory(true)} />}
      {view === 'app' && <StudyScreen radio={radio} />}
    </>
  );
}
