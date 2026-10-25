// YouTube kimlikleri yalnızca [A-Za-z0-9_-] içerir; başka karakter içeren değer reddedilir.
const VIDEO_ID = /^[\w-]{11}$/;
const PLAYLIST_ID = /^[\w-]{2,64}$/;

export const extractYTId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?/]*)/);
  return match && VIDEO_ID.test(match[1]) ? match[1] : null;
};

export const extractPlaylistId = (url: string) => {
  const match = url.match(/[?&]list=([^#&?]+)/);
  return match && PLAYLIST_ID.test(match[1]) ? match[1] : null;
};

// ---- IFrame API yükleyicisi (B2) ----
const API_SRC = 'https://www.youtube.com/iframe_api';
const SCRIPT_ID = 'yt-iframe-api';
const LOAD_TIMEOUT_MS = 15_000;
let apiPromise: Promise<YT.Namespace> | null = null;

/**
 * IFrame API'yi bir kez yükler; aynı anda gelen tüm çağrılar aynı Promise'i alır.
 * Başarısız olursa (ağ, engelleyici, zaman aşımı) sonraki çağrı yeniden dener.
 */
export const loadYouTubeApi = (): Promise<YT.Namespace> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube API yalnızca tarayıcıda yüklenebilir'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YT.Namespace>((resolve, reject) => {
    const fail = (reason: string) => {
      apiPromise = null;
      document.getElementById(SCRIPT_ID)?.remove();
      reject(new Error(reason));
    };
    const timer = window.setTimeout(() => fail('YouTube zaman aşımına uğradı'), LOAD_TIMEOUT_MS);

    // Sayfada başka bir YouTube kullanıcısı varsa onun geri çağrısını da koru.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      window.clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
      else fail('YouTube API beklenen biçimde yüklenmedi');
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const tag = document.createElement('script');
      tag.id = SCRIPT_ID;
      tag.src = API_SRC;
      tag.async = true;
      tag.onerror = () => {
        window.clearTimeout(timer);
        fail('YouTube yüklenemedi');
      };
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
};

/** Oynatıcı hata kodlarının kullanıcıya gösterilecek karşılığı. */
export const playerErrorMessage = (code: number): string => {
  switch (code) {
    case 2:
      return 'Bağlantıdaki video kimliği geçersiz.';
    case 5:
      return 'Bu video tarayıcında oynatılamıyor.';
    case 100:
      return 'Video bulunamadı: silinmiş ya da özel olabilir.';
    case 101:
    case 150:
    case 153:
      return 'Video sahibi bu videonun başka sitelerde oynatılmasına izin vermiyor.';
    default:
      return 'Bu video şu an oynatılamıyor.';
  }
};

/** IFrame API'nin "oynuyor" durumu; API yüklenmeden de karşılaştırılabilsin diye sabit. */
export const YT_PLAYING = 1;
export const YT_PAUSED = 2;
export const YT_ENDED = 0;
export const YT_CUED = 5;
