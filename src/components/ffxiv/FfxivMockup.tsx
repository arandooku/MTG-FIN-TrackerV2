import { useMemo, useState } from 'react';
import { Package, Scan, Search, Sparkles, Star, Coins, BookOpen, Compass, Shield, Zap, Heart, Gem } from 'lucide-react';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import type { Card as CardT } from '@/lib/schemas';
import '@/styles/ffxiv.css';

interface FfxivMockupProps {
  onExit: () => void;
}

const rarKey = (r: string): 'mythic' | 'rare' | 'uncommon' | 'common' =>
  r === 'mythic' ? 'mythic' : r === 'rare' ? 'rare' : r === 'uncommon' ? 'uncommon' : 'common';

const rarClass = (r: string) => `fxv-rar-${rarKey(r)}`;
const rarGem = (r: string) =>
  r === 'mythic' ? '#ff9958' : r === 'rare' ? '#ffcf66' : r === 'uncommon' ? '#6ed66e' : '#d8cfb7';

const rarLabel = (r: string) =>
  r === 'mythic' ? 'Aetherial' : r === 'rare' ? 'Rare' : r === 'uncommon' ? 'Uncommon' : 'Common';

export function FfxivMockup({ onExit }: FfxivMockupProps) {
  const { main } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const packs = useCollectionStore((s) => s.packs);
  const timeline = useCollectionStore((s) => s.timeline);
  const foilOwned = useCollectionStore((s) => s.foil);
  const binder = useConfigStore((s) => s.binder);
  const currency = useConfigStore((s) => s.currency);
  const { data: rate = 4.7 } = useFx();

  const [page, setPage] = useState(0);
  const [selectedCn, setSelectedCn] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const pages = useMemo(() => {
    if (!main.length) return [] as Array<CardT[]>;
    const sorted = sortByCollector(main);
    const { slotsPerPage } = binder;
    const out: CardT[][] = [];
    for (let p = 0; p * slotsPerPage < sorted.length; p++) {
      out.push(sorted.slice(p * slotsPerPage, p * slotsPerPage + slotsPerPage));
    }
    return out;
  }, [main, binder]);
  const currentPage = pages[Math.min(page, pages.length - 1)] ?? [];

  const ownedCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const cn of owned) m.set(cn, (m.get(cn) ?? 0) + 1);
    return m;
  }, [owned]);

  const inventory = useMemo(() => {
    const copy = [...main];
    const rarOrd: Record<string, number> = { mythic: 0, rare: 1, uncommon: 2, common: 3 };
    copy.sort((a, b) => {
      const r = (rarOrd[a.rarity] ?? 9) - (rarOrd[b.rarity] ?? 9);
      if (r !== 0) return r;
      return (b.price_usd ?? 0) - (a.price_usd ?? 0);
    });
    return copy.slice(0, 40);
  }, [main]);

  const selectedCard = useMemo(
    () => (selectedCn ? main.find((c) => c.collector_number === selectedCn) ?? null : null),
    [main, selectedCn],
  );

  const fmtGil = (usd: number) =>
    currency === 'MYR' ? `${(usd * rate).toFixed(0)}` : `${usd.toFixed(0)}`;

  const openItem = (cn: string) => {
    setSelectedCn(cn);
    setModalOpen(true);
  };

  const hotbar: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }> = [
    { key: '1', label: 'Search', icon: <Search size={18} />, active: true },
    { key: '2', label: 'Pack', icon: <Package size={18} /> },
    { key: '3', label: 'Scan', icon: <Scan size={18} /> },
    { key: '4', label: 'Foil', icon: <Sparkles size={18} /> },
    { key: '5', label: 'Set', icon: <Star size={18} /> },
    { key: '6', label: 'Price', icon: <Coins size={18} /> },
    { key: '7', label: 'Log', icon: <BookOpen size={18} /> },
    { key: '8', label: 'Map', icon: <Compass size={18} /> },
    { key: '9', label: 'Prot', icon: <Shield size={18} /> },
    { key: '0', label: 'Fx', icon: <Zap size={18} /> },
    { key: '-', label: 'Fav', icon: <Heart size={18} /> },
    { key: '=', label: 'Rare', icon: <Gem size={18} /> },
  ];

  return (
    <div className="ffxiv-root" role="dialog" aria-label="FFXIV design mockup">
      <button type="button" className="ffxiv-exit" onClick={onExit} aria-label="Exit mockup">
        ✕
      </button>

      <div className="ffxiv-wrap">
        {/* TOP BAR */}
        <div className="fxv-topbar">
          <div className="fxv-brand">
            <div className="fxv-job" title="Binder Keeper Lv.{level}">BK</div>
            <div>
              <div className="fxv-brand-name">Final Fantasy · Binder</div>
              <div className="fxv-brand-lvl">
                Binder Keeper · Lv.
                {Math.max(1, Math.round(stats.pct / 2))}
              </div>
            </div>
          </div>
          <div className="fxv-hpmp">
            <span className="lbl hp">HP · Set</span>
            <div className="fxv-bar hp">
              <span style={{ ['--pct' as string]: `${stats.pct}%` }} />
              <span className="val">
                {stats.unique} / {stats.total}
              </span>
            </div>
            <span className="lbl mp">MP · Foil</span>
            <div className="fxv-bar mp">
              <span
                style={{
                  ['--pct' as string]: `${Math.min(
                    100,
                    stats.unique ? (stats.foilCount / stats.unique) * 100 : 0,
                  )}%`,
                }}
              />
              <span className="val">{stats.foilCount}</span>
            </div>
            <span className="lbl tp">EXP</span>
            <div className="fxv-bar xp">
              <span style={{ ['--pct' as string]: `${Math.min(100, stats.totalCards / 5)}%` }} />
              <span className="val">{stats.totalCards}</span>
            </div>
          </div>
          <div className="fxv-topbar-meta">
            <div className="fxv-stat">
              <span className="k">Gil</span>
              <span className="v gil">{fmtGil(stats.gil + stats.gilFoil)}</span>
            </div>
            <div className="fxv-stat">
              <span className="k">Aether</span>
              <span className="v aether">{packs.length}</span>
            </div>
          </div>
        </div>

        {/* HOTBAR */}
        <div className="fxv-hotbar">
          {hotbar.map((h) => (
            <div key={h.key} className={`fxv-slot ${h.active ? 'active' : ''}`} title={h.label}>
              <span className="key">{h.key}</span>
              <span className="ico">{h.icon}</span>
              <span className="cd">{h.label}</span>
            </div>
          ))}
        </div>

        {/* 3-COLUMN LAYOUT */}
        <div className="fxv-layout">
          {/* LEFT — Character (Equipment/Binder page) */}
          <div className="fxv-win">
            <div className="fxv-win-title">
              Character · Binder
              <span
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  color: 'var(--fxv-gold)',
                  marginLeft: 'auto',
                  padding: '0 8px',
                }}
              >
                Pg. {page + 1}/{pages.length || 1}
              </span>
            </div>

            <div className="fxv-buffs" style={{ marginBottom: 10 }}>
              <div className="fxv-buff" title="Uniques">
                {stats.unique}
                <span className="cnt">U</span>
              </div>
              <div className="fxv-buff" title="Foils" style={{ color: 'var(--fxv-aether)' }}>
                {stats.foilCount}
                <span className="cnt">F</span>
              </div>
              <div className="fxv-buff" title="Packs" style={{ color: 'var(--fxv-tp)' }}>
                {packs.length}
                <span className="cnt">P</span>
              </div>
              <div
                className="fxv-buff"
                title="Completion %"
                style={{ color: 'var(--fxv-mp)' }}
              >
                {stats.pct.toFixed(0)}
                <span className="cnt">%</span>
              </div>
            </div>

            <div className="fxv-gear">
              {currentPage.map((c) => {
                const isOwned = ownedCounts.has(c.collector_number);
                const isSelected = selectedCn === c.collector_number;
                return (
                  <div
                    key={c.collector_number}
                    className={`fxv-gear-slot ${isOwned ? '' : 'empty'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => openItem(c.collector_number)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openItem(c.collector_number);
                    }}
                  >
                    <span className="cn">#{c.collector_number}</span>
                    <span className="gem" style={{ background: rarGem(c.rarity), color: rarGem(c.rarity) }} />
                    {isOwned && (c.image_small || c.image_normal) ? (
                      <img src={c.image_small || c.image_normal} alt={c.name} />
                    ) : (
                      <span className="nm">Empty</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="fxv-btn"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                ◀ Prev
              </button>
              <button
                type="button"
                className="fxv-btn"
                onClick={() => setPage(Math.min(pages.length - 1, page + 1))}
                disabled={page >= pages.length - 1}
              >
                Next ▶
              </button>
            </div>
          </div>

          {/* MIDDLE — Inventory */}
          <div className="fxv-win">
            <div className="fxv-win-title">Inventory · Set Items</div>
            <div className="fxv-inv">
              {inventory.map((c) => {
                const n = ownedCounts.get(c.collector_number) ?? 0;
                return (
                  <div
                    key={c.collector_number}
                    className={`fxv-item ${rarClass(c.rarity)} ${selectedCn === c.collector_number ? 'selected' : ''}`}
                    onClick={() => openItem(c.collector_number)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openItem(c.collector_number);
                    }}
                  >
                    <span className="ico">
                      {c.image_small ? <img src={c.image_small} alt="" /> : null}
                    </span>
                    <span className="nm">
                      {c.name}
                      <span className="sub">
                        {rarLabel(c.rarity)} · #{c.collector_number}
                      </span>
                    </span>
                    <span className="gil">{fmtGil(c.price_usd ?? 0)}</span>
                    <span className={`qty ${n === 0 ? 'zero' : ''}`}>×{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Chat log + quick panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fxv-win thin">
              <div className="fxv-win-title">Party Status</div>
              <div className="fxv-hpmp" style={{ padding: '4px 4px' }}>
                <span className="lbl">Mythic</span>
                <div className="fxv-bar hp">
                  <span style={{ ['--pct' as string]: `${stats.pct}%` }} />
                </div>
                <span className="lbl">Rare</span>
                <div className="fxv-bar tp">
                  <span style={{ ['--pct' as string]: `${Math.min(100, stats.pct * 1.2)}%` }} />
                </div>
                <span className="lbl">Uncommon</span>
                <div className="fxv-bar mp">
                  <span style={{ ['--pct' as string]: `${Math.min(100, stats.pct * 1.4)}%` }} />
                </div>
                <span className="lbl">Common</span>
                <div className="fxv-bar xp">
                  <span style={{ ['--pct' as string]: `${Math.min(100, stats.pct * 1.6)}%` }} />
                </div>
              </div>
            </div>

            <div className="fxv-win thin">
              <div className="fxv-win-title">Chat Log</div>
              <div className="fxv-chat">
                {[...timeline]
                  .slice(-20)
                  .reverse()
                  .map((e, i) => {
                    const cls =
                      e.type === 'add' ? 'add' : e.type === 'remove' ? 'drop' : 'pack';
                    const chLabel =
                      e.type === 'add' ? 'System' : e.type === 'remove' ? 'System' : 'Loot';
                    return (
                      <div key={`${e.cn}-${i}`} className={`fxv-chat-row ${cls}`}>
                        <span className="ts">
                          [{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
                        </span>
                        <span className="ch">{chLabel}</span>
                        <span className="msg">
                          {e.type === 'add' && (
                            <>You obtained <strong>#{e.cn}</strong>.</>
                          )}
                          {e.type === 'remove' && (
                            <>You discarded <strong>#{e.cn}</strong>.</>
                          )}
                          {e.type === 'pack' && (
                            <>Loot from pack: <strong>#{e.cn}</strong>.</>
                          )}
                        </span>
                      </div>
                    );
                  })}
                {timeline.length === 0 && (
                  <div className="fxv-chat-row sys">
                    <span className="ts">[00:00]</span>
                    <span className="ch">System</span>
                    <span className="msg">Welcome, adventurer. No events recorded yet.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="fxv-hint">
          <span className="key">CLICK</span> any slot / item to open tooltip
          <span className="key">ESC</span>
          closes modal
        </div>
      </div>

      {modalOpen && selectedCard && (
        <CardTooltip
          card={selectedCard}
          owned={ownedCounts.get(selectedCard.collector_number) ?? 0}
          foilVariants={foilOwned[selectedCard.collector_number] ?? []}
          fmtGil={fmtGil}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

/* ============================================================
   Card Modal — FFXIV item tooltip style
   ============================================================ */

interface CardTooltipProps {
  card: CardT;
  owned: number;
  foilVariants: string[];
  fmtGil: (usd: number) => string;
  onClose: () => void;
}

function CardTooltip({ card, owned, foilVariants, fmtGil, onClose }: CardTooltipProps) {
  const rarName = rarLabel(card.rarity);
  const gemColor = rarGem(card.rarity);
  const ilvl = Math.round(
    (card.rarity === 'mythic' ? 90 : card.rarity === 'rare' ? 70 : card.rarity === 'uncommon' ? 50 : 30) +
      Math.min(30, (card.price_usd ?? 0) * 2),
  );

  return (
    <div className="fxv-tooltip-backdrop" onClick={onClose}>
      <div
        className={`fxv-tooltip ${rarClass(card.rarity)}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${card.name} item tooltip`}
      >
        <button type="button" className="fxv-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="fxv-tt-head">
          <div className="fxv-tt-icon" aria-hidden>
            {card.image_small || card.image_normal ? (
              <img src={card.image_small || card.image_normal} alt="" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#222' }} />
            )}
          </div>
          <div className="fxv-tt-head-text">
            <div>
              <div className="fxv-tt-name">
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    transform: 'rotate(45deg) translateY(-2px)',
                    marginRight: 6,
                    background: gemColor,
                    boxShadow: `0 0 6px ${gemColor}`,
                  }}
                />
                {card.name}
              </div>
              <div className="fxv-tt-ilvl">
                Item Lv.<span className="num">{ilvl}</span>
                <span
                  style={{
                    marginLeft: 10,
                    padding: '1px 8px',
                    border: `1px solid ${gemColor}`,
                    color: gemColor,
                    fontSize: '0.66rem',
                    letterSpacing: '0.18em',
                  }}
                >
                  {rarName.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="fxv-tt-type">
              {card.type_line || 'Magic: the Gathering Card'}
              {card.mana_cost ? ` · ${card.mana_cost}` : ''}
            </div>
          </div>
        </div>

        <div className="fxv-tt-body">
          <div className="fxv-tt-stat">
            <span className="lbl">Collector №</span>
            <span className="val">#{card.collector_number}</span>
          </div>
          <div className="fxv-tt-stat">
            <span className="lbl">Market Price</span>
            <span className="val gil">{fmtGil(card.price_usd ?? 0)}</span>
          </div>
          <div className="fxv-tt-stat">
            <span className="lbl">Foil Market</span>
            <span className="val gil">{fmtGil(card.price_usd_foil ?? 0)}</span>
          </div>
          <div className="fxv-tt-stat">
            <span className="lbl">Owned</span>
            <span className={`val ${owned > 0 ? 'buff' : 'debuff'}`}>
              {owned > 0 ? `+${owned} in binder` : 'None acquired'}
            </span>
          </div>
          <div className="fxv-tt-stat">
            <span className="lbl">Foil Variants</span>
            <span className={`val ${foilVariants.length > 0 ? 'buff' : ''}`}>
              {foilVariants.length > 0
                ? foilVariants.slice(0, 3).join(', ') + (foilVariants.length > 3 ? ` +${foilVariants.length - 3}` : '')
                : 'None'}
            </span>
          </div>
          {card.finishes && card.finishes.length > 0 && (
            <div className="fxv-tt-stat">
              <span className="lbl">Finishes</span>
              <span className="val">{card.finishes.map((f) => f.toUpperCase()).join(' · ')}</span>
            </div>
          )}
        </div>

        <div className="fxv-tt-desc">
          {descForRarity(card)}
        </div>

        <div className="fxv-tt-foot">
          {card.scryfall_uri && (
            <a href={card.scryfall_uri} target="_blank" rel="noreferrer" className="fxv-btn">
              Scryfall
            </a>
          )}
          <button type="button" className="fxv-btn aether">Inspect</button>
          {owned > 0 ? (
            <button type="button" className="fxv-btn danger">Discard</button>
          ) : (
            <button type="button" className="fxv-btn prim">Acquire</button>
          )}
        </div>
      </div>
    </div>
  );
}

function descForRarity(card: CardT): string {
  const base = `A ${rarLabel(card.rarity).toLowerCase()} card from the Final Fantasy set.`;
  const suffix =
    card.rarity === 'mythic'
      ? ' Radiant with aetheric power — sought by the most dedicated collectors.'
      : card.rarity === 'rare'
        ? ' Rarely found in booster packs. A cornerstone of any collection.'
        : card.rarity === 'uncommon'
          ? ' A dependable staple for any binder.'
          : ' Common fare — useful for completionists.';
  return base + suffix;
}
