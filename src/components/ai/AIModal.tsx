'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { EXAM_LEVELS } from '@/constants';
import type { ContentConfig, StudyTab, Setter } from '@/types';
import { newId } from '@/lib/id';
import { copyText } from '@/lib/clipboard';
import { parseAIResponse, type AIImportResult } from '@/lib/aiImport';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRetained } from '@/hooks/usePresence';

type ParsedImport = Extract<AIImportResult, { ok: true }>;

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContentId: string;
  contentConfig: ContentConfig;
  setActiveTab: Setter<StudyTab>;
}

const stepLabel = 'font-mono text-[11px] uppercase tracking-[0.12em] text-mute';

export const AIModal = ({ isOpen, onClose, activeContentId, contentConfig, setActiveTab }: AIModalProps) => {
  const replaceContentAI = useStore((s) => s.replaceContentAI);
  const hasSummary = useStore((s) => !!s.summaries[activeContentId]);
  const cardCount = useStore((s) => s.flashcards.filter((c) => c.contentId === activeContentId).length);
  const quizCount = useStore((s) => s.quiz.filter((q) => q.contentId === activeContentId).length);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showPromptText, setShowPromptText] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>(EXAM_LEVELS[0]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [pendingImport, setPendingImport] = useState<{ result: ParsedImport; existing: string } | null>(null);
  const shownImport = useRetained(pendingImport);
  const closeWithReset = () => {
    setImportWarnings([]);
    setShowPromptText(false);
    onClose();
  };

  const isDocument = contentConfig.type === 'document';
  // Cevap tek bir ```json bloğunda istenir: sohbetteki "Kopyala" düğmesi metni birebir verir
  // (blok dışındaki JSON'u sohbet ekranı Markdown olarak işler ve \" gibi kaçışları bozar).
  // Adet ve uzunluk sınırları yanıtın yarıda kesilmesini önler. Okuyucu: src/lib/aiImport.ts.
  const promptTemplate = `Sen bir eğitim asistanısın. Aşağıdaki içerikten çalışma materyali hazırla. Cevabın bir program tarafından otomatik okunacak; biçim kurallarına harfiyen uy.

İÇERİK
Başlık: ${contentConfig.title}
${isDocument ? 'Tür: PDF belgesi' : `Link: https://www.youtube.com/watch?v=${activeContentId}`}
Seviye: ${selectedLevel}
${isDocument ? 'Bu sohbete PDF dosyasını eklediysem YALNIZCA dosyanın içeriğini kullan. Eklemediysem başlığa göre konuyu anlat.\n' : ''}
İÇERİK KURALLARI
- Tüm metinleri içeriğin dilinde yaz (içerik İngilizce ise İngilizce, Türkçe ise Türkçe).
- Yalnızca doğru olduğundan emin olduğun bilgileri yaz.
- summary: Markdown özet; # ve ## başlıklar, madde işaretleri; en fazla 600 kelime.
- cards: 12 bilgi kartı; question kısa, answer 1-2 cümle.
- quiz: 10 çoktan seçmeli soru; her soruda A, B, C, D olmak üzere 4 şık ve tek doğru cevap; doğru şıkları harfler arasında dağıt.

BİÇİM KURALLARI
1. Cevabının tamamı TEK bir \`\`\`json kod bloğu olsun. Bloktan önce ve sonra hiçbir şey yazma.
2. Geçerli JSON yaz: anahtarlar ve metinler çift tırnak içinde; son öğeden sonra virgül yok; yorum yok.
3. Metinlerin içinde çift tırnak (") kullanma; alıntı gerekirse tek tırnak (') kullan.
4. Metin içinde satır atlamak için \\n yaz; bunun dışında ters eğik çizgi (\\) kullanma.
5. "correct" yalnızca tek büyük harf olsun: "A", "B", "C" ya da "D".
6. Göndermeden önce JSON'u kontrol et ve kod bloğunu mutlaka kapat.

ŞABLON (anahtar adlarını değiştirme):
\`\`\`json
{
  "summary": "# Başlık\\n\\nÖzet metni...",
  "cards": [
    { "question": "Soru?", "answer": "Cevap." }
  ],
  "quiz": [
    {
      "question": "Soru?",
      "options": { "A": "Şık A", "B": "Şık B", "C": "Şık C", "D": "Şık D" },
      "correct": "B"
    }
  ]
}
\`\`\``;

  const handleCopyPrompt = async () => {
    if (await copyText(promptTemplate)) {
      setShowPromptText(false);
      setSuccessMsg('Kopyalandı. Şimdi yapay zekâ sohbetine yapıştır.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      // B17: pano kullanılamıyorsa metin seçilebilir olarak gösterilir.
      setShowPromptText(true);
    }
  };

  const applyImport = (result: ParsedImport) => {
    const newCards = result.cards.map((c) => ({
      id: newId(),
      contentId: activeContentId,
      question: c.question,
      answer: c.answer,
      learned: false,
    }));
    const newQuiz = result.quiz.map((q) => ({
      id: newId(),
      contentId: activeContentId,
      question: q.question,
      options: q.options,
      correct: q.correct,
    }));

    replaceContentAI(activeContentId, newCards, newQuiz, result.summary);
    setAiResponse('');
    setActiveTab('summary');
    // Atlanan/kısaltılan öğe varsa kullanıcı görsün diye pencere açık kalır.
    if (result.warnings.length) setImportWarnings(result.warnings);
    else closeWithReset();
  };

  const handleParseJSON = () => {
    setErrorMsg('');
    const result = parseAIResponse(aiResponse);
    if (!result.ok) return setErrorMsg(result.error);
    // B7: mevcut özet/kart/soru varsa üzerine yazmadan önce sor.
    if (hasSummary || cardCount > 0 || quizCount > 0) setPendingImport({ result, existing: existingLabel() });
    else applyImport(result);
  };

  const existingLabel = () =>
    [hasSummary && 'özeti', cardCount > 0 && `${cardCount} kartı`, quizCount > 0 && `${quizCount} sorusu`]
      .filter(Boolean)
      .join(', ');

  return (
    <Modal open={isOpen} onClose={closeWithReset} labelledBy="ai-title" className="max-w-2xl overflow-hidden">
      {importWarnings.length ? (
        <div className="p-6">
          <h2 id="ai-title" className="font-serif text-xl">
            İçe aktarıldı
          </h2>
          <p className="mt-2 text-sm text-mute">Bazı öğeler alınamadı:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {importWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              data-autofocus
              onClick={closeWithReset}
              className="min-h-11 rounded-sm bg-ink px-5 text-sm text-page"
            >
              Özeti gör
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-rule py-1 pl-6 pr-2">
            <h2 id="ai-title" className="font-serif text-xl">
              AI Sihirbazı
            </h2>
            <button
              type="button"
              onClick={closeWithReset}
              aria-label="Kapat"
              className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="custom-scrollbar max-h-[calc(100dvh-8rem)] space-y-6 overflow-y-auto p-6">
            <section aria-labelledby="ai-step-1">
              <h3 id="ai-step-1" className={stepLabel}>
                1 · Seviyeni seç, isteği kopyala
              </h3>
              <div role="group" aria-label="Seviye" className="mt-3 flex flex-wrap gap-2">
                {EXAM_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={selectedLevel === level}
                    onClick={() => setSelectedLevel(level)}
                    className={`min-h-9 rounded-full border px-3 text-sm ${selectedLevel === level ? 'border-ribbon text-ribbon' : 'border-rule text-mute hover:border-mute hover:text-ink'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="min-h-11 rounded-sm border border-ink px-4 text-sm text-ink hover:bg-page-2"
                >
                  İsteği kopyala
                </button>
                <p role="status" className="text-sm text-ok">
                  {successMsg}
                </p>
              </div>
              {showPromptText && (
                <div className="mt-3">
                  <p className="text-sm text-ribbon">Otomatik kopyalanamadı; aşağıdaki metni seçip kopyala.</p>
                  <textarea
                    readOnly
                    aria-label="Yapay zekâ isteği"
                    value={promptTemplate}
                    onFocus={(e) => e.currentTarget.select()}
                    className="custom-scrollbar mt-2 h-32 w-full resize-none rounded-sm border border-mute bg-page-2 p-3 font-mono text-xs text-ink"
                  />
                </div>
              )}
              <p className="mt-3 text-sm leading-relaxed text-mute">
                İsteği ChatGPT, Gemini ya da Claude gibi bir yapay zekâ sohbetine yapıştır. Cevaptaki kod bloğunu
                köşesindeki &ldquo;Kopyala&rdquo; düğmesiyle kopyalayıp aşağıya yapıştır.
              </p>
              {isDocument && (
                <p className="mt-2 border-l-2 border-ribbon pl-3 text-sm leading-relaxed text-ink">
                  <span className="font-medium">Tavsiye:</span> PDF dosyanı da yapay zekâ sohbetine eklersen içerik
                  doğrudan belgeden üretilir, çok daha sağlıklı bir sonuç alırsın. Eklemezsen yapay zekâ yalnızca
                  başlığa göre içerik üretir.
                </p>
              )}
            </section>

            <section aria-labelledby="ai-step-2">
              <label id="ai-step-2" htmlFor="ai-response" className={stepLabel}>
                2 · Yapay zekânın cevabını yapıştır
              </label>
              <textarea
                id="ai-response"
                value={aiResponse}
                onChange={(e) => setAiResponse(e.target.value)}
                placeholder="Yapay zekânın cevabını (kod bloğuyla ya da bloksuz) buraya yapıştır…"
                aria-invalid={errorMsg ? true : undefined}
                aria-describedby={errorMsg ? 'ai-error' : undefined}
                className="custom-scrollbar mt-3 min-h-35 w-full resize-y rounded-sm border border-mute bg-page-2 p-3 font-mono text-xs text-ink placeholder:text-mute focus:border-ribbon"
              />
              {errorMsg && (
                <p id="ai-error" role="alert" className="mt-2 text-sm text-ribbon">
                  {errorMsg}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleParseJSON}
                  className="min-h-11 rounded-sm bg-ink px-5 text-sm text-page hover:opacity-90"
                >
                  İçerikleri aktar
                </button>
              </div>
            </section>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingImport !== null}
        title="Mevcut içerik değiştirilsin mi?"
        confirmLabel="Değiştir"
        onConfirm={() => {
          const pending = pendingImport;
          setPendingImport(null);
          if (pending) applyImport(pending.result);
        }}
        onCancel={() => setPendingImport(null)}
      >
        <p>
          Bu içeriğin {shownImport?.existing || 'mevcut içeriği'} yenileriyle değiştirilecek; kart ilerlemen ve soru
          cevapların sıfırlanır. Notların etkilenmez.
        </p>
      </ConfirmDialog>
    </Modal>
  );
};
