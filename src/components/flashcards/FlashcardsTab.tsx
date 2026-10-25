'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Flashcard } from '@/types';

interface FlashcardsTabProps {
  activeContentId: string;
}

const faceLabel = 'font-mono text-[11px] uppercase tracking-[0.12em]';

interface FlipCardProps {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  large?: boolean;
}

/**
 * Çizgili defter kâğıdında 3B çevrilen kart (DESIGN §7.3, §8.4). Çevirme state ile yapılır (B13);
 * kart bir düğmedir: Enter/Space ile çevrilir, `aria-pressed` çevrili olduğunu söyler.
 */
const FlipCard = ({ card, flipped, onFlip, large }: FlipCardProps) => (
  <button
    type="button"
    onClick={onFlip}
    aria-pressed={flipped}
    data-flipped={flipped}
    title={flipped ? 'Soruya dön' : 'Cevabı gör'}
    className={`flip-scene block w-full text-left ${large ? 'h-72 sm:h-80' : 'h-36'}`}
  >
    <span className="flip-inner block">
      <span
        aria-hidden={flipped}
        className="flip-face notebook flex flex-col rounded-sm border border-rule bg-page pb-3 pl-12 pr-4 pt-3 shadow-page"
      >
        <span className={`${faceLabel} text-mute`}>Soru</span>
        <span
          className={`custom-scrollbar mt-1 overflow-y-auto leading-7 text-ink ${large ? 'text-lg sm:text-xl' : 'text-sm'}`}
        >
          {card.question}
        </span>
      </span>
      <span
        aria-hidden={!flipped}
        className="flip-face flip-face-back notebook flex flex-col rounded-sm border border-ribbon bg-page pb-3 pl-12 pr-4 pt-3 shadow-page"
      >
        <span className={`${faceLabel} text-ribbon`}>Cevap</span>
        <span
          className={`custom-scrollbar mt-1 overflow-y-auto font-serif italic leading-7 text-ink ${large ? 'text-lg sm:text-xl' : 'text-sm'}`}
        >
          {card.answer}
        </span>
      </span>
    </span>
  </button>
);

const LearnedButton = ({ card }: { card: Flashcard }) => {
  const toggle = useStore((s) => s.toggleFlashcardLearned);
  return (
    <button
      type="button"
      onClick={() => toggle(card.id)}
      aria-pressed={!!card.learned}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sm border px-4 text-sm ${card.learned ? 'border-ok text-ok' : 'border-mute text-ink hover:border-ink'}`}
    >
      <Check size={16} strokeWidth={1.5} aria-hidden="true" className={card.learned ? '' : 'opacity-40'} />
      Öğrendim
    </button>
  );
};

/** Çalışma modu: tek kart, önceki/sonraki. Kart değişince yeni bileşen = çevrilmemiş kart. */
const StudyCard = ({ card }: { card: Flashcard }) => {
  const [flipped, setFlipped] = useState(false);
  return <FlipCard card={card} flipped={flipped} onFlip={() => setFlipped(!flipped)} large />;
};

export const FlashcardsTab = ({ activeContentId }: FlashcardsTabProps) => {
  const flashcards = useStore((s) => s.flashcards);
  const deleteFlashcard = useStore((s) => s.deleteFlashcard);
  const resetFlashcards = useStore((s) => s.resetFlashcards);
  const currentCards = useMemo(
    () => flashcards.filter((c) => c.contentId === activeContentId),
    [flashcards, activeContentId]
  );
  const learnedCount = currentCards.filter((c) => c.learned).length;
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [rawIndex, setCurrentIndex] = useState(0);
  const [flippedIds, setFlippedIds] = useState<ReadonlySet<Flashcard['id']>>(new Set());

  if (currentCards.length === 0)
    return (
      <EmptyState title="Bu içerik için henüz kart yok." withAI>
        Kartlar AI Sihirbazı&apos;yla özetle birlikte oluşturulur.
      </EmptyState>
    );

  const currentIndex = Math.min(rawIndex, currentCards.length - 1);
  const toggleFlip = (id: Flashcard['id']) =>
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isStudyMode) {
    const currentCard = currentCards[currentIndex];
    return (
      <div className="flex min-h-0 flex-1 animate-fade flex-col">
        <div className="flex items-center justify-between border-b border-rule pl-1 pr-4 sm:pr-5">
          <button
            type="button"
            onClick={() => setIsStudyMode(false)}
            className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm text-mute hover:text-ink"
          >
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Geri dön
          </button>
          <span className="font-mono text-xs tabular-nums text-mute">
            Kart {currentIndex + 1} / {currentCards.length}
          </span>
        </div>
        <div className="custom-scrollbar flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto bg-paper p-4 sm:p-6">
          <div className="w-full max-w-md">
            <StudyCard key={currentCard.id} card={currentCard} />
          </div>
          <div className="grid w-full max-w-md grid-cols-[1fr_auto_1fr] gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="min-h-11 rounded-sm border border-mute text-sm text-ink hover:border-ink disabled:opacity-40"
            >
              Önceki
            </button>
            <LearnedButton card={currentCard} />
            <button
              type="button"
              onClick={() => setCurrentIndex(Math.min(currentCards.length - 1, currentIndex + 1))}
              disabled={currentIndex === currentCards.length - 1}
              className="min-h-11 rounded-sm border border-mute text-sm text-ink hover:border-ink disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 animate-fade flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 sm:px-5">
        <span className="font-mono text-xs tabular-nums text-mute">
          Öğrenilen {learnedCount} / {currentCards.length}
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => resetFlashcards(activeContentId)}
            className="min-h-11 text-sm text-mute underline decoration-rule underline-offset-4 hover:text-ink"
          >
            Sıfırla
          </button>
          <button
            type="button"
            onClick={() => {
              setIsStudyMode(true);
              setCurrentIndex(0);
            }}
            className="min-h-11 rounded-sm bg-ink px-4 text-sm text-page hover:opacity-90"
          >
            Çalış
          </button>
        </div>
      </div>
      <ul className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-paper p-4 sm:p-5">
        {currentCards.map((card) => (
          <li key={card.id}>
            <FlipCard card={card} flipped={flippedIds.has(card.id)} onFlip={() => toggleFlip(card.id)} />
            <div className="mt-1 flex items-center justify-between">
              <span
                className={`font-mono text-[11px] uppercase tracking-[0.12em] ${card.learned ? 'text-ok' : 'text-mute'}`}
              >
                {card.learned ? 'Öğrenildi' : 'Çevirmek için dokun'}
              </span>
              <button
                type="button"
                onClick={() => deleteFlashcard(card.id)}
                aria-label="Kartı sil"
                title="Kartı sil"
                className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ribbon"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
