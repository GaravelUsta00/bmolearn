import { describe, expect, it, vi } from 'vitest';
import { extractPlaylistId, extractYTId } from '@/lib/youtube';
import { formatTime } from '@/lib/format';
import { lastLocalDays, localDateKey } from '@/lib/date';
import { newId } from '@/lib/id';
import { isPdfFile } from '@/lib/safeInput';

describe('YouTube bağlantıları', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=42', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/live/26SKAEoDpPI?si=RYBjzavGhQFrzh8H', '26SKAEoDpPI'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?list=PLx&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('%s → %s', (url, id) => expect(extractYTId(url)).toBe(id));

  it.each(['https://example.com', 'javascript:alert(1)', 'https://youtu.be/kısa', 'https://youtu.be/<script>xx'])(
    'geçersiz: %s',
    (url) => expect(extractYTId(url)).toBeNull()
  );

  it('oynatma listesi kimliği', () => {
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d')).toBe(
      'PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d'
    );
    expect(extractPlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx_1-2')).toBe('PLx_1-2');
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=<x>')).toBeNull();
  });
});

describe('zaman ve tarih', () => {
  it('formatTime dakika:saniye', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(95.9)).toBe('01:35');
    expect(formatTime(3725)).toBe('62:05');
  });

  it('localDateKey yerel günü kullanır (B4: UTC değil)', () => {
    // Yerel 00:30: UTC'nin gerisinde/ilerisinde olunsa da yerel gün yazılmalı
    const d = new Date(2026, 9, 25, 0, 30);
    expect(localDateKey(d)).toBe('2026-10-25');
    expect(localDateKey(d.getTime())).toBe('2026-10-25');
  });

  it('lastLocalDays en eskiden bugüne, ay sınırını geçer', () => {
    expect(lastLocalDays(3, new Date(2026, 10, 1))).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });
});

describe('newId', () => {
  it('UUID v4 üretir', () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('randomUUID yoksa (güvenli olmayan bağlam) getRandomValues ile', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(undefined as never);
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const id = newId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(newId()).not.toBe(id);
    } finally {
      delete (globalThis.crypto as { randomUUID?: unknown }).randomUUID;
    }
  });
});

describe('isPdfFile (S3)', () => {
  const file = (body: string, name: string, type = '') => new File([body], name, { type });
  it('imzası olan PDF kabul', async () => {
    expect(await isPdfFile(file('%PDF-1.7\n...', 'ders.pdf', 'application/pdf'))).toBe(true);
    expect(await isPdfFile(file('%PDF-1.4', 'DERS.PDF'))).toBe(true);
  });
  it('PDF diye adlandırılmış HTML ve PDF olmayan dosya reddedilir', async () => {
    expect(await isPdfFile(file('<html><script>alert(1)</script>', 'sahte.pdf', 'application/pdf'))).toBe(false);
    expect(await isPdfFile(file('%PDF-1.4', 'not.txt', 'text/plain'))).toBe(false);
  });
});
