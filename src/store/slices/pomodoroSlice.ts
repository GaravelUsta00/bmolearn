import { newId } from '@/lib/id';
import type { SliceCreator, PomodoroSlice } from '@/store/types';

export const createPomodoroSlice: SliceCreator<PomodoroSlice> = (set) => ({
  pomodoroHistory: {},
  todos: [],

  addPomodoroRecord: () =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const newRecords = { ...state.pomodoroHistory };
      newRecords[today] = (newRecords[today] || 0) + 1;
      return { pomodoroHistory: newRecords };
    }),
  addTodo: (text) =>
    set((state) => {
      const newTodos = [...state.todos, { id: newId(), text, completed: false }];
      return { todos: newTodos };
    }),
  toggleTodo: (id) =>
    set((state) => {
      const newTodos = state.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      return { todos: newTodos };
    }),
  deleteTodo: (id) =>
    set((state) => {
      const newTodos = state.todos.filter((t) => t.id !== id);
      return { todos: newTodos };
    }),
});
