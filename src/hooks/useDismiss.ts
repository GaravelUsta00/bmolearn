import { useEffect, useRef } from 'react';

// Açık bir popover'ı dışarı tıklanınca ya da Escape'e basılınca kapatır.
export const useDismiss = <T extends HTMLElement>(open: boolean, close: () => void) => {
  const ref = useRef<T>(null);
  const closeRef = useRef(close);

  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Escape işlendi: aynı basış sinema modunu da kapatmasın (useKeyboardShortcuts defaultPrevented'a bakar).
      e.preventDefault();
      closeRef.current();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return ref;
};
