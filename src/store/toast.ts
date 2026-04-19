import { create } from 'zustand';
import type { Card } from '@/lib/schemas';

export interface SimpleToast {
  id: number;
  kind: 'simple';
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
  undo?: () => void;
}

export interface CardToast {
  id: number;
  kind: 'card';
  card: Card;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic';
  rarityLabel: string;
  message: string;
  placement: string;
  foilLabel?: string;
  glow: string;
  border: string;
}

export type ToastItem = SimpleToast | CardToast;

interface ToastState {
  items: ToastItem[];
  push: (t: Omit<SimpleToast, 'id' | 'kind'>) => void;
  pushCard: (t: Omit<CardToast, 'id' | 'kind'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = nextId++;
    const item: SimpleToast = { id, kind: 'simple', ...t };
    set((s) => ({ items: [...s.items, item] }));
    const ttl = t.undo ? 4000 : 3000;
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    }, ttl);
  },
  pushCard: (t) => {
    const id = nextId++;
    const item: CardToast = { id, kind: 'card', ...t };
    set((s) => ({ items: [...s.items.filter((i) => i.kind !== 'card'), item] }));
    const ttl = t.rarity === 'mythic' ? 2000 : t.rarity === 'rare' ? 1800 : 1500;
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    }, ttl);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export const toast = (t: Omit<SimpleToast, 'id' | 'kind'>): void =>
  useToastStore.getState().push(t);
