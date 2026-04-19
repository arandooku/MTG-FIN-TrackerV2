import { useMemo, useState } from 'react';
import { Package, Scan, Search } from 'lucide-react';
import { CardModal } from '../modals/CardModal';
import { PackModal } from '../modals/PackModal';
import { Scanner } from '../Scanner';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import type { Card as CardT } from '@/lib/schemas';
import type { TabKey } from '@/App';

interface DashboardProps {
  onJumpTo: (t: TabKey) => void;
  onOpenSearch: () => void;
  onOpenPack: () => void;
}

export function Dashboard({ onJumpTo, onOpenSearch, onOpenPack }: DashboardProps) {
  const { main, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const packs = useCollectionStore((s) => s.packs);
  const timeline = useCollectionStore((s) => s.timeline);
  const foilOwned = useCollectionStore((s) => s.foil);
  const binder = useConfigStore((s) => s.binder);
  const currency = useConfigStore((s) => s.currency);
  const { data: rate = 4.7 } = useFx();
  const [openScan, setOpenScan] = useState(false);
  const [openPackLocal, setOpenPackLocal] = useState(false);
  const [activeCard, setActiveCard] = useState<CardT | null>(null);

  const stats = useMemo(() => {
    const ownedSet = new Set(owned);
    const uniqueOwned = ownedSet.size;
    const total = main.length;
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    let valueUsd = 0;
    let mythics = 0, rares = 0, uncommons = 0, commons = 0;
    let mythicsTotal = 0, raresTotal = 0, uncommonsTotal = 0, commonsTotal = 0;
    for (const c of main) {
      if (c.rarity === 'mythic') mythicsTotal++;
      else if (c.rarity === 'rare') raresTotal++;
      else if (c.rarity === 'uncommon') uncommonsTotal++;
      else commonsTotal++;
    }
    for (const cn of owned) {
      const c = byCn.get(cn);
      if (!c) continue;
      valueUsd += c.price_usd ?? 0;
    }
    for (const cn of ownedSet) {
      const c = byCn.get(cn);
      if (!c) continue;
      if (c.rarity === 'mythic') mythics++;
      else if (c.rarity === 'rare') rares++;
      else if (c.rarity === 'uncommon') uncommons++;
      else commons++;
    }
    const foilCount = Object.values(foilOwned).reduce((n, v) => n + v.length, 0);
    return {
      uniqueOwned,
      totalCards: owned.length,
      completion: total ? (uniqueOwned / total) * 100 : 0,
      setSize: total,
      remaining: total - uniqueOwned,
      valueUsd,
      mythics, rares, uncommons, commons,
      mythicsTotal, raresTotal, uncommonsTotal, commonsTotal,
      packsOpened: packs.length,
      foilCount,
    };
  }, [main, owned, packs, foilOwned]);

  // Binder Map: per-page completion
  const pageCompletion = useMemo(() => {
    if (!main.length) return [] as Array<{ page: number; owned: number; total: number }>;
    const sorted = sortByCollector(main);
    const { slotsPerPage } = binder;
    const ownedSet = new Set(owned);
    const pages: Array<{ page: number; owned: number; total: number }> = [];
    for (let p = 0; p * slotsPerPage < sorted.length; p++) {
      const slice = sorted.slice(p * slotsPerPage, p * slotsPerPage + slotsPerPage);
      const got = slice.filter((c) => ownedSet.has(c.collector_number)).length;
      pages.push({ page: p + 1, owned: got, total: slice.length });
    }
    return pages;
  }, [main, owned, binder]);

  const sessionAdded = useMemo(() => {
    const since = Date.now() - 30 * 60_000;
    return timeline.filter(
      (e) => new Date(e.date).getTime() > since && e.type !== 'remove',
    ).length;
  }, [timeline]);

  const handlePackOpen = () => {
    onOpenPack();
    setOpenPackLocal(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={onOpenSearch}>
          <Search className="h-4 w-4" /> Search
        </button>
        <button type="button" className="btn btn-secondary" onClick={handlePackOpen}>
          <Package className="h-4 w-4" /> Open Pack
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpenScan((v) => !v)}>
          <Scan className="h-4 w-4" /> Scan
        </button>
      </div>

      {openScan && <Scanner />}

      {isLoading && !main.length ? (
        <div className="py-12 text-center text-[var(--text-muted)]">Loading set data…</div>
      ) : (
        <>
          {/* Main stat card: completion donut + rarity ratios */}
          <div className="dash-card">
            <div className="flex items-center gap-4">
              <div
                className="donut-ring"
                style={{ ['--pct' as string]: stats.completion.toFixed(1), ['--fill' as string]: 'var(--gold)' } as React.CSSProperties}
              >
                <div className="donut-ring-label">{stats.completion.toFixed(0)}%</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-num text-2xl font-bold">
                  <span className="text-[var(--accent)]">{stats.uniqueOwned}</span>
                  <span className="text-[var(--text-muted)]"> / {stats.setSize}</span>
                </div>
                <div className="text-[0.72rem] text-[var(--text-muted)] font-ui mt-0.5">
                  {stats.remaining} cards remaining
                </div>
                <div className="rarity-ratio-row mt-2">
                  <span className="rarity-ratio mythic">
                    <span className="label">M</span>
                    <span className="count">
                      {stats.mythics}/{stats.mythicsTotal}
                    </span>
                  </span>
                  <span className="rarity-ratio rare">
                    <span className="label">R</span>
                    <span className="count">
                      {stats.rares}/{stats.raresTotal}
                    </span>
                  </span>
                  <span className="rarity-ratio uncommon">
                    <span className="label">U</span>
                    <span className="count">
                      {stats.uncommons}/{stats.uncommonsTotal}
                    </span>
                  </span>
                  <span className="rarity-ratio common">
                    <span className="label">C</span>
                    <span className="count">
                      {stats.commons}/{stats.commonsTotal}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            <DashCard title="Foils" value={String(stats.foilCount)} accent="gold" icon="✦" />
            <DashCard title="Packs" value={String(stats.packsOpened)} accent="accent" />
            <DashCard
              title="Value"
              value={currency === 'MYR' ? `RM ${(stats.valueUsd * rate).toFixed(0)}` : `$${stats.valueUsd.toFixed(0)}`}
              accent="green"
            />
          </div>

          {/* This session */}
          <div className="dash-card session-panel">
            <div className="session-top">
              <span className="session-title">This Session</span>
              <span className="session-count">{sessionAdded} cards added</span>
            </div>
            <p className="session-msg">
              {sessionAdded
                ? 'Keep going — your binder is filling up.'
                : 'Open a pack or search for cards to get started'}
            </p>
            <button
              type="button"
              className="btn btn-primary session-cta"
              onClick={onOpenSearch}
            >
              Add Cards
            </button>
          </div>

          {/* Binder map */}
          <div className="dash-card">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Binder Map
              </span>
              <span className="text-[0.7rem] font-num text-[var(--text-muted)]">
                {pageCompletion.filter((p) => p.owned === p.total).length} / {pageCompletion.length}{' '}
                pages complete
              </span>
            </div>
            <div className="binder-map">
              {pageCompletion.map((p) => {
                const cls = p.owned === 0 ? '' : p.owned === p.total ? 'complete' : 'partial';
                return (
                  <button
                    type="button"
                    key={p.page}
                    className={`binder-map-cell ${cls}`}
                    title={`Page ${p.page} · ${p.owned}/${p.total}`}
                    onClick={() => onJumpTo('binder')}
                  >
                    {p.page}
                  </button>
                );
              })}
            </div>
            <div className="binder-map-legend">
              <span className="binder-map-legend-sw complete">Complete</span>
              <span className="binder-map-legend-sw partial">Partial</span>
              <span className="binder-map-legend-sw">Empty</span>
            </div>
          </div>
        </>
      )}

      <PackModal open={openPackLocal} onClose={() => setOpenPackLocal(false)} />
      <CardModal card={activeCard} onClose={() => setActiveCard(null)} onSwitchCard={setActiveCard} />
    </div>
  );
}

interface DashCardProps {
  title: string;
  value: string;
  accent?: 'accent' | 'gold' | 'green';
  icon?: string;
}

function DashCard({ title, value, accent = 'accent', icon }: DashCardProps) {
  const color =
    accent === 'gold' ? 'var(--gold)' : accent === 'green' ? 'var(--owned-border)' : 'var(--accent)';
  return (
    <div className="dash-card">
      <div className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {icon && <span style={{ color, marginRight: 4 }}>{icon}</span>}
        {title}
      </div>
      <div className="dash-big-num" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
