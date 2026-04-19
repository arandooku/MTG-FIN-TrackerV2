import { create } from 'zustand';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
}

interface ToastState {
  items: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = nextId++;
    const item: ToastItem = { id, ...t };
    set((s) => ({ items: [...s.items, item] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export const toast = (t: Omit<ToastItem, 'id'>): void => useToastStore.getState().push(t);
