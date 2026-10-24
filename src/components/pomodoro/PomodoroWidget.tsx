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
      className={`fixed top-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/10 backdrop-blur-xl z-50 overflow-hidden flex flex-col animate-scale-in origin-top-right`}
    >
      <div
        className={`px-4 sm:px-5 py-3 flex justify-between items-center border-b border-[var(--border)] bg-[var(--card-muted)]`}
      >
        <span className="text-sm font-bold flex items-center gap-2 text-[var(--text)]">
          <Timer size={16} className="text-[#FF8C00]" /> Odak ve Görevler
        </span>
        <button
          onClick={() => setShowPomodoroWidget(false)}
          className={`text-[var(--text-muted)] hover:text-[var(--text)] transition-colors`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[75vh] custom-scrollbar pb-4">
        <div className="flex flex-col items-center p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--bg)]">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[10px] sm:text-xs mb-4 ${timerMode === 'break' ? 'bg-[var(--info-muted)] text-[var(--info)]' : 'bg-[var(--primary-muted)] text-[#FF8C00] shadow-sm'}`}
          >
            {timerMode === 'break' ? <Coffee size={14} /> : <Brain size={14} />}
            {timerMode === 'break' ? 'Mola Zamanı' : 'Odaklanma Zamanı'}
          </div>

          {!isTimerRunning && (
            <div className="flex gap-4 mb-4 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-[var(--text-muted)]`}>ODAK (DK)</span>
                <div
                  className={`flex items-center gap-2 bg-[var(--card-solid)] p-1 rounded-full border border-[var(--border)]`}
                >
                  <button
                    onClick={() => {
                      if (focusDuration > 1) {
                        setFocusDuration(focusDuration - 1);
                        if (timerMode === 'focus') setTimeLeft((focusDuration - 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm w-6 text-center text-[var(--text)]">{focusDuration}</span>
                  <button
                    onClick={() => {
                      if (focusDuration < 120) {
                        setFocusDuration(focusDuration + 1);
                        if (timerMode === 'focus') setTimeLeft((focusDuration + 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-semibold mb-1 text-[var(--text-muted)]`}>MOLA (DK)</span>
                <div
                  className={`flex items-center gap-2 bg-[var(--card-solid)] p-1 rounded-full border border-[var(--border)]`}
                >
                  <button
                    onClick={() => {
                      if (breakDuration > 1) {
                        setBreakDuration(breakDuration - 1);
                        if (timerMode === 'break') setTimeLeft((breakDuration - 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm w-6 text-center text-[var(--text)]">{breakDuration}</span>
                  <button
                    onClick={() => {
                      if (breakDuration < 30) {
                        setBreakDuration(breakDuration + 1);
                        if (timerMode === 'break') setTimeLeft((breakDuration + 1) * 60);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-[var(--hover-bg)] hover:bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text)]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-8 ${isTimerRunning ? (timerMode === 'break' ? 'border-[var(--info)]' : 'border-[#FF8C00]') : 'border-[var(--border)]'} flex items-center justify-center mb-5 transition-colors duration-1000 shadow-xl bg-[var(--card)]`}
          >
            <div
              className={`absolute inset-0 rounded-full border-4 ${timerMode === 'break' ? 'border-[var(--info-muted)]' : 'border-[var(--primary-muted)]'} m-1.5 transition-colors duration-1000`}
            ></div>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tighter drop-shadow-sm text-[var(--text)]">
              {formatTime(timeLeft)}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold flex items-center gap-2 transition-transform active:scale-95 text-xs sm:text-sm shadow-md ${isTimerRunning ? 'bg-[var(--border)] text-[var(--text)]' : timerMode === 'break' ? 'bg-[var(--info)] text-white' : 'bg-[#FF8C00] text-white'}`}
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
                className="p-2.5 sm:p-3 rounded-2xl border border-[var(--border)] text-[#FF8C00] hover:bg-[var(--primary-muted)] transition-colors active:scale-95 bg-[var(--card)]"
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
              className={`p-2.5 sm:p-3 rounded-2xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95 bg-[var(--card)]`}
              title="Sıfırla"
            >
              <Timer size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col bg-[var(--card)]">
          <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-[var(--text)]">
            <List size={14} className="text-[#FF8C00]" /> Günlük Görevler
          </h3>
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className={`text-[10px] text-[var(--text-muted)] text-center py-2`}>
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
                  className={`flex items-center gap-2 p-2 rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] group shadow-sm ${deletingId === todo.id ? 'animate-todo-complete' : 'transition-all'}`}
                >
                  <button
                    onClick={() => {
                      if (deletingId !== todo.id) {
                        toggleTodo(todo.id);
                        setDeletingId(todo.id);
                      }
                    }}
                    className={`${todo.completed || deletingId === todo.id ? 'text-[#FF8C00]' : 'text-[var(--text-muted)]'} hover:text-[#ea580c] transition-colors`}
                  >
                    {todo.completed || deletingId === todo.id ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                  <p
                    className={`flex-1 text-xs ${todo.completed || deletingId === todo.id ? 'line-through text-[#FF8C00]/80 font-semibold' : 'text-[var(--text)]'}`}
                  >
                    {todo.text}
                  </p>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--danger)] hover:bg-[var(--danger-muted)] p-1 rounded transition-colors"
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
              className={`w-full pl-3 pr-8 py-2.5 rounded-2xl bg-[var(--card-solid)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[#FF8C00] transition-colors`}
            />
            <button
              type="submit"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-[#FF8C00] text-white shadow-md active:scale-95 transition-transform`}
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
