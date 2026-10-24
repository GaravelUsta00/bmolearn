// YouTube IFrame API için geçici global tanım (Adım 6'da gerçek tiplerle değiştirilecek).
export {};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
