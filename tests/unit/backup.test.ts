import { beforeEach, describe, expect, it, vi } from 'vitest';
import legacy from '../fixtures/bmo-legacy.json';
import { applyBackup, collectBackup, currentlyFilledKeys, parseBackup } from '@/lib/backup';

beforeEach(() => localStorage.clear());

const parse = (text: string) => {
  const r = parseBackup(text);
  if (!r.ok) throw new Error(r.error);
  return r.backup;
};

describe('yedek (Adım 4a)', () => {
  it('dışa aktar → içe aktar: ham değerler birebir döner', () => {
    localStorage.setItem('belearn_notes', '[{"id":"a","contentId":"x","text":"t","time":0}]');
    localStorage.setItem('belearn_theme', 'dark');
    localStorage.setItem('belearn_meta', '{"version":1}');
    localStorage.setItem('baska_uygulama', 'x');
    const file = collectBackup();
    expect(file.app).toBe('BeLearn');
    expect(Object.keys(file.data).sort()).toEqual(['belearn_meta', 'belearn_notes', 'belearn_theme']);

    const backup = parse(JSON.stringify(file));
    expect(backup.values).toEqual({ notes: file.data.belearn_notes, theme: 'dark' });
    expect(backup.summary).toEqual({ notes: 1, theme: 1 });

    localStorage.clear();
    expect(applyBackup(backup, 'fill')).toMatchObject({ ok: true, written: ['notes', 'theme'] });
    expect(localStorage.getItem('belearn_notes')).toBe(file.data.belearn_notes);
  });

  it('ham bmo_* dökümünü de okur; aynı veri iki önekle varsa belearn_ kazanır', () => {
    const b = parse(JSON.stringify({ ...legacy, belearn_notes: '[]' }));
    expect(b.values.notes).toBe('[]');
    expect(b.values.history).toBe(legacy.bmo_history);
    expect(b.summary.notes).toBe(0);
  });

  it('bozuk alanlar ve geçersiz tema atlanır', () => {
    const b = parse(JSON.stringify({ belearn_notes: '{bozuk', belearn_theme: 'mor', belearn_todos: '[]' }));
    expect(b.values).toEqual({ todos: '[]' });
    expect(b.skipped).toEqual(['belearn_notes', 'belearn_theme']);
    expect(parseBackup('{"x":1}')).toMatchObject({ ok: false });
    expect(parseBackup('yedek değil')).toMatchObject({ ok: false });
  });

  it('fill: dolu anahtara dokunmaz; replace: değiştirir', () => {
    localStorage.setItem('belearn_notes', '[{"id":1}]');
    const b = parse(JSON.stringify({ belearn_notes: '[{"id":2}]', belearn_todos: '[{"id":3}]' }));
    expect(currentlyFilledKeys()).toEqual(['notes']);
    expect(applyBackup(b, 'fill')).toMatchObject({ ok: true, written: ['todos'], kept: ['notes'] });
    expect(localStorage.getItem('belearn_notes')).toBe('[{"id":1}]');
    expect(applyBackup(b, 'replace')).toMatchObject({ ok: true, written: ['notes', 'todos'] });
    expect(localStorage.getItem('belearn_notes')).toBe('[{"id":2}]');
  });

  it('kota dolarsa yazılanlar geri alınır, hiçbir veri değişmez', () => {
    localStorage.setItem('belearn_notes', '[{"id":1}]');
    const b = parse(JSON.stringify({ belearn_notes: '[{"id":2}]', belearn_todos: '[{"id":3}]' }));
    const orig = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === 'belearn_todos') throw new DOMException('dolu', 'QuotaExceededError');
      return orig.call(this, k, v);
    });
    expect(applyBackup(b, 'replace')).toMatchObject({ ok: false, error: expect.stringContaining('dolu') });
    vi.restoreAllMocks();
    expect(localStorage.getItem('belearn_notes')).toBe('[{"id":1}]');
    expect(localStorage.getItem('belearn_todos')).toBeNull();
  });

  it('bmo_* anahtarlarına asla yazmaz', () => {
    localStorage.setItem('bmo_notes', 'eski');
    applyBackup(parse(JSON.stringify({ bmo_notes: '[{"id":9}]' })), 'replace');
    expect(localStorage.getItem('bmo_notes')).toBe('eski');
    expect(localStorage.getItem('belearn_notes')).toBe('[{"id":9}]');
  });
});
