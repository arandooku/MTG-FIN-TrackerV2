import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { Card } from '@/lib/schemas';
import { classifyFoil } from '@/lib/foil';
import { generateSurgeFoilURL, seedFromCollectorNumber } from '@/lib/surgeFoil';

interface FoilOverlayProps {
  card: Card;
  /** Width hint for the surge-foil canvas pattern. Bigger = crisper on modal. */
  patternWidth?: number;
  /** Height hint for the surge-foil canvas pattern. */
  patternHeight?: number;
  /** Opacity multiplier, 0..1. Defaults to 1. */
  intensity?: number;
  className?: string;
}

/**
 * Unified foil effect layer. Consumed by BinderSlot, CardModal, InspectOverlay,
 * CardThumb, PackModal, SearchModal. Returns null for non-foil cards.
 * Parents may set CSS vars on the forwarded ref for pointer tracking:
 *   --fx-mx / --fx-my  (pointer center, 0–100%)
 *   --fx-bx / --fx-by  (sweep offset, 0–100%)
 */
export const FoilOverlay = forwardRef<HTMLDivElement, FoilOverlayProps>(
  function FoilOverlay(
    { card, patternWidth = 260, patternHeight = 364, intensity = 1, className = '' },
    ref,
  ) {
    const inner = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => inner.current as HTMLDivElement, []);
    const [paused, setPaused] = useState(false);
    const variant = classifyFoil(card);

    useEffect(() => {
      const el = inner.current;
      if (!el) return;
      if (variant === 'surge-foil') {
        const url = generateSurgeFoilURL(
          patternWidth,
          patternHeight,
          seedFromCollectorNumber(card.collector_number),
        );
        if (url) el.style.setProperty('--fx-pattern', `url(${url})`);
        else el.style.removeProperty('--fx-pattern');
      } else {
        el.style.removeProperty('--fx-pattern');
      }
    }, [variant, card.collector_number, patternWidth, patternHeight]);

    useEffect(() => {
      const el = inner.current;
      if (!el || typeof IntersectionObserver === 'undefined') return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) setPaused(!e.isIntersecting);
        },
        { threshold: 0.01 },
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);

    if (variant === 'none') return null;

    const style = { '--fx-intensity': intensity } as CSSProperties;

    return (
      <div
        ref={inner}
        className={`foil-fx ${className}`.trim()}
        data-variant={variant}
        data-paused={paused ? 'true' : undefined}
        style={style}
      />
    );
  },
);
