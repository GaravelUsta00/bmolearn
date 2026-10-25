import { beforeEach, describe, expect, it, vi } from 'vitest';
import legacy from '../fixtures/bmo-legacy.json';
import corrupt from '../fixtures/bmo-corrupt.json';
import { META_KEY, runMigration } from '@/lib/migration';
import { validateRaw } from '@/lib/schemas';
import { loadPersistedData } from '@/store/persistence';
import { DATA_KEYS } from '@/lib/storageKeys';

const seed = (data: Record<string, string>) => {
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
};
const snapshot = (prefix: string) =>
  Object.fromEntries(Object.entries({ ...localStorage }).filter(([k]) => k.startsWith(prefix)));

beforeEach(() => localStorage.clear());

describe('migrasyon bmo_* → belearn_* (Adım 4c)', () => {
  it('eski veriyi byte-byte kopyalar, bmo_* anahtarlarına dokunmaz, meta yazar', () => {
    seed(legacy);
    const before = snapshot('bmo_');
    const r = runMigration(new Date('2026-10-25T10:00:00Z'));
    expect(r.status).toBe('migrated');
    for (const [k, v] of Object.entries(legacy)) expect(localStorage.getItem(k.replace('bmo_', 'belearn_'))).toBe(v);
    expect(snapshot('bmo_')).toEqual(before); // eski anahtarlar ASLA silinmez/yazılmaz
    expect(JSON.parse(localStorage.getItem(META_KEY)!)).toMatchObject({ version: 1, migratedFrom: 'bmo' });
  });

  it('ikinci açılışta hiçbir şey yapmaz', () => {
    seed(legacy);
    runMigration();
    localStorage.setItem('belearn_notes', '[]');
    expect(runMigration().status).toBe('already-done');
    expect(localStorage.getItem('belearn_notes')).toBe('[]');
  });

  it('boş cihazda yalnızca meta yazar', () => {
    expect(runMigration().status).toBe('fresh');
    expect(Object.keys({ ...localStorage })).toEqual([META_KEY]);
  });

  it('belearn_* zaten varsa üzerine yazmaz', () => {
    seed({ bmo_notes: '[{"id":1}]', belearn_notes: '[{"id":2}]' });
    expect(runMigration().status).toBe('already-done');
    expect(localStorage.getItem('belearn_notes')).toBe('[{"id":2}]');
  });

  it('yazma yarıda kalırsa yazılanları geri alır, bmo_* aynen kalır', () => {
    seed(legacy);
    const before = snapshot('bmo_');
    let writes = 0;
    const orig = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith('belearn_') && ++writes === 3) throw new DOMException('dolu', 'QuotaExceededError');
      return orig.call(this, k, v);
    });
    expect(runMigration().status).toBe('failed');
    vi.restoreAllMocks();
    expect(snapshot('belearn_')).toEqual({});
    expect(snapshot('bmo_')).toEqual(before);
  });
});

describe('şema doğrulama ve okuma (S7)', () => {
  it('fixture: tüm eski anahtarlar geçerli', () => {
    for (const key of DATA_KEYS) {
      if (key === 'theme') continue;
      const raw = (legacy as Record<string, string>)[`bmo_${key}`];
      if (raw === undefined) continue;
      const r = validateRaw(key, raw);
      expect(r, key).toMatchObject({ ok: true, dropped: 0 });
    }
  });

  it('bozuk JSON ve şemaya uymayan kayıt: geçerliler korunur, ham hali yedeklenir, kullanıcı uyarılır', () => {
    seed(Object.fromEntries(Object.entries(corrupt).map(([k, v]) => [k.replace('bmo_', 'belearn_'), v])));
    const rawQuiz = localStorage.getItem('belearn_quiz');
    const { data, notices } = loadPersistedData(1000);
    expect(data.notes).toBeUndefined(); // tamamen bozuk
    expect(data.quiz!.length).toBeGreaterThan(0);
    expect(data.flashcards!.length).toBeGreaterThan(0);
    expect(notices).toContainEqual({ kind: 'corrupt', keys: expect.arrayContaining(['notes', 'quiz']) });
    expect(localStorage.getItem('belearn_backup_quiz_1000')).toBe(rawQuiz);
    expect(localStorage.getItem('belearn_backup_notes_1000')).toBe(corrupt.bmo_notes);
    // bozuk ham not verisi silinmedi (yedeklendi ve yerinde)
    expect(localStorage.getItem('belearn_notes')).toBe(corrupt.bmo_notes);
  });

  it('geçersiz pomodoro ayarı reddedilir', () => {
    expect(validateRaw('pomodoro_settings', '{"focusMinutes":500,"breakMinutes":5}')).toMatchObject({ ok: false });
    expect(validateRaw('pomodoro_settings', '{"focusMinutes":50,"breakMinutes":10}')).toMatchObject({ ok: true });
  });
});
