'use client';

import { useStore } from '@/store/useStore';

export const ProgressBar = () => {
  const { flashcards, quiz, activeContentId } = useStore();
  const cards = flashcards.filter(c => c.contentId === activeContentId); 
  const quizzes = quiz.filter(q => q.contentId === activeContentId);
  const total = cards.length + quizzes.length; 
  const completed = cards.filter(c => c.learned).length + quizzes.filter(q => q.userAnswer).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  return (
    <div className="flex flex-col w-28 sm:w-40 gap-1.5 mr-2">
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold tracking-wider uppercase"><span>İlerleme</span><span className="text-[#FF8C00]">{percentage}%</span></div>
      <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#FF8C00] transition-all duration-700 shadow-[0_0_10px_rgba(255,140,0,0.8)]" style={{ width: `${percentage}%` }}></div></div>
    </div>
  );
};
