'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Bookshelf } from '@/components/landing/Bookshelf';
import { extractYTId, extractPlaylistId } from '@/lib/youtube';
import type { HistoryItem } from '@/types';

// Yükleme koreografisi yalnızca ilk açılışta oynar (docs/DESIGN.md §7.1).
let hasPlayedIntro = false;

interface LandingPageProps {
  onShowHistory: () => void;
}

export const LandingPage = ({ onShowHistory }: LandingPageProps) => {
  const { setView, setContentConfig, history, addToHistory, setPlaylistItems } = useStore();
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [intro] = useState(() => !hasPlayedIntro);
  useEffect(() => {
    hasPlayedIntro = true;
  }, []);

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    const vId = extractYTId(url);
    const pId = extractPlaylistId(url);

    if (vId || pId) {
      setContentConfig({ id: vId || '', type: 'video', pId, title: 'YouTube Video' });
      setView('app');
    } else {
      // Web adresi dalı Adım 8'de kaldırılacak (ANALYSIS B8); şimdilik davranış aynı.
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

  const openHistoryItem = (item: HistoryItem) => {
    if (item.type === 'video' || item.type === 'playlist') {
      setContentConfig({ id: item.contentId, type: 'video', title: item.title, url: undefined, pId: item.pId });
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
  };

  const rise = intro ? 'animate-rise' : '';
  const fadeUp = (step: number) =>
    intro ? { className: 'animate-fade-up', style: { animationDelay: `${450 + step * 80}ms` } } : {};

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Logo className="text-2xl" />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-12 pt-10 sm:px-10 sm:pt-20">
        <h1 className="font-serif text-[clamp(3rem,9vw,8rem)] font-normal leading-[0.95] tracking-tight">
          <span className="block overflow-hidden pb-[0.08em]">
            <span className={`block ${rise}`}>Sadece</span>
          </span>{' '}
          <span className="block overflow-hidden pb-[0.12em]">
            <em className={`block italic text-ribbon ${rise}`} style={intro ? { animationDelay: '90ms' } : undefined}>
              odaklan.
            </em>
          </span>
        </h1>

        <div {...fadeUp(0)}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-mute sm:text-xl">
            Bir YouTube videosu, oynatma listesi ya da PDF aç. Notların, özetin, kartların ve soruların yanında
            beklesin.
          </p>
        </div>

        <div {...fadeUp(1)}>
          <form onSubmit={handleStart} className="mt-12 flex max-w-2xl items-end gap-4">
            <label className="flex-1">
              <span className="sr-only">YouTube bağlantısı ya da PDF</span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="YouTube bağlantısı ya da PDF"
                className="w-full border-0 border-b border-mute bg-transparent pb-2 text-base text-ink placeholder:text-mute focus:border-b-2 focus:border-ribbon focus:pb-[7px] focus:outline-none sm:text-xl"
                autoFocus
              />
            </label>
            <button
              type="submit"
              className="min-h-11 rounded-sm bg-ink px-6 text-base text-page transition-opacity hover:opacity-90"
            >
              Aç
            </button>
          </form>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 min-h-11 text-base text-mute underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-mute"
          >
            ya da PDF yükle
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
        </div>

        {history.length > 0 && (
          <section className="mt-20" aria-labelledby="recent-heading">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 id="recent-heading" className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
                Son çalışmalar
              </h2>
              <button
                type="button"
                onClick={onShowHistory}
                className="min-h-11 text-sm text-mute underline decoration-rule underline-offset-4 hover:text-ink"
              >
                Tüm geçmiş
              </button>
            </div>
            <Bookshelf items={history.slice(0, 12)} onOpen={openHistoryItem} />
          </section>
        )}

        <footer className="mt-auto pt-16 text-sm text-mute">Notların ve ilerlemen yalnızca bu cihazda saklanır.</footer>
      </main>
    </div>
  );
};
