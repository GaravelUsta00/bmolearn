'use client';

import { Volume2, X, Pause, Play, Radio, PlayCircle } from 'lucide-react';
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
}

export const RadioWidget = ({
  showMusicWidget,
  setShowMusicWidget,
  activeStation,
  isMusicPlaying,
  musicVolume,
  setMusicVolume,
  toggleRadioPlay,
  changeStation,
}: RadioWidgetProps) => {
  if (!showMusicWidget) return null;
  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-sm border border-rule bg-page shadow-page z-50 overflow-hidden flex flex-col animate-fade`}
    >
      <div className={`px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b border-rule bg-page-2`}>
        <span className="text-sm font-bold flex items-center gap-2 text-ink">
          <Radio size={16} className="text-ribbon" /> Odak Radyosu
        </span>
        <button onClick={() => setShowMusicWidget(false)} className={`text-mute hover:text-ink transition-colors`}>
          <X size={16} />
        </button>
      </div>
      <div className="p-4 sm:p-5 flex flex-col items-center gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute" aria-live="polite">
          {isMusicPlaying ? <span className="text-ribbon">Çalıyor</span> : 'Duraklatıldı'}
        </p>
        <div className="text-center w-full px-2">
          <h3 className="font-bold text-sm truncate text-ink">{activeStation.title}</h3>
          <p className={`text-xs text-mute mt-1`}>{activeStation.category}</p>
        </div>
        <div className="w-full flex items-center gap-3 sm:gap-4 mt-2">
          <button
            onClick={toggleRadioPlay}
            className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center transition-transform shadow-page ${isMusicPlaying ? 'bg-page text-ink border border-rule' : `bg-ribbon text-page`}`}
          >
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-page-2 p-2.5 sm:p-3 rounded-sm border border-rule">
            <Volume2 size={16} className="text-mute" />
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseInt(e.target.value))}
              className="w-full h-1.5 bg-rule rounded-sm appearance-none cursor-pointer accent-ribbon"
            />
          </div>
        </div>
      </div>
      <div className={`border-t border-rule max-h-48 overflow-y-auto custom-scrollbar p-2 bg-page`}>
        {RADIO_STATIONS.map((station) => (
          <button
            key={station.id}
            onClick={() => changeStation(station)}
            className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-sm transition-all ${activeStation.id === station.id ? 'bg-ribbon/10 border border-ribbon/30' : `hover:bg-ink/5 border border-transparent`}`}
          >
            <div className="flex flex-col items-start text-left">
              <span className={`text-sm font-semibold ${activeStation.id === station.id ? 'text-ribbon' : 'text-ink'}`}>
                {station.title}
              </span>
              <span className={`text-[10px] uppercase tracking-wider text-mute`}>{station.category}</span>
            </div>
            {activeStation.id === station.id && isMusicPlaying && <PlayCircle size={14} className="text-ribbon" />}
          </button>
        ))}
      </div>
    </div>
  );
};
