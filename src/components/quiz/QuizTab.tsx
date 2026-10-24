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
      <div className={`text-center py-16 text-mute flex flex-col items-center gap-4 animate-fade`}>
        <div className={`p-4 rounded-full bg-page`}>
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
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade">
      <div className="px-5 py-3 border-b border-rule bg-page-2 flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-sm bg-ok/10 text-ok border border-ok/10`}>
            Doğru: {correctCount}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-sm bg-ribbon/10 text-ribbon border border-ribbon/10`}>
            Yanlış: {wrongCount}
          </span>
        </div>
        <button
          onClick={() => resetQuiz(activeContentId)}
          className="text-xs font-bold text-mute hover:text-ink bg-page border border-rule hover:bg-ink/5 px-3 py-1 rounded-sm transition-colors"
        >
          Sıfırla
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {currentQuiz.map((q, i) => {
          const isAnswered = !!q.userAnswer;
          const isActuallyCorrect = q.correct === q.userAnswer;
          return (
            <div key={q.id} className="relative group bg-page border border-rule rounded-sm p-4 sm:p-5 shadow-page">
              <button
                onClick={() => deleteQuizQuestion(q.id)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-ribbon text-page opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={12} />
              </button>
              <h4 className="text-sm font-semibold text-ink mb-4 leading-relaxed">
                <span className="text-ribbon mr-1">{i + 1}.</span> {q.question}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const isSelected = q.userAnswer === opt;
                  let btnStyle = 'bg-paper border-rule text-ink hover:border-ribbon hover:text-ribbon';
                  if (isAnswered) {
                    if (q.correct === opt) btnStyle = 'bg-ok/10 border-ok text-ok font-bold';
                    else if (isSelected) btnStyle = 'bg-ribbon/10 border-ribbon text-ribbon';
                    else btnStyle = 'bg-page border-rule text-mute opacity-50 cursor-not-allowed';
                  }
                  return (
                    <button
                      key={opt}
                      disabled={isAnswered}
                      onClick={() => answerQuizQuestion(q.id, opt)}
                      className={`flex items-center gap-3 p-3 rounded-sm border text-left text-xs sm:text-sm transition-all ${btnStyle}`}
                    >
                      <span className="w-6 h-6 shrink-0 rounded-full bg-ink/10 flex items-center justify-center font-bold text-[10px]">
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
