'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TimerReadout } from '@/components/pomodoro/TimerReadout';
import { PomodoroHeatmap } from '@/components/pomodoro/PomodoroHeatmap';
import { DurationControls, usePrimaryTimerAction } from '@/components/pomodoro/DurationControls';
import type { Id, Setter } from '@/types';

// Tamamlanan görev bu süre "tamamlandı" görünüp listeden kalkar (eski akış; animasyona bağlı değil).
const COMPLETE_DELAY_MS = 900;

interface PomodoroWidgetProps {
  showPomodoroWidget: boolean;
  setShowPomodoroWidget: Setter<boolean>;
}

export const PomodoroWidget = ({ showPomodoroWidget, setShowPomodoroWidget }: PomodoroWidgetProps) => {
  const todos = useStore((s) => s.todos);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const addTodo = useStore((s) => s.addTodo);
  const mode = useStore((s) => s.timerMode);
  const status = useStore((s) => s.timerStatus);
  const resetTimer = useStore((s) => s.resetTimer);
  const skipBreak = useStore((s) => s.skipBreak);
  const primary = usePrimaryTimerAction();
  const [completing, setCompleting] = useState<Id[]>([]);
  const timers = useRef(new Map<Id, number>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  if (!showPomodoroWidget) return null;

  const complete = (id: Id) => {
    if (timers.current.has(id)) return;
    toggleTodo(id);
    setCompleting((c) => [...c, id]);
    timers.current.set(
      id,
      window.setTimeout(() => {
        timers.current.delete(id);
        setCompleting((c) => c.filter((x) => x !== id));
        deleteTodo(id);
      }, COMPLETE_DELAY_MS)
    );
  };

  const isBreak = mode === 'break';

  return (
    <section
      aria-label="Odak ve görevler"
      className="fixed right-4 top-20 z-50 flex max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] animate-fade flex-col overflow-hidden rounded-sm border border-rule bg-page text-ink shadow-page sm:right-6 sm:w-80 md:w-96"
    >
      <header className="flex items-center justify-between border-b border-rule py-1 pl-4 pr-1">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Odak ve görevler</h2>
        <button
          type="button"
          onClick={() => setShowPomodoroWidget(false)}
          aria-label="Kapat"
          className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        <div className="border-b border-rule px-4 pb-4 pt-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em]">
            <span className={isBreak ? 'text-ok' : 'text-ribbon'}>{isBreak ? 'Mola' : 'Odak'}</span>
            <span className="text-mute">
              {' · '}
              {status === 'running' ? 'sürüyor' : status === 'paused' ? 'duraklatıldı' : 'hazır'}
            </span>
          </p>
          <h3 className="mt-1">
            <TimerReadout className="text-6xl leading-none tracking-tight text-ink" />
          </h3>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={primary.onClick}
              className={`min-h-11 rounded-sm px-5 text-sm ${primary.running ? 'border border-mute text-ink hover:border-ink' : 'bg-ink text-page hover:opacity-90'}`}
            >
              {primary.label}
            </button>
            <button type="button" onClick={resetTimer} className="min-h-11 px-2 text-sm text-mute hover:text-ink">
              Sıfırla
            </button>
            {isBreak && (
              <button type="button" onClick={skipBreak} className="min-h-11 px-2 text-sm text-mute hover:text-ink">
                Molayı atla
              </button>
            )}
          </div>
          <div className="mt-4 border-t border-rule pt-3">
            <DurationControls />
          </div>
        </div>

        <div className="px-4 py-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Günlük görevler</h3>
          {todos.length === 0 ? (
            <p className="mt-2 text-sm text-mute">Hedeflerini yaz, bitirdikçe işaretle.</p>
          ) : (
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {todos.map((todo) => {
                const done = todo.completed || completing.includes(todo.id);
                return (
                  <li key={todo.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      aria-label={`${todo.text}: tamamlandı olarak işaretle`}
                      onClick={() => complete(todo.id)}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center"
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${done ? 'border-ok bg-ok text-page' : 'border-mute'}`}
                      >
                        {done && <Check size={12} strokeWidth={2} />}
                      </span>
                    </button>
                    <span className={`min-w-0 flex-1 break-words text-sm ${done ? 'text-mute line-through' : ''}`}>
                      {todo.text}
                      {done && <span className="sr-only"> (tamamlandı)</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      aria-label={`${todo.text}: sil`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-mute hover:text-ribbon"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const txt = fd.get('todoInput')?.toString();
              if (!txt || !txt.trim()) return;
              addTodo(txt);
              e.currentTarget.reset();
            }}
            className="mt-3 flex items-end gap-3"
          >
            <label className="flex-1">
              <span className="sr-only">Yeni görev</span>
              <input
                name="todoInput"
                type="text"
                placeholder="Yeni görev ekle…"
                className="w-full border-0 border-b border-mute bg-transparent pb-1.5 text-sm text-ink placeholder:text-mute focus:border-ribbon focus:outline-none"
              />
            </label>
            <button type="submit" className="min-h-11 rounded-sm border border-mute px-4 text-sm hover:border-ink">
              Ekle
            </button>
          </form>

          <PomodoroHeatmap />
        </div>
      </div>
    </section>
  );
};
