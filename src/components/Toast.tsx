import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToastStore, type CardToast, type SimpleToast } from '@/store/toast';

const SPRING_IN: Transition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.6 };
const FADE_OUT: Transition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

/**
 * Mythic Obsidian toast palette. Glow values reference design tokens
 * (--success, --danger, --accent-crystal) so the variant stripe and outer
 * halo stay aligned with the rest of the system.
 */
const VARIANT_GLOW: Record<'default' | 'success' | 'error', string> = {
  default: 'rgba(127,216,228,0.45)', // --accent-crystal @ .45
  success: 'rgba(116,224,168,0.55)', // --success @ .55
  error: 'rgba(255,107,122,0.55)', // --danger @ .55
};

const VARIANT_STRIPE: Record<'default' | 'success' | 'error', string> = {
  default: 'var(--accent-crystal, #7FD8E4)',
  success: 'var(--success, #74E0A8)',
  error: 'var(--danger, #FF6B7A)',
};

export function Toast() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  if (typeof document === 'undefined') return null;

  const cardItem = items.find((i): i is CardToast => i.kind === 'card');
  const simpleItems = items.filter((i): i is SimpleToast => i.kind === 'simple');

  return createPortal(
    <>
      <AnimatePresence>
        {cardItem && (
          <CardToastOverlay
            key={cardItem.id}
            t={cardItem}
            onDismiss={() => dismiss(cardItem.id)}
          />
        )}
      </AnimatePresence>
      <div className="pointer-events-none fixed top-4 right-4 z-[10000] flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)]">
        <AnimatePresence initial={false}>
          {simpleItems.map((i) => (
            <SimpleToastView key={i.id} t={i} onDismiss={() => dismiss(i.id)} />
          ))}
        </AnimatePresence>
      </div>
    </>,
    document.body,
  );
}

interface SimpleProps {
  t: SimpleToast;
  onDismiss: () => void;
}
function SimpleToastView({ t, onDismiss }: SimpleProps) {
  const reduce = useReducedMotion();
  const variant = t.variant ?? 'default';
  const glow = VARIANT_GLOW[variant];

  const initial = reduce ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 };
  const animate = reduce
    ? { opacity: 1, boxShadow: `0 0 0 rgba(0,0,0,0)` }
    : {
        opacity: 1,
        x: 0,
        scale: 1,
        boxShadow: [
          `0 0 0 rgba(0,0,0,0)`,
          `0 0 28px ${glow}`,
          `0 0 12px ${glow}`,
        ],
      };
  const exit = reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 };

  const stripe = VARIANT_STRIPE[variant];

  return (
    <motion.div
      role="status"
      layout
      initial={initial}
      animate={animate}
      exit={exit}
      transition={reduce ? FADE_OUT : { ...SPRING_IN, boxShadow: { duration: 0.9, times: [0, 0.4, 1] } }}
      className={cn(
        'glass-raised pointer-events-auto toast relative !static !translate-x-0',
        'min-w-64 max-w-md flex items-center gap-3 overflow-hidden',
        'rounded-[10px] py-2.5 pl-4 pr-3',
        'border border-[color:var(--border-soft,rgba(255,255,255,0.10))]',
        'bg-[color:var(--surface-raised,rgba(40,42,58,0.92))] backdrop-blur-xl',
        'text-[color:var(--ink-primary,#F3F1E8)]',
      )}
      style={{
        borderLeft: `3px solid ${stripe}`,
      }}
    >
      <button type="button" onClick={onDismiss} className="flex-1 text-left">
        <div
          className="text-display text-sm font-semibold tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-display, Cinzel, serif)',
            color: stripe,
          }}
        >
          {t.title}
        </div>
        {t.description && (
          <div
            className="mt-0.5 text-xs font-[var(--font-body,Inter,sans-serif)]"
            style={{ color: 'var(--ink-muted, #9AA0B4)' }}
          >
            {t.description}
          </div>
        )}
      </button>
      {t.undo && (
        <button
          type="button"
          className="undo-link underline underline-offset-2 text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'var(--accent-gold, #E8C77A)' }}
          onClick={(e) => {
            e.stopPropagation();
            t.undo?.();
            onDismiss();
          }}
        >
          Undo
        </button>
      )}
    </motion.div>
  );
}

interface CardProps {
  t: CardToast;
  onDismiss: () => void;
}
function CardToastOverlay({ t, onDismiss }: CardProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const prev = document.body.style.pointerEvents;
    document.body.style.pointerEvents = 'none';
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.pointerEvents = prev;
    };
  }, []);

  const handleDismiss = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDismiss();
  };

  const img = t.card.image_normal || t.card.image_small;
  const name = t.card.name;
  const glow = t.glow;
  const border = t.border;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center px-4',
        'transition-all duration-300 ease-out pointer-events-auto',
        shown ? 'opacity-100 backdrop-blur-md bg-black/40' : 'opacity-0 backdrop-blur-0',
      )}
      onPointerDown={handleDismiss}
      onClick={(e) => e.preventDefault()}
    >
      <div
        role="status"
        style={{
          ['--toast-glow' as string]: glow,
          boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 80px ${glow}, inset 0 0 24px rgba(0,0,0,0.4)`,
          border: `2px solid ${border}`,
          background: 'var(--app-panel-solid)',
        }}
        className={cn(
          'add-toast pointer-events-auto relative flex flex-col items-center gap-3 rounded-[18px] px-6 py-5 max-w-[340px]',
          'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          shown ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-6',
        )}
      >
        {t.foilLabel ? (
          <div
            className="toast-foil-badge text-[0.7rem] uppercase tracking-[0.22em] font-bold px-3 py-1 rounded-full"
            style={{
              color: 'var(--app-crystal)',
              borderColor: 'var(--app-crystal)',
              border: '1px solid',
              background: 'rgba(79,196,240,0.15)',
              textShadow: '0 0 8px rgba(79,196,240,0.6)',
            }}
          >
            {t.foilLabel}
          </div>
        ) : (
          <div
            className="toast-rarity-badge text-[0.7rem] uppercase tracking-[0.22em] font-bold px-3 py-1 rounded-full border"
            style={{
              color: border,
              borderColor: border,
              background: glow,
              textShadow: `0 0 8px ${glow}`,
            }}
          >
            {t.rarityLabel}
          </div>
        )}
        {img && (
          <img
            src={img}
            alt={name}
            className="w-[180px] rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            loading="eager"
          />
        )}
        <div className="toast-name text-base font-semibold text-[var(--app-ink)] text-center font-display tracking-wider">
          #{t.card.collector_number} {name}
        </div>
        <div
          className="toast-msg text-sm font-bold uppercase tracking-[0.18em]"
          style={{ color: border, textShadow: `0 0 14px ${glow}` }}
        >
          {t.message}
        </div>
        {t.placement && (
          <div className="toast-placement text-[0.7rem] text-[var(--text-muted)] uppercase tracking-[0.18em]">
            {t.placement}
          </div>
        )}
      </div>
    </div>
  );
}
