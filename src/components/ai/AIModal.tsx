'use client';

import { useState } from 'react';
import { X, Sparkles, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { EXAM_LEVELS } from '@/constants';
import type { ContentConfig, StudyTab, Setter } from '@/types';
import { newId } from '@/lib/id';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContentId: string;
  contentConfig: ContentConfig;
  setActiveTab: Setter<StudyTab>;
}

export const AIModal = ({ isOpen, onClose, activeContentId, contentConfig, setActiveTab }: AIModalProps) => {
  const { replaceContentAI } = useStore();
  const [aiResponse, setAiResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>(EXAM_LEVELS[0]);

  if (!isOpen) return null;

  const promptTemplate = `Sen bir eğitim asistanısın. Aşağıdaki kurallara KESİNLİKLE uy:
1. İçeriğin dili neyse tüm yanıtı O DİLDE ver (İngilizce ise İngilizce, Türkçe ise Türkçe).
2. Yanıtın SADECE geçerli bir JSON objesi olmalıdır. Ekstra metin veya açıklama KULLANMA.
3. Seviye: ${selectedLevel}

FORMAT:
{
  "summary": "# Başlık\\nDetaylı Markdown özet buraya gelecek.",
  "cards": [
    { "question": "Soru 1?", "answer": "Cevap 1" }
  ],
  "quiz": [
    {
      "question": "Çoktan Seçmeli Soru 1?",
      "options": { "A": "Seçenek A", "B": "Seçenek B", "C": "Seçenek C", "D": "Seçenek D" },
      "correct": "A"
    }
  ]
}

BAŞLIK: ${contentConfig.title}
${contentConfig.type === 'video' ? `LİNK: https://www.youtube.com/watch?v=${activeContentId}` : ''}`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate);
    setSuccessMsg('Kopyalandı! Yapay zekaya yapıştırın.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleParseJSON = () => {
    setErrorMsg('');
    if (!aiResponse.trim()) return setErrorMsg('Lütfen AI cevabını yapıştırın.');
    try {
      let cleanJsonStr = aiResponse;
      const startIndex = cleanJsonStr.indexOf('{');
      const endIndex = cleanJsonStr.lastIndexOf('}');
      if (startIndex === -1 || endIndex === -1) throw new Error('JSON objesi bulunamadı');

      cleanJsonStr = cleanJsonStr.substring(startIndex, endIndex + 1);
      cleanJsonStr = cleanJsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      const parsed = JSON.parse(cleanJsonStr);

      if (!parsed.summary && !parsed.cards && !parsed.quiz) throw new Error('Format uyuşmazlığı');

      const newCards = (parsed.cards || []).map((c: any) => ({
        id: newId(),
        contentId: activeContentId,
        question: c.question || 'Soru bulunamadı',
        answer: c.answer || 'Cevap bulunamadı',
        learned: false,
      }));
      const newQuiz = (parsed.quiz || []).map((q: any) => ({
        id: newId(),
        contentId: activeContentId,
        question: q.question || 'Soru bulunamadı',
        options: q.options || { A: 'A', B: 'B', C: 'C', D: 'D' },
        correct: q.correct || 'A',
      }));

      replaceContentAI(activeContentId, newCards, newQuiz, parsed.summary || '');
      setAiResponse('');
      setActiveTab('summary');
      onClose();
    } catch (e) {
      setErrorMsg('Geçersiz format. Lütfen sadece JSON formatını yapıştırın.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-plate/60 p-4 animate-fade" onClick={onClose}>
      <div
        className="w-full max-w-2xl flex flex-col bg-page border border-rule rounded-sm shadow-page overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-4 border-b border-rule flex justify-between items-center bg-page-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-ink/5 text-ink">
              <Sparkles size={16} />
            </div>
            <h2 className="text-sm font-bold text-ink">Kompakt AI Sihirbazı</h2>
          </div>
          <button onClick={onClose} className="text-mute hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-5 bg-paper">
          <div className="flex flex-col gap-3 bg-page-2 p-4 rounded-sm border border-rule">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-ribbon flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-ribbon/10 flex items-center justify-center text-[10px]">
                  1
                </span>{' '}
                Seviye Seç & Kopyala
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 text-[10px] font-bold bg-ribbon text-page px-3 py-1.5 rounded-sm transition-transform"
              >
                <Copy size={12} /> İsteği Kopyala
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAM_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`text-[10px] px-2.5 py-1 rounded-sm border font-semibold transition-colors ${selectedLevel === level ? 'bg-ribbon/10 border-ribbon text-ribbon' : 'bg-page border-rule text-mute hover:border-ribbon/50'}`}
                >
                  {level}
                </button>
              ))}
            </div>
            {successMsg && (
              <p className="text-[10px] text-ok font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> {successMsg}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-ink flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-ink/5 flex items-center justify-center text-[10px]">2</span> AI
              Cevabını (JSON) Yapıştır
            </span>
            <textarea
              value={aiResponse}
              onChange={(e) => setAiResponse(e.target.value)}
              placeholder="Yapay zekanın verdiği { ile başlayıp } ile biten JSON formatlı cevabı buraya yapıştırın..."
              className="w-full bg-page border border-rule rounded-sm p-3 text-xs text-ink outline-none focus:border-ink resize-none custom-scrollbar min-h-35"
            ></textarea>
            {errorMsg && (
              <p className="text-[10px] text-ribbon font-bold flex items-center gap-1">
                <AlertCircle size={12} /> {errorMsg}
              </p>
            )}
            <button
              onClick={handleParseJSON}
              className="w-full py-3 rounded-sm bg-ink text-page font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 transition-all mt-auto"
            >
              <Sparkles size={14} /> İçerikleri Sisteme Aktar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
