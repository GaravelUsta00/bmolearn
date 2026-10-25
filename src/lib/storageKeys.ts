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
  'todos',
  'history',
  'pomodoro',
  'pomodoro_settings',
  'progress',
  'theme',
] as const;
export type DataKey = (typeof DATA_KEYS)[number];

export const DATA_KEY_LABELS: Record<DataKey, string> = {
  notes: 'Notlar',
  flashcards: 'Kartlar',
  quiz: 'Sorular',
  summaries: 'Özetler',
  todos: 'Görevler',
  history: 'Geçmiş',
  pomodoro: 'Pomodoro geçmişi',
  pomodoro_settings: 'Pomodoro süreleri',
  progress: 'Video ilerlemesi',
  theme: 'Tema',
};

export const isDataKey = (s: string): s is DataKey => (DATA_KEYS as readonly string[]).includes(s);
