'use client';

import { useStore } from '@/store/useStore';
import { lastLocalDays } from '@/lib/date';

const DAYS = 30;

// Bordo opaklık basamakları (DESIGN §8.5). Günler yerel tarihe göre (B4).
const level = (count: number) =>
  count === 0 ? 'bg-rule' : count <= 2 ? 'bg-ribbon/35' : count <= 5 ? 'bg-ribbon/65' : 'bg-ribbon';

const formatDay = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

export const PomodoroHeatmap = () => {
  const pomodoroHistory = useStore((s) => s.pomodoroHistory);
  const days = lastLocalDays(DAYS);
  const total = days.reduce((sum, d) => sum + (pomodoroHistory[d] || 0), 0);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Son 30 gün</h3>
        <span className="font-mono text-[11px] tabular-nums text-mute">{total} pomodoro</span>
      </div>
      <ol className="mt-2 grid grid-cols-10 gap-1.5" aria-label="Son 30 günün pomodoro sayıları">
        {days.map((d) => {
          const count = pomodoroHistory[d] || 0;
          const label = `${formatDay(d)}: ${count} pomodoro`;
          return (
            <li key={d} title={label} className={`aspect-square rounded-sm ${level(count)}`}>
              <span className="sr-only">{label}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-2 flex items-center justify-end gap-1.5 font-mono text-[10px] text-mute" aria-hidden="true">
        az
        {['bg-rule', 'bg-ribbon/35', 'bg-ribbon/65', 'bg-ribbon'].map((c) => (
          <span key={c} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
        ))}
        çok
      </div>
    </div>
  );
};
