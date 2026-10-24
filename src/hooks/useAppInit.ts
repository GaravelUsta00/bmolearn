import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { NotificationManager } from '@/lib/notifications';

export const useAppInit = () => {
  const { initData, setTheme } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

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

  return isInitializing;
};
