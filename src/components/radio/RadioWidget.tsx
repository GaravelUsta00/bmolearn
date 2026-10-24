'use client';

import { Volume2, Music, X, Pause, Play, Radio, PlayCircle } from 'lucide-react';
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
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/10 backdrop-blur-xl z-50 overflow-hidden flex flex-col animate-scale-in`}
    >
      <div
        className={`px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b border-[var(--border)] bg-[var(--card-muted)]`}
      >
        <span className="text-sm font-bold flex items-center gap-2 text-[var(--text)]">
          <Radio size={16} className="text-[#FF8C00]" /> Odak Radyosu
        </span>
        <button
          onClick={() => setShowMusicWidget(false)}
          className={`text-[var(--text-muted)] hover:text-[var(--text)] transition-colors`}
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4 sm:p-5 flex flex-col items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--card-solid)] border-2 border-[#FF8C00]/30 flex items-center justify-center shadow-lg shadow-[#FF8C00]/10 relative">
          {isMusicPlaying ? (
            <div className="flex items-end gap-1 h-5 sm:h-6">
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-1"></div>
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-2"></div>
              <div className="w-1 sm:w-1.5 bg-[#FF8C00] rounded-t-sm animate-eq-3"></div>
            </div>
          ) : (
            <Music className="text-[var(--text-muted)]" size={20} />
          )}
        </div>
        <div className="text-center w-full px-2">
          <h3 className="font-bold text-sm truncate text-[var(--text)]">{activeStation.title}</h3>
          <p className={`text-xs text-[var(--text-muted)] mt-1`}>{activeStation.category}</p>
        </div>
        <div className="w-full flex items-center gap-3 sm:gap-4 mt-2">
          <button
            onClick={toggleRadioPlay}
            className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-90 shadow-lg ${isMusicPlaying ? 'bg-[var(--card-solid)] text-[var(--text)] border border-[var(--border)]' : `bg-[#FF8C00] text-white shadow-[#FF8C00]/20`}`}
          >
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
          <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-[var(--card-muted)] p-2.5 sm:p-3 rounded-2xl border border-[var(--border)]">
            <Volume2 size={16} className="text-[var(--text-muted)]" />
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[#FF8C00]"
            />
          </div>
        </div>
      </div>
      <div
        className={`border-t border-[var(--border)] max-h-48 overflow-y-auto custom-scrollbar p-2 bg-[var(--card-solid)]`}
      >
        {RADIO_STATIONS.map((station) => (
          <button
            key={station.id}
            onClick={() => changeStation(station)}
            className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all ${activeStation.id === station.id ? 'bg-[var(--primary-muted)] border border-[#FF8C00]/30' : `hover:bg-[var(--hover-bg)] border border-transparent`}`}
          >
            <div className="flex flex-col items-start text-left">
              <span
                className={`text-sm font-semibold ${activeStation.id === station.id ? 'text-[#FF8C00]' : 'text-[var(--text)]'}`}
              >
                {station.title}
              </span>
              <span className={`text-[10px] uppercase tracking-wider text-[var(--text-muted)]`}>
                {station.category}
              </span>
            </div>
            {activeStation.id === station.id && isMusicPlaying && <PlayCircle size={14} className="text-[#FF8C00]" />}
          </button>
        ))}
      </div>
    </div>
  );
};
