'use client';

import { useStore } from '@/store/useStore';

export const ProgressBar = () => {
  const { flashcards, quiz, activeContentId } = useStore();
  const cards = flashcards.filter((c) => c.contentId === activeContentId);
  const quizzes = quiz.filter((q) => q.contentId === activeContentId);
  const total = cards.length + quizzes.length;
  const completed = cards.filter((c) => c.learned).length + quizzes.filter((q) => q.userAnswer).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

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
