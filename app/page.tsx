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
  CalendarDays, SkipForward
} from 'lucide-react';

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    webkitAudioContext: typeof AudioContext;
  }
}

interface Note { id: number; videoId: string; text: string; time: number; }
interface Flashcard { id: number; videoId: string; question: string; answer: string; learned?: boolean; }
interface Todo { id: number; text: string; completed: boolean; }
interface HistoryItem { videoId: string; title: string; timestamp: number; }
interface QuizQuestion { 
  id: number; 
  videoId: string; 
  question: string; 
  options: { A: string; B: string; C: string; D: string }; 
  correct: string; 
  userAnswer?: string; 
}

const RADIO_STATIONS = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop', category: 'Odak & Çalışma' },
  { id: 'Dx5qFachd3A', title: 'Relaxing Jazz Piano', category: 'Caz & Rahatlama' },
  { id: '36YnV9STBqc', title: 'The Good Life Radio', category: 'Pop Mix' },
  { id: '3MOrgUjiigE', title: 'Hits Radio 1 Live', category: 'Yabancı Pop' },
  { id: 'Mo5preW8Ig0', title: 'Hit Radyo Türkçe', category: 'Türkçe Pop' },
  { id: 'Fru_Ss-TqgY', title: 'Karadeniz Akustik', category: 'Yöresel & Akustik' },
];

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
  todos: Todo[];
  history: HistoryItem[];
  pomodoroHistory: Record<string, number>; 
  activeVideoId: string;
  playerConfig: { vId: string; pId: string | null };
  
  setView: (view: 'landing' | 'app') => void;
  setPlayerConfig: (config: { vId: string; pId: string | null }) => void;
  toggleGlobalMute: () => void;
  setBlueLight: (val: number) => void;
  setActiveVideoId: (id: string) => void;
  
  addNote: (note: Note) => void;
  deleteNote: (id: number) => void;
  
  addFlashcard: (card: Flashcard) => void;
  deleteFlashcard: (id: number) => void;
  toggleFlashcardLearned: (id: number) => void;
  resetFlashcards: (videoId: string) => void;
  
  addQuizQuestion: (q: QuizQuestion) => void;
  answerQuizQuestion: (id: number, answer: string) => void;
  deleteQuizQuestion: (id: number) => void;
  resetQuiz: (videoId: string) => void;
  
  replaceVideoAIContent: (videoId: string, newCards: Flashcard[], newQuiz: QuizQuestion[]) => void;
  
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  
  addToHistory: (item: HistoryItem) => void;
  deleteHistoryItem: (videoId: string) => void;
  clearHistory: () => void;

  addPomodoroRecord: () => void;
  
  initData: (notes: Note[], cards: Flashcard[], quiz: QuizQuestion[], todos: Todo[], history: HistoryItem[], pHistory: Record<string, number>) => void;
}

const useStore = create<AppState>((set) => ({
  view: 'landing', globalMuted: false, blueLight: 0,
  notes: [], flashcards: [], quiz: [], todos: [], history: [], pomodoroHistory: {},
  activeVideoId: '', playerConfig: { vId: '', pId: null },

  setView: (view) => set({ view }),
  setPlayerConfig: (config) => set({ playerConfig: config }),
  toggleGlobalMute: () => set((state) => ({ globalMuted: !state.globalMuted })),
  setBlueLight: (val) => set({ blueLight: val }),
  setActiveVideoId: (id) => set({ activeVideoId: id }),
  
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
  resetFlashcards: (videoId) => set((state) => {
    const newCards = state.flashcards.map(c => c.videoId === videoId ? { ...c, learned: false } : c);
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
  resetQuiz: (videoId) => set((state) => {
    const newQuiz = state.quiz.map(q => q.videoId === videoId ? { ...q, userAnswer: undefined } : q);
    localStorage.setItem('bmo_quiz', JSON.stringify(newQuiz));
    return { quiz: newQuiz };
  }),
  
  replaceVideoAIContent: (videoId, newCards, newQuiz) => set((state) => {
    const filteredCards = state.flashcards.filter(c => c.videoId !== videoId);
    const filteredQuiz = state.quiz.filter(q => q.videoId !== videoId);
    const finalCards = [...filteredCards, ...newCards];
    const finalQuiz = [...filteredQuiz, ...newQuiz];
    localStorage.setItem('bmo_flashcards', JSON.stringify(finalCards));
    localStorage.setItem('bmo_quiz', JSON.stringify(finalQuiz));
    return { flashcards: finalCards, quiz: finalQuiz };
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
    const filtered = state.history.filter(h => h.videoId !== item.videoId);
    const newHistory = [item, ...filtered].slice(0, 30); 
    localStorage.setItem('bmo_history', JSON.stringify(newHistory));
    return { history: newHistory };
  }),
  
  deleteHistoryItem: (videoId) => set((state) => {
    const newHistory = state.history.filter(h => h.videoId !== videoId);
    const newNotes = state.notes.filter(n => n.videoId !== videoId);
    const newCards = state.flashcards.filter(c => c.videoId !== videoId);
    const newQuiz = state.quiz.filter(q => q.videoId !== videoId);
    
    localStorage.setItem('bmo_history', JSON.stringify(newHistory));
    localStorage.setItem('bmo_notes', JSON.stringify(newNotes));
    localStorage.setItem('bmo_flashcards', JSON.stringify(newCards));
    localStorage.setItem('bmo_quiz', JSON.stringify(newQuiz));
    
    return { history: newHistory, notes: newNotes, flashcards: newCards, quiz: newQuiz };
  }),
  
  clearHistory: () => set(() => {
    localStorage.removeItem('bmo_history');
    localStorage.removeItem('bmo_notes');
    localStorage.removeItem('bmo_flashcards');
    localStorage.removeItem('bmo_quiz');
    return { history: [], notes: [], flashcards: [], quiz: [] };
  }),

  addPomodoroRecord: () => set((state) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecords = { ...state.pomodoroHistory };
    newRecords[today] = (newRecords[today] || 0) + 1;
    localStorage.setItem('bmo_pomodoro', JSON.stringify(newRecords));
    return { pomodoroHistory: newRecords };
  }),
  
  initData: (notes, cards, quiz, todos, history, pHistory) => set({ notes, flashcards: cards, quiz, todos, history, pomodoroHistory: pHistory })
}));

// ==========================================
// 3. UTILS (Ses, Parse AI, Markdown)
// ==========================================
const playSound = (type: 'click' | 'success' | 'start' | 'break' | 'tick' | 'error' = 'click') => {
  if (useStore.getState().globalMuted) return; 
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return; 
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    
    if (type === 'click') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'error') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'start') {
      osc.type = 'square'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'break') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'tick') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) { console.log(e); }
};

const parseAIResponse = (text: string, videoId: string) => {
  let currentSection = '';
  const parsedFlashcards: Flashcard[] = [];
  const parsedQuiz: QuizQuestion[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const cleanLine = line.trim().replace(/^\*\*|\*\*$/g, ''); 
    if (cleanLine.includes('FLASHCARDS')) { currentSection = 'FLASHCARDS'; continue; }
    if (cleanLine.includes('QUIZ')) { currentSection = 'QUIZ'; continue; }

    if (currentSection === 'FLASHCARDS') {
      const parts = cleanLine.split('|');
      if (parts.length >= 3) {
        parsedFlashcards.push({
          id: Date.now() + Math.random(), videoId,
          question: parts[1].trim(), answer: parts.slice(2).join('|').trim(), learned: false
        });
      }
    } else if (currentSection === 'QUIZ') {
      const parts = cleanLine.split('|');
      if (parts.length >= 7) {
        parsedQuiz.push({
          id: Date.now() + Math.random(), videoId,
          question: parts[1].trim(),
          options: { A: parts[2].trim(), B: parts[3].trim(), C: parts[4].trim(), D: parts[5].trim() },
          correct: parts[6].trim().toUpperCase().replace(/[^ABCD]/g, ''), 
        });
      }
    }
  }
  return { parsedFlashcards, parsedQuiz };
};

const renderMarkdown = (text: string) => {
  let html = text
    .replace(/</g, "&lt;").replace(/>/g, "&gt;") 
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-500 font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-zinc-300 italic">$1</em>')
    .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc marker:text-amber-500">$1</li>')
    .replace(/\n/g, '<br />');
  return { __html: html };
};

// ==========================================
// 4. COMPONENTS (Bileşenler)
// ==========================================

const SkeletonLoading = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-8 animate-pulse">
    <div className="w-64 h-16 bg-zinc-800 rounded-2xl"></div>
    <div className="w-full max-w-2xl h-14 bg-zinc-800 rounded-full"></div>
    <div className="flex gap-4">
       <div className="w-32 h-20 bg-zinc-800 rounded-xl"></div>
       <div className="w-32 h-20 bg-zinc-800 rounded-xl"></div>
       <div className="w-32 h-20 bg-zinc-800 rounded-xl"></div>
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
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-xs font-bold py-1.5 flex items-center justify-center gap-2 z-9999 animate-fade-in-up">
      <WifiOff size={14} /> İnternet bağlantınız koptu. Lütfen bağlantınızı kontrol edin.
    </div>
  );
};

const BlueLightFilter = () => {
  const { blueLight } = useStore();
  if (blueLight === 0) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-9998 transition-opacity duration-500" style={{ backgroundColor: 'rgba(255, 165, 0, 0.3)', opacity: blueLight / 100, mixBlendMode: 'multiply' }}></div>
  );
}

const PWAInjector = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('pwa-manifest')) {
      const manifest = {
        name: "BMO Learn",
        short_name: "BMOLearn",
        start_url: ".",
        display: "standalone",
        background_color: "#09090b",
        theme_color: "#f59e0b",
        icons: [
          { src: "https://www.google.com/favicon.ico", sizes: "192x192", type: "image/png" },
          { src: "https://www.google.com/favicon.ico", sizes: "512x512", type: "image/png" }
        ]
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(blob);
      const link = document.createElement('link');
      link.id = 'pwa-manifest'; link.rel = 'manifest'; link.href = manifestURL;
      document.head.appendChild(link);
    }
  }, []);
  return null;
}

const LandingPage = () => {
  const { setView, setPlayerConfig, history, clearHistory } = useStore();
  const [url, setUrl] = useState('');

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    const vId = extractYTId(url);
    const pId = extractPlaylistId(url);

    if (vId || pId) { 
      setPlayerConfig({ vId: vId || '', pId }); 
      playSound('start'); setView('app'); 
    } else { 
      playSound('error');
      alert("Lütfen geçerli bir YouTube veya YouTube Shorts linki giriniz.");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden bg-zinc-950 p-4 sm:p-8`}>
      <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-amber-500/10 blur-[80px] md:blur-[120px] rounded-full animate-blob pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-zinc-600/20 blur-[80px] md:blur-[120px] rounded-full animate-blob animation-delay-2000 pointer-events-none mix-blend-screen"></div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-3xl mx-auto animate-fade-in-up">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-linear-to-r from-zinc-100 to-zinc-500 drop-shadow-sm text-center">
          BMO <span className="text-amber-500">Learn</span>
        </h1>
        {/* REQ: Yazı kısaltıldı */}
        <p className={`text-base sm:text-lg md:text-xl font-medium tracking-wide mb-10 md:mb-12 text-zinc-400 text-center`}>
          Sadece odaklan.
        </p>

        <form onSubmit={handleStart} className="w-full relative group px-2 sm:px-0">
          <div className="absolute -inset-1 bg-linear-to-r from-amber-500 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className={`relative flex items-center p-2 pl-4 sm:pl-6 rounded-full bg-zinc-900 border border-zinc-800/50 shadow-2xl`}>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube bağlantınızı yapıştırın..." className={`flex-1 bg-transparent border-none outline-none text-zinc-100 text-sm sm:text-base md:text-lg w-full font-medium placeholder-zinc-600`} autoFocus />
            {url && (
              <button type="button" onClick={() => setUrl('')} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"><X size={18} /></button>
            )}
            <button type="submit" className={`ml-2 p-3 sm:p-4 rounded-full bg-amber-500 text-zinc-950 shadow-lg transition-transform active:scale-95 hover:scale-105 flex items-center justify-center`}><ArrowRight size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} /></button>
          </div>
        </form>

        {history.length > 0 && (
          <div className="mt-16 w-full px-2 sm:px-0 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2"><History size={16}/> Son İzlenenler</h3>
              <button onClick={() => { clearHistory(); playSound('click'); }} className="text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto">
                Geçmişi ve Verileri Temizle
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.slice(0, 3).map((item, idx) => (
                <div key={idx} onClick={() => { setPlayerConfig({ vId: item.videoId, pId: null }); playSound('success'); setView('app'); }} className={`group cursor-pointer rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-950/50 hover:border-amber-500/50 transition-all`}>
                  <div className="w-full aspect-video bg-black relative overflow-hidden">
                    <img src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-amber-500 text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"><Play size={14} fill="currentColor" /></div>
                  </div>
                  <div className="p-3"><p className="text-xs font-semibold line-clamp-2 leading-snug text-zinc-300 group-hover:text-amber-500 transition-colors">{item.title}</p></div>
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
      <button onClick={() => setIsOpen(!isOpen)} className={`p-2 sm:p-2.5 rounded-full ${isOpen ? 'bg-zinc-800 text-amber-500' : 'hover:bg-zinc-800 text-zinc-400'} transition-colors`} title="Görünüm Ayarları">
        <Eye size={18} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-12 right-0 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 animate-scale-in origin-top-right">
            <h4 className="text-sm font-bold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Görünüm Ayarları</h4>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 flex justify-between">Mavi Işık Filtresi <span>{blueLight}%</span></label>
              <input type="range" min="0" max="100" value={blueLight} onChange={(e) => setBlueLight(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
              <p className="text-[10px] text-zinc-500 mt-1">Göz yorgunluğunu azaltmak için filtreyi artırın.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const HistoryModal = ({ showHistory, setShowHistory }: any) => {
  const { history, setPlayerConfig, clearHistory, deleteHistoryItem } = useStore();
  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowHistory(false)}>
      <div className={`w-full max-w-400 max-h-[85vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className={`p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center`}>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-zinc-100"><History className="text-amber-500" /> Geçmiş Kitaplığı</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => { clearHistory(); playSound('click'); }} className="text-xs font-semibold text-red-500 hover:bg-red-500/10 px-2 sm:px-3 py-1.5 rounded-lg transition-colors">Tümünü Temizle</button>
            <button onClick={() => setShowHistory(false)} className={`text-zinc-500 hover:text-white`}><X size={20} /></button>
          </div>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.length === 0 && <div className={`col-span-full text-center py-10 text-zinc-500`}>Henüz izlenmiş video yok.</div>}
          {history.map((item, idx) => (
            <div key={idx} className={`relative group cursor-pointer rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/50 hover:border-amber-500/50 transition-all`}>
              <button onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.videoId); playSound('success'); }} className="absolute top-2 right-2 z-20 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-md" title="Geçmişi ve Bu Videoya Ait Verileri Sil"><Trash2 size={14} /></button>
              <div onClick={() => { setPlayerConfig({ vId: item.videoId, pId: null }); setShowHistory(false); playSound('success'); }}>
                <div className="w-full aspect-video bg-black relative overflow-hidden">
                  <img src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-amber-500 text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"><Play size={14} fill="currentColor" /></div>
                </div>
                <div className="p-3"><p className="text-xs font-semibold line-clamp-2 leading-snug text-zinc-100">{item.title}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RadioWidget = ({ showMusicWidget, setShowMusicWidget, activeStation, isMusicPlaying, musicVolume, setMusicVolume, toggleRadioPlay, changeStation }: any) => {
  if (!showMusicWidget) return null;
  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 backdrop-blur-3xl z-50 overflow-hidden flex flex-col animate-scale-in`}>
      <div className={`px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b border-zinc-800 bg-zinc-950/40`}>
        <span className="text-sm font-bold flex items-center gap-2 text-zinc-100"><Radio size={16} className="text-amber-500" /> Odak Radyosu</span>
        <button onClick={() => setShowMusicWidget(false)} className={`text-zinc-500 hover:text-white transition-colors`}><X size={16} /></button>
      </div>
      <div className="p-4 sm:p-5 flex flex-col items-center gap-4 bg-linear-to-b from-transparent to-zinc-950/20">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-900 border-2 border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)] relative">
          {isMusicPlaying ? (
            <div className="flex items-end gap-1 h-5 sm:h-6">
              <div className="w-1 sm:w-1.5 bg-amber-500 rounded-t-sm animate-eq-1"></div>
              <div className="w-1 sm:w-1.5 bg-amber-500 rounded-t-sm animate-eq-2"></div>
              <div className="w-1 sm:w-1.5 bg-amber-500 rounded-t-sm animate-eq-3"></div>
            </div>
          ) : <Music className="text-zinc-500" size={20} />}
        </div>
        <div className="text-center w-full px-2">
          <h3 className="font-bold text-sm truncate text-zinc-100">{activeStation.title}</h3>
          <p className={`text-xs text-zinc-500 mt-1`}>{activeStation.category}</p>
        </div>
        <div className="w-full flex items-center gap-3 sm:gap-4 mt-2">
          <button onClick={toggleRadioPlay} className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isMusicPlaying ? 'bg-zinc-800 text-white border border-zinc-700' : `bg-amber-500 text-zinc-950`}`}>
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-zinc-900/50 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/50">
            <Volume2 size={16} className="text-zinc-500" />
            <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>
        </div>
      </div>
      <div className={`border-t border-zinc-800 max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar p-2`}>
        {RADIO_STATIONS.map((station) => (
          <button key={station.id} onClick={() => changeStation(station)} className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all ${activeStation.id === station.id ? 'bg-amber-500/10 border border-amber-500/20' : `hover:bg-zinc-800 border border-transparent`}`}>
            <div className="flex flex-col items-start text-left">
              <span className={`text-sm font-semibold ${activeStation.id === station.id ? "text-amber-500" : "text-zinc-100"}`}>{station.title}</span>
              <span className={`text-[10px] uppercase tracking-wider text-zinc-500`}>{station.category}</span>
            </div>
            {activeStation.id === station.id && isMusicPlaying && <PlayCircle size={14} className="text-amber-500" />}
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
    <div className="mt-6 w-full p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
      <h3 className="text-[10px] sm:text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
        <CalendarDays size={14}/> 30 Günlük Çalışma Haritası
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {days.map(d => {
          const count = pomodoroHistory[d] || 0;
          let bgColor = 'bg-zinc-800';
          if (count > 0 && count <= 2) bgColor = 'bg-amber-500/40';
          else if (count > 2 && count <= 5) bgColor = 'bg-amber-500/70';
          else if (count > 5) bgColor = 'bg-amber-500';
          
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
        <div className="w-3 h-3 rounded-sm bg-amber-500/40" />
        <div className="w-3 h-3 rounded-sm bg-amber-500/70" />
        <div className="w-3 h-3 rounded-sm bg-amber-500" />
        <span>Çok</span>
      </div>
    </div>
  );
};

const AIGeneratorTab = ({ activeVideoId, setActiveTab }: any) => {
  const { replaceVideoAIContent } = useStore();
  const [videoTitle, setVideoTitle] = useState<string>("Yükleniyor...");
  const [aiResponse, setAiResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (!activeVideoId) return;
    setVideoTitle("Yükleniyor...");
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${activeVideoId}&format=json`)
      .then(res => res.json())
      .then(data => setVideoTitle(data.title))
      .catch(() => setVideoTitle("Video Başlığı Alınamadı"));
  }, [activeVideoId]);

  const promptTemplate = `You are an educational assistant.
Detect the language of the video title and produce output in the same language.

LEVEL: midterm exam difficulty
STYLE: short, clear, exam-focused

TASKS:
1. Create 8 flashcards from the video context.
2. Create 10 multiple choice questions.

Follow the format exactly. Do not add any other text.

OUTPUT FORMAT:
FLASHCARDS
1|Question|Answer
2|Question|Answer
3|Question|Answer
4|Question|Answer
5|Question|Answer
6|Question|Answer
7|Question|Answer
8|Question|Answer

QUIZ
1|Question|A|B|C|D|CorrectLetter
2|Question|A|B|C|D|CorrectLetter
3|Question|A|B|C|D|CorrectLetter
4|Question|A|B|C|D|CorrectLetter
5|Question|A|B|C|D|CorrectLetter
6|Question|A|B|C|D|CorrectLetter
7|Question|A|B|C|D|CorrectLetter
8|Question|A|B|C|D|CorrectLetter
9|Question|A|B|C|D|CorrectLetter
10|Question|A|B|C|D|CorrectLetter

YOUTUBE TITLE:
${videoTitle}

YOUTUBE LINK:
https://www.youtube.com/watch?v=${activeVideoId}`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate);
    playSound('success');
    setSuccessMsg('Prompt kopyalandı! ChatGPT veya Gemini\'ye yapıştırın.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleParse = () => {
    setErrorMsg('');
    if (!aiResponse.trim()) return setErrorMsg('Lütfen AI cevabını yapıştırın.');

    const { parsedFlashcards, parsedQuiz } = parseAIResponse(aiResponse, activeVideoId);

    if (parsedFlashcards.length === 0 && parsedQuiz.length === 0) {
      playSound('error');
      return setErrorMsg('Geçersiz format. Lütfen yapay zekadan cevabı tam istenen formatta yeniden oluşturmasını isteyin.');
    }

    replaceVideoAIContent(activeVideoId, parsedFlashcards, parsedQuiz);
    
    setAiResponse('');
    playSound('success');
    if (parsedQuiz.length > 0) setActiveTab('quiz');
    else setActiveTab('flashcards');
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 animate-fade-in relative">
      <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Sparkles size={20} /></div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100">AI Öğrenme Sihirbazı</h2>
          <p className="text-xs sm:text-sm text-zinc-500">Yapay zeka ile anında Flashcard ve Quiz oluşturun.</p>
        </div>
      </div>

      <div className="mb-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span> Prompt'u Kopyala</span>
          <button onClick={handleCopyPrompt} className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-zinc-950 px-3 py-1.5 rounded-lg hover:scale-105 transition-transform active:scale-95 shadow-lg">
            <Copy size={14} /> Kopyala
          </button>
        </div>
        <p className="text-[10px] sm:text-xs text-zinc-400 mb-3">Bu metni kopyalayın ve en sevdiğiniz yapay zekaya (ChatGPT, Gemini vb.) yapıştırın.</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 h-24 overflow-y-auto custom-scrollbar text-[10px] sm:text-xs text-zinc-500 font-mono whitespace-pre-wrap">
          {promptTemplate}
        </div>
        {successMsg && <p className="text-xs text-green-400 font-bold mt-2 flex items-center gap-1 animate-fade-in"><CheckCircle2 size={14} /> {successMsg}</p>}
      </div>

      <div className="flex-1 flex flex-col bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <span className="text-xs sm:text-sm font-bold text-blue-400 flex items-center gap-2 mb-3"><span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">2</span> AI Cevabını Yapıştır</span>
        <textarea 
          value={aiResponse} onChange={(e) => setAiResponse(e.target.value)}
          placeholder="Yapay zekanın verdiği çıktıyı buraya yapıştırın..."
          className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 outline-none focus:border-blue-500 resize-none custom-scrollbar mb-4"
        ></textarea>
        {errorMsg && <p className="text-xs text-red-400 font-bold mb-3 flex items-center gap-1 animate-fade-in"><AlertCircle size={14} /> {errorMsg}</p>}
        <button onClick={handleParse} className="w-full py-3 rounded-xl bg-blue-500 text-zinc-950 font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
          <Sparkles size={16} /> Materyalleri Oluştur
        </button>
      </div>
    </div>
  );
};

const QuizTab = ({ activeVideoId }: any) => {
  const { quiz, answerQuizQuestion, deleteQuizQuestion, resetQuiz } = useStore();
  const currentQuiz = quiz.filter(q => q.videoId === activeVideoId);

  if (currentQuiz.length === 0) {
    return (
      <div className={`text-center py-16 text-zinc-500 flex flex-col items-center gap-4 animate-fade-in`}>
        <div className={`p-4 rounded-full bg-zinc-950/50`}><Target size={32} className="opacity-50" /></div>
        <p className="text-xs sm:text-sm">Bu video için henüz Quiz yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
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
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/20`}>Doğru: {correctCount}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20`}>Yanlış: {wrongCount}</span>
        </div>
        <button onClick={() => { resetQuiz(activeVideoId); playSound('click'); }} className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg transition-colors">
          Reset Quiz
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {currentQuiz.map((q, i) => {
          const isAnswered = !!q.userAnswer;
          const isCorrect = q.userAnswer === q.correct;
          
          return (
            <div key={q.id} className="relative group bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 sm:p-5">
              <button onClick={() => { deleteQuizQuestion(q.id); playSound('click'); }} className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
              <h4 className="text-sm font-semibold text-zinc-100 mb-4 leading-relaxed"><span className="text-amber-500 mr-1">{i+1}.</span> {q.question}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optionText = q.options[opt as keyof typeof q.options];
                  const isSelected = q.userAnswer === opt;
                  const isActuallyCorrect = q.correct === opt;
                  
                  let btnStyle = "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-500 hover:text-amber-500";
                  if (isAnswered) {
                    if (isActuallyCorrect) btnStyle = "bg-green-500/20 border-green-500 text-green-500 font-bold";
                    else if (isSelected) btnStyle = "bg-red-500/20 border-red-500 text-red-500";
                    else btnStyle = "bg-zinc-900 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed";
                  }

                  return (
                    <button 
                      key={opt} disabled={isAnswered}
                      onClick={() => { answerQuizQuestion(q.id, opt); playSound(q.correct === opt ? 'success' : 'error'); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs sm:text-sm transition-all ${btnStyle}`}
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

const FlashcardsTab = ({ activeVideoId }: any) => {
  const { flashcards, deleteFlashcard, toggleFlashcardLearned, resetFlashcards } = useStore();
  const currentCards = flashcards.filter(c => c.videoId === activeVideoId);
  const learnedCount = currentCards.filter(c => c.learned).length;

  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (currentCards.length === 0) {
    return (
      <div className={`text-center py-10 sm:py-16 text-zinc-500 flex flex-col items-center gap-4 animate-fade-in`}>
        <div className={`p-3 sm:p-4 rounded-full bg-zinc-950/50`}><BookOpen size={24} className="sm:w-8 sm:h-8 opacity-50" /></div>
        <p className="text-xs sm:text-sm">Bu video için henüz Kart yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
      </div>
    );
  }

  if (isStudyMode) {
    const currentCard = currentCards[currentIndex];
    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
        <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center">
          <button onClick={() => setIsStudyMode(false)} className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"><ArrowRight className="rotate-180" size={14}/> Geri Dön</button>
          <span className="text-xs font-bold text-zinc-400">Kart {currentIndex + 1} / {currentCards.length}</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {currentCard && (
            <div key={currentCard.id} className="relative group perspective-1000 w-full max-w-md h-64 sm:h-80 cursor-pointer" onClick={(e) => { e.currentTarget.classList.toggle('flip-card'); playSound('click'); }}>
              <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
                <div className={`absolute w-full h-full backface-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 flex items-center justify-center text-center shadow-xl`}><p className="font-medium text-base sm:text-lg text-zinc-100">{currentCard.question}</p></div>
                <div className={`absolute w-full h-full backface-hidden rounded-3xl border-2 border-amber-500/50 bg-amber-500/10 p-6 sm:p-8 flex items-center justify-center text-center rotate-y-180 shadow-xl`}><p className={`font-bold text-base sm:text-lg text-amber-500`}>{currentCard.answer}</p></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md">
            <button onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); playSound('click'); }} disabled={currentIndex === 0} className="px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1">Önceki</button>
            <button 
              onClick={() => { toggleFlashcardLearned(currentCard.id); playSound('success'); }} 
              className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all ${currentCard.learned ? 'border-green-500 bg-green-500/20 text-green-500' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-amber-500'}`} title="Öğrendim İşaretle"
            >
              {currentCard.learned ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <button onClick={() => { setCurrentIndex(Math.min(currentCards.length - 1, currentIndex + 1)); playSound('click'); }} disabled={currentIndex === currentCards.length - 1} className="px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl font-bold text-xs sm:text-sm disabled:opacity-30 transition-colors flex-1">Sonraki</button>
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
          <button onClick={() => { resetFlashcards(activeVideoId); playSound('click'); }} className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg transition-colors">Sıfırla</button>
          <button onClick={() => { setIsStudyMode(true); setCurrentIndex(0); playSound('start'); }} className="text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"><Play size={12}/> Çalış</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
        {currentCards.map(card => (
          <div key={card.id} className={`relative group perspective-1000 h-24 sm:h-28 cursor-pointer ${card.learned ? 'opacity-60 hover:opacity-100' : ''}`} onClick={(e) => { e.currentTarget.classList.toggle('flip-card'); playSound('click'); }}>
            <button onClick={(e) => { e.stopPropagation(); deleteFlashcard(card.id); playSound('click'); }} className="absolute -top-2 -right-2 z-20 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Trash2 size={12} /></button>
            {card.learned && <div className="absolute top-2 left-2 z-10 text-green-500 bg-black/50 rounded-full"><CheckCircle2 size={16} /></div>}
            
            <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
              <div className={`absolute w-full h-full backface-hidden rounded-2xl border ${card.learned ? 'border-green-500/30' : 'border-zinc-800'} bg-zinc-950/50 p-4 flex items-center justify-center text-center`}><p className="font-medium text-xs sm:text-sm">{card.question}</p></div>
              <div className={`absolute w-full h-full backface-hidden rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-4 flex items-center justify-center text-center rotate-y-180`}><p className={`font-bold text-xs sm:text-sm text-amber-500`}>{card.answer}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN APPLICATION (App.tsx)
// ==========================================
export default function App() {
  const { 
    view, globalMuted, notes, flashcards, quiz, todos, activeVideoId, playerConfig, 
    setPlayerConfig, setActiveVideoId, initData, addNote, deleteNote, addPomodoroRecord,
    addToHistory, toggleGlobalMute
  } = useStore();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'pomodoro' | 'ai'>('notes');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
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

  // Sekme ismini dinamik olarak güncelleme
  useEffect(() => {
    document.title = "BMO Learn | Odaklan ve Öğren";
  }, []);

  useEffect(() => {
    const sNotes = localStorage.getItem('bmo_notes');
    const sCards = localStorage.getItem('bmo_flashcards');
    const sQuiz = localStorage.getItem('bmo_quiz');
    const sTodos = localStorage.getItem('bmo_todos');
    const sHistory = localStorage.getItem('bmo_history');
    const sPomodoro = localStorage.getItem('bmo_pomodoro');
    initData(
      sNotes ? JSON.parse(sNotes) : [], sCards ? JSON.parse(sCards) : [],
      sQuiz ? JSON.parse(sQuiz) : [], sTodos ? JSON.parse(sTodos) : [], 
      sHistory ? JSON.parse(sHistory) : [], sPomodoro ? JSON.parse(sPomodoro) : {}
    );
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, [initData]);

  // Pomodoro Mantığı ve Heatmap Kaydı
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      if (timerMode === 'focus') {
        playSound('success'); 
        addPomodoroRecord(); 
        setTimerMode('break'); 
        setTimeLeft(breakDuration * 60);
        alert("Odaklanma süreniz bitti! Şimdi mola zamanı.");
      } else {
        playSound('break'); 
        setTimerMode('focus'); 
        setTimeLeft(focusDuration * 60); 
        setIsTimerRunning(false);
        alert("Mola bitti! Yeni bir odaklanma seansına hazır mısınız?");
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
      
      if (e.ctrlKey && e.code === 'Space' && !isInput) {
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
  }, []);

  // Sadece F11 Tuşu / Tarayıcı Fullscreen Senkronizasyonu
  useEffect(() => {
    const handleFullscreenChange = () => { 
      if (document.fullscreenElement) { setIsFocusMode(true); } 
      else { setIsFocusMode(false); } 
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (playerRef.current?.isMuted) globalMuted ? playerRef.current.mute() : playerRef.current.unMute();
    if (musicPlayerRef.current?.isMuted) globalMuted ? musicPlayerRef.current.mute() : musicPlayerRef.current.unMute();
  }, [globalMuted]);

  // YouTube DOM Hatası Çözümü (Failsafe)
  useEffect(() => {
    if (isInitializing) return; 
    
    const tryInitPlayers = () => {
      if (!window.YT || !document.getElementById('youtube-main-player')) {
        setTimeout(tryInitPlayers, 100);
        return;
      }
      if (view === 'app') initMainPlayer();
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
  }, [view, isInitializing]);

  useEffect(() => {
    if (window.YT && playerRef.current?.loadVideoById && view === 'app') {
      setVideoError(false);
      if (playerConfig.pId) playerRef.current.loadPlaylist({ list: playerConfig.pId, listType: 'playlist' });
      else if (playerConfig.vId) playerRef.current.loadVideoById(playerConfig.vId);
    }
  }, [playerConfig, view]);

  const handleMusicVolumeChange = (val: number) => {
    setMusicVolume(val);
    if (musicPlayerRef.current?.setVolume) musicPlayerRef.current.setVolume(val);
  }

  const initMainPlayer = () => {
    if (playerRef.current?.destroy) playerRef.current.destroy();
    const playerVars: any = { autoplay: 1, rel: 0, origin: typeof window !== 'undefined' ? window.location.origin : '' };
    if (playerConfig.pId) { playerVars.listType = 'playlist'; playerVars.list = playerConfig.pId; }

    playerRef.current = new window.YT.Player('youtube-main-player', {
      host: 'https://www.youtube.com', videoId: playerConfig.vId || '', playerVars: playerVars,
      events: {
        'onStateChange': (e: any) => {
          if (e.target.getVideoData) {
            const data = e.target.getVideoData();
            if (data.video_id) {
              setActiveVideoId(data.video_id);
              if (data.title && e.data === window.YT.PlayerState.PLAYING) addToHistory({ videoId: data.video_id, title: data.title, timestamp: Date.now() });
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

    if (vId || pId) { setPlayerConfig({ vId: vId || '', pId }); playSound('success'); setVideoUrlInput(''); } 
    else { playSound('error'); alert("Lütfen geçerli bir YouTube linki giriniz."); }
  };

  const jumpToTime = (time: number) => {
    if (playerRef.current?.seekTo) { playerRef.current.seekTo(time, true); playerRef.current.playVideo(); playSound('click'); }
  };

  const handleExportNotes = () => {
    const currentNotes = notes.filter(n => n.videoId === activeVideoId);
    if (currentNotes.length === 0) return alert("İndirilecek not bulunamadı.");
    let content = `BMO Learn - Video Notları\nVideo ID: ${activeVideoId}\nTarih: ${new Date().toLocaleDateString()}\n-----------------------------------\n\n`;
    currentNotes.forEach(n => { content += `[${formatTime(n.time)}] ${n.text}\n`; });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `BMOLearn_Notlar_${activeVideoId}.txt`;
    a.click(); URL.revokeObjectURL(url); playSound('success');
  };

  const toggleRadioPlay = () => {
    if (!musicPlayerRef.current?.getPlayerState) return;
    isMusicPlaying ? musicPlayerRef.current.pauseVideo() : musicPlayerRef.current.playVideo(); playSound('click');
  };

  const changeStation = (station: typeof RADIO_STATIONS[0]) => {
    setActiveStation(station);
    if (musicPlayerRef.current?.loadVideoById) { musicPlayerRef.current.loadVideoById(station.id); setIsMusicPlaying(true); }
    playSound('click');
  };

  // Saf F11 Davranışı
  const toggleFocusMode = async () => {
    if (!document.fullscreenElement) {
      try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); setIsFocusMode(true); } catch (e) { }
      playSound('click');
    } else {
      try { if (document.exitFullscreen) await document.exitFullscreen(); setIsFocusMode(false); } catch (e) { }
      playSound('click');
    }
  };

  const currentNotes = notes.filter(n => n.videoId === activeVideoId);

  if (isInitializing) return <SkeletonLoading />;

  return (
    <>
      <PWAInjector />
      <OfflineBanner />
      <BlueLightFilter />
      <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden -z-50"><div id="youtube-music-player"></div></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #52525b; border-radius: 10px; }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .flip-card .card-inner { transform: rotateY(180deg); }
        @keyframes eq { 0% { height: 4px; } 50% { height: 16px; } 100% { height: 4px; } }
        .animate-eq-1 { animation: eq 0.8s ease-in-out infinite; }
        .animate-eq-2 { animation: eq 1.2s ease-in-out infinite 0.2s; }
        .animate-eq-3 { animation: eq 0.9s ease-in-out infinite 0.4s; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes hypeComplete { 0% { transform: scale(1); opacity: 1; border-color: rgba(245, 158, 11, 0.5); box-shadow: 0 0 0 rgba(245, 158, 11, 0); } 30% { transform: scale(1.02) translateX(10px); background-color: rgba(245, 158, 11, 0.2); box-shadow: 0 0 20px rgba(245, 158, 11, 0.5); opacity: 1; } 100% { transform: scale(0.9) translateX(50px); opacity: 0; filter: blur(5px); } }
        .animate-hype-complete { animation: hypeComplete 0.8s ease-in forwards; pointer-events: none; }
      `}} />

      {view === 'landing' && <LandingPage />}

      {view === 'app' && (
        <div className={`min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-500 animate-fade-in relative`}>
          <HistoryModal showHistory={showHistory} setShowHistory={setShowHistory} />

          <header className={`flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-40 backdrop-blur-xl bg-opacity-80 gap-3`}>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => { useStore.getState().setView('landing'); playSound('click'); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">BMO <span className="text-amber-500">Learn</span></h1>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className={`hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-zinc-950/50 border border-zinc-800 text-xs font-medium mr-2 transition-all`}>
                <span className="flex items-center gap-1.5 text-amber-500" title="Notlar"><Bookmark size={14}/> {notes.length}</span>
                <span className={`w-1 h-1 rounded-full text-zinc-500`}></span>
                <span className="flex items-center gap-1.5 text-blue-400" title="Kartlar"><BookOpen size={14}/> {flashcards.length}</span>
                <span className={`w-1 h-1 rounded-full text-zinc-500`}></span>
                <span className="flex items-center gap-1.5 text-green-400" title="Quiz Soruları"><Target size={14}/> {quiz.length}</span>
              </div>
              
              <button onClick={() => { setShowHistory(true); playSound('click'); }} className={`p-2 sm:p-2.5 rounded-full hover:bg-zinc-500/10 text-zinc-400 transition-colors`} title="Geçmiş">
                <History size={18} />
              </button>
              <SettingsPopover />
              <div className={`hidden sm:block w-px h-5 border-zinc-800 mx-1`}></div>

              <button onClick={() => { setShowMusicWidget(!showMusicWidget); playSound('click'); }} className={`p-2 sm:p-2.5 rounded-full transition-all ${showMusicWidget ? 'bg-amber-500/20 text-amber-500' : `hover:bg-zinc-500/10 text-zinc-400`}`} title="Odak Radyosu">
                {isMusicPlaying ? <Radio className="animate-pulse" size={18} /> : <Music size={18} />}
              </button>
              <button onClick={() => { toggleGlobalMute(); playSound('click'); }} className={`p-2.5 rounded-full hover:bg-zinc-500/10 ${globalMuted ? 'text-red-400' : 'text-zinc-400'}`} title="Tüm Sesleri Sustur (Mute)">
                {globalMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <button onClick={toggleFocusMode} className={`p-2.5 rounded-full hover:bg-zinc-500/10 ${isFocusMode ? 'text-amber-500' : 'text-zinc-400'}`} title="Tam Ekran (F11)">
                {isFocusMode ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </header>

          <RadioWidget 
            showMusicWidget={showMusicWidget} setShowMusicWidget={setShowMusicWidget}
            activeStation={activeStation} isMusicPlaying={isMusicPlaying} musicVolume={musicVolume}
            setMusicVolume={handleMusicVolumeChange} toggleRadioPlay={toggleRadioPlay} changeStation={changeStation}
          />

          <main className={`flex-1 flex flex-col lg:flex-row p-3 sm:p-4 lg:p-6 gap-4 sm:gap-6 max-w-400 mx-auto w-full`}>
            
            {/* SOL TARAFI: VİDEO */}
            <div className={`flex flex-col w-full lg:w-[65%]`}>
              <form onSubmit={handleDashboardUrlChange} className={`flex gap-2 sm:gap-3 mb-4 sm:mb-5 p-1.5 sm:p-2 pl-4 sm:pl-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm focus-within:border-amber-500/50 transition-colors`}>
                <input type="text" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="Yeni bir YouTube Linki yapıştırın..." className={`flex-1 bg-transparent border-none outline-none text-zinc-100 text-xs sm:text-sm font-medium`} />
                {videoUrlInput && <button type="button" onClick={() => setVideoUrlInput('')} className="p-2 text-zinc-500 hover:text-zinc-300"><X size={16} /></button>}
                <button type="submit" className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-zinc-950 bg-amber-500 font-bold text-xs sm:text-sm hover:scale-105 transition-transform active:scale-95`}>Değiştir</button>
              </form>

              <div className={`relative w-full aspect-video bg-black shadow-2xl transition-all duration-500 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800/50`}>
                {videoError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-sm gap-3 bg-zinc-950">
                    <VolumeX size={32} className="opacity-50" />
                    <p>Bu video oynatılamıyor (Silinmiş veya kısıtlanmış olabilir).</p>
                  </div>
                ) : (
                  <div id="youtube-main-player" className="absolute top-0 left-0 w-full h-full"></div>
                )}
              </div>
            </div>

            {/* SAĞ TARAF: ARAÇLAR */}
            <div className={`flex flex-col w-full lg:w-[35%] h-125 md:h-150 lg:h-auto bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-800 shadow-xl overflow-hidden transition-all duration-500`}>
              
              <div className={`flex border-b border-zinc-800 overflow-x-auto custom-scrollbar`}>
                <button onClick={() => { setActiveTab('notes'); playSound('click'); }} className={`flex-1 shrink-0 py-3 px-2 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'notes' ? `text-amber-500 border-b-2 border-amber-500 bg-amber-500/5` : 'text-zinc-500'}`}><List size={14} /> <span className="hidden sm:inline">Notlar</span></button>
                <button onClick={() => { setActiveTab('flashcards'); playSound('click'); }} className={`flex-1 shrink-0 py-3 px-2 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'flashcards' ? `text-amber-500 border-b-2 border-amber-500 bg-amber-500/5` : 'text-zinc-500'}`}><BookOpen size={14} /> <span className="hidden sm:inline">Kartlar</span></button>
                <button onClick={() => { setActiveTab('quiz'); playSound('click'); }} className={`flex-1 shrink-0 py-3 px-2 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'quiz' ? `text-green-500 border-b-2 border-green-500 bg-green-500/5` : 'text-zinc-500'}`}><Target size={14} /> <span className="hidden sm:inline">Quiz</span></button>
                <button onClick={() => { setActiveTab('pomodoro'); playSound('click'); }} className={`flex-1 shrink-0 py-3 px-2 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'pomodoro' ? `text-amber-500 border-b-2 border-amber-500 bg-amber-500/5` : 'text-zinc-500'}`}><Timer size={14} /> <span className="hidden sm:inline">Odak</span></button>
                <button onClick={() => { setActiveTab('ai'); playSound('start'); }} className={`flex-1 shrink-0 py-3 px-2 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'ai' ? `text-blue-500 border-b-2 border-blue-500 bg-blue-500/5` : 'text-blue-400/50 hover:text-blue-400'}`}><Sparkles size={14} /> AI</button>
              </div>

              {activeTab === 'notes' && (
                <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
                  {currentNotes.length > 0 && (
                    <button onClick={handleExportNotes} className={`absolute top-4 right-4 z-10 p-2 rounded-lg bg-zinc-800/50 hover:bg-amber-500 hover:text-black text-zinc-400 transition-all border border-zinc-700/50 backdrop-blur-sm`} title="Notları İndir (TXT)">
                      <Download size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-12 space-y-3 custom-scrollbar">
                    {currentNotes.length === 0 && (
                      <div className={`text-center py-10 sm:py-16 text-zinc-500 flex flex-col items-center gap-4`}><div className={`p-3 sm:p-4 rounded-full bg-zinc-950/50`}><Bookmark size={24} className="sm:w-8 sm:h-8 opacity-50" /></div><p className="text-xs sm:text-sm">Bu video için henüz not yok.</p></div>
                    )}
                    {currentNotes.map(note => (
                      <div key={note.id} className={`group flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-950/50 border border-transparent hover:border-zinc-800 transition-all`}>
                        <button onClick={() => jumpToTime(note.time)} className={`mt-0.5 px-2 sm:px-2.5 py-1 h-fit rounded-lg bg-amber-500/10 text-amber-500 text-[10px] sm:text-xs font-mono font-bold hover:bg-amber-500/20`}>
                          {formatTime(note.time)}
                        </button>
                        <p className="flex-1 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={renderMarkdown(note.text)}></p>
                        <button onClick={() => { deleteNote(note.id); playSound('click'); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className={`p-4 sm:p-5 border-t border-zinc-800`}>
                    <form onSubmit={(e) => {
                      e.preventDefault(); if(!newNote.trim()) return;
                      const time = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
                      addNote({ id: Date.now(), videoId: activeVideoId, text: newNote, time });
                      setNewNote(''); playSound('success');
                    }} className="relative">
                      <input ref={noteInputRef} type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Not al... (**kalın** veya - liste desteği var)" className={`w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-2xl bg-zinc-950/50 border border-zinc-800 focus:border-amber-500 outline-none text-xs sm:text-sm`} />
                      <button type="submit" className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-600 text-zinc-950`}><Plus size={16} className="sm:w-4.5 sm:h-4.5" /></button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'flashcards' && <FlashcardsTab activeVideoId={activeVideoId} />}
              {activeTab === 'quiz' && <QuizTab activeVideoId={activeVideoId} />}

              {activeTab === 'pomodoro' && (
                <div className="flex flex-col flex-1 h-full overflow-y-auto custom-scrollbar relative animate-fade-in">
                  <div className="flex flex-col items-center p-4 sm:p-8 border-b border-zinc-800/50">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs sm:text-sm mb-4 sm:mb-6 ${timerMode === 'break' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {timerMode === 'break' ? <Coffee size={16} /> : <Brain size={16} />}
                      {timerMode === 'break' ? 'Mola Zamanı' : 'Odaklanma Zamanı'}
                    </div>

                    {!isTimerRunning && (
                      <div className="flex gap-4 sm:gap-8 mb-6 w-full justify-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] sm:text-xs font-semibold mb-2 text-zinc-500`}>ODAK (DK)</span>
                          <div className={`flex items-center gap-2 sm:gap-3 bg-zinc-900/50 p-1 sm:p-1.5 rounded-full border border-zinc-800`}>
                            <button onClick={() => { if(focusDuration > 1) { setFocusDuration(focusDuration - 1); if(timerMode === 'focus') setTimeLeft((focusDuration - 1) * 60); }}} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">-</button>
                            <span className="font-mono text-base sm:text-lg w-6 text-center">{focusDuration}</span>
                            <button onClick={() => { if(focusDuration < 120) { setFocusDuration(focusDuration + 1); if(timerMode === 'focus') setTimeLeft((focusDuration + 1) * 60); }}} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">+</button>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] sm:text-xs font-semibold mb-2 text-zinc-500`}>MOLA (DK)</span>
                          <div className={`flex items-center gap-2 sm:gap-3 bg-zinc-900/50 p-1 sm:p-1.5 rounded-full border border-zinc-800`}>
                            <button onClick={() => { if(breakDuration > 1) { setBreakDuration(breakDuration - 1); if(timerMode === 'break') setTimeLeft((breakDuration - 1) * 60); }}} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">-</button>
                            <span className="font-mono text-base sm:text-lg w-6 text-center">{breakDuration}</span>
                            <button onClick={() => { if(breakDuration < 30) { setBreakDuration(breakDuration + 1); if(timerMode === 'break') setTimeLeft((breakDuration + 1) * 60); }}} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">+</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-8 ${isTimerRunning ? (timerMode === 'break' ? 'border-blue-500' : 'border-amber-500') : 'border-zinc-800'} flex items-center justify-center mb-6 sm:mb-8 transition-colors duration-1000 shadow-2xl`}>
                      <div className={`absolute inset-0 rounded-full border-4 ${timerMode === 'break' ? 'border-blue-500/20' : 'border-amber-500/20'} m-2 transition-colors duration-1000`}></div>
                      <h2 className="text-4xl sm:text-5xl font-mono font-bold tracking-tighter">{formatTime(timeLeft)}</h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                      <button onClick={() => { setIsTimerRunning(!isTimerRunning); playSound('click'); }} className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-zinc-950 flex items-center gap-2 transition-transform active:scale-95 text-sm sm:text-base ${isTimerRunning ? 'bg-zinc-100 text-zinc-900' : (timerMode === 'break' ? 'bg-blue-500' : 'bg-amber-500')}`}>
                        {isTimerRunning ? <Pause size={18} /> : <Play size={18} />} 
                        {isTimerRunning ? 'DURAKLAT' : (timerMode === 'break' ? 'MOLAYI BAŞLAT' : 'ODAKLAN')}
                      </button>
                      
                      {timerMode === 'break' && (
                         <button onClick={() => { setIsTimerRunning(false); setTimerMode('focus'); setTimeLeft(focusDuration * 60); playSound('click'); }} className="p-3 sm:p-4 rounded-2xl border border-zinc-800 text-amber-500 hover:bg-amber-500/10 transition-colors" title="Molayı Atla ve Odaklan">
                            <SkipForward size={18} />
                         </button>
                      )}

                      <button onClick={() => { setIsTimerRunning(false); setTimeLeft(timerMode === 'focus' ? focusDuration * 60 : breakDuration * 60); playSound('click'); }} className={`p-3 sm:p-4 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-zinc-100 transition-colors`} title="Sıfırla">
                        <Timer size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex-1 flex flex-col bg-black/10 min-h-62.5">
                    <h3 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 flex items-center gap-2"><List size={16} className="text-amber-500"/> Günlük Görevler</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 sm:pr-2 custom-scrollbar">
                      {useStore.getState().todos.length === 0 && <p className={`text-[10px] sm:text-xs text-zinc-500 text-center py-4`}>Hedeflerinizi belirleyin ve bitirdikçe işaretleyin.</p>}
                      {useStore.getState().todos.map(todo => (
                        <div key={todo.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-zinc-800 bg-zinc-950/50 group transition-all ${todo.completed ? 'animate-hype-complete' : ''}`}>
                          <button 
                            onClick={() => { 
                              if(!todo.completed) {
                                useStore.getState().toggleTodo(todo.id); playSound('success'); 
                                setTimeout(() => useStore.getState().deleteTodo(todo.id), 800);
                              }
                            }} 
                            className={`${todo.completed ? 'text-amber-500' : 'text-zinc-500'} hover:text-amber-400`}
                          >
                            {todo.completed ? <CheckSquare size={16} className="sm:w-4.5 sm:h-4.5" /> : <Square size={16} className="sm:w-4.5 sm:h-4.5" />}
                          </button>
                          <p className={`flex-1 text-xs sm:text-sm ${todo.completed ? 'line-through text-amber-500/80 font-semibold' : 'text-zinc-100'}`}>{todo.text}</p>
                          <button onClick={() => { useStore.getState().deleteTodo(todo.id); playSound('click'); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 sm:p-1.5 rounded"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                    
                    <PomodoroHeatmap />

                    <form onSubmit={(e) => {
                      e.preventDefault(); 
                      const todoInput = e.currentTarget.elements.namedItem('todoInput') as HTMLInputElement;
                      if(!todoInput.value.trim()) return; 
                      useStore.getState().addTodo(todoInput.value); 
                      todoInput.value = ''; 
                      playSound('click');
                    }} className="mt-3 sm:mt-4 relative">
                      <input name="todoInput" type="text" placeholder="Yeni görev ekle..." className={`w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-xs sm:text-sm outline-none focus:border-amber-500`} />
                      <button type="submit" className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-lg bg-amber-500 text-zinc-950`}><Plus size={16} /></button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && <AIGeneratorTab activeVideoId={activeVideoId} setActiveTab={setActiveTab} />}

            </div>
          </main>
        </div>
      )}
    </>
  );
}