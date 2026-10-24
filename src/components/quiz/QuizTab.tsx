'use client';

import { Trash2, Target } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface QuizTabProps {
  activeContentId: string;
}

export const QuizTab = ({ activeContentId }: QuizTabProps) => {
  const { quiz, answerQuizQuestion, deleteQuizQuestion, resetQuiz } = useStore();
  const currentQuiz = quiz.filter((q) => q.contentId === activeContentId);

  if (currentQuiz.length === 0)
    return (
      <div className={`text-center py-16 text-[var(--text-muted)] flex flex-col items-center gap-4 animate-fade-in`}>
        <div className={`p-4 rounded-full bg-[var(--card-solid)]`}>
          <Target size={32} className="opacity-50" />
        </div>
        <p className="text-xs sm:text-sm">
          Bu içerik için henüz Quiz yok.
          <br />
          AI sekmesinden oluşturabilirsiniz.
        </p>
      </div>
    );

  const correctCount = currentQuiz.filter((q) => q.userAnswer === q.correct).length;
  const answeredCount = currentQuiz.filter((q) => !!q.userAnswer).length;
  const wrongCount = answeredCount - correctCount;

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--card-muted)] flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-[10px] bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success-muted)]`}
          >
            Doğru: {correctCount}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-[10px] bg-[var(--danger-muted)] text-[var(--danger)] border border-[var(--danger-muted)]`}
          >
            Yanlış: {wrongCount}
          </span>
        </div>
        <button
          onClick={() => resetQuiz(activeContentId)}
          className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] px-3 py-1 rounded-[10px] transition-colors"
        >
          Sıfırla
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {currentQuiz.map((q, i) => {
          const isAnswered = !!q.userAnswer;
          const isActuallyCorrect = q.correct === q.userAnswer;
          return (
            <div
              key={q.id}
              className="relative group bg-[var(--card-solid)] backdrop-blur-sm border border-[var(--border)] rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => deleteQuizQuestion(q.id)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-[var(--danger)] text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"
              >
                <Trash2 size={12} />
              </button>
              <h4 className="text-sm font-semibold text-[var(--text)] mb-4 leading-relaxed">
                <span className="text-[#FF8C00] mr-1">{i + 1}.</span> {q.question}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const isSelected = q.userAnswer === opt;
                  let btnStyle =
                    'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#FF8C00] hover:text-[#FF8C00]';
                  if (isAnswered) {
                    if (q.correct === opt)
                      btnStyle = 'bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)] font-bold';
                    else if (isSelected)
                      btnStyle = 'bg-[var(--danger-muted)] border-[var(--danger)] text-[var(--danger)]';
                    else
                      btnStyle =
                        'bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] opacity-50 cursor-not-allowed';
                  }
                  return (
                    <button
                      key={opt}
                      disabled={isAnswered}
                      onClick={() => answerQuizQuestion(q.id, opt)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left text-xs sm:text-sm transition-all ${btnStyle}`}
                    >
                      <span className="w-6 h-6 shrink-0 rounded-full bg-black/10 dark:bg-black/30 flex items-center justify-center font-bold text-[10px]">
                        {opt}
                      </span>
                      <span className="flex-1">{q.options[opt as keyof typeof q.options]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
