import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BinderSlot } from '../BinderSlot';
import { CardModal } from '../modals/CardModal';
import { useAllCards } from '@/hooks/useCards';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import { classifyFoil } from '@/lib/foil';
import type { Card as CardT } from '@/lib/schemas';

type Filter = 'all' | 'owned' | 'missing';

export function Binder() {
  const { main, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const foilOwned = useCollectionStore((s) => s.foil);
  const binder = useConfigStore((s) => s.binder);
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<CardT | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [slideClass, setSlideClass] = useState('tab-content-enter');
  const prevPage = useRef(1);

  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const cn of owned) m.set(cn, (m.get(cn) ?? 0) + 1);
    return m;
  }, [owned]);

  const sortedMain = useMemo(() => sortByCollector(main), [main]);

  const filtered = useMemo(() => {
    const base = sortedMain.filter((c) => {
      if (filter === 'owned' && !ownedSet.has(c.collector_number)) return false;
      if (filter === 'missing' && ownedSet.has(c.collector_number)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.collector_number.includes(query)) return false;
      }
      return true;
    });
    return base;
  }, [sortedMain, filter, query, ownedSet]);

  const { slotsPerPage, gridCols } = binder;
  const totalPages = Math.max(1, Math.ceil(filtered.length / slotsPerPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * slotsPerPage;
  const slice = filtered.slice(start, start + slotsPerPage);

  const spreadOwned = slice.filter((c) => ownedSet.has(c.collector_number)).length;
  const completionPct = filtered.length
    ? (filtered.filter((c) => ownedSet.has(c.collector_number)).length / filtered.length) * 100
    : 0;

  useEffect(() => {
    setSlideClass(page > prevPage.current ? 'tab-content-enter' : 'tab-content-enter-back');
    prevPage.current = page;
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  if (isLoading && !sortedMain.length) {
    return <div className="py-12 text-center text-[var(--text-muted)]">Loading binder…</div>;
  }

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <div className="dash-card">
        <div className="flex items-center gap-3">
          <div
            className="donut-ring"
            style={{ ['--pct' as string]: completionPct.toFixed(1) } as React.CSSProperties}
          >
            <div className="donut-ring-label">{completionPct.toFixed(0)}%</div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="font-num text-base font-bold">
              <span className="text-[var(--gold)]">{current}</span>
              <span className="text-[var(--text-muted)]"> of {totalPages}</span>
            </div>
            <div className="font-num text-sm font-bold">
              <span className="text-[var(--accent)]">{spreadOwned}</span>
              <span className="text-[var(--text-muted)]"> / {slice.length || slotsPerPage}</span>
              <span className="text-[0.65rem] uppercase tracking-widest text-[var(--text-muted)] font-ui ml-2">
                this spread
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`filter-chip ${filter === 'owned' ? 'active' : ''}`}
          onClick={() => setFilter('owned')}
        >
          Owned
        </button>
        <button
          type="button"
          className={`filter-chip ${filter === 'missing' ? 'active' : ''}`}
          onClick={() => setFilter('missing')}
        >
          Missing
        </button>
      </div>

      <input
        type="search"
        placeholder="Search by name or #…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-[var(--ff-border)] bg-[var(--slot-bg)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
      />

      {/* Grid with swipe rails */}
      <div className="relative">
        <button
          type="button"
          className="swipe-rail left"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={current <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="swipe-rail right"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={current >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-panel)] p-3">
          <div className="mb-2 text-center text-[0.65rem] font-ui uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Page {current}
          </div>
          <div
            key={`${current}-${filter}-${query}`}
            className={`grid gap-2 ${slideClass}`}
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
          >
            {slice.map((card) => {
              const count = counts.get(card.collector_number) ?? 0;
              const variant = classifyFoil(card);
              const hasFoil = (foilOwned[card.collector_number] ?? []).length > 0;
              return (
                <BinderSlot
                  key={card.collector_number}
                  card={card}
                  owned={count}
                  foilActive={(count > 0 && variant !== 'none') || hasFoil}
                  onClick={() => setActive(card)}
                  showNumberedEmpty
                />
              );
            })}
            {Array.from({ length: Math.max(0, slotsPerPage - slice.length) }).map((_, i) => (
              <BinderSlot key={`empty-${i}`} owned={0} />
            ))}
          </div>
        </div>
      </div>

      <CardModal card={active} onClose={() => setActive(null)} onSwitchCard={setActive} />
    </div>
  );
}
