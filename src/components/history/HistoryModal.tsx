'use client';

import { useState, useEffect } from 'react';
import { Trash2, X, Play, ArrowRight, History, CheckCircle2, CalendarDays, FileText, AlignLeft, ListVideo } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { HistoryItem } from '@/types';

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

export const HistoryModal = ({ showHistory, setShowHistory }: HistoryModalProps) => {
  const { history, setContentConfig, clearHistory, deleteHistoryItem, setPendingDocReload } = useStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<HistoryItem | null>(null);

  useEffect(() => { if (!showHistory) setSelectedPlaylist(null); }, [showHistory]);

  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowHistory(false)}>
      <div className={`w-full max-w-5xl h-[85vh] flex flex-col bg-[var(--bg)] backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden`} onClick={e => e.stopPropagation()}>
        
        <div className={`p-4 sm:p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card-muted)] shrink-0`}>
          <div className="flex items-center gap-3">
            {selectedPlaylist && (
              <button onClick={() => setSelectedPlaylist(null)} className="p-1.5 rounded-lg bg-[var(--card-solid)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors shadow-sm">
                <ArrowRight size={18} className="rotate-180" />
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[var(--text)]">
              <History className="text-[#FF8C00]" /> {selectedPlaylist ? 'Koleksiyon Detayı' : 'Geçmiş Kitaplığı'}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {!selectedPlaylist && <button onClick={() => { clearHistory(); }} className="text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-muted)] px-2 sm:px-3 py-1.5 rounded-xl transition-colors">Tümünü Temizle</button>}
            <button onClick={() => setShowHistory(false)} className={`text-[var(--text-muted)] hover:text-[var(--text)] transition-colors`}><X size={20} /></button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg)] relative">
          {selectedPlaylist ? (
            <div className="flex flex-col h-full animate-fade-in">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--card-solid)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-sm gap-4">
                   <div className="flex items-center gap-4">
                      <div className="relative w-28 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden shadow-sm shrink-0 border border-[var(--border)]">
                         <img src={`https://img.youtube.com/vi/${selectedPlaylist.contentId}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><ListVideo size={24} className="text-white"/></div>
                      </div>
                      <div>
                         <h3 className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">{selectedPlaylist.title}</h3>
                         <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[var(--success)]"/> {selectedPlaylist.playlistItems?.length || 0} Video Tamamlandı</p>
                      </div>
                   </div>
                   <button onClick={() => {
                      setContentConfig({ id: selectedPlaylist.contentId, type: 'video', title: selectedPlaylist.title, pId: selectedPlaylist.pId });
                      setShowHistory(false);
                   }} className="w-full sm:w-auto px-5 py-3 bg-[#FF8C00] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#FF8C00]/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                      <Play size={14} fill="currentColor" /> Kaldığın Yerden Devam
                   </button>
               </div>
               
               <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-6 mb-3 ml-2 flex items-center gap-2"><CheckCircle2 size={14}/> İzleme Geçmişin</h4>
               <div className="flex flex-col gap-2 pb-4">
                  {selectedPlaylist.playlistItems?.map((v, i) => (
                     <button key={v.contentId + i} onClick={() => {
                         setContentConfig({ id: v.contentId, type: 'video', title: v.title, pId: selectedPlaylist.pId });
                         setShowHistory(false);
                     }} className={`w-full text-left p-3 sm:p-4 rounded-2xl border ${v.contentId === selectedPlaylist.contentId ? 'border-[#FF8C00]/50 bg-[var(--primary-muted)]' : 'border-[var(--border)] bg-[var(--card-solid)] hover:border-[#FF8C00]/30 hover:bg-[var(--hover-bg)]'} transition-all flex items-center gap-4 group shadow-sm`}>
                        <div className="relative w-24 h-14 sm:w-28 sm:h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                           <img src={`https://img.youtube.com/vi/${v.contentId}/default.jpg`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                           {v.contentId === selectedPlaylist.contentId && <div className="absolute inset-0 border-2 border-[#FF8C00] rounded-lg"></div>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className={`text-xs sm:text-sm font-semibold truncate ${v.contentId === selectedPlaylist.contentId ? 'text-[#FF8C00]' : 'text-[var(--text)]'}`}>{v.title}</p>
                           <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1.5"><CalendarDays size={10}/> {new Date(v.timestamp).toLocaleDateString('tr-TR')} - {new Date(v.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        {v.contentId === selectedPlaylist.contentId && <span className="shrink-0 text-[10px] font-bold bg-[#FF8C00] text-white px-2.5 py-1 rounded-md shadow-sm">Son İzlenen</span>}
                     </button>
                  ))}
               </div>
            </div>
          ) : history.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3 opacity-60`}>
               <History size={48} />
               <p className="text-sm font-medium">Henüz geçmiş kaydı yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map((item, idx) => (
                <div key={item.id} className={`relative group cursor-pointer rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-solid)] hover:border-[#FF8C00]/50 transition-all shadow-sm flex flex-col h-full`}>
                  <button onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }} className="absolute top-2 right-2 z-30 p-2 rounded-full bg-[var(--danger)] text-white opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md" title="Geçmişi ve Verileri Sil"><Trash2 size={14} /></button>
                  {item.type === 'playlist' && (
                     <div className="absolute top-2 left-2 z-20 bg-[#FF8C00] text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                       <ListVideo size={12} /> Koleksiyon
                     </div>
                  )}
                  <div className="flex-1 flex flex-col" onClick={() => { 
                    if (item.type === 'playlist') {
                      setSelectedPlaylist(item);
                    } else if (item.type === 'video') { 
                      setContentConfig({ id: item.contentId, type: 'video', title: item.title, pId: item.pId }); 
                      setShowHistory(false); 
                    } else { 
                      setContentConfig({ id: item.contentId, type: 'document', title: item.title, url: undefined, fileType: undefined }); 
                      setPendingDocReload({ id: item.contentId, title: item.title }); 
                      setShowHistory(false); 
                    }
                  }}>
                    {item.type === 'video' || item.type === 'playlist' ? (
                      <div className="w-full aspect-video bg-black relative overflow-hidden border-b border-[var(--border)] shrink-0">
                        <img src={`https://img.youtube.com/vi/${item.contentId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                          {item.type === 'playlist' ? <ListVideo size={14} /> : <Play size={14} fill="currentColor" />}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-[var(--card-muted)] flex items-center justify-center relative overflow-hidden border-b border-[var(--border)] shrink-0">
                        <FileText size={40} className="text-[var(--text-muted)] group-hover:text-[#FF8C00] transition-colors" />
                        <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg"><AlignLeft size={14} /></div>
                      </div>
                    )}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                       <p className="text-xs font-semibold line-clamp-2 leading-snug text-[var(--text)] group-hover:text-[#FF8C00] transition-colors">{item.title}</p>
                       {item.type === 'playlist' && <p className="text-[10px] text-[var(--text-muted)] mt-2 flex items-center gap-1"><CheckCircle2 size={10}/> {item.playlistItems?.length || 0} Video Tamamlandı</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
