import { create } from 'zustand';
import type { ParsedBackup } from '@/lib/backup';

export interface BackupDialogState {
  /** Kapanınca backup/error silinmez: kapanış solması sürerken içerik görünür kalır. */
  isOpen: boolean;
  backup: ParsedBackup | null;
  error: string | null;
  open: (backup: ParsedBackup) => void;
  fail: (error: string) => void;
  close: () => void;
}

// Ayarlar popover'ı kapansa da pencere açık kalsın diye kendi küçük store'u var.
export const useBackupDialog = create<BackupDialogState>((set) => ({
  isOpen: false,
  backup: null,
  error: null,
  open: (backup) => set({ isOpen: true, backup, error: null }),
  fail: (error) => set({ isOpen: true, backup: null, error }),
  close: () => set({ isOpen: false }),
}));
