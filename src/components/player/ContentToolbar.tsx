'use client';

import React from 'react';
import { X, Upload } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { extractYTId, extractPlaylistId } from '@/lib/youtube';
import type { Setter } from '@/types';
import { documentFileType, toHttpsUrl } from '@/lib/safeInput';

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
      setContentConfig({ id, type: 'document', title: 'Web Kaynağı', url: toHttpsUrl(videoUrlInput) });
      setVideoUrlInput('');
      setPlaylistItems([]);
    }
  };

  const handleDashboardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = 'doc_' + Date.now();
    const objUrl = URL.createObjectURL(file);
    const fileType = await documentFileType(file);
    setContentConfig({ id, type: 'document', title: file.name, url: objUrl, fileType });
    setPlaylistItems([]);
  };

  return (
    <div className="flex gap-2 sm:gap-3">
      <form
        onSubmit={handleDashboardUrlChange}
        className={`flex-1 flex p-1.5 sm:p-2 pl-4 sm:pl-5 rounded-sm bg-page border border-rule shadow-page focus-within:border-ribbon/50 transition-colors`}
      >
        <input
          type="text"
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          placeholder="Yeni bir link yapıştırın..."
          className={`flex-1 bg-transparent border-none outline-none text-ink text-xs sm:text-sm font-medium w-full`}
        />
        {videoUrlInput && (
          <button type="button" onClick={() => setVideoUrlInput('')} className="p-2 text-mute hover:text-ink">
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-sm text-page bg-ribbon font-bold text-xs sm:text-sm transition-transform`}
        >
          Değiştir
        </button>
      </form>

      <label className="cursor-pointer shrink-0 px-4 flex items-center justify-center gap-2 rounded-sm bg-page border border-rule text-mute hover:text-ribbon hover:border-ribbon/50 transition-all">
        <Upload size={18} />
        <span className="hidden sm:inline text-xs font-bold">PDF Yükle</span>
        <input type="file" accept=".pdf" className="hidden" onChange={handleDashboardFileUpload} />
      </label>
    </div>
  );
};
