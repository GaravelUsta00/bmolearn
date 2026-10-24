import { useState, useEffect } from 'react';

export const useFullscreen = () => {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => { setIsFocusMode(!!(document.fullscreenElement || (document as any).webkitFullscreenElement)); };
    document.addEventListener('fullscreenchange', handleFullscreenChange); 
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => { 
      document.removeEventListener('fullscreenchange', handleFullscreenChange); 
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange); 
    }
  }, []);

  const toggleFocusMode = async () => {
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      try { 
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); 
        else if ((document.documentElement as any).webkitRequestFullscreen) await (document.documentElement as any).webkitRequestFullscreen(); 
        setIsFocusMode(true); 
      } catch (e) { }
    } else {
      try { 
        if (document.exitFullscreen) await document.exitFullscreen(); 
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen(); 
        setIsFocusMode(false); 
      } catch (e) { }
    }
  };

  return { isFocusMode, toggleFocusMode };
};
