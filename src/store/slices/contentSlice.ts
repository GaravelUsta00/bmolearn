import type { SliceCreator, ContentSlice } from '@/store/types';

export const createContentSlice: SliceCreator<ContentSlice> = (set) => ({
  view: 'landing',
  contentConfig: { id: '', type: 'video', title: '' },
  activeContentId: '',
  playlistItems: [],
  currentPlaylistIndex: 0,
  pendingDocReload: null,
  videoProgress: {},

  setView: (view) => set({ view }),
  setContentConfig: (config) => set({ contentConfig: config }),
  updateContentTitle: (title) => set((state) => ({ contentConfig: { ...state.contentConfig, title } })),
  setActiveContentId: (id) => set({ activeContentId: id }),
  setPendingDocReload: (item) => set({ pendingDocReload: item }),
  setPlaylistItems: (items) => set({ playlistItems: items }),
  setCurrentPlaylistIndex: (index) => set({ currentPlaylistIndex: index }),
  updateVideoProgress: (id, time) =>
    set((state) => {
      const newProgress = { ...state.videoProgress, [id]: time };
      return { videoProgress: newProgress };
    }),
});
