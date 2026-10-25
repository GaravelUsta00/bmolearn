import { useEffect, type RefObject } from 'react';
import { useStore } from '@/store/useStore';
import { isModalOpen } from '@/components/ui/Modal';

interface KeyboardShortcutsOptions {
  playerRef: RefObject<YT.Player | null>;
  noteInputRef: RefObject<HTMLInputElement | null>;
}

const isTextField = (el: HTMLElement) =>
  el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';

/**
 * Kısayollar:
 * - Alt+N: not alanına geç (her yerde).
 * - K ya da Space: videoyu oynat/duraklat (B21; eskiden Ctrl+Space). Yazı alanında, modal açıkken
 *   ve Space için bir düğme/bağlantı odaktayken çalışmaz (Space o düğmeye basar).
 */
export const useKeyboardShortcuts = ({ playerRef, noteInputRef }: KeyboardShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        useStore.getState().setActiveTab('notes');
        setTimeout(() => noteInputRef.current?.focus(), 100);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isModalOpen() || isTextField(target)) return;
      const isK = e.key.toLowerCase() === 'k';
      const isSpace = e.code === 'Space' || e.key === ' ';
      if (!isK && !isSpace) return;
      if (isSpace && target.closest('button, a[href], [role="button"], [role="tab"], summary, label')) return;
      if (useStore.getState().contentConfig.type !== 'video') return;

      const player = playerRef.current;
      if (!player?.getPlayerState) return;
      e.preventDefault();
      if (player.getPlayerState() === 1) player.pauseVideo();
      else player.playVideo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerRef, noteInputRef]);
};
