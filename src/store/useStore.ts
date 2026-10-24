import { create } from 'zustand';
import type { ContentConfig, Flashcard, HistoryItem, Note, QuizQuestion, Todo } from '@/types';

export interface AppState {
  view: 'landing' | 'app';
  theme: 'dark' | 'light';
  globalMuted: boolean;
  blueLight: number;
  notes: Note[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  summaries: Record<string, string>;
  todos: Todo[];
  history: HistoryItem[];
  pomodoroHistory: Record<string, number>; 
  videoProgress: Record<string, number>;
  playlistItems: string[]; 
  currentPlaylistIndex: number;
  
  activeContentId: string;
  contentConfig: ContentConfig;
  installPrompt: any; 
  pendingDocReload: { id: string, title: string } | null;
  
  setView: (view: 'landing' | 'app') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setContentConfig: (config: ContentConfig) => void;
  updateContentTitle: (title: string) => void;
  toggleGlobalMute: () => void;
  setBlueLight: (val: number) => void;
  setActiveContentId: (id: string) => void;
  setInstallPrompt: (prompt: any) => void;
  setPendingDocReload: (item: { id: string, title: string } | null) => void;
  setPlaylistItems: (items: string[]) => void;
  setCurrentPlaylistIndex: (index: number) => void;
  
  addNote: (note: Note) => void;
  deleteNote: (id: number) => void;
  addFlashcard: (card: Flashcard) => void;
  deleteFlashcard: (id: number) => void;
  toggleFlashcardLearned: (id: number) => void;
  resetFlashcards: (contentId: string) => void;
  addQuizQuestion: (q: QuizQuestion) => void;
  answerQuizQuestion: (id: number, answer: string) => void;
  deleteQuizQuestion: (id: number) => void;
  resetQuiz: (contentId: string) => void;
  replaceContentAI: (contentId: string, newCards: Flashcard[], newQuiz: QuizQuestion[], newSummary: string) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  addToHistory: (item: { contentId: string; title: string; timestamp: number; type: 'video' | 'document'; pId?: string | null; }) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  addPomodoroRecord: () => void;
  updateVideoProgress: (id: string, time: number) => void;
  initData: (data: any) => void;
}

export const useStore = create<AppState>((set) => ({
  view: 'landing', theme: 'dark', globalMuted: false, blueLight: 0,
  notes: [], flashcards: [], quiz: [], summaries: {}, todos: [], history: [], pomodoroHistory: {}, videoProgress: {}, playlistItems: [], currentPlaylistIndex: 0,
  activeContentId: '', contentConfig: { id: '', type: 'video', title: '' }, installPrompt: null, pendingDocReload: null,

  setView: (view) => set({ view }),
  setTheme: (theme) => set(() => {
    localStorage.setItem('bmo_theme', theme);
    if(theme === 'light') document.documentElement.classList.add('light-theme');
    else document.documentElement.classList.remove('light-theme');
    return { theme };
  }),
  setContentConfig: (config) => set({ contentConfig: config }),
  updateContentTitle: (title) => set((state) => ({ contentConfig: { ...state.contentConfig, title } })),
  toggleGlobalMute: () => set((state) => ({ globalMuted: !state.globalMuted })),
  setBlueLight: (val) => set({ blueLight: val }),
  setActiveContentId: (id) => set({ activeContentId: id }),
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
  setPendingDocReload: (item) => set({ pendingDocReload: item }),
  setPlaylistItems: (items) => set({ playlistItems: items }),
  setCurrentPlaylistIndex: (index) => set({ currentPlaylistIndex: index }),
  
  addNote: (note) => set((state) => { 
    const newNotes = [...state.notes, note].sort((a, b) => a.time - b.time); 
    localStorage.setItem('bmo_notes', JSON.stringify(newNotes)); 
    return { notes: newNotes }; 
  }),
  deleteNote: (id) => set((state) => { 
    const newNotes = state.notes.filter(n => n.id !== id); 
    localStorage.setItem('bmo_notes', JSON.stringify(newNotes)); 
    return { notes: newNotes }; 
  }),
  addFlashcard: (card) => set((state) => { 
    const newCards = [...state.flashcards, card]; 
    localStorage.setItem('bmo_flashcards', JSON.stringify(newCards)); 
    return { flashcards: newCards }; 
  }),
  deleteFlashcard: (id) => set((state) => { 
    const newCards = state.flashcards.filter(c => c.id !== id); 
    localStorage.setItem('bmo_flashcards', JSON.stringify(newCards)); 
    return { flashcards: newCards }; 
  }),
  toggleFlashcardLearned: (id) => set((state) => { 
    const newCards = state.flashcards.map(c => c.id === id ? { ...c, learned: !c.learned } : c); 
    localStorage.setItem('bmo_flashcards', JSON.stringify(newCards)); 
    return { flashcards: newCards }; 
  }),
  resetFlashcards: (contentId) => set((state) => { 
    const newCards = state.flashcards.map(c => c.contentId === contentId ? { ...c, learned: false } : c); 
    localStorage.setItem('bmo_flashcards', JSON.stringify(newCards)); 
    return { flashcards: newCards }; 
  }),
  addQuizQuestion: (q) => set((state) => { 
    const newQuiz = [...state.quiz, q]; 
    localStorage.setItem('bmo_quiz', JSON.stringify(newQuiz)); 
    return { quiz: newQuiz }; 
  }),
  answerQuizQuestion: (id, answer) => set((state) => { 
    const newQuiz = state.quiz.map(q => q.id === id ? { ...q, userAnswer: answer } : q); 
    localStorage.setItem('bmo_quiz', JSON.stringify(newQuiz)); 
    return { quiz: newQuiz }; 
  }),
  deleteQuizQuestion: (id) => set((state) => { 
    const newQuiz = state.quiz.filter(q => q.id !== id); 
    localStorage.setItem('bmo_quiz', JSON.stringify(newQuiz)); 
    return { quiz: newQuiz }; 
  }),
  resetQuiz: (contentId) => set((state) => { 
    const newQuiz = state.quiz.map(q => q.contentId === contentId ? { ...q, userAnswer: undefined } : q); 
    localStorage.setItem('bmo_quiz', JSON.stringify(newQuiz)); 
    return { quiz: newQuiz }; 
  }),
  
  replaceContentAI: (contentId, newCards, newQuiz, newSummary) => set((state) => {
    const finalCards = [...state.flashcards.filter(c => c.contentId !== contentId), ...newCards];
    const finalQuiz = [...state.quiz.filter(q => q.contentId !== contentId), ...newQuiz];
    const newSummaries = { ...state.summaries, [contentId]: newSummary };
    localStorage.setItem('bmo_flashcards', JSON.stringify(finalCards)); 
    localStorage.setItem('bmo_quiz', JSON.stringify(finalQuiz)); 
    localStorage.setItem('bmo_summaries', JSON.stringify(newSummaries));
    return { flashcards: finalCards, quiz: finalQuiz, summaries: newSummaries };
  }),

  addTodo: (text) => set((state) => { 
    const newTodos = [...state.todos, { id: Date.now(), text, completed: false }]; 
    localStorage.setItem('bmo_todos', JSON.stringify(newTodos)); 
    return { todos: newTodos }; 
  }),
  toggleTodo: (id) => set((state) => { 
    const newTodos = state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t); 
    localStorage.setItem('bmo_todos', JSON.stringify(newTodos)); 
    return { todos: newTodos }; 
  }),
  deleteTodo: (id) => set((state) => { 
    const newTodos = state.todos.filter(t => t.id !== id); 
    localStorage.setItem('bmo_todos', JSON.stringify(newTodos)); 
    return { todos: newTodos }; 
  }),

  addToHistory: (item) => set((state) => {
    if(!item.title || item.title.trim() === '') return state; 
    
    let newHistory = [...state.history];
    const isPlaylistVideo = !!item.pId;

    if (isPlaylistVideo) {
      const existingPlaylistIdx = newHistory.findIndex(h => h.id === item.pId);
      if (existingPlaylistIdx !== -1) {
        const existing = newHistory[existingPlaylistIdx];
        existing.timestamp = item.timestamp;
        existing.contentId = item.contentId; 
        if (!existing.playlistItems) existing.playlistItems = [];
        existing.playlistItems = existing.playlistItems.filter(v => v.contentId !== item.contentId);
        existing.playlistItems.unshift({ contentId: item.contentId, title: item.title, timestamp: item.timestamp });
        existing.playlistItems = existing.playlistItems.slice(0, 50); 
        existing.title = existing.title.includes("Koleksiyon:") ? existing.title : `Koleksiyon: ${item.title}`;
        
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
          playlistItems: [{ contentId: item.contentId, title: item.title, timestamp: item.timestamp }]
        });
      }
    } else {
      const existingIdx = newHistory.findIndex(h => h.id === item.contentId);
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
    localStorage.setItem('bmo_history', JSON.stringify(newHistory)); 
    return { history: newHistory };
  }),
  
  deleteHistoryItem: (id) => set((state) => {
    const itemToDelete = state.history.find(h => h.id === id);
    if (!itemToDelete) return state;

    const newHistory = state.history.filter(h => h.id !== id);
    let contentIdsToRemove = [itemToDelete.contentId];
    if (itemToDelete.type === 'playlist' && itemToDelete.playlistItems) {
       contentIdsToRemove = itemToDelete.playlistItems.map(p => p.contentId);
    }
    
    const newNotes = state.notes.filter(n => !contentIdsToRemove.includes(n.contentId));
    const newCards = state.flashcards.filter(c => !contentIdsToRemove.includes(c.contentId));
    const newQuiz = state.quiz.filter(q => !contentIdsToRemove.includes(q.contentId));
    const newSummaries = { ...state.summaries }; 
    contentIdsToRemove.forEach(cid => { delete newSummaries[cid]; });
    
    localStorage.setItem('bmo_history', JSON.stringify(newHistory)); 
    localStorage.setItem('bmo_notes', JSON.stringify(newNotes)); 
    localStorage.setItem('bmo_flashcards', JSON.stringify(newCards)); 
    localStorage.setItem('bmo_quiz', JSON.stringify(newQuiz)); 
    localStorage.setItem('bmo_summaries', JSON.stringify(newSummaries));
    
    return { history: newHistory, notes: newNotes, flashcards: newCards, quiz: newQuiz, summaries: newSummaries };
  }),
  
  clearHistory: () => set(() => {
    localStorage.removeItem('bmo_history'); 
    localStorage.removeItem('bmo_notes'); 
    localStorage.removeItem('bmo_flashcards'); 
    localStorage.removeItem('bmo_quiz'); 
    localStorage.removeItem('bmo_summaries');
    
    return { history: [], notes: [], flashcards: [], quiz: [], summaries: {} };
  }),

  addPomodoroRecord: () => set((state) => {
    const today = new Date().toISOString().split('T')[0]; 
    const newRecords = { ...state.pomodoroHistory };
    newRecords[today] = (newRecords[today] || 0) + 1; 
    localStorage.setItem('bmo_pomodoro', JSON.stringify(newRecords)); 
    return { pomodoroHistory: newRecords };
  }),

  updateVideoProgress: (id, time) => set((state) => {
    const newProgress = { ...state.videoProgress, [id]: time }; 
    localStorage.setItem('bmo_progress', JSON.stringify(newProgress)); 
    return { videoProgress: newProgress };
  }),
  
  initData: (data) => set((state) => {
    const migratedHistory = (data.history || []).map((h: any) => {
      if (!h.id) {
        if (h.pId) return { ...h, id: h.pId, type: 'playlist', playlistItems: [{ contentId: h.contentId, title: h.title, timestamp: h.timestamp }] };
        return { ...h, id: h.contentId };
      }
      return h;
    });
    return { ...data, history: migratedHistory };
  })
}));
