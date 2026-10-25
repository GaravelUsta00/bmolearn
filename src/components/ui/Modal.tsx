'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '@/hooks/usePresence';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Açık modalların yığını: Escape ve odak tuzağı yalnızca en üsttekinde çalışır (onay diyaloğu bir modalın üstünde açılabilir).
const stack: symbol[] = [];

/** Herhangi bir modal açık mı? (Klavye kısayolları modal açıkken çalışmaz.) */
export const isModalOpen = () => stack.length > 0;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Başlık elemanının id'si (aria-labelledby). */
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  /** Panelin boyut/yerleşim sınıfları. */
  className?: string;
  children: ReactNode;
}

/**
 * Ortak modal (DESIGN §8.5, §10): role="dialog", aria-modal, Escape, odak tuzağı, odak iadesi,
 * düz `plate` örtü, açılış ve kapanışta 150 ms solma. İlk odak `data-autofocus` taşıyan elemana,
 * yoksa panelin kendisine verilir.
 */
export const Modal = ({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  className = 'max-w-md p-6',
  children,
}: ModalProps) => {
  const { present, exiting, fadeClass, onAnimationEnd } = usePresence(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const pressStartedOnOverlay = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const id = Symbol('modal');
    stack.push(id);
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Arka plan erişilemez olsun (ekran okuyucu sanal imleci, fare ve Tab): body'nin diğer çocukları inert.
    const overlay = panel?.parentElement ?? null;
    const madeInert = [...document.body.children].filter(
      (el) => el !== overlay && el.tagName !== 'SCRIPT' && !el.hasAttribute('inert')
    );
    madeInert.forEach((el) => el.setAttribute('inert', ''));
    (panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id || !panel) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      stack.splice(stack.indexOf(id), 1);
      madeInert.forEach((el) => el.removeAttribute('inert'));
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  if (!present) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-plate/60 p-4 ${fadeClass} ${exiting ? 'pointer-events-none' : ''}`}
      onAnimationEnd={onAnimationEnd}
      onPointerDown={(e) => {
        pressStartedOnOverlay.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressStartedOnOverlay.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        inert={exiting}
        className={`w-full rounded-sm border border-rule bg-page text-ink shadow-page focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
