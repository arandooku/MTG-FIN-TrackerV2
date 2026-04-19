import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Mode = 'dark' | 'light';

interface ThemeState {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const applyDomClass = (m: Mode): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', m === 'dark');
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      setMode: (m) => {
        applyDomClass(m);
        set({ mode: m });
      },
      toggle: () => {
        const next: Mode = get().mode === 'dark' ? 'light' : 'dark';
        applyDomClass(next);
        set({ mode: next });
      },
    }),
    {
      name: 'fin2-theme',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) applyDomClass(state.mode);
      },
    },
  ),
);
