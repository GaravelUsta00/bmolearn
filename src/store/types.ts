import type { StateCreator } from 'zustand';
import type { ContentConfig, Flashcard, HistoryItem, Note, QuizQuestion, Setter, StudyTab, Todo } from '@/types';

/** `beforeinstallprompt` olayı (TypeScript DOM tiplerinde yok). */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ContentSlice {
  view: 'landing' | 'app';
  contentConfig: ContentConfig;
  activeContentId: string;
  playlistItems: string[];
  currentPlaylistIndex: number;
  pendingDocReload: { id: string; title: string } | null;
  videoProgress: Record<string, number>;

  setView: (view: 'landing' | 'app') => void;
  setContentConfig: (config: ContentConfig) => void;
  updateContentTitle: (title: string) => void;
  setActiveContentId: (id: string) => void;
  setPendingDocReload: (item: { id: string; title: string } | null) => void;
  setPlaylistItems: (items: string[]) => void;
  setCurrentPlaylistIndex: (index: number) => void;
  updateVideoProgress: (id: string, time: number) => void;
}

export interface StudySlice {
  notes: Note[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  summaries: Record<string, string>;

  addNote: (note: Note) => void;
  deleteNote: (id: Note['id']) => void;
  addFlashcard: (card: Flashcard) => void;
  deleteFlashcard: (id: Flashcard['id']) => void;
  toggleFlashcardLearned: (id: Flashcard['id']) => void;
  resetFlashcards: (contentId: string) => void;
  addQuizQuestion: (q: QuizQuestion) => void;
  answerQuizQuestion: (id: QuizQuestion['id'], answer: string) => void;
  deleteQuizQuestion: (id: QuizQuestion['id']) => void;
  resetQuiz: (contentId: string) => void;
  replaceContentAI: (contentId: string, newCards: Flashcard[], newQuiz: QuizQuestion[], newSummary: string) => void;
}

export interface HistorySlice {
  history: HistoryItem[];

  addToHistory: (item: {
    contentId: string;
    title: string;
    timestamp: number;
    type: 'video' | 'document';
    pId?: string | null;
  }) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

export interface PomodoroSlice {
  pomodoroHistory: Record<string, number>;
  todos: Todo[];

  addPomodoroRecord: () => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: Todo['id']) => void;
  deleteTodo: (id: Todo['id']) => void;
}

export type StorageNotice =
  { kind: 'quota' } | { kind: 'unavailable' } | { kind: 'corrupt'; keys: string[] } | { kind: 'migration-failed' };

export interface UiSlice {
  theme: 'dark' | 'light';
  globalMuted: boolean;
  blueLight: number;
  installPrompt: InstallPromptEvent | null;
  storageNotices: StorageNotice[];

  // Görünümler arası (landing <-> app) korunan arayüz durumu (ANALYSIS K8)
  activeTab: StudyTab;
  showHistory: boolean;
  showInstallModal: boolean;
  showAIModal: boolean;
  showPomodoroWidget: boolean;
  showPlaylistSidebar: boolean;
  showMusicWidget: boolean;
  copyFeedback: boolean;
  newNote: string;
  videoUrlInput: string;

  setTheme: (theme: 'dark' | 'light') => void;
  toggleGlobalMute: () => void;
  setBlueLight: (val: number) => void;
  setInstallPrompt: (prompt: InstallPromptEvent | null) => void;
  addStorageNotice: (notice: StorageNotice) => void;
  dismissStorageNotices: () => void;

  setActiveTab: Setter<StudyTab>;
  setShowHistory: Setter<boolean>;
  setShowInstallModal: Setter<boolean>;
  setShowAIModal: Setter<boolean>;
  setShowPomodoroWidget: Setter<boolean>;
  setShowPlaylistSidebar: Setter<boolean>;
  setShowMusicWidget: Setter<boolean>;
  setCopyFeedback: Setter<boolean>;
  setNewNote: Setter<string>;
  setVideoUrlInput: Setter<string>;
}

/** Kalıcı (localStorage'a yazılan) alanlar. */
export interface PersistedData {
  notes: Note[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  summaries: Record<string, string>;
  todos: Todo[];
  history: HistoryItem[];
  pomodoroHistory: Record<string, number>;
  videoProgress: Record<string, number>;
}

/** Eski sürümlerde `id` alanı olmayan geçmiş kaydı. */
export type LegacyHistoryItem = Omit<HistoryItem, 'id'> & { id?: string };

export type LoadedData = Partial<Omit<PersistedData, 'history'>> & { history?: LegacyHistoryItem[] };

export interface AppState extends ContentSlice, StudySlice, HistorySlice, PomodoroSlice, UiSlice {
  /** localStorage'dan okunan veriyi store'a yükler (eski geçmiş biçimini dönüştürerek). */
  initData: (data: LoadedData) => void;
}

export type SliceCreator<T> = StateCreator<AppState, [], [], T>;
