import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

/** Gösterilen belge değişince eski blob URL'sini serbest bırakır (B10). */
export const useReleaseStaleDocumentUrls = () => {
  const url = useStore((s) => s.contentConfig.url);
  useEffect(() => {
    if (!url?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
};
