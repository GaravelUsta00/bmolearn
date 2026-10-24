import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { RADIO_STATIONS } from '@/constants';

// Ana oynatıcı + radyo oynatıcısı. İkisi aynı API yükleme effect'iyle başlatıldığı için
// Adım 2'de birlikte taşındı; Adım 6'da useYouTubePlayer / useRadio olarak ayrılacak.
export const useYouTubePlayers = (isInitializing: boolean) => {
  const {
    view, globalMuted, contentConfig,
    setActiveContentId, updateVideoProgress, updateContentTitle, setPlaylistItems, setCurrentPlaylistIndex, addToHistory,
  } = useStore();

  const playerRef = useRef<any>(null); 
  const [videoError, setVideoError] = useState<boolean>(false);

  const [activeStation, setActiveStation] = useState(RADIO_STATIONS[0]);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(30);
  const musicPlayerRef = useRef<any>(null);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (view === 'app' && contentConfig.type === 'video' && playerRef.current?.getPlayerState) {
        if (playerRef.current.getPlayerState() === 1) { 
           const currentTime = playerRef.current.getCurrentTime();
           if (currentTime > 0) updateVideoProgress(useStore.getState().activeContentId || contentConfig.id, currentTime);
        }
      }
    }, 5000); 
    return () => clearInterval(progressInterval);
  }, [view, contentConfig, updateVideoProgress]);

  useEffect(() => {
    if (playerRef.current?.isMuted) globalMuted ? playerRef.current.mute() : playerRef.current.unMute();
    if (musicPlayerRef.current?.isMuted) globalMuted ? musicPlayerRef.current.mute() : musicPlayerRef.current.unMute();
  }, [globalMuted]);

  useEffect(() => {
    if (isInitializing) return; 
    const tryInitPlayers = () => {
      if (!window.YT || !document.getElementById('youtube-music-player')) { 
        setTimeout(tryInitPlayers, 100); 
        return; 
      }
      if (document.getElementById('youtube-main-player')) initMainPlayer();
      initMusicPlayer();
    };
    
    if (!window.YT) {
      const tag = document.createElement('script'); 
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0]; 
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = tryInitPlayers;
    } else { 
      tryInitPlayers(); 
    }
  }, [isInitializing]); 

  // ==========================================
  // PROFESYONEL PLAYER (OYNATICI) YÖNETİMİ
  // ==========================================
  const initMainPlayer = () => {
    if (playerRef.current?.destroy) { 
      try { playerRef.current.destroy(); } catch(e) {} 
    }
    
    const savedTime = useStore.getState().videoProgress[contentConfig.id] || 0;
    const playerVars: any = { 
      autoplay: 1, rel: 0, origin: typeof window !== 'undefined' ? window.location.origin : '', start: Math.floor(savedTime) 
    };

    if (contentConfig.pId) { 
      playerVars.listType = 'playlist'; 
      playerVars.list = contentConfig.pId; 
    }

    const playerOpts: any = {
      host: 'https://www.youtube.com', 
      playerVars: playerVars,
      events: {
        'onStateChange': (e: any) => {
          if (e.target.getVideoData) {
            const data = e.target.getVideoData();
            if (data.video_id) {
              if (contentConfig.type === 'video' && useStore.getState().activeContentId !== data.video_id) {
                setActiveContentId(data.video_id);
              }
              if (data.title && (e.data === window.YT.PlayerState.PLAYING || e.data === window.YT.PlayerState.CUED)) {
                if(useStore.getState().contentConfig.title !== data.title) updateContentTitle(data.title);
                addToHistory({ contentId: data.video_id, title: data.title, timestamp: Date.now(), type: 'video', pId: contentConfig.pId });
              }
            }
          }
          if (e.target.getPlaylist && (e.data === window.YT.PlayerState.PLAYING || e.data === window.YT.PlayerState.CUED)) {
            const pItems = e.target.getPlaylist();
            if (pItems && pItems.length > 0) {
              const currentItems = useStore.getState().playlistItems;
              if (pItems.length !== currentItems.length || pItems[0] !== currentItems[0]) setPlaylistItems(pItems);
              setCurrentPlaylistIndex(e.target.getPlaylistIndex());
            } else { setPlaylistItems([]); }
          }
        },
        'onError': (e: any) => { console.error("YT Error:", e.data); setVideoError(true); }
      }
    };

    if (contentConfig.id && contentConfig.type === 'video') playerOpts.videoId = contentConfig.id;

    playerRef.current = new window.YT.Player('youtube-main-player', playerOpts);
  };

  useEffect(() => {
    if (contentConfig.type === 'video') {
      const targetId = contentConfig.id;
      const savedTime = useStore.getState().videoProgress[targetId] || 0;
      
      if (window.YT && window.YT.Player) {
        if (!playerRef.current || typeof playerRef.current.loadVideoById !== 'function') { 
          initMainPlayer(); 
        } else {
           setVideoError(false);
           const currentPId = playerRef.current.getPlaylistId ? playerRef.current.getPlaylistId() : null;
           const currentVId = playerRef.current.getVideoData ? playerRef.current.getVideoData()?.video_id : null;
           
           if (contentConfig.pId) {
             if (currentPId !== contentConfig.pId) {
                initMainPlayer();
             } else if (currentVId !== contentConfig.id) {
                const pItems = playerRef.current.getPlaylist() || [];
                const idx = pItems.indexOf(contentConfig.id);
                if (idx !== -1) { playerRef.current.playVideoAt(idx); } 
                else { initMainPlayer(); }
             } else if (playerRef.current.getPlayerState() !== 1) { 
                playerRef.current.playVideo(); 
             }
           } else if (contentConfig.id) {
             if (currentVId !== contentConfig.id || currentPId) {
               if (currentPId) { initMainPlayer(); } 
               else { playerRef.current.loadVideoById({ videoId: contentConfig.id, startSeconds: Math.floor(savedTime) }); }
             } else if (playerRef.current.getPlayerState() !== 1) { 
               playerRef.current.playVideo(); 
             }
           }
        }
      }
    }
    
    if (contentConfig.id) setActiveContentId(contentConfig.id);
  }, [contentConfig.id, contentConfig.pId, contentConfig.type]);

  const initMusicPlayer = () => {
    if (musicPlayerRef.current?.destroy) musicPlayerRef.current.destroy();
    musicPlayerRef.current = new window.YT.Player('youtube-music-player', {
      host: 'https://www.youtube.com', 
      videoId: activeStation.id, 
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' },
      events: {
        'onReady': (e: any) => { 
          e.target.setVolume(musicVolume); 
          if (globalMuted) e.target.mute(); 
        },
        'onStateChange': (e: any) => { 
          if (e.data === window.YT.PlayerState.PLAYING) setIsMusicPlaying(true); 
          else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) setIsMusicPlaying(false); 
        }
      }
    });
  };

  const jumpToTime = (time: number) => { 
    if (contentConfig.type === 'video' && playerRef.current?.seekTo) { 
      playerRef.current.seekTo(time, true); 
      playerRef.current.playVideo(); 
    } 
  };

  const handleMusicVolumeChange = (val: number) => { 
    setMusicVolume(val); 
    if (musicPlayerRef.current?.setVolume) musicPlayerRef.current.setVolume(val); 
  };

  const toggleRadioPlay = () => { 
    if (!musicPlayerRef.current?.getPlayerState) return; 
    isMusicPlaying ? musicPlayerRef.current.pauseVideo() : musicPlayerRef.current.playVideo(); 
  };
  
  const changeStation = (station: typeof RADIO_STATIONS[0]) => { 
    setActiveStation(station); 
    if (musicPlayerRef.current?.loadVideoById) { 
      musicPlayerRef.current.loadVideoById(station.id); 
      setIsMusicPlaying(true); 
    } 
  };

  const handlePlaylistVideoSelect = (index: number) => {
    if (playerRef.current && typeof playerRef.current.playVideoAt === 'function') {
      playerRef.current.playVideoAt(index);
      setCurrentPlaylistIndex(index);
    }
  };

  return {
    playerRef, videoError,
    activeStation, isMusicPlaying, musicVolume,
    handleMusicVolumeChange, toggleRadioPlay, changeStation,
    jumpToTime, handlePlaylistVideoSelect,
  };
};
