import { useState, useEffect } from 'react';

// Safari'nin önekli tam ekran API'si (TypeScript DOM tiplerinde yok).
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
const doc = () => document as WebkitDocument;

export const useFullscreen = () => {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFocusMode(!!(document.fullscreenElement || doc().webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFocusMode = async () => {
    if (!document.fullscreenElement && !doc().webkitFullscreenElement) {
      try {
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else await (document.documentElement as WebkitElement).webkitRequestFullscreen?.();
        setIsFocusMode(true);
      } catch (e) {}
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await doc().webkitExitFullscreen?.();
        setIsFocusMode(false);
      } catch (e) {}
    }
  };

  return { isFocusMode, toggleFocusMode };
};
