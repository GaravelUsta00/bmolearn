'use client';

import { useState } from 'react';
import { Trash2, BookOpen, Play, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface FlashcardsTabProps {
  activeContentId: string;
}

export const FlashcardsTab = ({ activeContentId }: FlashcardsTabProps) => {
  const { flashcards, deleteFlashcard, toggleFlashcardLearned, resetFlashcards } = useStore();
  const currentCards = flashcards.filter((c) => c.contentId === activeContentId);
  const learnedCount = currentCards.filter((c) => c.learned).length;
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (currentCards.length === 0)
    return (
      <div
        className={`text-center py-10 sm:py-16 text-[var(--text-muted)] flex flex-col items-center gap-4 animate-fade-in`}
      >
        <div className={`p-3 sm:p-4 rounded-full bg-[var(--card-solid)]`}>
          <BookOpen size={24} className="sm:w-8 sm:h-8 opacity-50" />
        </div>
        <p className="text-xs sm:text-sm">
          Bu içerik için henüz Kart yok.
          <br />
          AI sekmesinden oluşturabilirsiniz.
        </p>
      </div>
    );

  if (isStudyMode) {
    const currentCard = currentCards[currentIndex];
    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--card-muted)] flex justify-between items-center">
          <button
            onClick={() => setIsStudyMode(false)}
            className="text-xs font-bold text-[#FF8C00] hover:text-orange-400 flex items-center gap-1 transition-colors"
          >
            <ArrowRight className="rotate-180" size={14} /> Geri Dön
          </button>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            Kart {currentIndex + 1} / {currentCards.length}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-[var(--bg)]">
          {currentCard && (
            <div
              key={currentCard.id}
              className="relative group perspective-1000 w-full max-w-md h-64 sm:h-80 cursor-pointer"
              onClick={(e) => {
                e.currentTarget.classList.toggle('flip-card');
              }}
            >
              <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
                <div
                  className={`absolute w-full h-full backface-hidden rounded-[20px] sm:rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-6 sm:p-8 flex items-center justify-center text-center shadow-xl`}
                >
                  <p className="font-medium text-base sm:text-lg text-[var(--text)]">{currentCard.question}</p>
                </div>
                <div
                  className={`absolute w-full h-full backface-hidden rounded-[20px] sm:rounded-3xl border border-[#FF8C00]/50 bg-[var(--primary-muted)] p-6 sm:p-8 flex items-center justify-center text-center rotate-y-180 shadow-xl`}
                >
                  <p className={`font-bold text-base sm:text-lg text-[#FF8C00]`}>{currentCard.answer}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--text)] rounded-2xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1 active:scale-95 shadow-sm"
            >
              Önceki
            </button>
            <button
              onClick={() => toggleFlashcardLearned(currentCard.id)}
              className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all active:scale-95 ${currentCard.learned ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]' : 'border-[var(--border)] bg-[var(--card-solid)] text-[var(--text-muted)] hover:border-[#FF8C00]'}`}
              title="Öğrendim İşaretle"
            >
              {currentCard.learned ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(currentCards.length - 1, currentIndex + 1))}
              disabled={currentIndex === currentCards.length - 1}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--text)] rounded-2xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1 active:scale-95 shadow-sm"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--card-muted)] flex justify-between items-center">
        <span className="text-xs font-bold text-[var(--text-muted)]">
          Öğrenilen: {learnedCount}/{currentCards.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => resetFlashcards(activeContentId)}
            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] px-3 py-1 rounded-[10px] transition-colors"
          >
            Sıfırla
          </button>
          <button
            onClick={() => {
              setIsStudyMode(true);
              setCurrentIndex(0);
            }}
            className="text-xs font-bold text-white bg-[#FF8C00] hover:bg-[#ea580c] px-3 py-1 rounded-[10px] flex items-center gap-1 transition-colors shadow-md"
          >
            <Play size={12} /> Çalış
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-[var(--bg)]">
        {currentCards.map((card) => (
          <div
            key={card.id}
            className={`relative group perspective-1000 h-24 sm:h-28 cursor-pointer ${card.learned ? 'opacity-60 hover:opacity-100' : ''}`}
            onClick={(e) => {
              e.currentTarget.classList.toggle('flip-card');
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFlashcard(card.id);
              }}
              className="absolute -top-2 -right-2 z-20 p-1.5 rounded-full bg-[var(--danger)] text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
            >
              <Trash2 size={12} />
            </button>
            {card.learned && (
              <div className="absolute top-2 left-2 z-10 text-[var(--success)] bg-[var(--bg)] rounded-full shadow-sm">
                <CheckCircle2 size={16} />
              </div>
            )}
            <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
              <div
                className={`absolute w-full h-full backface-hidden rounded-[20px] border ${card.learned ? 'border-[var(--success)]' : 'border-[var(--border)]'} bg-[var(--card-solid)] p-4 flex items-center justify-center text-center shadow-sm`}
              >
                <p className="font-medium text-xs sm:text-sm text-[var(--text)]">{card.question}</p>
              </div>
              <div
                className={`absolute w-full h-full backface-hidden rounded-[20px] border border-[#FF8C00]/50 bg-[var(--primary-muted)] p-4 flex items-center justify-center text-center rotate-y-180 shadow-md`}
              >
                <p className={`font-bold text-xs sm:text-sm text-[#FF8C00]`}>{card.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
