// Store <-> localStorage köprüsü.
// zustand `persist` tek bir anahtara tek blob yazar; BeLearn her veri alanını kendi
// anahtarında tutar (`<önek>notes`, `<önek>history`, ...). Bu yüzden yazma, store'a
// abone olup yalnızca referansı değişen alanın anahtarını yazan küçük bir katmanla yapılır.
import { ACTIVE_PREFIX, PREFIX, type DataKey } from '@/lib/storageKeys';
import { validateRaw } from '@/lib/schemas';
import type { AppState, LoadedData, PersistedData, StorageNotice } from '@/store/types';

export const PERSISTED_FIELDS: Record<keyof PersistedData, Exclude<DataKey, 'theme'>> = {
  notes: 'notes',
  flashcards: 'flashcards',
  quiz: 'quiz',
  summaries: 'summaries',
  history: 'history',
  pomodoroHistory: 'pomodoro',
  pomodoroSettings: 'pomodoro_settings',
  documentSettings: 'document_settings',
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

export const isQuotaError = (e: unknown) =>
  e instanceof DOMException &&
  (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);

const isEmpty = (v: unknown) =>
  Array.isArray(v) ? v.length === 0 : v !== null && typeof v === 'object' && Object.keys(v).length === 0;

export interface LoadResult {
  data: LoadedData;
  notices: StorageNotice[];
}

/**
 * Kayıtlı veriyi okur ve doğrular (S7). Okunamayan bir anahtar ya da geçersiz kayıtlar
 * uygulamayı kilitlemez:
 * - ham değer `belearn_backup_<anahtar>_<zaman>` altına kopyalanır (silinmez),
 * - geçerli kayıtlar korunur, temizlenmiş hali anahtara geri yazılır,
 * - kullanıcıya hangi verinin etkilendiği söylenir.
 */
export const loadPersistedData = (now = Date.now()): LoadResult => {
  const ls = storage();
  const data: Record<string, unknown> = {};
  const corrupt: DataKey[] = [];
  const notices: StorageNotice[] = [];
  if (!ls) return { data, notices: [{ kind: 'unavailable' }] };

  for (const field of FIELDS) {
    const key = PERSISTED_FIELDS[field];
    const fullKey = ACTIVE_PREFIX + key;
    let raw: string | null;
    try {
      raw = ls.getItem(fullKey);
    } catch {
      continue;
    }
    if (!raw) continue;

    const result = validateRaw(key, raw);
    if (result.ok && result.dropped === 0) {
      data[field] = result.value;
      continue;
    }

    corrupt.push(key);
    let backedUp = false;
    try {
      ls.setItem(`${PREFIX}backup_${key}_${now}`, raw);
      backedUp = true;
    } catch (e) {
      if (isQuotaError(e)) notices.push({ kind: 'quota' });
    }
    if (result.ok) {
      data[field] = result.value;
      // Ham hali yedeklendiyse temiz hali yaz; yoksa ham veriye dokunma.
      if (backedUp) {
        try {
          if (isEmpty(result.value)) ls.removeItem(fullKey);
          else ls.setItem(fullKey, JSON.stringify(result.value));
        } catch {
          /* bir sonraki yazımda yeniden denenir */
        }
      }
    }
  }

  if (corrupt.length) notices.push({ kind: 'corrupt', keys: corrupt });
  return { data: data as LoadedData, notices };
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
 * Boş liste/nesne anahtarı siler. Yazma başarısız olursa (kota) state bellekte
 * güncel kalır ve kullanıcı uyarılır (B11).
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
        store.getState().addStorageNotice(isQuotaError(e) ? { kind: 'quota' } : { kind: 'unavailable' });
      }
    }
  });
