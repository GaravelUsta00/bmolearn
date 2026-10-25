import type { SetStateAction } from 'react';
import type { AppState, SliceCreator, UiSlice } from '@/store/types';
import { writeThemePreference } from '@/store/persistence';

type Field = Exclude<
  {
    [K in keyof AppState]: AppState[K] extends (...args: never[]) => unknown ? never : K;
  }[keyof AppState],
  undefined
>;

// useState'in setter'ı gibi davranır: değer ya da (önceki => yeni) fonksiyonu alır.
const setterFor =
  <K extends Field>(set: Parameters<SliceCreator<UiSlice>>[0], key: K) =>
  (value: SetStateAction<AppState[K]>) =>
    set(
      (state) =>
        ({
          [key]: typeof value === 'function' ? (value as (prev: AppState[K]) => AppState[K])(state[key]) : value,
        }) as Partial<AppState>
    );

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  theme: 'dark',
  globalMuted: false,
  blueLight: 0,
  installPrompt: null,
  storageNotices: [],
  documentSettings: { storePdfs: true },
  inputError: null,

  activeTab: 'notes',
  showHistory: false,
  showInstallModal: false,
  showAIModal: false,
  showPlaylistSidebar: false,
  showMusicWidget: false,
  copyFeedback: false,
  newNote: '',
  videoUrlInput: '',
  focusMode: false,

  setTheme: (theme) => {
    writeThemePreference(theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    set({ theme });
  },
  toggleGlobalMute: () => set((state) => ({ globalMuted: !state.globalMuted })),
  setBlueLight: (val) => set({ blueLight: val }),
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
  addStorageNotice: (notice) =>
    set((state) =>
      state.storageNotices.some((n) => JSON.stringify(n) === JSON.stringify(notice))
        ? state
        : { storageNotices: [...state.storageNotices, notice] }
    ),
  dismissStorageNotices: () => set({ storageNotices: [] }),
  setStorePdfs: (value) => set({ documentSettings: { storePdfs: value } }),
  setInputError: (message) => set({ inputError: message }),

  setActiveTab: setterFor(set, 'activeTab'),
  setShowHistory: setterFor(set, 'showHistory'),
  setShowInstallModal: setterFor(set, 'showInstallModal'),
  setShowAIModal: setterFor(set, 'showAIModal'),
  setShowPlaylistSidebar: setterFor(set, 'showPlaylistSidebar'),
  setShowMusicWidget: setterFor(set, 'showMusicWidget'),
  setCopyFeedback: setterFor(set, 'copyFeedback'),
  setNewNote: setterFor(set, 'newNote'),
  setVideoUrlInput: setterFor(set, 'videoUrlInput'),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
});
