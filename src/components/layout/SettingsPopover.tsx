'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';

export const SettingsPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { blueLight, setBlueLight } = useStore();
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 sm:p-2.5 rounded-xl ${isOpen ? 'bg-[var(--border)] text-[#FF8C00]' : 'hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#FF8C00]'} transition-colors`}
        title="Görünüm Ayarları"
      >
        <Eye size={18} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-12 right-0 w-64 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-4 z-50 animate-scale-in origin-top-right">
            <h4 className="text-sm font-bold text-[var(--text)] mb-4 border-b border-[var(--border)] pb-2">
              Görünüm Ayarları
            </h4>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] flex justify-between">
                Mavi Işık Filtresi <span>{blueLight}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={blueLight}
                onChange={(e) => setBlueLight(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[#FF8C00]"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Göz yorgunluğunu azaltmak için filtreyi artırın.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
