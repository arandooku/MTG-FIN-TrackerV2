import { useMemo } from 'react';
import { useSyncStore } from '@/store/sync';
import { useCollectionStore } from '@/store/collection';
import { useAllCards } from '@/hooks/useCards';
import { relativeTime } from '@/lib/utils';

export function Header() {
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const owned = useCollectionStore((s) => s.owned);
  const { main } = useAllCards();

  const hud = useMemo(() => {
    const ownedSet = new Set(owned);
    const total = main.length || 1;
    const pct = (ownedSet.size / total) * 100;
    return {
      pctLabel: `${pct.toFixed(0)}%`,
      pctNum: pct,
      unique: ownedSet.size,
      total: main.length,
    };
  }, [owned, main]);

  return (
    <header className="brand-header">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:py-3">
        <div className="brand-logo-box">
          <span className="brand-logo-text">FIN</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="brand-title">
            <span className="gold">Final Fantasy</span> MTG Tracker
            <span className="brand-version">v2.0</span>
          </div>
          <div className="brand-subtitle mt-0.5">
            Main Set — {hud.total || '—'} cards via Play Boosters
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-muted)]">
          {isSyncing ? (
            <span className="sync-chip syncing">
              <span className="chip-dot" /> Syncing
            </span>
          ) : lastSyncedAt ? (
            <span className="sync-chip connected">
              <span className="chip-dot" /> {relativeTime(lastSyncedAt)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="brand-hud mx-auto max-w-6xl">
        <div className="brand-hud-stat">
          <span className="brand-hud-val">{hud.unique}</span>
          <span className="brand-hud-label">Owned</span>
        </div>
        <div className="brand-hud-divider" />
        <div className="brand-hud-stat">
          <span className="brand-hud-val gold">{hud.pctLabel}</span>
          <span className="brand-hud-label">Complete</span>
        </div>
        <div className="brand-progress-track">
          <div
            className="brand-progress-fill"
            style={{ width: `${Math.min(100, hud.pctNum)}%` }}
          />
        </div>
      </div>
    </header>
  );
}
