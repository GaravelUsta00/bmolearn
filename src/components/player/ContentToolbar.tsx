'use client';

import React from 'react';
import { X, Upload } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { extractYTId, extractPlaylistId } from '@/lib/youtube';
import type { Setter } from '@/types';

interface ContentToolbarProps {
  videoUrlInput: string;
  setVideoUrlInput: Setter<string>;
  setShowPlaylistSidebar: Setter<boolean>;
}

export const ContentToolbar = ({ videoUrlInput, setVideoUrlInput, setShowPlaylistSidebar }: ContentToolbarProps) => {
  const { setContentConfig, setPlaylistItems } = useStore();

  const handleDashboardUrlChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;

    const vId = extractYTId(videoUrlInput);
    const pId = extractPlaylistId(videoUrlInput);

    if (vId || pId) {
      setContentConfig({ id: vId || '', type: 'video', pId, title: 'YouTube Video' });
      setVideoUrlInput('');
      if (pId) setShowPlaylistSidebar(true);
    } else {
      const id = 'web_' + Date.now();
      setContentConfig({ id, type: 'document', title: 'Web Kaynağı', url: videoUrlInput });
      setVideoUrlInput('');
      setPlaylistItems([]);
    }
  };

  const handleDashboardFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = 'doc_' + Date.now();
    const objUrl = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setContentConfig({ id, type: 'document', title: file.name, url: objUrl, fileType: ext });
    setPlaylistItems([]);
  };

  return (
    <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5">
      <form
        onSubmit={handleDashboardUrlChange}
        className={`flex-1 flex p-1.5 sm:p-2 pl-4 sm:pl-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm focus-within:border-[#FF8C00]/50 transition-colors`}
      >
        <input
          type="text"
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          placeholder="Yeni bir link yapıştırın..."
          className={`flex-1 bg-transparent border-none outline-none text-[var(--text)] text-xs sm:text-sm font-medium w-full`}
        />
        {videoUrlInput && (
          <button
            type="button"
            onClick={() => setVideoUrlInput('')}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-white bg-[#FF8C00] font-bold text-xs sm:text-sm hover:scale-105 transition-transform active:scale-95 shadow-md shadow-[#FF8C00]/20`}
        >
          Değiştir
        </button>
      </form>

      <label className="cursor-pointer shrink-0 px-4 flex items-center justify-center gap-2 rounded-3xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[#FF8C00] hover:border-[#FF8C00]/50 transition-all">
        <Upload size={18} />
        <span className="hidden sm:inline text-xs font-bold">PDF Yükle</span>
        <input type="file" accept=".pdf" className="hidden" onChange={handleDashboardFileUpload} />
      </label>
    </div>
  );
};
