import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogSeparator } from '../ui/dialog';
import { cn } from '@/lib/utils';
import type { Card as CardT } from '@/lib/schemas';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { useFx } from '@/hooks/useFx';
import { useAllCards } from '@/hooks/useCards';
import { celebrateCard } from '@/lib/celebration';
import { useCelebrate } from '@/hooks/useCelebrate';
import {
  classifyFoil,
  foilLabelMap,
  canBeFoil,
  getCardVariantInfo,
  isInherentlyFoil,
  type FoilVariant,
} from '@/lib/foil';
import { InspectOverlay } from './InspectOverlay';
import { VariantChips } from './VariantChips';
import { FoilOverlay } from '../FoilOverlay';
import { scryfallPng, MTG_CARD_BACK, relativeTime } from '@/lib/utils';

interface CardModalProps {
  card: CardT | null;
  onClose: () => void;
  onSwitchCard?: (card: CardT) => void;
}

const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 400, damping: 32 };
const SPRING_SMOOTH: Transition = { type: 'spring', stiffness: 260, damping: 26 };

export function CardModal({ card, onClose, onSwitchCard }: CardModalProps) {
  const prefersReduced = useReducedMotion();
  const addCard = useCollectionStore((s) => s.addCard);
  const removeCard = useCollectionStore((s) => s.removeCard);
  const owned = useCollectionStore((s) => s.owned);
  const foilOwned = useCollectionStore((s) => s.foil);
  const setFoil = useCollectionStore((s) => s.setFoil);
  const muteCel = useConfigStore((s) => s.muteCelebration);
  const currency = useConfigStore((s) => s.currency);
  const setCurrency = useConfigStore((s) => s.setCurrency);
  const fx = useFx();
  const all = useAllCards();
  const { celebrateAdd, celebrateFoil, toastRemove } = useCelebrate();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const card3dRef = useRef<HTMLDivElement | null>(null);
  const shineRef = useRef<HTMLDivElement | null>(null);
  const foilRef = useRef<HTMLDivElement | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<number>(Date.now());
  const [spinning, setSpinning] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [foilPreviewCn, setFoilPreviewCn] = useState<string | null>(null);

  const count = card ? owned.filter((cn) => cn === card.collector_number).length : 0;
  const family = useMemo(() => {
    if (!card) return [] as CardT[];
    const pool = [...all.main, ...all.variants];
    if (card.oracle_id) {
      const byOracle = pool.filter((c) => c.oracle_id === card.oracle_id);
      if (byOracle.length > 0) return byOracle;
    }
    return pool.filter((c) => c.name === card.name);
  }, [card, all.main, all.variants]);

  const mainCard = useMemo(() => {
    if (!family.length) return null;
    const main = family.find((c) => {
      const n = Number.parseInt(c.collector_number, 10);
      return Number.isFinite(n) && n <= 309;
    });
    return main ?? family[0];
  }, [family]);
  const variantCards = useMemo(
    () => family.filter((c) => c.collector_number !== mainCard?.collector_number),
    [family, mainCard],
  );

  const foilVariant: FoilVariant = card ? classifyFoil(card) : 'none';
  const ownedFoils = card ? foilOwned[card.collector_number] ?? [] : [];
  const foilPreviewActive = !!(card && foilPreviewCn === card.collector_number);

  useEffect(() => {
    setFlipped(false);
    if (card3dRef.current) {
      card3dRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    if (card && foilPreviewCn && foilPreviewCn !== card.collector_number) {
      setFoilPreviewCn(null);
    }
  }, [card?.collector_number]);

  if (!card) return null;

  const handleAdd = () => {
    addCard(card.collector_number);
    if (!muteCel) celebrateCard(card, canvasRef.current, foilVariant !== 'none');
    celebrateAdd(card);
  };
  const handleAddFoil = () => {
    const next = ownedFoils.includes(foilVariant) ? ownedFoils : [...ownedFoils, foilVariant];
    setFoil(card.collector_number, next);
    if (!muteCel) celebrateCard(card, canvasRef.current, true);
    const label = foilLabelMap[foilVariant] ?? 'FOIL';
    celebrateFoil(card, label);
  };
  const handleRemoveFoil = () => {
    const next = ownedFoils.filter((v) => v !== foilVariant);
    setFoil(card.collector_number, next);
  };

  const handleReset = () => {
    setFlipped(false);
    const el = card3dRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.5s ease';
    el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    window.setTimeout(() => {
      if (el) el.style.transition = 'none';
    }, 500);
  };
  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    const el = card3dRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.6s ease';
    el.style.transform = `rotateX(0deg) rotateY(${next ? 180 : 0}deg)`;
    window.setTimeout(() => {
      if (el) el.style.transition = 'none';
    }, 600);
  };

  const handleFoilMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = card3dRef.current;
    const foil = foilRef.current;
    if (!el || !foil || !showFoilClass) return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    foil.style.setProperty('--fx-mx', mx.toFixed(1) + '%');
    foil.style.setProperty('--fx-my', my.toFixed(1) + '%');
    foil.style.setProperty('--fx-bx', (20 + mx * 0.6).toFixed(1) + '%');
    foil.style.setProperty('--fx-by', (20 + my).toFixed(1) + '%');
  };
  const handleFoilLeave = () => {
    const foil = foilRef.current;
    if (!foil) return;
    foil.style.removeProperty('--fx-mx');
    foil.style.removeProperty('--fx-my');
    foil.style.removeProperty('--fx-bx');
    foil.style.removeProperty('--fx-by');
  };

  const handleRefresh = async () => {
    setSpinning(true);
    await all.refetch();
    setRefreshedAt(Date.now());
    window.setTimeout(() => setSpinning(false), 600);
  };

  const rate = fx.data ?? 4.7;
  const fmtUsd = (n: number) => (n ? `$${n.toFixed(2)}` : '—');
  const fmtMyr = (n: number) => (n ? `RM ${(n * rate).toFixed(2)}` : '—');
  const bigFmt = currency === 'MYR' ? fmtMyr : fmtUsd;
  const subFmt = currency === 'MYR' ? fmtUsd : fmtMyr;

  const priceTiles: Array<{
    key: string;
    label: string;
    usd: number;
    color: 'myr' | 'foil' | 'usd';
    active?: boolean;
    subLabel?: string;
  }> = [];
  const mainPrice = card.price_usd ?? 0;
  const foilPrice = card.price_usd_foil ?? 0;
  priceTiles.push({
    key: 'main',
    label: 'Main',
    usd: mainPrice,
    color: 'myr',
    active: foilVariant === 'none' && ownedFoils.length === 0,
  });
  if (canBeFoil(card)) {
    priceTiles.push({
      key: 'main-foil',
      label: 'Main ✦',
      usd: foilPrice,
      color: 'foil',
      active: foilVariant === 'none' && ownedFoils.length > 0,
    });
  }

  const isFoilOwned = ownedFoils.includes(foilVariant);
  const isOwnedRegular = count > 0;
  const inherentlyFoil = isInherentlyFoil(card);
  /* Shimmer shows only when: previewing foil chip, or card is inherently foil.
     Owning a foil does NOT auto-shimmer the regular chip view. */
  const showFoilClass = foilPreviewActive || inherentlyFoil;
  const vInfo = getCardVariantInfo(card);
  const variantShort = vInfo.label ? vInfo.short : 'Main';
  const regularAddLabel = `+ Add ${variantShort}`;
  const foilAddLabel = inherentlyFoil ? `+ Add ${variantShort}` : `+ Add ${variantShort} Foil`;
  const switchCard = (v: CardT, foilPreview: boolean) => {
    if (foilPreview) setFoilPreviewCn(v.collector_number);
    else setFoilPreviewCn(null);
    if (v.collector_number !== card.collector_number) {
      onSwitchCard?.(v);
    }
  };
  const imgSrc = scryfallPng(card.image_normal || card.image_small);
  const imgBack = card.image_back_normal
    ? scryfallPng(card.image_back_normal)
    : MTG_CARD_BACK;

  const shellVariants: Variants = prefersReduced
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        hidden: { opacity: 0, scale: 0.92, y: 16 },
        show: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { ...SPRING_SMOOTH, staggerChildren: 0.04, delayChildren: 0.04 },
        },
        exit: {
          opacity: 0,
          scale: 0.96,
          y: 8,
          transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
        },
      };

  const sectionVariants: Variants = prefersReduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: SPRING_SNAPPY },
        exit: { opacity: 0, y: 4, transition: { duration: 0.12 } },
      };

  return (
    <>
      <Dialog open={!!card && !inspectOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="!max-w-[640px] !p-0 !border-0 !bg-transparent !shadow-none">
          <motion.div
            className={cn(
              'glass-raised modal-card !relative !max-h-[90dvh] !overflow-y-auto !p-6 rounded-[22px]',
            )}
            variants={shellVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              willChange: 'transform, opacity',
              background: 'var(--surface-raised, rgba(40,42,58,0.92))',
              backdropFilter: 'blur(28px)',
              border: '1px solid var(--border-glow, rgba(170,200,255,0.18))',
              boxShadow:
                '0 24px 72px rgba(0,0,0,0.55), 0 0 0 1px rgba(170,200,255,0.10), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <DialogTitle className="sr-only">{card.name}</DialogTitle>
            <DialogDescription className="sr-only">
              #{card.collector_number} · {card.rarity}
            </DialogDescription>

            {/* Header: card image + info, row on desktop, stacked on mobile */}
            <motion.div className="modal-header-row" variants={sectionVariants}>
              <div className="modal-card-col">
                <div
                  className="card-visualizer"
                  onMouseMove={handleFoilMove}
                  onMouseLeave={handleFoilLeave}
                  onClick={() => setInspectOpen(true)}
                  title="Tap for full-screen"
                >
                  <div ref={card3dRef} className="card-3d">
                    <img src={imgSrc} alt={card.name} draggable={false} />
                    <div ref={shineRef} className="card-shine" />
                    <motion.div
                      initial={false}
                      animate={{ opacity: showFoilClass ? 1 : 0 }}
                      transition={prefersReduced ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-[12px] pointer-events-none"
                      style={{ zIndex: 2 }}
                    >
                      <FoilOverlay
                        ref={foilRef}
                        card={card}
                        patternWidth={520}
                        patternHeight={728}
                      />
                    </motion.div>
                    <div className="card-back">
                      <img src={imgBack} alt="back" draggable={false} />
                    </div>
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                </div>
                <div className="viz-controls">
                  <button
                    type="button"
                    className="viz-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    title="Reset rotation"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="viz-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlip();
                    }}
                    title="Flip card"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="viz-icon-btn viz-inspect"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectOpen(true);
                    }}
                    title="Full-screen inspect"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6" />
                      <path d="M9 21H3v-6" />
                      <path d="M21 3l-7 7" />
                      <path d="M3 21l7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="modal-info-col">
                <h3
                  className="modal-name text-display"
                  style={{
                    fontFamily: 'var(--font-display, Cinzel, serif)',
                    color: 'var(--ink-primary, #F3F1E8)',
                    letterSpacing: '0.03em',
                    lineHeight: 1.15,
                  }}
                >
                  <span
                    className="tabular-nums"
                    style={{
                      color: 'var(--accent-gold, #E8C77A)',
                      fontFamily: 'var(--font-mono, monospace)',
                      marginRight: '0.4rem',
                    }}
                  >
                    #{card.collector_number}
                  </span>
                  {card.name}
                </h3>
                <p className="detail">
                  <span
                    className={`rarity-badge ${card.rarity}`}
                    style={{
                      fontFamily: 'var(--font-display, Cinzel, serif)',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                    }}
                  >
                    {card.rarity}
                  </span>
                  {foilVariant !== 'none' && (
                    <span
                      className="ml-2"
                      style={{
                        color: 'var(--accent-crystal, #7FD8E4)',
                        fontFamily: 'var(--font-display, Cinzel, serif)',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                      }}
                    >
                      {foilLabelMap[foilVariant]}
                    </span>
                  )}
                  {card.type_line && (
                    <span
                      className="mt-1 block"
                      style={{
                        color: 'var(--ink-muted, #9AA0B4)',
                        fontFamily: 'var(--font-body, Inter, sans-serif)',
                      }}
                    >
                      {card.type_line}
                    </span>
                  )}
                </p>
                <div className="modal-actions">
                  {foilPreviewActive ? (
                    isFoilOwned ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleRemoveFoil}
                      >
                        − Remove {variantShort}{inherentlyFoil ? '' : ' Foil'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-foil"
                        onClick={handleAddFoil}
                      >
                        {foilAddLabel}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={
                        isOwnedRegular
                          ? () => {
                              removeCard(card.collector_number);
                              toastRemove(card, () => addCard(card.collector_number));
                            }
                          : handleAdd
                      }
                    >
                      {isOwnedRegular ? `− Remove (×${count})` : regularAddLabel}
                    </button>
                  )}
                </div>
                {family.length > 0 && (
                  <div className="modal-foil-info">
                    <div
                      className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em]"
                      style={{
                        color: 'var(--accent-gold, #E8C77A)',
                        fontFamily: 'var(--font-display, Cinzel, serif)',
                      }}
                    >
                      Variants
                    </div>
                    <VariantChips
                      card={card}
                      mainCard={mainCard}
                      variantCards={variantCards}
                      foilPreviewActive={foilPreviewActive}
                      foilOwned={foilOwned}
                      owned={owned}
                      onSelect={switchCard}
                    />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Gold ornate hairline separator */}
            <DialogSeparator />

            {/* Prices */}
            <motion.div className="mt-3" variants={sectionVariants}>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.22em]"
                  style={{
                    color: 'var(--accent-gold, #E8C77A)',
                    fontFamily: 'var(--font-display, Cinzel, serif)',
                  }}
                  onClick={() => setCurrency(currency === 'MYR' ? 'USD' : 'MYR')}
                  title="Toggle currency"
                >
                  Prices ({currency})
                </button>
                <button
                  type="button"
                  className={`modal-price-refresh ${spinning ? 'spinning' : ''}`}
                  onClick={handleRefresh}
                  title="Refresh prices"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
              <div
                className={`modal-prices ${priceTiles.some((p) => p.active) ? 'has-highlight' : ''}`}
              >
                {priceTiles.map((t) => (
                  <div
                    key={t.key}
                    className={cn(
                      'glass modal-price-chip relative overflow-hidden rounded-[12px] p-3',
                      'border transition-[border-color,box-shadow] duration-200',
                      !t.usd && 'no-price',
                      t.active && 'price-active glow-crystal',
                    )}
                    style={{
                      background: 'var(--surface-1, rgba(18,20,32,0.72))',
                      borderColor: t.active
                        ? 'var(--accent-crystal, #7FD8E4)'
                        : 'var(--border-soft, rgba(255,255,255,0.10))',
                      boxShadow: t.active
                        ? '0 0 0 3px rgba(127,216,228,0.18), 0 0 22px rgba(127,216,228,0.22)'
                        : undefined,
                    }}
                  >
                    <span
                      className="price-label block text-[0.6rem] font-semibold uppercase tracking-[0.22em]"
                      style={{
                        color: 'var(--ink-muted, #9AA0B4)',
                        fontFamily: 'var(--font-display, Cinzel, serif)',
                      }}
                    >
                      {t.label}
                    </span>
                    <span
                      className={`price-val ${t.color} mt-1 block text-base font-semibold tabular-nums`}
                      style={{
                        color:
                          t.color === 'foil'
                            ? 'var(--accent-crystal, #7FD8E4)'
                            : 'var(--ink-primary, #F3F1E8)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {bigFmt(t.usd)}
                    </span>
                    <span
                      className="price-sub mt-0.5 block text-[10px] tabular-nums"
                      style={{
                        color: 'var(--ink-subtle, #5A6078)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {subFmt(t.usd)}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-2 text-center text-[0.62rem] uppercase tracking-[0.20em]"
                style={{
                  color: 'var(--ink-subtle, #5A6078)',
                  fontFamily: 'var(--font-display, Cinzel, serif)',
                }}
              >
                Scryfall · {relativeTime(refreshedAt)}
              </div>
            </motion.div>

            {/* Gold ornate hairline above footer */}
            <DialogSeparator />

            {/* Footer */}
            <motion.div
              className="modal-footer flex items-center justify-end gap-2"
              variants={sectionVariants}
            >
              {card.scryfall_uri && (
                <a
                  className={cn(
                    'glass scryfall-link inline-flex items-center gap-1.5 rounded-[12px] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em]',
                    'border transition-[border-color,color] duration-200',
                  )}
                  style={{
                    background: 'var(--surface-1, rgba(18,20,32,0.72))',
                    color: 'var(--ink-secondary, #C8CBD8)',
                    borderColor: 'var(--border-soft, rgba(255,255,255,0.10))',
                    fontFamily: 'var(--font-display, Cinzel, serif)',
                  }}
                  href={card.scryfall_uri}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Scryfall
                </a>
              )}
              <button
                type="button"
                className={cn(
                  'btn btn-primary glow-gold inline-flex items-center gap-2 rounded-[12px] px-5 py-2 text-sm font-semibold uppercase tracking-[0.10em]',
                )}
                style={{
                  background: 'var(--accent-gold, #E8C77A)',
                  color: '#0A0B10',
                  boxShadow:
                    '0 8px 24px rgba(232,199,122,0.22), inset 0 1px 0 rgba(255,255,255,0.35)',
                  fontFamily: 'var(--font-display, Cinzel, serif)',
                }}
                onClick={onClose}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <InspectOverlay
        card={inspectOpen ? card : null}
        foilActive={showFoilClass}
        onClose={() => setInspectOpen(false)}
      />
    </>
  );
}
