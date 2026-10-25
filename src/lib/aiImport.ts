// AI yanıtının (güvenilmez girdi) ayrıştırılması ve doğrulanması (S4).
// Eskiden şema yoktu: nesne şıklar React'i çökertiyor, "Cevap: B" gibi değerler tüm cevapları
// yanlış saydırıyor, adet/uzunluk sınırı olmadığı için depolama kotası riske giriyordu.
// Bozuk JSON (metin içinde gerçek satır sonu ya da kaçışsız tırnak, sondaki virgül, yorum,
// akıllı tırnak, yarıda kesilmiş yanıt) önce `jsonrepair` ile onarılır; ardından şema uygulanır.
import { jsonrepair } from 'jsonrepair';
import { z } from '@/lib/zod';

export const LIMITS = {
  // Yapıştırılan metnin tamamı: gerçek bir yanıt 100 KB'ı geçmez; onarım dev metinde sekmeyi kilitlemesin.
  inputChars: 1_000_000,
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

// "A) …", "b. …", "C: …", "D - …": yalnızca dört şıkkın hepsi kendi harfiyle sırayla başlıyorsa soyulur.
const OPTION_PREFIX = /^([A-Da-d])\s*[).:\-–]\s*/;

const normalizeOptions = (raw: unknown): Record<Letter, string> | null => {
  let values: unknown[];
  if (Array.isArray(raw)) values = raw;
  else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    values = LETTERS.map((l) => pick(o, l, l.toLowerCase()));
  } else return null;
  if (values.length !== 4) return null;
  const texts: string[] = [];
  for (let i = 0; i < 4; i++) {
    const r = Text.safeParse(values[i]);
    if (!r.success || !r.data) return null;
    texts.push(r.data);
  }
  const prefixed = texts.every((t, i) => t.match(OPTION_PREFIX)?.[1].toUpperCase() === LETTERS[i]);
  const out = {} as Record<Letter, string>;
  for (let i = 0; i < 4; i++) {
    const t = prefixed ? texts[i].replace(OPTION_PREFIX, '').trim() : texts[i];
    if (!t) return null;
    out[LETTERS[i]] = t;
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

const FENCE_RE = /```[A-Za-z]*[ \t]*\r?\n?([\s\S]*?)(?:```|$)/g;

/** Metin dışındaki açık { / [ sayısı > 0 ise yanıt yarıda kesilmiştir. */
const isUnclosed = (s: string) => {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') depth--;
  }
  return depth > 0 || inString;
};

// JSON'da geçersiz kaçışlar (ör. LaTeX "\alpha") ters eğik çizginin kendisine çevrilir.
const fixBackslashes = (s: string) => s.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

/** İlk "{" ile son "}" arası; kapanış yoksa (kesik yanıt) sonuna kadar. */
const objectSpan = (s: string) => {
  const start = s.indexOf('{');
  if (start === -1) return null;
  const end = s.lastIndexOf('}');
  return end > start ? s.substring(start, end + 1) : s.substring(start);
};

/**
 * Yapıştırılan metinden JSON nesnesini çıkarır. Önce ```json kod bloğu, okunamazsa metnin
 * tamamı denenir. Her aday için sırayla: olduğu gibi, geçersiz kaçışlar düzeltilmiş,
 * `jsonrepair` ile onarılmış.
 */
const extractJson = (text: string): { value: unknown; truncated: boolean } => {
  const fenced = [...text.matchAll(FENCE_RE)].map((m) => m[1]).find((b) => b.includes('{'));
  const candidates = [fenced, text].map((s) => (s === undefined ? null : objectSpan(s)));
  if (candidates.every((c) => c === null)) throw new Error('nojson');

  for (const candidate of candidates) {
    if (candidate === null) continue;
    for (const attempt of [
      () => JSON.parse(candidate),
      () => JSON.parse(fixBackslashes(candidate)),
      () => JSON.parse(jsonrepair(fixBackslashes(candidate))),
      () => JSON.parse(jsonrepair(candidate)),
    ]) {
      try {
        return { value: attempt(), truncated: isUnclosed(candidate) };
      } catch {
        /* sonraki deneme */
      }
    }
  }
  throw new Error('bad');
};

const SUMMARY_KEYS = ['summary', 'ozet', 'özet'];
const CARD_KEYS = ['cards', 'flashcards', 'kartlar'];
const QUIZ_KEYS = ['quiz', 'questions', 'sorular', 'test'];
const hasContentKey = (o: Record<string, unknown>) =>
  [...SUMMARY_KEYS, ...CARD_KEYS, ...QUIZ_KEYS].some((k) => o[k] !== undefined);

/** `[ {…} ]` ya da `{ "data": {…} }` gibi bir kat sarılmış yanıtı açar. */
const unwrap = (v: unknown): unknown => {
  if (Array.isArray(v) && v.length === 1) return unwrap(v[0]);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return v;
  const o = v as Record<string, unknown>;
  if (hasContentKey(o)) return o;
  const inner = Object.values(o).filter((x) => x && typeof x === 'object' && !Array.isArray(x));
  return inner.length === 1 && hasContentKey(inner[0] as Record<string, unknown>) ? inner[0] : o;
};

export const parseAIResponse = (text: string): AIImportResult => {
  if (!text.trim()) return { ok: false, error: 'Lütfen AI cevabını yapıştırın.' };
  if (text.length > LIMITS.inputChars) return { ok: false, error: 'Yapıştırılan metin çok uzun.' };

  let parsed: unknown;
  let truncated = false;
  try {
    ({ value: parsed, truncated } = extractJson(text));
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.message === 'nojson'
          ? 'Yanıtta { ile başlayan bir JSON bulunamadı. Yapay zekânın cevabındaki kod bloğunu "Kopyala" düğmesiyle kopyalayıp yapıştır.'
          : 'JSON okunamadı. Yapay zekânın cevabındaki kod bloğunu "Kopyala" düğmesiyle kopyalayıp yeniden yapıştır.',
    };
  }
  parsed = unwrap(parsed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Beklenen biçimde bir JSON nesnesi değil.' };
  }
  const obj = parsed as Record<string, unknown>;
  const root = {
    summary: pick(obj, ...SUMMARY_KEYS),
    cards: pick(obj, ...CARD_KEYS),
    quiz: pick(obj, ...QUIZ_KEYS),
  };
  if (!root.summary && !root.cards && !root.quiz) {
    return { ok: false, error: 'JSON içinde "summary", "cards" ya da "quiz" alanı yok.' };
  }

  const warnings: string[] = [];
  // Yarım kalan son öğe, metin son "}"te kesildiği için zaten alınmaz.
  if (truncated) warnings.push('Yapay zekânın yanıtı yarıda kesilmiş; tamamlanmış kısım alındı.');
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
