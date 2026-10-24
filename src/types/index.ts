import type { Dispatch, SetStateAction } from 'react';

export interface Note { id: number; contentId: string; text: string; time: number; }
export interface Flashcard { id: number; contentId: string; question: string; answer: string; learned?: boolean; }
export interface Todo { id: number; text: string; completed: boolean; }
export interface WatchedVideo { contentId: string; title: string; timestamp: number; }
export interface HistoryItem { 
  id: string; 
  contentId: string; 
  title: string; 
  timestamp: number; 
  type: 'video' | 'document' | 'playlist'; 
  pId?: string | null; 
  playlistItems?: WatchedVideo[]; 
}
export interface QuizQuestion { 
  id: number; 
  contentId: string; 
  question: string; 
  options: { A: string; B: string; C: string; D: string }; 
  correct: string; 
  userAnswer?: string; 
}
export interface ContentConfig { 
  id: string; 
  type: 'video' | 'document'; 
  title: string; 
  url?: string; 
  pId?: string | null; 
  fileType?: string; 
}

export type StudyTab = 'notes' | 'summary' | 'flashcards' | 'quiz';
export type TimerMode = 'focus' | 'break';
export interface RadioStation { id: string; title: string; category: string; }
export type Setter<T> = Dispatch<SetStateAction<T>>;
