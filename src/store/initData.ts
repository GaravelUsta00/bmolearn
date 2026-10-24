// initData'nın orijinal gövdesi: eski (id'siz) geçmiş kayıtlarını dönüştürür.
import type { HistoryItem } from '@/types';
import type { AppState, SliceCreator } from '@/store/types';

export const createInitData: SliceCreator<Pick<AppState, 'initData'>> = (set) => ({
  initData: (data) =>
    set(() => {
      const migratedHistory = (data.history || []).map((h): HistoryItem => {
        if (!h.id) {
          if (h.pId)
            return {
              ...h,
              id: h.pId,
              type: 'playlist',
              playlistItems: [{ contentId: h.contentId, title: h.title, timestamp: h.timestamp }],
            };
          return { ...h, id: h.contentId };
        }
        return { ...h, id: h.id };
      });
      return { ...data, history: migratedHistory };
    }),
});
