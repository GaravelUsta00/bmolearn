'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { EmptyState } from '@/components/ui/EmptyState';

interface QuizTabProps {
  activeContentId: string;
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const;
const navButton = 'min-h-11 rounded-sm border border-mute px-4 text-sm text-ink hover:border-ink disabled:opacity-40';

/**
 * Sorular (DESIGN §8.4): tek soru görünümü + "Sonraki soru", ilerleme "3 / 10".
 * Cevaplar ve sayaçlar store'da; görünüm değişikliği veriyi etkilemez.
 */
export const QuizTab = ({ activeContentId }: QuizTabProps) => {
  const quiz = useStore((s) => s.quiz);
  const answerQuizQuestion = useStore((s) => s.answerQuizQuestion);
  const deleteQuizQuestion = useStore((s) => s.deleteQuizQuestion);
  const resetQuiz = useStore((s) => s.resetQuiz);
  const currentQuiz = useMemo(() => quiz.filter((q) => q.contentId === activeContentId), [quiz, activeContentId]);
  // İlk açılışta ilk cevaplanmamış soruya git.
  const [rawIndex, setIndex] = useState(() =>
    Math.max(
      0,
      currentQuiz.findIndex((q) => !q.userAnswer)
    )
  );
  const nextRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  if (currentQuiz.length === 0)
    return (
      <EmptyState title="Bu içerik için henüz soru yok." withAI>
        Sorular AI Sihirbazı&apos;yla özetle birlikte oluşturulur.
      </EmptyState>
    );

  const index = Math.min(rawIndex, currentQuiz.length - 1);
  const q = currentQuiz[index];
  const correctCount = currentQuiz.filter((x) => x.userAnswer === x.correct).length;
  const answeredCount = currentQuiz.filter((x) => !!x.userAnswer).length;
  const wrongCount = answeredCount - correctCount;
  const isAnswered = !!q.userAnswer;
  const isLast = index === currentQuiz.length - 1;

  const answer = (opt: string) => {
    answerQuizQuestion(q.id, opt);
    // Şıklar devre dışı kalınca odak kaybolmasın: sonraki soru düğmesine (son soruda sonuca) taşı.
    requestAnimationFrame(() => (isLast ? statusRef.current : nextRef.current)?.focus());
  };

  return (
    <div className="flex min-h-0 flex-1 animate-fade flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-rule px-4 sm:px-5">
        <p className="font-mono text-xs tabular-nums">
          <span className="text-ok">Doğru {correctCount}</span>
          <span className="text-mute"> · </span>
          <span className="text-ribbon">Yanlış {wrongCount}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            resetQuiz(activeContentId);
            setIndex(0);
          }}
          className="min-h-11 text-sm text-mute underline decoration-rule underline-offset-4 hover:text-ink"
        >
          Sıfırla
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <p className="pt-3 font-mono text-xs tabular-nums text-mute" aria-live="polite">
            Soru {index + 1} / {currentQuiz.length}
          </p>
          <button
            type="button"
            onClick={() => deleteQuizQuestion(q.id)}
            aria-label="Soruyu sil"
            title="Soruyu sil"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ribbon"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        </div>
        <h2 id="quiz-question" className="mt-1 font-serif text-[1.1875rem] leading-snug text-ink">
          {q.question}
        </h2>

        <ul aria-labelledby="quiz-question" className="mt-5 space-y-2">
          {OPTIONS.map((opt) => {
            const isCorrect = q.correct === opt;
            const isSelected = q.userAnswer === opt;
            let tone = 'border-mute text-ink hover:border-ink';
            if (isAnswered) {
              if (isCorrect) tone = 'border-ok text-ink';
              else if (isSelected) tone = 'border-ribbon text-ink';
              else tone = 'border-rule text-mute';
            }
            return (
              <li key={opt}>
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => answer(opt)}
                  className={`flex min-h-11 w-full items-start gap-3 rounded-sm border px-3 py-2.5 text-left text-sm ${tone}`}
                >
                  <span className="pt-px font-mono text-xs text-mute">{opt}</span>
                  <span className="flex-1">{q.options[opt]}</span>
                  {isAnswered && (isCorrect || isSelected) && (
                    <span className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[11px] uppercase tracking-[0.08em]">
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 text-ok">
                          <Check size={12} strokeWidth={2} aria-hidden="true" /> Doğru cevap
                        </span>
                      )}
                      {isSelected && (
                        <span className={`inline-flex items-center gap-1 ${isCorrect ? 'text-ok' : 'text-ribbon'}`}>
                          {!isCorrect && <X size={12} strokeWidth={2} aria-hidden="true" />} Senin cevabın
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p ref={statusRef} tabIndex={-1} role="status" className="mt-4 min-h-6 text-sm">
          {isAnswered &&
            (q.userAnswer === q.correct ? (
              <span className="text-ok">Doğru.</span>
            ) : (
              <span className="text-ribbon">Yanlış. Doğru cevap {q.correct}.</span>
            ))}
          {isAnswered && isLast && answeredCount === currentQuiz.length && (
            <span className="text-mute">
              {' '}
              Bitti: {correctCount} / {currentQuiz.length} doğru.
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-2 sm:px-5">
        <button type="button" onClick={() => setIndex(index - 1)} disabled={index === 0} className={navButton}>
          Önceki
        </button>
        <button
          ref={nextRef}
          type="button"
          onClick={() => setIndex(index + 1)}
          disabled={isLast}
          className={`${navButton} ${isAnswered && !isLast ? 'border-ink bg-ink text-page hover:opacity-90' : ''}`}
        >
          Sonraki soru
        </button>
      </div>
    </div>
  );
};
