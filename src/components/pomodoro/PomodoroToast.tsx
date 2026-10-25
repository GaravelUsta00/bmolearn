'use client';

import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';

// Faz bitince kısa bilgi; mod renkle değil metinle belirtilir (DESIGN §8.5). Otomatik gizleme: usePomodoroEngine.
export const PomodoroToast = () => {
  const { message, type, visible } = useStore((s) => s.pomodoroToast);
  const hide = useStore((s) => s.hidePomodoroToast);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-16 z-[100] -translate-x-1/2 transition-opacity duration-150 ease-out ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      {message && (
        <div className="flex items-center gap-4 rounded-sm border border-rule bg-page py-2 pl-4 pr-1 text-ink shadow-page">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ribbon">
            {type === 'break' ? 'Mola' : 'Odak'}
          </span>
          <span className="text-sm">{message}</span>
          <button
            type="button"
            onClick={hide}
            aria-label="Bildirimi kapat"
            className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};
