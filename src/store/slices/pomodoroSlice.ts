import { localDateKey } from '@/lib/date';
import { NotificationManager } from '@/lib/notifications';
import type { AppState, PomodoroSlice, SliceCreator } from '@/store/types';

export const FOCUS_RANGE = { min: 1, max: 120 } as const;
export const BREAK_RANGE = { min: 1, max: 30 } as const;
const MINUTE = 60_000;

const clamp = (v: number, { min, max }: { min: number; max: number }) => Math.min(max, Math.max(min, Math.round(v)));
const phaseMs = (s: AppState, mode = s.timerMode) =>
  (mode === 'focus' ? s.pomodoroSettings.focusMinutes : s.pomodoroSettings.breakMinutes) * MINUTE;

/** Çalışan zamanlayıcının o anki kalan süresi (ms). */
export const remainingMs = (s: Pick<AppState, 'timerStatus' | 'timerEndsAt' | 'timerRemainingMs'>, now = Date.now()) =>
  s.timerStatus === 'running' && s.timerEndsAt !== null ? Math.max(0, s.timerEndsAt - now) : s.timerRemainingMs;

export const createPomodoroSlice: SliceCreator<PomodoroSlice> = (set, get) => ({
  pomodoroHistory: {},
  pomodoroSettings: { focusMinutes: 25, breakMinutes: 5 },

  timerMode: 'focus',
  timerStatus: 'idle',
  timerEndsAt: null,
  timerRemainingMs: 25 * MINUTE,
  pomodoroToast: { message: '', type: null, visible: false },

  // Yerel güne yazılır (B4); `at` fazın bittiği an (arka planda geç fark edilse de doğru gün).
  addPomodoroRecord: (at = Date.now()) =>
    set((state) => {
      const day = localDateKey(at);
      return { pomodoroHistory: { ...state.pomodoroHistory, [day]: (state.pomodoroHistory[day] || 0) + 1 } };
    }),

  startTimer: () => {
    // İzin, kullanıcının ilk "Odaklan" tıklamasında istenir (B5); tıklama içinde çağrılır.
    NotificationManager.requestPermission();
    set((s) =>
      s.timerStatus === 'running' ? s : { timerStatus: 'running', timerEndsAt: Date.now() + s.timerRemainingMs }
    );
  },
  pauseTimer: () =>
    set((s) =>
      s.timerStatus !== 'running' ? s : { timerStatus: 'paused', timerEndsAt: null, timerRemainingMs: remainingMs(s) }
    ),
  resetTimer: () => set((s) => ({ timerStatus: 'idle', timerEndsAt: null, timerRemainingMs: phaseMs(s) })),
  skipBreak: () =>
    set((s) => ({ timerMode: 'focus', timerStatus: 'idle', timerEndsAt: null, timerRemainingMs: phaseMs(s, 'focus') })),

  // Süreler çalışırken değiştirilemez (eski davranış); duruyorken o fazın kalan süresini sıfırlar.
  setFocusMinutes: (minutes) =>
    set((s) => {
      if (s.timerStatus === 'running') return s;
      const focusMinutes = clamp(minutes, FOCUS_RANGE);
      return {
        pomodoroSettings: { ...s.pomodoroSettings, focusMinutes },
        ...(s.timerMode === 'focus' ? { timerRemainingMs: focusMinutes * MINUTE } : {}),
      };
    }),
  setBreakMinutes: (minutes) =>
    set((s) => {
      if (s.timerStatus === 'running') return s;
      const breakMinutes = clamp(minutes, BREAK_RANGE);
      return {
        pomodoroSettings: { ...s.pomodoroSettings, breakMinutes },
        ...(s.timerMode === 'break' ? { timerRemainingMs: breakMinutes * MINUTE } : {}),
      };
    }),
  applyPomodoroPreset: (focus, brk) =>
    set((s) => {
      if (s.timerStatus === 'running') return s;
      const pomodoroSettings = { focusMinutes: clamp(focus, FOCUS_RANGE), breakMinutes: clamp(brk, BREAK_RANGE) };
      return {
        pomodoroSettings,
        timerRemainingMs:
          (s.timerMode === 'focus' ? pomodoroSettings.focusMinutes : pomodoroSettings.breakMinutes) * MINUTE,
      };
    }),

  completeTimerPhase: (now = Date.now()) => {
    const s = get();
    if (s.timerStatus !== 'running' || s.timerEndsAt === null || now < s.timerEndsAt) return null;
    const finished = s.timerMode;
    const endedAt = s.timerEndsAt;
    if (finished === 'focus') get().addPomodoroRecord(endedAt);
    const next = finished === 'focus' ? 'break' : 'focus';
    set({ timerMode: next, timerStatus: 'idle', timerEndsAt: null, timerRemainingMs: phaseMs(get(), next) });
    return finished;
  },

  showPomodoroToast: (message, type) => set({ pomodoroToast: { message, type, visible: true } }),
  hidePomodoroToast: () => set((s) => ({ pomodoroToast: { ...s.pomodoroToast, visible: false } })),
});
