'use client';

import { CalendarDays } from 'lucide-react';
import { useStore } from '@/store/useStore';

export const PomodoroHeatmap = () => {
  const { pomodoroHistory } = useStore();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
  return (
    <div className="mt-6 w-full p-4 bg-page border border-rule rounded-sm shadow-page">
      <h3 className="text-[10px] sm:text-xs font-bold text-mute mb-3 flex items-center gap-1.5 uppercase tracking-wider">
        <CalendarDays size={14} /> 30 Günlük Harita
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => {
          const count = pomodoroHistory[d] || 0;
          let bgColor = 'bg-rule';
          if (count > 0 && count <= 2) bgColor = 'bg-ribbon/40';
          else if (count > 2 && count <= 5) bgColor = 'bg-ribbon/70';
          else if (count > 5) bgColor = 'bg-ribbon';
          return (
            <div
              key={d}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${bgColor} transition-colors hover:ring-1 hover:ring-ink`}
              title={`${d}: ${count} Pomodoro`}
            />
          );
        })}
      </div>
    </div>
  );
};
