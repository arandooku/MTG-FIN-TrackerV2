import { motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { Card } from '@/lib/schemas';
import { cn, scryfallLarge } from '@/lib/utils';
import { CardImage } from './CardImage';
import { classifyFoil } from '@/lib/foil';
import { FoilOverlay } from './FoilOverlay';

interface BinderSlotProps {
  card?: Card;
  owned: number;
  foilActive?: boolean;
  onClick?: () => void;
  showNumberedEmpty?: boolean;
}

const HOVER_SPRING: Transition = { type: 'spring', stiffness: 380, damping: 26, mass: 0.6 };
const OPACITY_TWEEN: Transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

/**
 * Mythic Obsidian rarity glow palette. Subtle outer halos that key off the
 * card's rarity when owned. Common stays understated to avoid noise on a
 * full 9-slot grid.
 */
const RARITY_GLOW: Record<string, string> = {
  mythic: '0 0 22px rgba(255,122,90,0.45), 0 0 0 1px rgba(255,122,90,0.35)',
  rare: '0 0 18px rgba(232,199,122,0.40), 0 0 0 1px rgba(232,199,122,0.32)',
  uncommon: '0 0 14px rgba(200,203,216,0.32), 0 0 0 1px rgba(200,203,216,0.22)',
  common: '0 0 10px rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.06)',
};

const FOIL_GLOW: Record<string, string> = {
  'collector-foil': '0 0 18px rgba(127,216,228,0.45)',
  'surge-foil': '0 0 18px rgba(184,156,255,0.45)',
};

export function BinderSlot({ card, owned, foilActive, onClick, showNumberedEmpty }: BinderSlotProps) {
  const reduce = useReducedMotion();
  const empty = !card;
  const variant = card ? classifyFoil(card) : 'none';
  const showFoil = !!foilActive && variant !== 'none';
  const missing = !empty && owned === 0;
  const isOwned = !empty && owned > 0;

  const hoverProps = reduce || empty
    ? undefined
    : { y: -4, scale: 1.03, boxShadow: '0 12px 32px rgba(0,0,0,0.55), 0 0 22px rgba(127,216,228,0.18)' };
  const tapProps = reduce || empty ? undefined : { scale: 0.96 };

  // Compose glow: foil takes precedence, then rarity (when owned).
  const ownedRarity = isOwned && card ? card.rarity : undefined;
  const glow = showFoil
    ? FOIL_GLOW[variant] ?? '0 0 16px rgba(232,199,122,0.40)'
    : ownedRarity
      ? RARITY_GLOW[ownedRarity] ?? RARITY_GLOW.common
      : undefined;

  // Owned slots get a 2px gold inset (ornate); empty/missing get a hairline.
  const slotStyle: React.CSSProperties = {
    boxShadow: glow,
    background: 'var(--surface-1, rgba(18,20,32,0.72))',
    backdropFilter: 'blur(8px)',
    borderColor: empty
      ? 'var(--border-hair, rgba(255,255,255,0.06))'
      : isOwned
        ? 'rgba(232,199,122,0.55)'
        : 'var(--border-hair, rgba(255,255,255,0.06))',
    borderWidth: isOwned ? 2 : 1,
    borderStyle: empty ? 'dashed' : 'solid',
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={hoverProps}
      whileTap={tapProps}
      transition={HOVER_SPRING}
      className={cn(
        'glass group relative aspect-[5/7] rounded-[10px] text-left overflow-hidden',
        'transition-[border-color,box-shadow] duration-200',
        isOwned && 'glow-gold',
      )}
      style={slotStyle}
    >
      {/* Slot index — Cinzel small-caps top-left when card present */}
      {card && (
        <span
          className="pointer-events-none absolute left-1 top-1 z-10 select-none text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{
            fontFamily: 'var(--font-display, Cinzel, serif)',
            color: isOwned
              ? 'var(--accent-gold, #E8C77A)'
              : 'var(--ink-muted, #9AA0B4)',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          }}
        >
          {card.collector_number}
        </span>
      )}
      {card ? (
        missing && showNumberedEmpty ? (
          <div className="absolute inset-0 slot-empty-numbered bg-[color:var(--surface-1,rgba(18,20,32,0.72))]">
            <span className="n">#{card.collector_number}</span>
            <span className="name">{card.name}</span>
            <span className="plus">+</span>
          </div>
        ) : (
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: isOwned ? 1 : 0.3 }}
            transition={reduce ? { duration: 0 } : OPACITY_TWEEN}
          >
            <CardImage
              src={scryfallLarge(card.image_normal || card.image_small)}
              alt={card.name}
              className={cn('h-full w-full', owned === 0 && 'grayscale')}
            />
            {showFoil && <FoilOverlay card={card} />}
          </motion.div>
        )
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center text-xs"
          style={{ color: 'var(--ink-subtle, #5A6078)' }}
        >
          —
        </span>
      )}
      {owned > 1 && (
        <motion.span
          key={owned}
          initial={reduce ? false : { scale: 1 }}
          animate={reduce ? undefined : { scale: [1, 1.3, 1] }}
          transition={{ type: 'spring', stiffness: 520, damping: 14 }}
          className={cn(
            'absolute right-1 top-1 z-10 rounded-full px-1.5 py-0.5',
            'text-[10px] font-bold tabular-nums',
          )}
          style={{
            background: 'var(--accent-gold, #E8C77A)',
            color: '#0A0B10',
            boxShadow: '0 2px 8px rgba(232,199,122,0.45)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          ×{owned}
        </motion.span>
      )}
      {/* Foil/variant indicator pill — bottom centre, glass capsule */}
      {card && showFoil && !(missing && showNumberedEmpty) && (
        <span
          className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-[2px] text-[8px] font-semibold uppercase tracking-[0.20em] backdrop-blur-md"
          style={{
            color: 'var(--accent-crystal, #7FD8E4)',
            background: 'rgba(5,6,10,0.66)',
            border: '1px solid rgba(127,216,228,0.45)',
            fontFamily: 'var(--font-display, Cinzel, serif)',
          }}
        >
          {variant === 'surge-foil' ? 'Surge' : variant === 'collector-foil' ? 'Collector' : 'Foil'}
        </span>
      )}
    </motion.button>
  );
}
