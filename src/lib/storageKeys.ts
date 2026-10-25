// localStorage anahtarlarının tek kaynağı.
// `bmo_*` eski anahtarlardır: ASLA silinmez ve (Adım 4c'den itibaren) ASLA yazılmaz.
export const LEGACY_PREFIX = 'bmo_';
export const PREFIX = 'belearn_';

// Uygulamanın okuyup yazdığı önek (Adım 4c'den itibaren `belearn_`).
export const ACTIVE_PREFIX = PREFIX;

// Her anahtarın son eki (önek hariç). Biçimleri ANALYSIS.md §1'deki tabloda.
export const DATA_KEYS = [
  'notes',
  'flashcards',
  'quiz',
  'summaries',
  'history',
  'pomodoro',
  'pomodoro_settings',
  'document_settings',
  'progress',
  'theme',
] as const;
export type DataKey = (typeof DATA_KEYS)[number];

export const DATA_KEY_LABELS: Record<DataKey, string> = {
  notes: 'Notlar',
  flashcards: 'Kartlar',
  quiz: 'Sorular',
  summaries: 'Özetler',
  history: 'Geçmiş',
  pomodoro: 'Pomodoro geçmişi',
  pomodoro_settings: 'Pomodoro süreleri',
  document_settings: 'PDF saklama ayarı',
  progress: 'Video ilerlemesi',
  theme: 'Tema',
};

export const isDataKey = (s: string): s is DataKey => (DATA_KEYS as readonly string[]).includes(s);

// Kaldırılan özelliklerin anahtarları (görevler, 2026-10-25): okunmaz, yazılmaz, yedeğe girmez,
// eski yedeklerde sessizce yok sayılır. Cihazdaki eski değerlere dokunulmaz.
export const RETIRED_KEYS = ['todos'] as const;
export const isRetiredKey = (s: string) => (RETIRED_KEYS as readonly string[]).includes(s);
