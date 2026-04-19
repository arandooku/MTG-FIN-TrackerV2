import { useEffect, useRef } from 'react';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { useSyncStore } from '@/store/sync';

const DEBOUNCE_MS = 3000;

export function useAutoSync() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      const { autoSync, token, gistId, isSyncing, push } = useSyncStore.getState();
      if (!autoSync || !token || !gistId || isSyncing) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void push();
      }, DEBOUNCE_MS);
    };

    const unsubCollection = useCollectionStore.subscribe(schedule);
    const unsubConfig = useConfigStore.subscribe(schedule);

    return () => {
      unsubCollection();
      unsubConfig();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
