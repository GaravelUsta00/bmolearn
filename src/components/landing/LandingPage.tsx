'use client';

import React, { useState } from 'react';
import { X, Play, ArrowRight, History, Upload, FileText, AlignLeft, ExternalLink, ListVideo } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { extractYTId, extractPlaylistId } from '@/lib/youtube';

export const LandingPage = () => {
  const { setView, setContentConfig, history, clearHistory, addToHistory, setPlaylistItems } = useStore();
  const [url, setUrl] = useState('');

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    const vId = extractYTId(url);
    const pId = extractPlaylistId(url);

    if (vId || pId) {
      setContentConfig({ id: vId || '', type: 'video', pId, title: 'YouTube Video' });
      setView('app');
    } else {
      const id = 'web_' + Date.now();
      setContentConfig({ id, type: 'document', title: 'Web Kaynağı', url });
      setPlaylistItems([]);
      setView('app');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = 'doc_' + Date.now();
    const objUrl = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setContentConfig({ id, type: 'document', title: file.name, url: objUrl, fileType: ext });
    addToHistory({ contentId: id, title: file.name, timestamp: Date.now(), type: 'document' });
    setPlaylistItems([]);
    setView('app');
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden bg-[var(--bg)] p-4 sm:p-8 transition-colors duration-500`}
    >
      <div className="absolute top-0 left-0 w-full h-10 z-50"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-[#FF8C00] opacity-10 blur-[80px] md:blur-[120px] rounded-full animate-blob pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-blue-500 opacity-5 blur-[80px] md:blur-[120px] rounded-full animate-blob animation-delay-2000 pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-3xl mx-auto animate-fade-in-up">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center animate-float group cursor-default">
            <div className="absolute inset-0 bg-[#FF8C00] rounded-full animate-subtle-glow pointer-events-none"></div>
            <img
              src="/logo.png"
              alt="BMO Learn Logo"
              className="relative w-full h-full object-contain z-10 drop-shadow-xl transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-[var(--text)] drop-shadow-sm">
            BMO <span className="text-[#FF8C00]">Learn</span>
          </h1>
        </div>

        <p
          className={`text-base sm:text-lg md:text-xl font-medium tracking-wide mb-10 md:mb-12 text-[var(--text-muted)] text-center`}
        >
          Sadece odaklan.
        </p>

        <div className="w-full flex flex-col sm:flex-row gap-3 px-2 sm:px-0">
          <form onSubmit={handleStart} className="flex-1 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8C00] to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div
              className={`relative flex items-center p-2 pl-4 sm:pl-6 rounded-3xl bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-2xl transition-colors`}
            >
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="YouTube linki (Playlist dahil) veya Web adresi..."
                className={`flex-1 bg-transparent border-none outline-none text-[var(--text)] text-sm sm:text-base md:text-lg w-full font-medium placeholder-[var(--text-muted)]`}
                autoFocus
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              <button
                type="submit"
                className={`ml-2 p-3 sm:p-4 rounded-2xl bg-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/20 transition-transform active:scale-95 hover:scale-105 flex items-center justify-center`}
              >
                <ArrowRight size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <label className="cursor-pointer flex items-center justify-center gap-2 p-3 sm:p-4 rounded-3xl bg-[var(--primary-muted)] text-[#FF8C00] hover:bg-[#FF8C00]/20 transition-all border border-[#FF8C00]/30 shadow-sm active:scale-95">
              <Upload size={22} />
              <span className="font-bold text-sm sm:text-base hidden sm:inline">PDF Yükle</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-[var(--text-muted)] bg-[var(--card-muted)] px-5 py-3 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="flex items-center gap-1.5">
            <FileText size={14} className="text-[var(--text-muted)]" /> Sadece PDF formatı desteklenmektedir.
          </span>
          <span className="hidden sm:inline text-[var(--border-hover)]">|</span>
          <a
            href="https://www.ilovepdf.com/tr"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--text-muted)] hover:text-[#FF8C00] transition-colors inline-flex items-center gap-1"
          >
            Farklı bir dosyayı PDF&apos;e dönüştür <ExternalLink size={10} />
          </a>
        </div>

        {history.length > 0 && (
          <div className="mt-16 w-full px-2 sm:px-0 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <History size={16} /> Son Çalışmalar
              </h3>
              <button
                onClick={() => {
                  clearHistory();
                }}
                className="text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-muted)] border border-[var(--danger-muted)] px-3 py-1.5 rounded-xl transition-colors w-full sm:w-auto"
              >
                Geçmişi Temizle
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'video' || item.type === 'playlist') {
                      setContentConfig({
                        id: item.contentId,
                        type: 'video',
                        title: item.title,
                        url: undefined,
                        pId: item.pId,
                      });
                      setView('app');
                    } else {
                      setContentConfig({
                        id: item.contentId,
                        type: 'document',
                        title: item.title,
                        url: undefined,
                        fileType: undefined,
                      });
                      useStore.getState().setPendingDocReload({ id: item.contentId, title: item.title });
                      setView('app');
                    }
                  }}
                  className={`relative group cursor-pointer rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-muted)] backdrop-blur-md hover:border-[#FF8C00]/50 transition-all shadow-lg`}
                >
                  {item.type === 'playlist' && (
                    <div className="absolute top-2 left-2 z-20 bg-[#FF8C00] text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                      <ListVideo size={12} /> Koleksiyon
                    </div>
                  )}
                  {item.type === 'video' || item.type === 'playlist' ? (
                    <div className="w-full aspect-video bg-black relative overflow-hidden border-b border-[var(--border)]">
                      <img
                        src={`https://img.youtube.com/vi/${item.contentId}/hqdefault.jpg`}
                        alt="thumbnail"
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg shadow-[#FF8C00]/30">
                        <Play size={14} fill="currentColor" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-[var(--card-solid)] flex items-center justify-center relative overflow-hidden border-b border-[var(--border)]">
                      <FileText
                        size={48}
                        className="text-[var(--text-muted)] group-hover:text-[#FF8C00] transition-colors duration-300"
                      />
                      <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#FF8C00] text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg shadow-[#FF8C00]/30">
                        <AlignLeft size={14} />
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-semibold line-clamp-2 leading-snug text-[var(--text-secondary)] group-hover:text-[#FF8C00] transition-colors">
                      {item.title}
                    </p>
                    {item.type === 'playlist' && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {item.playlistItems?.length || 0} Video İzlendi
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
