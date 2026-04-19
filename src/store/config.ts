import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BinderConfig } from '@/lib/schemas';
import { BINDER_PRESETS, calcPageCount } from '@/lib/binder';

type Config = BinderConfig;

interface ConfigState {
  binder: Config;
  muteCelebration: boolean;
  currency: 'USD' | 'MYR';
  ocrEngine: 'tesseract' | 'ocrspace';
  ocrSpaceKey: string;
  setBinder: (cfg: Partial<Config>) => void;
  applyPreset: (presetName: string, totalCards: number) => void;
  setCustomGrid: (rows: number, cols: number, totalCards: number) => void;
  setCollectorBinder: (on: boolean) => void;
  markConfigured: (totalCards: number) => void;
  resetOnboarding: () => void;
  setMuteCelebration: (v: boolean) => void;
  setCurrency: (c: 'USD' | 'MYR') => void;
  setOcrEngine: (e: 'tesseract' | 'ocrspace') => void;
  setOcrSpaceKey: (k: string) => void;
}

const defaultBinder: Config = {
  gridRows: 3,
  gridCols: 3,
  slotsPerPage: 9,
  pageCount: 35,
  presetName: '9-pocket',
  scope: { mainSet: true, collectorBinder: false },
  configured: false,
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      binder: defaultBinder,
      muteCelebration: false,
      currency: 'USD',
      ocrEngine: 'tesseract',
      ocrSpaceKey: '',
      setBinder: (cfg) =>
        set((s) => {
          const next = { ...s.binder, ...cfg, configured: true };
          const parsed = BinderConfig.safeParse(next);
          return { binder: parsed.success ? parsed.data : s.binder };
        }),
      applyPreset: (presetName, totalCards) =>
        set((s) => {
          const preset = BINDER_PRESETS.find((p) => p.name === presetName);
          if (!preset) return {};
          return {
            binder: {
              ...s.binder,
              gridRows: preset.gridRows,
              gridCols: preset.gridCols,
              slotsPerPage: preset.slotsPerPage,
              pageCount: calcPageCount(totalCards, preset.slotsPerPage),
              presetName: preset.name,
            },
          };
        }),
      setCustomGrid: (rows, cols, totalCards) =>
        set((s) => {
          const spp = Math.max(1, rows * cols);
          return {
            binder: {
              ...s.binder,
              gridRows: rows,
              gridCols: cols,
              slotsPerPage: spp,
              pageCount: calcPageCount(totalCards, spp),
              presetName: 'Custom',
            },
          };
        }),
      setCollectorBinder: (on) =>
        set((s) => ({
          binder: {
            ...s.binder,
            scope: { ...s.binder.scope, collectorBinder: on },
          },
        })),
      markConfigured: (totalCards) =>
        set((s) => ({
          binder: {
            ...s.binder,
            pageCount: calcPageCount(totalCards, s.binder.slotsPerPage),
            configured: true,
          },
        })),
      resetOnboarding: () =>
        set((s) => ({
          binder: { ...s.binder, configured: false },
        })),
      setMuteCelebration: (v) => set({ muteCelebration: v }),
      setCurrency: (c) => set({ currency: c }),
      setOcrEngine: (e) => set({ ocrEngine: e }),
      setOcrSpaceKey: (k) => set({ ocrSpaceKey: k }),
    }),
    {
      name: 'fin2-config',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
