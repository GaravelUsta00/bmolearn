"use client";

import React, { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { 
  Moon, Sun, Maximize, Minimize, Plus, Trash2, 
  List, BookOpen, Volume2, VolumeX, Bookmark, 
  Music, X, Timer, Pause, Play, Radio, ArrowRight, 
  PlayCircle, Coffee, Brain, History, Download, 
  CheckSquare, Square, Keyboard, Eye, WifiOff,
  Sparkles, Target, Copy, CheckCircle2, AlertCircle, Circle,
  CalendarDays, SkipForward, MonitorSmartphone, Share, MoreVertical,
  Upload, FileText, AlignLeft, Check, Smartphone, FileVideo, File
} from 'lucide-react';

// ==========================================
// 1. TYPES & CONSTANTS
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
interface HistoryItem { contentId: string; title: string; timestamp: number; type: 'video' | 'document'; pId?: string | null; }
interface QuizQuestion { 
  id: number; 
  contentId: string; 
  question: string; 
  options: { A: string; B: string; C: string; D: string }; 
  correct: string; 
  userAnswer?: string; 
}
interface ContentConfig { id: string; type: 'video' | 'document'; title: string; url?: string; pId?: string | null; fileType?: string; }

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

// ==========================================
// 2. GLOBAL STATE (ZUSTAND)
// ==========================================
interface AppState {
  view: 'landing' | 'app';
  globalMuted: boolean;
  blueLight: number;
  notes: Note[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  summaries: Record<string, string>;
  todos: Todo[];
  history: HistoryItem[];
  pomodoroHistory: Record<string, number>; 
  
  activeContentId: string;
  contentConfig: ContentConfig;
  installPrompt: any; 
  pendingDocReload: { id: string, title: string } | null;
  
  setView: (view: 'landing' | 'app') => void;
  setContentConfig: (config: ContentConfig) => void;
  updateContentTitle: (title: string) => void;
  toggleGlobalMute: () => void;
  setBlueLight: (val: number) => void;
  setActiveContentId: (id: string) => void;
  setInstallPrompt: (prompt: any) => void;
  setPendingDocReload: (item: { id: string, title: string } | null) => void;
  
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
  
  addToHistory: (item: HistoryItem) => void;
  deleteHistoryItem: (contentId: string) => void;
  clearHistory: () => void;

  addPomodoroRecord: () => void;
  
  initData: (notes: Note[], cards: Flashcard[], quiz: QuizQuestion[], summaries: Record<string, string>, todos: Todo[], history: HistoryItem[], pHistory: Record<string, number>) => void;
}

const useStore = create<AppState>((set) => ({
  view: 'landing', globalMuted: false, blueLight: 0,
  notes: [], flashcards: [], quiz: [], summaries: {}, todos: [], history: [], pomodoroHistory: {},
  activeContentId: '', contentConfig: { id: '', type: 'video', title: '' }, installPrompt: null,
  pendingDocReload: null,

  setView: (view) => set({ view }),
  setContentConfig: (config) => set({ contentConfig: config }),
  updateContentTitle: (title) => set((state) => ({ contentConfig: { ...state.contentConfig, title } })),
  toggleGlobalMute: () => set((state) => ({ globalMuted: !state.globalMuted })),
  setBlueLight: (val) => set({ blueLight: val }),
  setActiveContentId: (id) => set({ activeContentId: id }),
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
  setPendingDocReload: (item) => set({ pendingDocReload: item }),
  
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
    const filteredCards = state.flashcards.filter(c => c.contentId !== contentId);
    const filteredQuiz = state.quiz.filter(q => q.contentId !== contentId);
    const finalCards = [...filteredCards, ...newCards];
    const finalQuiz = [...filteredQuiz, ...newQuiz];
    
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
    const filtered = state.history.filter(h => h.contentId !== item.contentId);
    const newHistory = [item, ...filtered].slice(0, 30); 
    localStorage.setItem('bmo_history', JSON.stringify(newHistory));
    return { history: newHistory };
  }),
  
  deleteHistoryItem: (contentId) => set((state) => {
    const newHistory = state.history.filter(h => h.contentId !== contentId);
    const newNotes = state.notes.filter(n => n.contentId !== contentId);
    const newCards = state.flashcards.filter(c => c.contentId !== contentId);
    const newQuiz = state.quiz.filter(q => q.contentId !== contentId);
    
    const newSummaries = { ...state.summaries };
    delete newSummaries[contentId];

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

  initData: (notes, cards, quiz, summaries, todos, history, pHistory) => set({ 
    notes, flashcards: cards, quiz, summaries, todos, history, pomodoroHistory: pHistory
  })
}));

// ==========================================
// 3. UTILS (Markdown Render, Progress)
// ==========================================

const renderMarkdown = (text: string) => {
  let html = text
    .replace(/</g, "&lt;").replace(/>/g, "&gt;") 
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#FF8C00] font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-zinc-300 italic">$1</em>')
    .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc marker:text-[#FF8C00] mb-1">$1</li>')
    .replace(/#{3}\s(.*)$/gm, '<h3 class="text-lg font-bold text-zinc-100 mt-4 mb-2">$1</h3>')
    .replace(/#{2}\s(.*)$/gm, '<h2 class="text-xl font-bold text-[#FF8C00] mt-5 mb-3">$1</h2>')
    .replace(/#{1}\s(.*)$/gm, '<h1 class="text-2xl font-black text-zinc-50 mt-6 mb-4 border-b border-zinc-800 pb-2">$1</h1>')
    .replace(/\n/g, '<br />');
  return { __html: html };
};

// ==========================================
// 4. COMPONENTS (Bileşenler)
// ==========================================

const SkeletonLoading = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-8 animate-pulse">
    <div className="w-64 h-16 bg-zinc-900 rounded-3xl"></div>
    <div className="w-full max-w-2xl h-14 bg-zinc-900 rounded-full"></div>
    <div className="flex gap-4">
       <div className="w-32 h-20 bg-zinc-900 rounded-2xl"></div>
       <div className="w-32 h-20 bg-zinc-900 rounded-2xl"></div>
       <div className="w-32 h-20 bg-zinc-900 rounded-2xl"></div>
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
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-xs font-bold py-1.5 flex items-center justify-center gap-2 z-9999 animate-fade-in-up shadow-md">
      <WifiOff size={14} /> İnternet bağlantınız koptu. Lütfen bağlantınızı kontrol edin.
    </div>
  );
};

const BlueLightFilter = () => {
  const { blueLight } = useStore();
  if (blueLight === 0) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-9998 transition-opacity duration-500" style={{ backgroundColor: 'rgba(255, 140, 0, 0.25)', opacity: blueLight / 100, mixBlendMode: 'multiply' }}></div>
  );
}

// PWA: Manifest ve Service Worker Enjeksiyonu
const PWAInjector = () => {
  const setInstallPrompt = useStore(state => state.setInstallPrompt);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.getElementById('pwa-manifest')) {
        const manifest = {
          name: "BMO Learn",
          short_name: "BMO Learn",
          start_url: "/",
          display: "standalone",
          display_override: ["window-controls-overlay", "minimal-ui"], 
          background_color: "#09090b",
          theme_color: "#FF8C00", 
          icons: [
            { src: "/logo.png", sizes: "192x192", type: "image/png" },
            { src: "/logo.png", sizes: "512x512", type: "image/png" }
          ]
        };
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);
        const link = document.createElement('link');
        link.id = 'pwa-manifest'; link.rel = 'manifest'; link.href = manifestURL;
        document.head.appendChild(link);
      }
      
      if ('serviceWorker' in navigator) {
        const swCode = `self.addEventListener('install', (e) => self.skipWaiting()); self.addEventListener('activate', (e) => self.clients.claim()); self.addEventListener('fetch', (e) => {});`;
        const swBlob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(swBlob);
        navigator.serviceWorker.register(swUrl).catch(() => {});
      }

      const handler = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [setInstallPrompt]);
  return null;
}

const AppInstallModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 app-no-drag" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2"><MonitorSmartphone className="text-[#FF8C00]"/> Ana Ekrana Ekle</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">BMO Learn'ü cihazınıza ekleyerek tam ekran ve daha hızlı bir deneyim yaşayabilirsiniz.</p>
        
        <div className="space-y-4">
          <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5"><Smartphone size={14}/> Android (Chrome / Brave)</h4>
            <p className="text-xs text-zinc-500">Sağ üstteki tarayıcı menüsüne (⋮) tıklayın ve <strong>Ana Ekrana Ekle</strong> seçeneğine dokunun.</p>
          </div>
          <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5"><Share size={14}/> iPhone / iPad (Safari)</h4>
            <p className="text-xs text-zinc-500">Alt menüdeki <strong>Paylaş</strong> ikonuna dokunun ve <strong>Ana Ekrana Ekle</strong> seçeneğine tıklayın.</p>
          </div>
          <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5"><MonitorSmartphone size={14}/> Bilgisayar</h4>
            <p className="text-xs text-zinc-500">Adres çubuğunun sağındaki <strong>Yükle (📥)</strong> simgesine tıklayın.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const LandingPage = () => {
  const { setView, setContentConfig, history, clearHistory, addToHistory } = useStore();
  const [url, setUrl] = useState('');

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    const vId = extractYTId(url);
    const pId = extractPlaylistId(url);

    if (vId || pId) { 
      // Playlist veya Video ID yakalandı
      setContentConfig({ id: vId || pId || '', type: 'video', pId, title: "YouTube Video" }); 
      setView('app'); 
    } else { 
      const id = "web_" + Date.now();
      setContentConfig({ id, type: 'document', title: "Web Kaynağı", url });
      // Web dokümanları geçmişe eklenmiyor
      setView('app');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const id = "doc_" + Date.now();
    const objUrl = URL.createObjectURL(file);
    setContentConfig({ 
      id, 
      type: 'document', 
      title: file.name, 
      url: objUrl, 
      fileType: file.type || file.name.split('.').pop() 
    });
    
    addToHistory({ contentId: id, title: file.name, timestamp: Date.now(), type: 'document' });
    setView('app');
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden bg-zinc-950 p-4 sm:p-8`}>
      <div className="absolute top-0 left-0 w-full h-10 app-drag-region z-50"></div>

      <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-[#FF8C00]/10 blur-[80px] md:blur-[120px] rounded-full animate-blob pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-zinc-600/10 blur-[80px] md:blur-[120px] rounded-full animate-blob animation-delay-2000 pointer-events-none mix-blend-screen"></div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-3xl mx-auto animate-fade-in-up app-no-drag">
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center animate-float group cursor-default">
            <div className="absolute inset-0 bg-[#FF8C00] rounded-full animate-subtle-glow pointer-events-none"></div>
            <div className="absolute inset-4 bg-[#FF8C00]/20 rounded-full blur-xl pointer-events-none transition-all duration-700 group-hover:bg-[#FF8C00]/40"></div>
            <img src="/logo.png" alt="BMO Learn Logo" className="relative w-full h-full object-contain z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-transform duration-700 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-zinc-100 to-zinc-500 drop-shadow-sm">
            <span className="text-[#FF8C00]">Learn</span>
          </h1>
        </div>

        <p className={`text-base sm:text-lg md:text-xl font-medium tracking-wide mb-10 md:mb-12 text-zinc-400 text-center`}>
          Sadece odaklan.
        </p>

        <div className="w-full flex flex-col sm:flex-row gap-3 px-2 sm:px-0">
          <form onSubmit={handleStart} className="flex-1 relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-[#FF8C00] to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className={`relative flex items-center p-2 pl-4 sm:pl-6 rounded-3xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/50 shadow-2xl`}>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube linki veya Web adresi..." className={`flex-1 bg-transparent border-none outline-none text-zinc-100 text-sm sm:text-base md:text-lg w-full font-medium placeholder-zinc-600`} autoFocus />
              {url && (
                <button type="button" onClick={() => setUrl('')} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"><X size={18} /></button>
              )}
              <button type="submit" className={`ml-2 p-3 sm:p-4 rounded-2xl bg-[#FF8C00] text-zinc-950 shadow-lg shadow-[#FF8C00]/20 transition-transform active:scale-95 hover:scale-105 flex items-center justify-center`}><ArrowRight size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} /></button>
            </div>
          </form>
          
          <label className="cursor-pointer flex items-center justify-center gap-2 p-3 sm:p-4 rounded-3xl bg-[#FF8C00]/10 text-[#FF8C00] hover:bg-[#FF8C00]/20 transition-all border border-[#FF8C00]/30 shadow-[0_0_15px_rgba(255,140,0,0.1)] active:scale-95">
             <Upload size={22} />
             <span className="font-bold text-sm sm:text-base hidden sm:inline">Dosya Yükle</span>
             <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {history.length > 0 && (
          <div className="mt-16 w-full px-2 sm:px-0 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2"><History size={16}/> Son Çalışmalar</h3>
              <button onClick={() => { clearHistory(); }} className="text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl transition-colors w-full sm:w-auto">
                Geçmişi Temizle
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.slice(0, 3).map((item, idx) => (
                <div key={idx} onClick={() => { 
                  if (item.type === 'video') {
                    setContentConfig({ id: item.contentId, type: item.type, title: item.title, pId: item.pId }); 
                    setView('app'); 
                  } else {
                    useStore.getState().setPendingDocReload({ id: item.contentId, title: item.title });
                    setView('app');
                  }
                }} className={`group cursor-pointer rounded-[20px] overflow-hidden border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-md hover:border-[#FF8C00]/50 transition-all shadow-lg`}>
                  {item.type === 'video' ? (
                    <div className="w-full aspect-video bg-black relative overflow-hidden">
                      <img src={`https://img.youtube.com/vi/${item.contentId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg shadow-[#FF8C00]/30"><Play size={14} fill="currentColor" /></div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                      <FileText size={48} className="text-zinc-700 group-hover:text-[#FF8C00] transition-colors duration-300" />
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg shadow-[#FF8C00]/30"><AlignLeft size={14} /></div>
                    </div>
                  )}
                  <div className="p-3"><p className="text-xs font-semibold line-clamp-2 leading-snug text-zinc-300 group-hover:text-[#FF8C00] transition-colors">{item.title}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-600 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity app-no-drag font-mono pointer-events-none">
        Developed by EHC
      </div>
    </div>
  );
};

const SettingsPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { blueLight, setBlueLight } = useStore();
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={`p-2 sm:p-2.5 rounded-full ${isOpen ? 'bg-zinc-800 text-[#FF8C00]' : 'hover:bg-zinc-800 text-zinc-400'} transition-colors`} title="Görünüm Ayarları">
        <Eye size={18} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-12 right-0 w-64 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-[20px] shadow-2xl p-4 z-50 animate-scale-in origin-top-right">
            <h4 className="text-sm font-bold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Görünüm Ayarları</h4>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 flex justify-between">Mavi Işık Filtresi <span>{blueLight}%</span></label>
              <input type="range" min="0" max="100" value={blueLight} onChange={(e) => setBlueLight(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#FF8C00]" />
              <p className="text-[10px] text-zinc-500 mt-1">Göz yorgunluğunu azaltmak için filtreyi artırın.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const HistoryModal = ({ showHistory, setShowHistory }: any) => {
  const { history, setContentConfig, clearHistory, deleteHistoryItem, setPendingDocReload } = useStore();
  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowHistory(false)}>
      <div className={`w-full max-w-4xl max-h-[85vh] flex flex-col bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className={`p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center`}>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-zinc-100"><History className="text-[#FF8C00]" /> Geçmiş Kitaplığı</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => { clearHistory(); }} className="text-xs font-semibold text-red-500 hover:bg-red-500/10 px-2 sm:px-3 py-1.5 rounded-xl transition-colors">Tümünü Temizle</button>
            <button onClick={() => setShowHistory(false)} className={`text-zinc-500 hover:text-white transition-colors`}><X size={20} /></button>
          </div>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.length === 0 ? (
            <div className={`col-span-full text-center py-10 text-zinc-500`}>Henüz geçmiş kaydı yok.</div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className={`relative group cursor-pointer rounded-[20px] overflow-hidden border border-zinc-800 bg-zinc-950/50 hover:border-[#FF8C00]/50 transition-all shadow-md`}>
                <button onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.contentId); }} className="absolute top-2 right-2 z-20 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-md" title="Geçmişi ve Verileri Sil"><Trash2 size={14} /></button>
                <div onClick={() => { 
                  if (item.type === 'video') {
                    setContentConfig({ id: item.contentId, type: item.type, title: item.title, pId: item.pId }); 
                    setShowHistory(false); 
                  } else {
                    setPendingDocReload({ id: item.contentId, title: item.title });
                    setShowHistory(false);
                  }
                }}>
                  {item.type === 'video' ? (
                    <div className="w-full aspect-video bg-black relative overflow-hidden">
                      <img src={`https://img.youtube.com/vi/${item.contentId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg"><Play size={14} fill="currentColor" /></div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                      <FileText size={40} className="text-zinc-700 group-hover:text-[#FF8C00] transition-colors" />
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg"><AlignLeft size={14} /></div>
                    </div>
                  )}
                  <div className="p-3"><p className="text-xs font-semibold line-clamp-2 leading-snug text-zinc-100">{item.title}</p></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const RadioWidget = ({ showMusicWidget, setShowMusicWidget, activeStation, isMusicPlaying, musicVolume, setMusicVolume, toggleRadioPlay, changeStation }: any) => {
  if (!showMusicWidget) return null;
  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl z-50 overflow-hidden flex flex-col animate-scale-in`}>
      <div className={`px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b border-zinc-800 bg-zinc-950/40`}>
        <span className="text-sm font-bold flex items-center gap-2 text-zinc-100"><Radio size={16} className="text-[#FF8C00]" /> Odak Radyosu</span>
        <button onClick={() => setShowMusicWidget(false)} className={`text-zinc-500 hover:text-white transition-colors`}><X size={16} /></button>
      </div>
      <div className="p-4 sm:p-5 flex flex-col items-center gap-4 bg-linear-to-b from-transparent to-zinc-950/20">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-900 border-2 border-[#FF8C00]/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,140,0,0.15)] relative">
          {isMusicPlaying ? (
            <div className="flex items-end gap-1 h-5 sm:h-6">
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-1"></div>
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-2"></div>
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-3"></div>
            </div>
          ) : <Music className="text-zinc-500" size={20} />}
        </div>
        <div className="text-center w-full px-2">
          <h3 className="font-bold text-sm truncate text-zinc-100">{activeStation.title}</h3>
          <p className={`text-xs text-zinc-500 mt-1`}>{activeStation.category}</p>
        </div>
        <div className="w-full flex items-center gap-3 sm:gap-4 mt-2">
          <button onClick={toggleRadioPlay} className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-90 shadow-lg ${isMusicPlaying ? 'bg-zinc-800 text-white border border-zinc-700' : `bg-[#FF8C00] text-zinc-950 shadow-[#FF8C00]/20`}`}>
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-zinc-950/50 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/50">
            <Volume2 size={16} className="text-zinc-500" />
            <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#FF8C00]" />
          </div>
        </div>
      </div>
      <div className={`border-t border-zinc-800 max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar p-2`}>
        {RADIO_STATIONS.map((station) => (
          <button key={station.id} onClick={() => changeStation(station)} className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all ${activeStation.id === station.id ? 'bg-[#FF8C00]/10 border border-[#FF8C00]/20' : `hover:bg-zinc-800 border border-transparent`}`}>
            <div className="flex flex-col items-start text-left">
              <span className={`text-sm font-semibold ${activeStation.id === station.id ? "text-[#FF8C00]" : "text-zinc-100"}`}>{station.title}</span>
              <span className={`text-[10px] uppercase tracking-wider text-zinc-500`}>{station.category}</span>
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
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="mt-6 w-full p-4 bg-zinc-950/50 border border-zinc-800 rounded-[20px] shadow-inner">
      <h3 className="text-[10px] sm:text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
        <CalendarDays size={14}/> 30 Günlük Çalışma Haritası
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {days.map(d => {
          const count = pomodoroHistory[d] || 0;
          let bgColor = 'bg-zinc-800';
          if (count > 0 && count <= 2) bgColor = 'bg-[#FF8C00]/40';
          else if (count > 2 && count <= 5) bgColor = 'bg-[#FF8C00]/70';
          else if (count > 5) bgColor = 'bg-[#FF8C00]';
          
          return (
            <div 
              key={d} 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${bgColor} transition-colors hover:ring-1 hover:ring-white`} 
              title={`${d}: ${count} Pomodoro`}
            />
          )
        })}
      </div>
      <div className="flex justify-end gap-1.5 items-center mt-3 text-[10px] text-zinc-500">
        <span>Az</span>
        <div className="w-3 h-3 rounded-sm bg-zinc-800" />
        <div className="w-3 h-3 rounded-sm bg-[#FF8C00]/40" />
        <div className="w-3 h-3 rounded-sm bg-[#FF8C00]/70" />
        <div className="w-3 h-3 rounded-sm bg-[#FF8C00]" />
        <span>Çok</span>
      </div>
    </div>
  );
};

const PomodoroWidget = ({ 
  showPomodoroWidget, setShowPomodoroWidget, focusDuration, setFocusDuration, 
  breakDuration, setBreakDuration, timerMode, setTimerMode, timeLeft, setTimeLeft, 
  isTimerRunning, setIsTimerRunning 
}: any) => {
  const { todos, toggleTodo, deleteTodo, addTodo } = useStore();

  if (!showPomodoroWidget) return null;
  return (
    <div className={`fixed top-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-100 rounded-3xl border border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl z-50 overflow-hidden flex flex-col animate-scale-in origin-top-right`}>
      <div className={`px-4 sm:px-5 py-3 flex justify-between items-center border-b border-zinc-800 bg-zinc-950/40`}>
        <span className="text-sm font-bold flex items-center gap-2 text-zinc-100"><Timer size={16} className="text-[#FF8C00]" /> Odak ve Görevler</span>
        <button onClick={() => setShowPomodoroWidget(false)} className={`text-zinc-500 hover:text-white transition-colors`}><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[75vh] custom-scrollbar pb-4">
        {/* Timer Section */}
        <div className="flex flex-col items-center p-4 sm:p-6 border-b border-zinc-800/50">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[10px] sm:text-xs mb-4 ${timerMode === 'break' ? 'bg-blue-500/10 text-blue-500' : 'bg-[#FF8C00]/10 text-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.1)]'}`}>
            {timerMode === 'break' ? <Coffee size={14} /> : <Brain size={14} />}
            {timerMode === 'break' ? 'Mola Zamanı' : 'Odaklanma Zamanı'}
          </div>

          {!isTimerRunning && (
            <div className="flex gap-4 mb-4 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-zinc-500`}>ODAK (DK)</span>
                <div className={`flex items-center gap-2 bg-zinc-950/50 p-1 rounded-full border border-zinc-800`}>
                  <button onClick={() => { if(focusDuration > 1) { setFocusDuration(focusDuration - 1); if(timerMode === 'focus') setTimeLeft((focusDuration - 1) * 60); }}} className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs">-</button>
                  <span className="font-mono text-sm w-6 text-center">{focusDuration}</span>
                  <button onClick={() => { if(focusDuration < 120) { setFocusDuration(focusDuration + 1); if(timerMode === 'focus') setTimeLeft((focusDuration + 1) * 60); }}} className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs">+</button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-zinc-500`}>MOLA (DK)</span>
                <div className={`flex items-center gap-2 bg-zinc-950/50 p-1 rounded-full border border-zinc-800`}>
                  <button onClick={() => { if(breakDuration > 1) { setBreakDuration(breakDuration - 1); if(timerMode === 'break') setTimeLeft((breakDuration - 1) * 60); }}} className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs">-</button>
                  <span className="font-mono text-sm w-6 text-center">{breakDuration}</span>
                  <button onClick={() => { if(breakDuration < 30) { setBreakDuration(breakDuration + 1); if(timerMode === 'break') setTimeLeft((breakDuration + 1) * 60); }}} className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs">+</button>
                </div>
              </div>
            </div>
          )}

          <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-8 ${isTimerRunning ? (timerMode === 'break' ? 'border-blue-500' : 'border-[#FF8C00]') : 'border-zinc-800'} flex items-center justify-center mb-5 transition-colors duration-1000 shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
            <div className={`absolute inset-0 rounded-full border-4 ${timerMode === 'break' ? 'border-blue-500/20' : 'border-[#FF8C00]/20'} m-1.5 transition-colors duration-1000`}></div>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tighter drop-shadow-md">{formatTime(timeLeft)}</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-zinc-950 flex items-center gap-2 transition-transform active:scale-95 text-xs sm:text-sm shadow-lg ${isTimerRunning ? 'bg-zinc-100 text-zinc-900' : (timerMode === 'break' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-[#FF8C00] shadow-[#FF8C00]/20')}`}>
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />} 
              {isTimerRunning ? 'DURAKLAT' : (timerMode === 'break' ? 'MOLAYI BAŞLAT' : 'ODAKLAN')}
            </button>
            
            {timerMode === 'break' && (
               <button onClick={() => { setIsTimerRunning(false); setTimerMode('focus'); setTimeLeft(focusDuration * 60); }} className="p-2.5 sm:p-3 rounded-2xl border border-zinc-800 text-[#FF8C00] hover:bg-[#FF8C00]/10 transition-colors active:scale-95" title="Molayı Atla ve Odaklan">
                  <SkipForward size={16} />
               </button>
            )}

            <button onClick={() => { setIsTimerRunning(false); setTimeLeft(timerMode === 'focus' ? focusDuration * 60 : breakDuration * 60); }} className={`p-2.5 sm:p-3 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-zinc-100 transition-colors active:scale-95`} title="Sıfırla">
              <Timer size={16} />
            </button>
          </div>
        </div>

        {/* Todos Section */}
        <div className="p-4 sm:p-5 flex flex-col bg-zinc-950/20">
          <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><List size={14} className="text-[#FF8C00]"/> Günlük Görevler</h3>
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className={`text-[10px] text-zinc-500 text-center py-2`}>Hedeflerinizi belirleyin ve bitirdikçe işaretleyin.</p>
            ) : (
              todos.map(todo => (
                <div 
                  key={todo.id} 
                  onAnimationEnd={() => { if(todo.completed) deleteTodo(todo.id); }}
                  className={`flex items-center gap-2 p-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 group transition-all shadow-sm overflow-hidden ${todo.completed ? 'animate-todo-complete' : ''}`}
                >
                  <button 
                    onClick={() => { if(!todo.completed) toggleTodo(todo.id); }} 
                    className={`${todo.completed ? 'text-green-500' : 'text-zinc-500'} hover:text-green-400 transition-colors shrink-0`}
                  >
                    {todo.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                  <p className={`flex-1 text-xs transition-colors duration-300 ${todo.completed ? 'line-through text-green-500/80 font-semibold' : 'text-zinc-100'}`}>{todo.text}</p>
                  <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors shrink-0"><Trash2 size={12}/></button>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault(); 
            const todoInput = e.currentTarget.elements.namedItem('todoInput') as HTMLInputElement;
            if(!todoInput.value.trim()) return; 
            addTodo(todoInput.value); 
            todoInput.value = ''; 
          }} className="mt-3 relative">
            <input name="todoInput" type="text" placeholder="Yeni görev ekle..." className={`w-full pl-3 pr-8 py-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs outline-none focus:border-[#FF8C00] transition-colors`} />
            <button type="submit" className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-[#FF8C00] text-zinc-950 shadow-md active:scale-95 transition-transform`}><Plus size={14} /></button>
          </form>

          <PomodoroHeatmap />
        </div>
      </div>
    </div>
  );
};

// KOMPAKT AI SİHİRBAZI MODALI (Güçlendirilmiş JSON Algılayıcı ve Kompakt Tasarım)
const AIModal = ({ isOpen, onClose, activeContentId, contentConfig, setActiveTab }: any) => {
  const { replaceContentAI } = useStore();
  const [aiResponse, setAiResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  const [selectedLevel, setSelectedLevel] = useState<string>(EXAM_LEVELS[0]);

  if (!isOpen) return null;

  const promptTemplate = `Sen bir eğitim asistanısın. Aşağıdaki kurallara KESİNLİKLE uy:
1. Gönderilen içeriğin (veya linkin) dili neyse tüm yanıtı O DİLDE ver (Örn: Türkçe ise sadece Türkçe).
2. Yanıtın SADECE geçerli bir JSON objesi olmalıdır. Ekstra hiçbir metin, açıklama veya "\`\`\`json" gibi işaretler KULLANMA. Doğrudan süslü parantez { ile başla.
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
${contentConfig.type === 'video' ? `LİNK: https://www.youtube.com/watch?v=${activeContentId}` : ''}
${contentConfig.type === 'document' ? 'NOT: Lütfen bu istemi ve analiz edilecek dosyayı bana birlikte gönder.' : ''}`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate);
    setSuccessMsg('Kopyalandı! Yapay zekaya yapıştırın.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleParseJSON = () => {
    setErrorMsg('');
    if (!aiResponse.trim()) return setErrorMsg('Lütfen AI cevabını yapıştırın.');

    try {
      // JSON'ı ne olursa olsun cımbızla çeken çok güçlü bir parser metodu
      const startIndex = aiResponse.indexOf('{');
      const endIndex = aiResponse.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1) throw new Error("JSON objesi bulunamadı");
      
      const cleanJsonStr = aiResponse.substring(startIndex, endIndex + 1);
      const parsed = JSON.parse(cleanJsonStr);

      if (!parsed.summary && !parsed.cards && !parsed.quiz) throw new Error("Format uyuşmazlığı");

      const newCards = (parsed.cards || []).map((c: any) => ({
        id: Date.now() + Math.random(),
        contentId: activeContentId,
        question: c.question || "Soru bulunamadı",
        answer: c.answer || "Cevap bulunamadı",
        learned: false
      }));

      const newQuiz = (parsed.quiz || []).map((q: any) => ({
        id: Date.now() + Math.random(),
        contentId: activeContentId,
        question: q.question || "Soru bulunamadı",
        options: q.options || { A: "A", B: "B", C: "C", D: "D" },
        correct: q.correct || "A"
      }));

      replaceContentAI(activeContentId, newCards, newQuiz, parsed.summary || "");
      setAiResponse('');
      setActiveTab('summary');
      onClose();
    } catch (e) {
      setErrorMsg('Geçersiz format. Lütfen yapay zekadan sadece JSON istediğinizden emin olun.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg flex flex-col bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-3 sm:p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Sparkles size={16} /></div>
            <h2 className="text-sm font-bold text-zinc-100">Kompakt AI Sihirbazı</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Adım 1: Kompakt Prompt Alanı */}
          <div className="flex flex-col gap-3 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#FF8C00] flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#FF8C00]/20 flex items-center justify-center text-[10px]">1</span> Seviye Seç & Kopyala</span>
              <button onClick={handleCopyPrompt} className="flex items-center gap-1 text-[10px] font-bold bg-[#FF8C00] text-zinc-950 px-3 py-1.5 rounded-lg hover:scale-105 transition-transform active:scale-95 shadow-md">
                <Copy size={12} /> İsteği Kopyala
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAM_LEVELS.map(level => (
                <button key={level} onClick={() => setSelectedLevel(level)} className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold transition-colors ${selectedLevel === level ? 'bg-[#FF8C00]/20 border-[#FF8C00] text-[#FF8C00]' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-[#FF8C00]/50'}`}>
                  {level}
                </button>
              ))}
            </div>
            {successMsg && <p className="text-[10px] text-green-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> {successMsg}</p>}
          </div>

          {/* Adım 2: JSON Yapıştır */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">2</span> AI Cevabını (JSON) Yapıştır</span>
            <textarea 
              value={aiResponse} onChange={(e) => setAiResponse(e.target.value)}
              placeholder="Yapay zekanın verdiği { ile başlayıp } ile biten cevabı buraya yapıştırın..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 outline-none focus:border-blue-500 resize-none custom-scrollbar min-h-35"
            ></textarea>
            {errorMsg && <p className="text-[10px] text-red-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> {errorMsg}</p>}
            <button onClick={handleParseJSON} className="w-full py-3 rounded-xl bg-blue-500 text-zinc-950 font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              <Sparkles size={14} /> İçerikleri Sisteme Aktar
            </button>
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
      if (text && text.length > 0) {
        setSelectedText(text);
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    }, 50); 
  };

  const handleAddToNotes = () => {
    addNote({ id: Date.now(), contentId: activeContentId, text: `> ${selectedText}`, time: 0 });
    setShowPopup(false);
    window.getSelection()?.removeAllRanges();
  };

  if (!summary) {
    return (
      <div className={`text-center py-16 text-zinc-500 flex flex-col items-center gap-4 animate-fade-in`}>
        <div className={`p-4 rounded-full bg-zinc-950/50`}><AlignLeft size={32} className="opacity-50" /></div>
        <p className="text-xs sm:text-sm">Bu içerik için henüz özet yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
      </div>
    );
  }

  return (
    <div onPointerUp={handlePointerUp} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar text-sm leading-relaxed text-zinc-300 relative animate-fade-in">
      {showPopup && (
        <div className="sticky top-0 z-20 flex justify-center mb-4 animate-fade-in-up">
          <button 
            onPointerDown={(e) => { e.preventDefault(); handleAddToNotes(); }}
            className="px-4 py-2 bg-[#FF8C00] text-zinc-950 font-bold rounded-2xl shadow-xl shadow-[#FF8C00]/30 flex items-center gap-2 active:scale-95 transition-transform"
          >
            <Bookmark size={16} /> Seçili Metni Notlara Ekle
          </button>
        </div>
      )}
      <div dangerouslySetInnerHTML={renderMarkdown(summary)} />
    </div>
  );
};

const QuizTab = ({ activeContentId }: any) => {
  const { quiz, answerQuizQuestion, deleteQuizQuestion, resetQuiz } = useStore();
  const currentQuiz = quiz.filter(q => q.contentId === activeContentId);

  if (currentQuiz.length === 0) {
    return (
      <div className={`text-center py-16 text-zinc-500 flex flex-col items-center gap-4 animate-fade-in`}>
        <div className={`p-4 rounded-full bg-zinc-950/50`}><Target size={32} className="opacity-50" /></div>
        <p className="text-xs sm:text-sm">Bu içerik için henüz Quiz yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
      </div>
    );
  }

  const correctCount = currentQuiz.filter(q => q.userAnswer === q.correct).length;
  const answeredCount = currentQuiz.filter(q => !!q.userAnswer).length;
  const wrongCount = answeredCount - correctCount;

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-[10px] bg-green-500/10 text-green-500 border border-green-500/20`}>Doğru: {correctCount}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-[10px] bg-red-500/10 text-red-500 border border-red-500/20`}>Yanlış: {wrongCount}</span>
        </div>
        <button onClick={() => resetQuiz(activeContentId)} className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-[10px] transition-colors">
          Sıfırla
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {currentQuiz.map((q, i) => {
          const isAnswered = !!q.userAnswer;
          const isCorrect = q.userAnswer === q.correct;
          
          return (
            <div key={q.id} className="relative group bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <button onClick={() => deleteQuizQuestion(q.id)} className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"><Trash2 size={12} /></button>
              <h4 className="text-sm font-semibold text-zinc-100 mb-4 leading-relaxed"><span className="text-[#FF8C00] mr-1">{i+1}.</span> {q.question}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optionText = q.options[opt as keyof typeof q.options];
                  const isSelected = q.userAnswer === opt;
                  const isActuallyCorrect = q.correct === opt;
                  
                  let btnStyle = "bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-[#FF8C00] hover:text-[#FF8C00]";
                  if (isAnswered) {
                    if (isActuallyCorrect) btnStyle = "bg-green-500/20 border-green-500 text-green-500 font-bold";
                    else if (isSelected) btnStyle = "bg-red-500/20 border-red-500 text-red-500";
                    else btnStyle = "bg-zinc-900 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed";
                  }

                  return (
                    <button 
                      key={opt} disabled={isAnswered}
                      onClick={() => answerQuizQuestion(q.id, opt)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left text-xs sm:text-sm transition-all ${btnStyle}`}
                    >
                      <span className="w-6 h-6 shrink-0 rounded-full bg-black/30 flex items-center justify-center font-bold text-[10px]">{opt}</span>
                      <span className="flex-1">{optionText}</span>
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

  if (currentCards.length === 0) {
    return (
      <div className={`text-center py-10 sm:py-16 text-zinc-500 flex flex-col items-center gap-4 animate-fade-in`}>
        <div className={`p-3 sm:p-4 rounded-full bg-zinc-950/50`}><BookOpen size={24} className="sm:w-8 sm:h-8 opacity-50" /></div>
        <p className="text-xs sm:text-sm">Bu içerik için henüz Kart yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
      </div>
    );
  }

  if (isStudyMode) {
    const currentCard = currentCards[currentIndex];
    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
        <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center">
          <button onClick={() => setIsStudyMode(false)} className="text-xs font-bold text-[#FF8C00] hover:text-orange-400 flex items-center gap-1 transition-colors"><ArrowRight className="rotate-180" size={14}/> Geri Dön</button>
          <span className="text-xs font-bold text-zinc-400">Kart {currentIndex + 1} / {currentCards.length}</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {currentCard && (
            <div key={currentCard.id} className="relative group perspective-1000 w-full max-w-md h-64 sm:h-80 cursor-pointer" onClick={(e) => { e.currentTarget.classList.toggle('flip-card'); }}>
              <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
                <div className={`absolute w-full h-full backface-hidden rounded-4xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 flex items-center justify-center text-center shadow-2xl backdrop-blur-md`}><p className="font-medium text-base sm:text-lg text-zinc-100">{currentCard.question}</p></div>
                <div className={`absolute w-full h-full backface-hidden rounded-4xl border border-[#FF8C00]/50 bg-[#FF8C00]/10 p-6 sm:p-8 flex items-center justify-center text-center rotate-y-180 shadow-2xl backdrop-blur-md`}><p className={`font-bold text-base sm:text-lg text-[#FF8C00]`}>{currentCard.answer}</p></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md">
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1 active:scale-95">Önceki</button>
            <button 
              onClick={() => toggleFlashcardLearned(currentCard.id)} 
              className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all active:scale-95 ${currentCard.learned ? 'border-green-500 bg-green-500/20 text-green-500' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-[#FF8C00]'}`} title="Öğrendim İşaretle"
            >
              {currentCard.learned ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <button onClick={() => setCurrentIndex(Math.min(currentCards.length - 1, currentIndex + 1))} disabled={currentIndex === currentCards.length - 1} className="px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1 active:scale-95">Sonraki</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in">
      <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center">
        <span className="text-xs font-bold text-zinc-400">Öğrenilen: {learnedCount}/{currentCards.length}</span>
        <div className="flex gap-2">
          <button onClick={() => resetFlashcards(activeContentId)} className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-[10px] transition-colors">Sıfırla</button>
          <button onClick={() => { setIsStudyMode(true); setCurrentIndex(0); }} className="text-xs font-bold text-zinc-950 bg-[#FF8C00] hover:bg-orange-400 px-3 py-1 rounded-[10px] flex items-center gap-1 transition-colors"><Play size={12}/> Çalış</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
        {currentCards.length === 0 ? null : currentCards.map(card => (
          <div key={card.id} className={`relative group perspective-1000 h-24 sm:h-28 cursor-pointer ${card.learned ? 'opacity-60 hover:opacity-100' : ''}`} onClick={(e) => { e.currentTarget.classList.toggle('flip-card'); }}>
            <button onClick={(e) => { e.stopPropagation(); deleteFlashcard(card.id); }} className="absolute -top-2 -right-2 z-20 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Trash2 size={12} /></button>
            {card.learned && <div className="absolute top-2 left-2 z-10 text-green-500 bg-black/50 rounded-full"><CheckCircle2 size={16} /></div>}
            
            <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
              <div className={`absolute w-full h-full backface-hidden rounded-[20px] border ${card.learned ? 'border-green-500/30' : 'border-zinc-800'} bg-zinc-900/80 p-4 flex items-center justify-center text-center shadow-sm`}><p className="font-medium text-xs sm:text-sm">{card.question}</p></div>
              <div className={`absolute w-full h-full backface-hidden rounded-[20px] border border-[#FF8C00]/50 bg-[#FF8C00]/10 p-4 flex items-center justify-center text-center rotate-y-180 shadow-md`}><p className={`font-bold text-xs sm:text-sm text-[#FF8C00]`}>{card.answer}</p></div>
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
      <div className="flex justify-between text-[10px] text-zinc-400 font-bold tracking-wider uppercase">
        <span>İlerleme</span>
        <span className="text-[#FF8C00]">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div className="h-full bg-[#FF8C00] transition-all duration-700 shadow-[0_0_10px_rgba(255,140,0,0.8)]" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN APPLICATION (App.tsx)
// ==========================================
export default function App() {
  const { 
    view, globalMuted, notes, flashcards, quiz, summaries, todos, history, activeContentId, contentConfig, installPrompt, pendingDocReload,
    setContentConfig, setActiveContentId, initData, addNote, deleteNote, addPomodoroRecord, updateContentTitle,
    addToHistory, toggleGlobalMute, deleteTodo, setPendingDocReload
  } = useStore();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'summary' | 'flashcards' | 'quiz'>('notes');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false); 
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showPomodoroWidget, setShowPomodoroWidget] = useState<boolean>(false);
  
  const [newNote, setNewNote] = useState<string>('');
  const noteInputRef = useRef<HTMLInputElement>(null); 
  
  const playerRef = useRef<any>(null); 
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [videoError, setVideoError] = useState<boolean>(false);
  
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
    document.title = "BMO Learn v2.1 | Sadece odaklan.";
  }, []);

  useEffect(() => {
    const sNotes = localStorage.getItem('bmo_notes');
    const sCards = localStorage.getItem('bmo_flashcards');
    const sQuiz = localStorage.getItem('bmo_quiz');
    const sSummaries = localStorage.getItem('bmo_summaries');
    const sTodos = localStorage.getItem('bmo_todos');
    const sHistory = localStorage.getItem('bmo_history');
    const sPomodoro = localStorage.getItem('bmo_pomodoro');
    
    initData(
      sNotes ? JSON.parse(sNotes) : [], sCards ? JSON.parse(sCards) : [],
      sQuiz ? JSON.parse(sQuiz) : [], sSummaries ? JSON.parse(sSummaries) : {}, 
      sTodos ? JSON.parse(sTodos) : [], 
      sHistory ? JSON.parse(sHistory) : [], sPomodoro ? JSON.parse(sPomodoro) : {}
    );
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, [initData]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      if (timerMode === 'focus') {
        addPomodoroRecord(); 
        setTimerMode('break'); 
        setTimeLeft(breakDuration * 60);
      } else {
        setTimerMode('focus'); 
        setTimeLeft(focusDuration * 60); 
        setIsTimerRunning(false);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, focusDuration, breakDuration, addPomodoroRecord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault(); setActiveTab('notes');
        setTimeout(() => noteInputRef.current?.focus(), 100);
      }
      
      if (e.ctrlKey && e.code === 'Space' && !isInput && contentConfig.type === 'video') {
        e.preventDefault();
        if (playerRef.current?.getPlayerState) {
          const state = playerRef.current.getPlayerState();
          if (state === 1) playerRef.current.pauseVideo();
          else playerRef.current.playVideo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contentConfig.type]);

  useEffect(() => {
    const handleFullscreenChange = () => { 
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFocusMode(isFull); 
    };
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
      if (view === 'app' && contentConfig.type === 'video' && document.getElementById('youtube-main-player')) {
         initMainPlayer();
      }
      initMusicPlayer();
    };

    if (!window.YT) {
      const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = tryInitPlayers;
    } else {
      tryInitPlayers();
    }
  }, [view, isInitializing, contentConfig.type]);

  useEffect(() => {
    if (contentConfig.type === 'video' && window.YT && playerRef.current?.loadVideoById && view === 'app') {
      setVideoError(false);
      
      if (contentConfig.pId) {
         const currentPId = playerRef.current.getPlaylistId ? playerRef.current.getPlaylistId() : null;
         if (currentPId !== contentConfig.pId) {
           playerRef.current.loadPlaylist({
             list: contentConfig.pId,
             listType: 'playlist',
             index: 0
           });
         }
      } else if (contentConfig.id) {
         const currentVId = playerRef.current.getVideoData ? playerRef.current.getVideoData().video_id : null;
         if (currentVId !== contentConfig.id) {
           playerRef.current.loadVideoById({
             videoId: contentConfig.id
           });
         }
      }
    } else if (contentConfig.type === 'document' && view === 'app') {
      setActiveContentId(contentConfig.id);
    }
  }, [contentConfig.id, contentConfig.pId, contentConfig.type, view, setActiveContentId]);

  const handleMusicVolumeChange = (val: number) => {
    setMusicVolume(val);
    if (musicPlayerRef.current?.setVolume) musicPlayerRef.current.setVolume(val);
  }

  const initMainPlayer = () => {
    if (playerRef.current?.destroy) playerRef.current.destroy();
    
    const playerVars: any = { 
      autoplay: 1, 
      rel: 0, 
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    };

    if (contentConfig.pId) { 
      playerVars.listType = 'playlist'; 
      playerVars.list = contentConfig.pId; 
    }

    playerRef.current = new window.YT.Player('youtube-main-player', {
      host: 'https://www.youtube.com', videoId: contentConfig.id || '', playerVars: playerVars,
      events: {
        'onStateChange': (e: any) => {
          if (e.target.getVideoData) {
            const data = e.target.getVideoData();
            if (data.video_id) {
              setActiveContentId(data.video_id);
              if (data.title && e.data === window.YT.PlayerState.PLAYING) {
                if(useStore.getState().contentConfig.title !== data.title) updateContentTitle(data.title);
                addToHistory({ contentId: data.video_id, title: data.title, timestamp: Date.now(), type: 'video', pId: contentConfig.pId });
              }
            }
          }
        },
        'onError': (e: any) => { console.error("YT Error:", e.data); setVideoError(true); }
      }
    });
  };

  const initMusicPlayer = () => {
    if (musicPlayerRef.current?.destroy) musicPlayerRef.current.destroy();
    musicPlayerRef.current = new window.YT.Player('youtube-music-player', {
      host: 'https://www.youtube.com', videoId: activeStation.id,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' },
      events: {
        'onReady': (e: any) => { e.target.setVolume(musicVolume); if (globalMuted) e.target.mute(); },
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
      setContentConfig({ id: vId || pId || '', type: 'video', pId, title: "YouTube Video" }); 
      setVideoUrlInput(''); 
    } else { 
      const id = "web_" + Date.now();
      setContentConfig({ id, type: 'document', title: "Web Kaynağı", url: videoUrlInput });
      setVideoUrlInput('');
    }
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
    const title = history.find(h => h.contentId === activeContentId)?.title || contentConfig.title || "BMO_Learn";
    const dateStr = new Date().toLocaleDateString('tr-TR'); 
    
    let content = `BMO Learn - Çalışma Notları\nİçerik Başlığı: ${title}\nTarih: ${dateStr}\n-----------------------------------\n\n`;
    currentNotes.forEach(n => { content += `[${n.time > 0 ? formatTime(n.time) : '-'}] ${n.text}\n`; });
    
    navigator.clipboard.writeText(content).catch(() => {});

    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, '');
      
      const a = document.createElement('a'); 
      a.href = url;
      a.download = `${safeTitle} - ${dateStr}.txt`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click(); 
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      alert("Notlar İndiriliyor...\n(İndirme başlamadıysa, notlarınız panoya başarıyla kopyalandı! Bir metin belgesine doğrudan yapıştırabilirsiniz.)");
    } catch (err) {
      alert("Dosya indirme işlemi kısıtlandı. Ancak notlarınız panoya başarıyla kopyalandı! Bir metin belgesine yapıştırabilirsiniz.");
    }
  };

  const toggleRadioPlay = () => {
    if (!musicPlayerRef.current?.getPlayerState) return;
    isMusicPlaying ? musicPlayerRef.current.pauseVideo() : musicPlayerRef.current.playVideo();
  };

  const changeStation = (station: typeof RADIO_STATIONS[0]) => {
    setActiveStation(station);
    if (musicPlayerRef.current?.loadVideoById) { musicPlayerRef.current.loadVideoById(station.id); setIsMusicPlaying(true); }
  };

  const toggleFocusMode = async () => {
    const doc = document as any;
    const docEl = document.documentElement as any;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      try { 
        if (docEl.requestFullscreen) await docEl.requestFullscreen(); 
        else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
      } catch (e) { console.error("Tam ekran başlatılamadı:", e); }
    } else {
      try { 
        if (doc.exitFullscreen) await doc.exitFullscreen(); 
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } catch (e) { console.error("Tam ekrandan çıkılamadı:", e); }
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

  const currentNotes = notes.filter(n => n.contentId === activeContentId);

  if (isInitializing) return <SkeletonLoading />;

  return (
    <>
      <PWAInjector />
      <AppInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
      <OfflineBanner />
      <BlueLightFilter />
      <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50"><div id="youtube-music-player"></div></div>
      
      {/* DOSYA YENİDEN YÜKLEME MODALI */}
      {pendingDocReload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Dokümanı Yeniden Yükle</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Güvenlik ve performans nedeniyle dosya içerikleri tarayıcıda saklanmaz. Geçmişteki notlarınıza ve AI özetinize ulaşmak için lütfen <strong className="text-zinc-200">"{pendingDocReload.title}"</strong> adlı dosyanızı tekrar seçin.
            </p>
            
            <div className="relative w-full">
              <input 
                type="file" 
                id="doc-reload-upload"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(!file) return;
                  const objUrl = URL.createObjectURL(file);
                  setContentConfig({ 
                    id: pendingDocReload.id, 
                    type: 'document', 
                    title: pendingDocReload.title, 
                    url: objUrl, 
                    fileType: file.type || file.name.split('.').pop() 
                  });
                  setPendingDocReload(null);
                }}
                className="hidden"
              />
              <label htmlFor="doc-reload-upload" className="flex items-center justify-center w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors shadow-lg shadow-orange-500/20 active:scale-95">
                Dosyayı Seç ve Devam Et
              </label>
            </div>
            <button 
              onClick={() => setPendingDocReload(null)} 
              className="mt-4 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .app-drag-region { -webkit-app-region: drag; user-select: none; }
        .app-no-drag { -webkit-app-region: no-drag; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #52525b; border-radius: 10px; }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .flip-card .card-inner { transform: rotateY(180deg); }
        
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes subtleGlow { 0%, 100% { opacity: 0.3; transform: scale(0.9); filter: blur(30px); } 50% { opacity: 0.6; transform: scale(1.1); filter: blur(40px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-subtle-glow { animation: subtleGlow 4s ease-in-out infinite; }

        @keyframes eq { 0% { height: 4px; } 50% { height: 16px; } 100% { height: 4px; } }
        .animate-eq-1 { animation: eq 0.8s ease-in-out infinite; }
        .animate-eq-2 { animation: eq 1.2s ease-in-out infinite 0.2s; }
        .animate-eq-3 { animation: eq 0.9s ease-in-out infinite 0.4s; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        
        /* GÜNCEL GÖREV SİLME (TİK) ANİMASYONU - Zarifçe sağa doğru kaybolma */
        @keyframes taskComplete {
          0% { transform: scale(1); opacity: 1; }
          40% { transform: scale(1.05); opacity: 1; color: #10b981; }
          100% { transform: translateX(50px) scale(0.9); opacity: 0; filter: blur(2px); }
        }
        .animate-todo-complete { animation: taskComplete 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; pointer-events: none; }
      `}} />

      {view === 'landing' && <LandingPage />}

      {view === 'app' && (
        <div className={`min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-500 animate-fade-in relative`}>
          <HistoryModal showHistory={showHistory} setShowHistory={setShowHistory} />
          <AIModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} activeContentId={activeContentId} contentConfig={contentConfig} setActiveTab={setActiveTab} />
          
          <PomodoroWidget 
            showPomodoroWidget={showPomodoroWidget} 
            setShowPomodoroWidget={setShowPomodoroWidget} 
            focusDuration={focusDuration} setFocusDuration={setFocusDuration} 
            breakDuration={breakDuration} setBreakDuration={setBreakDuration} 
            timerMode={timerMode} setTimerMode={setTimerMode} 
            timeLeft={timeLeft} setTimeLeft={setTimeLeft} 
            isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} 
          />
          <RadioWidget 
            showMusicWidget={showMusicWidget} 
            setShowMusicWidget={setShowMusicWidget} 
            activeStation={activeStation} isMusicPlaying={isMusicPlaying} 
            musicVolume={musicVolume} setMusicVolume={handleMusicVolumeChange} 
            toggleRadioPlay={toggleRadioPlay} changeStation={changeStation} 
          />

          <header className={`flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-40 backdrop-blur-xl gap-3 app-drag-region`}>
            <div className="flex items-center gap-3 sm:gap-6 app-no-drag">
              <button onClick={() => useStore.getState().setView('landing')} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#FF8C00]/30 group-hover:border-[#FF8C00] transition-colors shadow-[0_0_10px_rgba(255,140,0,0.2)] group-hover:shadow-[0_0_15px_rgba(255,140,0,0.6)]">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight hidden sm:block">BMO <span className="text-[#FF8C00]">Learn</span></h1>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 app-no-drag">
              
              <div className="hidden md:block mr-2 border-r border-zinc-800 pr-4">
                 <ProgressBar />
              </div>

              <div className={`hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-zinc-950/50 border border-zinc-800 text-xs font-medium mr-2 transition-all`}>
                <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Notlar"><Bookmark size={14}/> {notes.length}</span>
                <span className={`w-1 h-1 rounded-full text-zinc-500`}></span>
                <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Kartlar"><BookOpen size={14}/> {flashcards.length}</span>
                <span className={`w-1 h-1 rounded-full text-zinc-500`}></span>
                <span className="flex items-center gap-1.5 text-[#FF8C00]" title="Quiz Soruları"><Target size={14}/> {quiz.length}</span>
              </div>
              
              <button onClick={handleInstallClick} className={`p-2 sm:p-2.5 rounded-full hover:bg-[#FF8C00]/10 text-zinc-400 hover:text-[#FF8C00] transition-colors`} title="Ana Ekrana Ekle">
                <Download size={18} />
              </button>
              
              <button onClick={() => setShowHistory(true)} className={`p-2 sm:p-2.5 rounded-full hover:bg-zinc-500/10 text-zinc-400 transition-colors`} title="Geçmiş">
                <History size={18} />
              </button>
              <SettingsPopover />
              <div className={`hidden sm:block w-px h-5 border-zinc-800 mx-1`}></div>

              <button onClick={() => setShowPomodoroWidget(!showPomodoroWidget)} className={`p-2 sm:p-2.5 rounded-full transition-all ${showPomodoroWidget || isTimerRunning ? 'bg-[#FF8C00]/20 text-[#FF8C00]' : `hover:bg-zinc-500/10 text-zinc-400`}`} title="Odak ve Görevler">
                <Timer size={18} className={isTimerRunning ? 'animate-pulse' : ''} />
              </button>

              <button onClick={() => setShowMusicWidget(!showMusicWidget)} className={`p-2 sm:p-2.5 rounded-full transition-all ${showMusicWidget ? 'bg-[#FF8C00]/20 text-[#FF8C00]' : `hover:bg-zinc-500/10 text-zinc-400`}`} title="Odak Radyosu">
                {isMusicPlaying ? <Radio className="animate-pulse" size={18} /> : <Music size={18} />}
              </button>
              <button onClick={toggleGlobalMute} className={`p-2.5 rounded-full hover:bg-zinc-500/10 ${globalMuted ? 'text-red-400' : 'text-zinc-400'}`} title="Tüm Sesleri Sustur (Mute)">
                {globalMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <button onClick={toggleFocusMode} className={`p-2.5 rounded-full hover:bg-zinc-500/10 ${isFocusMode ? 'text-[#FF8C00]' : 'text-zinc-400'}`} title="Tam Ekran (F11)">
                {isFocusMode ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </header>

          <main className={`flex-1 flex flex-col lg:flex-row p-3 sm:p-4 lg:p-6 gap-4 sm:gap-6 max-w-400 mx-auto w-full relative z-0`}>
            
            <div className={`flex flex-col w-full lg:w-[65%]`}>
              <form onSubmit={handleDashboardUrlChange} className={`flex gap-2 sm:gap-3 mb-4 sm:mb-5 p-1.5 sm:p-2 pl-4 sm:pl-5 rounded-[20px] bg-zinc-900 border border-zinc-800 shadow-sm focus-within:border-[#FF8C00]/50 transition-colors`}>
                <input type="text" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="Yeni bir YouTube Linki veya Web Adresi yapıştırın..." className={`flex-1 bg-transparent border-none outline-none text-zinc-100 text-xs sm:text-sm font-medium w-full`} />
                {videoUrlInput && <button type="button" onClick={() => setVideoUrlInput('')} className="p-2 text-zinc-500 hover:text-zinc-300"><X size={16} /></button>}
                
                <label className="cursor-pointer px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-md">
                  <Upload size={16} /> <span className="hidden sm:inline">Dosya</span>
                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if(!file) return;
                     const id = "doc_" + Date.now();
                     const objUrl = URL.createObjectURL(file);
                     setContentConfig({ id, type: 'document', title: file.name, url: objUrl, fileType: file.type || file.name.split('.').pop() });
                     addToHistory({ contentId: id, title: file.name, timestamp: Date.now(), type: 'document' });
                     setVideoUrlInput('');
                  }} />
                </label>

                <button type="submit" className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-zinc-950 bg-[#FF8C00] font-bold text-xs sm:text-sm hover:scale-105 transition-transform active:scale-95 shadow-md shadow-[#FF8C00]/20`}>Aç</button>
              </form>

              {/* === EN BÜYÜK DEĞİŞİKLİK: DOM ÇAKISMASINI ÖNLEYEN KESİN ÇÖZÜM YÖNTEMİ === */}
              <div className={`relative w-full aspect-video bg-zinc-950 shadow-2xl transition-all duration-500 overflow-hidden rounded-2xl sm:rounded-4xl border border-zinc-800/50`}>
                
                {/* 1. YOUTUBE OYNATICI KATMani (Z-index: 10) - Asla Silinmez, Sadece Görünmez Olur! */}
                <div className={`absolute inset-0 w-full h-full z-10 ${contentConfig.type === 'video' && !videoError ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div id="youtube-main-player" className="w-full h-full"></div>
                </div>

                {/* 2. DOKÜMAN / HATA KATMANI (Z-index: 20) - Youtube'un üstüne biner */}
                {contentConfig.type === 'document' && (
                  <div className="absolute inset-0 w-full h-full z-20 bg-zinc-950 flex flex-col">
                    {contentConfig.url ? (
                      (contentConfig.fileType === 'application/pdf' || String(contentConfig.fileType).includes('pdf')) ? (
                        <iframe src={contentConfig.url} className="w-full h-full bg-zinc-100" />
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 gap-4 bg-zinc-900 px-6">
                          <FileText size={64} className="text-[#FF8C00]" />
                          <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">Doküman Aktif</h3>
                          <p className="text-sm text-center max-w-md text-zinc-400">
                            <strong className="text-[#FF8C00]">{contentConfig.title}</strong> sisteme entegre edildi.<br/><br/>
                            Word veya PowerPoint formatı tarayıcıda doğrudan önizlenemez ancak sağ paneldeki Notları alabilir ve AI Sihirbazından özet çıkartabilirsiniz.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
                        <FileText size={48} className="opacity-50 text-[#FF8C00]" />
                        <p className="text-sm font-bold">Doküman formatı tarayıcıda doğrudan açılamıyor.</p>
                        <p className="text-xs">Öğrenme araçlarını kullanmak için AI Sihirbazından özet çıkarabilirsiniz.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Hata Ekranı Katmanı */}
                {contentConfig.type === 'video' && videoError && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-zinc-500 text-sm gap-3 bg-zinc-950">
                    <VolumeX size={32} className="opacity-50 text-red-500" />
                    <p>Bu video oynatılamıyor (Silinmiş veya kısıtlanmış olabilir).</p>
                  </div>
                )}

              </div>
            </div>

            <div className={`flex flex-col w-full lg:w-[35%] h-125 md:h-150 lg:h-auto bg-zinc-900/90 backdrop-blur-xl rounded-2xl sm:rounded-4xl border border-zinc-800 shadow-2xl overflow-hidden transition-all duration-500`}>
              
              <div className={`flex border-b border-zinc-800 p-2 items-center justify-between`}>
                <div className="flex overflow-x-auto custom-scrollbar flex-1 gap-1">
                  <button onClick={() => setActiveTab('notes')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'notes' ? `text-zinc-950 bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}><List size={14} /> <span className="hidden sm:inline">Notlar</span></button>
                  <button onClick={() => setActiveTab('summary')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'summary' ? `text-zinc-950 bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}><AlignLeft size={14} /> <span className="hidden sm:inline">Özet</span></button>
                  <button onClick={() => setActiveTab('flashcards')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'flashcards' ? `text-zinc-950 bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}><BookOpen size={14} /> <span className="hidden sm:inline">Kartlar</span></button>
                  <button onClick={() => setActiveTab('quiz')} className={`px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${activeTab === 'quiz' ? `text-zinc-950 bg-[#FF8C00] shadow-md shadow-[#FF8C00]/20` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}><Target size={14} /> <span className="hidden sm:inline">Quiz</span></button>
                </div>
                
                <button onClick={() => setShowAIModal(true)} className="ml-2 shrink-0 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-zinc-950 text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
                  <Sparkles size={14} /> <span className="hidden lg:inline">AI Sihirbazı</span>
                </button>
              </div>

              {activeTab === 'summary' && <SummaryTab activeContentId={activeContentId} />}

              {activeTab === 'notes' && (
                <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
                  {currentNotes.length > 0 && (
                    <button onClick={handleExportNotes} className={`absolute top-4 right-4 z-10 p-2 rounded-lg bg-zinc-800/50 hover:bg-[#FF8C00] hover:text-black text-zinc-400 transition-all border border-zinc-700/50 backdrop-blur-sm`} title="Notları İndir (TXT)">
                      <Download size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-12 space-y-3 custom-scrollbar">
                    {currentNotes.length === 0 ? (
                      <div className={`text-center py-10 sm:py-16 text-zinc-500 flex flex-col items-center gap-4`}><div className={`p-3 sm:p-4 rounded-full bg-zinc-950/50`}><Bookmark size={24} className="sm:w-8 sm:h-8 opacity-50" /></div><p className="text-xs sm:text-sm">Bu içerik için henüz not yok.</p></div>
                    ) : (
                      currentNotes.map(note => (
                        <div key={note.id} className={`group flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-[20px] bg-zinc-950/50 border border-transparent hover:border-zinc-800 transition-all shadow-sm`}>
                          {note.time > 0 && (
                            <button onClick={() => jumpToTime(note.time)} className={`mt-0.5 px-2 sm:px-2.5 py-1 h-fit rounded-lg bg-[#FF8C00]/10 text-[#FF8C00] text-[10px] sm:text-xs font-mono font-bold hover:bg-[#FF8C00]/20`}>
                              {formatTime(note.time)}
                            </button>
                          )}
                          <p className="flex-1 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={renderMarkdown(note.text)}></p>
                          <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className={`p-4 sm:p-5 border-t border-zinc-800`}>
                    <form onSubmit={(e) => {
                      e.preventDefault(); if(!newNote.trim()) return;
                      const time = contentConfig.type === 'video' && playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
                      addNote({ id: Date.now(), contentId: activeContentId, text: newNote, time });
                      setNewNote('');
                    }} className="relative">
                      <input ref={noteInputRef} type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Not al... (**kalın** veya - liste desteği var)" className={`w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-[20px] bg-zinc-950/50 border border-zinc-800 focus:border-[#FF8C00] outline-none text-xs sm:text-sm transition-colors`} />
                      <button type="submit" className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-2xl bg-linear-to-r from-orange-400 to-[#FF8C00] text-zinc-950 shadow-md active:scale-95 transition-transform`}><Plus size={16} className="sm:w-4.5 sm:h-4.5" /></button>
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