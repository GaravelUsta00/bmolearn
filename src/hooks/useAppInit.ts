import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { NotificationManager } from '@/lib/notifications';

export const useAppInit = () => {
  const { initData } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const sNotes = localStorage.getItem('bmo_notes');
    const sCards = localStorage.getItem('bmo_flashcards');
    const sQuiz = localStorage.getItem('bmo_quiz');
    const sSummaries = localStorage.getItem('bmo_summaries');
    const sTodos = localStorage.getItem('bmo_todos');
    const sHistory = localStorage.getItem('bmo_history');
    const sPomodoro = localStorage.getItem('bmo_pomodoro');
    const sProgress = localStorage.getItem('bmo_progress');

    // Tema <head>'deki script tarafından ilk boyamadan önce uygulandı (constants/theme.ts);
    // burada yalnızca store senkronlanır, seçim kullanıcı değiştirene kadar kaydedilmez.
    useStore.setState({ theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' });

    initData({
      notes: sNotes ? JSON.parse(sNotes) : [],
      flashcards: sCards ? JSON.parse(sCards) : [],
      quiz: sQuiz ? JSON.parse(sQuiz) : [],
      summaries: sSummaries ? JSON.parse(sSummaries) : {},
      todos: sTodos ? JSON.parse(sTodos) : [],
      history: sHistory ? JSON.parse(sHistory) : [],
      pomodoroHistory: sPomodoro ? JSON.parse(sPomodoro) : {},
      videoProgress: sProgress ? JSON.parse(sProgress) : {},
    });

    NotificationManager.requestPermission();
    setIsInitializing(false);
  }, [initData]);

  return isInitializing;
};
