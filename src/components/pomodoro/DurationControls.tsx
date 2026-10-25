'use client';

import { Minus, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { BREAK_RANGE, FOCUS_RANGE } from '@/store/slices/pomodoroSlice';

export const PRESETS: [number, number][] = [
  [25, 5],
  [50, 10],
  [90, 15],
];

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

/** Odak/mola süreleri ve hazır ayarlar; üst çubuk paneli ile widget aynı bileşeni kullanır. */
export const DurationControls = () => {
  const settings = useStore((s) => s.pomodoroSettings);
  const running = useStore((s) => s.timerStatus === 'running');
  const setFocusMinutes = useStore((s) => s.setFocusMinutes);
  const setBreakMinutes = useStore((s) => s.setBreakMinutes);
  const applyPreset = useStore((s) => s.applyPomodoroPreset);

  return (
    <div>
      <div className="space-y-1">
        <DurationField
          label="Odak"
          value={settings.focusMinutes}
          range={FOCUS_RANGE}
          disabled={running}
          onChange={setFocusMinutes}
        />
        <DurationField
          label="Mola"
          value={settings.breakMinutes}
          range={BREAK_RANGE}
          disabled={running}
          onChange={setBreakMinutes}
        />
      </div>
      {running && <p className="mt-1 text-xs text-mute">Süreleri değiştirmek için önce duraklat.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map(([f, b]) => {
          const active = f === settings.focusMinutes && b === settings.breakMinutes;
          return (
            <button
              key={`${f}/${b}`}
              type="button"
              disabled={running}
              onClick={() => applyPreset(f, b)}
              aria-pressed={active}
              className={`min-h-9 rounded-full border px-3 font-mono text-xs tabular-nums disabled:opacity-40 ${active ? 'border-ribbon text-ribbon' : 'border-mute text-mute hover:text-ink'}`}
            >
              {f} / {b}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Başlat/duraklat düğmesinin metni (karar #6). */
export const usePrimaryTimerAction = () => {
  const status = useStore((s) => s.timerStatus);
  const mode = useStore((s) => s.timerMode);
  const start = useStore((s) => s.startTimer);
  const pause = useStore((s) => s.pauseTimer);
  const running = status === 'running';
  return {
    running,
    label: running ? 'Duraklat' : mode === 'break' ? 'Molayı başlat' : status === 'paused' ? 'Devam et' : 'Odaklan',
    onClick: running ? pause : start,
  };
};
