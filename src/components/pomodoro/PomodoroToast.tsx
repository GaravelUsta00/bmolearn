'use client';

import { X, Coffee, Brain } from 'lucide-react';

interface PomodoroToastProps {
  message: string;
  type: 'focus' | 'break' | null;
  isVisible: boolean;
  onClose: () => void;
}

export const PomodoroToast = ({ message, type, isVisible, onClose }: PomodoroToastProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] transition-opacity duration-150 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className={`flex items-center gap-3 px-6 py-3.5 rounded-full shadow-page border ${type === 'break' ? 'bg-ink border-ink text-page' : 'bg-ribbon border-ribbon text-page'}`}
      >
        {type === 'break' ? <Coffee size={20} /> : <Brain size={20} />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-page/20 rounded-full transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
