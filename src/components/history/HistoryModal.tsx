'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  Play,
  ArrowRight,
  History,
  CheckCircle2,
  CalendarDays,
  FileText,
  AlignLeft,
  ListVideo,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { forgetAllDocuments, forgetDocuments, openHistoryDocument } from '@/lib/openDocument';
import type { HistoryItem } from '@/types';

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

export const HistoryModal = ({ showHistory, setShowHistory }: HistoryModalProps) => {
  const { history, setContentConfig, clearHistory, deleteHistoryItem, setView } = useStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!showHistory) setSelectedPlaylist(null);
  }, [showHistory]);

  if (!showHistory) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plate/60 p-4 animate-fade"
      onClick={() => setShowHistory(false)}
    >
      <div
        className={`w-full max-w-5xl h-[85vh] flex flex-col bg-paper border border-rule rounded-sm shadow-page overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 sm:p-6 border-b border-rule flex justify-between items-center bg-page-2 shrink-0`}>
          <div className="flex items-center gap-3">
            {selectedPlaylist && (
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="p-1.5 rounded-sm bg-page border border-rule text-mute hover:text-ribbon transition-colors"
              >
                <ArrowRight size={18} className="rotate-180" />
              </button>
            )}
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-ink">
              <History className="text-ribbon" /> {selectedPlaylist ? 'Koleksiyon Detayı' : 'Geçmiş Kitaplığı'}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {!selectedPlaylist && (
              <button
                onClick={() => {
                  clearHistory();
                  void forgetAllDocuments();
                }}
                className="text-xs font-semibold text-ribbon hover:bg-ribbon/10 px-2 sm:px-3 py-1.5 rounded-sm transition-colors"
              >
                Tümünü Temizle
              </button>
            )}
            <button onClick={() => setShowHistory(false)} className={`text-mute hover:text-ink transition-colors`}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-paper relative">
          {selectedPlaylist ? (
            <div className="flex flex-col h-full animate-fade">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-page p-4 sm:p-5 rounded-sm border border-rule shadow-page gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-28 h-16 sm:w-32 sm:h-20 rounded-sm overflow-hidden shadow-page shrink-0 border border-rule">
                    <img
                      src={`https://img.youtube.com/vi/${selectedPlaylist.contentId}/hqdefault.jpg`}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-plate/40 flex items-center justify-center">
                      <ListVideo size={24} className="text-page" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-ink leading-tight">{selectedPlaylist.title}</h3>
                    <p className="text-xs text-mute mt-1.5 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-ok" /> {selectedPlaylist.playlistItems?.length || 0} Video
                      Tamamlandı
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setContentConfig({
                      id: selectedPlaylist.contentId,
                      type: 'video',
                      title: selectedPlaylist.title,
                      pId: selectedPlaylist.pId,
                    });
                    setShowHistory(false);
                    setView('app');
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-ribbon hover:bg-ribbon/90 text-page text-xs font-bold rounded-sm transition-all flex justify-center items-center gap-2"
                >
                  <Play size={14} fill="currentColor" /> Kaldığın Yerden Devam
                </button>
              </div>

              <h4 className="text-xs font-bold text-mute uppercase tracking-wider mt-6 mb-3 ml-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> İzleme Geçmişin
              </h4>
              <div className="flex flex-col gap-2 pb-4">
                {selectedPlaylist.playlistItems?.map((v, i) => (
                  <button
                    key={v.contentId + i}
                    onClick={() => {
                      setContentConfig({ id: v.contentId, type: 'video', title: v.title, pId: selectedPlaylist.pId });
                      setShowHistory(false);
                      setView('app');
                    }}
                    className={`w-full text-left p-3 sm:p-4 rounded-sm border ${v.contentId === selectedPlaylist.contentId ? 'border-ribbon/50 bg-ribbon/10' : 'border-rule bg-page hover:border-ribbon/30 hover:bg-ink/5'} transition-all flex items-center gap-4 group`}
                  >
                    <div className="relative w-24 h-14 sm:w-28 sm:h-16 rounded-sm overflow-hidden shrink-0 shadow-page">
                      <img
                        src={`https://img.youtube.com/vi/${v.contentId}/default.jpg`}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      {v.contentId === selectedPlaylist.contentId && (
                        <div className="absolute inset-0 border-2 border-ribbon rounded-sm"></div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p
                        className={`text-xs sm:text-sm font-semibold truncate ${v.contentId === selectedPlaylist.contentId ? 'text-ribbon' : 'text-ink'}`}
                      >
                        {v.title}
                      </p>
                      <p className="text-[10px] text-mute mt-1.5 flex items-center gap-1.5">
                        <CalendarDays size={10} /> {new Date(v.timestamp).toLocaleDateString('tr-TR')} -{' '}
                        {new Date(v.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {v.contentId === selectedPlaylist.contentId && (
                      <span className="shrink-0 text-[10px] font-bold bg-ribbon text-page px-2.5 py-1 rounded-sm shadow-page">
                        Son İzlenen
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full text-mute gap-3 opacity-60`}>
              <History size={48} />
              <p className="text-sm font-medium">Henüz geçmiş kaydı yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  className={`relative group cursor-pointer rounded-sm overflow-hidden border border-rule bg-page hover:border-ribbon/50 transition-all shadow-page flex flex-col h-full`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHistoryItem(item.id);
                      if (item.type === 'document') void forgetDocuments([item.contentId]);
                    }}
                    className="absolute top-2 right-2 z-30 p-2 rounded-full bg-ribbon text-page opacity-0 group-hover:opacity-100 transition-all"
                    title="Geçmişi ve Verileri Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                  {item.type === 'playlist' && (
                    <div className="absolute top-2 left-2 z-20 bg-ribbon text-page text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 shadow-page">
                      <ListVideo size={12} /> Koleksiyon
                    </div>
                  )}
                  <div
                    className="flex-1 flex flex-col"
                    onClick={() => {
                      if (item.type === 'playlist') {
                        setSelectedPlaylist(item);
                      } else if (item.type === 'video') {
                        setContentConfig({ id: item.contentId, type: 'video', title: item.title, pId: item.pId });
                        setShowHistory(false);
                        setView('app');
                      } else {
                        setShowHistory(false);
                        void openHistoryDocument(item.contentId, item.title);
                      }
                    }}
                  >
                    {item.type === 'video' || item.type === 'playlist' ? (
                      <div className="w-full aspect-video bg-plate relative overflow-hidden border-b border-rule shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${item.contentId}/hqdefault.jpg`}
                          alt="thumbnail"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 bg-plate/20 group-hover:bg-transparent transition-colors"></div>
                        <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-ribbon text-page opacity-0 group-hover:opacity-100 transition-all shadow-page">
                          {item.type === 'playlist' ? <ListVideo size={14} /> : <Play size={14} fill="currentColor" />}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-page-2 flex items-center justify-center relative overflow-hidden border-b border-rule shrink-0">
                        <FileText size={40} className="text-mute group-hover:text-ribbon transition-colors" />
                        <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-ribbon text-page opacity-0 group-hover:opacity-100 transition-all shadow-page">
                          <AlignLeft size={14} />
                        </div>
                      </div>
                    )}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs font-semibold line-clamp-2 leading-snug text-ink group-hover:text-ribbon transition-colors">
                        {item.title}
                      </p>
                      {item.type === 'playlist' && (
                        <p className="text-[10px] text-mute mt-2 flex items-center gap-1">
                          <CheckCircle2 size={10} /> {item.playlistItems?.length || 0} Video Tamamlandı
                        </p>
                      )}
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
