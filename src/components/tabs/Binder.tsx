import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { OrnatePanel } from '../shell/OrnatePanel';
import { CardThumb } from '../shell/CardThumb';
import { PageDots } from '../shell/PageDots';
import { useAllCards } from '@/hooks/useCards';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import { classifyFoil } from '@/lib/foil';
import type { Card as CardT } from '@/lib/schemas';

const STAGGER_CAP = 30;
const STAGGER_DELAY = 0.015;
const SLOT_TWEEN: Transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };
const PAGE_TWEEN: Transition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };

type Filter = 'all' | 'owned' | 'missing';

interface BinderProps {
  onPickCard: (c: CardT) => void;
}

export function Binder({ onPickCard }: BinderProps) {
  const { main, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const foilOwned = useCollectionStore((s) => s.foil);
  const binder = useConfigStore((s) => s.binder);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const reduce = useReducedMotion();
  const prevPageRef = useRef(1);

  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const cn of owned) m.set(cn, (m.get(cn) ?? 0) + 1);
    return m;
  }, [owned]);

  const sorted = useMemo(() => sortByCollector(main), [main]);

  const filtered = useMemo(() => {
    return sorted.filter((c) => {
      if (filter === 'owned' && !ownedSet.has(c.collector_number)) return false;
      if (filter === 'missing' && ownedSet.has(c.collector_number)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.collector_number.includes(query)) return false;
      }
      return true;
    });
  }, [sorted, filter, query, ownedSet]);

  const slotsPerPage = binder.slotsPerPage;
  const totalPages = Math.max(1, Math.ceil(filtered.length / slotsPerPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * slotsPerPage;
  const slice = filtered.slice(start, start + slotsPerPage);

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  if (isLoading && !sorted.length) {
    return (
      <div className="app-content">
        <div
          className="text-center py-12 text-display"
          style={{ color: 'var(--ink-muted)', fontSize: 11, letterSpacing: '0.3em' }}
        >
          Loading binder…
        </div>
      </div>
    );
  }

  const ownedTotal = ownedSet.size;
  const slotsCols = binder.gridCols;
  const direction = current >= prevPageRef.current ? 1 : -1;
  prevPageRef.current = current;
  const binderName = binder.presetName ?? 'Grimoire';

  return (
    <div className="app-content">
      {/* HEADER — binder name in Cinzel + page meta */}
      <div
        className="glass-raised"
        style={{ padding: '12px 14px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Gold page-corner fold SVG */}
        <svg
          aria-hidden
          width="42"
          height="42"
          viewBox="0 0 42 42"
          style={{ position: 'absolute', top: 0, right: 0, opacity: 0.55 }}
        >
          <defs>
            <linearGradient id="foldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-gold-bright)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path d="M42 0 L42 20 L22 0 Z" fill="url(#foldGrad)" />
          <path
            d="M42 20 L22 0"
            stroke="var(--accent-gold-bright)"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <path
            d="M40 4 L38 2"
            stroke="var(--accent-gold-bright)"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </svg>
        <div className="flex items-baseline justify-between gap-3 pr-8 min-w-0">
          <div className="min-w-0 flex-1">
            <div
              className="text-display text-truncate"
              style={{
                fontSize: 'var(--fs-hero-lg, clamp(1.25rem, 3.5vw, 1.75rem))',
                letterSpacing: '0.2em',
                color: 'var(--accent-gold-bright)',
                minWidth: 0,
              }}
            >
              {binderName}
            </div>
            <div
              className="text-truncate"
              style={{
                fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                color: 'var(--ink-muted)',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.05em',
                marginTop: 2,
              }}
            >
              Page {current} of {totalPages}
            </div>
          </div>
          <motion.span
            key={ownedTotal}
            initial={reduce ? false : { scale: 1 }}
            animate={reduce ? undefined : { scale: [1, 1.3, 1] }}
            transition={{ type: 'spring', stiffness: 520, damping: 14 }}
            className="text-numeric text-truncate"
            style={{
              color: 'var(--accent-gold)',
              fontSize: 'var(--fs-hero-lg, clamp(1.25rem, 3.5vw, 1.75rem))',
              flexShrink: 0,
            }}
          >
            {ownedTotal}
            <span style={{ color: 'var(--ink-subtle)' }}> / {main.length}</span>
          </motion.span>
        </div>
      </div>

      {/* SEARCH + filter pills — inline at ≥768 */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 min-w-0">
        <div className="app-search flex-1 min-w-0">
          <Search size={16} style={{ color: 'var(--accent-gold)' }} />
          <input
            placeholder="Search cards…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            className={`app-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            FIN
          </button>
          <button
            type="button"
            className={`app-chip ${filter === 'owned' ? 'active' : ''}`}
            onClick={() => setFilter('owned')}
          >
            Owned
          </button>
          <button
            type="button"
            className={`app-chip ${filter === 'missing' ? 'active' : ''}`}
            onClick={() => setFilter('missing')}
          >
            Missing
          </button>
        </div>
      </div>

      {/* GRID — 3x3 within OrnatePanel (slots owned by other agent) */}
      <OrnatePanel
        className="!mb-0"
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={reduce ? false : { x: direction * 40, opacity: 0 }}
            animate={reduce ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: direction * -40, opacity: 0 }}
            transition={PAGE_TWEEN}
            className="grid gap-1.5 binder-grid"
            style={{
              gridTemplateColumns: `repeat(${slotsCols}, minmax(0, 1fr))`,
              width: '100%',
              marginInline: 'auto',
            }}
          >
            {slice.map((c, i) => {
              const qty = counts.get(c.collector_number) ?? 0;
              const hasFoil = (foilOwned[c.collector_number] ?? []).length > 0;
              const variant = classifyFoil(c);
              const staggered = !reduce && i < STAGGER_CAP;
              return (
                <motion.div
                  key={c.collector_number}
                  initial={staggered ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SLOT_TWEEN, delay: staggered ? i * STAGGER_DELAY : 0 }}
                >
                  <CardThumb
                    card={c}
                    qty={qty}
                    foil={hasFoil || (qty > 0 && variant !== 'none')}
                    onClick={() => onPickCard(c)}
                  />
                </motion.div>
              );
            })}
            {Array.from({ length: Math.max(0, slotsPerPage - slice.length) }).map((_, i) => (
              <CardThumb key={`empty-${i}`} empty />
            ))}
          </motion.div>
        </AnimatePresence>
      </OrnatePanel>

      {/* ORNATE FOOTER STRIP — page nav + totals */}
      <div className="ornate-hr" />
      <div
        className="glass"
        style={{
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minWidth: 0,
        }}
      >
        <button
          type="button"
          className="app-btn ghost !py-1.5 !px-3"
          style={{ fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))', minHeight: 44, flexShrink: 0 }}
          disabled={current <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <div className="text-center min-w-0 flex-1 overflow-hidden">
          <div
            className="text-display text-truncate"
            style={{
              fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
              letterSpacing: '0.25em',
              color: 'var(--accent-gold-bright)',
            }}
          >
            {current} / {totalPages}
          </div>
          <PageDots total={totalPages} active={current} max={8} />
        </div>
        <button
          type="button"
          className="app-btn ghost !py-1.5 !px-3"
          style={{ fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))', minHeight: 44, flexShrink: 0 }}
          disabled={current >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
