import { useMemo, useState } from 'react';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import { CardImage } from '../CardImage';
import { CardModal } from '../modals/CardModal';
import { classifyFoil, foilSlotClass } from '@/lib/foil';
import type { Card as CardT } from '@/lib/schemas';

export function Portfolio() {
  const { main, variants } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const foilOwned = useCollectionStore((s) => s.foil);
  const packs = useCollectionStore((s) => s.packs);
  const events = useCollectionStore((s) => s.timeline);
  const currency = useConfigStore((s) => s.currency);
  const setCurrency = useConfigStore((s) => s.setCurrency);
  const { data: rate = 4.7 } = useFx();
  const [query, setQuery] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [active, setActive] = useState<CardT | null>(null);

  const allCards = useMemo(() => [...main, ...variants], [main, variants]);
  const byCn = useMemo(
    () => new Map<string, CardT>(allCards.map((c) => [c.collector_number, c] as const)),
    [allCards],
  );

  const stats = useMemo(() => {
    let valueUsd = 0;
    let foilValueUsd = 0;
    let variantValueUsd = 0;
    const mainCns = new Set(main.map((c) => c.collector_number));
    for (const cn of owned) {
      const c = byCn.get(cn);
      if (!c) continue;
      valueUsd += c.price_usd ?? 0;
      if (!mainCns.has(cn)) variantValueUsd += c.price_usd ?? 0;
    }
    for (const [cn, foils] of Object.entries(foilOwned)) {
      const c = byCn.get(cn);
      if (!c) continue;
      foilValueUsd += (c.price_usd_foil ?? 0) * foils.length;
    }
    const ownedSet = new Set(owned);
    const missing = main.filter((c) => !ownedSet.has(c.collector_number));
    const stillNeedUsd = missing.reduce((s, c) => s + (c.price_usd ?? 0), 0);

    // Top 5 most valuable owned (by unique)
    const uniqueOwned = Array.from(new Set(owned))
      .map((cn) => byCn.get(cn))
      .filter((c): c is CardT => !!c)
      .sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    const topValuable = uniqueOwned.slice(0, 5);

    // Most wanted missing (top priced)
    const wanted = [...missing].sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0)).slice(0, 12);

    const totalFoils = Object.values(foilOwned).reduce((n, v) => n + v.length, 0);

    // Pack ROI: sum of pack values vs price paid (if stored). Fallback: pack count + card value per pack.
    const packRoi = packs.reduce(
      (acc, p) => {
        const val = p.cards.reduce((s, c) => {
          const cn = typeof c === 'string' ? c : c.cn;
          return s + (byCn.get(cn)?.price_usd ?? 0);
        }, 0);
        return { total: acc.total + val, count: acc.count + 1 };
      },
      { total: 0, count: 0 },
    );

    return {
      valueUsd,
      foilValueUsd,
      variantValueUsd,
      missing,
      stillNeedUsd,
      topValuable,
      wanted,
      totalFoils,
      packRoi,
      totalVariants: variants.length,
    };
  }, [owned, foilOwned, main, variants, packs, byCn]);

  const series = useMemo(() => {
    if (events.length === 0) return [] as Array<{ t: number; v: number }>;
    const sorted = [...events].sort((a, b) => (a.date < b.date ? -1 : 1));
    let running = 0;
    const points: Array<{ t: number; v: number }> = [];
    for (const e of sorted) {
      const card = byCn.get(e.cn);
      const price = card?.price_usd ?? 0;
      running += e.type === 'remove' ? -price : price;
      points.push({ t: new Date(e.date).getTime(), v: Math.max(0, running) });
    }
    return points;
  }, [events, byCn]);

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cn of owned) counts.set(cn, (counts.get(cn) ?? 0) + 1);
    const list: CardT[] = [];
    for (const cn of counts.keys()) {
      const card = byCn.get(cn);
      if (card) list.push(card);
    }
    const filtered = query
      ? list.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.collector_number.includes(query),
        )
      : list;
    return sortByCollector(filtered).map((card) => ({
      card,
      count: counts.get(card.collector_number) ?? 0,
    }));
  }, [owned, byCn, query]);

  const fmt = currency === 'MYR' ? (usd: number) => `RM ${(usd * rate).toFixed(2)}` : (usd: number) => `$${usd.toFixed(2)}`;

  return (
    <div className="space-y-4">
      {/* Collection Value hero */}
      <div className="port-panel">
        <span
          className="row-usd"
          onClick={() => setCurrency(currency === 'MYR' ? 'USD' : 'MYR')}
          role="button"
          title="Toggle currency"
        >
          <span className="chip-dot" />
          {currency === 'MYR' ? `$${stats.valueUsd.toFixed(2)} USD` : `RM ${(stats.valueUsd * rate).toFixed(2)}`}
        </span>
        <span className="label">Collection Value</span>
        <div className="big">{fmt(stats.valueUsd)}</div>
        <div className="sub">
          {new Set(owned).size} / {main.length} cards
        </div>
        <button
          type="button"
          className="mt-3 text-[0.7rem] font-ui uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)]"
          onClick={() => setDetailsOpen((v) => !v)}
        >
          Price Details {detailsOpen ? '▲' : '▼'}
        </button>
        {detailsOpen && <PortfolioChart series={series} />}
      </div>

      {/* Pack ROI + Still Need */}
      <div className="grid grid-cols-2 gap-3">
        <div className="port-panel">
          <span className="label">Pack ROI</span>
          {stats.packRoi.count === 0 ? (
            <div className="sub mt-2">Open packs to track ROI</div>
          ) : (
            <>
              <div className="big accent">{fmt(stats.packRoi.total)}</div>
              <div className="sub">
                {stats.packRoi.count} pack{stats.packRoi.count > 1 ? 's' : ''} opened
              </div>
            </>
          )}
        </div>
        <div className="port-panel">
          <span className="label">Still Need</span>
          <div className="big">{fmt(stats.stillNeedUsd)}</div>
          <div className="sub">
            {stats.missing.length} cards · avg {fmt(stats.stillNeedUsd / Math.max(1, stats.missing.length))}
          </div>
        </div>
      </div>

      {/* Most valuable owned */}
      <div className="port-panel">
        <span className="label">Most Valuable Owned</span>
        {stats.topValuable.length === 0 ? (
          <div className="sub mt-3 text-center">Start collecting to track your portfolio value</div>
        ) : (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {stats.topValuable.map((c) => (
              <button
                type="button"
                key={c.collector_number}
                onClick={() => setActive(c)}
                className="shrink-0 w-24 space-y-1 text-left"
              >
                <div className="relative overflow-hidden rounded-md">
                  <CardImage src={c.image_small} alt={c.name} className="aspect-[5/7]" />
                  {classifyFoil(c) !== 'none' && (
                    <div className={`foil-overlay ${foilSlotClass(c)}`} />
                  )}
                </div>
                <div className="truncate text-[0.72rem] font-semibold">{c.name}</div>
                <div className="text-[10px] font-num text-[var(--gold)]">{fmt(c.price_usd ?? 0)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Most wanted missing */}
      <div className="port-panel">
        <span className="label">Most Wanted (Missing)</span>
        {stats.wanted.length === 0 ? (
          <div className="sub mt-3 text-center">You own everything — nice.</div>
        ) : (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {stats.wanted.map((c) => (
              <button
                type="button"
                key={c.collector_number}
                onClick={() => setActive(c)}
                className="shrink-0 w-24 space-y-1 text-left"
              >
                <div className="relative overflow-hidden rounded-md">
                  <CardImage src={c.image_small} alt={c.name} className="aspect-[5/7] opacity-70" />
                </div>
                <div className="truncate text-[0.72rem] font-semibold">{c.name}</div>
                <div className="text-[10px] font-num text-[var(--accent)]">{fmt(c.price_usd ?? 0)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Foil value + Variants */}
      <div className="grid grid-cols-2 gap-3">
        <div className="port-panel">
          <span className="label">✦ Foil Value</span>
          <div className="big" style={{ color: 'var(--foil-color)' }}>
            {fmt(stats.foilValueUsd)}
          </div>
          <div className="sub">
            {stats.totalFoils} foil{stats.totalFoils === 1 ? '' : 's'}
          </div>
        </div>
        <div className="port-panel">
          <span className="label">◆ Variants</span>
          <div className="big accent">{fmt(stats.variantValueUsd)}</div>
          <div className="sub">
            {new Set(owned).size - new Set(owned).size + stats.totalVariants} catalog · owned value shown
          </div>
        </div>
      </div>

      <input
        placeholder="Filter by name or collector number…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-[var(--ff-border)] bg-[var(--slot-bg)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map(({ card, count }) => {
          const variant = classifyFoil(card);
          return (
            <button
              key={card.collector_number}
              type="button"
              onClick={() => setActive(card)}
              className="space-y-1 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="relative overflow-hidden rounded-md">
                <CardImage src={card.image_small} alt={card.name} className="aspect-[5/7]" />
                {variant !== 'none' && <div className={`foil-overlay ${foilSlotClass(card)}`} />}
                <div className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-num text-white">
                  ×{count}
                </div>
              </div>
              <div className="truncate text-xs font-semibold">{card.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] font-num">
                #{card.collector_number} · {fmt(card.price_usd ?? 0)}
              </div>
            </button>
          );
        })}
        {rows.length === 0 && (
          <div className="col-span-full py-10 text-center text-[var(--text-muted)]">
            No cards yet. Add some from the Binder tab.
          </div>
        )}
      </div>

      <CardModal card={active} onClose={() => setActive(null)} onSwitchCard={setActive} />
    </div>
  );
}

interface ChartProps {
  series: Array<{ t: number; v: number }>;
}

function PortfolioChart({ series }: ChartProps) {
  const W = 600;
  const H = 140;
  const PAD = 12;

  if (series.length < 2) {
    return (
      <div className="mt-3 text-xs text-[var(--text-muted)] text-center">
        Add more cards to see history
      </div>
    );
  }

  const minT = series[0].t;
  const maxT = series[series.length - 1].t;
  const maxV = Math.max(...series.map((p) => p.v), 1);
  const tx = (t: number) => PAD + ((t - minT) / Math.max(1, maxT - minT)) * (W - PAD * 2);
  const vy = (v: number) => H - PAD - (v / maxV) * (H - PAD * 2);
  const linePath = series
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${tx(p.t).toFixed(1)} ${vy(p.v).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${tx(maxT).toFixed(1)} ${H - PAD} L ${tx(minT).toFixed(1)} ${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full h-[140px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="portfolio-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#portfolio-grad)" className="portfolio-chart-area" />
      <path d={linePath} className="portfolio-chart-line" />
    </svg>
  );
}
