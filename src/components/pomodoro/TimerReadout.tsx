'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { remainingMs } from '@/store/slices/pomodoroSlice';
import { formatTime } from '@/lib/format';

const TICK_MS = 250;

/**
 * Kalan süreyi gösteren TEK bileşen (P1): saniyede birkaç kez yalnızca bu yeniden çizilir;
 * uygulamanın geri kalanı zamanlayıcı yüzünden yeniden render olmaz.
 */
export const TimerReadout = ({ className = '' }: { className?: string }) => {
  const status = useStore((s) => s.timerStatus);
  const endsAt = useStore((s) => s.timerEndsAt);
  const stored = useStore((s) => s.timerRemainingMs);
  const mode = useStore((s) => s.timerMode);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [status]);

  const ms = remainingMs({ timerStatus: status, timerEndsAt: endsAt, timerRemainingMs: stored }, now);
  const text = formatTime(Math.ceil(ms / 1000));

  return (
    <span
      role="timer"
      aria-label={`${mode === 'break' ? 'Mola' : 'Odak'}: kalan süre ${text}`}
      className={`font-mono tabular-nums ${className}`}
    >
      {text}
    </span>
  );
};
