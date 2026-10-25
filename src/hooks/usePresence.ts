import { useState, type AnimationEvent } from 'react';

/**
 * Açılıp kapanan yüzeyler (modal, widget, popover) için 150 ms solma (DESIGN §7.5).
 * `open` false olduğunda eleman hemen kaldırılmaz: `exiting` iken `animate-fade-out` oynar,
 * animasyon bitince (`onAnimationEnd`) DOM'dan çıkar.
 */
export const usePresence = (open: boolean) => {
  const [present, setPresent] = useState(open);
  // Önceki render'dan türetilen durum: effect yerine render sırasında güncellenir.
  if (open && !present) setPresent(true);

  return {
    present: open || present,
    exiting: !open && present,
    fadeClass: open ? 'animate-fade' : 'animate-fade-out',
    onAnimationEnd: (e: AnimationEvent) => {
      if (e.target === e.currentTarget && !open) setPresent(false);
    },
  };
};

/** Değer null'a dönünce son dolu hâlini döndürür: kapanış solması sürerken içerik boşalmasın. */
export const useRetained = <T>(value: T | null): T | null => {
  const [kept, setKept] = useState(value);
  if (value !== null && value !== kept) setKept(value);
  return value ?? kept;
};

/** İlk kez `true` olduktan sonra hep `true`: tembel yüklenen modal/widget ilk açılışta indirilir, sonra yerinde kalır. */
export const useMountedOnce = (open: boolean) => {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  return mounted || open;
};
