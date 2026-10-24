'use client';

import { useStore } from '@/store/useStore';

export const BlueLightFilter = () => {
  const { blueLight } = useStore();
  if (blueLight === 0) return null;
  return (<div className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-500" style={{ backgroundColor: 'rgba(255, 140, 0, 0.25)', opacity: blueLight / 100, mixBlendMode: 'multiply' }}></div>);
}
