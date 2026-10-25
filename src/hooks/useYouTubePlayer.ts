import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { YT_CUED, YT_PLAYING, loadYouTubeApi, playerErrorMessage } from '@/lib/youtube';

const PROGRESS_INTERVAL_MS = 5000;

/**
 * Ana video oynatıcısı.
 * - Oynatıcı, React'in render ettiği konteynerin (`hostRef`) İÇİNE elle eklenen bir elemana kurulur;
 *   konteyner kaybolunca (ör. Landing'e dönüş) oynatıcı yok edilir, geri gelince yeniden kurulur (B1).
 * - Olay işleyicileri durumu `useStore.getState()` ile o an okur; eski render'ın değerlerine takılmaz (B3).
 * - Belge (PDF) moduna geçince video durdurulur; gizli oynatıcı etkin içeriği değiştirmez (B3).
 * - `playerRef` yalnızca `onReady` sonrası dolu olur; tüketiciler null kontrolüyle güvenle çağırabilir.
 */
export const useYouTubePlayer = () => {
  const contentType = useStore((s) => s.contentConfig.type);
  const contentId = useStore((s) => s.contentConfig.id);
  const playlistId = useStore((s) => s.contentConfig.pId);
  const globalMuted = useStore((s) => s.globalMuted);

  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const pendingRef = useRef<YT.Player | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiAttempt, setApiAttempt] = useState(0);

  const destroyPlayer = useCallback((container: HTMLElement | null) => {
    for (const p of [playerRef.current, pendingRef.current]) {
      try {
        p?.destroy();
      } catch {
        /* iframe zaten DOM'dan çıkmış olabilir */
      }
    }
    playerRef.current = null;
    pendingRef.current = null;
    container?.replaceChildren();
  }, []);

  const createPlayer = useCallback(
    (api: YT.Namespace, container: HTMLElement) => {
      destroyPlayer(container);
      const { contentConfig, videoProgress } = useStore.getState();
      const savedTime = videoProgress[contentConfig.id] || 0;

      const mount = document.createElement('div');
      mount.id = 'youtube-main-player';
      mount.className = 'h-full w-full';
      container.appendChild(mount);

      const playerVars: YT.PlayerVars = {
        autoplay: 1,
        rel: 0,
        origin: window.location.origin,
        start: Math.floor(savedTime),
        ...(contentConfig.pId ? { listType: 'playlist' as const, list: contentConfig.pId } : {}),
      };

      pendingRef.current = new api.Player(mount, {
        host: 'https://www.youtube.com',
        playerVars,
        ...(contentConfig.id ? { videoId: contentConfig.id } : {}),
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            pendingRef.current = null;
            if (useStore.getState().globalMuted) e.target.mute();
          },
          onStateChange: (e) => {
            // Hata ayıklama ve testler için: -1 başlamadı, 0 bitti, 1 oynuyor, 2 duraklatıldı, 3 arabellek, 5 hazır
            container.dataset.ytState = String(e.data);
            const st = useStore.getState();
            if (st.contentConfig.type !== 'video') {
              // Oynatıcı hazır olmadan belgeye geçildiyse otomatik oynatma arkada başlamasın.
              if (e.data === YT_PLAYING) e.target.pauseVideo();
              return;
            }
            const data = e.target.getVideoData?.();
            const active = e.data === YT_PLAYING || e.data === YT_CUED;
            if (data?.video_id) {
              if (st.activeContentId !== data.video_id) st.setActiveContentId(data.video_id);
              if (data.title && active) {
                if (st.contentConfig.title !== data.title) st.updateContentTitle(data.title);
                st.addToHistory({
                  contentId: data.video_id,
                  title: data.title,
                  timestamp: Date.now(),
                  type: 'video',
                  pId: st.contentConfig.pId,
                });
              }
            }
            if (active) {
              const items = e.target.getPlaylist?.();
              if (items && items.length > 0) {
                const current = useStore.getState().playlistItems;
                if (items.length !== current.length || items[0] !== current[0]) st.setPlaylistItems(items);
                st.setCurrentPlaylistIndex(e.target.getPlaylistIndex());
              } else {
                st.setPlaylistItems([]);
              }
            }
          },
          onError: (e) => setVideoError(playerErrorMessage(e.data)),
        },
      });
    },
    [destroyPlayer]
  );

  // Konteyner kaybolunca (görünüm değişimi, unmount) oynatıcıyı yok et.
  useEffect(() => () => destroyPlayer(host), [host, destroyPlayer]);

  // İçerik değişince oynatıcıyı eşitle (eski eşitleme mantığı korunarak).
  useEffect(() => {
    if (!host) return;
    if (contentType !== 'video') {
      // B3: belgeye geçince arkada çalmaya devam etmesin.
      playerRef.current?.pauseVideo();
      return;
    }
    if (!contentId && !playlistId) return;

    let cancelled = false;
    setVideoError(null);
    loadYouTubeApi()
      .then((api) => {
        if (cancelled) return;
        setApiError(null);
        const player = playerRef.current;
        if (!player) return createPlayer(api, host);

        const currentPId = player.getPlaylistId?.() ?? null;
        const currentVId = player.getVideoData?.()?.video_id ?? null;
        const savedTime = useStore.getState().videoProgress[contentId] || 0;

        if (playlistId) {
          if (currentPId !== playlistId) return createPlayer(api, host);
          if (currentVId !== contentId) {
            const idx = (player.getPlaylist() || []).indexOf(contentId);
            if (idx !== -1) player.playVideoAt(idx);
            else createPlayer(api, host);
          } else if (player.getPlayerState() !== YT_PLAYING) player.playVideo();
        } else if (contentId) {
          if (currentPId) createPlayer(api, host);
          else if (currentVId !== contentId)
            player.loadVideoById({ videoId: contentId, startSeconds: Math.floor(savedTime) });
          else if (player.getPlayerState() !== YT_PLAYING) player.playVideo();
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setApiError(e instanceof Error ? e.message : 'YouTube yüklenemedi');
      });
    return () => {
      cancelled = true;
    };
  }, [host, contentType, contentId, playlistId, apiAttempt, createPlayer]);

  // Etkin içerik: belge dahil her içerik değişiminde (eski davranış).
  useEffect(() => {
    if (contentId) useStore.getState().setActiveContentId(contentId);
  }, [contentId, playlistId, contentType]);

  // Genel sessiz düğmesi.
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (globalMuted) p.mute();
    else p.unMute();
  }, [globalMuted]);

  // Kaldığın yer: 5 sn'de bir ve sayfa gizlenirken/kapanırken kaydet.
  useEffect(() => {
    const save = () => {
      const p = playerRef.current;
      const st = useStore.getState();
      if (!p || st.view !== 'app' || st.contentConfig.type !== 'video') return;
      if (p.getPlayerState() !== YT_PLAYING) return;
      const t = p.getCurrentTime();
      if (t > 0) st.updateVideoProgress(st.activeContentId || st.contentConfig.id, t);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    const timer = window.setInterval(save, PROGRESS_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', save);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', save);
    };
  }, []);

  const jumpToTime = useCallback((time: number) => {
    const p = playerRef.current;
    if (useStore.getState().contentConfig.type === 'video' && p) {
      p.seekTo(time, true);
      p.playVideo();
    }
  }, []);

  const selectPlaylistIndex = useCallback((index: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.playVideoAt(index);
    useStore.getState().setCurrentPlaylistIndex(index);
  }, []);

  const retry = useCallback(() => {
    setApiError(null);
    setApiAttempt((n) => n + 1);
  }, []);

  return { hostRef: setHost, playerRef, videoError, apiError, retry, jumpToTime, selectPlaylistIndex };
};
