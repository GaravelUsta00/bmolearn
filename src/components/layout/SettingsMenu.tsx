'use client';

import React, { useId, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { downloadBackup, parseBackup } from '@/lib/backup';
import { useBackupDialog } from '@/components/backup/BackupDialog';

interface SettingsContentProps {
  onInstall: () => void;
}

// Ayarlar menüsünün içeriği; masaüstü popover'ında ve mobil menüde ortak (docs/DESIGN.md §8.2).
export const SettingsContent = ({ onInstall }: SettingsContentProps) => {
  const { blueLight, setBlueLight } = useStore();
  const sliderId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = parseBackup(await file.text());
    if (result.ok) useBackupDialog.getState().open(result.backup);
    else useBackupDialog.getState().fail(result.error);
  };

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
        <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">Verilerini taşı</h3>
        <p className="mt-1 text-xs leading-relaxed text-mute">
          Notların yalnızca bu cihazda. Yedeği indirip başka bir tarayıcıya ya da cihaza yükleyebilirsin.
        </p>
        <div className="mt-2 flex gap-4">
          <button
            type="button"
            onClick={() => downloadBackup()}
            className="min-h-11 text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-mute"
          >
            Yedeği indir
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-11 text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-mute"
          >
            Yedeği yükle
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Yedek dosyası seç"
            onChange={handleFile}
          />
        </div>
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
