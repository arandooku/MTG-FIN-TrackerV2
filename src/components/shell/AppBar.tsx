import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface AppBarProps {
  title: string;
  back?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  showCrystals?: boolean;
}

export function AppBar({ title, back, left, right, showCrystals = true }: AppBarProps) {
  const reduceMotion = useReducedMotion();
  const titleInitial = reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 };
  const titleAnimate = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const titleExit = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 };
  const titleTransition = reduceMotion
    ? { type: 'tween' as const, duration: 0.18 }
    : { type: 'spring' as const, stiffness: 380, damping: 30 };

  return (
    <header
      className="app-appbar sticky top-0 z-40"
      style={{
        height: 'clamp(56px, 7vw, 64px)',
        padding: '0 16px',
        background:
          'linear-gradient(180deg, rgba(13,22,40,0.78) 0%, rgba(13,22,40,0.55) 100%)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderBottom: '1px solid rgba(212,168,74,0.22)',
        boxShadow:
          'inset 0 1px 0 rgba(240,207,110,0.18), 0 1px 0 rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-1">
        {back ? (
          <button type="button" className="app-icon-btn" onClick={back} aria-label="Back">
            <ChevronLeft size={18} />
          </button>
        ) : (
          left
        )}
      </div>
      <div className="app-title-wrap">
        <AnimatePresence mode="wait" initial={false}>
          {title && (
            <motion.div
              key={title}
              initial={titleInitial}
              animate={titleAnimate}
              exit={titleExit}
              transition={titleTransition}
              className="flex items-center gap-2"
            >
              {showCrystals && <span className="app-crystal sm" aria-hidden />}
              <span
                className="app-title"
                style={{
                  fontFamily: 'var(--app-display)',
                  fontVariantCaps: 'small-caps',
                  letterSpacing: '0.32em',
                  fontSize: '13px',
                }}
              >
                {title}
              </span>
              {showCrystals && <span className="app-crystal sm" aria-hidden />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-1">{right}</div>
      {/* gold ornate hairline beneath bar */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -1,
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(212,168,74,0.55) 20%, rgba(240,207,110,0.85) 50%, rgba(212,168,74,0.55) 80%, transparent)',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />
    </header>
  );
}
