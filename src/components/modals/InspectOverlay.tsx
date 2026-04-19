import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { Card as CardT } from '@/lib/schemas';
import { classifyFoil } from '@/lib/foil';
import { MTG_CARD_BACK, clamp, scryfallPng } from '@/lib/utils';
import { FoilOverlay } from '../FoilOverlay';

const SPRING_SMOOTH: Transition = { type: 'spring', stiffness: 260, damping: 26 };
const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 400, damping: 32 };

interface InspectOverlayProps {
  card: CardT | null;
  foilActive?: boolean;
  onClose: () => void;
}

export function InspectOverlay({ card, foilActive, onClose }: InspectOverlayProps) {
  const prefersReduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const foilRef = useRef<HTMLDivElement | null>(null);
  const shineRef = useRef<HTMLDivElement | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const rotRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  const apply = useCallback(() => {
    const el = cardRef.current;
    const shine = shineRef.current;
    const foil = foilRef.current;
    if (!el) return;
    const { x, y } = rotRef.current;
    el.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${(50 + y * 0.5).toFixed(
        1,
      )}% ${(50 - x * 0.5).toFixed(1)}%, rgba(255,255,255,0.22) 0%, transparent 60%)`;
    }
    if (foil && foilActive) {
      foil.style.setProperty('--fx-mx', (50 + y * 0.6).toFixed(1) + '%');
      foil.style.setProperty('--fx-my', (50 - x * 0.6).toFixed(1) + '%');
      foil.style.setProperty('--fx-bx', (50 + y * 0.8).toFixed(1) + '%');
      foil.style.setProperty('--fx-by', (50 - x * 0.8).toFixed(1) + '%');
    }
  }, [foilActive]);

  useEffect(() => {
    if (!card) return;
    rotRef.current = { x: 0, y: 0 };
    setFlipped(false);
    setHintVisible(true);
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    const t = window.setTimeout(() => setHintVisible(false), 3500);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [card?.collector_number]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, onClose]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      rotRef.current.y += dx * 0.5;
      rotRef.current.x = clamp(rotRef.current.x - dy * 0.5, -60, 60);
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
      apply();
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [apply]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current.active = true;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    setHintVisible(false);
    const el = cardRef.current;
    if (el) el.style.transition = 'none';
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    dragRef.current.active = true;
    dragRef.current.x = e.touches[0].clientX;
    dragRef.current.y = e.touches[0].clientY;
    setHintVisible(false);
    const el = cardRef.current;
    if (el) el.style.transition = 'none';
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.active || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragRef.current.x;
    const dy = e.touches[0].clientY - dragRef.current.y;
    rotRef.current.y += dx * 0.5;
    rotRef.current.x = clamp(rotRef.current.x - dy * 0.5, -60, 60);
    dragRef.current.x = e.touches[0].clientX;
    dragRef.current.y = e.touches[0].clientY;
    apply();
  };
  const onTouchEnd = () => {
    dragRef.current.active = false;
  };

  const handleReset = () => {
    rotRef.current = { x: 0, y: 0 };
    setFlipped(false);
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.5s ease';
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
      window.setTimeout(() => {
        if (el) el.style.transition = 'none';
      }, 500);
    }
  };
  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    rotRef.current.y = next ? 180 : 0;
    rotRef.current.x = 0;
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.6s ease';
      el.style.transform = `rotateX(0deg) rotateY(${next ? 180 : 0}deg)`;
      window.setTimeout(() => {
        if (el) el.style.transition = 'none';
      }, 600);
    }
  };

  const src = card ? scryfallPng(card.image_normal || card.image_small) : '';
  const back = card && card.image_back_normal ? scryfallPng(card.image_back_normal) : MTG_CARD_BACK;
  const variant = card ? classifyFoil(card) : 'none';
  const showFoil = !!card && !!foilActive && variant !== 'none';

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key="inspect-overlay"
          className="inspect-overlay visible"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{
            opacity: 1,
            backdropFilter: prefersReduced ? 'blur(0px)' : 'blur(20px)',
            transition: { duration: prefersReduced ? 0.15 : 0.3, ease: 'easeOut' },
          }}
          exit={{
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
          }}
          style={{
            willChange: 'opacity, backdrop-filter',
            background: 'rgba(5,6,10,0.88)',
          }}
        >
          <motion.div
            ref={wrapRef}
            className="inspect-card-wrap"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            layoutId={`card-zoom-${card.collector_number}`}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 24 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: prefersReduced ? { duration: 0.15 } : SPRING_SMOOTH,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 12,
              transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            {hintVisible && (
              <motion.div
                className="inspect-hint"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.15, ...SPRING_SNAPPY } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                style={{ position: 'absolute', bottom: 'unset', top: '-2.5rem', left: '50%', transform: 'translateX(-50%)' }}
              >
                <span
                  className="inspect-hint-text text-display"
                  style={{
                    fontFamily: 'var(--font-display, Cinzel, serif)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-gold, #E8C77A)',
                    textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                  }}
                >
                  Drag to Rotate · ESC to Close
                </span>
              </motion.div>
            )}
            <div ref={cardRef} className="inspect-3d" data-variant={variant}>
              <img src={src} alt={card.name} draggable={false} />
              <div ref={shineRef} className="inspect-shine" />
              {showFoil && (
                <FoilOverlay
                  ref={foilRef}
                  card={card}
                  patternWidth={520}
                  patternHeight={728}
                />
              )}
              <div className="inspect-card-back">
                <img src={back} alt="back" draggable={false} />
              </div>
            </div>
          </motion.div>
          <motion.div
            className="inspect-controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: prefersReduced ? { duration: 0.15 } : { ...SPRING_SNAPPY, delay: 0.08 },
            }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
            style={{
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              left: 'auto',
              bottom: 'auto',
              display: 'flex',
              gap: '0.5rem',
              zIndex: 60,
            }}
          >
            <CircularGlassButton onClick={handleReset} title="Reset rotation" label="Reset">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </CircularGlassButton>
            <CircularGlassButton onClick={handleFlip} title="Flip card" label="Flip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </CircularGlassButton>
            <CircularGlassButton onClick={onClose} title="Close" label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CircularGlassButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CircularGlassButtonProps {
  onClick: () => void;
  title: string;
  label: string;
  children: ReactNode;
}

/**
 * Mythic Obsidian inspect-overlay control. Glass circular shell, gold icon
 * stroke, crystal-cyan focus ring. Used standalone — visual sibling of the
 * shadcn button but specialised for the full-bleed inspect surface.
 */
function CircularGlassButton({ onClick, title, label, children }: CircularGlassButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={
        'glass-raised grid h-11 w-11 place-items-center rounded-full backdrop-blur-xl ' +
        'border border-[color:var(--border-soft,rgba(255,255,255,0.10))] ' +
        'transition-[border-color,box-shadow,transform] duration-200 ' +
        'hover:border-[color:var(--accent-crystal,#7FD8E4)] active:scale-95 ' +
        'focus-visible:outline-none focus-visible:ring-2 ' +
        'focus-visible:ring-[color:var(--accent-crystal,#7FD8E4)]'
      }
      style={{
        background: 'rgba(40,42,58,0.80)',
        color: 'var(--accent-gold, #E8C77A)',
        boxShadow:
          '0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </button>
  );
}
