'use client';

import { useId } from 'react';
import { X } from 'lucide-react';
import { RADIO_STATIONS } from '@/constants';
import type { RadioStation } from '@/types';

interface RadioWidgetProps {
  showMusicWidget: boolean;
  setShowMusicWidget: (show: boolean) => void;
  activeStation: RadioStation;
  isMusicPlaying: boolean;
  musicVolume: number;
  setMusicVolume: (val: number) => void;
  toggleRadioPlay: () => void;
  changeStation: (station: RadioStation) => void;
  error: string | null;
}

// Durum metinle gösterilir ("Çalıyor" / "Duraklatıldı"); ekolayzer animasyonu yok (DESIGN §8.5).
export const RadioWidget = ({
  showMusicWidget,
  setShowMusicWidget,
  activeStation,
  isMusicPlaying,
  musicVolume,
  setMusicVolume,
  toggleRadioPlay,
  changeStation,
  error,
}: RadioWidgetProps) => {
  const volumeId = useId();
  if (!showMusicWidget) return null;

  return (
    <section
      aria-label="Odak radyosu"
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] animate-fade flex-col overflow-hidden rounded-sm border border-rule bg-page text-ink shadow-page sm:bottom-6 sm:right-6 sm:w-80"
    >
      <header className="flex items-center justify-between border-b border-rule py-1 pl-4 pr-1">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Odak radyosu</h2>
        <button
          type="button"
          onClick={() => setShowMusicWidget(false)}
          aria-label="Radyoyu kapat"
          className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>

      <div className="px-4 pb-4 pt-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em]" aria-live="polite">
          {isMusicPlaying ? (
            <span className="text-ribbon">Çalıyor</span>
          ) : (
            <span className="text-mute">Duraklatıldı</span>
          )}
        </p>
        <h3 className="mt-1 truncate font-serif text-xl leading-snug">{activeStation.title}</h3>
        <p className="text-sm text-mute">{activeStation.category}</p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-ribbon">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={toggleRadioPlay}
            className="min-h-11 shrink-0 rounded-sm border border-mute px-4 text-sm hover:border-ink"
          >
            {isMusicPlaying ? 'Duraklat' : 'Çal'}
          </button>
          <div className="flex-1">
            <label htmlFor={volumeId} className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Ses</span>
              <span className="font-mono text-[11px] tabular-nums text-mute">{musicVolume}</span>
            </label>
            <input
              id={volumeId}
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseInt(e.target.value))}
              className="w-full accent-ribbon"
            />
          </div>
        </div>
      </div>

      <ul className="custom-scrollbar max-h-48 overflow-y-auto border-t border-rule py-1">
        {RADIO_STATIONS.map((station) => {
          const active = activeStation.id === station.id;
          return (
            <li key={station.id}>
              <button
                type="button"
                onClick={() => changeStation(station)}
                aria-current={active ? 'true' : undefined}
                className={`flex min-h-11 w-full flex-col items-start border-l-2 px-4 py-2 text-left hover:bg-ink/5 ${active ? 'border-ribbon' : 'border-transparent'}`}
              >
                <span className={`text-sm ${active ? 'font-serif italic text-ink' : 'text-ink'}`}>{station.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{station.category}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
