import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BoosterPack, FoilOwned, OwnedList, TimelineEvent } from '@/lib/schemas';

interface CollectionState {
  owned: OwnedList;
  packs: BoosterPack[];
  timeline: TimelineEvent[];
  foil: FoilOwned;
  addCard: (cn: string, source?: string) => void;
  removeCard: (cn: string, source?: string) => void;
  addPack: (pack: BoosterPack) => void;
  removePack: (index: number) => void;
  setFoil: (cn: string, variants: string[]) => void;
  clearAll: () => void;
  replaceAll: (payload: Partial<Pick<CollectionState, 'owned' | 'packs' | 'timeline' | 'foil'>>) => void;
}

const nowIso = (): string => new Date().toISOString();

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set) => ({
      owned: [],
      packs: [],
      timeline: [],
      foil: {},
      addCard: (cn, source = 'quick') =>
        set((s) => ({
          owned: [...s.owned, cn],
          timeline: [...s.timeline, { type: 'add', cn, date: nowIso(), source }],
        })),
      removeCard: (cn, source = 'quick') =>
        set((s) => {
          const idx = s.owned.lastIndexOf(cn);
          if (idx === -1) return s;
          const next = [...s.owned.slice(0, idx), ...s.owned.slice(idx + 1)];
          return {
            owned: next,
            timeline: [...s.timeline, { type: 'remove', cn, date: nowIso(), source }],
          };
        }),
      addPack: (pack) =>
        set((s) => {
          const date = pack.date ?? nowIso();
          const ownedAdds: string[] = [];
          const events: TimelineEvent[] = pack.cards.map((c) => {
            const cn = typeof c === 'string' ? c : c.cn;
            ownedAdds.push(cn);
            return { type: 'pack', cn, date, source: 'pack' };
          });
          return {
            packs: [...s.packs, { ...pack, date }],
            owned: [...s.owned, ...ownedAdds],
            timeline: [...s.timeline, ...events],
          };
        }),
      removePack: (index) =>
        set((s) => ({
          packs: s.packs.filter((_, i) => i !== index),
        })),
      setFoil: (cn, variants) =>
        set((s) => {
          const next: FoilOwned = { ...s.foil };
          if (variants.length === 0) delete next[cn];
          else next[cn] = variants;
          return { foil: next };
        }),
      clearAll: () => set({ owned: [], packs: [], timeline: [], foil: {} }),
      replaceAll: (payload) =>
        set((s) => ({
          owned: payload.owned ?? s.owned,
          packs: payload.packs ?? s.packs,
          timeline: payload.timeline ?? s.timeline,
          foil: payload.foil ?? s.foil,
        })),
    }),
    {
      name: 'fin2-collection',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
