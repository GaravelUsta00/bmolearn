'use client';

import { useState } from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { formatTime } from '@/lib/format';
import { useDismiss } from '@/hooks/useDismiss';
import type { PomodoroState } from '@/hooks/usePomodoroTimer';

const PRESETS: [number, number][] = [
  [25, 5],
  [50, 10],
  [90, 15],
];
const FOCUS_RANGE = { min: 1, max: 120 };
const BREAK_RANGE = { min: 1, max: 30 };

const clamp = (v: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, v));

interface DurationFieldProps {
  label: string;
  value: number;
  range: { min: number; max: number };
  disabled: boolean;
  onChange: (value: number) => void;
}

const DurationField = ({ label, value, range, disabled, onChange }: DurationFieldProps) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">{label}</span>
    <div className="flex items-center">
      <button
        type="button"
        disabled={disabled || value <= range.min}
        onClick={() => onChange(value - 1)}
        aria-label={`${label} süresini 1 dakika azalt`}
        className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink disabled:opacity-40"
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={range.min}
        max={range.max}
        value={value}
        disabled={disabled}
        aria-label={`${label} süresi (dakika)`}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="w-12 border-0 border-b border-mute bg-transparent text-center font-mono text-sm tabular-nums text-ink focus:border-ribbon focus:outline-none disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled || value >= range.max}
        onClick={() => onChange(value + 1)}
        aria-label={`${label} süresini 1 dakika artır`}
        className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink disabled:opacity-40"
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
      <span className="ml-1 text-sm text-mute">dk</span>
    </div>
  </div>
);

interface PomodoroControlProps {
  pomodoro: PomodoroState;
  onOpenWidget: () => void;
}

// Üst çubuktaki pomodoro kontrolü (docs/DESIGN.md §8.2.1). Widget ile aynı state'i kullanır.
export const PomodoroControl = ({ pomodoro, onOpenWidget }: PomodoroControlProps) => {
  const {
    focusDuration,
    setFocusDuration,
    breakDuration,
    setBreakDuration,
    timerMode,
    setTimerMode,
    timeLeft,
    setTimeLeft,
    isTimerRunning,
    setIsTimerRunning,
  } = pomodoro;
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const isBreak = timerMode === 'break';

  const changeFocus = (v: number) => {
    const next = clamp(v, FOCUS_RANGE);
    setFocusDuration(next);
    if (timerMode === 'focus') setTimeLeft(next * 60);
  };
  const changeBreak = (v: number) => {
    const next = clamp(v, BREAK_RANGE);
    setBreakDuration(next);
    if (timerMode === 'break') setTimeLeft(next * 60);
  };
  const applyPreset = ([f, b]: [number, number]) => {
    setFocusDuration(f);
    setBreakDuration(b);
    setTimeLeft((timerMode === 'focus' ? f : b) * 60);
  };
  const reset = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };
  const skipBreak = () => {
    setIsTimerRunning(false);
    setTimerMode('focus');
    setTimeLeft(focusDuration * 60);
  };

  const mainLabel = isTimerRunning ? 'Duraklat' : isBreak ? 'Molayı başlat' : 'Odaklan';

  return (
    <div ref={ref} className="relative flex items-center gap-2 sm:gap-3">
      <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-mute sm:inline">
        {isBreak ? 'Mola' : 'Odak'}
      </span>
      <span
        role="timer"
        aria-label={`${isBreak ? 'Mola' : 'Odak'}: kalan süre ${formatTime(timeLeft)}`}
        className={`font-mono text-sm tabular-nums ${isTimerRunning ? 'text-ink' : 'text-mute'}`}
      >
        {formatTime(timeLeft)}
      </span>
      <div className="flex items-stretch rounded-sm border border-mute">
        <button
          type="button"
          onClick={() => setIsTimerRunning(!isTimerRunning)}
          className="min-h-11 px-3 text-sm text-ink hover:bg-ink/5 sm:min-h-9"
        >
          {mainLabel}
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
          <div className="space-y-1">
            <DurationField
              label="Odak"
              value={focusDuration}
              range={FOCUS_RANGE}
              disabled={isTimerRunning}
              onChange={changeFocus}
            />
            <DurationField
              label="Mola"
              value={breakDuration}
              range={BREAK_RANGE}
              disabled={isTimerRunning}
              onChange={changeBreak}
            />
          </div>
          {isTimerRunning && <p className="mt-1 text-xs text-mute">Süreleri değiştirmek için önce duraklat.</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active = p[0] === focusDuration && p[1] === breakDuration;
              return (
                <button
                  key={p.join('/')}
                  type="button"
                  disabled={isTimerRunning}
                  onClick={() => applyPreset(p)}
                  aria-pressed={active}
                  className={`min-h-9 rounded-full border px-3 font-mono text-xs tabular-nums disabled:opacity-40 ${active ? 'border-ribbon text-ribbon' : 'border-mute text-mute hover:text-ink'}`}
                >
                  {p[0]} / {p[1]}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-rule pt-3 text-sm">
            <div className="flex gap-3">
              <button type="button" onClick={reset} className="min-h-9 text-mute hover:text-ink">
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
