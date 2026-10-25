import {
  ACTIVE_PREFIX,
  DATA_KEYS,
  LEGACY_PREFIX,
  PREFIX,
  isDataKey,
  isRetiredKey,
  type DataKey,
} from '@/lib/storageKeys';

// Yedek dosyası biçimi. `data` localStorage'daki ham değerleri (string) olduğu gibi taşır;
// böylece yedek, uygulamanın o anki veri biçiminden bağımsızdır.
export interface BackupFile {
  app: 'BeLearn';
  format: 1;
  exportedAt: string;
  source: string;
  data: Record<string, string>;
}

const BACKUP_KEY_RE = new RegExp(`^(${LEGACY_PREFIX}|${PREFIX})`);

const safeLocalStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const suffixOf = (key: string) => {
  const m = key.match(BACKUP_KEY_RE);
  return m ? key.slice(m[1].length) : null;
};

/** localStorage'daki tüm `bmo_*` ve `belearn_*` anahtarlarını (kaldırılan özellikler hariç) ham haliyle toplar. */
export const collectBackup = (): BackupFile => {
  const ls = safeLocalStorage();
  const data: Record<string, string> = {};
  if (ls) {
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      const suffix = key ? suffixOf(key) : null;
      if (!key || suffix === null || isRetiredKey(suffix)) continue;
      const value = ls.getItem(key);
      if (value !== null) data[key] = value;
    }
  }
  return {
    app: 'BeLearn',
    format: 1,
    exportedAt: new Date().toISOString(),
    source: typeof window !== 'undefined' ? window.location.origin : '',
    data,
  };
};

const localDateStamp = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Yedeği `belearn-yedek-YYYY-AA-GG.json` olarak indirir. */
export const downloadBackup = (file: BackupFile = collectBackup(), suffix = '') => {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `belearn-yedek-${localDateStamp()}${suffix}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export type BackupSummary = Partial<Record<DataKey, number>>;

export interface ParsedBackup {
  /** Son ek → ham değer (string). `belearn_*` varsa `bmo_*`'a tercih edilir. */
  values: Partial<Record<DataKey, string>>;
  summary: BackupSummary;
  skipped: string[];
  exportedAt?: string;
  source?: string;
}

const countOf = (key: DataKey, raw: string): number => {
  if (key === 'theme') return 1;
  const v = JSON.parse(raw);
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === 'object') return Object.keys(v).length;
  throw new Error('liste ya da nesne değil');
};

/**
 * Yedek dosyasını ya da ham bir localStorage dökümünü ({ "bmo_notes": "[...]", ... }) okur.
 * Değerler string ya da zaten ayrıştırılmış JSON olabilir.
 */
export const parseBackup = (text: string): { ok: true; backup: ParsedBackup } | { ok: false; error: string } => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Dosya okunamadı: geçerli bir JSON değil.' };
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, error: 'Dosya bir BeLearn yedeği değil.' };
  }
  const obj = json as Record<string, unknown>;
  const isBackupFile = obj.app === 'BeLearn' && typeof obj.data === 'object' && obj.data !== null;
  const raw = (isBackupFile ? obj.data : obj) as Record<string, unknown>;

  const values: Partial<Record<DataKey, string>> = {};
  const fromPrefix: Partial<Record<DataKey, string>> = {};
  const summary: BackupSummary = {};
  const skipped: string[] = [];

  for (const [fullKey, value] of Object.entries(raw)) {
    const m = fullKey.match(BACKUP_KEY_RE);
    const suffix = m ? fullKey.slice(m[1].length) : '';
    if (!m || !isDataKey(suffix)) {
      const internal = fullKey.startsWith(`${PREFIX}backup_`) || fullKey.startsWith(`${PREFIX}meta`);
      if (!internal && !(m && isRetiredKey(suffix))) skipped.push(fullKey);
      continue;
    }
    // Aynı veri iki önekle varsa yenisi (belearn_) kazanır.
    if (values[suffix] !== undefined && fromPrefix[suffix] === PREFIX) continue;
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      if (suffix === 'theme') {
        if (str !== 'light' && str !== 'dark') throw new Error('geçersiz tema');
      }
      summary[suffix] = countOf(suffix, str);
      values[suffix] = str;
      fromPrefix[suffix] = m[1];
    } catch {
      skipped.push(fullKey);
    }
  }

  if (Object.keys(values).length === 0) {
    return { ok: false, error: 'Dosyada BeLearn verisi bulunamadı.' };
  }
  return {
    ok: true,
    backup: {
      values,
      summary,
      skipped,
      exportedAt: isBackupFile && typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined,
      source: isBackupFile && typeof obj.source === 'string' ? obj.source : undefined,
    },
  };
};

const isEmptyValue = (raw: string | null) => raw === null || raw === '' || raw === '[]' || raw === '{}';

/** Bu cihazda şu an dolu olan veri anahtarları (yükleme öncesi uyarı için). */
export const currentlyFilledKeys = (prefix = ACTIVE_PREFIX): DataKey[] => {
  const ls = safeLocalStorage();
  if (!ls) return [];
  return DATA_KEYS.filter((k) => k !== 'theme' && !isEmptyValue(ls.getItem(prefix + k)));
};

export type ApplyMode = 'fill' | 'replace';

/**
 * Yedeği uygular.
 * - `fill`: yalnızca bu cihazda boş olan anahtarlara yazar; mevcut veriye dokunmaz.
 * - `replace`: tüm anahtarları yedektekiyle değiştirir (çağıran önce mevcut verinin yedeğini indirmeli).
 * Bir yazma başarısız olursa (ör. kota) o ana kadar yazılanlar eski değerlerine döndürülür.
 */
export const applyBackup = (
  backup: ParsedBackup,
  mode: ApplyMode,
  prefix = ACTIVE_PREFIX
): { ok: true; written: DataKey[]; kept: DataKey[] } | { ok: false; error: string } => {
  const ls = safeLocalStorage();
  if (!ls)
    return { ok: false, error: 'Tarayıcı depolamasına erişilemiyor (gizli pencere ya da engellenmiş site verisi).' };

  const written: DataKey[] = [];
  const kept: DataKey[] = [];
  const previous = new Map<string, string | null>();
  try {
    for (const key of DATA_KEYS) {
      const value = backup.values[key];
      if (value === undefined) continue;
      const fullKey = prefix + key;
      const current = ls.getItem(fullKey);
      if (mode === 'fill' && !isEmptyValue(current)) {
        kept.push(key);
        continue;
      }
      previous.set(fullKey, current);
      ls.setItem(fullKey, value);
      written.push(key);
    }
  } catch (e) {
    for (const [k, v] of previous) {
      try {
        if (v === null) ls.removeItem(k);
        else ls.setItem(k, v);
      } catch {
        /* geri alma da başarısız olursa yapacak bir şey yok */
      }
    }
    const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);
    return {
      ok: false,
      error: quota
        ? 'Cihazdaki depolama alanı dolu; yedek yüklenemedi. Hiçbir veri değiştirilmedi.'
        : 'Yedek yazılamadı; hiçbir veri değiştirilmedi.',
    };
  }
  return { ok: true, written, kept };
};
