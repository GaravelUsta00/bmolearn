import type { SliceCreator, HistorySlice } from '@/store/types';

export const createHistorySlice: SliceCreator<HistorySlice> = (set) => ({
  history: [],

  addToHistory: (item) =>
    set((state) => {
      if (!item.title || item.title.trim() === '') return state;

      let newHistory = [...state.history];
      const isPlaylistVideo = !!item.pId;

      if (isPlaylistVideo) {
        const existingPlaylistIdx = newHistory.findIndex((h) => h.id === item.pId);
        if (existingPlaylistIdx !== -1) {
          const existing = newHistory[existingPlaylistIdx];
          existing.timestamp = item.timestamp;
          existing.contentId = item.contentId;
          if (!existing.playlistItems) existing.playlistItems = [];
          existing.playlistItems = existing.playlistItems.filter((v) => v.contentId !== item.contentId);
          existing.playlistItems.unshift({ contentId: item.contentId, title: item.title, timestamp: item.timestamp });
          existing.playlistItems = existing.playlistItems.slice(0, 50);
          existing.title = existing.title.includes('Koleksiyon:') ? existing.title : `Koleksiyon: ${item.title}`;

          newHistory.splice(existingPlaylistIdx, 1);
          newHistory.unshift(existing);
        } else {
          newHistory.unshift({
            id: item.pId as string,
            contentId: item.contentId,
            title: `Koleksiyon: ${item.title}`,
            timestamp: item.timestamp,
            type: 'playlist',
            pId: item.pId,
            playlistItems: [{ contentId: item.contentId, title: item.title, timestamp: item.timestamp }],
          });
        }
      } else {
        const existingIdx = newHistory.findIndex((h) => h.id === item.contentId);
        if (existingIdx !== -1) {
          newHistory[existingIdx].timestamp = item.timestamp;
          newHistory[existingIdx].title = item.title;
          const updatedItem = newHistory.splice(existingIdx, 1)[0];
          newHistory.unshift(updatedItem);
        } else {
          newHistory.unshift({ ...item, id: item.contentId, type: item.type });
        }
      }

      newHistory = newHistory.slice(0, 30);
      return { history: newHistory };
    }),
  deleteHistoryItem: (id) =>
    set((state) => {
      const itemToDelete = state.history.find((h) => h.id === id);
      if (!itemToDelete) return state;

      const newHistory = state.history.filter((h) => h.id !== id);
      let contentIdsToRemove = [itemToDelete.contentId];
      if (itemToDelete.type === 'playlist' && itemToDelete.playlistItems) {
        contentIdsToRemove = itemToDelete.playlistItems.map((p) => p.contentId);
      }

      const newNotes = state.notes.filter((n) => !contentIdsToRemove.includes(n.contentId));
      const newCards = state.flashcards.filter((c) => !contentIdsToRemove.includes(c.contentId));
      const newQuiz = state.quiz.filter((q) => !contentIdsToRemove.includes(q.contentId));
      const newSummaries = { ...state.summaries };
      contentIdsToRemove.forEach((cid) => {
        delete newSummaries[cid];
      });

      return { history: newHistory, notes: newNotes, flashcards: newCards, quiz: newQuiz, summaries: newSummaries };
    }),
  clearHistory: () =>
    set(() => {
      return { history: [], notes: [], flashcards: [], quiz: [], summaries: {} };
    }),
});
