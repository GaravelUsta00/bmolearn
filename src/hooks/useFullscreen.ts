import { useState, useEffect } from 'react';

// Safari'nin önekli tam ekran API'si (TypeScript DOM tiplerinde yok).
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
const doc = () => document as WebkitDocument;

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || doc().webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && !doc().webkitFullscreenElement) {
      try {
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else await (document.documentElement as WebkitElement).webkitRequestFullscreen?.();
        setIsFullscreen(true);
      } catch {
        /* tarayıcı izin vermedi */
      }
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await doc().webkitExitFullscreen?.();
        setIsFullscreen(false);
      } catch {
        /* tarayıcı izin vermedi */
      }
    }
  };

  return { isFullscreen, toggleFullscreen };
};
