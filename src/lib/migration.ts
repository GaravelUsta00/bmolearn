// `bmo_*` → `belearn_*` tek seferlik, güvenli kopya (PLAN Adım 4c).
// Kural: `bmo_*` anahtarları ASLA silinmez ve ASLA yazılmaz; yalnızca okunur.
import { DATA_KEYS, LEGACY_PREFIX, PREFIX, type DataKey } from '@/lib/storageKeys';

export const META_KEY = `${PREFIX}meta`;
export const DATA_VERSION = 1;

export interface StorageMeta {
  version: number;
  createdAt?: string;
  migratedFrom?: 'bmo';
  migratedAt?: string;
  migratedKeys?: DataKey[];
}

export type MigrationResult =
  | { status: 'already-done' }
  | { status: 'fresh' }
  | { status: 'migrated'; keys: DataKey[] }
  | { status: 'failed'; reason: string }
  | { status: 'unavailable' };

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const writeMeta = (ls: Storage, meta: StorageMeta) => ls.setItem(META_KEY, JSON.stringify(meta));

/**
 * Uygulama açılışında, veri okunmadan önce çağrılır.
 * - Meta varsa: hiçbir şey yapmaz.
 * - `belearn_*` verisi varsa (meta yoksa): yalnızca meta yazar.
 * - Yalnızca `bmo_*` varsa: kopyalar, geri okuyarak byte-byte doğrular, meta yazar.
 *   Herhangi bir adım başarısız olursa yazılan `belearn_*` anahtarları geri alınır.
 */
export const runMigration = (now = new Date()): MigrationResult => {
  const ls = storage();
  if (!ls) return { status: 'unavailable' };
  try {
    if (ls.getItem(META_KEY) !== null) return { status: 'already-done' };
  } catch {
    return { status: 'unavailable' };
  }

  const hasNew = DATA_KEYS.some((k) => ls.getItem(PREFIX + k) !== null);
  const legacy = DATA_KEYS.filter((k) => ls.getItem(LEGACY_PREFIX + k) !== null);

  if (hasNew || legacy.length === 0) {
    try {
      writeMeta(ls, { version: DATA_VERSION, createdAt: now.toISOString() });
    } catch {
      /* meta yazılamazsa bir sonraki açılışta yeniden denenir */
    }
    return hasNew ? { status: 'already-done' } : { status: 'fresh' };
  }

  const written: DataKey[] = [];
  try {
    for (const k of legacy) {
      ls.setItem(PREFIX + k, ls.getItem(LEGACY_PREFIX + k) as string);
      written.push(k);
    }
    const mismatch = legacy.filter((k) => ls.getItem(PREFIX + k) !== ls.getItem(LEGACY_PREFIX + k));
    if (mismatch.length) throw new Error(`doğrulama başarısız: ${mismatch.join(', ')}`);
    writeMeta(ls, {
      version: DATA_VERSION,
      migratedFrom: 'bmo',
      migratedAt: now.toISOString(),
      migratedKeys: legacy,
    });
    return { status: 'migrated', keys: legacy };
  } catch (e) {
    for (const k of written) {
      try {
        ls.removeItem(PREFIX + k);
      } catch {
        /* geri alma da başarısız olursa yapacak bir şey yok */
      }
    }
    return { status: 'failed', reason: e instanceof Error ? e.message : String(e) };
  }
};
