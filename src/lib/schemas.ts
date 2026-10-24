// Kalıcı verinin okuma şemaları. Bilinçli olarak hoşgörülü:
// - eski sayı/ondalıklı id'ler ve yeni UUID'ler kabul edilir,
// - bilinmeyen alanlar korunur (looseObject),
// - geçmişte `id` alanı olmayan eski kayıtlar kabul edilir (initData dönüştürür).
import { z } from '@/lib/zod';
import type { DataKey } from '@/lib/storageKeys';

const Id = z.union([z.number(), z.string()]);

export const NoteSchema = z.looseObject({
  id: Id,
  contentId: z.string(),
  text: z.string(),
  time: z.number(),
});

export const FlashcardSchema = z.looseObject({
  id: Id,
  contentId: z.string(),
  question: z.string(),
  answer: z.string(),
  learned: z.boolean().optional(),
});

export const QuizQuestionSchema = z.looseObject({
  id: Id,
  contentId: z.string(),
  question: z.string(),
  options: z.looseObject({ A: z.string(), B: z.string(), C: z.string(), D: z.string() }),
  correct: z.string(),
  userAnswer: z.string().optional(),
});

export const TodoSchema = z.looseObject({
  id: Id,
  text: z.string(),
  completed: z.boolean(),
});

const WatchedVideoSchema = z.looseObject({
  contentId: z.string(),
  title: z.string(),
  timestamp: z.number(),
});

export const HistoryItemSchema = z.looseObject({
  id: Id.transform(String).optional(),
  contentId: z.string(),
  title: z.string(),
  timestamp: z.number(),
  type: z.enum(['video', 'document', 'playlist']),
  pId: z.string().nullable().optional(),
  playlistItems: z.array(WatchedVideoSchema).optional(),
});

type Kind = { list: z.ZodType } | { record: z.ZodType };

/** Her veri anahtarının biçimi: liste (öğe şeması) ya da sözlük (değer şeması). */
export const KEY_SCHEMAS: Record<Exclude<DataKey, 'theme'>, Kind> = {
  notes: { list: NoteSchema },
  flashcards: { list: FlashcardSchema },
  quiz: { list: QuizQuestionSchema },
  todos: { list: TodoSchema },
  history: { list: HistoryItemSchema },
  summaries: { record: z.string() },
  pomodoro: { record: z.number() },
  progress: { record: z.number() },
};

export type ValidationResult = { ok: true; value: unknown; dropped: number } | { ok: false; reason: 'json' | 'shape' };

/**
 * Ham string'i ayrıştırır ve doğrular. Geçersiz öğeler atılır (sayısı `dropped`),
 * geçerli olanlar korunur; böylece tek bozuk kayıt tüm veriyi kaybettirmez.
 */
export const validateRaw = (key: Exclude<DataKey, 'theme'>, raw: string): ValidationResult => {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'json' };
  }
  const kind = KEY_SCHEMAS[key];
  if ('list' in kind) {
    if (!Array.isArray(json)) return { ok: false, reason: 'shape' };
    const value: unknown[] = [];
    for (const item of json) {
      const r = kind.list.safeParse(item);
      if (r.success) value.push(r.data);
    }
    return { ok: true, value, dropped: json.length - value.length };
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return { ok: false, reason: 'shape' };
  const value: Record<string, unknown> = {};
  let dropped = 0;
  for (const [k, v] of Object.entries(json)) {
    const r = kind.record.safeParse(v);
    if (r.success) value[k] = r.data;
    else dropped++;
  }
  return { ok: true, value, dropped };
};
