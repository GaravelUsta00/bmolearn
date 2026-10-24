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
    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
      <div className={`flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl border backdrop-blur-xl ${type === 'break' ? 'bg-[#3b82f6] border-blue-400 text-white shadow-blue-500/30' : 'bg-[#FF8C00] border-orange-400 text-white shadow-[#FF8C00]/30'}`}>
        {type === 'break' ? <Coffee size={20} className="animate-bounce" /> : <Brain size={20} className="animate-pulse" />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"><X size={16} /></button>
      </div>
    </div>
  );
};
