import { create } from 'zustand';
import type { AppState } from '@/store/types';
import { createContentSlice } from '@/store/slices/contentSlice';
import { createStudySlice } from '@/store/slices/studySlice';
import { createHistorySlice } from '@/store/slices/historySlice';
import { createPomodoroSlice } from '@/store/slices/pomodoroSlice';
import { createUiSlice } from '@/store/slices/uiSlice';
import { createInitData } from '@/store/initData';

export type { AppState } from '@/store/types';

export const useStore = create<AppState>()((...a) => ({
  ...createContentSlice(...a),
  ...createStudySlice(...a),
  ...createHistorySlice(...a),
  ...createPomodoroSlice(...a),
  ...createUiSlice(...a),
  ...createInitData(...a),
}));
