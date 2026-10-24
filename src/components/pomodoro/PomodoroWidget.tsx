'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  List,
  X,
  Timer,
  Pause,
  Play,
  Coffee,
  Brain,
  CheckSquare,
  Square,
  SkipForward,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatTime } from '@/lib/format';
import { PomodoroHeatmap } from '@/components/pomodoro/PomodoroHeatmap';
import type { Setter, TimerMode } from '@/types';

interface PomodoroWidgetProps {
  showPomodoroWidget: boolean;
  setShowPomodoroWidget: Setter<boolean>;
  focusDuration: number;
  setFocusDuration: Setter<number>;
  breakDuration: number;
  setBreakDuration: Setter<number>;
  timerMode: TimerMode;
  setTimerMode: Setter<TimerMode>;
  timeLeft: number;
  setTimeLeft: Setter<number>;
  isTimerRunning: boolean;
  setIsTimerRunning: Setter<boolean>;
}

export const PomodoroWidget = ({
  showPomodoroWidget,
  setShowPomodoroWidget,
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
}: PomodoroWidgetProps) => {
  const { todos, toggleTodo, deleteTodo, addTodo } = useStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!showPomodoroWidget) return null;
  return (
    <div
      className={`fixed top-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-sm border border-rule bg-page shadow-page z-50 overflow-hidden flex flex-col animate-fade origin-top-right`}
    >
      <div className={`px-4 sm:px-5 py-3 flex justify-between items-center border-b border-rule bg-page-2`}>
        <span className="text-sm font-bold flex items-center gap-2 text-ink">
          <Timer size={16} className="text-ribbon" /> Odak ve Görevler
        </span>
        <button onClick={() => setShowPomodoroWidget(false)} className={`text-mute hover:text-ink transition-colors`}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[75vh] custom-scrollbar pb-4">
        <div className="flex flex-col items-center p-4 sm:p-6 border-b border-rule bg-paper">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[10px] sm:text-xs mb-4 ${timerMode === 'break' ? 'bg-ink/5 text-ink' : 'bg-ribbon/10 text-ribbon shadow-page'}`}
          >
            {timerMode === 'break' ? <Coffee size={14} /> : <Brain size={14} />}
            {timerMode === 'break' ? 'Mola Zamanı' : 'Odaklanma Zamanı'}
          </div>

          {!isTimerRunning && (
            <div className="flex gap-4 mb-4 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-mute`}>ODAK (DK)</span>
                <div className={`flex items-center gap-2 bg-page p-1 rounded-full border border-rule`}>
                  <button
                    onClick={() => {
                      if (focusDuration > 1) {
                        setFocusDuration(focusDuration - 1);
                        if (timerMode === 'focus') setTimeLeft((focusDuration - 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-ink/5 hover:bg-rule flex items-center justify-center text-xs text-ink"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm w-6 text-center text-ink">{focusDuration}</span>
                  <button
                    onClick={() => {
                      if (focusDuration < 120) {
                        setFocusDuration(focusDuration + 1);
                        if (timerMode === 'focus') setTimeLeft((focusDuration + 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-ink/5 hover:bg-rule flex items-center justify-center text-xs text-ink"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-mute`}>MOLA (DK)</span>
                <div className={`flex items-center gap-2 bg-page p-1 rounded-full border border-rule`}>
                  <button
                    onClick={() => {
                      if (breakDuration > 1) {
                        setBreakDuration(breakDuration - 1);
                        if (timerMode === 'break') setTimeLeft((breakDuration - 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-ink/5 hover:bg-rule flex items-center justify-center text-xs text-ink"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm w-6 text-center text-ink">{breakDuration}</span>
                  <button
                    onClick={() => {
                      if (breakDuration < 30) {
                        setBreakDuration(breakDuration + 1);
                        if (timerMode === 'break') setTimeLeft((breakDuration + 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-ink/5 hover:bg-rule flex items-center justify-center text-xs text-ink"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-8 ${isTimerRunning ? (timerMode === 'break' ? 'border-ink' : 'border-ribbon') : 'border-rule'} flex items-center justify-center mb-5 transition-colors duration-1000 shadow-page bg-page`}
          >
            <div
              className={`absolute inset-0 rounded-full border-4 ${timerMode === 'break' ? 'border-ink/5' : 'border-ribbon/10'} m-1.5 transition-colors duration-1000`}
            ></div>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tighter text-ink">
              {formatTime(timeLeft)}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-sm font-bold flex items-center gap-2 transition-transform text-xs sm:text-sm ${isTimerRunning ? 'bg-rule text-ink' : timerMode === 'break' ? 'bg-ink text-page' : 'bg-ribbon text-page'}`}
            >
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
              {isTimerRunning ? 'DURAKLAT' : timerMode === 'break' ? 'MOLAYI BAŞLAT' : 'ODAKLAN'}
            </button>
            {timerMode === 'break' && (
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerMode('focus');
                  setTimeLeft(focusDuration * 60);
                }}
                className="p-2.5 sm:p-3 rounded-sm border border-rule text-ribbon hover:bg-ribbon/10 transition-colors bg-page"
                title="Molayı Atla ve Odaklan"
              >
                <SkipForward size={16} />
              </button>
            )}
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimeLeft(timerMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
              }}
              className={`p-2.5 sm:p-3 rounded-sm border border-rule text-mute hover:text-ink transition-colors bg-page`}
              title="Sıfırla"
            >
              <Timer size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col bg-page">
          <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-ink">
            <List size={14} className="text-ribbon" /> Günlük Görevler
          </h3>
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className={`text-[10px] text-mute text-center py-2`}>
                Hedeflerinizi belirleyin ve bitirdikçe işaretleyin.
              </p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  onAnimationEnd={() => {
                    if (deletingId === todo.id) {
                      deleteTodo(todo.id);
                      setDeletingId(null);
                    }
                  }}
                  className={`flex items-center gap-2 p-2 rounded-sm border border-rule bg-page group shadow-page ${deletingId === todo.id ? 'animate-todo-complete' : 'transition-all'}`}
                >
                  <button
                    onClick={() => {
                      if (deletingId !== todo.id) {
                        toggleTodo(todo.id);
                        setDeletingId(todo.id);
                      }
                    }}
                    className={`${todo.completed || deletingId === todo.id ? 'text-ribbon' : 'text-mute'} hover:text-ribbon/90 transition-colors`}
                  >
                    {todo.completed || deletingId === todo.id ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                  <p
                    className={`flex-1 text-xs ${todo.completed || deletingId === todo.id ? 'line-through text-ribbon/80 font-semibold' : 'text-ink'}`}
                  >
                    {todo.text}
                  </p>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-ribbon hover:bg-ribbon/10 p-1 rounded-sm transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const txt = fd.get('todoInput')?.toString();
              if (!txt || !txt.trim()) return;
              addTodo(txt);
              e.currentTarget.reset();
            }}
            className="mt-3 relative"
          >
            <input
              name="todoInput"
              type="text"
              placeholder="Yeni görev ekle..."
              className={`w-full pl-3 pr-8 py-2.5 rounded-sm bg-page border border-rule text-xs text-ink outline-none focus:border-ribbon transition-colors`}
            />
            <button
              type="submit"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-sm bg-ribbon text-page transition-transform`}
            >
              <Plus size={14} />
            </button>
          </form>
          <PomodoroHeatmap />
        </div>
      </div>
    </div>
  );
};
