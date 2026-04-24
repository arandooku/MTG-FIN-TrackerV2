import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Sparkline } from '../shell/Sparkline';
import { CardImage } from '../CardImage';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import type { Card as CardT } from '@/lib/schemas';

type Tab = 'movers' | 'top' | 'watch';
const PAGE = 6;

interface MarketProps {
  onPickCard: (c: CardT) => void;
}

export function Market({ onPickCard }: MarketProps) {
  const { main, variants } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const foilOwned = useCollectionStore((s) => s.foil);
  const events = useCollectionStore((s) => s.timeline);
  const currency = useConfigStore((s) => s.currency);
  const setCurrency = useConfigStore((s) => s.setCurrency);
  const { data: rate = 4.7 } = useFx();
  const [tab, setTab] = useState<Tab>('movers');
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    setShown(PAGE);
  }, [tab]);

  const allCards = useMemo(() => [...main, ...variants], [main, variants]);
  const byCn = useMemo(
    () => new Map<string, CardT>(allCards.map((c) => [c.collector_number, c] as const)),
    [allCards],
  );

  const stats = useMemo(() => {
    let valueUsd = 0;
    let foilValueUsd = 0;
    const ownedSet = new Set(owned);
    for (const cn of ownedSet) {
      const c = byCn.get(cn);
      if (!c) continue;
      valueUsd += c.price_usd ?? 0;
    }
    for (const [cn, foils] of Object.entries(foilOwned)) {
      const c = byCn.get(cn);
      if (!c) continue;
      foilValueUsd += (c.price_usd_foil ?? 0) * foils.length;
    }
    const owners = Array.from(ownedSet)
      .map((cn) => byCn.get(cn))
      .filter((c): c is CardT => !!c);
    const top = [...owners].sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    return { valueUsd, foilValueUsd, top };
  }, [owned, foilOwned, byCn]);

  const valueSeries = useMemo(() => {
    if (!events.length) return [] as number[];
    const sorted = [...events].sort((a, b) => (a.date < b.date ? -1 : 1));
    let v = 0;
    return sorted.map((e) => {
      const price = byCn.get(e.cn)?.price_usd ?? 0;
      v += e.type === 'remove' ? -price : price;
      return Math.max(0, v);
    });
  }, [events, byCn]);

  const fmt =
    currency === 'MYR'
      ? (usd: number) => `RM ${(usd * rate).toFixed(2)}`
      : (usd: number) => `$${usd.toFixed(2)}`;

  const pool = useMemo(() => {
    if (tab === 'top') {
      return [...main].sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    }
    if (tab === 'watch') return stats.top;
    return stats.top;
  }, [tab, main, stats.top]);

  const movers = pool.slice(0, shown);
  const canLoadMore = shown < pool.length;
  const totalDelta = stats.valueUsd + stats.foilValueUsd;
  const weekTrend = useMemo(() => {
    if (valueSeries.length < 2) return null;
    const prior = valueSeries[0];
    const now = valueSeries[valueSeries.length - 1];
    if (!prior || prior === now) return null;
    const pct = ((now - prior) / prior) * 100;
    return { pct, up: pct >= 0 };
  }, [valueSeries]);

  const portfolioHero = (
    <div
      className="glass-raised glow-gold"
      style={{ padding: '16px 14px', minWidth: 0 }}
    >
      <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
        <span className="mo-section-label truncate">Portfolio</span>
        <div className="flex-shrink-0">
          <button
            type="button"
            className="app-chip"
            onClick={() => setCurrency(currency === 'MYR' ? 'USD' : 'MYR')}
          >
            {currency} ⇆
          </button>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-3 min-w-0">
        <div className="mo-numeric-hero truncate" style={{ minWidth: 0 }}>
          {fmt(totalDelta)}
        </div>
        {weekTrend && (
          <span
            className="text-display flex items-center gap-1 flex-shrink-0"
            style={{
              fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
              letterSpacing: '0.2em',
              color: weekTrend.up ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {weekTrend.up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {weekTrend.up ? '+' : ''}
            {weekTrend.pct.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2 mb-1">
        <Sparkline values={valueSeries} />
      </div>
      <div className="ornate-hr" />
      <div className="grid grid-cols-3 gap-2 mt-1">
        <Cell label="Owned" value={String(new Set(owned).size)} />
        <Cell
          label="Foils"
          value={String(Object.values(foilOwned).reduce((n, v) => n + v.length, 0))}
        />
        <Cell label="Foil Value" value={fmt(stats.foilValueUsd)} accent="crystal" />
      </div>
    </div>
  );

  const tabChips = (
    <div className="grid grid-cols-3 gap-1.5">
      <button
        type="button"
        className={`app-chip ${tab === 'movers' ? 'active' : ''} justify-center`}
        onClick={() => setTab('movers')}
      >
        Movers
      </button>
      <button
        type="button"
        className={`app-chip ${tab === 'top' ? 'active' : ''} justify-center`}
        onClick={() => setTab('top')}
      >
        Top FIN
      </button>
      <button
        type="button"
        className={`app-chip ${tab === 'watch' ? 'active' : ''} justify-center`}
        onClick={() => setTab('watch')}
      >
        Watchlist
      </button>
    </div>
  );

  const tableHeader = (
    <div
      className="flex items-center gap-2 px-2 min-w-0"
      style={{ marginBottom: -4 }}
    >
      <span
        className="mo-section-label flex-1 truncate"
        style={{ fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))', letterSpacing: '0.22em' }}
      >
        Card
      </span>
      <span
        className="mo-section-label flex-shrink-0"
        style={{ fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))', letterSpacing: '0.22em' }}
      >
        Price
      </span>
    </div>
  );

  const tableBody = (
    <div
      className="glass !mb-0"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: 0,
        minWidth: 0,
      }}
    >
      {movers.length === 0 ? (
        <div
          className="text-display text-center"
          style={{
            fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
            letterSpacing: '0.22em',
            color: 'var(--ink-muted)',
            padding: '32px 0',
          }}
        >
          No data
        </div>
      ) : (
        movers.map((c, i) => {
          const delta = c.price_usd_foil && c.price_usd
            ? ((c.price_usd_foil - c.price_usd) / c.price_usd) * 100
            : null;
          const up = delta !== null && delta >= 0;
          return (
            <div
              key={c.collector_number}
              className="app-price-row"
              onClick={() => onPickCard(c)}
              style={{
                background:
                  i % 2 === 0 ? 'var(--surface-1)' : 'var(--surface-2)',
                borderBottom: '1px solid var(--border-hair)',
              }}
            >
              <div className="app-price-thumb">
                <CardImage src={c.image_small} alt={c.name} className="h-full w-full" />
              </div>
              <div className="pi" style={{ minWidth: 0 }}>
                <div className="pi-name">{c.name}</div>
                <div className="pi-sub">
                  FIN · #{c.collector_number} · {c.rarity}
                </div>
              </div>
              <div className="pv" style={{ flexShrink: 0 }}>
                <div
                  className="text-numeric"
                  style={{
                    fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))',
                    color: 'var(--accent-gold-bright)',
                  }}
                >
                  {fmt(c.price_usd ?? 0)}
                </div>
                {c.price_usd_foil ? (
                  <div
                    className="text-display flex items-center gap-1 justify-end"
                    style={{
                      fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
                      letterSpacing: '0.15em',
                      color: up ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    ✦ {fmt(c.price_usd_foil)}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="app-content">
      {/* Editorial split: portfolio hero on left, table chips + scroll on right at >=1024 */}
      <div className="stack desktop-wide">
        <div className="flex flex-col gap-3 min-w-0">{portfolioHero}</div>
        <div className="flex flex-col gap-3 min-w-0" style={{ flex: 1, minHeight: 0 }}>
          {tabChips}
          {tableHeader}
          {tableBody}
        </div>
      </div>

      {canLoadMore && (
        <button
          type="button"
          className="app-loadmore"
          onClick={() => setShown((n) => n + PAGE)}
        >
          Load More ({pool.length - shown})
        </button>
      )}
    </div>
  );
}

interface CellProps {
  label: string;
  value: string;
  accent?: 'gold' | 'crystal';
}
function Cell({ label, value, accent = 'gold' }: CellProps) {
  return (
    <div className="text-center min-w-0">
      <div
        className="mo-section-label truncate"
        style={{
          fontSize: 'var(--fs-label, clamp(0.625rem, 0.9vw, 0.75rem))',
          letterSpacing: '0.22em',
        }}
      >
        {label}
      </div>
      <div
        className="mo-numeric-md mt-1 truncate"
        style={{
          color: accent === 'crystal' ? 'var(--accent-crystal)' : 'var(--accent-gold)',
          minWidth: 0,
        }}
      >
        {value}
      </div>
    </div>
  );
}
