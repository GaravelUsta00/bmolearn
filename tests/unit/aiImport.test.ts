import { describe, expect, it } from 'vitest';
import { LIMITS, parseAIResponse } from '@/lib/aiImport';

const ok = (text: string) => {
  const r = parseAIResponse(text);
  if (!r.ok) throw new Error(r.error);
  return r;
};

describe('parseAIResponse (S4)', () => {
  it("sohbet metni ve kod bloğu içindeki JSON'u bulur", () => {
    const r = ok('Tabii! İşte:\n```json\n{"summary":"# Başlık","cards":[{"question":"S?","answer":"C"}]}\n```');
    expect(r.summary).toBe('# Başlık');
    expect(r.cards).toEqual([{ question: 'S?', answer: 'C' }]);
    expect(r.warnings).toEqual([]);
  });

  it('JSON yoksa ya da bozuksa anlaşılır hata', () => {
    expect(parseAIResponse('')).toMatchObject({ ok: false });
    expect(parseAIResponse('bu bir json değil')).toMatchObject({ ok: false, error: expect.stringContaining('JSON') });
    expect(parseAIResponse('{ "summary": ')).toMatchObject({ ok: false });
    expect(parseAIResponse('{"baska":1}')).toMatchObject({ ok: false, error: expect.stringContaining('summary') });
  });

  it('doğru cevabı normalize eder: b, "Cevap: C", şık metni, dizi şıklar', () => {
    const r = ok(
      JSON.stringify({
        quiz: [
          { question: '1', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correct: 'b' },
          { question: '2', options: { A: 'Ankara', B: 'İzmir', C: 'Bursa', D: 'Van' }, correct: 'Cevap: C' },
          { question: '3', options: ['bir', 'iki', 'üç', 'dört'], correct: 'dört' },
          { question: '4', options: { a: 'x', b: 'y', c: 'z', d: 'w' }, correct: 'D)' },
        ],
      })
    );
    expect(r.quiz.map((q) => q.correct)).toEqual(['B', 'C', 'D', 'D']);
    expect(r.quiz[2].options).toEqual({ A: 'bir', B: 'iki', C: 'üç', D: 'dört' });
  });

  it('şemaya uymayanları atlar ve raporlar; çökmez', () => {
    const r = ok(
      JSON.stringify({
        cards: [{ question: 'tamam', answer: 'evet' }, { question: 'cevapsız' }, 'metin'],
        quiz: [
          { question: 'nesne şık', options: { A: { bad: 1 }, B: 'b', C: 'c', D: 'd' }, correct: 'A' },
          { question: 'üç şık', options: ['a', 'b', 'c'], correct: 'A' },
          { question: 'doğru yok', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correct: 'E' },
        ],
      })
    );
    expect(r.cards).toHaveLength(1);
    expect(r.quiz).toHaveLength(0);
    expect(r.warnings.join(' ')).toMatch(/2 kart/);
    expect(r.warnings.join(' ')).toMatch(/3 soru/);
  });

  it('yalnızca metin/sayı kabul eder (nesne özet alınmaz)', () => {
    const r = ok(JSON.stringify({ summary: { html: '<img>' }, cards: [{ question: 42, answer: 7 }] }));
    expect(r.summary).toBe('');
    expect(r.cards).toEqual([{ question: '42', answer: '7' }]);
    expect(r.warnings.join(' ')).toMatch(/Özet/);
  });

  it('adet ve uzunluk sınırları', () => {
    const r = ok(
      JSON.stringify({
        summary: 'x'.repeat(LIMITS.summaryChars + 10),
        cards: Array.from({ length: 150 }, (_, i) => ({ question: `S${i}`, answer: `C${i}` })),
      })
    );
    expect(r.cards).toHaveLength(LIMITS.cards);
    expect(r.summary).toHaveLength(LIMITS.summaryChars);
    expect(r.warnings.join(' ')).toMatch(/En fazla 100 kart/);
    expect(r.warnings.join(' ')).toMatch(/kısaltıldı/);
  });
});
