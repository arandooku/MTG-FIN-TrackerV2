import { useMemo, useState } from 'react';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { sortByCollector } from '@/lib/binder';
import type { Card as CardT } from '@/lib/schemas';
import '@/styles/ff7r.css';

type CatKey = 'status' | 'materia' | 'binder' | 'shop' | 'log' | 'config';

interface Ff7rMockupProps {
  onExit: () => void;
}

export function Ff7rMockup({ onExit }: Ff7rMockupProps) {
  const { main } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const packs = useCollectionStore((s) => s.packs);
  const timeline = useCollectionStore((s) => s.timeline);
  const foilOwned = useCollectionStore((s) => s.foil);
  const binder = useConfigStore((s) => s.binder);
  const currency = useConfigStore((s) => s.currency);
  const { data: rate = 4.7 } = useFx();

  const [cat, setCat] = useState<CatKey>('status');
  const [page, setPage] = useState(0);
  const [selectedCn, setSelectedCn] = useState<string | null>(null);

  const stats = useMemo(() => {
    const ownedSet = new Set(owned);
    const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
    let valueUsd = 0;
    let valueFoilUsd = 0;
    const rar = { m: 0, r: 0, u: 0, c: 0 };
    const rarT = { m: 0, r: 0, u: 0, c: 0 };
    for (const c of main) {
      const k = c.rarity === 'mythic' ? 'm' : c.rarity === 'rare' ? 'r' : c.rarity === 'uncommon' ? 'u' : 'c';
      rarT[k]++;
    }
    for (const cn of ownedSet) {
      const c = byCn.get(cn);
      if (!c) continue;
      const k = c.rarity === 'mythic' ? 'm' : c.rarity === 'rare' ? 'r' : c.rarity === 'uncommon' ? 'u' : 'c';
      rar[k]++;
    }
    for (const cn of owned) {
      const c = byCn.get(cn);
      if (!c) continue;
      valueUsd += c.price_usd ?? 0;
    }
    for (const [cn, variants] of Object.entries(foilOwned)) {
      const c = byCn.get(cn);
      if (!c) continue;
      valueFoilUsd += (c.price_usd_foil || c.price_usd) * variants.length;
    }
    const foilCount = Object.values(foilOwned).reduce((n, v) => n + v.length, 0);
    const unique = ownedSet.size;
    const total = main.length;
    return {
      unique,
      total,
      pct: total ? (unique / total) * 100 : 0,
      rar,
      rarT,
      valueUsd,
      valueFoilUsd,
      foilCount,
      totalCards: owned.length,
    };
  }, [main, owned, foilOwned]);

  const pages = useMemo(() => {
    if (!main.length) return [] as Array<{ cards: CardT[]; owned: number; total: number }>;
    const sorted = sortByCollector(main);
    const { slotsPerPage } = binder;
    const ownedSet = new Set(owned);
    const out: Array<{ cards: CardT[]; owned: number; total: number }> = [];
    for (let p = 0; p * slotsPerPage < sorted.length; p++) {
      const slice = sorted.slice(p * slotsPerPage, p * slotsPerPage + slotsPerPage);
      out.push({
        cards: slice,
        owned: slice.filter((c) => ownedSet.has(c.collector_number)).length,
        total: slice.length,
      });
    }
    return out;
  }, [main, owned, binder]);

  const selectedCard = useMemo(() => {
    if (!selectedCn) return null;
    return main.find((c) => c.collector_number === selectedCn) ?? null;
  }, [main, selectedCn]);

  const fmtVal = (usd: number) =>
    currency === 'MYR' ? `RM ${(usd * rate).toFixed(0)}` : `$${usd.toFixed(0)}`;

  const menu: Array<{ k: CatKey; label: string; tag: string; hint: string }> = [
    { k: 'status', label: 'Status', tag: '01', hint: 'Overview of party (collection) status' },
    { k: 'materia', label: 'Materia', tag: '02', hint: 'Manage foil variants and special finishes' },
    { k: 'binder', label: 'Binder', tag: '03', hint: 'Equip cards into your binder pages' },
    { k: 'shop', label: 'Shop', tag: '04', hint: 'Browse inventory by price and rarity' },
    { k: 'log', label: 'Log', tag: '05', hint: 'Review recent battle events (timeline)' },
    { k: 'config', label: 'Config', tag: '06', hint: 'System settings and preferences' },
  ];

  return (
    <div className="ff7r-root" role="dialog" aria-label="FF7R design mockup">
      <button type="button" className="ff7r-close" onClick={onExit} aria-label="Exit mockup">
        ✕
      </button>

      <div className="ff7r-wrap">
        {/* HUD */}
        <div className="ff7r-hud">
          <div className="ff7r-hud-brand">
            <div className="ff7r-brand-mark" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
                <path d="M12 7 L17 10 L17 15 L12 18 L7 15 L7 10 Z" />
              </svg>
            </div>
            <div>
              <div className="ff7r-brand-title">Final Fantasy · Binder</div>
              <div className="ff7r-brand-sub">MTG FIN Tracker — System Menu</div>
            </div>
          </div>
          <div />
          <div className="ff7r-hud-meta">
            <div className="ff7r-hud-stat">
              <span className="k">Completion</span>
              <span className="v cy">{stats.pct.toFixed(1)}%</span>
            </div>
            <div className="ff7r-hud-stat">
              <span className="k">Cards</span>
              <span className="v">
                {stats.unique}
                <span style={{ color: 'var(--f7-text-ghost)', fontSize: '0.8rem' }}>/{stats.total}</span>
              </span>
            </div>
            <div className="ff7r-hud-stat">
              <span className="k">Gil</span>
              <span className="v">{fmtVal(stats.valueUsd + stats.valueFoilUsd)}</span>
            </div>
            <div className="ff7r-hud-stat">
              <span className="k">Packs</span>
              <span className="v cy">{packs.length}</span>
            </div>
          </div>
        </div>

        {/* Category tab strip */}
        <div className="f7-catbar" role="tablist">
          {menu.map((m) => (
            <button
              key={m.k}
              type="button"
              role="tab"
              aria-selected={cat === m.k}
              className={cat === m.k ? 'on' : ''}
              onClick={() => setCat(m.k)}
            >
              <span style={{ color: 'var(--f7-edge-hi)', marginRight: 8, fontStyle: 'normal' }}>
                {m.tag}
              </span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="ff7r-grid cols-2" style={{ marginTop: 14 }}>
          {/* LEFT: persistent command menu */}
          <div className="ff7r-panel thin" style={{ gridColumn: 'span 1' }}>
            <span className="br-bl" />
            <span className="br-br" />
            <SectionTitle primary="Command" secondary="Party" />
            <ul className="f7-menu" style={{ marginTop: 10 }}>
              {menu.map((m) => (
                <li
                  key={m.k}
                  className={cat === m.k ? 'active' : ''}
                  onClick={() => setCat(m.k)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setCat(m.k);
                  }}
                >
                  <span />
                  <span>{m.label}</span>
                  <span className="tag">{m.tag}</span>
                  <span className="hint">{m.hint}</span>
                </li>
              ))}
            </ul>
            <div className="f7-infotag" style={{ marginTop: 14 }}>
              Navigate with <span style={{ color: 'var(--f7-edge-hi)' }}>▲ ▼</span>, confirm with{' '}
              <span style={{ color: 'var(--f7-mat-magic)' }}>✕</span>, back with{' '}
              <span style={{ color: 'var(--f7-danger)' }}>◯</span>.
            </div>
          </div>

          {/* RIGHT: category content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cat === 'status' && (
              <StatusPanel
                stats={stats}
                fmtVal={fmtVal}
                packsOpened={packs.length}
                recentAdds={timeline.filter((e) => e.type !== 'remove').slice(-5).reverse()}
              />
            )}
            {cat === 'materia' && (
              <MateriaPanel
                main={main}
                foilOwned={foilOwned}
                setFoilCount={stats.foilCount}
                foilValue={stats.valueFoilUsd}
                fmtVal={fmtVal}
              />
            )}
            {cat === 'binder' && (
              <BinderPanel
                pages={pages}
                page={page}
                setPage={setPage}
                ownedSet={new Set(owned)}
                onSelect={setSelectedCn}
                selectedCn={selectedCn}
                selectedCard={selectedCard}
                fmtVal={fmtVal}
              />
            )}
            {cat === 'shop' && (
              <ShopPanel
                main={main}
                ownedCounts={owned}
                currency={currency}
                fmtVal={fmtVal}
                onPick={setSelectedCn}
                selectedCn={selectedCn}
                selectedCard={selectedCard}
              />
            )}
            {cat === 'log' && <LogPanel timeline={timeline} main={main} />}
            {cat === 'config' && <ConfigPanel />}
          </div>
        </div>

        {/* keybar */}
        <div className="f7-keybar">
          <span className="k">
            <span className="btn x">✕</span> Confirm
          </span>
          <span className="k">
            <span className="btn o">◯</span> Back
          </span>
          <span className="k">
            <span className="btn tri">△</span> Menu
          </span>
          <span className="k">
            <span className="btn sq">□</span> Materia
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-panels — inline, single file
   ============================================================ */

function SectionTitle({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div className="ff7r-section-title">
      {primary}
      {secondary && (
        <>
          <span className="slash">/</span>
          <span style={{ color: 'var(--f7-edge-hi)' }}>{secondary}</span>
        </>
      )}
    </div>
  );
}

interface StatsShape {
  unique: number;
  total: number;
  pct: number;
  rar: { m: number; r: number; u: number; c: number };
  rarT: { m: number; r: number; u: number; c: number };
  valueUsd: number;
  valueFoilUsd: number;
  foilCount: number;
  totalCards: number;
}

function StatusPanel({
  stats,
  fmtVal,
  packsOpened,
  recentAdds,
}: {
  stats: StatsShape;
  fmtVal: (usd: number) => string;
  packsOpened: number;
  recentAdds: Array<{ cn: string; date: string; type: string }>;
}) {
  const atbSegments = 8;
  const atbFilled = Math.min(atbSegments, Math.round((packsOpened / 6) * atbSegments) || (packsOpened > 0 ? 1 : 0));
  return (
    <>
      <div className="ff7r-panel">
        <span className="br-bl" />
        <span className="br-br" />
        <SectionTitle primary="Status" secondary="Cloud" />
        <div className="ff7r-grid cols-2" style={{ gap: 18, marginTop: 14 }}>
          <div>
            <div className="f7-stat-row">
              <span className="lbl">HP</span>
              <div className="f7-bar thick">
                <span style={{ ['--pct' as string]: `${stats.pct}%` }} />
              </div>
              <span className="val">
                {stats.unique}
                <span style={{ color: 'var(--f7-text-ghost)' }}>/{stats.total}</span>
              </span>
            </div>
            <div className="f7-stat-row">
              <span className="lbl">MP</span>
              <div className="f7-bar mp thick">
                <span style={{ ['--pct' as string]: `${stats.total ? (stats.foilCount / Math.max(1, stats.unique)) * 100 : 0}%` }} />
              </div>
              <span className="val cy">{stats.foilCount}</span>
            </div>
            <div className="f7-stat-row">
              <span className="lbl">ATB</span>
              <div className="f7-atb">
                {Array.from({ length: atbSegments }).map((_, i) => (
                  <i key={i} className={i < atbFilled ? 'on' : ''} />
                ))}
              </div>
              <span className="val">{packsOpened}</span>
            </div>
            <div className="f7-stat-row">
              <span className="lbl">EXP</span>
              <div className="f7-bar xp">
                <span style={{ ['--pct' as string]: `${Math.min(100, stats.totalCards / 5)}%` }} />
              </div>
              <span className="val ok">{stats.totalCards}</span>
            </div>
          </div>

          <div>
            <div className="f7-stat-row">
              <span className="lbl">Mythic</span>
              <div className="f7-bar">
                <span style={{ ['--pct' as string]: `${stats.rarT.m ? (stats.rar.m / stats.rarT.m) * 100 : 0}%` }} />
              </div>
              <span className="val">
                {stats.rar.m}/{stats.rarT.m}
              </span>
            </div>
            <div className="f7-stat-row">
              <span className="lbl">Rare</span>
              <div className="f7-bar">
                <span style={{ ['--pct' as string]: `${stats.rarT.r ? (stats.rar.r / stats.rarT.r) * 100 : 0}%` }} />
              </div>
              <span className="val">
                {stats.rar.r}/{stats.rarT.r}
              </span>
            </div>
            <div className="f7-stat-row">
              <span className="lbl">Uncommon</span>
              <div className="f7-bar mp">
                <span style={{ ['--pct' as string]: `${stats.rarT.u ? (stats.rar.u / stats.rarT.u) * 100 : 0}%` }} />
              </div>
              <span className="val cy">
                {stats.rar.u}/{stats.rarT.u}
              </span>
            </div>
            <div className="f7-stat-row">
              <span className="lbl">Common</span>
              <div className="f7-bar xp">
                <span style={{ ['--pct' as string]: `${stats.rarT.c ? (stats.rar.c / stats.rarT.c) * 100 : 0}%` }} />
              </div>
              <span className="val ok">
                {stats.rar.c}/{stats.rarT.c}
              </span>
            </div>
          </div>
        </div>

        <div className="f7-infotag">
          Status reflects your current party (collection). HP = unique card progress. MP = total foil variants earned.
          ATB = booster packs opened. EXP = total cards acquired.
        </div>
      </div>

      <div className="ff7r-grid cols-3">
        <div className="ff7r-panel thin">
          <span className="br-bl" />
          <span className="br-br" />
          <div className="f7-stat-row" style={{ gridTemplateColumns: '1fr', padding: 0, border: 0 }}>
            <span className="lbl">Gil (Collection)</span>
          </div>
          <div style={{ fontFamily: 'var(--f7-font-num)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--f7-edge-hot)' }}>
            {fmtVal(stats.valueUsd)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--f7-text-ghost)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Non-foil value
          </div>
        </div>

        <div className="ff7r-panel thin">
          <span className="br-bl" />
          <span className="br-br" />
          <div className="f7-stat-row" style={{ gridTemplateColumns: '1fr', padding: 0, border: 0 }}>
            <span className="lbl">Materia Value</span>
          </div>
          <div style={{ fontFamily: 'var(--f7-font-num)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--f7-mat-command)' }}>
            {fmtVal(stats.valueFoilUsd)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--f7-text-ghost)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Foil variants value
          </div>
        </div>

        <div className="ff7r-panel thin">
          <span className="br-bl" />
          <span className="br-br" />
          <div className="f7-stat-row" style={{ gridTemplateColumns: '1fr', padding: 0, border: 0 }}>
            <span className="lbl">Remaining</span>
          </div>
          <div style={{ fontFamily: 'var(--f7-font-num)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--f7-accent)' }}>
            {Math.max(0, stats.total - stats.unique)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--f7-text-ghost)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Cards to complete
          </div>
        </div>
      </div>

      <div className="ff7r-panel thin">
        <span className="br-bl" />
        <span className="br-br" />
        <SectionTitle primary="Recent" secondary="Events" />
        {recentAdds.length === 0 ? (
          <div style={{ color: 'var(--f7-text-ghost)', padding: '14px 4px', fontSize: '0.85rem' }}>
            No recent actions. Open a pack or add cards to begin.
          </div>
        ) : (
          <div className="f7-log" style={{ maxHeight: 160, marginTop: 10 }}>
            {recentAdds.map((e, i) => (
              <div key={`${e.cn}-${i}`} className={`f7-log-row ${e.type === 'pack' ? 'pack' : 'add'}`}>
                <span className="ts">{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="ev">{e.type === 'pack' ? 'PACK' : 'ADD'}</span>
                <span className="card-name">#{e.cn}</span>
                <span className="meta">+1</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="f7-btn ghost">View All</button>
          <button type="button" className="f7-btn hot">Open Pack</button>
        </div>
      </div>
    </>
  );
}

function MateriaPanel({
  main,
  foilOwned,
  setFoilCount,
  foilValue,
  fmtVal,
}: {
  main: CardT[];
  foilOwned: Record<string, string[]>;
  setFoilCount: number;
  foilValue: number;
  fmtVal: (usd: number) => string;
}) {
  const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
  const materiaEntries = Object.entries(foilOwned).slice(0, 24);
  const slotsFilled = materiaEntries.length;
  const slotsTotal = 24;
  const emptySlots = Math.max(0, slotsTotal - slotsFilled);
  const kindForVariant = (variants: string[]): 'magic' | 'command' | 'summon' | 'support' | 'indep' => {
    if (variants.includes('neon') || variants.includes('serialized')) return 'summon';
    if (variants.includes('surge') || variants.includes('showcase_foil')) return 'command';
    if (variants.includes('collector') || variants.includes('collector_foil')) return 'support';
    if (variants.includes('extended') || variants.includes('extended_foil')) return 'indep';
    return 'magic';
  };

  return (
    <>
      <div className="ff7r-panel">
        <span className="br-bl" />
        <span className="br-br" />
        <SectionTitle primary="Materia" secondary="Foil Variants" />
        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 8, flexWrap: 'wrap' }}>
          <div className="ff7r-hud-stat">
            <span className="k">Equipped</span>
            <span className="v cy">
              {slotsFilled}
              <span style={{ color: 'var(--f7-text-ghost)', fontSize: '0.8rem' }}>/{slotsTotal}</span>
            </span>
          </div>
          <div className="ff7r-hud-stat">
            <span className="k">Variants</span>
            <span className="v">{setFoilCount}</span>
          </div>
          <div className="ff7r-hud-stat">
            <span className="k">Value</span>
            <span className="v">{fmtVal(foilValue)}</span>
          </div>
        </div>
        <div className="f7-materia-grid" style={{ marginTop: 18 }}>
          {materiaEntries.map(([cn, variants]) => {
            const c = byCn.get(cn);
            const kind = kindForVariant(variants);
            return (
              <div key={cn} className="f7-materia-slot" title={`#${cn} · ${c?.name ?? ''}`}>
                <div
                  className={`f7-materia ${variants.length > 1 ? 'complete' : ''}`}
                  data-kind={kind}
                >
                  <span className="ring" />
                  {variants.length}
                </div>
                <span className="cap">{cn}</span>
              </div>
            );
          })}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`e${i}`} className="f7-materia-slot">
              <div className="f7-materia empty">
                <span className="ring" />+
              </div>
              <span className="cap">—</span>
            </div>
          ))}
        </div>
        <div className="f7-infotag">
          Each materia represents a foil variant owned for a card. Magic (green) = standard foil. Summon (red) = neon/serialized.
          Command (gold) = surge/showcase. Support (blue) = collector. Independent (purple) = extended art.
        </div>
      </div>

      <div className="ff7r-panel thin">
        <span className="br-bl" />
        <span className="br-br" />
        <SectionTitle primary="Legend" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginTop: 10 }}>
          {(
            [
              { k: 'magic', label: 'Magic · Standard Foil', color: 'var(--f7-mat-magic)' },
              { k: 'command', label: 'Command · Surge / Showcase', color: 'var(--f7-mat-command)' },
              { k: 'summon', label: 'Summon · Neon / Serialized', color: 'var(--f7-mat-summon)' },
              { k: 'support', label: 'Support · Collector', color: 'var(--f7-mat-support)' },
              { k: 'indep', label: 'Independent · Extended', color: 'var(--f7-mat-indep)' },
            ] as const
          ).map((row) => (
            <div key={row.k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                className="f7-materia"
                data-kind={row.k}
                style={{ width: 28, height: 28, fontSize: '0.6rem' }}
              >
                <span className="ring" />
              </div>
              <span style={{ fontFamily: 'var(--f7-font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--f7-text-dim)' }}>
                {row.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BinderPanel({
  pages,
  page,
  setPage,
  ownedSet,
  onSelect,
  selectedCn,
  selectedCard,
  fmtVal,
}: {
  pages: Array<{ cards: CardT[]; owned: number; total: number }>;
  page: number;
  setPage: (n: number) => void;
  ownedSet: Set<string>;
  onSelect: (cn: string) => void;
  selectedCn: string | null;
  selectedCard: CardT | null;
  fmtVal: (usd: number) => string;
}) {
  if (!pages.length) {
    return (
      <div className="ff7r-panel">
        <span className="br-bl" />
        <span className="br-br" />
        <SectionTitle primary="Binder" />
        <div style={{ color: 'var(--f7-text-ghost)', padding: 20 }}>No binder data loaded.</div>
      </div>
    );
  }
  const current = pages[Math.min(page, pages.length - 1)];
  if (!current) return null;
  const rarClass = (r: string) =>
    r === 'mythic' ? 'f7-rar-m' : r === 'rare' ? 'f7-rar-r' : r === 'uncommon' ? 'f7-rar-u' : 'f7-rar-c';

  return (
    <>
      <div className="ff7r-panel">
        <span className="br-bl" />
        <span className="br-br" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <SectionTitle primary="Binder" secondary={`Page ${page + 1} / ${pages.length}`} />
          <div className="f7-picker">
            <button type="button" onClick={() => setPage(Math.max(0, page - 1))} aria-label="Prev page">
              ◀
            </button>
            <span className="v">{page + 1}</span>
            <button type="button" onClick={() => setPage(Math.min(pages.length - 1, page + 1))} aria-label="Next page">
              ▶
            </button>
          </div>
        </div>

        <div className="f7-stat-row" style={{ marginTop: 10 }}>
          <span className="lbl">Progress</span>
          <div className="f7-bar">
            <span style={{ ['--pct' as string]: `${(current.owned / Math.max(1, current.total)) * 100}%` }} />
          </div>
          <span className="val">
            {current.owned}/{current.total}
          </span>
        </div>

        <div className="f7-binder-grid" style={{ marginTop: 14 }}>
          {current.cards.map((c) => {
            const isOwned = ownedSet.has(c.collector_number);
            const isSelected = selectedCn === c.collector_number;
            return (
              <div
                key={c.collector_number}
                className={`f7-slot ${isOwned ? 'filled' : 'empty'} ${isSelected ? 'selected' : ''} ${rarClass(c.rarity)}`}
                onClick={() => onSelect(c.collector_number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelect(c.collector_number);
                }}
              >
                <span className="cn">#{c.collector_number}</span>
                <span className="rar" />
                {isOwned && c.image_small ? (
                  <img src={c.image_small} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
                <span className="name">{isOwned ? c.name : `—`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCard && (
        <div className="ff7r-panel">
          <span className="br-bl" />
          <span className="br-br" />
          <SectionTitle primary="Equip" secondary={`#${selectedCard.collector_number}`} />
          <div className="f7-card-view" style={{ marginTop: 12 }}>
            <div>
              <div className="f7-card-frame">
                {selectedCard.image_normal || selectedCard.image_small ? (
                  <img src={selectedCard.image_normal || selectedCard.image_small} alt={selectedCard.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--f7-text-ghost)' }}>
                    No image
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button type="button" className="f7-btn hot">Equip</button>
                <button type="button" className="f7-btn ghost">Inspect</button>
                <button type="button" className="f7-btn ghost">Scryfall</button>
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--f7-font-display)',
                  fontStyle: 'italic',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--f7-text)',
                  marginBottom: 6,
                }}
              >
                {selectedCard.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--f7-text-dim)', marginBottom: 12 }}>
                {selectedCard.type_line}
                {selectedCard.mana_cost ? ` · ${selectedCard.mana_cost}` : ''}
              </div>

              <div className="f7-stat-row">
                <span className="lbl">Rarity</span>
                <div className="f7-bar">
                  <span
                    style={{
                      ['--pct' as string]:
                        selectedCard.rarity === 'mythic'
                          ? '100%'
                          : selectedCard.rarity === 'rare'
                            ? '75%'
                            : selectedCard.rarity === 'uncommon'
                              ? '50%'
                              : '25%',
                    }}
                  />
                </div>
                <span className="val">{selectedCard.rarity.toUpperCase()}</span>
              </div>
              <div className="f7-stat-row">
                <span className="lbl">Price</span>
                <div className="f7-bar mp">
                  <span style={{ ['--pct' as string]: `${Math.min(100, selectedCard.price_usd * 5)}%` }} />
                </div>
                <span className="val">{fmtVal(selectedCard.price_usd ?? 0)}</span>
              </div>
              <div className="f7-stat-row">
                <span className="lbl">Foil</span>
                <div className="f7-bar">
                  <span style={{ ['--pct' as string]: `${Math.min(100, (selectedCard.price_usd_foil ?? 0) * 5)}%` }} />
                </div>
                <span className="val">{fmtVal(selectedCard.price_usd_foil ?? 0)}</span>
              </div>
              <div className="f7-stat-row">
                <span className="lbl">Owned</span>
                <div className="f7-bar xp">
                  <span style={{ ['--pct' as string]: ownedSet.has(selectedCard.collector_number) ? '100%' : '0%' }} />
                </div>
                <span className="val ok">
                  {ownedSet.has(selectedCard.collector_number) ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="f7-infotag" style={{ marginTop: 14 }}>
                Equip details preview — mocks the CardModal as an FF7R equipment/materia inspection pane.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShopPanel({
  main,
  ownedCounts,
  currency,
  fmtVal,
  onPick,
  selectedCn,
  selectedCard,
}: {
  main: CardT[];
  ownedCounts: string[];
  currency: string;
  fmtVal: (usd: number) => string;
  onPick: (cn: string) => void;
  selectedCn: string | null;
  selectedCard: CardT | null;
}) {
  const [sort, setSort] = useState<'price' | 'rarity' | 'cn'>('price');
  const ownedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const cn of ownedCounts) m.set(cn, (m.get(cn) ?? 0) + 1);
    return m;
  }, [ownedCounts]);

  const rows = useMemo(() => {
    const rarOrd: Record<string, number> = { mythic: 0, rare: 1, uncommon: 2, common: 3 };
    const copy = [...main];
    if (sort === 'price') copy.sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    else if (sort === 'rarity') copy.sort((a, b) => (rarOrd[a.rarity] ?? 9) - (rarOrd[b.rarity] ?? 9));
    else copy.sort((a, b) => a.collector_number.localeCompare(b.collector_number, undefined, { numeric: true }));
    return copy.slice(0, 40);
  }, [main, sort]);

  const shortRar = (r: string) => (r === 'mythic' ? 'M' : r === 'rare' ? 'R' : r === 'uncommon' ? 'U' : 'C');

  return (
    <>
      <div className="ff7r-panel">
        <span className="br-bl" />
        <span className="br-br" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <SectionTitle primary="Shop" secondary={`Inventory · ${currency}`} />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['price', 'rarity', 'cn'] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`f7-btn ghost ${sort === k ? 'hot' : ''}`}
                style={{ padding: '5px 14px', fontSize: '0.68rem' }}
                onClick={() => setSort(k)}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, maxHeight: 420, overflowY: 'auto' }}>
          {rows.map((c) => {
            const ownedN = ownedMap.get(c.collector_number) ?? 0;
            return (
              <div
                key={c.collector_number}
                className={`f7-shop-row ${selectedCn === c.collector_number ? 'selected' : ''}`}
                onClick={() => onPick(c.collector_number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onPick(c.collector_number);
                }}
              >
                <span className="cur">▶</span>
                <span className="thumb">{c.image_small ? <img src={c.image_small} alt="" /> : null}</span>
                <span className="nm">{c.name}</span>
                <span className="rar">
                  {shortRar(c.rarity)} · #{c.collector_number}
                </span>
                <span className="price">{fmtVal(c.price_usd ?? 0)}</span>
                <span className="own">{ownedN > 0 ? `×${ownedN}` : ''}</span>
              </div>
            );
          })}
        </div>
        <div className="f7-infotag">
          Showing top 40 rows sorted by{' '}
          <span style={{ color: 'var(--f7-edge-hi)' }}>{sort}</span>. Click a row to open equip details.
        </div>
      </div>

      {selectedCard && (
        <div className="ff7r-panel thin">
          <span className="br-bl" />
          <span className="br-br" />
          <SectionTitle primary="Preview" />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
            <div style={{ width: 64, height: 90 }} className="f7-card-frame">
              {selectedCard.image_small ? <img src={selectedCard.image_small} alt="" /> : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--f7-font-display)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--f7-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedCard.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--f7-text-dim)', marginTop: 2 }}>
                {selectedCard.type_line || '—'}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--f7-edge-hot)', fontFamily: 'var(--f7-font-num)', fontWeight: 700 }}>
                  {fmtVal(selectedCard.price_usd ?? 0)}
                </span>
                <span style={{ color: 'var(--f7-mat-command)', fontFamily: 'var(--f7-font-num)', fontWeight: 700 }}>
                  Foil {fmtVal(selectedCard.price_usd_foil ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LogPanel({ timeline, main }: { timeline: Array<{ type: string; cn: string; date: string; source: string }>; main: CardT[] }) {
  const byCn = new Map(main.map((c) => [c.collector_number, c] as const));
  const rows = [...timeline].slice(-50).reverse();
  return (
    <div className="ff7r-panel">
      <span className="br-bl" />
      <span className="br-br" />
      <SectionTitle primary="Battle" secondary="Log" />
      {rows.length === 0 ? (
        <div style={{ color: 'var(--f7-text-ghost)', padding: 20 }}>Log is empty.</div>
      ) : (
        <div className="f7-log" style={{ maxHeight: 480, marginTop: 10 }}>
          {rows.map((e, i) => {
            const c = byCn.get(e.cn);
            const cls = e.type === 'add' ? 'add' : e.type === 'remove' ? 'rem' : 'pack';
            const lbl = e.type === 'add' ? 'ACQUIRE' : e.type === 'remove' ? 'DROP' : 'OPEN PACK';
            return (
              <div key={`${e.cn}-${i}`} className={`f7-log-row ${cls}`}>
                <span className="ts">{new Date(e.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}</span>
                <span className="ev">{lbl}</span>
                <span className="card-name">
                  {c?.name ?? '—'} <span style={{ color: 'var(--f7-text-ghost)' }}>#{e.cn}</span>
                </span>
                <span className="meta">{e.source}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="f7-infotag">
        Every acquisition, drop, or pack-opening is recorded as a battle event. Scroll for older entries.
      </div>
    </div>
  );
}

function ConfigPanel() {
  const binder = useConfigStore((s) => s.binder);
  const currency = useConfigStore((s) => s.currency);
  const setCurrency = useConfigStore((s) => s.setCurrency);
  const [mockToggle, setMockToggle] = useState({ sound: true, haptics: false, cel: true });

  return (
    <div className="ff7r-panel">
      <span className="br-bl" />
      <span className="br-br" />
      <SectionTitle primary="Config" secondary="System" />
      <div style={{ marginTop: 10 }}>
        <div className="f7-cfg-row">
          <div>
            <div>Currency</div>
            <div className="desc">Switch display currency across all price tiles.</div>
          </div>
          <div className="f7-picker">
            <button type="button" onClick={() => setCurrency(currency === 'USD' ? 'MYR' : 'USD')}>◀</button>
            <span className="v">{currency}</span>
            <button type="button" onClick={() => setCurrency(currency === 'USD' ? 'MYR' : 'USD')}>▶</button>
          </div>
        </div>
        <div className="f7-cfg-row">
          <div>
            <div>Binder preset</div>
            <div className="desc">
              {binder.gridRows} × {binder.gridCols} · {binder.slotsPerPage} slots / page
            </div>
          </div>
          <span className="f7-cfg-value">{binder.presetName}</span>
        </div>
        <div className="f7-cfg-row">
          <div>
            <div>Sound effects</div>
            <div className="desc">Menu/confirm/back SFX.</div>
          </div>
          <span
            className={`f7-toggle ${mockToggle.sound ? 'on' : ''}`}
            role="switch"
            aria-checked={mockToggle.sound}
            tabIndex={0}
            onClick={() => setMockToggle((t) => ({ ...t, sound: !t.sound }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setMockToggle((t) => ({ ...t, sound: !t.sound }));
            }}
          >
            <i />
          </span>
        </div>
        <div className="f7-cfg-row">
          <div>
            <div>Haptics</div>
            <div className="desc">Mobile vibration on actions.</div>
          </div>
          <span
            className={`f7-toggle ${mockToggle.haptics ? 'on' : ''}`}
            role="switch"
            aria-checked={mockToggle.haptics}
            tabIndex={0}
            onClick={() => setMockToggle((t) => ({ ...t, haptics: !t.haptics }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setMockToggle((t) => ({ ...t, haptics: !t.haptics }));
            }}
          >
            <i />
          </span>
        </div>
        <div className="f7-cfg-row">
          <div>
            <div>Celebration FX</div>
            <div className="desc">Summon animation on completion milestones.</div>
          </div>
          <span
            className={`f7-toggle ${mockToggle.cel ? 'on' : ''}`}
            role="switch"
            aria-checked={mockToggle.cel}
            tabIndex={0}
            onClick={() => setMockToggle((t) => ({ ...t, cel: !t.cel }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setMockToggle((t) => ({ ...t, cel: !t.cel }));
            }}
          >
            <i />
          </span>
        </div>
      </div>
      <div className="f7-infotag">
        These toggles are mock-only in this preview — applying them does not persist to the live app state.
      </div>
    </div>
  );
}
