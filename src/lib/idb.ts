// PDF dosyalarının cihazda saklanması (A4). localStorage yalnızca metin ve ~5 MB tutar; dosyalar
// IndexedDB'de Blob olarak durur. Bağımlılıksız küçük bir sarmalayıcı.
const DB_NAME = 'belearn';
const DB_VERSION = 1;
const STORE = 'documents';

export const MAX_STORED_PDF_BYTES = 50 * 1024 * 1024;

export interface StoredDocument {
  id: string;
  name: string;
  size: number;
  savedAt: number;
  blob: Blob;
}

export type SaveFailure = 'too-large' | 'quota' | 'unavailable';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      reject(e);
      return;
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB engellendi'));
  }).catch((e) => {
    dbPromise = null;
    throw e;
  });
  return dbPromise;
};

const run = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error ?? req.error);
    tx.onabort = () => reject(tx.error ?? new Error('İşlem iptal edildi'));
  });
};

const isQuotaError = (e: unknown) =>
  e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

/** Dosyayı saklar. Sınır ve kota önceden denetlenir; Safari'nin düşük kotası açık hata olarak döner. */
export const saveDocument = async (
  id: string,
  file: Blob,
  name: string
): Promise<{ ok: true } | { ok: false; reason: SaveFailure }> => {
  if (file.size > MAX_STORED_PDF_BYTES) return { ok: false, reason: 'too-large' };
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.quota !== undefined && est.usage !== undefined && est.quota - est.usage < file.size * 1.1) {
      return { ok: false, reason: 'quota' };
    }
  } catch {
    /* estimate desteklenmiyorsa doğrudan denenir */
  }
  try {
    const doc: StoredDocument = { id, name, size: file.size, savedAt: Date.now(), blob: file };
    await run('readwrite', (s) => s.put(doc));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: isQuotaError(e) ? 'quota' : 'unavailable' };
  }
};

export const loadDocument = async (id: string): Promise<Blob | null> => {
  try {
    const doc = await run<StoredDocument | undefined>('readonly', (s) => s.get(id));
    return doc?.blob ?? null;
  } catch {
    return null;
  }
};

export const deleteDocuments = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      ids.forEach((id) => tx.objectStore(STORE).delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* saklama yoksa silinecek bir şey de yok */
  }
};

export const clearDocuments = async (): Promise<void> => {
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    /* yukarıdakiyle aynı */
  }
};

/** Saklanan dosyaların özeti (Ayarlar'da gösterilir). */
export const documentsSummary = async (): Promise<{ count: number; bytes: number } | null> => {
  try {
    const all = await run<StoredDocument[]>('readonly', (s) => s.getAll());
    return { count: all.length, bytes: all.reduce((n, d) => n + d.size, 0) };
  } catch {
    return null;
  }
};
