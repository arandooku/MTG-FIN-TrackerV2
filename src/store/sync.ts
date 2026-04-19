import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SyncPayload } from '@/lib/schemas';
import { createGist, findExistingGist, isValidGistId, pullGist, pushGist } from '@/lib/gist';
import { useCollectionStore } from './collection';
import { useConfigStore } from './config';

interface SyncState {
  token: string;
  gistId: string;
  autoSync: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  setToken: (t: string) => void;
  setGistId: (id: string) => void;
  setAutoSync: (v: boolean) => void;
  discoverOrCreate: () => Promise<void>;
  pull: () => Promise<void>;
  push: () => Promise<void>;
  clearCredentials: () => void;
}

function assemblePayload(): SyncPayload {
  const col = useCollectionStore.getState();
  const cfg = useConfigStore.getState();
  return {
    collection: { owned: col.owned },
    packs: { packs: col.packs },
    timeline: { events: col.timeline },
    binderConfig: cfg.binder,
    foil: col.foil,
  };
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      token: '',
      gistId: '',
      autoSync: false,
      isSyncing: false,
      lastSyncedAt: null,
      lastError: null,
      setToken: (t) => set({ token: t.trim() }),
      setGistId: (id) => set({ gistId: id.trim() }),
      setAutoSync: (v) => set({ autoSync: v }),
      clearCredentials: () =>
        set({ token: '', gistId: '', autoSync: false, lastSyncedAt: null, lastError: null }),
      discoverOrCreate: async () => {
        const { token, isSyncing } = get();
        if (!token || isSyncing) return;
        set({ isSyncing: true, lastError: null });
        try {
          const found = await findExistingGist(token);
          if (found) {
            set({ gistId: found });
          } else {
            const id = await createGist(token, assemblePayload());
            set({ gistId: id });
          }
        } catch (err: unknown) {
          set({ lastError: err instanceof Error ? err.message : 'discover failed' });
        } finally {
          set({ isSyncing: false });
        }
      },
      pull: async () => {
        const { token, gistId, isSyncing } = get();
        if (!token || !isValidGistId(gistId) || isSyncing) return;
        set({ isSyncing: true, lastError: null });
        try {
          const data = (await pullGist({ token, gistId })) as SyncPayload;
          const col = useCollectionStore.getState();
          col.replaceAll({
            owned: data.collection?.owned ?? col.owned,
            packs: data.packs?.packs ?? col.packs,
            timeline: data.timeline?.events ?? col.timeline,
            foil: data.foil ?? col.foil,
          });
          if (data.binderConfig) useConfigStore.getState().setBinder(data.binderConfig);
          set({ lastSyncedAt: new Date().toISOString() });
        } catch (err: unknown) {
          set({ lastError: err instanceof Error ? err.message : 'pull failed' });
        } finally {
          set({ isSyncing: false });
        }
      },
      push: async () => {
        const { token, gistId, isSyncing } = get();
        if (!token || !isValidGistId(gistId) || isSyncing) return;
        set({ isSyncing: true, lastError: null });
        try {
          await pushGist({ token, gistId }, assemblePayload());
          set({ lastSyncedAt: new Date().toISOString() });
        } catch (err: unknown) {
          set({ lastError: err instanceof Error ? err.message : 'push failed' });
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'fin2-sync',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ token: s.token, gistId: s.gistId, autoSync: s.autoSync }),
      version: 1,
    },
  ),
);
