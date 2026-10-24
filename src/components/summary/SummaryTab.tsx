'use client';

import { useState } from 'react';
import { Bookmark, AlignLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { renderMarkdown } from '@/lib/markdown';

interface SummaryTabProps {
  activeContentId: string;
}

export const SummaryTab = ({ activeContentId }: SummaryTabProps) => {
  const { summaries, addNote } = useStore();
  const summary = summaries[activeContentId];
  const [selectedText, setSelectedText] = useState(""); 
  const [showPopup, setShowPopup] = useState(false);

  const handlePointerUp = () => { 
    setTimeout(() => { 
      const text = window.getSelection()?.toString().trim(); 
      if (text && text.length > 0) { setSelectedText(text); setShowPopup(true); } 
      else setShowPopup(false); 
    }, 50); 
  };
  
  const handleAddToNotes = () => { 
    addNote({ id: Date.now(), contentId: activeContentId, text: `> ${selectedText}`, time: 0 }); 
    setShowPopup(false); 
    window.getSelection()?.removeAllRanges(); 
  };

  if (!summary) return (
    <div className={`text-center py-16 text-[var(--text-muted)] flex flex-col items-center gap-4 animate-fade-in`}>
      <div className={`p-4 rounded-full bg-[var(--card-solid)]`}><AlignLeft size={32} className="opacity-50" /></div>
      <p className="text-xs sm:text-sm">Bu içerik için henüz özet yok.<br/>AI sekmesinden oluşturabilirsiniz.</p>
    </div>
  );
  
  return (
    <div onPointerUp={handlePointerUp} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar text-sm leading-relaxed text-[var(--text-secondary)] relative animate-fade-in">
      {showPopup && (
        <div className="sticky top-0 z-20 flex justify-center mb-4 animate-fade-in-up">
          <button onPointerDown={(e) => { e.preventDefault(); handleAddToNotes(); }} className="px-4 py-2 bg-[#FF8C00] text-white font-bold rounded-2xl shadow-xl shadow-[#FF8C00]/30 flex items-center gap-2 active:scale-95 transition-transform"><Bookmark size={16} /> Seçili Metni Notlara Ekle</button>
        </div>
      )}
      <div dangerouslySetInnerHTML={renderMarkdown(summary)} />
    </div>
  );
};
