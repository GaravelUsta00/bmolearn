// AI yanıtının (güvenilmez girdi) ayrıştırılması ve doğrulanması (S4).
// Eskiden şema yoktu: nesne şıklar React'i çökertiyor, "Cevap: B" gibi değerler tüm cevapları
// yanlış saydırıyor, adet/uzunluk sınırı olmadığı için depolama kotası riske giriyordu.
import { z } from '@/lib/zod';

export const LIMITS = {
  summaryChars: 50_000,
  cards: 100,
  quiz: 100,
  questionChars: 1_000,
  answerChars: 2_000,
  optionChars: 500,
} as const;

const LETTERS = ['A', 'B', 'C', 'D'] as const;
type Letter = (typeof LETTERS)[number];

export interface ImportedCard {
  question: string;
  answer: string;
}
export interface ImportedQuestion {
  question: string;
  options: Record<Letter, string>;
  correct: Letter;
}
export type AIImportResult =
  | { ok: true; summary: string; cards: ImportedCard[]; quiz: ImportedQuestion[]; warnings: string[] }
  | { ok: false; error: string };

// Metin ya da sayı → kırpılmış metin; diğer her şey geçersiz.
const Text = z.union([z.string(), z.number()]).transform((v) => String(v).trim());

const clip = (s: string, max: number, onClip: () => void) => {
  if (s.length <= max) return s;
  onClip();
  return s.slice(0, max);
};

const pick = (obj: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return undefined;
};

const normalizeOptions = (raw: unknown): Record<Letter, string> | null => {
  let values: unknown[];
  if (Array.isArray(raw)) values = raw;
  else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    values = LETTERS.map((l) => pick(o, l, l.toLowerCase()));
  } else return null;
  if (values.length !== 4) return null;
  const out = {} as Record<Letter, string>;
  for (let i = 0; i < 4; i++) {
    const r = Text.safeParse(values[i]);
    if (!r.success || !r.data) return null;
    out[LETTERS[i]] = r.data;
  }
  return out;
};

const normalizeCorrect = (raw: unknown, options: Record<Letter, string>): Letter | null => {
  const r = Text.safeParse(raw);
  if (!r.success || !r.data) return null;
  const s = r.data;
  // "A", "b", "B)", "Cevap: C", "Doğru cevap D şıkkı"
  const m = s.toUpperCase().match(/(?:^|[^A-ZÇĞİÖŞÜ])([ABCD])(?![A-ZÇĞİÖŞÜ])/);
  if (m) return m[1] as Letter;
  // Şıkkın metni verilmişse
  const byText = LETTERS.find((l) => options[l].localeCompare(s, 'tr', { sensitivity: 'base' }) === 0);
  return byText ?? null;
};

/** Yapıştırılan metinden JSON nesnesini çıkarır (eski davranış: ilk "{" ile son "}" arası). */
const extractJson = (text: string): unknown => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('nojson');
  const cleaned = text.substring(start, end + 1).replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  return JSON.parse(cleaned);
};

export const parseAIResponse = (text: string): AIImportResult => {
  if (!text.trim()) return { ok: false, error: 'Lütfen AI cevabını yapıştırın.' };

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.message === 'nojson'
          ? 'Yanıtta { ile başlayıp } ile biten bir JSON bulunamadı.'
          : 'JSON okunamadı. Yapay zekâdan yanıtı yalnızca JSON olarak vermesini isteyip tekrar deneyin.',
    };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Beklenen biçimde bir JSON nesnesi değil.' };
  }
  const root = parsed as Record<string, unknown>;
  if (!root.summary && !root.cards && !root.quiz) {
    return { ok: false, error: 'JSON içinde "summary", "cards" ya da "quiz" alanı yok.' };
  }

  const warnings: string[] = [];
  let clipped = 0;
  const onClip = () => clipped++;

  // Özet
  let summary = '';
  if (root.summary !== undefined) {
    const s = Text.safeParse(root.summary);
    if (s.success) summary = clip(s.data, LIMITS.summaryChars, onClip);
    else warnings.push('Özet metin olmadığı için alınmadı.');
  }

  // Kartlar
  const rawCards = Array.isArray(root.cards) ? root.cards : [];
  if (root.cards !== undefined && !Array.isArray(root.cards))
    warnings.push('"cards" bir liste olmadığı için alınmadı.');
  const cards: ImportedCard[] = [];
  let badCards = 0;
  for (const c of rawCards) {
    if (cards.length >= LIMITS.cards) break;
    const o = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
    const q = Text.safeParse(pick(o, 'question', 'front', 'q', 'soru'));
    const a = Text.safeParse(pick(o, 'answer', 'back', 'a', 'cevap'));
    if (!q.success || !a.success || !q.data || !a.data) {
      badCards++;
      continue;
    }
    cards.push({
      question: clip(q.data, LIMITS.questionChars, onClip),
      answer: clip(a.data, LIMITS.answerChars, onClip),
    });
  }
  if (rawCards.length > LIMITS.cards + badCards) warnings.push(`En fazla ${LIMITS.cards} kart alındı.`);
  if (badCards) warnings.push(`${badCards} kart soru ya da cevabı eksik olduğu için atlandı.`);

  // Sorular
  const rawQuiz = Array.isArray(root.quiz) ? root.quiz : [];
  if (root.quiz !== undefined && !Array.isArray(root.quiz)) warnings.push('"quiz" bir liste olmadığı için alınmadı.');
  const quiz: ImportedQuestion[] = [];
  let badQuiz = 0;
  for (const item of rawQuiz) {
    if (quiz.length >= LIMITS.quiz) break;
    const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const q = Text.safeParse(pick(o, 'question', 'q', 'soru'));
    const options = normalizeOptions(pick(o, 'options', 'choices', 'secenekler'));
    const correct = options ? normalizeCorrect(pick(o, 'correct', 'answer', 'dogru'), options) : null;
    if (!q.success || !q.data || !options || !correct) {
      badQuiz++;
      continue;
    }
    const clippedOptions = Object.fromEntries(
      LETTERS.map((l) => [l, clip(options[l], LIMITS.optionChars, onClip)])
    ) as Record<Letter, string>;
    quiz.push({ question: clip(q.data, LIMITS.questionChars, onClip), options: clippedOptions, correct });
  }
  if (rawQuiz.length > LIMITS.quiz + badQuiz) warnings.push(`En fazla ${LIMITS.quiz} soru alındı.`);
  if (badQuiz) warnings.push(`${badQuiz} soru eksik/geçersiz şık ya da doğru cevap nedeniyle atlandı.`);
  if (clipped) warnings.push(`${clipped} çok uzun metin kısaltıldı.`);

  if (!summary && cards.length === 0 && quiz.length === 0) {
    return { ok: false, error: `İçe aktarılabilecek geçerli içerik bulunamadı. ${warnings.join(' ')}`.trim() };
  }
  return { ok: true, summary, cards, quiz, warnings };
};
