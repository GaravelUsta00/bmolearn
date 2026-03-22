"use client";

import React, { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { 
  Moon, Sun, Maximize, Minimize, Plus, Trash2, 
  List, BookOpen, Volume2, VolumeX, Bookmark, 
  Music, X, Timer, Pause, Play, Radio, ArrowRight, 
  PlayCircle, Coffee, Brain, History, Download, 
  CheckSquare, Square, Keyboard
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
interface Flashcard { id: number; videoId: string; question: string; answer: string; }
interface Todo { id: number; text: string; completed: boolean; }
interface HistoryItem { videoId: string; title: string; timestamp: number; }

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

// ==========================================
// 2. GLOBAL STATE (ZUSTAND)
// ==========================================
interface AppState {
  view: 'landing' | 'app';
  isDark: boolean;
  soundEnabled: boolean;
  notes: Note[];
  flashcards: Flashcard[];
  todos: Todo[];
  history: HistoryItem[];
  activeVideoId: string;
  playerConfig: { vId: string; pId: string | null };
  
  setView: (view: 'landing' | 'app') => void;
  setPlayerConfig: (config: { vId: string; pId: string | null }) => void;
  toggleDark: () => void;
  toggleSound: () => void;
  setActiveVideoId: (id: string) => void;
  
  addNote: (note: Note) => void;
  deleteNote: (id: number) => void;
  addFlashcard: (card: Flashcard) => void;
  deleteFlashcard: (id: number) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  addToHistory: (item: HistoryItem) => void;
  deleteHistoryItem: (videoId: string) => void;
  clearHistory: () => void;
  
  initData: (notes: Note[], cards: Flashcard[], todos: Todo[], history: HistoryItem[]) => void;
}

const useStore = create<AppState>((set) => ({
  view: 'landing', isDark: true, soundEnabled: true,
  notes: [], flashcards: [], todos: [], history: [],
  activeVideoId: '', playerConfig: { vId: '', pId: null },

  setView: (view) => set({ view }),
  setPlayerConfig: (config) => set({ playerConfig: config }),
  toggleDark: () => set((state) => ({ isDark: !state.isDark })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
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
    
    localStorage.setItem('bmo_history', JSON.stringify(newHistory));
    localStorage.setItem('bmo_notes', JSON.stringify(newNotes));
    localStorage.setItem('bmo_flashcards', JSON.stringify(newCards));
    
    return { history: newHistory, notes: newNotes, flashcards: newCards };
  }),
  
  clearHistory: () => set(() => {
    localStorage.removeItem('bmo_history');
    localStorage.removeItem('bmo_notes');
    localStorage.removeItem('bmo_flashcards');
    return { history: [], notes: [], flashcards: [] };
  }),
  
  initData: (notes, cards, todos, history) => set({ notes, flashcards: cards, todos, history })
}));

// ==========================================
// 3. UTILS (Ses Motoru)
// ==========================================
const playSound = (type: 'click' | 'success' | 'start' | 'break' | 'tick' = 'click') => {
  if (!useStore.getState().soundEnabled) return; 
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

// ==========================================
// 4. COMPONENTS (Bileşenler)
// ==========================================

const LandingPage = ({ theme }: any) => {
  const { setView, setPlayerConfig } = useStore();
  const [url, setUrl] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const vMatch = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
    const pMatch = url.match(/[?&]list=([^#&?]+)/);
    const vId = vMatch ? vMatch[1] : '';
    const pId = pMatch ? pMatch[1] : null;

    if (vId || pId) { setPlayerConfig({ vId, pId }); playSound('start'); setView('app'); } 
    else { setPlayerConfig({ vId: '1bvwPRXhKkQ', pId: null }); playSound('start'); setView('app'); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${theme.bg} p-4`}>
      <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-amber-500/10 blur-[80px] md:blur-[120px] rounded-full animate-blob pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-zinc-600/20 blur-[80px] md:blur-[120px] rounded-full animate-blob animation-delay-2000 pointer-events-none mix-blend-screen"></div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center animate-fade-in-up">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-linear-to-r from-zinc-100 to-zinc-500 drop-shadow-sm text-center">
          BMO <span className="text-amber-500">Learn</span>
        </h1>
        <p className={`text-base sm:text-lg md:text-xl font-medium tracking-wide mb-10 md:mb-12 ${theme.textMuted} text-center`}>
          Sadece odaklanın. Gerisini bize bırakın.
        </p>

        <form onSubmit={handleStart} className="w-full relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-amber-500 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className={`relative flex items-center p-2 pl-4 sm:pl-6 rounded-full ${theme.panelBg} border border-zinc-800/50 shadow-2xl`}>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube bağlantınızı yapıştırın..." className={`flex-1 bg-transparent border-none outline-none ${theme.text} text-sm sm:text-base md:text-lg w-full font-medium placeholder-zinc-600`} autoFocus />
            <button type="submit" className={`ml-2 p-3 sm:p-4 rounded-full ${theme.goldBg} text-zinc-950 shadow-lg transition-transform active:scale-95 hover:scale-105 flex items-center justify-center`}><ArrowRight size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} /></button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistoryModal = ({ theme, showHistory, setShowHistory }: any) => {
  const { history, setPlayerConfig, clearHistory, deleteHistoryItem } = useStore();
  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowHistory(false)}>
      <div className={`w-full max-w-3xl max-h-[85vh] flex flex-col ${theme.panelBg} border ${theme.border} rounded-3xl shadow-2xl overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className={`p-4 sm:p-6 border-b ${theme.border} flex justify-between items-center`}>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2"><History className={theme.goldText} /> Geçmiş Kitaplığı</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => { clearHistory(); playSound('click'); }} className="text-xs font-semibold text-red-500 hover:bg-red-500/10 px-2 sm:px-3 py-1.5 rounded-lg transition-colors">Tümünü Temizle</button>
            <button onClick={() => setShowHistory(false)} className={`${theme.textMuted} hover:text-white`}><X size={20} /></button>
          </div>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {history.length === 0 && <div className={`col-span-full text-center py-10 ${theme.textMuted}`}>Henüz izlenmiş video yok.</div>}
          {history.map((item, idx) => (
            <div key={idx} className={`relative group cursor-pointer rounded-2xl overflow-hidden border ${theme.border} ${theme.inputBg} hover:border-amber-500/50 transition-all`}>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.videoId); playSound('success'); }} 
                className="absolute top-2 right-2 z-20 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-md"
                title="Geçmişi ve Bu Videoya Ait Verileri Sil"
              >
                <Trash2 size={14} />
              </button>
              <div onClick={() => { setPlayerConfig({ vId: item.videoId, pId: null }); setShowHistory(false); playSound('success'); }}>
                <div className="w-full aspect-video bg-black relative overflow-hidden">
                  <img src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-amber-500 text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"><Play size={14} fill="currentColor" /></div>
                </div>
                <div className="p-3"><p className="text-xs font-semibold line-clamp-2 leading-snug">{item.title}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RadioWidget = ({ theme, showMusicWidget, setShowMusicWidget, activeStation, isMusicPlaying, musicVolume, setMusicVolume, toggleRadioPlay, changeStation }: any) => {
  if (!showMusicWidget) return null;
  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl border ${theme.border} ${theme.panelBg} shadow-2xl shadow-black/50 backdrop-blur-3xl z-50 overflow-hidden flex flex-col animate-scale-in`}>
      <div className={`px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b ${theme.border} bg-zinc-950/40`}>
        <span className="text-sm font-bold flex items-center gap-2"><Radio size={16} className={theme.goldText} /> Odak Radyosu</span>
        <button onClick={() => setShowMusicWidget(false)} className={`${theme.textMuted} hover:text-white transition-colors`}><X size={16} /></button>
      </div>
      <div className="p-4 sm:p-5 flex flex-col items-center gap-4 bg-linear-to-b from-transparent to-zinc-950/20">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-900 border-2 border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)] relative">
          {isMusicPlaying ? (
            <div className="flex items-end gap-1 h-5 sm:h-6">
              <div className="w-1 sm:w-1.5 bg-amber-500 rounded-t-sm animate-eq-1"></div>
              <div className="w-1 sm:w-1.5 bg-amber-500 rounded-t-sm animate-eq-2"></div>
              <div className="w-1 sm:w-1.5 bg-amber-500 rounded-t-sm animate-eq-3"></div>
            </div>
          ) : <Music className={theme.textMuted} size={20} />}
        </div>
        <div className="text-center w-full px-2">
          <h3 className="font-bold text-sm truncate">{activeStation.title}</h3>
          <p className={`text-xs ${theme.textMuted} mt-1`}>{activeStation.category}</p>
        </div>
        <div className="w-full flex items-center gap-3 sm:gap-4 mt-2">
          <button onClick={toggleRadioPlay} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform active:scale-90 flex-shrink-0 ${isMusicPlaying ? 'bg-zinc-800 text-white border border-zinc-700' : `${theme.goldBg} text-zinc-950`}`}>
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-zinc-900/50 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/50">
            <Volume2 size={16} className={theme.textMuted} />
            <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>
        </div>
      </div>
      <div className={`border-t ${theme.border} max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar p-2`}>
        {RADIO_STATIONS.map((station) => (
          <button key={station.id} onClick={() => changeStation(station)} className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all ${activeStation.id === station.id ? 'bg-amber-500/10 border border-amber-500/20' : `hover:${theme.inputBg} border border-transparent`}`}>
            <div className="flex flex-col items-start text-left">
              <span className={`text-sm font-semibold ${activeStation.id === station.id ? theme.goldText : theme.text}`}>{station.title}</span>
              <span className={`text-[10px] uppercase tracking-wider ${theme.textMuted}`}>{station.category}</span>
            </div>
            {activeStation.id === station.id && isMusicPlaying && <PlayCircle size={14} className={theme.goldText} />}
          </button>
        ))}
      </div>
    </div>
  );
};

const PomodoroTab = ({ theme, isTimerRunning, setIsTimerRunning, timeLeft, setTimeLeft, timerMode, setTimerMode, focusDuration, setFocusDuration, breakDuration, setBreakDuration }: any) => {
  const { todos, addTodo, toggleTodo, deleteTodo } = useStore();
  const [newTodo, setNewTodo] = useState('');
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (startCountdown !== null) {
      if (startCountdown > 0) {
        playSound('tick');
        const timer = setTimeout(() => setStartCountdown(startCountdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        playSound('start');
        setStartCountdown(null);
        setIsTimerRunning(true);
      }
    }
  }, [startCountdown, setIsTimerRunning]);

  const handleStartFocus = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false); playSound('click');
    } else {
      if (timerMode === 'break') { setTimerMode('focus'); setTimeLeft(focusDuration * 60); }
      setStartCountdown(3); 
    }
  };

  const handleDurationChange = (type: 'focus' | 'break', amount: number) => {
    if (isTimerRunning || startCountdown !== null) return; 
    if (type === 'focus') {
      const newVal = Math.max(1, Math.min(120, focusDuration + amount));
      setFocusDuration(newVal); if (timerMode === 'focus') setTimeLeft(newVal * 60);
    } else {
      const newVal = Math.max(1, Math.min(30, breakDuration + amount));
      setBreakDuration(newVal); if (timerMode === 'break') setTimeLeft(newVal * 60);
    }
  };

  const isBreak = timerMode === 'break';
  const ringColor = isBreak ? 'border-blue-500' : 'border-amber-500';
  const glowColor = isBreak ? 'border-blue-500/20' : 'border-amber-500/20';
  const btnColor = isBreak ? 'bg-blue-500' : theme.goldBg;

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto custom-scrollbar relative">
      {startCountdown !== null && (
        <div className="absolute inset-0 bg-zinc-950/90 z-20 flex flex-col items-center justify-center backdrop-blur-md animate-fade-in">
          <h2 className="text-8xl sm:text-[120px] font-black text-amber-500 mb-4 animate-bounce drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">{startCountdown}</h2>
          <p className="text-lg sm:text-xl font-bold text-white animate-pulse text-center px-4">Şimdi dersinize odaklanın!</p>
        </div>
      )}

      <div className="flex flex-col items-center p-4 sm:p-8 border-b border-zinc-800/50">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs sm:text-sm mb-4 sm:mb-6 ${isBreak ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {isBreak ? <Coffee size={16} /> : <Brain size={16} />}
          {isBreak ? 'Mola Zamanı' : 'Odaklanma Zamanı'}
        </div>

        {!isTimerRunning && startCountdown === null && (
          <div className="flex gap-4 sm:gap-8 mb-6 w-full justify-center">
            <div className="flex flex-col items-center">
              <span className={`text-[10px] sm:text-xs font-semibold mb-2 ${theme.textMuted}`}>ODAK (DK)</span>
              <div className={`flex items-center gap-2 sm:gap-3 bg-zinc-900/50 p-1 sm:p-1.5 rounded-full border ${theme.border}`}>
                <button onClick={() => handleDurationChange('focus', -1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">-</button>
                <span className="font-mono text-base sm:text-lg w-6 text-center">{focusDuration}</span>
                <button onClick={() => handleDurationChange('focus', 1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">+</button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-[10px] sm:text-xs font-semibold mb-2 ${theme.textMuted}`}>MOLA (DK)</span>
              <div className={`flex items-center gap-2 sm:gap-3 bg-zinc-900/50 p-1 sm:p-1.5 rounded-full border ${theme.border}`}>
                <button onClick={() => handleDurationChange('break', -1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">-</button>
                <span className="font-mono text-base sm:text-lg w-6 text-center">{breakDuration}</span>
                <button onClick={() => handleDurationChange('break', 1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">+</button>
              </div>
            </div>
          </div>
        )}

        <div className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-8 ${isTimerRunning ? ringColor : theme.border} flex items-center justify-center mb-6 sm:mb-8 transition-colors duration-1000 shadow-2xl`}>
          <div className={`absolute inset-0 rounded-full border-4 ${glowColor} m-2 transition-colors duration-1000`}></div>
          <h2 className="text-4xl sm:text-5xl font-mono font-bold tracking-tighter">{formatTime(timeLeft)}</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <button onClick={handleStartFocus} className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-zinc-950 flex items-center gap-2 transition-transform active:scale-95 text-sm sm:text-base ${isTimerRunning ? 'bg-zinc-100 text-zinc-900' : btnColor}`}>
            {isTimerRunning ? <Pause size={18} /> : <Play size={18} />} 
            {isTimerRunning ? 'DURAKLAT' : (isBreak ? 'MOLAYI ATLA' : 'ODAKLAN')}
          </button>
          <button onClick={() => { setIsTimerRunning(false); setTimeLeft(timerMode === 'focus' ? focusDuration * 60 : breakDuration * 60); playSound('click'); }} className={`p-3 sm:p-4 rounded-2xl border ${theme.border} ${theme.textMuted} hover:text-zinc-100 transition-colors`} title="Sıfırla">
            <Timer size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex-1 flex flex-col bg-black/10 min-h-[250px]">
        <h3 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4 flex items-center gap-2"><List size={16} className={theme.goldText}/> Günlük Görevler</h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 sm:pr-2 custom-scrollbar">
          {todos.length === 0 && <p className={`text-[10px] sm:text-xs ${theme.textMuted} text-center py-4`}>Hedeflerinizi belirleyin ve bitirdikçe işaretleyin.</p>}
          {todos.map(todo => (
            <div key={todo.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border ${theme.border} ${theme.inputBg} group transition-all ${todo.completed ? 'animate-hype-complete' : ''}`}>
              <button 
                onClick={() => { 
                  if(!todo.completed) {
                    toggleTodo(todo.id); playSound('success'); 
                    setTimeout(() => deleteTodo(todo.id), 800);
                  }
                }} 
                className={`${todo.completed ? 'text-amber-500' : theme.textMuted} hover:text-amber-400`}
              >
                {todo.completed ? <CheckSquare size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Square size={16} className="sm:w-[18px] sm:h-[18px]" />}
              </button>
              <p className={`flex-1 text-xs sm:text-sm ${todo.completed ? 'line-through text-amber-500/80 font-semibold' : theme.text}`}>{todo.text}</p>
              <button onClick={() => { deleteTodo(todo.id); playSound('click'); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 sm:p-1.5 rounded"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => {
          e.preventDefault(); if(!newTodo.trim()) return; addTodo(newTodo); setNewTodo(''); playSound('click');
        }} className="mt-3 sm:mt-4 relative">
          <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Yeni görev ekle..." className={`w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 rounded-xl ${theme.inputBg} border ${theme.border} text-xs sm:text-sm outline-none focus:border-amber-500`} />
          <button type="submit" className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-lg ${theme.goldBg} text-zinc-950`}><Plus size={16} /></button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN APPLICATION (App.tsx)
// ==========================================
export default function App() {
  const { 
    view, isDark, soundEnabled, notes, flashcards, todos, history, activeVideoId, playerConfig, 
    setPlayerConfig, setActiveVideoId, initData, addNote, deleteNote, addFlashcard, deleteFlashcard,
    addToHistory
  } = useStore();
  
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'pomodoro'>('notes');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  const [newNote, setNewNote] = useState<string>('');
  const [newCardQ, setNewCardQ] = useState<string>('');
  const [newCardA, setNewCardA] = useState<string>('');
  const noteInputRef = useRef<HTMLInputElement>(null); 
  
  const playerRef = useRef<any>(null); 
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  
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
    const sNotes = localStorage.getItem('bmo_notes');
    const sCards = localStorage.getItem('bmo_flashcards');
    const sTodos = localStorage.getItem('bmo_todos');
    const sHistory = localStorage.getItem('bmo_history');
    initData(
      sNotes ? JSON.parse(sNotes) : [], sCards ? JSON.parse(sCards) : [],
      sTodos ? JSON.parse(sTodos) : [], sHistory ? JSON.parse(sHistory) : []
    );
  }, [initData]);

  // Pomodoro Mantığı
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      if (timerMode === 'focus') {
        playSound('success'); setTimerMode('break'); setTimeLeft(breakDuration * 60);
        alert("Odaklanma süreniz bitti! Şimdi mola zamanı.");
      } else {
        playSound('break'); setTimerMode('focus'); setTimeLeft(focusDuration * 60); setIsTimerRunning(false);
        alert("Mola bitti! Yeni bir odaklanma seansına hazır mısınız?");
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, focusDuration, breakDuration]);

  // Klavye Kısayolları (Hotkeys)
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

  // F11 Tam Ekran (Focus Mode) Senkronizasyonu
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFocusMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // YouTube İlk Yükleme
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => { if (view === 'app') initMainPlayer(); initMusicPlayer(); };
    } else {
      if (view === 'app' && !playerRef.current) initMainPlayer();
      if (!musicPlayerRef.current) initMusicPlayer();
    }
  }, [view]);

  useEffect(() => {
    if (window.YT && playerRef.current?.loadVideoById && view === 'app') {
      if (playerConfig.pId) playerRef.current.loadPlaylist({ list: playerConfig.pId, listType: 'playlist' });
      else if (playerConfig.vId) playerRef.current.loadVideoById(playerConfig.vId);
    }
  }, [playerConfig, view]);

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
              if (data.title && e.data === window.YT.PlayerState.PLAYING) {
                addToHistory({ videoId: data.video_id, title: data.title, timestamp: Date.now() });
              }
            }
          }
        }
      }
    });
  };

  const initMusicPlayer = () => {
    if (musicPlayerRef.current?.destroy) musicPlayerRef.current.destroy();
    musicPlayerRef.current = new window.YT.Player('youtube-music-player', {
      host: 'https://www.youtube.com', videoId: activeStation.id,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' },
      events: {
        'onReady': (e: any) => e.target.setVolume(musicVolume),
        'onStateChange': (e: any) => {
          if (e.data === window.YT.PlayerState.PLAYING) setIsMusicPlaying(true);
          else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) setIsMusicPlaying(false);
        }
      }
    });
  };

  const handleDashboardUrlChange = (e: React.FormEvent) => {
    e.preventDefault();
    const vMatch = videoUrlInput.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
    const pMatch = videoUrlInput.match(/[?&]list=([^#&?]+)/);
    if (vMatch || pMatch) {
      setPlayerConfig({ vId: vMatch ? vMatch[1] : '', pId: pMatch ? pMatch[1] : null });
      playSound('success'); setVideoUrlInput('');
    }
  };

  const jumpToTime = (time: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(time, true); playerRef.current.playVideo(); playSound('click');
    }
  };

  const handleExportNotes = () => {
    const currentNotes = notes.filter(n => n.videoId === activeVideoId);
    if (currentNotes.length === 0) return alert("İndirilecek not bulunamadı.");
    let content = `BMO Learn - Video Notları\nVideo ID: ${activeVideoId}\nTarih: ${new Date().toLocaleDateString()}\n-----------------------------------\n\n`;
    currentNotes.forEach(n => { content += `[${formatTime(n.time)}] ${n.text}\n`; });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `BMOLearn_Notlar_${activeVideoId}.txt`;
    a.click(); URL.revokeObjectURL(url);
    playSound('success');
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

  // Gerçek Tam Ekran (F11) Modu Tetikleyicisi
  const toggleFocusMode = async () => {
    if (!isFocusMode) {
      setIsFocusMode(true);
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) { console.log("Tam ekrana geçilemedi:", e); }
      playSound('click');
    } else {
      setIsFocusMode(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (e) { console.log("Tam ekrandan çıkılamadı:", e); }
      playSound('click');
    }
  };

  const theme = {
    bg: isDark ? 'bg-zinc-950' : 'bg-zinc-50', panelBg: isDark ? 'bg-zinc-900' : 'bg-white',
    text: isDark ? 'text-zinc-100' : 'text-zinc-900', textMuted: isDark ? 'text-zinc-400' : 'text-zinc-500',
    border: isDark ? 'border-zinc-800' : 'border-zinc-200', goldText: 'text-amber-500',
    goldBg: 'bg-linear-to-r from-amber-400 to-amber-600', goldBgSolid: 'bg-amber-500',
    goldBorder: 'border-amber-500/30', inputBg: isDark ? 'bg-zinc-950/50' : 'bg-zinc-100/50',
  };

  const currentNotes = notes.filter(n => n.videoId === activeVideoId);
  const currentCards = flashcards.filter(c => c.videoId === activeVideoId);

  return (
    <>
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

      {view === 'landing' && <LandingPage theme={theme} />}

      {view === 'app' && (
        <div className={`min-h-screen flex flex-col ${theme.bg} ${theme.text} transition-colors duration-500 animate-fade-in relative`}>
          
          <HistoryModal theme={theme} showHistory={showHistory} setShowHistory={setShowHistory} />

          {/* NAVBAR */}
          {!isFocusMode && (
            <header className={`flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b ${theme.border} ${theme.panelBg} sticky top-0 z-40 backdrop-blur-xl bg-opacity-80 gap-3`}>
              <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={() => { useStore.getState().setView('landing'); playSound('click'); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">BMO <span className={theme.goldText}>Learn</span></h1>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className={`hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full ${theme.inputBg} border ${theme.border} text-xs font-medium mr-2`}>
                  <span className="flex items-center gap-1.5 text-amber-500"><Bookmark size={14}/> {notes.length}</span>
                  <span className={`w-1 h-1 rounded-full ${theme.textMuted}`}></span>
                  <span className="flex items-center gap-1.5 text-blue-400"><BookOpen size={14}/> {flashcards.length}</span>
                </div>
                
                <button onClick={() => { setShowHistory(true); playSound('click'); }} className={`p-2 sm:p-2.5 rounded-full hover:bg-zinc-500/10 ${theme.textMuted} transition-colors`} title="Geçmiş">
                  <History size={18} />
                </button>
                <div className={`hidden sm:block w-px h-5 ${theme.border} mx-1`}></div>

                <button onClick={() => { setShowMusicWidget(!showMusicWidget); playSound('click'); }} className={`p-2 sm:p-2.5 rounded-full transition-all ${showMusicWidget ? 'bg-amber-500/20 text-amber-500' : `hover:bg-zinc-500/10 ${theme.textMuted}`}`}>
                  {isMusicPlaying ? <Radio className="animate-pulse" size={18} /> : <Music size={18} />}
                </button>
                <button onClick={() => { useStore.getState().toggleSound(); playSound('click'); }} className={`hidden sm:flex p-2.5 rounded-full hover:bg-zinc-500/10 ${theme.textMuted}`}>
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button onClick={() => { useStore.getState().toggleDark(); playSound('click'); }} className={`p-2 sm:p-2.5 rounded-full hover:bg-zinc-500/10 ${theme.textMuted}`}>
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </header>
          )}

          <RadioWidget 
            theme={theme} showMusicWidget={showMusicWidget} setShowMusicWidget={setShowMusicWidget}
            activeStation={activeStation} isMusicPlaying={isMusicPlaying} musicVolume={musicVolume}
            setMusicVolume={setMusicVolume} toggleRadioPlay={toggleRadioPlay} changeStation={changeStation}
          />

          {/* MAIN CONTENT AREA */}
          <main className={`flex-1 flex flex-col lg:flex-row p-3 sm:p-4 lg:p-6 gap-4 sm:gap-6 ${isFocusMode ? 'p-0 gap-0' : 'max-w-[1600px] mx-auto w-full'}`}>
            
            {/* SOL TARAFI: VİDEO */}
            <div className={`flex flex-col ${isFocusMode ? 'w-full lg:w-3/4 h-[50vh] sm:h-[60vh] lg:h-screen' : 'w-full lg:w-[65%]'}`}>
              {!isFocusMode && (
                <form onSubmit={handleDashboardUrlChange} className={`flex gap-2 sm:gap-3 mb-4 sm:mb-5 p-1.5 sm:p-2 pl-4 sm:pl-5 rounded-2xl ${theme.panelBg} border ${theme.border} shadow-sm focus-within:border-amber-500/50 transition-colors`}>
                  <input type="text" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="Yeni bir YouTube Linki yapıştırın..." className={`flex-1 bg-transparent border-none outline-none ${theme.text} text-xs sm:text-sm font-medium`} />
                  <button type="submit" className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-zinc-950 ${theme.goldBg} font-bold text-xs sm:text-sm hover:scale-105 transition-transform active:scale-95`}>Değiştir</button>
                </form>
              )}

              <div className={`relative w-full aspect-video bg-black shadow-2xl transition-all duration-500 overflow-hidden ${isFocusMode ? 'rounded-none h-full' : 'rounded-2xl sm:rounded-3xl border border-zinc-800/50'}`}>
                <div id="youtube-main-player" className="absolute top-0 left-0 w-full h-full"></div>
                
                {isFocusMode && (
                  <button onClick={toggleFocusMode} className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 p-2 sm:p-3 rounded-full bg-black/50 text-white hover:bg-amber-500 transition-all backdrop-blur-md border border-white/10" title="Odak Modundan Çık (Esc)">
                    <Minimize size={18} className="sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* SAĞ TARAF: ARAÇLAR (Mobil ve Tablette yüksekliği otomatik veya esnek yapar) */}
            <div className={`flex flex-col ${isFocusMode ? 'w-full lg:w-1/4 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-900 flex-1' : 'w-full lg:w-[35%] h-[500px] md:h-[600px] lg:h-auto'} ${theme.panelBg} rounded-2xl sm:rounded-3xl border ${theme.border} shadow-xl overflow-hidden transition-all duration-500`}>
              
              <div className={`flex border-b ${theme.border}`}>
                <button onClick={() => { setActiveTab('notes'); playSound('click'); }} className={`flex-1 py-3 sm:py-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${activeTab === 'notes' ? `${theme.goldText} border-b-2 border-amber-500 bg-amber-500/5` : theme.textMuted}`}><List size={16} /> Notlar</button>
                <button onClick={() => { setActiveTab('flashcards'); playSound('click'); }} className={`flex-1 py-3 sm:py-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${activeTab === 'flashcards' ? `${theme.goldText} border-b-2 border-amber-500 bg-amber-500/5` : theme.textMuted}`}><BookOpen size={16} /> Kartlar</button>
                <button onClick={() => { setActiveTab('pomodoro'); playSound('click'); }} className={`flex-1 py-3 sm:py-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${activeTab === 'pomodoro' ? `${theme.goldText} border-b-2 border-amber-500 bg-amber-500/5` : theme.textMuted}`}><Timer size={16} /> Odak</button>
                
                {!isFocusMode && (
                   <button onClick={toggleFocusMode} className={`px-3 sm:px-4 flex items-center justify-center transition-all ${theme.textMuted} hover:text-amber-500 border-l ${theme.border}`} title="Genişlet (Odak Modu - F11)"><Maximize size={16} /></button>
                )}
              </div>

              {/* SEKME: NOTLAR */}
              {activeTab === 'notes' && (
                <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in relative">
                  {currentNotes.length > 0 && (
                    <button onClick={handleExportNotes} className={`absolute top-4 right-4 z-10 p-2 rounded-lg bg-zinc-800/50 hover:bg-amber-500 hover:text-black text-zinc-400 transition-all border border-zinc-700/50 backdrop-blur-sm`} title="Notları İndir (TXT)">
                      <Download size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-12 space-y-3 custom-scrollbar">
                    {currentNotes.length === 0 && (
                      <div className={`text-center py-10 sm:py-16 ${theme.textMuted} flex flex-col items-center gap-4`}><div className={`p-3 sm:p-4 rounded-full ${theme.inputBg}`}><Bookmark size={24} className="sm:w-8 sm:h-8 opacity-50" /></div><p className="text-xs sm:text-sm">Bu video için henüz not yok.</p></div>
                    )}
                    {currentNotes.map(note => (
                      <div key={note.id} className={`group flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl ${theme.inputBg} border border-transparent hover:${theme.border} transition-all`}>
                        <button onClick={() => jumpToTime(note.time)} className={`mt-0.5 px-2 sm:px-2.5 py-1 h-fit rounded-lg bg-amber-500/10 ${theme.goldText} text-[10px] sm:text-xs font-mono font-bold hover:bg-amber-500/20`}>
                          {formatTime(note.time)}
                        </button>
                        <p className="flex-1 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        <button onClick={() => { deleteNote(note.id); playSound('click'); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className={`p-4 sm:p-5 border-t ${theme.border}`}>
                    <form onSubmit={(e) => {
                      e.preventDefault(); if(!newNote.trim()) return;
                      const time = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
                      addNote({ id: Date.now(), videoId: activeVideoId, text: newNote, time });
                      setNewNote(''); playSound('success');
                    }} className="relative">
                      <input ref={noteInputRef} type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Zaman damgalı not al... (Kısayollar: Alt+N)" className={`w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-2xl ${theme.inputBg} border ${theme.border} focus:border-amber-500 outline-none text-xs sm:text-sm`} />
                      <button type="submit" className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-xl ${theme.goldBg} text-zinc-950`}><Plus size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                    </form>
                  </div>
                </div>
              )}

              {/* SEKME: FLASHCARD */}
              {activeTab === 'flashcards' && (
                <div className="flex flex-col flex-1 h-full overflow-hidden animate-fade-in">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                    {currentCards.length === 0 && (
                      <div className={`text-center py-10 sm:py-16 ${theme.textMuted} flex flex-col items-center gap-4`}><div className={`p-3 sm:p-4 rounded-full ${theme.inputBg}`}><BookOpen size={24} className="sm:w-8 sm:h-8 opacity-50" /></div><p className="text-xs sm:text-sm">Flashcard'lar oluşturun.</p></div>
                    )}
                    {currentCards.map(card => (
                      <div key={card.id} className="relative group perspective-1000 h-24 sm:h-28 cursor-pointer" onClick={(e) => { e.currentTarget.classList.toggle('flip-card'); playSound('click'); }}>
                        <button onClick={(e) => { e.stopPropagation(); deleteFlashcard(card.id); playSound('click'); }} className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                        <div className="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner">
                          <div className={`absolute w-full h-full backface-hidden rounded-2xl border ${theme.border} ${theme.inputBg} p-4 flex items-center justify-center text-center`}><p className="font-medium text-xs sm:text-sm">{card.question}</p></div>
                          <div className={`absolute w-full h-full backface-hidden rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-4 flex items-center justify-center text-center rotate-y-180`}><p className={`font-bold text-xs sm:text-sm ${theme.goldText}`}>{card.answer}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`p-4 sm:p-5 border-t ${theme.border} space-y-2 sm:space-y-3`}>
                    <input type="text" value={newCardQ} onChange={e => setNewCardQ(e.target.value)} placeholder="Soru" className={`w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl ${theme.inputBg} border ${theme.border} outline-none text-xs sm:text-sm`} />
                    <div className="flex gap-2">
                      <input type="text" value={newCardA} onChange={e => setNewCardA(e.target.value)} placeholder="Cevap" className={`flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl ${theme.inputBg} border ${theme.border} outline-none text-xs sm:text-sm`} onKeyDown={e => {
                        if(e.key === 'Enter' && newCardQ && newCardA) {
                          addFlashcard({ id: Date.now(), videoId: activeVideoId, question: newCardQ, answer: newCardA });
                          setNewCardQ(''); setNewCardA(''); playSound('success');
                        }
                      }}/>
                      <button onClick={() => {
                        if(newCardQ && newCardA) {
                          addFlashcard({ id: Date.now(), videoId: activeVideoId, question: newCardQ, answer: newCardA });
                          setNewCardQ(''); setNewCardA(''); playSound('success');
                        }
                      }} className={`px-4 sm:px-5 rounded-2xl ${theme.goldBgSolid} text-zinc-950 font-bold text-xs sm:text-sm`}>Ekle</button>
                    </div>
                  </div>
                </div>
              )}

              {/* SEKME: POMODORO */}
              {activeTab === 'pomodoro' && (
                <PomodoroTab 
                  theme={theme} 
                  isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} 
                  timeLeft={timeLeft} setTimeLeft={setTimeLeft}
                  timerMode={timerMode} setTimerMode={setTimerMode}
                  focusDuration={focusDuration} setFocusDuration={setFocusDuration}
                  breakDuration={breakDuration} setBreakDuration={setBreakDuration}
                />
              )}

            </div>
          </main>
        </div>
      )}
    </>
  );
}