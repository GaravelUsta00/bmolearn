'use client';

import { Moon, Sun } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/store/useStore';

interface ThemeToggleProps {
  className?: string;
}

// Düğme, geçilecek temanın adını gösterir (docs/DESIGN.md §4).
export const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  const { theme, setTheme } = useStore(useShallow((s) => ({ theme: s.theme, setTheme: s.setTheme })));
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Gece' : 'Gündüz';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${label} temasına geç`}
      className={`inline-flex min-h-11 items-center gap-2 px-2 font-mono text-xs uppercase tracking-[0.12em] text-mute hover:text-ink ${className}`}
    >
      {next === 'dark' ? <Moon size={14} strokeWidth={1.5} /> : <Sun size={14} strokeWidth={1.5} />}
      {label}
    </button>
  );
};
