'use client';

import type { ReactNode } from 'react';
import { useStore } from '@/store/useStore';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  /** AI Sihirbazı'nı açan metin düğmesi gösterilsin mi (özet, kart, soru). */
  withAI?: boolean;
}

// Panel sekmelerinin boş hâli: süs ikonu yok, kısa metin (DESIGN §2, §9).
export const EmptyState = ({ title, children, withAI }: EmptyStateProps) => (
  <div className="flex flex-1 animate-fade flex-col items-start justify-center gap-2 px-6 py-12 sm:px-8">
    <p className="font-serif text-lg italic text-ink">{title}</p>
    {children && <p className="max-w-sm text-sm leading-relaxed text-mute">{children}</p>}
    {withAI && (
      <button
        type="button"
        onClick={() => useStore.getState().setShowAIModal(true)}
        className="mt-2 min-h-11 text-sm text-ribbon underline decoration-rule underline-offset-4 hover:decoration-ribbon"
      >
        AI Sihirbazı&apos;nı aç
      </button>
    )}
  </div>
);
