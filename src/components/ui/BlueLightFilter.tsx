'use client';

import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/store/useStore';

export const BlueLightFilter = () => {
  const { blueLight } = useStore(useShallow((s) => ({ blueLight: s.blueLight })));
  if (blueLight === 0) return null;
  return (
    <div
      className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-500"
      style={{ backgroundColor: 'var(--filter-warm)', opacity: blueLight / 100, mixBlendMode: 'multiply' }}
    ></div>
  );
};
