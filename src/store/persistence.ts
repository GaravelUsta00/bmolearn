// Store <-> localStorage köprüsü.
// zustand `persist` tek bir anahtara tek blob yazar; BeLearn her veri alanını kendi
// anahtarında tutar (`<önek>notes`, `<önek>history`, ...). Bu yüzden yazma, store'a
// abone olup yalnızca referansı değişen alanın anahtarını yazan küçük bir katmanla yapılır.
import { ACTIVE_PREFIX, type DataKey } from '@/lib/storageKeys';
import type { AppState, LoadedData, PersistedData } from '@/store/types';

export const PERSISTED_FIELDS: Record<keyof PersistedData, DataKey> = {
  notes: 'notes',
  flashcards: 'flashcards',
  quiz: 'quiz',
  summaries: 'summaries',
  todos: 'todos',
  history: 'history',
  pomodoroHistory: 'pomodoro',
  videoProgress: 'progress',
};

const FIELDS = Object.keys(PERSISTED_FIELDS) as (keyof PersistedData)[];

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isEmpty = (v: unknown) =>
  Array.isArray(v) ? v.length === 0 : v !== null && typeof v === 'object' && Object.keys(v).length === 0;

/** Kayıtlı veriyi okur. */
export const loadPersistedData = (): LoadedData => {
  const ls = storage();
  const data: Record<string, unknown> = {};
  if (!ls) return data;
  for (const field of FIELDS) {
    const raw = ls.getItem(ACTIVE_PREFIX + PERSISTED_FIELDS[field]);
    if (raw) data[field] = JSON.parse(raw);
  }
  return data as LoadedData;
};

export const writeThemePreference = (theme: 'dark' | 'light') => {
  try {
    storage()?.setItem(ACTIVE_PREFIX + 'theme', theme);
  } catch (e) {
    console.warn('Tema kaydedilemedi:', e);
  }
};

/**
 * Store'daki kalıcı alanları izler; değişen alanı kendi anahtarına yazar.
 * Boş liste/nesne anahtarı siler (eski `clearHistory` davranışıyla aynı sonuç).
 */
export const startPersistence = (store: {
  getState: () => AppState;
  subscribe: (listener: (state: AppState, prev: AppState) => void) => () => void;
}) =>
  store.subscribe((state, prev) => {
    const ls = storage();
    if (!ls) return;
    for (const field of FIELDS) {
      if (state[field] === prev[field]) continue;
      const key = ACTIVE_PREFIX + PERSISTED_FIELDS[field];
      try {
        if (isEmpty(state[field])) ls.removeItem(key);
        else ls.setItem(key, JSON.stringify(state[field]));
      } catch (e) {
        console.warn(`${key} kaydedilemedi:`, e);
      }
    }
  });
