'use client';

import { useId } from 'react';
import { useStore } from '@/store/useStore';

interface SettingsContentProps {
  onInstall: () => void;
}

// Ayarlar menüsünün içeriği; masaüstü popover'ında ve mobil menüde ortak (docs/DESIGN.md §8.2).
export const SettingsContent = ({ onInstall }: SettingsContentProps) => {
  const { blueLight, setBlueLight } = useStore();
  const sliderId = useId();

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={sliderId} className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Mavi ışık filtresi</span>
          <span className="font-mono text-xs tabular-nums text-ink">{blueLight}%</span>
        </label>
        <input
          id={sliderId}
          type="range"
          min="0"
          max="100"
          value={blueLight}
          onChange={(e) => setBlueLight(parseInt(e.target.value))}
          className="mt-2 w-full accent-ribbon"
        />
        <p className="mt-1 text-xs text-mute">Göz yorgunluğunu azaltmak için ekranı sıcak tona çeker.</p>
      </div>
      <div className="border-t border-rule pt-3">
        <button
          type="button"
          onClick={onInstall}
          className="min-h-11 w-full text-left text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-mute"
        >
          Uygulamayı yükle
        </button>
      </div>
    </div>
  );
};
