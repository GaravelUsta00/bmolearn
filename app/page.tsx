"use client";

import React, { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { 
  Moon, Sun, Maximize, Minimize, Plus, Trash2, 
  List, BookOpen, Volume2, VolumeX, Bookmark, 
  Music, X, Timer, Pause, Play, Radio, ArrowRight, 
  PlayCircle, Coffee, Brain, History, Download, 
  CheckSquare, Square, Eye, WifiOff,
  Sparkles, Target, Copy, CheckCircle2, AlertCircle, Circle,
  CalendarDays, SkipForward, MonitorSmartphone, Share,
  Upload, FileText, AlignLeft, Smartphone, ExternalLink,
  ListVideo
} from 'lucide-react';

// ==========================================
// 1. TEMA & STİLLER (CSS Variables)
// ==========================================
const ThemeStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    :root {
      --bg: #09090b;
      --bg-secondary: #000000;
      --card: rgba(24, 24, 27, 0.85);
      --card-solid: #18181b;
      --card-muted: rgba(39, 39, 42, 0.5);
      --text: #f4f4f5;
      --text-secondary: #d4d4d8;
      --text-muted: #a1a1aa;
      --border: #27272a;
      --border-hover: #3f3f46;
      --primary: #FF8C00;
      --primary-hover: #ea580c;
      --primary-muted: rgba(255, 140, 0, 0.15);
      --hover-bg: rgba(255, 255, 255, 0.05);
      --shadow-color: rgba(0, 0, 0, 0.3);
      --danger: #ef4444;
      --danger-muted: rgba(239, 68, 68, 0.1);
      --success: #22c55e;
      --success-muted: rgba(34, 197, 94, 0.1);
      --info: #3b82f6;
      --info-muted: rgba(59, 130, 246, 0.1);
    }
    
    .light-theme {
      --bg: #F8F9FA;
      --bg-secondary: #E9ECEF;
      --card: rgba(255, 255, 255, 0.9);
      --card-solid: #FFFFFF;
      --card-muted: rgba(248, 249, 250, 0.8);
      --text: #212529;
      --text-secondary: #495057;
      --text-muted: #868E96;
      --border: #DEE2E6;
      --border-hover: #CED4DA;
      --primary: #FF8C00;
      --primary-hover: #ea580c;
      --primary-muted: rgba(255, 140, 0, 0.1);
      --hover-bg: rgba(0, 0, 0, 0.04);
      --shadow-color: rgba(0, 0, 0, 0.06);
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      transition: background-color 0.4s ease, color 0.4s ease;
    }

    .app-drag-region { -webkit-app-region: drag; user-select: none; }
    .app-no-drag { -webkit-app-region: no-drag; }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 10px; }
    
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .flip-card .card-inner { transform: rotateY(180deg); }
    
    @keyframes float { 
      0%, 100% { transform: translateY(0px); } 
      50% { transform: translateY(-8px); } 
    }
    
    @keyframes subtleGlow { 
      0%, 100% { opacity: 0.3; transform: scale(0.9); filter: blur(30px); } 
      50% { opacity: 0.6; transform: scale(1.1); filter: blur(40px); } 
    }
    
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-subtle-glow { animation: subtleGlow 4s ease-in-out infinite; }

    @keyframes eq { 
      0% { height: 4px; } 
      50% { height: 16px; } 
      100% { height: 4px; } 
    }
    .animate-eq-1 { animation: eq 0.8s ease-in-out infinite; }
    .animate-eq-2 { animation: eq 1.2s ease-in-out infinite 0.2s; }
    .animate-eq-3 { animation: eq 0.9s ease-in-out infinite 0.4s; }
    
    @keyframes blob { 
      0% { transform: translate(0px, 0px) scale(1); } 
      33% { transform: translate(30px, -50px) scale(1.1); } 
      66% { transform: translate(-20px, 20px) scale(0.9); } 
      100% { transform: translate(0px, 0px) scale(1); } 
    }
    .animate-blob { animation: blob 10s infinite alternate; }
    .animation-delay-2000 { animation-delay: 2s; }
    
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    
    @keyframes taskComplete {
      0% { transform: scale(1); opacity: 1; }
      40% { transform: scale(1.05); opacity: 1; color: var(--success); }
      100% { transform: translateX(50px) scale(0.9); opacity: 0; filter: blur(2px); }
    }
    .animate-todo-complete { animation: taskComplete 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; pointer-events: none; }
  `}} />
);

// ==========================================
// 2. TYPES & CONSTANTS
// ==========================================
declare global {
  interface Window { 
    YT: any; 
    onYouTubeIframeAPIReady: () => void; 
  }
}

interface Note { id: number; contentId: string; text: string; time: number; }
interface Flashcard { id: number; contentId: string; question: string; answer: string; learned?: boolean; }
interface Todo { id: number; text: string; completed: boolean; }
interface WatchedVideo { contentId: string; title: string; timestamp: number; }
interface HistoryItem { 
  id: string; 
  contentId: string; 
  title: string; 
  timestamp: number; 
  type: 'video' | 'document' | 'playlist'; 
  pId?: string | null; 
  playlistItems?: WatchedVideo[]; 
}
interface QuizQuestion { 
  id: number; 
  contentId: string; 
  question: string; 
  options: { A: string; B: string; C: string; D: string }; 
  correct: string; 
  userAnswer?: string; 
}
interface ContentConfig { 
  id: string; 
  type: 'video' | 'document'; 
  title: string; 
  url?: string; 
  pId?: string | null; 
  fileType?: string; 
}

const RADIO_STATIONS = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop', category: 'Odak & Çalışma' },
  { id: 'Dx5qFachd3A', title: 'Relaxing Jazz Piano', category: 'Caz & Rahatlama' },
  { id: '36YnV9STBqc', title: 'The Good Life Radio', category: 'Pop Mix' },
  { id: '3MOrgUjiigE', title: 'Hits Radio 1 Live', category: 'Yabancı Pop' },
  { id: 'Mo5preW8Ig0', title: 'Hit Radyo Türkçe', category: 'Türkçe Pop' },
  { id: 'Fru_Ss-TqgY', title: 'Karadeniz Akustik', category: 'Yöresel & Akustik' },
];

const EXAM_LEVELS = ["KPSS Lisans", "TYT-AYT", "Vize Sınavı", "Final Sınavı", "Genel Çalışma"];

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const extractYTId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*)/);
  return (match && match[1].length === 11) ? match[1] : null;
};

const extractPlaylistId = (url: string) => {
  const match = url.match(/[?&]list=([^#&?]+)/);
  return match ? match[1] : null;
};

const NotificationManager = {
  requestPermission: async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        if(window.self === window.top) await Notification.requestPermission();
      }
    } catch(e) { 
      console.warn("Bildirim izni alınamadı:", e); 
    }
  },
  send: (title: string, body: string) => {
    try {
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(() => {});
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if(window.self === window.top) new Notification(title, { body, icon: '/logo.png' });
      }
      
      let isOriginal = false;
      const originalTitle = document.title;
      const blinkInterval = setInterval(() => { 
        document.title = isOriginal ? originalTitle : `🔔 ${title}`; 
        isOriginal = !isOriginal; 
      }, 1000);
      
      setTimeout(() => { 
        clearInterval(blinkInterval); 
        document.title = originalTitle; 
      }, 10000);
    } catch(e) { 
      console.warn("Bildirim gönderilemedi:", e); 
    }
  }
};

// ==========================================
// 3. GLOBAL STATE (ZUSTAND)
// ==========================================
interface AppState {
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

const useStore = create<AppState>((set) => ({
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

// ==========================================
// 4. UTILS & HELPERS
// ==========================================
const renderMarkdown = (text: string) => {
  let html = text
    .replace(/</g, "&lt;").replace(/>/g, "&gt;") 
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--primary); font-weight: bold;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: var(--text-muted); font-style: italic;">$1</em>')
    .replace(/^- (.*)$/gm, '<li style="margin-left: 1rem; list-style-type: disc; margin-bottom: 0.25rem;">$1</li>')
    .replace(/#{3}\s(.*)$/gm, '<h3 style="font-size: 1.125rem; font-weight: bold; color: var(--text); margin-top: 1rem; margin-bottom: 0.5rem;">$1</h3>')
    .replace(/#{2}\s(.*)$/gm, '<h2 style="font-size: 1.25rem; font-weight: bold; color: var(--primary); margin-top: 1.25rem; margin-bottom: 0.75rem;">$1</h2>')
    .replace(/#{1}\s(.*)$/gm, '<h1 style="font-size: 1.5rem; font-weight: 900; color: var(--text); margin-top: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">$1</h1>')
    .replace(/\n/g, '<br />');
  return { __html: html };
};

// ==========================================
// 5. COMPONENTS
// ==========================================

const PomodoroToast = ({ message, type, isVisible, onClose }: any) => {
  return (
    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
      <div className={`flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl border backdrop-blur-xl ${type === 'break' ? 'bg-[#3b82f6] border-blue-400 text-white shadow-blue-500/30' : 'bg-[#FF8C00] border-orange-400 text-white shadow-[#FF8C00]/30'}`}>
        {type === 'break' ? <Coffee size={20} className="animate-bounce" /> : <Brain size={20} className="animate-pulse" />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"><X size={16} /></button>
      </div>
    </div>
  );
};

const SkeletonLoading = () => (
  <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 space-y-8 animate-pulse">
    <div className="w-64 h-16 bg-[var(--card)] rounded-3xl"></div>
    <div className="w-full max-w-2xl h-14 bg-[var(--card)] rounded-full"></div>
    <div className="flex gap-4">
       <div className="w-32 h-20 bg-[var(--card)] rounded-2xl"></div>
       <div className="w-32 h-20 bg-[var(--card)] rounded-2xl"></div>
       <div className="w-32 h-20 bg-[var(--card)] rounded-2xl"></div>
    </div>
  </div>
);

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    const handleOffline = () => setIsOffline(true); 
    const handleOnline = () => setIsOffline(false);
    if (!navigator.onLine) setIsOffline(true);
    window.addEventListener('offline', handleOffline); 
    window.addEventListener('online', handleOnline);
    return () => { window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline); }
  }, []);
  
  if (!isOffline) return null;
  return (
    <div className="fixed top-0 left-0 w-full bg-[var(--danger)] text-white text-xs font-bold py-1.5 flex items-center justify-center gap-2 z-50 animate-fade-in-up shadow-md">
      <WifiOff size={14} /> İnternet bağlantınız koptu. Lütfen bağlantınızı kontrol edin.
    </div>
  );
};

const BlueLightFilter = () => {
  const { blueLight } = useStore();
  if (blueLight === 0) return null;
  return (<div className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-500" style={{ backgroundColor: 'rgba(255, 140, 0, 0.25)', opacity: blueLight / 100, mixBlendMode: 'multiply' }}></div>);
}

const PWAInjector = () => {
  const setInstallPrompt = useStore(state => state.setInstallPrompt);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.getElementById('pwa-manifest')) {
        const manifest = { name: "BMO Learn", short_name: "BMO Learn", start_url: "/", display: "standalone", background_color: "#09090b", theme_color: "#FF8C00", icons: [{ src: "/logo.png", sizes: "192x192", type: "image/png" }, { src: "/logo.png", sizes: "512x512", type: "image/png" }] };
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const link = document.createElement('link'); link.id = 'pwa-manifest'; link.rel = 'manifest'; link.href = URL.createObjectURL(blob);
        document.head.appendChild(link);
      }
      const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [setInstallPrompt]); 
  return null;
}

const AppInstallModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden p-6 app-no-drag" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2"><MonitorSmartphone className="text-[#FF8C00]"/> Ana Ekrana Ekle</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><X size={20}/></button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">BMO Learn'ü cihazınıza ekleyerek tam ekran ve daha hızlı bir deneyim yaşayabilirsiniz.</p>
        <div className="space-y-4">
          <div className="bg-[var(--card-muted)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5"><Smartphone size={14}/> Android / Chrome / Edge</h4>
            <p className="text-xs text-[var(--text-muted)]">Tarayıcı menüsünden <strong>Ana Ekrana Ekle</strong> veya sağ üstteki indirme simgesine tıklayın.</p>
          </div>
          <div className="bg-[var(--card-muted)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5"><Share size={14}/> iPhone / iPad (Safari)</h4>
            <p className="text-xs text-[var(--text-muted)]">Alt menüdeki <strong>Paylaş</strong> ikonuna dokunun ve <strong>Ana Ekrana Ekle</strong> seçeneğine tıklayın.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const LandingPage = () => {
  const { setView, setContentConfig, history, clearHistory, addToHistory, setPlaylistItems } = useStore();
  const [url, setUrl] = useState('');

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    const vId = extractYTId(url);
    const pId = extractPlaylistId(url);

    if (vId || pId) { 
      setContentConfig({ id: vId || '', type: 'video', pId, title: "YouTube Video" }); 
      setView('app'); 
    } else { 
      const id = "web_" + Date.now();
      setContentConfig({ id, type: 'document', title: "Web Kaynağı", url });
      setPlaylistItems([]);
      setView('app');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = "doc_" + Date.now();
    const objUrl = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setContentConfig({ id, type: 'document', title: file.name, url: objUrl, fileType: ext });
    addToHistory({ contentId: id, title: file.name, timestamp: Date.now(), type: 'document' });
    setPlaylistItems([]);
    setView('app');
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden bg-[var(--bg)] p-4 sm:p-8 transition-colors duration-500`}>
      <div className="absolute top-0 left-0 w-full h-10 app-drag-region z-50"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-[#FF8C00] opacity-10 blur-[80px] md:blur-[120px] rounded-full animate-blob pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-blue-500 opacity-5 blur-[80px] md:blur-[120px] rounded-full animate-blob animation-delay-2000 pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-3xl mx-auto animate-fade-in-up app-no-drag">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center animate-float group cursor-default">
            <div className="absolute inset-0 bg-[#FF8C00] rounded-full animate-subtle-glow pointer-events-none"></div>
            <img src="/logo.png" alt="BMO Learn Logo" className="relative w-full h-full object-contain z-10 drop-shadow-xl transition-transform duration-700 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-[var(--text)] drop-shadow-sm">
            BMO <span className="text-[#FF8C00]">Learn</span>
          </h1>
        </div>

        <p className={`text-base sm:text-lg md:text-xl font-medium tracking-wide mb-10 md:mb-12 text-[var(--text-muted)] text-center`}>
          Sadece odaklan.
        </p>

        <div className="w-full flex flex-col sm:flex-row gap-3 px-2 sm:px-0">
          <form onSubmit={handleStart} className="flex-1 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8C00] to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className={`relative flex items-center p-2 pl-4 sm:pl-6 rounded-3xl bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-2xl transition-colors`}>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube linki (Playlist dahil) veya Web adresi..." className={`flex-1 bg-transparent border-none outline-none text-[var(--text)] text-sm sm:text-base md:text-lg w-full font-medium placeholder-[var(--text-muted)]`} autoFocus />
              {url && (
                <button type="button" onClick={() => setUrl('')} className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><X size={18} /></button>
              )}
              <button type="submit" className={`ml-2 p-3 sm:p-4 rounded-2xl bg-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/20 transition-transform active:scale-95 hover:scale-105 flex items-center justify-center`}><ArrowRight size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} /></button>
            </div>
          </form>
          
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer flex items-center justify-center gap-2 p-3 sm:p-4 rounded-3xl bg-[var(--primary-muted)] text-[#FF8C00] hover:bg-[#FF8C00]/20 transition-all border border-[#FF8C00]/30 shadow-sm active:scale-95">
               <Upload size={22} />
               <span className="font-bold text-sm sm:text-base hidden sm:inline">PDF Yükle</span>
               <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-[var(--text-muted)] bg-[var(--card-muted)] px-5 py-3 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="flex items-center gap-1.5"><FileText size={14} className="text-[var(--text-muted)]" /> Sadece PDF formatı desteklenmektedir.</span>
          <span className="hidden sm:inline text-[var(--border-hover)]">|</span>
          <a href="https://www.ilovepdf.com/tr" target="_blank" rel="noreferrer" className="text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors inline-flex items-center gap-1">
            Farklı bir dosyayı PDF'e dönüştür <ExternalLink size={10} />
          </a>
        </div>

        {history.length > 0 && (
          <div className="mt-16 w-full px-2 sm:px-0 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-wider flex items-center gap-2"><History size={16}/> Son Çalışmalar</h3>
              <button onClick={() => { clearHistory(); }} className="text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-muted)] border border-[var(--danger-muted)] px-3 py-1.5 rounded-xl transition-colors w-full sm:w-auto">
                Geçmişi Temizle
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.slice(0, 3).map((item, idx) => (
                <div key={item.id} onClick={() => { 
                  if (item.type === 'video' || item.type === 'playlist') {
                    setContentConfig({ id: item.contentId, type: 'video', title: item.title, url: undefined, pId: item.pId }); 
                    setView('app'); 
                  } else {
                    setContentConfig({ id: item.contentId, type: 'document', title: item.title, url: undefined, fileType: undefined });
                    useStore.getState().setPendingDocReload({ id: item.contentId, title: item.title });
                    setView('app');
                  }
                }} className={`relative group cursor-pointer rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-muted)] backdrop-blur-md hover:border-[#FF8C00]/50 transition-all shadow-lg`}>
                  {item.type === 'playlist' && (
                     <div className="absolute top-2 left-2 z-20 bg-[#FF8C00] text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                       <ListVideo size={12} /> Koleksiyon
                     </div>
                  )}
                  {item.type === 'video' || item.type === 'playlist' ? (
                    <div className="w-full aspect-video bg-black relative overflow-hidden border-b border-[var(--border)]">
                      <img src={`https://img.youtube.com/vi/${item.contentId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg shadow-[#FF8C00]/30"><Play size={14} fill="currentColor" /></div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-[var(--card-solid)] flex items-center justify-center relative overflow-hidden border-b border-[var(--border)]">
                      <FileText size={48} className="text-[var(--text-muted)] group-hover:text-[#FF8C00] transition-colors duration-300" />
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg shadow-[#FF8C00]/30"><AlignLeft size={14} /></div>
                    </div>
                  )}
                  <div className="p-3">
                     <p className="text-xs font-semibold line-clamp-2 leading-snug text-[var(--text-secondary)] group-hover:text-[#FF8C00] transition-colors">{item.title}</p>
                     {item.type === 'playlist' && <p className="text-[10px] text-[var(--text-muted)] mt-1">{item.playlistItems?.length || 0} Video İzlendi</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsPopover = () => {
  const [isOpen, setIsOpen] = useState(false); 
  const { blueLight, setBlueLight } = useStore();
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={`p-2 sm:p-2.5 rounded-xl ${isOpen ? 'bg-[var(--border)] text-[#FF8C00]' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00]'} transition-colors`} title="Görünüm Ayarları">
        <Eye size={18} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-12 right-0 w-64 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-4 z-50 animate-scale-in origin-top-right">
            <h4 className="text-sm font-bold text-[var(--text)] mb-4 border-b border-[var(--border)] pb-2">Görünüm Ayarları</h4>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] flex justify-between">Mavi Işık Filtresi <span>{blueLight}%</span></label>
              <input type="range" min="0" max="100" value={blueLight} onChange={(e) => setBlueLight(parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[#FF8C00]" />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Göz yorgunluğunu azaltmak için filtreyi artırın.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const HistoryModal = ({ showHistory, setShowHistory }: any) => {
  const { history, setContentConfig, clearHistory, deleteHistoryItem, setPendingDocReload } = useStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<HistoryItem | null>(null);

  useEffect(() => { if (!showHistory) setSelectedPlaylist(null); }, [showHistory]);

  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowHistory(false)}>
      <div className={`w-full max-w-5xl h-[85vh] flex flex-col bg-[var(--bg)] backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden`} onClick={e => e.stopPropagation()}>
        
        <div className={`p-4 sm:p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card-muted)] shrink-0`}>
          <div className="flex items-center gap-3">
            {selectedPlaylist && (
              <button onClick={() => setSelectedPlaylist(null)} className="p-1.5 rounded-lg bg-[var(--card-solid)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors shadow-sm">
                <ArrowRight size={18} className="rotate-180" />
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[var(--text)]">
              <History className="text-[#FF8C00]" /> {selectedPlaylist ? 'Koleksiyon Detayı' : 'Geçmiş Kitaplığı'}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {!selectedPlaylist && <button onClick={() => { clearHistory(); }} className="text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-muted)] px-2 sm:px-3 py-1.5 rounded-xl transition-colors">Tümünü Temizle</button>}
            <button onClick={() => setShowHistory(false)} className={`text-[var(--text-muted)] hover:text-[var(--text)] transition-colors`}><X size={20} /></button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg)] relative">
          {selectedPlaylist ? (
            <div className="flex flex-col h-full animate-fade-in">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--card-solid)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-sm gap-4">
                   <div className="flex items-center gap-4">
                      <div className="relative w-28 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden shadow-sm shrink-0 border border-[var(--border)]">
                         <img src={`https://img.youtube.com/vi/${selectedPlaylist.contentId}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><ListVideo size={24} className="text-white"/></div>
                      </div>
                      <div>
                         <h3 className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">{selectedPlaylist.title}</h3>
                         <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[var(--success)]"/> {selectedPlaylist.playlistItems?.length || 0} Video Tamamlandı</p>
                      </div>
                   </div>
                   <button onClick={() => {
                      setContentConfig({ id: selectedPlaylist.contentId, type: 'video', title: selectedPlaylist.title, pId: selectedPlaylist.pId });
                      setShowHistory(false);
                   }} className="w-full sm:w-auto px-5 py-3 bg-[#FF8C00] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#FF8C00]/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                      <Play size={14} fill="currentColor" /> Kaldığın Yerden Devam
                   </button>
               </div>
               
               <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-6 mb-3 ml-2 flex items-center gap-2"><CheckCircle2 size={14}/> İzleme Geçmişin</h4>
               <div className="flex flex-col gap-2 pb-4">
                  {selectedPlaylist.playlistItems?.map((v, i) => (
                     <button key={v.contentId + i} onClick={() => {
                         setContentConfig({ id: v.contentId, type: 'video', title: v.title, pId: selectedPlaylist.pId });
                         setShowHistory(false);
                     }} className={`w-full text-left p-3 sm:p-4 rounded-2xl border ${v.contentId === selectedPlaylist.contentId ? 'border-[#FF8C00]/50 bg-[var(--primary-muted)]' : 'border-[var(--border)] bg-[var(--card-solid)] hover:border-[#FF8C00]/30 hover:bg-[var(--hover-bg)]'} transition-all flex items-center gap-4 group shadow-sm`}>
                        <div className="relative w-24 h-14 sm:w-28 sm:h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                           <img src={`https://img.youtube.com/vi/${v.contentId}/default.jpg`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                           {v.contentId === selectedPlaylist.contentId && <div className="absolute inset-0 border-2 border-[#FF8C00] rounded-lg"></div>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className={`text-xs sm:text-sm font-semibold truncate ${v.contentId === selectedPlaylist.contentId ? 'text-[#FF8C00]' : 'text-[var(--text)]'}`}>{v.title}</p>
                           <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1.5"><CalendarDays size={10}/> {new Date(v.timestamp).toLocaleDateString('tr-TR')} - {new Date(v.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        {v.contentId === selectedPlaylist.contentId && <span className="shrink-0 text-[10px] font-bold bg-[#FF8C00] text-white px-2.5 py-1 rounded-md shadow-sm">Son İzlenen</span>}
                     </button>
                  ))}
               </div>
            </div>
          ) : history.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3 opacity-60`}>
               <History size={48} />
               <p className="text-sm font-medium">Henüz geçmiş kaydı yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map((item, idx) => (
                <div key={item.id} className={`relative group cursor-pointer rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-solid)] hover:border-[#FF8C00]/50 transition-all shadow-sm flex flex-col h-full`}>
                  <button onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }} className="absolute top-2 right-2 z-30 p-2 rounded-full bg-[var(--danger)] text-white opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md" title="Geçmişi ve Verileri Sil"><Trash2 size={14} /></button>
                  {item.type === 'playlist' && (
                     <div className="absolute top-2 left-2 z-20 bg-[#FF8C00] text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                       <ListVideo size={12} /> Koleksiyon
                     </div>
                  )}
                  <div className="flex-1 flex flex-col" onClick={() => { 
                    if (item.type === 'playlist') {
                      setSelectedPlaylist(item);
                    } else if (item.type === 'video') { 
                      setContentConfig({ id: item.contentId, type: 'video', title: item.title, pId: item.pId }); 
                      setShowHistory(false); 
                    } else { 
                      setContentConfig({ id: item.contentId, type: 'document', title: item.title, url: undefined, fileType: undefined }); 
                      setPendingDocReload({ id: item.contentId, title: item.title }); 
                      setShowHistory(false); 
                    }
                  }}>
                    {item.type === 'video' || item.type === 'playlist' ? (
                      <div className="w-full aspect-video bg-black relative overflow-hidden border-b border-[var(--border)] shrink-0">
                        <img src={`https://img.youtube.com/vi/${item.contentId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                          {item.type === 'playlist' ? <ListVideo size={14} /> : <Play size={14} fill="currentColor" />}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-[var(--card-muted)] flex items-center justify-center relative overflow-hidden border-b border-[var(--border)] shrink-0">
                        <FileText size={40} className="text-[var(--text-muted)] group-hover:text-[#FF8C00] transition-colors" />
                        <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg"><AlignLeft size={14} /></div>
                      </div>
                    )}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                       <p className="text-xs font-semibold line-clamp-2 leading-snug text-[var(--text)] group-hover:text-[#FF8C00] transition-colors">{item.title}</p>
                       {item.type === 'playlist' && <p className="text-[10px] text-[var(--text-muted)] mt-2 flex items-center gap-1"><CheckCircle2 size={10}/> {item.playlistItems?.length || 0} Video Tamamlandı</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RadioWidget = ({ showMusicWidget, setShowMusicWidget, activeStation, isMusicPlaying, musicVolume, setMusicVolume, toggleRadioPlay, changeStation }: any) => {
  if (!showMusicWidget) return null;
  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/10 backdrop-blur-xl z-50 overflow-hidden flex flex-col animate-scale-in`}>
      <div className={`px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b border-[var(--border)] bg-[var(--card-muted)]`}>
        <span className="text-sm font-bold flex items-center gap-2 text-[var(--text)]"><Radio size={16} className="text-[#FF8C00]" /> Odak Radyosu</span>
        <button onClick={() => setShowMusicWidget(false)} className={`text-[var(--text-muted)] hover:text-[var(--text)] transition-colors`}><X size={16} /></button>
      </div>
      <div className="p-4 sm:p-5 flex flex-col items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--card-solid)] border-2 border-[#FF8C00]/30 flex items-center justify-center shadow-lg shadow-[#FF8C00]/10 relative">
          {isMusicPlaying ? (
            <div className="flex items-end gap-1 h-5 sm:h-6">
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-1"></div>
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-2"></div>
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-3"></div>
            </div>
          ) : <Music className="text-[var(--text-muted)]" size={20} />}
        </div>
        <div className="text-center w-full px-2">
          <h3 className="font-bold text-sm truncate text-[var(--text)]">{activeStation.title}</h3>
          <p className={`text-xs text-[var(--text-muted)] mt-1`}>{activeStation.category}</p>
        </div>
        <div className="w-full flex items-center gap-3 sm:gap-4 mt-2">
          <button onClick={toggleRadioPlay} className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-90 shadow-lg ${isMusicPlaying ? 'bg-[var(--card-solid)] text-[var(--text)] border border-[var(--border)]' : `bg-[#FF8C00] text-white shadow-[#FF8C00]/20`}`}>
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-[var(--card-muted)] p-2.5 sm:p-3 rounded-2xl border border-[var(--border)]">
            <Volume2 size={16} className="text-[var(--text-muted)]" />
            <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[#FF8C00]" />
          </div>
        </div>
      </div>
      <div className={`border-t border-[var(--border)] max-h-48 overflow-y-auto custom-scrollbar p-2 bg-[var(--card-solid)]`}>
        {RADIO_STATIONS.map((station) => (
          <button key={station.id} onClick={() => changeStation(station)} className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all ${activeStation.id === station.id ? 'bg-[var(--primary-muted)] border border-[#FF8C00]/30' : `hover:bg-[var(--hover-bg)] border border-transparent`}`}>
            <div className="flex flex-col items-start text-left">
              <span className={`text-sm font-semibold ${activeStation.id === station.id ? "text-[#FF8C00]" : "text-[var(--text)]"}`}>{station.title}</span>
              <span className={`text-[10px] uppercase tracking-wider text-[var(--text-muted)]`}>{station.category}</span>
            </div>
            {activeStation.id === station.id && isMusicPlaying && <PlayCircle size={14} className="text-[#FF8C00]" />}
          </button>
        ))}
      </div>
    </div>
  );
};

const PomodoroHeatmap = () => {
  const { pomodoroHistory } = useStore();
  const days = Array.from({length: 30}, (_, i) => { 
    const d = new Date(); d.setDate(d.getDate() - (29 - i)); 
    return d.toISOString().split('T')[0]; 
  });
  return (
    <div className="mt-6 w-full p-4 bg-[var(--card-solid)] border border-[var(--border)] rounded-[20px] shadow-sm">
      <h3 className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] mb-3 flex items-center gap-1.5 uppercase tracking-wider"><CalendarDays size={14}/> 30 Günlük Harita</h3>
      <div className="flex flex-wrap gap-1.5">
        {days.map(d => {
          const count = pomodoroHistory[d] || 0;
          let bgColor = 'bg-[var(--border)]';
          if (count > 0 && count <= 2) bgColor = 'bg-[#FF8C00]/40'; 
          else if (count > 2 && count <= 5) bgColor = 'bg-[#FF8C00]/70'; 
          else if (count > 5) bgColor = 'bg-[#FF8C00]';
          return (<div key={d} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${bgColor} transition-colors hover:ring-1 hover:ring-[var(--text)]`} title={`${d}: ${count} Pomodoro`} />)
        })}
      </div>
    </div>
  );
};

const PomodoroWidget = ({ showPomodoroWidget, setShowPomodoroWidget, focusDuration, setFocusDuration, breakDuration, setBreakDuration, timerMode, setTimerMode, timeLeft, setTimeLeft, isTimerRunning, setIsTimerRunning }: any) => {
  const { todos, toggleTodo, deleteTodo, addTodo } = useStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!showPomodoroWidget) return null;
  return (
    <div className={`fixed top-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/10 backdrop-blur-xl z-50 overflow-hidden flex flex-col animate-scale-in origin-top-right`}>
      <div className={`px-4 sm:px-5 py-3 flex justify-between items-center border-b border-[var(--border)] bg-[var(--card-muted)]`}>
        <span className="text-sm font-bold flex items-center gap-2 text-[var(--text)]"><Timer size={16} className="text-[#FF8C00]" /> Odak ve Görevler</span>
        <button onClick={() => setShowPomodoroWidget(false)} className={`text-[var(--text-muted)] hover:text-[var(--text)] transition-colors`}><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[75vh] custom-scrollbar pb-4">
        <div className="flex flex-col items-center p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--bg)]">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[10px] sm:text-xs mb-4 ${timerMode === 'break' ? 'bg-[var(--info-muted)] text-[var(--info)]' : 'bg-[var(--primary-muted)] text-[#FF8C00] shadow-sm'}`}>
            {timerMode === 'break' ? <Coffee size={14} /> : <Brain size={14} />}
            {timerMode === 'break' ? 'Mola Zamanı' : 'Odaklanma Zamanı'}
          </div>

          {!isTimerRunning && (
            <div className="flex gap-4 mb-4 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-[var(--text-muted)]`}>ODAK (DK)</span>
                <div className={`flex items-center gap-2 bg-[var(--card-solid)] p-1 rounded-full border border-[var(--border)]`}>
                  <button onClick={() => { if(focusDuration > 1) { setFocusDuration(focusDuration - 1); if(timerMode === 'focus') setTimeLeft((focusDuration - 1) * 60); }}} className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]">-</button>
                  <span className="font-mono text-sm w-6 text-center text-[var(--text)]">{focusDuration}</span>
                  <button onClick={() => { if(focusDuration < 120) { setFocusDuration(focusDuration + 1); if(timerMode === 'focus') setTimeLeft((focusDuration + 1) * 60); }}} className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]">+</button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-[var(--text-muted)]`}>MOLA (DK)</span>
                <div className={`flex items-center gap-2 bg-[var(--card-solid)] p-1 rounded-full border border-[var(--border)]`}>
                  <button onClick={() => { if(breakDuration > 1) { setBreakDuration(breakDuration - 1); if(timerMode === 'break') setTimeLeft((breakDuration - 1) * 60); }}} className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]">-</button>
                  <span className="font-mono text-sm w-6 text-center text-[var(--text)]">{breakDuration}</span>
                  <button onClick={() => { if(breakDuration < 30) { setBreakDuration(breakDuration + 1); if(timerMode === 'break') setTimeLeft((breakDuration + 1) * 60); }}} className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]">+</button>
                </div>
              </div>
            </div>
          )}

          <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-8 ${isTimerRunning ? (timerMode === 'break' ? 'border-[var(--info)]' : 'border-[#FF8C00]') : 'border-[var(--border)]'} flex items-center justify-center mb-5 transition-colors duration-1000 shadow-xl bg-[var(--card)]`}>
            <div className={`absolute inset-0 rounded-full border-4 ${timerMode === 'break' ? 'border-[var(--info-muted)]' : 'border-[var(--primary-muted)]'} m-1.5 transition-colors duration-1000`}></div>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tighter drop-shadow-sm text-[var(--text)]">{formatTime(timeLeft)}</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold flex items-center gap-2 transition-transform active:scale-95 text-xs sm:text-sm shadow-md ${isTimerRunning ? 'bg-[var(--border)] text-[var(--text)]' : (timerMode === 'break' ? 'bg-[var(--info)] text-white' : 'bg-[#FF8C00] text-white')}`}>
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />} 
              {isTimerRunning ? 'DURAKLAT' : (timerMode === 'break' ? 'MOLAYI BAŞLAT' : 'ODAKLAN')}
            </button>
            {timerMode === 'break' && (
               <button onClick={() => { setIsTimerRunning(false); setTimerMode('focus'); setTimeLeft(focusDuration * 60); }} className="p-2.5 sm:p-3 rounded-2xl border border-[var(--border)] text-[#FF8C00] hover:bg-[var(--primary-muted)] transition-colors active:scale-95 bg-[var(--card)]" title="Molayı Atla ve Odaklan"><SkipForward size={16} /></button>
            )}
            <button onClick={() => { setIsTimerRunning(false); setTimeLeft(timerMode === 'focus' ? focusDuration * 60 : breakDuration * 60); }} className={`p-2.5 sm:p-3 rounded-2xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95 bg-[var(--card)]`} title="Sıfırla"><Timer size={16} /></button>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col bg-[var(--card)]">
          <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-[var(--text)]"><List size={14} className="text-[#FF8C00]"/> Günlük Görevler</h3>
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className={`text-[10px] text-[var(--text-muted)] text-center py-2`}>Hedeflerinizi belirleyin ve bitirdikçe işaretleyin.</p>
            ) : (
              todos.map(todo => (
                <div key={todo.id} onAnimationEnd={() => { if(deletingId === todo.id) { deleteTodo(todo.id); setDeletingId(null); } }} className={`flex items-center gap-2 p-2 rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] group shadow-sm ${deletingId === todo.id ? 'animate-todo-complete' : 'transition-all'}`}>
                  <button onClick={() => { if(deletingId !== todo.id) { toggleTodo(todo.id); setDeletingId(todo.id); } }} className={`${todo.completed || deletingId === todo.id ? 'text-[#FF8C00]' : 'text-[var(--text-muted)]'} hover:text-[#ea580c] transition-colors`}>{todo.completed || deletingId === todo.id ? <CheckSquare size={14} /> : <Square size={14} />}</button>
                  <p className={`flex-1 text-xs ${todo.completed || deletingId === todo.id ? 'line-through text-[#FF8C00]/80 font-semibold' : 'text-[var(--text)]'}`}>{todo.text}</p>
                  <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-[var(--danger)] hover:bg-[var(--danger-muted)] p-1 rounded transition-colors"><Trash2 size={12}/></button>
                </div>
              ))
            )}
          </div>
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const fd = new FormData(e.currentTarget); 
            const txt = fd.get('todoInput')?.toString(); 
            if(!txt || !txt.trim()) return; 
            addTodo(txt); 
            e.currentTarget.reset(); 
          }} className="mt-3 relative">
            <input name="todoInput" type="text" placeholder="Yeni görev ekle..." className={`w-full pl-3 pr-8 py-2.5 rounded-2xl bg-[var(--card-solid)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[#FF8C00] transition-colors`} />
            <button type="submit" className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-[#FF8C00] text-white shadow-md active:scale-95 transition-transform`}><Plus size={14} /></button>
          </form>
          <PomodoroHeatmap />
        </div>
      </div>
    </div>
  );
};

const AIModal = ({ isOpen, onClose, activeContentId, contentConfig, setActiveTab }: any) => {
  const { replaceContentAI } = useStore();
  const [aiResponse, setAiResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>(EXAM_LEVELS[0]);

  if (!isOpen) return null;

  const promptTemplate = `Sen bir eğitim asistanısın. Aşağıdaki kurallara KESİNLİKLE uy:
1. İçeriğin dili neyse tüm yanıtı O DİLDE ver (İngilizce ise İngilizce, Türkçe ise Türkçe).
2. Yanıtın SADECE geçerli bir JSON objesi olmalıdır. Ekstra metin veya açıklama KULLANMA.
3. Seviye: ${selectedLevel}

FORMAT:
{
  "summary": "# Başlık\\nDetaylı Markdown özet buraya gelecek.",
  "cards": [
    { "question": "Soru 1?", "answer": "Cevap 1" }
  ],
  "quiz": [
    {
      "question": "Çoktan Seçmeli Soru 1?",
      "options": { "A": "Seçenek A", "B": "Seçenek B", "C": "Seçenek C", "D": "Seçenek D" },
      "correct": "A"
    }
  ]
}

BAŞLIK: ${contentConfig.title}
${contentConfig.type === 'video' ? `LİNK: https://www.youtube.com/watch?v=${activeContentId}` : ''}`;

  const handleCopyPrompt = () => { 
    navigator.clipboard.writeText(promptTemplate); 
    setSuccessMsg('Kopyalandı! Yapay zekaya yapıştırın.'); 
    setTimeout(() => setSuccessMsg(''), 3000); 
  };
  
  const handleParseJSON = () => {
    setErrorMsg(''); 
    if (!aiResponse.trim()) return setErrorMsg('Lütfen AI cevabını yapıştırın.');
    try {
      let cleanJsonStr = aiResponse;
      const startIndex = cleanJsonStr.indexOf('{'); 
      const endIndex = cleanJsonStr.lastIndexOf('}');
      if (startIndex === -1 || endIndex === -1) throw new Error("JSON objesi bulunamadı");
      
      cleanJsonStr = cleanJsonStr.substring(startIndex, endIndex + 1);
      cleanJsonStr = cleanJsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      const parsed = JSON.parse(cleanJsonStr);
      
      if (!parsed.summary && !parsed.cards && !parsed.quiz) throw new Error("Format uyuşmazlığı");
      
      const newCards = (parsed.cards || []).map((c: any) => ({ id: Date.now() + Math.random(), contentId: activeContentId, question: c.question || "Soru bulunamadı", answer: c.answer || "Cevap bulunamadı", learned: false }));
      const newQuiz = (parsed.quiz || []).map((q: any) => ({ id: Date.now() + Math.random(), contentId: activeContentId, question: q.question || "Soru bulunamadı", options: q.options || { A: "A", B: "B", C: "C", D: "D" }, correct: q.correct || "A" }));
      
      replaceContentAI(activeContentId, newCards, newQuiz, parsed.summary || "");
      setAiResponse(''); 
      setActiveTab('summary'); 
      onClose();
    } catch (e) { 
      setErrorMsg('Geçersiz format. Lütfen sadece JSON formatını yapıştırın.'); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl flex flex-col bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-3 sm:p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card-muted)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--info-muted)] text-[var(--info)]"><Sparkles size={16} /></div>
            <h2 className="text-sm font-bold text-[var(--text)]">Kompakt AI Sihirbazı</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 flex flex-col gap-5 bg-[var(--bg)]">
          <div className="flex flex-col gap-3 bg-[var(--card-muted)] p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#FF8C00] flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[var(--primary-muted)] flex items-center justify-center text-[10px]">1</span> Seviye Seç & Kopyala</span>
              <button onClick={handleCopyPrompt} className="flex items-center gap-1 text-[10px] font-bold bg-[#FF8C00] text-white px-3 py-1.5 rounded-lg hover:scale-105 transition-transform active:scale-95 shadow-md"><Copy size={12} /> İsteği Kopyala</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAM_LEVELS.map(level => (
                <button key={level} onClick={() => setSelectedLevel(level)} className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold transition-colors ${selectedLevel === level ? 'bg-[var(--primary-muted)] border-[#FF8C00] text-[#FF8C00]' : 'bg-[var(--card-solid)] border-[var(--border)] text-[var(--text-muted)] hover:border-[#FF8C00]/50'}`}>{level}</button>
              ))}
            </div>
            {successMsg && <p className="text-[10px] text-[var(--success)] font-bold flex items-center gap-1"><CheckCircle2 size={12} /> {successMsg}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-[var(--info)] flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[var(--info-muted)] flex items-center justify-center text-[10px]">2</span> AI Cevabını (JSON) Yapıştır</span>
            <textarea value={aiResponse} onChange={(e) => setAiResponse(e.target.value)} placeholder="Yapay zekanın verdiği { ile başlayıp } ile biten JSON formatlı cevabı buraya yapıştırın..." className="w-full bg-[var(--card-solid)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text)] outline-none focus:border-[var(--info)] resize-none custom-scrollbar min-h-35"></textarea>
            {errorMsg && <p className="text-[10px] text-[var(--danger)] font-bold flex items-center gap-1"><AlertCircle size={12} /> {errorMsg}</p>}
            <button onClick={handleParseJSON} className="w-full py-3 rounded-xl bg-[var(--info)] text-white font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-all mt-auto"><Sparkles size={14} /> İçerikleri Sisteme Aktar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryTab = ({ activeContentId }: any) => {
  const { summaries, addNote } = useStore();
  const summary = summaries[activeContentId];
  const [selectedText, setSelectedText] = useState(""); 
  const [showPopup, setShowPopup] = useState(false);

  const handlePointerUp = () => { 
    setTimeout(() => { 
      const text = window.getSelection()?.toString().trim(); 
      if (text && text.length > 0) { setSelectedText(text); setShowPopup(true); } 
      else setShowPopup(false); 
    }, 50); 
  };
  
  const handleAddToNotes = () => { 
    addNote({ id: Date.now(), contentId: activeContentId, text: `> ${selectedText}`, time: 0 }); 
    setShowPopup(false); 
    window.getSelection()?.removeAllRanges(); 
  };

  if (!summary) return (
    <div className={`text-center py-16 text-[var(--text-muted)] flex flex-col items-center gap-4 animate-fade-in`}>
      <div className={`p-4 rounded-full bg-[var(--card-solid)]`}><AlignLeft size={32} className="opacity-50" /></div>
      <p className="text-xs sm:text-sm">Bu içerik için henüz özet yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
    </div>
  );
  
  return (
    <div onPointerUp={handlePointerUp} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar text-sm leading-relaxed text-[var(--text-secondary)] relative animate-fade-in">
      {showPopup && (
        <div className="sticky top-0 z-20 flex justify-center mb-4 animate-fade-in-up">
          <button onPointerDown={(e) => { e.preventDefault(); handleAddToNotes(); }} className="px-4 py-2 bg-[#FF8C00] text-white font-bold rounded-2xl shadow-xl shadow-[#FF8C00]/30 flex items-center gap-2 active:scale-95 transition-transform"><Bookmark size={16} /> Seçili Metni Notlara Ekle</button>
        </div>
      )}
      <div dangerouslySetInnerHTML={renderMarkdown(summary)} />
    </div>
  );
};

const QuizTab = ({ activeContentId }: any) => {
  const { quiz, answerQuizQuestion, deleteQuizQuestion, resetQuiz } = useStore();
  const currentQuiz = quiz.filter(q => q.contentId === activeContentId);

  if (currentQuiz.length === 0) return (
    <div className={`text-center py-16 text-[var(--text-muted)] flex flex-col items-center gap-4 animate-fade-in`}>
      <div className={`p-4 rounded-full bg-[var(--card-solid)]`}><Target size={32} className="opacity-50" /></div>
      <p className="text-xs sm:text-sm">Bu içerik için henüz Quiz yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
    </div>
  );

  const correctCount = currentQuiz.filter(q => q.userAnswer === q.correct).length;
  const answeredCount = currentQuiz.filter(q => !!q.userAnswer).length;
  const wrongCount = answeredCount - correctCount;

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--card-muted)] flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-[10px] bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success-muted)]`}>Doğru: {correctCount}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-[10px] bg-[var(--danger-muted)] text-[var(--danger)] border border-[var(--danger-muted)]`}>Yanlış: {wrongCount}</span>
        </div>
        <button onClick={() => resetQuiz(activeContentId)} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] px-3 py-1 rounded-[10px] transition-colors">Sıfırla</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {currentQuiz.map((q, i) => {
          const isAnswered = !!q.userAnswer; 
          const isActuallyCorrect = q.correct === q.userAnswer;
          return (
            <div key={q.id} className="relative group bg-[var(--card-solid)] backdrop-blur-sm border border-[var(--border)] rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <button onClick={() => deleteQuizQuestion(q.id)} className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-[var(--danger)] text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"><Trash2 size={12} /></button>
              <h4 className="text-sm font-semibold text-[var(--text)] mb-4 leading-relaxed"><span className="text-[#FF8C00] mr-1">{i+1}.</span> {q.question}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const isSelected = q.userAnswer === opt;
                  let btnStyle = "bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#FF8C00] hover:text-[#FF8C00]";
                  if (isAnswered) {
                    if (q.correct === opt) btnStyle = "bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)] font-bold";
                    else if (isSelected) btnStyle = "bg-[var(--danger-muted)] border-[var(--danger)] text-[var(--danger)]";
                    else btnStyle = "bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] opacity-50 cursor-not-allowed";
                  }
                  return (
                    <button key={opt} disabled={isAnswered} onClick={() => answerQuizQuestion(q.id, opt)} className={`flex items-center gap-3 p-3 rounded-2xl border text-left text-xs sm:text-sm transition-all ${btnStyle}`}>
                      <span className="w-6 h-6 shrink-0 rounded-full bg-black/10 dark:bg-black/30 flex items-center justify-center font-bold text-[10px]">{opt}</span><span className="flex-1">{q.options[opt as keyof typeof q.options]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FlashcardsTab = ({ activeContentId }: any) => {
  const { flashcards, deleteFlashcard, toggleFlashcardLearned, resetFlashcards } = useStore();
  const currentCards = flashcards.filter(c => c.contentId === activeContentId);
  const learnedCount = currentCards.filter(c => c.learned).length;
  const [isStudyMode, setIsStudyMode] = useState(false); 
  const [currentIndex, setCurrentIndex] = useState(0);

  if (currentCards.length === 0) return (
    <div className={`text-center py-10 sm:py-16 text-[var(--text-muted)] flex flex-col items-center gap-4 animate-fade-in`}>
      <div className={`p-3 sm:p-4 rounded-full bg-[var(--card-solid)]`}><BookOpen size={24} className="sm:w-8 sm:h-8 opacity-50" /></div>
      <p className="text-xs sm:text-sm">Bu içerik için henüz Kart yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
    </div>
  );

  if (isStudyMode) {
    const currentCard = currentCards[currentIndex];
    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--card-muted)] flex justify-between items-center">
          <button onClick={() => setIsStudyMode(false)} className="text-xs font-bold text-[#FF8C00] hover:text-orange-400 flex items-center gap-1 transition-colors"><ArrowRight className="rotate-180" size={14}/> Geri Dön</button>
          <span className="text-xs font-bold text-[var(--text-muted)]">Kart {currentIndex + 1} / {currentCards.length}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-[var(--bg)]">
          {currentCard && (
            <div key={currentCard.id} className="relative group perspective-1000 w-full max-w-md h-64 sm:h-80 cursor-pointer" onClick={(e) => { e.currentTarget.classList.toggle('flip-card'); }}>
              <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
                <div className={`absolute w-full h-full backface-hidden rounded-[20px] sm:rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-6 sm:p-8 flex items-center justify-center text-center shadow-xl`}><p className="font-medium text-base sm:text-lg text-[var(--text)]">{currentCard.question}</p></div>
                <div className={`absolute w-full h-full backface-hidden rounded-[20px] sm:rounded-3xl border border-[#FF8C00]/50 bg-[var(--primary-muted)] p-6 sm:p-8 flex items-center justify-center text-center rotate-y-180 shadow-xl`}><p className={`font-bold text-base sm:text-lg text-[#FF8C00]`}>{currentCard.answer}</p></div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md">
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--text)] rounded-2xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1 active:scale-95 shadow-sm">Önceki</button>
            <button onClick={() => toggleFlashcardLearned(currentCard.id)} className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all active:scale-95 ${currentCard.learned ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]' : 'border-[var(--border)] bg-[var(--card-solid)] text-[var(--text-muted)] hover:border-[#FF8C00]'}`} title="Öğrendim İşaretle">{currentCard.learned ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
            <button onClick={() => setCurrentIndex(Math.min(currentCards.length - 1, currentIndex + 1))} disabled={currentIndex === currentCards.length - 1} className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--text)] rounded-2xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1 active:scale-95 shadow-sm">Sonraki</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--card-muted)] flex justify-between items-center">
        <span className="text-xs font-bold text-[var(--text-muted)]">Öğrenilen: {learnedCount}/{currentCards.length}</span>
        <div className="flex gap-2">
          <button onClick={() => resetFlashcards(activeContentId)} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card-solid)] border border-[var(--border)] hover:bg-[var(--hover-bg)] px-3 py-1 rounded-[10px] transition-colors">Sıfırla</button>
          <button onClick={() => { setIsStudyMode(true); setCurrentIndex(0); }} className="text-xs font-bold text-white bg-[#FF8C00] hover:bg-[#ea580c] px-3 py-1 rounded-[10px] flex items-center gap-1 transition-colors shadow-md"><Play size={12}/> Çalış</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-[var(--bg)]">
        {currentCards.map(card => (
          <div key={card.id} className={`relative group perspective-1000 h-24 sm:h-28 cursor-pointer ${card.learned ? 'opacity-60 hover:opacity-100' : ''}`} onClick={(e) => { e.currentTarget.classList.toggle('flip-card'); }}>
            <button onClick={(e) => { e.stopPropagation(); deleteFlashcard(card.id); }} className="absolute -top-2 -right-2 z-20 p-1.5 rounded-full bg-[var(--danger)] text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Trash2 size={12} /></button>
            {card.learned && <div className="absolute top-2 left-2 z-10 text-[var(--success)] bg-[var(--bg)] rounded-full shadow-sm"><CheckCircle2 size={16} /></div>}
            <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
              <div className={`absolute w-full h-full backface-hidden rounded-[20px] border ${card.learned ? 'border-[var(--success)]' : 'border-[var(--border)]'} bg-[var(--card-solid)] p-4 flex items-center justify-center text-center shadow-sm`}><p className="font-medium text-xs sm:text-sm text-[var(--text)]">{card.question}</p></div>
              <div className={`absolute w-full h-full backface-hidden rounded-[20px] border border-[#FF8C00]/50 bg-[var(--primary-muted)] p-4 flex items-center justify-center text-center rotate-y-180 shadow-md`}><p className={`font-bold text-xs sm:text-sm text-[#FF8C00]`}>{card.answer}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressBar = () => {
  const { flashcards, quiz, activeContentId } = useStore();
  const cards = flashcards.filter(c => c.contentId === activeContentId); 
  const quizzes = quiz.filter(q => q.contentId === activeContentId);
  const total = cards.length + quizzes.length; 
  const completed = cards.filter(c => c.learned).length + quizzes.filter(q => q.userAnswer).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  return (
    <div className="flex flex-col w-28 sm:w-40 gap-1.5 mr-2">
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold tracking-wider uppercase"><span>İlerleme</span><span className="text-[#FF8C00]">{percentage}%</span></div>
      <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#FF8C00] transition-all duration-700 shadow-[0_0_10px_rgba(255,140,0,0.8)]" style={{ width: `${percentage}%` }}></div></div>
    </div>
  );
};

// ==========================================
// 6. MAIN APPLICATION (App)
// ==========================================
export default function App() {
  const { 
    view, theme, setTheme, globalMuted, notes, flashcards, quiz, summaries, todos, history, activeContentId, contentConfig, installPrompt, pendingDocReload, videoProgress, playlistItems, currentPlaylistIndex,
    setContentConfig, setActiveContentId, initData, addNote, deleteNote, addPomodoroRecord, updateVideoProgress, updateContentTitle, setPlaylistItems, setCurrentPlaylistIndex,
    addToHistory, toggleGlobalMute, deleteTodo, setPendingDocReload
  } = useStore();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'summary' | 'flashcards' | 'quiz'>('notes');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false); 
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showPomodoroWidget, setShowPomodoroWidget] = useState<boolean>(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  
  const [pomodoroToast, setPomodoroToast] = useState<{message: string, type: 'focus'|'break'|null, isVisible: boolean}>({message: '', type: null, isVisible: false});

  const [newNote, setNewNote] = useState<string>('');
  const noteInputRef = useRef<HTMLInputElement>(null); 
  
  const playerRef = useRef<any>(null); 
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [videoError, setVideoError] = useState<boolean>(false);
  const loadedPlaylistRef = useRef<string | null>(null);
  
  const [showMusicWidget, setShowMusicWidget] = useState<boolean>(false);
  const [activeStation, setActiveStation] = useState(RADIO_STATIONS[0]);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(30);
  const musicPlayerRef = useRef<any>(null);

  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
     let meta = document.querySelector('meta[name="google"]') as HTMLMetaElement | null;
    if (!meta) { 
      meta = document.createElement('meta') as HTMLMetaElement; 
      meta.name = 'google'; 
      meta.content = 'notranslate'; 
      document.head.appendChild(meta); 
    }
    document.title = "BMO Learn | Sadece odaklan.";
  }, []);

  useEffect(() => {
    const sNotes = localStorage.getItem('bmo_notes'); 
    const sCards = localStorage.getItem('bmo_flashcards'); 
    const sQuiz = localStorage.getItem('bmo_quiz'); 
    const sSummaries = localStorage.getItem('bmo_summaries'); 
    const sTodos = localStorage.getItem('bmo_todos'); 
    const sHistory = localStorage.getItem('bmo_history'); 
    const sPomodoro = localStorage.getItem('bmo_pomodoro'); 
    const sProgress = localStorage.getItem('bmo_progress');
    
    let savedTheme = localStorage.getItem('bmo_theme'); 
    if(!savedTheme) savedTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; 
    setTheme(savedTheme as 'dark' | 'light');
    
    initData({ 
      notes: sNotes ? JSON.parse(sNotes) : [], 
      flashcards: sCards ? JSON.parse(sCards) : [], 
      quiz: sQuiz ? JSON.parse(sQuiz) : [], 
      summaries: sSummaries ? JSON.parse(sSummaries) : {}, 
      todos: sTodos ? JSON.parse(sTodos) : [], 
      history: sHistory ? JSON.parse(sHistory) : [], 
      pomodoroHistory: sPomodoro ? JSON.parse(sPomodoro) : {}, 
      videoProgress: sProgress ? JSON.parse(sProgress) : {} 
    });
    
    NotificationManager.requestPermission(); 
    const timer = setTimeout(() => setIsInitializing(false), 500); 
    return () => clearTimeout(timer);
  }, [initData, setTheme]);

  const showToastNotification = (msg: string, type: 'focus'|'break') => {
    setPomodoroToast({ message: msg, type, isVisible: true });
    setTimeout(() => setPomodoroToast(prev => ({...prev, isVisible: false})), 5000);
  }

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      if (timerMode === 'focus') {
        addPomodoroRecord(); setTimerMode('break'); setTimeLeft(breakDuration * 60); setIsTimerRunning(false);
        NotificationManager.send("Odaklanma Bitti!", "Harika çalıştın. Şimdi kısa bir mola zamanı.");
        showToastNotification("Pomodoro bitti, dinlenme zamanı.", "break");
      } else {
        setTimerMode('focus'); setTimeLeft(focusDuration * 60); setIsTimerRunning(false);
        NotificationManager.send("Mola Bitti!", "Enerjini topladıysan yeniden odaklanma zamanı.");
        showToastNotification("Mola bitti, odaklanma zamanı.", "focus");
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, focusDuration, breakDuration, addPomodoroRecord]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (view === 'app' && contentConfig.type === 'video' && playerRef.current?.getPlayerState) {
        if (playerRef.current.getPlayerState() === 1) { 
           const currentTime = playerRef.current.getCurrentTime();
           if (currentTime > 0) updateVideoProgress(useStore.getState().activeContentId || contentConfig.id, currentTime);
        }
      }
    }, 5000); 
    return () => clearInterval(progressInterval);
  }, [view, contentConfig, updateVideoProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement; 
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (e.altKey && e.key.toLowerCase() === 'n') { 
        e.preventDefault(); 
        setActiveTab('notes'); 
        setTimeout(() => noteInputRef.current?.focus(), 100); 
      }
      if (e.ctrlKey && e.code === 'Space' && !isInput && contentConfig.type === 'video') {
        e.preventDefault();
        if (playerRef.current?.getPlayerState) { 
          if (playerRef.current.getPlayerState() === 1) playerRef.current.pauseVideo(); 
          else playerRef.current.playVideo(); 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown); 
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contentConfig.type]);

  useEffect(() => {
    const handleFullscreenChange = () => { setIsFocusMode(!!(document.fullscreenElement || (document as any).webkitFullscreenElement)); };
    document.addEventListener('fullscreenchange', handleFullscreenChange); 
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => { 
      document.removeEventListener('fullscreenchange', handleFullscreenChange); 
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange); 
    }
  }, []);

  useEffect(() => {
    if (playerRef.current?.isMuted) globalMuted ? playerRef.current.mute() : playerRef.current.unMute();
    if (musicPlayerRef.current?.isMuted) globalMuted ? musicPlayerRef.current.mute() : musicPlayerRef.current.unMute();
  }, [globalMuted]);

  useEffect(() => {
    if (isInitializing) return; 
    const tryInitPlayers = () => {
      if (!window.YT || !document.getElementById('youtube-music-player')) { 
        setTimeout(tryInitPlayers, 100); 
        return; 
      }
      if (document.getElementById('youtube-main-player')) initMainPlayer();
      initMusicPlayer();
    };
    
    if (!window.YT) {
      const tag = document.createElement('script'); 
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0]; 
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = tryInitPlayers;
    } else { 
      tryInitPlayers(); 
    }
  }, [isInitializing]); 

  // ==========================================
  // PROFESYONEL PLAYER (OYNATICI) YÖNETİMİ
  // ==========================================
  const initMainPlayer = () => {
    if (playerRef.current?.destroy) { 
      try { playerRef.current.destroy(); } catch(e) {} 
    }
    
    const savedTime = useStore.getState().videoProgress[contentConfig.id] || 0;
    const playerVars: any = { 
      autoplay: 1, rel: 0, origin: typeof window !== 'undefined' ? window.location.origin : '', start: Math.floor(savedTime) 
    };

    if (contentConfig.pId) { 
      playerVars.listType = 'playlist'; 
      playerVars.list = contentConfig.pId; 
    }

    const playerOpts: any = {
      host: 'https://www.youtube.com', 
      playerVars: playerVars,
      events: {
        'onStateChange': (e: any) => {
          if (e.target.getVideoData) {
            const data = e.target.getVideoData();
            if (data.video_id) {
              if (contentConfig.type === 'video' && useStore.getState().activeContentId !== data.video_id) {
                setActiveContentId(data.video_id);
              }
              if (data.title && (e.data === window.YT.PlayerState.PLAYING || e.data === window.YT.PlayerState.CUED)) {
                if(useStore.getState().contentConfig.title !== data.title) updateContentTitle(data.title);
                addToHistory({ contentId: data.video_id, title: data.title, timestamp: Date.now(), type: 'video', pId: contentConfig.pId });
              }
            }
          }
          if (e.target.getPlaylist && (e.data === window.YT.PlayerState.PLAYING || e.data === window.YT.PlayerState.CUED)) {
            const pItems = e.target.getPlaylist();
            if (pItems && pItems.length > 0) {
              const currentItems = useStore.getState().playlistItems;
              if (pItems.length !== currentItems.length || pItems[0] !== currentItems[0]) setPlaylistItems(pItems);
              setCurrentPlaylistIndex(e.target.getPlaylistIndex());
            } else { setPlaylistItems([]); }
          }
        },
        'onError': (e: any) => { console.error("YT Error:", e.data); setVideoError(true); }
      }
    };

    if (contentConfig.id && contentConfig.type === 'video') playerOpts.videoId = contentConfig.id;

    playerRef.current = new window.YT.Player('youtube-main-player', playerOpts);
  };

  useEffect(() => {
    if (contentConfig.type === 'video') {
      const targetId = contentConfig.id;
      const savedTime = useStore.getState().videoProgress[targetId] || 0;
      
      if (window.YT && window.YT.Player) {
        if (!playerRef.current || typeof playerRef.current.loadVideoById !== 'function') { 
          initMainPlayer(); 
        } else {
           setVideoError(false);
           const currentPId = playerRef.current.getPlaylistId ? playerRef.current.getPlaylistId() : null;
           const currentVId = playerRef.current.getVideoData ? playerRef.current.getVideoData()?.video_id : null;
           
           if (contentConfig.pId) {
             if (currentPId !== contentConfig.pId) {
                initMainPlayer();
             } else if (currentVId !== contentConfig.id) {
                const pItems = playerRef.current.getPlaylist() || [];
                const idx = pItems.indexOf(contentConfig.id);
                if (idx !== -1) { playerRef.current.playVideoAt(idx); } 
                else { initMainPlayer(); }
             } else if (playerRef.current.getPlayerState() !== 1) { 
                playerRef.current.playVideo(); 
             }
           } else if (contentConfig.id) {
             if (currentVId !== contentConfig.id || currentPId) {
               if (currentPId) { initMainPlayer(); } 
               else { playerRef.current.loadVideoById({ videoId: contentConfig.id, startSeconds: Math.floor(savedTime) }); }
             } else if (playerRef.current.getPlayerState() !== 1) { 
               playerRef.current.playVideo(); 
             }
           }
        }
      }
    }
    
    if (contentConfig.id) setActiveContentId(contentConfig.id);
  }, [contentConfig.id, contentConfig.pId, contentConfig.type]);

  const initMusicPlayer = () => {
    if (musicPlayerRef.current?.destroy) musicPlayerRef.current.destroy();
    musicPlayerRef.current = new window.YT.Player('youtube-music-player', {
      host: 'https://www.youtube.com', 
      videoId: activeStation.id, 
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' },
      events: {
        'onReady': (e: any) => { 
          e.target.setVolume(musicVolume); 
          if (globalMuted) e.target.mute(); 
        },
        'onStateChange': (e: any) => { 
          if (e.data === window.YT.PlayerState.PLAYING) setIsMusicPlaying(true); 
          else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) setIsMusicPlaying(false); 
        }
      }
    });
  };

  const handleDashboardUrlChange = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!videoUrlInput.trim()) return;
    
    const vId = extractYTId(videoUrlInput); 
    const pId = extractPlaylistId(videoUrlInput);

    if (vId || pId) { 
      setContentConfig({ id: vId || '', type: 'video', pId, title: "YouTube Video" }); 
      setVideoUrlInput(''); 
      if(pId) setShowPlaylistSidebar(true); 
    } else { 
      const id = "web_" + Date.now(); 
      setContentConfig({ id, type: 'document', title: "Web Kaynağı", url: videoUrlInput }); 
      setVideoUrlInput(''); 
      setPlaylistItems([]);
    }
  };

  const handleDashboardFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    const id = "doc_" + Date.now(); 
    const objUrl = URL.createObjectURL(file); 
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setContentConfig({ id, type: 'document', title: file.name, url: objUrl, fileType: ext }); 
    setPlaylistItems([]);
  };

  const jumpToTime = (time: number) => { 
    if (contentConfig.type === 'video' && playerRef.current?.seekTo) { 
      playerRef.current.seekTo(time, true); 
      playerRef.current.playVideo(); 
    } 
  };

  const handleExportNotes = () => {
    const currentNotes = notes.filter(n => n.contentId === activeContentId);
    if (currentNotes.length === 0) return alert("İndirilecek not bulunamadı.");
    const title = history.find(h => h.contentId === activeContentId)?.title || "BMO_Learn";
    const dateStr = new Date().toLocaleDateString('tr-TR'); 
    let content = `BMO Learn - Çalışma Notları\nİçerik Başlığı: ${title}\nTarih: ${dateStr}\n-----------------------------------\n\n`;
    currentNotes.forEach(n => { content += `[${n.time > 0 ? formatTime(n.time) : '-'}] ${n.text}\n`; });
    
    navigator.clipboard.writeText(content).catch(() => {});
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); 
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, ''); 
      a.download = `${safeTitle} - ${dateStr}.txt`;
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a); 
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 3000);
    } catch (error) { 
      alert("İndirme kısıtlandı. Notlarınız panoya kopyalandı! Doğrudan bir belgeye yapıştırabilirsiniz."); 
    }
  };

  const handleMusicVolumeChange = (val: number) => { 
    setMusicVolume(val); 
    if (musicPlayerRef.current?.setVolume) musicPlayerRef.current.setVolume(val); 
  };

  const toggleRadioPlay = () => { 
    if (!musicPlayerRef.current?.getPlayerState) return; 
    isMusicPlaying ? musicPlayerRef.current.pauseVideo() : musicPlayerRef.current.playVideo(); 
  };
  
  const changeStation = (station: typeof RADIO_STATIONS[0]) => { 
    setActiveStation(station); 
    if (musicPlayerRef.current?.loadVideoById) { 
      musicPlayerRef.current.loadVideoById(station.id); 
      setIsMusicPlaying(true); 
    } 
  };

  const toggleFocusMode = async () => {
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      try { 
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); 
        else if ((document.documentElement as any).webkitRequestFullscreen) await (document.documentElement as any).webkitRequestFullscreen(); 
        setIsFocusMode(true); 
      } catch (e) { }
    } else {
      try { 
        if (document.exitFullscreen) await document.exitFullscreen(); 
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen(); 
        setIsFocusMode(false); 
      } catch (e) { }
    }
  };

  const handleInstallClick = () => {
    if (installPrompt) { 
      installPrompt.prompt(); 
      installPrompt.userChoice.then(() => useStore.setState({ installPrompt: null })); 
    } else { 
      setShowInstallModal(true); 
    }
  }

  const handlePlaylistVideoSelect = (index: number) => {
    if (playerRef.current && typeof playerRef.current.playVideoAt === 'function') {
      playerRef.current.playVideoAt(index);
      setCurrentPlaylistIndex(index);
    }
  };

  const currentNotes = notes.filter(n => n.contentId === activeContentId);

  if (isInitializing) return <SkeletonLoading />;

  return (
    <>
      <ThemeStyles />
      <PWAInjector />
      <AppInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      <OfflineBanner />
      <BlueLightFilter />
      <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50"><div id="youtube-music-player"></div></div>
      
      <PomodoroToast message={pomodoroToast.message} type={pomodoroToast.type} isVisible={pomodoroToast.isVisible} onClose={() => setPomodoroToast(prev => ({...prev, isVisible: false}))} />

      {pendingDocReload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-[var(--primary-muted)] text-[#FF8C00] rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} /></div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Dokümanı Yeniden Yükle</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">Güvenlik ve performans nedeniyle dosya içerikleri tarayıcıda saklanmaz. Geçmişteki notlarınıza ve AI özetinize ulaşmak için lütfen <strong className="text-[var(--text)]">"{pendingDocReload.title}"</strong> adlı dosyanızı tekrar seçin.</p>
            <div className="relative w-full">
              <input type="file" id="doc-reload-upload" accept=".pdf" onChange={(e) => { const file = e.target.files?.[0]; if(!file) return; const objUrl = URL.createObjectURL(file); setContentConfig({ id: pendingDocReload.id, type: 'document', title: pendingDocReload.title, url: objUrl, fileType: file.type || file.name.split('.').pop() }); setPendingDocReload(null); }} className="hidden" />
              <label htmlFor="doc-reload-upload" className="flex items-center justify-center w-full py-3.5 bg-[#FF8C00] hover:bg-[#ea580c] text-white font-bold text-sm rounded-xl cursor-pointer transition-colors shadow-lg shadow-[#FF8C00]/20 active:scale-95">Dosyayı Seç ve Devam Et</label>
            </div>
            <button onClick={() => setPendingDocReload(null)} className="mt-4 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">İptal</button>
          </div>
        </div>
      )}

      {view === 'landing' && <LandingPage />}

      {view === 'app' && (
        <div className={`min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-400 animate-fade-in relative overflow-x-hidden`}>
          <HistoryModal showHistory={showHistory} setShowHistory={setShowHistory} />
          <AIModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} activeContentId={activeContentId} contentConfig={contentConfig} setActiveTab={setActiveTab} />
          
          <PomodoroWidget showPomodoroWidget={showPomodoroWidget} setShowPomodoroWidget={setShowPomodoroWidget} focusDuration={focusDuration} setFocusDuration={setFocusDuration} breakDuration={breakDuration} setBreakDuration={setBreakDuration} timerMode={timerMode} setTimerMode={setTimerMode} timeLeft={timeLeft} setTimeLeft={setTimeLeft} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} />
          <RadioWidget showMusicWidget={showMusicWidget} setShowMusicWidget={setShowMusicWidget} activeStation={activeStation} isMusicPlaying={isMusicPlaying} musicVolume={musicVolume} setMusicVolume={handleMusicVolumeChange} toggleRadioPlay={toggleRadioPlay} changeStation={changeStation} />

          <header className={`flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-40 backdrop-blur-xl gap-3 app-drag-region`}>
            <div className="flex items-center gap-3 sm:gap-6 app-no-drag">
              <button onClick={() => useStore.getState().setView('landing')} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#FF8C00]/30 group-hover:border-[#FF8C00] transition-colors shadow-[0_0_10px_rgba(255,140,0,0.2)]">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight hidden sm:block text-[var(--text)]">BMO <span className="text-[#FF8C00]">Learn</span></h1>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 app-no-drag">
              <div className="hidden md:block mr-2 border-r border-[var(--border)] pr-4"><ProgressBar /></div>

              <div className={`hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-[var(--card-solid)] border border-[var(--border)] text-xs font-medium mr-2 transition-all`}>
                <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Notlar"><Bookmark size={14}/> {notes.length}</span>
                <span className={`w-1 h-1 rounded-full text-[var(--text-muted)]`}></span>
                <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Kartlar"><BookOpen size={14}/> {flashcards.length}</span>
                <span className={`w-1 h-1 rounded-full text-[var(--text-muted)]`}></span>
                <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Quiz Soruları"><Target size={14}/> {quiz.length}</span>
              </div>
              
              {playlistItems.length > 0 && (
                <button onClick={() => setShowPlaylistSidebar(!showPlaylistSidebar)} className={`p-2 sm:p-2.5 rounded-xl transition-all ${showPlaylistSidebar ? 'bg-[var(--primary-muted)] text-[#FF8C00] border border-[#FF8C00]/30' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00]'}`} title="Oynatma Listesi">
                  <ListVideo size={18} />
                </button>
              )}

              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 sm:p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors`} title="Temayı Değiştir">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button onClick={handleInstallClick} className={`p-2 sm:p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors`} title="Ana Ekrana Ekle">
                <Download size={18} />
              </button>
              
              <button onClick={() => setShowHistory(true)} className={`p-2 sm:p-2.5 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors`} title="Geçmiş">
                <History size={18} />
              </button>
              <SettingsPopover />
              <div className={`hidden sm:block w-px h-5 border-[var(--border)] mx-1`}></div>

              <button onClick={() => setShowPomodoroWidget(!showPomodoroWidget)} className={`p-2 sm:p-2.5 rounded-xl transition-all ${showPomodoroWidget || isTimerRunning ? 'bg-[var(--primary-muted)] text-[#FF8C00]' : `hover:bg-[var(--hover-bg)] text-[var(--text-muted)]`}`} title="Odak ve Görevler">
                <Timer size={18} className={isTimerRunning ? 'animate-pulse' : ''} />
              </button>

              <button onClick={() => setShowMusicWidget(!showMusicWidget)} className={`p-2 sm:p-2.5 rounded-xl transition-all ${showMusicWidget ? 'bg-[var(--primary-muted)] text-[#FF8C00]' : `hover:bg-[var(--hover-bg)] text-[var(--text-muted)]`}`} title="Odak Radyosu">
                {isMusicPlaying ? <Radio className="animate-pulse" size={18} /> : <Music size={18} />}
              </button>
              <button onClick={toggleGlobalMute} className={`p-2.5 rounded-xl hover:bg-[var(--hover-bg)] ${globalMuted ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`} title="Tüm Sesleri Sustur (Mute)">
                {globalMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <button onClick={toggleFocusMode} className={`p-2.5 rounded-xl hover:bg-[var(--hover-bg)] ${isFocusMode ? 'text-[#FF8C00]' : 'text-[var(--text-muted)]'}`} title="Tam Ekran (F11)">
                {isFocusMode ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </header>

          <main className={`flex-1 flex flex-col lg:flex-row p-3 sm:p-4 lg:p-6 gap-4 sm:gap-6 w-full max-w-[1700px] mx-auto relative z-0`}>
            
            <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out w-full`}>
              <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5">
                <form onSubmit={handleDashboardUrlChange} className={`flex-1 flex p-1.5 sm:p-2 pl-4 sm:pl-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm focus-within:border-[#FF8C00]/50 transition-colors`}>
                  <input type="text" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="Yeni bir link yapıştırın..." className={`flex-1 bg-transparent border-none outline-none text-[var(--text)] text-xs sm:text-sm font-medium w-full`} />
                  {videoUrlInput && <button type="button" onClick={() => setVideoUrlInput('')} className="p-2 text-[var(--text-muted)] hover:text-[var(--text)]"><X size={16} /></button>}
                  <button type="submit" className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-white bg-[#FF8C00] font-bold text-xs sm:text-sm hover:scale-105 transition-transform active:scale-95 shadow-md shadow-[#FF8C00]/20`}>Değiştir</button>
                </form>
                
                <label className="cursor-pointer shrink-0 px-4 flex items-center justify-center gap-2 rounded-3xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[#FF8C00] hover:border-[#FF8C00]/50 transition-all">
                  <Upload size={18} />
                  <span className="hidden sm:inline text-xs font-bold">PDF Yükle</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleDashboardFileUpload} />
                </label>
              </div>

              <div className={`relative w-full aspect-video bg-[var(--card-solid)] shadow-2xl transition-all duration-500 overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border)]`}>
                
                <div className={`absolute inset-0 w-full h-full z-10 ${contentConfig.type === 'video' && !videoError ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div id="youtube-main-player" className="w-full h-full"></div>
                </div>

                {contentConfig.type === 'document' && (
                  <div className="absolute inset-0 w-full h-full z-20 bg-[var(--bg)] flex flex-col">
                    {contentConfig.url ? (
                      (contentConfig.fileType === 'application/pdf' || String(contentConfig.fileType).includes('pdf')) ? (
                        <iframe src={contentConfig.url} className="w-full h-full bg-white" />
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] gap-4 bg-[var(--card)] px-6">
                          <FileText size={64} className="text-[#FF8C00]" />
                          <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)]">Desteklenmeyen Format</h3>
                          <p className="text-sm text-center max-w-md text-[var(--text-muted)]">
                            <strong className="text-[#FF8C00]">{contentConfig.title}</strong> isimli dosya kaydedildi, ancak tarayıcıda görüntülenebilmesi için <strong className="text-[var(--text)]">PDF</strong> olması gerekmektedir.
                          </p>
                          <a href="https://www.ilovepdf.com/tr" target="_blank" rel="noreferrer" className="mt-2 px-5 py-2.5 bg-[var(--card-solid)] hover:bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)] rounded-xl text-xs font-medium transition-all flex items-center gap-2 shadow-sm">
                            Ücretsiz PDF'e Dönüştür <ExternalLink size={14}/>
                          </a>
                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-4">
                        <FileText size={48} className="opacity-50 text-[#FF8C00]" />
                        <p className="text-sm font-bold">Sadece PDF formatı desteklenir.</p>
                      </div>
                    )}
                  </div>
                )}

                {contentConfig.type === 'video' && videoError && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-[var(--text-muted)] text-sm gap-3 bg-[var(--bg)]">
                    <VolumeX size={32} className="opacity-50 text-[var(--danger)]" />
                    <p>Bu video oynatılamıyor (Silinmiş veya kısıtlanmış olabilir).</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`transition-all duration-500 ease-in-out flex flex-col overflow-hidden origin-left ${showPlaylistSidebar && playlistItems.length > 0 ? 'w-full lg:w-[22%] opacity-100 scale-100 bg-[var(--card)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-lg mt-[68px]' : 'w-0 opacity-0 scale-95 border-none m-0'}`}>
               <div className="w-full lg:min-w-[280px] h-full max-h-[400px] lg:max-h-auto flex flex-col">
                <div className="p-3 border-b border-[var(--border)] bg-[var(--card-solid)] flex justify-between items-center shrink-0">
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-[var(--text)]"><ListVideo size={16} className="text-[#FF8C00]"/> Oynatma Listesi</span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{playlistItems.length} Video</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {playlistItems.map((id, index) => (
                    <button 
                      key={`${id}-${index}`} 
                      onClick={() => handlePlaylistVideoSelect(index)}
                      className={`w-full text-left p-2 rounded-xl flex gap-3 transition-all items-center border ${currentPlaylistIndex === index ? 'bg-[var(--primary-muted)] border-[#FF8C00]/50 shadow-sm' : 'hover:bg-[var(--hover-bg)] border-transparent'}`}
                    >
                      <span className={`text-[10px] font-bold w-4 text-center ${currentPlaylistIndex === index ? 'text-[#FF8C00]' : 'text-[var(--text-muted)]'}`}>{index + 1}</span>
                      <img src={`https://img.youtube.com/vi/${id}/default.jpg`} className="w-16 h-10 sm:w-20 sm:h-12 object-cover rounded-md shadow-sm" loading="lazy" />
                      <div className="flex-1 overflow-hidden">
                        <p className={`text-[10px] sm:text-xs font-semibold truncate ${currentPlaylistIndex === index ? 'text-[#FF8C00]' : 'text-[var(--text)]'}`}>Bölüm #{index + 1}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`flex flex-col mt-[68px] h-125 md:h-150 lg:h-auto bg-[var(--card)] backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${showPlaylistSidebar && playlistItems.length > 0 ? 'w-full lg:w-[28%]' : 'w-full lg:w-[35%]'}`}>
              
              <div className={`flex border-b border-[var(--border)] p-2 items-center justify-between`}>
                <div className="flex overflow-x-auto custom-scrollbar flex-1 gap-1">
                  <button onClick={() => setActiveTab('notes')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'notes' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><List size={14} /> <span className="hidden sm:inline">Notlar</span></button>
                  <button onClick={() => setActiveTab('summary')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'summary' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><AlignLeft size={14} /> <span className="hidden sm:inline">Özet</span></button>
                  <button onClick={() => setActiveTab('flashcards')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'flashcards' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><BookOpen size={14} /> <span className="hidden sm:inline">Kartlar</span></button>
                  <button onClick={() => setActiveTab('quiz')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'quiz' ? `text-white bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)]'}`}><Target size={14} /> <span className="hidden sm:inline">Quiz</span></button>
                </div>
                
                <button onClick={() => setShowAIModal(true)} className="ml-2 shrink-0 px-3 py-2 rounded-xl bg-[var(--info-muted)] text-[var(--info)] border border-[var(--info-muted)] hover:bg-[var(--info)] hover:text-white text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
                  <Sparkles size={14} /> <span className="hidden xl:inline">AI Sihirbazı</span>
                </button>
              </div>

              {activeTab === 'summary' && <SummaryTab activeContentId={activeContentId} />}

              {activeTab === 'notes' && (
                <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
                  {currentNotes.length > 0 && (
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                       <button onClick={handleExportNotes} className={`p-2 rounded-lg bg-[var(--card-solid)] hover:bg-[#FF8C00] hover:text-white text-[var(--text-muted)] transition-all border border-[var(--border)] backdrop-blur-sm shadow-md`} title="Notları İndir (TXT)">
                         <Download size={14} className="sm:w-4 sm:h-4" />
                       </button>
                       {copyFeedback && <span className="text-[10px] bg-[var(--success)] text-white px-2 py-1 rounded-md font-bold shadow-md">Kopyalandı!</span>}
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-12 space-y-3 custom-scrollbar">
                    {currentNotes.length === 0 ? (
                      <div className={`text-center py-10 sm:py-16 text-[var(--text-muted)] flex flex-col items-center gap-4`}><div className={`p-3 sm:p-4 rounded-full bg-[var(--card-solid)]`}><Bookmark size={24} className="sm:w-8 sm:h-8 opacity-50" /></div><p className="text-xs sm:text-sm">Bu içerik için henüz not yok.</p></div>
                    ) : (
                      currentNotes.map(note => (
                        <div key={note.id} className={`group flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-[20px] bg-[var(--card-solid)] border border-transparent hover:border-[var(--border)] transition-all shadow-sm`}>
                          {note.time > 0 && (
                            <button onClick={() => jumpToTime(note.time)} className={`mt-0.5 px-2 sm:px-2.5 py-1 h-fit rounded-lg bg-[var(--primary-muted)] text-[#FF8C00] text-[10px] sm:text-xs font-mono font-bold hover:bg-[#FF8C00]/20`}>
                              {formatTime(note.time)}
                            </button>
                          )}
                          <p className="flex-1 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={renderMarkdown(note.text)}></p>
                          <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--danger)] hover:bg-[var(--danger-muted)] rounded-lg"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className={`p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--bg)]`}>
                    <form onSubmit={(e) => {
                      e.preventDefault(); if(!newNote.trim()) return;
                      const time = contentConfig.type === 'video' && playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
                      addNote({ id: Date.now(), contentId: activeContentId, text: newNote, time });
                      setNewNote('');
                    }} className="relative">
                      <input ref={noteInputRef} type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Not al... (**kalın** veya - liste desteği var)" className={`w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-[20px] bg-[var(--card-solid)] border border-[var(--border)] focus:border-[#FF8C00] outline-none text-xs sm:text-sm text-[var(--text)] transition-colors shadow-sm`} />
                      <button type="submit" className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-2xl bg-[#FF8C00] text-white shadow-md active:scale-95 hover:scale-105 transition-transform`}><Plus size={16} className="sm:w-4.5 sm:h-4.5" /></button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'flashcards' && <FlashcardsTab activeContentId={activeContentId} />}
              {activeTab === 'quiz' && <QuizTab activeContentId={activeContentId} />}

            </div>
          </main>
        </div>
      )}
    </>
  );
}