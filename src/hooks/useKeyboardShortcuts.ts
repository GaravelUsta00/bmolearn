import { useEffect, type RefObject } from 'react';
import type { ContentConfig, StudyTab, Setter } from '@/types';

interface KeyboardShortcutsOptions {
  contentConfig: ContentConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- YouTube player tipi Adım 6'da eklenecek
  playerRef: RefObject<any>;
  noteInputRef: RefObject<HTMLInputElement | null>;
  setActiveTab: Setter<StudyTab>;
}

export const useKeyboardShortcuts = ({ contentConfig, playerRef, noteInputRef, setActiveTab }: KeyboardShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement; 
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (e.altKey && e.key.toLowerCase() === 'n') { 
        e.preventDefault(); 
        setActiveTab('notes'); 
        setTimeout(() => noteInputRef.current?.focus(), 100); 
      }
      if (e.ctrlKey && e.code === 'Space' && !isInput && contentConfig.type === 'video') {
        e.preventDefault();
        if (playerRef.current?.getPlayerState) { 
          if (playerRef.current.getPlayerState() === 1) playerRef.current.pauseVideo(); 
          else playerRef.current.playVideo(); 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown); 
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contentConfig.type]);
};
