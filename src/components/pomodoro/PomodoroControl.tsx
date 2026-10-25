'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useDismiss } from '@/hooks/useDismiss';
import { TimerReadout } from '@/components/pomodoro/TimerReadout';
import { DurationControls, usePrimaryTimerAction } from '@/components/pomodoro/DurationControls';

interface PomodoroControlProps {
  onOpenWidget: () => void;
}

// Üst çubuktaki pomodoro kontrolü (docs/DESIGN.md §8.2.1). Durum store'da; widget ile ortak.
export const PomodoroControl = ({ onOpenWidget }: PomodoroControlProps) => {
  const mode = useStore((s) => s.timerMode);
  const running = useStore((s) => s.timerStatus === 'running');
  const resetTimer = useStore((s) => s.resetTimer);
  const skipBreak = useStore((s) => s.skipBreak);
  const primary = usePrimaryTimerAction();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const isBreak = mode === 'break';

  return (
    <div ref={ref} className="relative flex items-center gap-2 sm:gap-3">
      <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-mute sm:inline">
        {isBreak ? 'Mola' : 'Odak'}
      </span>
      <TimerReadout className={`text-sm ${running ? 'text-ink' : 'text-mute'}`} />
      <div className="flex items-stretch rounded-sm border border-mute">
        <button
          type="button"
          onClick={primary.onClick}
          className="min-h-11 px-3 text-sm text-ink hover:bg-ink/5 sm:min-h-9"
        >
          {primary.label}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Pomodoro ayarları"
          aria-expanded={open}
          className="inline-flex min-h-11 w-9 items-center justify-center border-l border-mute text-mute hover:bg-ink/5 hover:text-ink sm:min-h-9"
        >
          <ChevronDown size={14} strokeWidth={1.5} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Pomodoro ayarları"
          className="absolute right-0 top-full z-50 mt-2 w-72 animate-fade rounded-sm border border-rule bg-page p-4 shadow-page"
        >
          <DurationControls />
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-rule pt-3 text-sm">
            <div className="flex gap-3">
              <button type="button" onClick={resetTimer} className="min-h-9 text-mute hover:text-ink">
                Sıfırla
              </button>
              {isBreak && (
                <button type="button" onClick={skipBreak} className="min-h-9 text-mute hover:text-ink">
                  Molayı atla
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenWidget();
              }}
              className="min-h-9 text-ink underline decoration-rule underline-offset-4 hover:decoration-mute"
            >
              Görevler ve harita →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
