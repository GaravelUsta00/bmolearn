import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { NotificationManager } from '@/lib/notifications';

export const usePomodoroTimer = () => {
  const { addPomodoroRecord } = useStore();

  const [pomodoroToast, setPomodoroToast] = useState<{
    message: string;
    type: 'focus' | 'break' | null;
    isVisible: boolean;
  }>({ message: '', type: null, isVisible: false });

  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const showToastNotification = (msg: string, type: 'focus' | 'break') => {
    setPomodoroToast({ message: msg, type, isVisible: true });
    setTimeout(() => setPomodoroToast((prev) => ({ ...prev, isVisible: false })), 5000);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      if (timerMode === 'focus') {
        addPomodoroRecord();
        setTimerMode('break');
        setTimeLeft(breakDuration * 60);
        setIsTimerRunning(false);
        NotificationManager.send('Odaklanma Bitti!', 'Harika çalıştın. Şimdi kısa bir mola zamanı.');
        showToastNotification('Pomodoro bitti, dinlenme zamanı.', 'break');
      } else {
        setTimerMode('focus');
        setTimeLeft(focusDuration * 60);
        setIsTimerRunning(false);
        NotificationManager.send('Mola Bitti!', 'Enerjini topladıysan yeniden odaklanma zamanı.');
        showToastNotification('Mola bitti, odaklanma zamanı.', 'focus');
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, focusDuration, breakDuration, addPomodoroRecord]);

  return {
    pomodoroToast,
    setPomodoroToast,
    focusDuration,
    setFocusDuration,
    breakDuration,
    setBreakDuration,
    timerMode,
    setTimerMode,
    timeLeft,
    setTimeLeft,
    isTimerRunning,
    setIsTimerRunning,
  };
};

export type PomodoroState = ReturnType<typeof usePomodoroTimer>;
