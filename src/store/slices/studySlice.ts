import type { SliceCreator, StudySlice } from '@/store/types';

export const createStudySlice: SliceCreator<StudySlice> = (set) => ({
  notes: [],
  flashcards: [],
  quiz: [],
  summaries: {},

  addNote: (note) =>
    set((state) => {
      const newNotes = [...state.notes, note].sort((a, b) => a.time - b.time);
      return { notes: newNotes };
    }),
  deleteNote: (id) =>
    set((state) => {
      const newNotes = state.notes.filter((n) => n.id !== id);
      return { notes: newNotes };
    }),
  addFlashcard: (card) =>
    set((state) => {
      const newCards = [...state.flashcards, card];
      return { flashcards: newCards };
    }),
  deleteFlashcard: (id) =>
    set((state) => {
      const newCards = state.flashcards.filter((c) => c.id !== id);
      return { flashcards: newCards };
    }),
  toggleFlashcardLearned: (id) =>
    set((state) => {
      const newCards = state.flashcards.map((c) => (c.id === id ? { ...c, learned: !c.learned } : c));
      return { flashcards: newCards };
    }),
  resetFlashcards: (contentId) =>
    set((state) => {
      const newCards = state.flashcards.map((c) => (c.contentId === contentId ? { ...c, learned: false } : c));
      return { flashcards: newCards };
    }),
  addQuizQuestion: (q) =>
    set((state) => {
      const newQuiz = [...state.quiz, q];
      return { quiz: newQuiz };
    }),
  answerQuizQuestion: (id, answer) =>
    set((state) => {
      const newQuiz = state.quiz.map((q) => (q.id === id ? { ...q, userAnswer: answer } : q));
      return { quiz: newQuiz };
    }),
  deleteQuizQuestion: (id) =>
    set((state) => {
      const newQuiz = state.quiz.filter((q) => q.id !== id);
      return { quiz: newQuiz };
    }),
  resetQuiz: (contentId) =>
    set((state) => {
      const newQuiz = state.quiz.map((q) => (q.contentId === contentId ? { ...q, userAnswer: undefined } : q));
      return { quiz: newQuiz };
    }),
  replaceContentAI: (contentId, newCards, newQuiz, newSummary) =>
    set((state) => {
      const finalCards = [...state.flashcards.filter((c) => c.contentId !== contentId), ...newCards];
      const finalQuiz = [...state.quiz.filter((q) => q.contentId !== contentId), ...newQuiz];
      const newSummaries = { ...state.summaries, [contentId]: newSummary };
      return { flashcards: finalCards, quiz: finalQuiz, summaries: newSummaries };
    }),
});
