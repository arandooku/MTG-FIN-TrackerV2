import { useMemo, useState } from 'react';
import {
  Home,
  LayoutGrid,
  BookOpen,
  Layers,
  LineChart,
  User,
  Search,
  Plus,
  Eye,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import type { Card as CardT } from '@/lib/schemas';
import '@/styles/aether.css';

interface AetherMockupProps {
  onExit: () => void;
}

type TabKey = 'home' | 'collection' | 'binder' | 'decks' | 'stats' | 'profile';

const rarKey = (r: string): 'm' | 'r' | 'u' | 'c' =>
  r === 'mythic' ? 'm' : r === 'rare' ? 'r' : r === 'uncommon' ? 'u' : 'c';
const rarColor = (r: string) =>
  r === 'mythic'
    ? 'var(--ae-rar-mythic)'
    : r === 'rare'
      ? 'var(--ae-rar-rare)'
      : r === 'uncommon'
        ? 'var(--ae-rar-uncommon)'
        : 'var(--ae-rar-common)';
const rarName = (r: string) =>
  r === 'mythic' ? 'Mythic' : r === 'rare' ? 'Rare' : r === 'uncommon' ? 'Uncommon' : 'Common';

export function AetherMockup({ onExit }: AetherMockupProps) {
  const { main } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const packs = useCollectionStore((s) => s.packs);
  const timeline = useCollectionStore((s) => s.timeline);
  const foilOwned = useCollectionStore((s) => s.foil);
  const binder = useConfigStore((s) => s.binder);
  const currency = useConfigStore((s) => s.currency);
  const { data: rate = 4.7 } = useFx();

  const [tab, setTab] = useState<TabKey>('collection');
  const [rarFilter, setRarFilter] = useState<'all' | 'm' | 'r' | 'u' | 'c'>('all');
  const [colorFilter, setColorFilter] = useState<Set<string>>(new Set());
  const [searchQ, setSearchQ] = useState('');
  const [selectedCn, setSelectedCn] = useState<string | null>(null);
  const [modalCn, setModalCn] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const isMobile = (): boolean =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;
  const onCardTap = (cn: string) => {
    if (isMobile()) setModalCn(cn);
    else setSelectedCn(cn);
  };

  const stats = useMemo(() => {
    const set = new Set(owned);
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    let gil = 0;
    let gilFoil = 0;
    for (const cn of owned) gil += byCn.get(cn)?.price_usd ?? 0;
    for (const [cn, variants] of Object.entries(foilOwned)) {
      const c = byCn.get(cn);
      if (c) gilFoil += (c.price_usd_foil || c.price_usd) * variants.length;
    }
    const foilCount = Object.values(foilOwned).reduce((n, v) => n + v.length, 0);
    return {
      unique: set.size,
      total: main.length,
      pct: main.length ? (set.size / main.length) * 100 : 0,
      gil,
      gilFoil,
      foilCount,
      totalCards: owned.length,
    };
  }, [main, owned, foilOwned]);

  const fmtGil = (usd: number) =>
    currency === 'MYR' ? (usd * rate).toFixed(2) : usd.toFixed(2);

  const ownedCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const cn of owned) m.set(cn, (m.get(cn) ?? 0) + 1);
    return m;
  }, [owned]);

  const filtered = useMemo(() => {
    const sorted = sortByCollector(main);
    const q = searchQ.trim().toLowerCase();
    return sorted.filter((c) => {
      if (rarFilter !== 'all' && rarKey(c.rarity) !== rarFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.collector_number.includes(q)) return false;
      if (colorFilter.size > 0) {
        const mc = (c.mana_cost || '').toLowerCase();
        let match = false;
        for (const color of colorFilter) {
          if (color === 'c' && !/[wubrg]/i.test(mc)) match = true;
          else if (mc.includes(`{${color}}`)) match = true;
        }
        if (!match) return false;
      }
      return true;
    });
  }, [main, rarFilter, colorFilter, searchQ]);

  const visible = filtered.slice(0, 24);
  const selected = useMemo(
    () => (selectedCn ? main.find((c) => c.collector_number === selectedCn) ?? null : null),
    [main, selectedCn],
  );
  const modalCard = useMemo(
    () => (modalCn ? main.find((c) => c.collector_number === modalCn) ?? null : null),
    [main, modalCn],
  );

  const toggleColor = (c: string) =>
    setColorFilter((s) => {
      const next = new Set(s);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const defaultSelect = visible[0]?.collector_number ?? null;
  const effectiveSelected = selected ?? (defaultSelect ? main.find((c) => c.collector_number === defaultSelect) ?? null : null);

  const tabs: Array<{ k: TabKey; label: string; icon: React.ReactNode }> = [
    { k: 'home', label: 'Home', icon: <Home size={14} /> },
    { k: 'collection', label: 'Collection', icon: <LayoutGrid size={14} /> },
    { k: 'binder', label: 'Binder', icon: <BookOpen size={14} /> },
    { k: 'decks', label: 'Decks', icon: <Layers size={14} /> },
    { k: 'stats', label: 'Stats', icon: <LineChart size={14} /> },
    { k: 'profile', label: 'Profile', icon: <User size={14} /> },
  ];

  const sets = ['Final Fantasy', 'Eorzea Classics', 'Spells of Mana', 'Trading Post'];

  return (
    <div className="aether-root" role="dialog" aria-label="Aether design mockup">
      <button type="button" className="aether-exit" onClick={onExit} aria-label="Exit">
        ✕
      </button>

      <div className="aether-wrap">
        {/* HEADER */}
        <div className="ae-header">
          <h1 className="ae-title">
            <span className="accent">Aether</span>'s Binder
          </h1>
          <div className="ae-player">
            <span className="crystal" aria-hidden />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span className="nm">CloudRider</span>
              <span className="lvl">Lv. {Math.max(1, Math.round(stats.pct / 2))}</span>
            </div>
            <span className="gil">{fmtGil(stats.gil + stats.gilFoil)} G</span>
          </div>
        </div>

        {/* TABS */}
        <div className="ae-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.k}
              type="button"
              role="tab"
              aria-selected={tab === t.k}
              className={`ae-tab ${tab === t.k ? 'on' : ''}`}
              onClick={() => setTab(t.k)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* LAYOUT */}
        <div className="ae-layout">
          {/* LEFT SIDEBAR — filters (drawer on mobile) */}
          {filterOpen && (
            <div className="ae-sidebar-scrim ae-mobile-only" onClick={() => setFilterOpen(false)} />
          )}
          <div className={`ae-panel ae-sidebar ${filterOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="ae-drawer-close ae-mobile-only"
              onClick={() => setFilterOpen(false)}
              aria-label="Close filters"
            >
              ✕
            </button>
            <div className="ae-sidebar-overview">
              <div className="k">Collection Overview</div>
              <div className="v">
                {stats.unique.toLocaleString()}
                <span className="sep">/</span>
                {stats.total.toLocaleString()}
              </div>
            </div>

            <div className="ae-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
            </div>

            <div className="ae-filter-group">
              <div className="ae-filter-title">Sets</div>
              <ul className="ae-filter-list">
                {sets.map((s, i) => (
                  <li key={s} className={`ae-filter-item ${i === 0 ? 'on' : ''}`}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="ae-filter-group">
              <div className="ae-filter-title">Colors</div>
              <div className="ae-colors">
                {(['w', 'u', 'b', 'r', 'g', 'c'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`ae-color-dot ${c} ${colorFilter.has(c) ? 'on' : ''}`}
                    onClick={() => toggleColor(c)}
                    aria-label={`color ${c}`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="ae-filter-group">
              <div className="ae-filter-title">Rarity</div>
              <div className="ae-rar-dots">
                {(['m', 'r', 'u', 'c'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`ae-rar-dot ${r}`}
                    onClick={() => setRarFilter((cur) => (cur === r ? 'all' : r))}
                    aria-label={`rarity ${r}`}
                    style={rarFilter === r ? { outline: '2px solid var(--ae-crystal)', outlineOffset: 2 } : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="ae-filter-group">
              <div className="ae-filter-title">Format</div>
              <ul className="ae-filter-list">
                <li className="ae-filter-item">Standard</li>
                <li className="ae-filter-item">Commander</li>
                <li className="ae-filter-item">Modern</li>
              </ul>
            </div>
          </div>

          {/* CENTER GRID */}
          <div className="ae-grid-wrap">
            <div className="ae-grid-header">
              <div className="left">
                <span className="crys" aria-hidden />
                Binder View · {binder.presetName}
              </div>
              <div className="right">
                <button
                  type="button"
                  className="ae-filter-btn ae-mobile-only"
                  onClick={() => setFilterOpen(true)}
                >
                  <SlidersHorizontal size={12} /> Filters
                </button>
                <span className="pill">
                  Showing <strong>{visible.length}</strong>
                </span>
                <span className="pill ae-desktop-only">
                  Matches <strong>{filtered.length}</strong>
                </span>
                <button type="button" className="ae-btn sm">
                  <Plus size={12} /> Add Card
                </button>
              </div>
            </div>

            <div className="ae-grid">
              {visible.map((c) => {
                const n = ownedCounts.get(c.collector_number) ?? 0;
                const isSel = selectedCn === c.collector_number || (!selectedCn && c.collector_number === defaultSelect);
                return (
                  <div
                    key={c.collector_number}
                    className={`ae-card ${isSel ? 'selected' : ''}`}
                    onClick={() => onCardTap(c.collector_number)}
                    onDoubleClick={() => setModalCn(c.collector_number)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setModalCn(c.collector_number);
                      else if (e.key === ' ') setSelectedCn(c.collector_number);
                    }}
                  >
                    <div className={`ae-card-frame ${n === 0 ? 'empty' : ''}`}>
                      <span
                        className="ae-card-rar"
                        style={{ ['--rar-color' as string]: rarColor(c.rarity) }}
                        aria-hidden
                      />
                      {n > 0 && <span className="ae-card-qty">×{n}</span>}
                      {n > 0 && (c.image_small || c.image_normal) ? (
                        <img src={c.image_small || c.image_normal} alt={c.name} />
                      ) : n === 0 ? (
                        <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}>
                          #{c.collector_number}
                        </span>
                      ) : null}
                    </div>
                    <div className="ae-card-price">
                      {fmtGil(c.price_usd ?? 0)}
                      <span className="gil">GIL</span>
                    </div>
                    <div className="ae-card-name">{c.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT DETAIL */}
          <div className="ae-panel ae-detail">
            <div className="ae-panel-title">Card Details</div>
            {effectiveSelected ? (
              <>
                <div className="ae-detail-card">
                  {effectiveSelected.image_normal || effectiveSelected.image_small ? (
                    <img
                      src={effectiveSelected.image_normal || effectiveSelected.image_small}
                      alt={effectiveSelected.name}
                    />
                  ) : null}
                </div>
                <div>
                  <div className="ae-detail-name">{effectiveSelected.name}</div>
                  <div className="ae-detail-type">{effectiveSelected.type_line || 'Magic Card'}</div>
                  <div
                    className="ae-detail-rar"
                    style={{ ['--rar-color' as string]: rarColor(effectiveSelected.rarity) }}
                  >
                    ◆ {rarName(effectiveSelected.rarity)}
                  </div>
                </div>

                <div>
                  <div className="ae-filter-title" style={{ marginTop: 4 }}>
                    7-Day Market
                  </div>
                  <Sparkline seed={effectiveSelected.collector_number} />
                  <div className="ae-price-rows" style={{ marginTop: 6 }}>
                    <div className="ae-price-row">
                      <span className="k">Low</span>
                      <span className="v">{fmtGil((effectiveSelected.price_usd ?? 0) * 0.85)}</span>
                    </div>
                    <div className="ae-price-row">
                      <span className="k">High</span>
                      <span className="v">{fmtGil((effectiveSelected.price_usd ?? 0) * 1.08)}</span>
                    </div>
                  </div>
                </div>

                <div className="ae-detail-ownership">
                  <span className="k">Owned</span>
                  <span className="v">
                    {ownedCounts.get(effectiveSelected.collector_number) ?? 0} ·{' '}
                    {foilOwned[effectiveSelected.collector_number]?.length ?? 0} Foil
                  </span>
                </div>

                <div className="ae-actions">
                  <button
                    type="button"
                    className="ae-btn crys"
                    onClick={() => setModalCn(effectiveSelected.collector_number)}
                  >
                    <Eye size={14} /> View Details
                  </button>
                  <button type="button" className="ae-btn">
                    <Plus size={14} /> Add Card
                  </button>
                  <button type="button" className="ae-btn ghost">
                    <ShoppingCart size={14} /> Trade
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--ae-text-dim)', padding: 20, textAlign: 'center' }}>
                Select a card from the grid to inspect.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="ae-foot">
          <span className="chip">
            Total Cards <strong>{stats.totalCards.toLocaleString()}</strong>
          </span>
          <span className="chip">
            Total Value <strong>{fmtGil(stats.gil + stats.gilFoil)} Gil</strong>
          </span>
          <span className="chip">
            Packs <strong>{packs.length}</strong>
          </span>
          <span className="chip">
            Foils <strong>{stats.foilCount}</strong>
          </span>
          <span className="chip">
            <span className="dot" /> Synced · {timeline.length > 0 ? 'now' : 'never'}
          </span>
        </div>
      </div>

      {modalCard && (
        <AetherCardModal
          card={modalCard}
          ownedQty={ownedCounts.get(modalCard.collector_number) ?? 0}
          foilVariants={foilOwned[modalCard.collector_number] ?? []}
          fmtGil={fmtGil}
          onClose={() => setModalCn(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   Sparkline (7-day mock market chart)
   ============================================================ */
function Sparkline({ seed }: { seed: string }) {
  const data = useMemo(() => {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    const out: number[] = [];
    for (let i = 0; i < 14; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      out.push(0.3 + ((s >>> 8) & 0xff) / 255);
    }
    return out;
  }, [seed]);
  const w = 100;
  const h = 40;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => `${i * step},${h - d * h * 0.8 - h * 0.1}`).join(' ');
  const area = `${pts} ${w},${h} 0,${h}`;
  return (
    <div className="ae-sparkline">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ae-spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ae-crystal)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--ae-crystal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon className="spark-fill" points={area} />
        <polyline className="spark-line" points={pts} />
      </svg>
    </div>
  );
}

/* ============================================================
   Card Modal — Aether style (full overlay, variant tabs, stats)
   ============================================================ */
interface AetherCardModalProps {
  card: CardT;
  ownedQty: number;
  foilVariants: string[];
  fmtGil: (usd: number) => string;
  onClose: () => void;
}

function AetherCardModal({ card, ownedQty, foilVariants, fmtGil, onClose }: AetherCardModalProps) {
  const [variant, setVariant] = useState<'regular' | 'foil' | 'extended' | 'showcase'>('regular');
  const variants: Array<{ k: typeof variant; label: string }> = [
    { k: 'regular', label: 'Regular' },
    { k: 'foil', label: 'Foil' },
    { k: 'extended', label: 'Extended' },
    { k: 'showcase', label: 'Showcase' },
  ];
  return (
    <div className="ae-modal-backdrop" onClick={onClose}>
      <div className="ae-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${card.name} details`}>
        <button type="button" className="ae-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2
          style={{
            fontFamily: 'var(--ae-font-disp)',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '1.3rem',
            color: 'var(--ae-gold-hi)',
            letterSpacing: '0.12em',
            margin: '0 0 14px',
          }}
        >
          Card Information
        </h2>

        <div className="ae-modal-body">
          {/* card image column */}
          <div className="ae-modal-cardcol">
            <div className="ae-detail-card">
              {card.image_normal || card.image_small ? (
                <img src={card.image_normal || card.image_small} alt={card.name} />
              ) : null}
            </div>
            <div className="ae-variant-tabs">
              {variants.map((v) => (
                <button
                  key={v.k}
                  type="button"
                  className={`ae-variant-tab ${variant === v.k ? 'on' : ''}`}
                  onClick={() => setVariant(v.k)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <Sparkline seed={`${card.collector_number}-${variant}`} />
          </div>

          {/* info column */}
          <div className="ae-modal-info">
            <div>
              <div className="ae-detail-name" style={{ fontSize: '1.2rem' }}>
                {card.name}
              </div>
              <div className="ae-detail-type">{card.type_line || 'Magic: the Gathering'}</div>
              <div
                className="ae-detail-rar"
                style={{ ['--rar-color' as string]: rarColor(card.rarity) }}
              >
                ◆ {rarName(card.rarity)}
              </div>
            </div>

            <div className="ae-divider" />

            <div className="ae-stat-list">
              <div className="ae-stat-line">
                <span className="k">Collector №</span>
                <span className="v">#{card.collector_number}</span>
              </div>
              <div className="ae-stat-line">
                <span className="k">Mana Cost</span>
                <span className="v">{card.mana_cost || '—'}</span>
              </div>
              <div className="ae-stat-line">
                <span className="k">Market · Reg</span>
                <span className="v gil">{fmtGil(card.price_usd ?? 0)} G</span>
              </div>
              <div className="ae-stat-line">
                <span className="k">Market · Foil</span>
                <span className="v gil">{fmtGil(card.price_usd_foil ?? 0)} G</span>
              </div>
              <div className="ae-stat-line">
                <span className="k">Finishes</span>
                <span className="v">
                  {(card.finishes ?? []).map((f) => f.toUpperCase()).join(' · ') || '—'}
                </span>
              </div>
              <div className="ae-stat-line">
                <span className="k">Owned (Reg)</span>
                <span className="v crys">{ownedQty}</span>
              </div>
              <div className="ae-stat-line">
                <span className="k">Foil Variants</span>
                <span className="v crys">{foilVariants.length}</span>
              </div>
            </div>

            <div className="ae-divider" />

            <div>
              <div className="ae-filter-title">Price Trend · 7d</div>
              <div className="ae-price-rows" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="ae-price-row">
                  <span className="k">Low</span>
                  <span className="v">{fmtGil((card.price_usd ?? 0) * 0.85)}</span>
                </div>
                <div className="ae-price-row">
                  <span className="k">Avg</span>
                  <span className="v">{fmtGil(card.price_usd ?? 0)}</span>
                </div>
                <div className="ae-price-row">
                  <span className="k">High</span>
                  <span className="v">{fmtGil((card.price_usd ?? 0) * 1.08)}</span>
                </div>
              </div>
            </div>

            <div className="ae-actions" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <button type="button" className="ae-btn" style={{ flex: 1 }}>
                <Plus size={14} /> Add to Binder
              </button>
              <button type="button" className="ae-btn crys" style={{ flex: 1 }}>
                <Eye size={14} /> Wishlist
              </button>
              {card.scryfall_uri && (
                <a
                  href={card.scryfall_uri}
                  target="_blank"
                  rel="noreferrer"
                  className="ae-btn ghost"
                  style={{ flex: 1 }}
                >
                  Scryfall
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
