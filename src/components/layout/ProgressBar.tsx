'use client';

import { useStore } from '@/store/useStore';

// Öğrenilen kart + cevaplanan soru oranı; tek sayı döndüren seçici, yalnızca yüzde değişince render.
const selectPercentage = (s: ReturnType<typeof useStore.getState>) => {
  const id = s.activeContentId;
  const cards = s.flashcards.filter((c) => c.contentId === id);
  const quizzes = s.quiz.filter((q) => q.contentId === id);
  const total = cards.length + quizzes.length;
  const completed = cards.filter((c) => c.learned).length + quizzes.filter((q) => q.userAnswer).length;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
};

export const ProgressBar = () => {
  const percentage = useStore(selectPercentage);

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">İlerleme</span>
      <div
        className="h-0.5 flex-1 bg-rule"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label="İlerleme"
      >
        <div className="h-full bg-ribbon transition-[width] duration-700" style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="font-mono text-[11px] tabular-nums text-ink">{percentage}%</span>
    </div>
  );
};
