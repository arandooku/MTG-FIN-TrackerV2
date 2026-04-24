import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';
import { CardThumb } from '../shell/CardThumb';
import { useAllCards } from '@/hooks/useCards';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { classifyFoil, foilLabelMap, type FoilVariant } from '@/lib/foil';
import type { Card as CardT } from '@/lib/schemas';

const STAGGER_CAP = 30;
const STAGGER_DELAY = 0.015;
const SLOT_TWEEN: Transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };

type Filter = 'all' | 'owned' | 'missing';
const GROUP_PAGE = 6;

interface CollectorProps {
  onPickCard: (c: CardT) => void;
}

const VARIANT_ORDER: FoilVariant[] = [
  'surge-foil',
  'chocobo-track',
  'extended-art',
  'showcase',
  'collector-foil',
  'regular-foil',
];

const VARIANT_DOT: Record<string, string> = {
  'surge-foil': 'var(--accent-mythic)',
  'chocobo-track': 'var(--accent-crystal)',
  'extended-art': 'var(--accent-arcane)',
  'showcase': 'var(--accent-gold-bright)',
  'collector-foil': 'var(--accent-gold)',
  'regular-foil': 'var(--ink-secondary)',
};

export function Collector({ onPickCard }: CollectorProps) {
  const { variants, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const foilOwned = useCollectionStore((s) => s.foil);
  const enabled = useConfigStore((s) => s.binder.scope.collectorBinder);
  const setCollector = useConfigStore((s) => s.setCollectorBinder);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [shownByGroup, setShownByGroup] = useState<Record<string, number>>({});
  const reduce = useReducedMotion();

  const ownedSet = useMemo(() => new Set(owned), [owned]);

  const grouped = useMemo(() => {
    const m = new Map<FoilVariant, CardT[]>();
    for (const v of variants) {
      const k = classifyFoil(v);
      const list = m.get(k) ?? [];
      list.push(v);
      m.set(k, list);
    }
    return m;
  }, [variants]);

  useEffect(() => {
    setShownByGroup({});
  }, [filter, query]);

  if (!enabled) {
    return (
      <div className="app-content">
        <div
          className="glass-raised glow-gold"
          style={{ padding: '32px 20px', textAlign: 'center' }}
        >
          <div className="flex flex-col items-center gap-3">
            <Sparkles size={24} style={{ color: 'var(--accent-gold)' }} />
            <div
              className="text-display"
              style={{
                fontSize: 16,
                letterSpacing: '0.2em',
                color: 'var(--accent-gold-bright)',
              }}
            >
              Collector Binder
            </div>
            <div
              className="text-display"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--ink-muted)',
                maxWidth: 240,
                lineHeight: 1.6,
              }}
            >
              Track showcase, extended, surge, and collector-number foils.
            </div>
            <button
              type="button"
              className="app-btn primary mt-2"
              style={{ fontSize: 11 }}
              onClick={() => setCollector(true)}
            >
              Enable Collector Binder
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !variants.length) {
    return (
      <div className="app-content">
        <div
          className="text-center py-12 text-display"
          style={{ color: 'var(--ink-muted)', fontSize: 11, letterSpacing: '0.3em' }}
        >
          Loading variants…
        </div>
      </div>
    );
  }

  if (!variants.length) {
    return (
      <div className="app-content">
        <div className="glass-raised" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div
            className="text-display"
            style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--ink-muted)' }}
          >
            No collector variants for FIN
          </div>
        </div>
      </div>
    );
  }

  const ownedCount = variants.filter((c) => ownedSet.has(c.collector_number)).length;
  const q = query.toLowerCase().trim();

  const filterCard = (c: CardT) => {
    const isOwned = ownedSet.has(c.collector_number);
    if (filter === 'owned' && !isOwned) return false;
    if (filter === 'missing' && isOwned) return false;
    if (q) {
      if (!c.name.toLowerCase().includes(q) && !c.collector_number.includes(q)) return false;
    }
    return true;
  };

  const orderedGroups = VARIANT_ORDER.map((k) => [k, grouped.get(k) ?? []] as const).filter(
    ([, cards]) => cards.length > 0,
  );

  return (
    <div className="app-content">
      {/* HERO — completion ring with gold accent */}
      <div
        className="glass-raised glow-gold"
        style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}
      >
        <div aria-hidden style={{ flexShrink: 0 }}>
          <Ring owned={ownedCount} total={variants.length} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-display text-truncate"
            style={{
              fontSize: 'var(--fs-hero-lg, clamp(1.25rem, 3.5vw, 1.75rem))',
              letterSpacing: '0.2em',
              color: 'var(--accent-gold-bright)',
            }}
          >
            Collector ✦
          </div>
          <motion.div
            key={ownedCount}
            initial={reduce ? false : { scale: 1 }}
            animate={reduce ? undefined : { scale: [1, 1.3, 1] }}
            transition={{ type: 'spring', stiffness: 520, damping: 14 }}
            className="text-display text-truncate mt-1"
            style={{
              fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
              letterSpacing: '0.25em',
              color: 'var(--ink-muted)',
            }}
          >
            {ownedCount} / {variants.length} · {orderedGroups.length} variants
          </motion.div>
        </div>
      </div>

      {/* SEARCH + filter pills — inline at ≥768 */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 min-w-0">
        <div className="app-search flex-1 min-w-0">
          <Search size={16} style={{ color: 'var(--accent-gold)' }} />
          <input
            placeholder="Search variants…"
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
            All
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

      <div style={{ flex: 1, minHeight: 0, width: '100%', overflowY: 'auto' }}>
        {orderedGroups.map(([key, cards]) => {
          const visible = cards.filter(filterCard);
          if (!visible.length) return null;
          const groupOwned = cards.filter((c) => ownedSet.has(c.collector_number)).length;
          const cap = shownByGroup[key] ?? GROUP_PAGE;
          const shown = visible.slice(0, cap);
          const canLoadMore = cap < visible.length;
          const dotColor = VARIANT_DOT[key] ?? 'var(--accent-gold)';
          return (
            <div key={key} style={{ marginBottom: 14 }}>
              {/* Group header — Cinzel small-caps w/ colored dot */}
              <div
                className="flex items-center gap-2 px-1 mb-1.5"
                style={{ marginTop: 6 }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: dotColor,
                    boxShadow: `0 0 6px ${dotColor}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="text-display flex-1 text-truncate min-w-0"
                  style={{
                    fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                    letterSpacing: '0.22em',
                    color: 'var(--ink-primary)',
                  }}
                >
                  {foilLabelMap[key]}
                </span>
                <span
                  className="text-numeric"
                  style={{ color: 'var(--accent-gold)', fontSize: 11 }}
                >
                  {groupOwned}
                  <span style={{ color: 'var(--ink-subtle)' }}>/{cards.length}</span>
                </span>
              </div>
              <div className="glass" style={{ padding: 10 }}>
                <div className="grid grid-cols-3 gap-1.5">
                  {shown.map((c, i) => {
                    const isOwned = ownedSet.has(c.collector_number);
                    const hasFoil = (foilOwned[c.collector_number] ?? []).length > 0;
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
                          foil={hasFoil || (isOwned && classifyFoil(c) !== 'none')}
                          qty={isOwned ? 1 : 0}
                          onClick={() => onPickCard(c)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
                {canLoadMore && (
                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      className="app-loadmore"
                      onClick={() =>
                        setShownByGroup((prev) => ({ ...prev, [key]: cap + GROUP_PAGE }))
                      }
                    >
                      Load More ({visible.length - cap})
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Ring({ owned, total }: { owned: number; total: number }) {
  const pct = total > 0 ? Math.min(1, owned / total) : 0;
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <defs>
        <linearGradient id="ringGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-gold-bright)" />
          <stop offset="100%" stopColor="var(--accent-gold)" />
        </linearGradient>
      </defs>
      <circle
        cx={28}
        cy={28}
        r={r}
        stroke="var(--border-hair)"
        strokeWidth={3}
        fill="none"
      />
      <circle
        cx={28}
        cy={28}
        r={r}
        stroke="url(#ringGoldGrad)"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 28 28)"
        style={{ filter: 'drop-shadow(0 0 4px var(--accent-gold))' }}
      />
      <text
        x={28}
        y={32}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="var(--accent-gold-bright)"
        fontFamily="var(--font-display)"
      >
        {Math.round(pct * 100)}
      </text>
    </svg>
  );
}
