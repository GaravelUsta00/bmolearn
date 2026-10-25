// YouTube IFrame Player API için kullandığımız kadarıyla tipler.
// https://developers.google.com/youtube/iframe_api_reference
export {};

declare global {
  namespace YT {
    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }

    interface PlayerVars {
      autoplay?: 0 | 1;
      controls?: 0 | 1;
      disablekb?: 0 | 1;
      rel?: 0 | 1;
      start?: number;
      origin?: string;
      listType?: 'playlist';
      list?: string;
    }

    interface PlayerEvent {
      target: Player;
    }
    interface OnStateChangeEvent extends PlayerEvent {
      data: PlayerState;
    }
    interface OnErrorEvent extends PlayerEvent {
      /** 2: geçersiz parametre, 5: HTML5 hatası, 100: bulunamadı/özel, 101 ve 150: gömme kapalı */
      data: number;
    }

    interface PlayerOptions {
      host?: string;
      videoId?: string;
      playerVars?: PlayerVars;
      events?: {
        onReady?: (e: PlayerEvent) => void;
        onStateChange?: (e: OnStateChangeEvent) => void;
        onError?: (e: OnErrorEvent) => void;
      };
    }

    interface VideoData {
      video_id: string;
      title: string;
    }

    interface Player {
      playVideo(): void;
      pauseVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      loadVideoById(idOrOptions: string | { videoId: string; startSeconds?: number }): void;
      playVideoAt(index: number): void;
      getPlayerState(): PlayerState;
      getCurrentTime(): number;
      getVideoData(): VideoData;
      getPlaylist(): string[] | null;
      getPlaylistIndex(): number;
      getPlaylistId(): string | null;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      setVolume(volume: number): void;
      destroy(): void;
    }

    interface Namespace {
      Player: new (element: HTMLElement | string, options: PlayerOptions) => Player;
      PlayerState: typeof PlayerState;
    }
  }

  interface Window {
    YT?: YT.Namespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}
