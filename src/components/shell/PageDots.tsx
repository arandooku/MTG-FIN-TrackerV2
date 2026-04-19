import { motion, useReducedMotion } from 'framer-motion';

interface PageDotsProps {
  total: number;
  active: number;
  max?: number;
}

const DOT_INACTIVE_WIDTH = 8;
const DOT_ACTIVE_WIDTH = 24;
const DOT_HEIGHT = 6;

export function PageDots({ total, active, max = 12 }: PageDotsProps) {
  const count = Math.min(total, max);
  const indices = Array.from({ length: count }, (_, i) => i);
  const activeIdx =
    total <= max ? active - 1 : Math.round(((active - 1) / Math.max(1, total - 1)) * (count - 1));
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion
    ? { type: 'tween' as const, duration: 0.18 }
    : { type: 'spring' as const, stiffness: 380, damping: 30 };

  return (
    <div
      className="app-dots"
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px 0',
      }}
    >
      {indices.map((i) => {
        const isActive = i === activeIdx;
        return (
          <motion.span
            key={i}
            className={`app-dot ${isActive ? 'active' : ''}`}
            animate={{
              width: isActive ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_WIDTH,
              opacity: isActive ? 1 : 0.55,
            }}
            transition={transition}
            style={{
              height: DOT_HEIGHT,
              borderRadius: 999,
              display: 'inline-block',
              background: isActive
                ? 'linear-gradient(90deg, var(--app-gold), var(--app-gold-bright))'
                : 'transparent',
              border: isActive
                ? '1px solid var(--app-gold-bright)'
                : '1px solid rgba(212,168,74,0.55)',
              boxShadow: isActive
                ? '0 0 8px rgba(240,207,110,0.65), inset 0 1px 0 rgba(255,255,255,0.35)'
                : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
