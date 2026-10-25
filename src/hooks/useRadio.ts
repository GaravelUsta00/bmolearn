import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { RADIO_STATIONS } from '@/constants';
import { YT_ENDED, YT_PAUSED, YT_PLAYING, loadYouTubeApi } from '@/lib/youtube';
import type { RadioStation } from '@/types';

/**
 * Odak radyosu (K7: ana oynatıcıdan ayrıldı).
 * Oynatıcı ilk ihtiyaçta (widget açılınca ya da "Çal"a basılınca) kurulur; böylece radyo
 * kullanılmadıkça YouTube'a bağlanılmaz. Gizli konteyner sayfa düzeyindedir, Landing'e
 * dönülse de radyo çalmaya devam eder (eski davranış).
 */
export const useRadio = () => {
  const globalMuted = useStore((s) => s.globalMuted);
  const [station, setStation] = useState<RadioStation>(RADIO_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const creatingRef = useRef(false);
  const playWhenReadyRef = useRef(false);
  const stationRef = useRef(station);
  const volumeRef = useRef(volume);
  // Düğme arayüzde gösterilen duruma göre davranır (arabellekteyken de "Duraklat" duraklatır).
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const ensure = useCallback(() => {
    const host = hostRef.current;
    if (playerRef.current || creatingRef.current || !host) return;
    creatingRef.current = true;
    loadYouTubeApi()
      .then((api) => {
        const mount = document.createElement('div');
        mount.id = 'youtube-music-player';
        host.replaceChildren(mount);
        const initialStation = stationRef.current.id;
        new api.Player(mount, {
          host: 'https://www.youtube.com',
          videoId: initialStation,
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, origin: window.location.origin },
          events: {
            onReady: (e) => {
              playerRef.current = e.target;
              creatingRef.current = false;
              e.target.setVolume(volumeRef.current);
              if (useStore.getState().globalMuted) e.target.mute();
              // Kurulum sürerken istasyon değiştiyse o istasyonu aç (yeniden yükleme otomatik oynatır).
              if (stationRef.current.id !== initialStation) {
                playWhenReadyRef.current = false;
                e.target.loadVideoById(stationRef.current.id);
              } else if (playWhenReadyRef.current) {
                playWhenReadyRef.current = false;
                e.target.playVideo();
              }
            },
            onStateChange: (e) => {
              host.dataset.ytState = String(e.data);
              if (e.data === YT_PLAYING) {
                setIsPlaying(true);
                setError(null);
              } else if (e.data === YT_PAUSED || e.data === YT_ENDED) setIsPlaying(false);
            },
            onError: () => {
              setIsPlaying(false);
              setError('Bu istasyon şu an çalınamıyor. Başka bir istasyon dene.');
            },
          },
        });
      })
      .catch(() => {
        creatingRef.current = false;
        setError('YouTube yüklenemedi; radyo şu an kullanılamıyor.');
      });
  }, []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) {
      playWhenReadyRef.current = true;
      ensure();
      return;
    }
    if (isPlayingRef.current) {
      p.pauseVideo();
      setIsPlaying(false);
    } else p.playVideo();
  }, [ensure]);

  const changeStation = useCallback(
    (next: RadioStation) => {
      setStation(next);
      stationRef.current = next;
      setError(null);
      const p = playerRef.current;
      if (p) {
        p.loadVideoById(next.id);
        setIsPlaying(true);
      } else {
        playWhenReadyRef.current = true;
        ensure();
      }
    },
    [ensure]
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    volumeRef.current = v;
    playerRef.current?.setVolume(v);
  }, []);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (globalMuted) p.mute();
    else p.unMute();
  }, [globalMuted]);

  useEffect(
    () => () => {
      try {
        playerRef.current?.destroy();
      } catch {
        /* zaten kaldırılmış */
      }
      playerRef.current = null;
    },
    []
  );

  return { hostRef, station, isPlaying, volume, error, ensure, toggle, changeStation, setVolume };
};
