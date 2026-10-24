import type { HistoryItem, WatchedVideo } from '@/types';
import type { AppState, HistorySlice, SliceCreator } from '@/store/types';

/**
 * Geçmişte tutulan en fazla kayıt. Eskiden 30'du ve listeden düşen içeriğin notları
 * erişilemez (yetim) kalıyordu (B16); sınır yükseltildi. Listeden düşen içeriğin verisi
 * otomatik SİLİNMEZ; `findOrphanedContentIds` ile bulunur, onaylı temizlik Adım 9'da.
 */
export const HISTORY_LIMIT = 200;
const PLAYLIST_ITEMS_LIMIT = 50;

/** Verilen içeriklerin not, kart, soru, özet ve video ilerlemesini çıkarır. */
export const withoutContentData = (state: AppState, contentIds: string[]): Partial<AppState> => {
  const ids = new Set(contentIds);
  const summaries = { ...state.summaries };
  const videoProgress = { ...state.videoProgress };
  for (const id of ids) {
    delete summaries[id];
    delete videoProgress[id];
  }
  return {
    notes: state.notes.filter((n) => !ids.has(n.contentId)),
    flashcards: state.flashcards.filter((c) => !ids.has(c.contentId)),
    quiz: state.quiz.filter((q) => !ids.has(q.contentId)),
    summaries,
    videoProgress,
  };
};

/** Hiçbir geçmiş kaydından ulaşılamayan içeriklerin id'leri (etkin içerik hariç). */
export const findOrphanedContentIds = (state: AppState): string[] => {
  const reachable = new Set<string>([state.activeContentId]);
  for (const h of state.history) {
    reachable.add(h.contentId);
    h.playlistItems?.forEach((v) => reachable.add(v.contentId));
  }
  const all = new Set<string>([
    ...state.notes.map((n) => n.contentId),
    ...state.flashcards.map((c) => c.contentId),
    ...state.quiz.map((q) => q.contentId),
    ...Object.keys(state.summaries),
    ...Object.keys(state.videoProgress),
  ]);
  return [...all].filter((id) => !reachable.has(id));
};

export const createHistorySlice: SliceCreator<HistorySlice> = (set) => ({
  history: [],

  // Mevcut kayıtları yerinde değiştirmez (B15); her güncelleme yeni nesne üretir.
  addToHistory: (item) =>
    set((state) => {
      if (!item.title || item.title.trim() === '') return state;

      const watched: WatchedVideo = { contentId: item.contentId, title: item.title, timestamp: item.timestamp };
      let next: HistoryItem[];

      if (item.pId) {
        const idx = state.history.findIndex((h) => h.id === item.pId);
        if (idx !== -1) {
          const existing = state.history[idx];
          const updated: HistoryItem = {
            ...existing,
            timestamp: item.timestamp,
            contentId: item.contentId,
            playlistItems: [
              watched,
              ...(existing.playlistItems ?? []).filter((v) => v.contentId !== item.contentId),
            ].slice(0, PLAYLIST_ITEMS_LIMIT),
            title: existing.title.includes('Koleksiyon:') ? existing.title : `Koleksiyon: ${item.title}`,
          };
          next = [updated, ...state.history.filter((_, i) => i !== idx)];
        } else {
          next = [
            {
              id: item.pId,
              contentId: item.contentId,
              title: `Koleksiyon: ${item.title}`,
              timestamp: item.timestamp,
              type: 'playlist',
              pId: item.pId,
              playlistItems: [watched],
            },
            ...state.history,
          ];
        }
      } else {
        const idx = state.history.findIndex((h) => h.id === item.contentId);
        if (idx !== -1) {
          const updated: HistoryItem = { ...state.history[idx], timestamp: item.timestamp, title: item.title };
          next = [updated, ...state.history.filter((_, i) => i !== idx)];
        } else {
          next = [{ ...item, id: item.contentId, type: item.type }, ...state.history];
        }
      }

      return { history: next.slice(0, HISTORY_LIMIT) };
    }),

  deleteHistoryItem: (id) =>
    set((state) => {
      const itemToDelete = state.history.find((h) => h.id === id);
      if (!itemToDelete) return state;

      let contentIdsToRemove = [itemToDelete.contentId];
      if (itemToDelete.type === 'playlist' && itemToDelete.playlistItems) {
        contentIdsToRemove = itemToDelete.playlistItems.map((p) => p.contentId);
      }

      return {
        history: state.history.filter((h) => h.id !== id),
        ...withoutContentData(state, contentIdsToRemove),
      };
    }),

  // Video ilerlemesi de temizlenir (B6). Görevler ve pomodoro geçmişi bilinçli olarak korunur.
  clearHistory: () =>
    set(() => ({ history: [], notes: [], flashcards: [], quiz: [], summaries: {}, videoProgress: {} })),
});
