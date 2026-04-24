import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Layers,
  ScanLine,
  Package,
  Copy,
  Box,
  Crown,
  Plus,
  Minus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Gem,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GoldDivider, ManaPip } from '../shell/OrnatePanel';
import { Sparkline } from '../shell/Sparkline';
import { CardThumb } from '../shell/CardThumb';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { relativeTime } from '@/lib/utils';
import type { ReactNode } from 'react';
import type { Card as CardT } from '@/lib/schemas';
import type { TabKey } from '@/App';

interface DashboardProps {
  onJumpTo: (t: TabKey) => void;
  onPickCard: (c: CardT) => void;
}

const COLORS = ['W', 'U', 'B', 'R', 'G'] as const;
const RARITIES = ['common', 'uncommon', 'rare', 'mythic'] as const;
type Rarity = (typeof RARITIES)[number];

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: 'var(--ink-muted)',
  uncommon: '#c9d4de',
  rare: 'var(--accent-gold)',
  mythic: 'var(--accent-mythic)',
};

export function Dashboard({ onJumpTo, onPickCard }: DashboardProps) {
  const { main, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const timeline = useCollectionStore((s) => s.timeline);
  const packs = useCollectionStore((s) => s.packs);
  const currency = useConfigStore((s) => s.currency);
  const showCollector = useConfigStore((s) => s.binder.scope.collectorBinder);
  const { data: rate = 4.7 } = useFx();
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    const ownedSet = new Set(owned);
    const total = main.length;
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    let valueUsd = 0;
    const byColor: Record<(typeof COLORS)[number], { o: number; t: number }> = {
      W: { o: 0, t: 0 },
      U: { o: 0, t: 0 },
      B: { o: 0, t: 0 },
      R: { o: 0, t: 0 },
      G: { o: 0, t: 0 },
    };
    const byRarity: Record<Rarity, { o: number; t: number }> = {
      common: { o: 0, t: 0 },
      uncommon: { o: 0, t: 0 },
      rare: { o: 0, t: 0 },
      mythic: { o: 0, t: 0 },
    };
    for (const c of main) {
      const cost = c.mana_cost?.toUpperCase() ?? '';
      for (const col of COLORS) {
        if (cost.includes(`{${col}}`)) byColor[col].t++;
      }
      const r = c.rarity as Rarity;
      if (byRarity[r]) byRarity[r].t++;
    }
    for (const cn of ownedSet) {
      const c = byCn.get(cn);
      if (!c) continue;
      valueUsd += c.price_usd ?? 0;
      const cost = c.mana_cost?.toUpperCase() ?? '';
      for (const col of COLORS) {
        if (cost.includes(`{${col}}`)) byColor[col].o++;
      }
      const r = c.rarity as Rarity;
      if (byRarity[r]) byRarity[r].o++;
    }
    return {
      uniqueOwned: ownedSet.size,
      totalCopies: owned.length,
      total,
      pct: total ? (ownedSet.size / total) * 100 : 0,
      valueUsd,
      byColor,
      byRarity,
    };
  }, [main, owned]);

  const topValued = useMemo(() => {
    const ownedSet = new Set(owned);
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    const out: CardT[] = [];
    for (const cn of ownedSet) {
      const c = byCn.get(cn);
      if (c) out.push(c);
    }
    out.sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    return out.slice(0, 5);
  }, [main, owned]);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: CardT[] = [];
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    for (let i = timeline.length - 1; i >= 0 && out.length < 4; i--) {
      const e = timeline[i];
      if (e.type === 'remove' || seen.has(e.cn)) continue;
      seen.add(e.cn);
      const c = byCn.get(e.cn);
      if (c) out.push(c);
    }
    return out;
  }, [timeline, main]);

  const activity = useMemo(() => {
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    const out = [];
    for (let i = timeline.length - 1; i >= 0 && out.length < 3; i--) {
      const e = timeline[i];
      out.push({ event: e, card: byCn.get(e.cn) });
    }
    return out;
  }, [timeline, main]);

  const valueSeries = useMemo(() => {
    if (!timeline.length) return [] as number[];
    const sorted = [...timeline].sort((a, b) => (a.date < b.date ? -1 : 1));
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    let v = 0;
    return sorted.map((e) => {
      const price = byCn.get(e.cn)?.price_usd ?? 0;
      v += e.type === 'remove' ? -price : price;
      return Math.max(0, v);
    });
  }, [timeline, main]);

  const weekDelta = useMemo(() => {
    if (valueSeries.length < 2) return null;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const sorted = [...timeline].sort((a, b) => (a.date < b.date ? -1 : 1));
    let priorIdx = -1;
    for (let i = 0; i < sorted.length; i++) {
      if (Date.parse(sorted[i].date) >= cutoff) {
        priorIdx = i - 1;
        break;
      }
    }
    if (priorIdx < 0) priorIdx = 0;
    const prior = valueSeries[priorIdx] ?? valueSeries[0];
    const now = valueSeries[valueSeries.length - 1];
    if (!prior || prior === now) return null;
    const pct = ((now - prior) / prior) * 100;
    return { pct, up: pct >= 0 };
  }, [timeline, valueSeries]);

  const fmt =
    currency === 'MYR'
      ? (usd: number) => `RM ${(usd * rate).toFixed(2)}`
      : (usd: number) => `$${usd.toFixed(2)}`;

  const highestCard = topValued[0];

  if (isLoading && !main.length) {
    return (
      <div className="app-content has-fab-top">
        <div
          className="text-center py-12 text-display"
          style={{
            color: 'var(--ink-muted)',
            fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
            letterSpacing: '0.22em',
          }}
        >
          Loading set data…
        </div>
      </div>
    );
  }

  const ctaGridCols = showCollector ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';

  const heroBlock = (
    <div
      className="glass-raised glow-gold"
      style={{ padding: '18px 16px 14px', position: 'relative', overflow: 'hidden', minWidth: 0 }}
    >
      <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
        <span className="mo-section-label truncate">FIN Completion</span>
        <span
          className="text-display flex-shrink-0 hide-narrow"
          style={{
            fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
            letterSpacing: '0.22em',
            color: 'var(--accent-gold)',
            padding: '3px 8px',
            border: '1px solid var(--border-hair)',
            borderRadius: 3,
          }}
        >
          Final Fantasy · FIN
        </span>
      </div>
      <div className="flex items-end justify-between gap-3 min-w-0">
        <div className="mo-numeric-hero" style={{ minWidth: 0 }}>
          <CountUp to={stats.pct} format={(v) => `${v.toFixed(0)}%`} />
        </div>
        <div className="text-right pb-2 min-w-0">
          <div
            className="text-numeric truncate"
            style={{
              color: 'var(--ink-primary)',
              fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))',
            }}
          >
            <CountUp to={stats.uniqueOwned} />
            <span style={{ color: 'var(--ink-subtle)' }}> / {stats.total}</span>
          </div>
          <div
            className="text-display mt-0.5 truncate"
            style={{
              fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
              letterSpacing: '0.22em',
              color: 'var(--ink-muted)',
            }}
          >
            Unique Cards
          </div>
        </div>
      </div>
      <div className="app-progress mt-3 mb-3">
        <div className="app-progress-fill" style={{ width: `${stats.pct}%` }} />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {COLORS.map((col) => {
          const { o, t } = stats.byColor[col];
          const pct = t ? Math.round((o / t) * 100) : 0;
          return (
            <div key={col} className="app-pipstat">
              <ManaPip color={col.toLowerCase() as 'w' | 'u' | 'b' | 'r' | 'g'} label={col} />
              <span>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const portfolioStrip = (
    <div
      className="glass-raised"
      style={{
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minWidth: 0,
      }}
    >
      <div className="min-w-0">
        <div className="mo-section-label truncate">Portfolio · {currency}</div>
        <div
          className="mo-numeric-lg mt-1 truncate"
          style={{ color: 'var(--accent-gold-bright)', minWidth: 0 }}
        >
          <CountUp to={stats.valueUsd} format={fmt} />
        </div>
      </div>
      {weekDelta && (
        <span
          className="text-display flex items-center gap-1 flex-shrink-0"
          style={{
            fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
            letterSpacing: '0.2em',
            color: weekDelta.up ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {weekDelta.up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {weekDelta.up ? '+' : ''}
          {weekDelta.pct.toFixed(1)}%
          <span style={{ color: 'var(--ink-subtle)', marginLeft: 4 }}>7D</span>
        </span>
      )}
    </div>
  );

  const ctaRow = (
    <div className={`grid ${ctaGridCols} gap-2`}>
      <button type="button" className="app-btn" onClick={() => onJumpTo('binder')}>
        <Layers size={16} /> Binder
      </button>
      {showCollector && (
        <button type="button" className="app-btn" onClick={() => onJumpTo('collector')}>
          <Gem size={16} /> Collector
        </button>
      )}
      <button type="button" className="app-btn primary" onClick={() => onJumpTo('scan')}>
        <ScanLine size={16} /> Scan
      </button>
    </div>
  );

  const statGrid = (
    <div className="grid grid-cols-2 gap-2">
      <QuickTile
        icon={<Box size={16} />}
        label="Unique"
        value={<CountUp to={stats.uniqueOwned} />}
        sub={`of ${stats.total}`}
      />
      <QuickTile
        icon={<Copy size={16} />}
        label="Copies"
        value={<CountUp to={stats.totalCopies} />}
        sub="owned"
      />
      <QuickTile
        icon={<Package size={16} />}
        label="Packs"
        value={<CountUp to={packs.length} />}
        sub="opened"
      />
      <QuickTile
        icon={<Crown size={16} />}
        label="Apex"
        value={highestCard ? fmt(highestCard.price_usd ?? 0) : '—'}
        sub={highestCard ? truncate(highestCard.name, 14) : 'none yet'}
        onClick={highestCard ? () => onPickCard(highestCard) : undefined}
      />
    </div>
  );

  const rarityBlock = (
    <div className="glass-raised" style={{ padding: '14px', minWidth: 0 }}>
      <div className="flex items-center justify-between mb-2 min-w-0">
        <span className="mo-section-label truncate">Rarity Breakdown</span>
        <Gem size={16} style={{ color: 'var(--accent-gold)', opacity: 0.7, flexShrink: 0 }} />
      </div>
      <div className="flex flex-col gap-2">
        {RARITIES.map((r) => {
          const { o, t } = stats.byRarity[r];
          const pct = t ? (o / t) * 100 : 0;
          return (
            <div key={r} className="flex items-center gap-2 min-w-0">
              <span
                className="text-display flex-shrink-0"
                style={{
                  fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                  letterSpacing: '0.22em',
                  color: RARITY_COLOR[r],
                  width: 68,
                }}
              >
                {RARITY_LABEL[r]}
              </span>
              <div className="app-progress flex-1 min-w-0" style={{ height: 5 }}>
                <div
                  className="app-progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: RARITY_COLOR[r],
                    opacity: 0.85,
                  }}
                />
              </div>
              <span
                className="text-numeric flex-shrink-0"
                style={{
                  color: 'var(--ink-secondary)',
                  fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))',
                  width: 58,
                  textAlign: 'right',
                }}
              >
                {o}
                <span style={{ color: 'var(--ink-subtle)' }}> / {t}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`app-content has-fab-top ${expanded ? 'scroll' : ''}`}>
      {/* Editorial split: HERO + Portfolio + CTA on the left, stat grid (+ rarity when expanded) on the right at >=1024 */}
      <div className="stack desktop-wide">
        <div className="flex flex-col gap-3 min-w-0">
          {heroBlock}
          {portfolioStrip}
          {ctaRow}
        </div>
        <div className="flex flex-col gap-3 min-w-0">
          {statGrid}
          {expanded && rarityBlock}
        </div>
      </div>

      {/* TOGGLE */}
      <button
        type="button"
        className="app-loadmore"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <>
            <ChevronUp size={16} /> Hide Details
          </>
        ) : (
          <>
            <ChevronDown size={16} /> Show Details
          </>
        )}
      </button>

      {expanded && (
        <>
          <div className="ornate-hr" />

          <div className="glass-raised" style={{ padding: '14px 14px 10px', minWidth: 0 }}>
            <div className="flex items-center justify-between mb-2 min-w-0">
              <span className="mo-section-label truncate">Value Trend</span>
              <span
                className="text-display flex-shrink-0"
                style={{
                  fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                  letterSpacing: '0.2em',
                  color: 'var(--ink-muted)',
                }}
              >
                {currency}
              </span>
            </div>
            <SparklineReveal>
              <Sparkline values={valueSeries} />
            </SparklineReveal>
          </div>

          <div className="stack cols-2">
            {topValued.length > 0 && (
              <div className="glass-raised" style={{ padding: '14px', minWidth: 0 }}>
                <div className="flex items-center justify-between mb-2 min-w-0">
                  <span className="mo-section-label truncate">Top Valued</span>
                  <span
                    className="text-display flex-shrink-0"
                    style={{
                      fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                      letterSpacing: '0.22em',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    Top 5
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {topValued.map((c, i) => (
                    <button
                      key={c.collector_number}
                      type="button"
                      onClick={() => onPickCard(c)}
                      className="flex items-center gap-2.5 text-left py-1 px-1 rounded-sm transition-colors hover:bg-white/[0.04] min-w-0"
                    >
                      <span
                        className="text-display flex-shrink-0"
                        style={{
                          fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                          letterSpacing: '0.2em',
                          color: 'var(--accent-gold)',
                          opacity: 0.7,
                          width: 16,
                          textAlign: 'center',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div style={{ width: 30, flexShrink: 0 }}>
                        <CardThumb card={c} onClick={() => onPickCard(c)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            color: 'var(--ink-primary)',
                            fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))',
                            fontFamily: 'var(--font-body)',
                          }}
                          className="truncate"
                        >
                          {c.name}
                        </div>
                        <div
                          className="text-display truncate"
                          style={{
                            fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                            letterSpacing: '0.2em',
                            color: 'var(--ink-muted)',
                          }}
                        >
                          #{c.collector_number} · {c.rarity}
                        </div>
                      </div>
                      <span
                        className="text-numeric flex-shrink-0"
                        style={{
                          color: 'var(--accent-gold-bright)',
                          fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))',
                        }}
                      >
                        {fmt(c.price_usd ?? 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 min-w-0">
              <div className="glass-raised" style={{ padding: '14px', minWidth: 0 }}>
                <div className="flex items-center justify-between mb-2 min-w-0">
                  <span className="mo-section-label truncate">Recently Added</span>
                  <button
                    type="button"
                    className="text-display flex-shrink-0"
                    style={{
                      fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                      letterSpacing: '0.22em',
                      color: 'var(--accent-gold)',
                    }}
                    onClick={() => onJumpTo('binder')}
                  >
                    see all ›
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const c = recent[i];
                    return c ? (
                      <CardThumb key={c.collector_number} card={c} onClick={() => onPickCard(c)} />
                    ) : (
                      <CardThumb key={`empty-${i}`} empty />
                    );
                  })}
                </div>
              </div>

              {activity.length > 0 && (
                <div className="glass-raised" style={{ padding: '14px', minWidth: 0 }}>
                  <div className="flex items-center justify-between mb-2 min-w-0">
                    <span className="mo-section-label truncate">Activity Pulse</span>
                    <button
                      type="button"
                      className="text-display flex-shrink-0"
                      style={{
                        fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                        letterSpacing: '0.22em',
                        color: 'var(--accent-gold)',
                      }}
                      onClick={() => onJumpTo('timeline')}
                    >
                      timeline ›
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {activity.map(({ event, card }, i) => (
                      <button
                        key={`${event.date}-${i}`}
                        type="button"
                        disabled={!card}
                        onClick={() => card && onPickCard(card)}
                        className="flex items-center gap-2.5 text-left py-1.5 px-1 rounded-sm transition-colors hover:bg-white/[0.04] disabled:cursor-default disabled:hover:bg-transparent min-w-0"
                      >
                        <span
                          aria-hidden
                          className="flex-shrink-0"
                          style={{
                            width: 20,
                            height: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color:
                              event.type === 'remove'
                                ? 'var(--danger)'
                                : event.type === 'pack'
                                  ? 'var(--accent-crystal)'
                                  : 'var(--success)',
                          }}
                        >
                          {event.type === 'add' && <Plus size={16} />}
                          {event.type === 'remove' && <Minus size={16} />}
                          {event.type === 'pack' && <Sparkles size={16} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            style={{
                              color: 'var(--ink-primary)',
                              fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))',
                              fontFamily: 'var(--font-body)',
                            }}
                            className="truncate"
                          >
                            {card ? card.name : `#${event.cn}`}
                          </div>
                          <div
                            className="text-display truncate"
                            style={{
                              fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                              letterSpacing: '0.2em',
                              color: 'var(--ink-muted)',
                            }}
                          >
                            {event.type === 'pack'
                              ? 'Pulled from pack'
                              : event.type === 'add'
                                ? 'Added to collection'
                                : 'Removed'}
                          </div>
                        </div>
                        <span
                          className="text-display flex-shrink-0"
                          style={{
                            fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                            letterSpacing: '0.2em',
                            color: 'var(--ink-muted)',
                          }}
                        >
                          {relativeTime(event.date)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <GoldDivider />
        </>
      )}
    </div>
  );
}

interface QuickTileProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub: string;
  onClick?: () => void;
}

function QuickTile({ icon, label, value, sub, onClick }: QuickTileProps) {
  const inner = (
    <>
      <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
        <span style={{ color: 'var(--accent-gold)', opacity: 0.85, flexShrink: 0 }}>{icon}</span>
        <span
          className="mo-section-label truncate"
          style={{
            fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
            letterSpacing: '0.22em',
          }}
        >
          {label}
        </span>
      </div>
      <div className="mo-numeric-md truncate" style={{ minWidth: 0 }}>
        {value}
      </div>
      <div
        className="text-display mt-0.5 truncate"
        style={{
          fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
          letterSpacing: '0.2em',
          color: 'var(--ink-muted)',
        }}
      >
        {sub}
      </div>
    </>
  );
  const baseStyle: React.CSSProperties = {
    padding: 12,
    minWidth: 0,
  };
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="glass text-left transition-colors"
        style={baseStyle}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="glass" style={baseStyle}>
      {inner}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

interface CountUpProps {
  to: number;
  duration?: number;
  format?: (v: number) => string;
}

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

function CountUp({ to, duration = 700, format }: CountUpProps) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState<number>(reduce ? to : 0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef<number>(0);

  useEffect(() => {
    if (reduce) {
      setValue(to);
      return;
    }
    fromRef.current = 0;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number): void => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOut(t);
      setValue(fromRef.current + (to - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduce]);

  const display = format ? format(value) : Math.round(value).toString();
  return <>{display}</>;
}

interface SparklineRevealProps {
  children: ReactNode;
}

function SparklineReveal({ children }: SparklineRevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
      transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
